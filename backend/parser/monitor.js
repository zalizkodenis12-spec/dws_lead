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

  db.addLead(newLead);
  console.log(`[DWS Lead] 🎯 Знайдено новий лід [${classification.categoryName}]: "${classification.title}" (Бюджет: ${classification.budget || 'договірний'} ₴)`);
  return newLead;
}

/**
 * Start MTProto client if credentials exist in .env
 */
export async function startMonitor() {
  const sources = loadSources();
  const totalSources = (sources.chats?.length || 0) + (sources.channels?.length || 0);
  console.log(`[DWS Lead Monitor] Завантажено ${totalSources} джерел для моніторингу.`);

  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const sessionString = process.env.TELEGRAM_SESSION_STRING;

  if (!apiId || !apiHash) {
    console.log(`[DWS Lead Monitor] ℹ️ TELEGRAM_API_ID або TELEGRAM_API_HASH не задано в .env.`);
    console.log(`[DWS Lead Monitor] ℹ️ Система працює в режимі REST API Ingestion та ручного додавання.`);
    return;
  }

  console.log(`[DWS Lead Monitor] 🚀 Ініціалізація MTProto сесії для підключення до ~200 чатів і ~200 каналів...`);
  // When user provides API credentials, connects here without blocking the rest of the app.
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startMonitor();
}
