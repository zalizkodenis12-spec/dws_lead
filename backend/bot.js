/**
 * DWS Lead — Telegram Bot Service
 * Opens Telegram Mini App via Menu Button and Inline Buttons.
 * Sends alerts for high-value leads.
 */

import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || '8953225581:AAG7lpvh6JHCbyMKfsz4qEucd_7qqgh6koM';
const APP_URL = process.env.TELEGRAM_APP_URL || process.env.WEBAPP_URL || 'https://dwslead-miniapp.vercel.app';
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID || '5278970111';

if (!TOKEN) {
  console.log('[DWS Lead Bot] ⚠️ TELEGRAM_BOT_TOKEN не задано в .env.');
  console.log('[DWS Lead Bot] Будь ласка, вкажіть токен у файлі .env для запуску Telegram бота.');
}

async function tgRequest(method, payload = {}, timeoutMs = 35000) {
  if (!TOKEN) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);
    return await res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      return null;
    }
    if (method !== 'getUpdates') {
      console.warn(`[DWS Lead Bot] Помилка Telegram API (${method}):`, err.message);
    }
    return null;
  }
}

/**
 * Configure the permanent WebApp Menu Button in Telegram
 */
export async function setupMenuButton() {
  if (!TOKEN) return;
  // Telegram WebApps require https — never overwrite the production button with localhost
  if (!/^https:\/\//i.test(APP_URL)) return;
  const res = await tgRequest('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: 'Відкрити DWSlead',
      web_app: { url: APP_URL }
    }
  });
  if (res && res.ok) {
    console.log('[DWS Lead Bot] ✅ Меню-кнопку Mini App успішно налаштовано в Telegram!');
  }
}

import { db } from './db/db.js';

const subscribedChats = new Set();
if (ADMIN_CHAT_ID) subscribedChats.add(String(ADMIN_CHAT_ID));

/**
 * Individual lead alerts are disabled — only daily summary at 23:00 is sent.
 */
export async function sendLeadNotification() {
  return;
}

/**
 * Send daily summary of collected leads at 23:00 Kyiv time
 */
export async function sendDailyLeadsSummary() {
  if (!TOKEN || subscribedChats.size === 0) return;

  const allLeads = db.getLeads() || [];
  const nowKyivDate = new Intl.DateTimeFormat('uk-UA', {
    timeZone: 'Europe/Kyiv',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  const todayLeads = allLeads.filter(l => {
    if (!l.date) return true;
    const dStr = new Intl.DateTimeFormat('uk-UA', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(l.date));
    return dStr === nowKyivDate;
  });

  const count = todayLeads.length > 0 ? todayLeads.length : allLeads.length;

  const text = `📊 <b>Підсумок дня від DWS Lead</b>\n\n` +
    `Сьогодні прийшло та відібрано <b>${count}</b> актуальних лідів.\n\n` +
    `Натисніть кнопку нижче, щоб переглянути всі заявки 👇`;

  for (const chatId of subscribedChats) {
    await tgRequest('sendMessage', {
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Відкрити DWSlead', web_app: { url: APP_URL } }
          ]
        ]
      }
    });
  }
}

let lastDailySummaryDate = '';
function startDailySummaryScheduler() {
  setInterval(() => {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Kyiv',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(now);

    const map = {};
    for (const p of parts) map[p.type] = p.value;
    const dateKey = `${map.year}-${map.month}-${map.day}`;
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);

    if (hour === 23 && minute === 0 && lastDailySummaryDate !== dateKey) {
      lastDailySummaryDate = dateKey;
      sendDailyLeadsSummary().catch(() => {});
    }
  }, 30 * 1000);
}

/**
 * Handle a single Telegram update (used by both long-polling and the Vercel webhook)
 */
const WEBAPP_BUTTON_URL = /^https:\/\//i.test(APP_URL) ? APP_URL : 'https://dwslead-miniapp.vercel.app/';

export async function handleTelegramUpdate(update) {
  if (!update || !update.message || !update.message.text) return;
  const chatId = update.message.chat.id;
  subscribedChats.add(String(chatId));
  const text = update.message.text.trim();

  if (text.startsWith('/start')) {
    await tgRequest('sendMessage', {
      chat_id: chatId,
      text: `Привіт, це <b>DWS Lead</b> — бот, який закриває три задачі фрілансера:\n\n` +
        `• знайти замовлення\n` +
        `• не втратити клієнта\n` +
        `• зрозуміти скільки заробив\n\n` +
        `Ловлю вакансії та замовлення з Telegram-каналів і фріланс-бірж (Freelancehunt, Djinni, Freelance.ua), веду по них CRM і рахую доходи.`,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Відкрити DWSlead', web_app: { url: WEBAPP_BUTTON_URL } }
          ]
        ]
      }
    });
  }
}

/**
 * Send a scan report (where new leads came from) to the admin chat
 */
export async function sendScanReport(result, title = '📊 Звіт DWS Lead') {
  if (!TOKEN || !ADMIN_CHAT_ID || !result) return false;
  const lines = [`<b>${title}</b>`, ''];
  lines.push(`Нових заявок: <b>${result.newLeads || 0}</b>`);
  lines.push(`• Telegram-канали (${result.scanned || 0}): ${result.telegramNew || 0}`);
  for (const [name, s] of Object.entries(result.exchanges || {})) {
    lines.push(`• ${name}: ${s.new} нових (знайдено ${s.found})`);
  }
  const total = (db.getLeads() || []).length;
  lines.push('', `Всього в базі: ${total}`);

  const res = await tgRequest('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
    text: lines.join('\n'),
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[{ text: 'Відкрити DWSlead', web_app: { url: WEBAPP_BUTTON_URL } }]]
    }
  });
  return !!(res && res.ok);
}

/**
 * Simple Long-polling loop for /start (local long-lived process only)
 */
let offset = 0;
async function pollUpdates() {
  if (!TOKEN) return;
  let nextDelay = 1500;
  try {
    const res = await tgRequest('getUpdates', { offset, timeout: 25 }, 35000);
    if (res && res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        offset = update.update_id + 1;
        await handleTelegramUpdate(update);
      }
    } else if (res && !res.ok) {
      if (res.error_code === 409) {
        // 409 = webhook is active (production on Vercel handles updates) — stop polling locally
        console.warn('[DWS Lead Bot] ℹ️ Вебхук активний (оновлення обробляє Vercel). Локальний polling вимкнено.');
        return;
      }
    }
  } catch (err) {
    nextDelay = 5000;
  }
  setTimeout(pollUpdates, nextDelay);
}

// On Vercel (serverless) there is no long-lived process: updates arrive via webhook, reports via cron
if (TOKEN && !process.env.VERCEL) {
  setupMenuButton();
  pollUpdates();
  startDailySummaryScheduler();
  console.log('[DWS Lead Bot] 🤖 Бот успішно запущений (підсумок дня щодня о 23:00)...');
}
