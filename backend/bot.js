/**
 * DWS Lead — Telegram Bot Service
 * Opens Telegram Mini App via Menu Button and Inline Buttons.
 * Sends alerts for high-value leads.
 */

import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const APP_URL = process.env.TELEGRAM_APP_URL || process.env.WEBAPP_URL || 'http://localhost:3000';
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

if (!TOKEN) {
  console.log('[DWS Lead Bot] ⚠️ TELEGRAM_BOT_TOKEN не задано в .env.');
  console.log('[DWS Lead Bot] Будь ласка, вкажіть токен у файлі .env для запуску Telegram бота.');
}

async function tgRequest(method, payload = {}) {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API error (${method}):`, err.message);
    return null;
  }
}

/**
 * Configure the permanent WebApp Menu Button in Telegram
 */
export async function setupMenuButton() {
  if (!TOKEN) return;
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
 * Simple Long-polling loop for /start
 */
let offset = 0;
async function pollUpdates() {
  if (!TOKEN) return;
  try {
    const res = await tgRequest('getUpdates', { offset, timeout: 25 });
    if (res && res.ok && Array.isArray(res.result)) {
      for (const update of res.result) {
        offset = update.update_id + 1;
        if (update.message && update.message.text) {
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
                `Ловлю вакансії та замовлення з 79 тг-чатів і 14 каналів України, веду по них CRM і рахую доходи по тижнях і місяцях.`,
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
      }
    }
  } catch (err) {
    console.error('Polling error:', err.message);
  }
  setTimeout(pollUpdates, 1500);
}

if (TOKEN) {
  setupMenuButton();
  pollUpdates();
  startDailySummaryScheduler();
  console.log('[DWS Lead Bot] 🤖 Бот успішно запущений (підсумок дня щодня о 23:00)...');
}
