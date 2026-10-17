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
import { scanAllExchanges } from './exchanges.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SOURCES_PATH = path.join(__dirname, 'sources.json');
const IS_SERVERLESS = !!process.env.VERCEL;
const WRITABLE_SOURCES_PATH = IS_SERVERLESS ? '/tmp/dws-sources.json' : SOURCES_PATH;

export function loadSources() {
  try {
    if (IS_SERVERLESS && fs.existsSync(WRITABLE_SOURCES_PATH)) {
      return JSON.parse(fs.readFileSync(WRITABLE_SOURCES_PATH, 'utf-8'));
    }
    if (fs.existsSync(SOURCES_PATH)) {
      return JSON.parse(fs.readFileSync(SOURCES_PATH, 'utf-8'));
    }
  } catch (err) {
    console.error('Error loading sources:', err);
  }
  return { chats: [], channels: [] };
}

export function saveSourcesToFile(sourcesData) {
  try {
    fs.writeFileSync(WRITABLE_SOURCES_PATH, JSON.stringify(sourcesData, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving sources:', err);
    return false;
  }
}

export function cleanTelegramPostText(text) {
  if (!text) return '';
  let lines = text.split(/\r?\n/).map(l => l.trimEnd());
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    if (!last) {
      lines.pop();
      continue;
    }
    const isReactionLine = /^[\p{Emoji}\s\d❤👍🔥]+$/u.test(last) && !/[a-zA-Zа-яА-ЯіїєґІЇЄҐ]/.test(last);
    const isViewLine = /^(?:[\d.,]+[KkMm]?\s*views|edited|\d{1,2}:\d{2}|👁|\s)+$/iu.test(last);
    const isReactionsAndViews = /^(?:[\p{Emoji}\s\d❤👍🔥]+)?\s*[\d.,]+[KkMm]?\s*views.*$/iu.test(last);
    if (isReactionLine || isViewLine || isReactionsAndViews) {
      lines.pop();
    } else {
      break;
    }
  }
  return lines.join('\n').trim();
}

/**
 * Ingest a raw incoming message from a chat or channel
 */
export function ingestMessage({ text, authorName, authorUsername, sourceTitle, sourceUsername, sourceType = 'chat' }) {
  const cleanedText = cleanTelegramPostText(text);
  if (!cleanedText || cleanedText.length < 15) return null;

  // Reject digests, articles, or candidate resumes indicated by "‣"
  if (/‣|актуальні вакансії минулого|діліться з друзями, які в пошуку|10 сервісів для підвищення/i.test(cleanedText)) {
    return null;
  }

  // Fallback to in-text username or source channel/chat username so lead is never lost
  if (!authorUsername || !authorUsername.startsWith('@') || authorUsername.length < 4) {
    const extracted = extractContactFromText(cleanedText);
    if (extracted) {
      authorUsername = extracted;
    } else if (sourceUsername) {
      authorUsername = sourceUsername.startsWith('@') ? sourceUsername : '@' + sourceUsername;
    }
  }
  if (!authorUsername || authorUsername.length < 3) {
    return null;
  }

  // 1. Run through zero-cost smart rule filter
  const classification = classifyLeadRuleBased(cleanedText, authorUsername);
  if (!classification) {
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
    authorName: authorName || 'Замовник',
    authorUsername: authorUsername,
    title: classification.title,
    text: cleanedText,
    date: now.toISOString(),
    dateFormatted: `Сьогодні, ${timeFormatted}`,
    budget: classification.budget,
    currency: '₴',
    country: classification.country || 'Україна',
    isUrgent: classification.isUrgent,
    requiresPortfolio: classification.requiresPortfolio,
    experienceRequired: classification.experienceRequired,
    aiRating: classification.initialRating,
    aiSummary: `Замовлення: ${classification.subcategoryName.toLowerCase()}${classification.budget ? ` з бюджетом ${classification.budget} ₴` : ''}.`,
    aiAnalysis: null,
    inCrm: false
  };

  const savedLead = db.addLead(newLead);
  if (!savedLead) {
    return null;
  }

  console.log(`[DWS Lead] 🎯 Знайдено новий лід [${classification.categoryName}]: "${classification.title}" -> ${authorUsername}`);

  return savedLead;
}

const IGNORED_AUTHOR_HANDLES = new Set([
  'share', 'joinchat', 'iv', 'addstickers', 'proxy', 'telegram', 'icloud', 'gmail', 'ukr',
  'rethink', 'manager_jecontact', 'channel', 'admin', 'support', 'bot', 'feedback', 'comments',
  'contact', 'job', 'jobs', 'work', 'info', 'news', 'help', 'app', 'android', 'ios'
]);

export function extractAuthorHandle(cleanText, rawBodyHtml = '', sourceHandle = '') {
  const srcLower = (sourceHandle || '').toLowerCase().replace('@', '');

  // 1. Explicit contact keywords in text (e.g. "Контакт: @...", "Пишіть @...", "HR: @...", "Резюме: @...")
  const contactPattern = /(?:контакт[иа]?|пиш[іі]ть|пишите|зв['’]?язок|відгук(?:нутися)?|отклик(?:нуться)?|резюме|відправляйте|надсилайте|присылайте|hr|recruiter|pm|лічка|лс|пп|tg|telegram|телеграм)[\s:—–-]+@?([a-zA-Z0-9_]{4,32})\b/gi;
  let match;
  while ((match = contactPattern.exec(cleanText)) !== null) {
    const handle = match[1];
    const hLower = handle.toLowerCase();
    if (!hLower.endsWith('bot') && hLower !== srcLower && !IGNORED_AUTHOR_HANDLES.has(hLower)) {
      return '@' + handle;
    }
  }

  // 2. All @mentions in text and t.me/ links in text and html
  const mentions = [...cleanText.matchAll(/(?:^|[\s(,:;>«"'])@([a-zA-Z0-9_]{4,32})\b/g)].map(x => x[1]);
  const textLinks = [...cleanText.matchAll(/(?:https?:\/\/)?t\.me\/([a-zA-Z0-9_]{4,32})/g)].map(x => x[1]);
  const htmlLinks = [...(rawBodyHtml || '').matchAll(/href="https:\/\/t\.me\/([a-zA-Z0-9_]{4,32})"/g)].map(x => x[1]);
  const all = [...mentions, ...textLinks, ...htmlLinks];

  // Pick candidates from bottom to top (contacts are typically at the end of vacancy posts)
  for (let i = all.length - 1; i >= 0; i--) {
    const candidate = all[i];
    const cLower = candidate.toLowerCase();
    if (candidate.startsWith('s_') || cLower.endsWith('bot') || cLower === srcLower || IGNORED_AUTHOR_HANDLES.has(cLower)) {
      continue;
    }
    return '@' + candidate;
  }

  // 3. If no personal contact found, return empty string (do not impersonate the source channel)
  return '';
}

/**
 * Scans all accessible public Ukrainian broadcast channels from sources.json
 */
export async function scanPublicChannels() {
  const sources = loadSources();
  // Filter for broadcast channels (t.me/s/ works exclusively for channels, not discussion groups)
  const channelList = [
    ...(sources.channels || []),
    ...(sources.chats || []).filter(c => c.type === 'channel')
  ];
  if (channelList.length === 0) {
    channelList.push(
      { username: '@workplaceinukraine', title: 'Work Place UA', category: 'general' },
      { username: '@aplaywork', title: 'A-Play Work UA', category: 'general' },
      { username: '@jecontact', title: 'Je Contact IT & Digital', category: 'development' },
      { username: '@adgoodashell', title: 'Ad Good as Hell', category: 'marketing' },
      { username: '@top_vacansii', title: 'Топ Вакансії UA', category: 'general' },
      { username: '@work_in_ukraine_golovne', title: 'Робота в Україні', category: 'general' },
      { username: '@jobzy', title: 'Jobzy UA', category: 'general' },
      { username: '@freelance_projects', title: 'Фріланс проєкти UA', category: 'development' },
      { username: '@remote_jobs_ua', title: 'Віддалена робота UA', category: 'general' },
      { username: '@ua_work', title: 'Робота UA', category: 'general' },
      { username: '@it_jobs_ukraine', title: 'IT Вакансії Україна', category: 'development' },
      { username: '@robota_viddaleno', title: 'Робота віддалено', category: 'general' },
      { username: '@remote_work_ukraine', title: 'Remote Work Ukraine', category: 'general' },
      { username: '@it_work_ua', title: 'IT Робота Україна', category: 'development' },
      { username: '@smm_work_ua', title: 'SMM Вакансії та Маркетинг', category: 'marketing' },
      { username: '@freelance_hub_ua', title: 'Freelance Hub UA', category: 'development' },
      { username: '@robota_v_it', title: 'Робота в IT & Digital', category: 'development' },
      { username: '@zaichenkoteam', title: 'Zaichenko Team', category: 'general' },
      { username: '@lobbyx', title: 'Lobby X', category: 'general' },
      { username: '@happymonday', title: 'Happy Monday', category: 'general' },
      { username: '@kievy_rabota', title: 'Київ Робота', category: 'general' },
      { username: '@you_can_know_more', title: 'Ти можеш більше', category: 'general' },
      { username: '@remote_it_ua', title: 'Remote IT Ukraine', category: 'development' },
      { username: '@digital_work_ua', title: 'Digital Work UA', category: 'marketing' }
    );
  }

  const targetHandles = [];
  const seenHandles = new Set();

  for (const item of channelList) {
    let raw = (typeof item === 'string' ? item : (item.username || '')).trim();
    if (!raw || raw.startsWith('joinchat') || raw.includes('/joinchat/')) continue;
    let clean = raw.replace('https://t.me/', '').replace('@', '').split('/')[0].trim();
    if (!clean || seenHandles.has(clean.toLowerCase())) continue;
    seenHandles.add(clean.toLowerCase());
    targetHandles.push({
      handle: clean,
      title: (typeof item === 'object' && (item.title || item.name)) ? (item.title || item.name) : clean,
      category: (typeof item === 'object' && item.category) ? item.category : 'general'
    });
  }

  console.log(`[DWS Lead Monitor] 🔎 Початок сканування ${targetHandles.length} активних каналів України...`);
  let newLeadsCount = 0;

  // Process channels in small concurrent batches for speed without getting rate-limited
  const BATCH_SIZE = 4;
  for (let i = 0; i < targetHandles.length; i += BATCH_SIZE) {
    const batch = targetHandles.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(async (src) => {
      try {
        const res = await fetch(`https://t.me/s/${src.handle}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
          },
          signal: AbortSignal.timeout(8000)
        });
        if (!res.ok) return;

        const html = await res.text();
        const parts = html.split('tgme_widget_message_wrap');
        if (parts.length <= 1) return;

        for (let pIdx = 1; pIdx < parts.length; pIdx++) {
          const block = parts[pIdx];
          const textMatch = block.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:div class="tgme_widget_message_footer"|\/div)/i) ||
                            block.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (!textMatch) continue;

          const rawBodyHtml = textMatch[1];
          let cleanText = rawBodyHtml
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&#036;/g, '$')
            .replace(/&#33;/g, '!')
            .replace(/&nbsp;/g, ' ')
            .trim();

          cleanText = cleanTelegramPostText(cleanText);
          if (cleanText.length < 25) continue;

          const authorUsername = extractAuthorHandle(cleanText, rawBodyHtml, src.handle);
          if (!authorUsername) continue;

          const lead = ingestMessage({
            text: cleanText,
            authorName: authorUsername.replace('@', ''),
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
        // Quiet fail per channel so scan continues smoothly
      }
    }));
  }

  // Also scan freelance exchanges (Freelancehunt, Djinni, Freelance.ua, Kabanchik)
  const telegramNew = newLeadsCount;
  let exchangeResult = null;
  try {
    exchangeResult = await scanAllExchanges();
    if (exchangeResult?.newLeads) {
      newLeadsCount += exchangeResult.newLeads;
    }
  } catch (err) {
    console.error('[DWS Lead Monitor] Exchange scan error:', err.message);
  }

  console.log(`[DWS Lead Monitor] ✅ Повне сканування завершено (Телеграм + Біржі). Додано ${newLeadsCount} нових актуальних лідів.`);
  if (newLeadsCount > 0) {
    autoSyncToCloud();
  }
  return {
    scanned: targetHandles.length,
    newLeads: newLeadsCount,
    telegramNew,
    exchanges: exchangeResult?.bySource || {}
  };
}

let syncTimer = null;
/**
 * Automatically debounced push of new leads to GitHub / Vercel
 */
export async function autoSyncToCloud() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(async () => {
    try {
      const projectRoot = path.join(__dirname, '..', '..');
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout: status } = await execAsync('git status --porcelain', { cwd: projectRoot });
      if (status.includes('leads-data.json') || status.includes('database.json') || status.includes('app.js')) {
        console.log('[DWS Lead Monitor] 🔄 Виявлено нові ліди! Автоматичний пуш на Vercel...');
        await execAsync('git add miniapp/leads-data.json backend/db/database.json', { cwd: projectRoot });
        await execAsync('git commit -m "auto: sync live leads from userbot and exchanges" && git push origin main', { cwd: projectRoot });
        console.log('[DWS Lead Monitor] 🚀 Нові ліди успішно задеплоєно на Vercel!');
      }
    } catch (err) {
      console.warn('[DWS Lead Monitor] Авто-деплой на Vercel:', err.message);
    }
  }, 12000);
}

let isSyncingSuperchats = false;

/**
 * Auto-join all target superchats and read recent messages in safe batches
 */
async function syncAndJoinSuperchats(client, sources) {
  if (isSyncingSuperchats) return;
  isSyncingSuperchats = true;
  try {
    const { Api } = await import('telegram');
    const dialogs = await client.getDialogs({ limit: 500 });
    const joinedUsernames = new Set();
    for (const d of dialogs) {
      if (d.entity?.username) joinedUsernames.add(d.entity.username.toLowerCase());
    }

    console.log(`[DWS Lead Monitor] 👥 Акаунт зараз у ${joinedUsernames.size} діалогах Telegram.`);

    // Reload sources dynamically to include any newly added chats from other countries
    const currentSources = loadSources();
    const chatsToProcess = (currentSources.chats || []).filter(c => {
      const clean = (c.username || '').replace('@', '').replace('https://t.me/', '').split('/')[0].trim();
      return clean && c.type !== 'channel' && !clean.startsWith('joinchat') && !clean.includes('+');
    });

    const unjoined = chatsToProcess.filter(c => {
      const clean = c.username.replace('@', '').replace('https://t.me/', '').split('/')[0].trim();
      return !joinedUsernames.has(clean.toLowerCase());
    });

    console.log(`[DWS Lead Monitor] 📋 Залишилося приєднати: ${unjoined.length} із ${chatsToProcess.length} суперчатів.`);

    if (unjoined.length === 0) {
      console.log('[DWS Lead Monitor] 🎉 Всі цільові суперчати успішно підключені!');
      isSyncingSuperchats = false;
      return;
    }

    let joinedCount = 0;
    let historyLeadsCount = 0;
    // Process in batches of 15 chats per cycle to stay safe from Telegram anti-spam limits
    const BATCH_LIMIT = 15;

    for (const chatInfo of unjoined) {
      if (joinedCount >= BATCH_LIMIT) {
        console.log(`[DWS Lead Monitor] ⏸ Досягнуто безпечний ліміт пачки (${BATCH_LIMIT} чатів). Наступні чати підключаться через 8 хвилин.`);
        break;
      }

      const cleanHandle = chatInfo.username.replace('@', '').replace('https://t.me/', '').split('/')[0].trim();

      try {
        await client.invoke(new Api.channels.JoinChannel({ channel: cleanHandle }));
        joinedCount++;
        joinedUsernames.add(cleanHandle.toLowerCase());
        console.log(`[DWS Lead Monitor] ➕ [${joinedCount}/${BATCH_LIMIT}] Приєднано до суперчату: @${cleanHandle}`);

        // Read recent 15 messages from this newly joined chat
        try {
          const messages = await client.getMessages(cleanHandle, { limit: 15 });
          for (const msg of messages) {
            if (!msg || !msg.message) continue;
            const text = msg.message;
            const sender = await msg.getSender().catch(() => null);
            let authorUsername = sender?.username ? '@' + sender.username : '';
            if (!authorUsername) {
              authorUsername = extractAuthorHandle(text, '', cleanHandle);
            }
            if (!authorUsername && sender?.id) {
              authorUsername = `@tg_id_${sender.id}`;
            }
            const authorName = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ') || (authorUsername ? authorUsername.replace('@', '') : 'Замовник');

            const lead = ingestMessage({
              text,
              authorName,
              authorUsername,
              sourceTitle: chatInfo.title || cleanHandle,
              sourceUsername: '@' + cleanHandle,
              sourceType: 'chat'
            });
            if (lead) {
              historyLeadsCount++;
            }
          }
        } catch (msgErr) {
          // Quiet fail per chat
        }

        // Wait 3.5 seconds between joins to avoid Telegram flood limits
        await new Promise(r => setTimeout(r, 3500));
      } catch (joinErr) {
        const msg = joinErr.message || '';
        const waitMatch = msg.match(/(?:wait of (\d+) seconds|FLOOD_WAIT_(\d+))/i);
        if (waitMatch || joinErr.seconds) {
          const waitSec = joinErr.seconds || parseInt(waitMatch[1] || waitMatch[2], 10);
          console.warn(`[DWS Lead Monitor] ⏳ Telegram FloodWait: ${waitSec} секунд. Пауза перед наступною пачкою.`);
          break;
        } else {
          console.warn(`[DWS Lead Monitor] ⚠️ Не вдалося приєднатися до @${cleanHandle}: ${msg}`);
          // If private, invalid or requires admin invite approval, skip in future loops to avoid repeated errors
          if (msg.includes('CHANNEL_PRIVATE') || msg.includes('INVITE_REQUEST_SENT') || msg.includes('USERNAME_NOT_OCCUPIED')) {
            joinedUsernames.add(cleanHandle.toLowerCase());
          }
        }
      }
    }

    console.log(`[DWS Lead Monitor] ✅ Цикл підключення завершено: приєднано нових: ${joinedCount}, нових лідів з історії: ${historyLeadsCount}`);
    if (historyLeadsCount > 0) {
      autoSyncToCloud();
    }
  } catch (err) {
    console.error('[DWS Lead Monitor] Помилка синхронізації суперчатів:', err.message);
  } finally {
    isSyncingSuperchats = false;
  }
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

  // 2. Schedule regular channel scans every 1 hour (60 minutes)
  const ONE_HOUR_MS = 60 * 60 * 1000;
  setInterval(() => {
    scanPublicChannels().catch(err => console.error('[DWS Lead Monitor] Periodic scan error:', err.message));
  }, ONE_HOUR_MS);
  console.log('[DWS Lead Monitor] ⏰ Автоматичний парсинг активний: щогодини + миттєво з суперчатів + при натисканні "Оновити".');

  // 3. MTProto client for realtime supergroup & chat monitoring
  const apiId = process.env.TELEGRAM_API_ID;
  const apiHash = process.env.TELEGRAM_API_HASH;
  const sessionString = process.env.TELEGRAM_SESSION || process.env.TELEGRAM_SESSION_STRING;

  if (!apiId || !apiHash || !sessionString) {
    console.log(`[DWS Lead Monitor] ℹ️ TELEGRAM_SESSION не знайдено в .env.`);
    console.log(`[DWS Lead Monitor] ℹ️ Активний Web Channel Ingestion для 24 публічних каналів України.`);
    return;
  }

  try {
    console.log(`[DWS Lead Monitor] 🚀 Підключення MTProto Юзербота (API ID: ${apiId})...`);
    const { TelegramClient } = await import('telegram');
    const { StringSession } = await import('telegram/sessions/index.js');
    const { NewMessage } = await import('telegram/events/index.js');

    const client = new TelegramClient(new StringSession(sessionString), Number(apiId), apiHash, {
      connectionRetries: 5
    });

    await client.connect();
    console.log('[DWS Lead Monitor] ✅ MTProto Юзербот успішно підключено! Слухаємо всі суперчати в реальному часі.');

    // Auto-join superchats in initial batch
    syncAndJoinSuperchats(client, sources).catch(err => {
      console.error('[DWS Lead Monitor] Superchats sync error:', err.message);
    });

    // Schedule regular superchat joins every 8 minutes to safely join all remaining and newly added foreign chats
    const EIGHT_MIN_MS = 8 * 60 * 1000;
    setInterval(() => {
      syncAndJoinSuperchats(client, loadSources()).catch(err => {
        console.error('[DWS Lead Monitor] Periodic superchats sync error:', err.message);
      });
    }, EIGHT_MIN_MS);

    // Realtime message listener on all joined chats
    client.addEventHandler(async (event) => {
      try {
        const message = event.message;
        if (!message || !message.message) return;

        const chat = await message.getChat().catch(() => null);
        const sender = await message.getSender().catch(() => null);

        const text = message.message;
        const sourceUsername = chat?.username ? '@' + chat.username : '';
        let authorUsername = sender?.username ? '@' + sender.username : '';

        if (!authorUsername) {
          authorUsername = extractAuthorHandle(text, '', sourceUsername);
        }
        if (!authorUsername && sender?.id) {
          authorUsername = `@tg_id_${sender.id}`;
        }

        const authorName = [sender?.firstName, sender?.lastName].filter(Boolean).join(' ') || (authorUsername ? authorUsername.replace('@', '') : 'Замовник');
        const sourceTitle = chat?.title || 'Telegram суперчат';

        const lead = ingestMessage({
          text,
          authorName,
          authorUsername,
          sourceTitle,
          sourceUsername,
          sourceType: 'chat'
        });

        if (lead) {
          console.log(`[DWS Lead] ⚡️ Новий лід з суперчату: "${lead.title}" (${authorUsername})`);
          autoSyncToCloud();
        }
      } catch (err) {
        // Quiet fail on malformed message events
      }
    }, new NewMessage({}));
  } catch (err) {
    console.error('[DWS Lead Monitor] ❌ Помилка запуску MTProto юзербота:', err.message);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  startMonitor();
}
