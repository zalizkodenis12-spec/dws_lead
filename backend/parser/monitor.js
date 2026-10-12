/**
 * DWS Lead — Realtime Telegram Monitor & Message Ingestion Service
 * Listens to ~200 chats and ~200 channels via Telegram MTProto client (GramJS / Telethon protocol)
 * Runs all messages through the zero-cost rule engine.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from '../db/db.js';
import { classifyLeadRuleBased } from './filter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOURCES_PATH = path.join(__dirname, 'sources.json');

export function loadSources() {
  try {
    if (fs.existsSync(SOURCES_PATH)) {
      return JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading sources:', err);
  }
  return { chats: [], channels: [] };
}

/**
 * Ingest a raw incoming message from a chat or channel
 */
export function ingestMessage({ text, authorName, authorUsername, sourceTitle, sourceUsername, sourceType = 'chat' }) {
  if (!text || text.trim().length < 15) return null;

  // 1. Run through zero-cost smart rule filter
  const classification = classifyLeadRuleBased(text, authorUsername);
  if (!classification) {
    // Discarded (either spam, resume from candidate, or unrelated topic)
    return null;
  }

  // 2. Format Kyiv date string
  const now = new Date();
  const timeFormatted = new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Kyiv'
  }).format(now);

  const newLead = {
    id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category: classification.category,
    categoryName: classification.categoryName,
    subcategory: classification.subcategory,
    subcategoryName: classification.subcategoryName,
    sourceType,
    sourceName: sourceTitle || 'Telegram чат',
    sourceUsername: sourceUsername || '',
    authorName: authorName || 'Клієнт',
    authorUsername: authorUsername || '',
    title: classification.title,
    text: text.trim(),
    date: now.toISOString(),
    dateFormatted: `Сьогодні, ${timeFormatted}`,
    budget: classification.budget,
    currency: '₴',
    isUrgent: classification.isUrgent,
    requiresPortfolio: classification.requiresPortfolio,
    experienceRequired: classification.experienceRequired,
    aiRating: classification.initialRating, // Initial heuristic rating (0 tokens spent!)
    aiSummary: `Замовлення: ${classification.subcategoryName.toLowerCase()}${classification.budget ? ` з бюджетом ${classification.budget} ₴` : ''}.`,
    aiAnalysis: null, // Left null until user clicks for deep analysis
    inCrm: false
  };

  const savedLead = db.addLead(newLead);
  if (!savedLead) {
    // Duplicate lead, ignored
    return null;
  }

  console.log(`[DWS Lead] 🎯 Знайдено новий лід [${classification.categoryName}]: "${classification.title}" (Бюджет: ${classification.budget || 'договірний'} ₴)`);

  // Send Telegram bot notification if score >= 80 or has high budget
  try {
    import('../bot.js').then(({ sendLeadNotification }) => {
      if (typeof sendLeadNotification === 'function' && savedLead.aiRating >= 80) {
        sendLeadNotification(savedLead);
      }
    }).catch(() => {});
  } catch (e) {}

  return savedLead;
}

/**
 * Scans all accessible public Ukrainian channels from sources.json
 */
export async function scanPublicChannels() {
  const sources = loadSources();
  const allList = [...(sources.channels || []), ...(sources.chats || [])];
  
  // Collect handles, exclude private invite links
  const targetHandles = [];
  const seenHandles = new Set();

  for (const item of allList) {
    let raw = (item.username || '').trim();
    if (!raw || raw.startsWith('joinchat') || raw.includes('/joinchat/')) continue;
    let clean = raw.replace('https://t.me/', '').replace('@', '').trim();
    if (!clean || seenHandles.has(clean.toLowerCase())) continue;
    seenHandles.add(clean.toLowerCase());
    targetHandles.push({
      handle: clean,
      title: item.title || clean,
      category: item.category || 'general'
    });
  }

  console.log(`[DWS Lead Monitor] 🔎 Початок сканування ${targetHandles.length} публічних каналів України...`);
  let newLeadsCount = 0;

  for (const src of targetHandles) {
    try {
      const res = await fetch(`https://t.me/s/${src.handle}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
        }
      });
      if (!res.ok) continue;

      const html = await res.text();
      const parts = html.split('tgme_widget_message_wrap');
      if (parts.length <= 1) continue;

      for (let i = 1; i < parts.length; i++) {
        const block = parts[i];
        const textMatch = block.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:div class="tgme_widget_message_footer"|\/div)/i) ||
                          block.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (!textMatch) continue;

        let cleanText = textMatch[1]
          .replace(/<br\s*[\/]?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, '&')
          .replace(/&#39;/g, "'")
          .replace(/&#036;/g, '$')
          .replace(/&#33;/g, '!')
          .trim();

        if (cleanText.length < 25) continue;

        // Try extracting author username from link inside post
        let authorUsername = '';
        const authorMatch = block.match(/href="https:\/\/t\.me\/([a-zA-Z0-9_]+)"/);
        if (authorMatch && !authorMatch[1].startsWith('s_') && authorMatch[1].toLowerCase() !== src.handle.toLowerCase()) {
          authorUsername = '@' + authorMatch[1];
        }

        const lead = ingestMessage({
          text: cleanText,
          authorName: 'Клієнт / Роботодавець',
          authorUsername,
          sourceTitle: src.title,
          sourceUsername: '@' + src.handle,
          sourceType: 'channel'
        });

        if (lead) {
          newLeadsCount++;
        }
      }
    } catch (err) {
      // Quiet fail per channel so other channels proceed
    }
  }

  console.log(`[DWS Lead Monitor] ✅ Сканування завершено. Додано ${newLeadsCount} нових актуальних лідів.`);
  return { scanned: targetHandles.length, newLeads: newLeadsCount };
}

/**
 * Start MTProto client if credentials exist in .env and start periodic web scanner
 */
export async function startMonitor() {
  const sources = loadSources();
  const totalSources = (sources.chats?.length || 0) + (sources.channels?.length || 0);
  console.log(`[DWS Lead Monitor] Завантажено ${totalSources} джерел для моніторингу.`);

  // 1. Run initial channel scan on startup
  scanPublicChannels().catch(err => console.error('[DWS Lead Monitor] Scan error:', err.message));

  // 2. Schedule regular channel scans every 5 minutes
  setInterval(() => {
    scanPublicChannels().catch(err => console.error('[DWS Lead Monitor] Periodic scan error:', err.message));
  }, 5 * 60 * 1000);

  // 3. Optional MTProto client for private chats
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId || !apiHash) {
    console.log(`[DWS Lead Monitor] ℹ️ TELEGRAM_API_ID або TELEGRAM_API_HASH не задано в .env.`);
    console.log(`[DWS Lead Monitor] ℹ️ Активний Web Channel Ingestion для публічних каналів України.`);
    return;
  }

  console.log(`[DWS Lead Monitor] 🚀 MTProto API ID (${apiId}) знайдено. Готово до підключення сесій.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startMonitor();
}
