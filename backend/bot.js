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
      text: '🚀 DWS Lead',
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
          { text: '🚀 Відкрити в DWS Lead', web_app: { url: APP_URL } }
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
              text: `👋 <b>Вітаємо в DWS Lead!</b>\n\n` +
                `Це персональний Telegram Mini App сервіс для пошуку клієнтів та замовлень агентства <b>DenisWeb Studio</b>.\n\n` +
                `📊 <b>Можливості:</b>\n` +
                `• Моніторинг ~200 чатів і ~200 каналів України\n` +
                `• Нульова витрата токенів: розумний 0-cost смарт-фільтр\n` +
                `• On-demand AI-скоринг (0–100) та персоналізовані відгуки\n` +
                `• Вбудована CRM (10 статусів воронки)\n` +
                `• Облік доходів з аналітикою по тижнях і днях\n` +
                `• Фірмовий дизайн DenisWeb Studio (Світла та Темна теми)\n\n` +
                `Натисніть кнопку нижче, щоб запустити додаток 👇`,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '🚀 Запустити DWS Lead', web_app: { url: APP_URL } }
                  ],
                  [
                    { text: '🌐 Сайт DenisWeb Studio', url: 'https://denis-webstudio.site' }
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
