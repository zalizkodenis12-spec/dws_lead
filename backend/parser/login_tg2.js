/**
 * DWS Lead — Telegram Userbot #2 Auth Helper
 * Generates and stores TELEGRAM_SESSION_2 in .env and nfc-outreach.json for second account
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ENV_PATH = path.resolve(__dirname, '../../.env');
const DB_PATH = path.resolve(__dirname, '../db/nfc-outreach.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log('\n======================================================');
  console.log('🤖 DWS Lead — Підключення Telegram Акаунта #2');
  console.log('======================================================\n');

  let apiId = process.env.TELEGRAM_API_ID;
  let apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId || !apiHash) {
    console.log('Не знайдено TELEGRAM_API_ID або TELEGRAM_API_HASH у .env');
    apiId = await question('Введіть ваш TELEGRAM_API_ID: ');
    apiHash = await question('Введіть ваш TELEGRAM_API_HASH: ');
  } else {
    console.log(`Використовуємо TELEGRAM_API_ID з .env: ${apiId}`);
  }

  apiId = parseInt(String(apiId).trim(), 10);
  apiHash = String(apiHash).trim();

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5
  });

  console.log('\nПідключення до Telegram серверів для Акаунта #2...');
  await client.start({
    phoneNumber: async () => {
      let raw = await question('Введіть номер телефону другого акаунта (наприклад, +1... для США або +380...): ');
      raw = raw.trim().replace(/[\s()-]/g, '');
      if (raw.startsWith('+')) return raw;
      if (raw.startsWith('1') && raw.length === 11) return '+' + raw;
      if (raw.startsWith('0') && raw.length === 10) return '+38' + raw;
      if (raw.startsWith('380') && raw.length === 12) return '+' + raw;
      if (raw.length === 10) return '+1' + raw;
      return '+' + raw;
    },
    password: async () => await question('Введіть пароль 2FA хмарного захисту другого акаунта (якщо є): '),
    phoneCode: async () => (await question('Введіть 5-значний код з додатку Telegram: ')).trim(),
    onError: (err) => console.error('Помилка авторизації:', err.message)
  });

  const sessionSaved = client.session.save();
  const me = await client.getMe().catch(() => null);
  const myHandle = me?.username ? ('@' + me.username) : (me?.phone ? ('+' + me.phone) : 'Акаунт #2');

  console.log(`\n✅ Авторизація другого акаунта успішна! Ви увійшли як: ${myHandle}`);

  // 1. Update .env file
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const updates = {
    TELEGRAM_SESSION_2: sessionSaved
  };

  let newEnv = envContent;
  for (const [key, val] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(newEnv)) {
      newEnv = newEnv.replace(regex, `${key}=${val}`);
    } else {
      newEnv += `\n${key}=${val}`;
    }
  }
  fs.writeFileSync(ENV_PATH, newEnv.trim() + '\n', 'utf-8');
  console.log('💾 TELEGRAM_SESSION_2 успішно збережено в .env!');

  // 2. Update nfc-outreach.json
  try {
    if (fs.existsSync(DB_PATH)) {
      const dbRaw = fs.readFileSync(DB_PATH, 'utf-8');
      const db = JSON.parse(dbRaw);
      if (db && db.config && db.config.accounts && db.config.accounts.tg2) {
        db.config.accounts.tg2.sessionString = sessionSaved;
        if (myHandle.startsWith('@')) db.config.accounts.tg2.handle = myHandle;
        db.config.accounts.tg2.enabled = true;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        console.log('💾 Акаунт #2 оновлено в базі авторозсилки nfc-outreach.json!');
      }
    }
  } catch (e) {
    console.warn('DB update notice:', e.message);
  }

  console.log('\n🚀 Тепер розсилка автоматично використовуватиме Telegram Акаунт #2 у черзі!\n');
  await client.disconnect();
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Помилка:', err.message);
  rl.close();
  process.exit(1);
});
