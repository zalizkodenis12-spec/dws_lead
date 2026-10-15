/**
 * DWS Lead — Telegram Userbot Auth Helper
 * Generates and stores TELEGRAM_SESSION in .env for monitoring discussion groups/superchats
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (q) => new Promise((resolve) => rl.question(q, resolve));

async function main() {
  console.log('\n======================================================');
  console.log('🤖 DWS Lead — Підключення Telegram Юзербота для Чатів');
  console.log('======================================================\n');
  console.log('Для роботи юзербота потрібні API ID та API HASH з my.telegram.org:');
  console.log('1. Перейдіть на https://my.telegram.org та увійдіть.');
  console.log('2. Відкрийте розділ "API development tools".');
  console.log('3. Створіть новий додаток (наприклад, назва "DWS Lead").');
  console.log('4. Скопіюйте api_id та api_hash.\n');

  let apiId = process.env.TELEGRAM_API_ID;
  let apiHash = process.env.TELEGRAM_API_HASH;

  if (!apiId) {
    apiId = await question('Введіть ваш TELEGRAM_API_ID: ');
  } else {
    console.log(`Використовуємо TELEGRAM_API_ID з .env: ${apiId}`);
  }

  if (!apiHash) {
    apiHash = await question('Введіть ваш TELEGRAM_API_HASH: ');
  } else {
    console.log(`Використовуємо TELEGRAM_API_HASH з .env: ${apiHash.slice(0, 6)}...`);
  }

  apiId = parseInt(apiId.trim(), 10);
  apiHash = apiHash.trim();

  const stringSession = new StringSession('');
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5
  });

  console.log('\nПідключення до Telegram серверів...');
  await client.start({
    phoneNumber: async () => {
      let raw = await question('Введіть номер телефону (+380...): ');
      raw = raw.trim().replace(/[\s()-]/g, '');
      if (raw.startsWith('0') && raw.length === 10) raw = '+38' + raw;
      else if (!raw.startsWith('+') && !raw.startsWith('380') && raw.length === 9) raw = '+380' + raw;
      else if (!raw.startsWith('+')) raw = '+' + raw;
      return raw;
    },
    password: async () => await question('Введіть пароль двофакторної автентифікації 2FA (якщо є): '),
    phoneCode: async () => (await question('Введіть код підтвердження з Telegram: ')).trim(),
    onError: (err) => console.error('Помилка авторизації:', err.message)
  });

  const sessionSaved = client.session.save();
  console.log('\n✅ Авторизація успішна!');

  // Save to .env file
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const updates = {
    TELEGRAM_API_ID: String(apiId),
    TELEGRAM_API_HASH: apiHash,
    TELEGRAM_SESSION: sessionSaved,
    TELEGRAM_SESSION_STRING: sessionSaved
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
  console.log('💾 TELEGRAM_SESSION, API_ID та API_HASH успішно збережено в .env!');
  console.log('🚀 Тепер перезапустіть додаток (npm start), і юзербот автоматично слухатиме всі 79 суперчатів у реальному часі!\n');

  await client.disconnect();
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Помилка:', err.message);
  rl.close();
  process.exit(1);
});
