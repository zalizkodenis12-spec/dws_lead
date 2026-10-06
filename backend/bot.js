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

/**
 * Send alert about hot lead
 */
export async function sendLeadNotification(lead) {
  if (!TOKEN || !ADMIN_CHAT_ID) return;
  const text = `🎯 <b>НОВИЙ ГАРЯЧИЙ ЛІД [${lead.categoryName || 'Веброзробка'}]!</b>\n\n` +
    `📌 <b>${lead.title}</b>\n` +
    `👤 Автор: ${lead.authorName || 'Клієнт'} (<code>${lead.authorUsername || 'без юзернейма'}</code>)\n` +
    `💰 Бюджет: <b>${lead.budget ? lead.budget.toLocaleString('uk-UA') + ' ₴' : 'Договірний'}</b>\n` +
    `⭐ AI-Рейтинг: <b>${lead.aiRating}/100</b>\n\n` +
    `💬 <i>"${(lead.text || '').substring(0, 180)}..."</i>\n\n` +
    `📅 Джерело: ${lead.sourceName || 'TG чат'}`;

  await tgRequest('sendMessage', {
    chat_id: ADMIN_CHAT_ID,
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
          const text = update.message.text.trim();

          if (text.startsWith('/start')) {
            await tgRequest('sendMessage', {
              chat_id: chatId,
              text: `Привіт, це <b>DWS Lead</b> — бот, який закриває три задачі фрілансера:\n\n` +
                `• знайти замовлення\n` +
                `• не втратити клієнта\n` +
                `• зрозуміти скільки заробив\n\n` +
                `Ловлю вакансії та замовлення з 200+ тг-чатів і 200+ каналів України, веду по них CRM і рахую доходи по тижнях і місяцях.`,
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
  console.log('[DWS Lead Bot] 🤖 Бот успішно запущений і очікує команди...');
}
