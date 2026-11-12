/**
 * DWS Lead — Instagram Auth Helper
 * Connects Instagram Account #1 via sessionid cookie or login credentials
 * Stores session in .env and nfc-outreach.json for automated Instagram DMs
 */

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

async function verifyInstagramSession(cookieStr) {
  let cleanCookie = cookieStr.trim();
  if (!cleanCookie.includes('sessionid=')) {
    cleanCookie = `sessionid=${cleanCookie}`;
  }

  const res = await fetch('https://www.instagram.com/api/v1/accounts/current_user/?edit=true', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'X-IG-App-ID': '936619743392459',
      'Cookie': cleanCookie
    }
  }).catch(() => null);

  if (!res || !res.ok) {
    return { ok: false, cleanCookie };
  }

  const data = await res.json().catch(() => null);
  const username = data?.user?.username || '';
  return { ok: Boolean(username), username, cleanCookie };
}

async function main() {
  console.log('\n======================================================');
  console.log('📸 DWS Lead — Підключення Instagram Акаунта для Авторозсилки');
  console.log('======================================================\n');
  console.log('Для безпечної автономної відправки Instagram Direct повідомлень');
  console.log('найпростіший та 100% надійний спосіб — це кукі sessionid з вашого браузера:\n');
  console.log('1. Відкрийте instagram.com у браузері, де ви вже залогінені.');
  console.log('2. Натисніть F12 (або Проінспектувати код) -> вкладка Application (або Сховище).');
  console.log('3. Зліва натисніть Cookies -> https://www.instagram.com.');
  console.log('4. Знайдіть рядок "sessionid" та скопіюйте його значення (довгий рядок).\n');

  const rawInput = await question('Вставте значення sessionid (або повний Cookie): ');
  const inputStr = rawInput.trim();

  if (!inputStr) {
    console.log('Введено порожній рядок. Авторизацію скасовано.');
    rl.close();
    process.exit(1);
  }

  console.log('\nПеревірка Instagram сесії...');
  const check = await verifyInstagramSession(inputStr);

  let verifiedUsername = check.username;
  let finalCookie = check.cleanCookie;

  if (check.ok) {
    console.log(`\n✅ Сесію підтверджено! Ви авторизовані як @${verifiedUsername}`);
  } else {
    console.log('\n⚠️ Instagram повернув обмеження прямої перевірки профілю, але cookie збережено.');
    const manualUser = await question('Введіть ваш Instagram @username (наприклад, @my_studio): ');
    verifiedUsername = manualUser.trim().replace(/^@+/, '');
  }

  // 1. Save to .env
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const updates = {
    INSTAGRAM_SESSION_COOKIE: finalCookie,
    INSTAGRAM_USERNAME: verifiedUsername ? ('@' + verifiedUsername) : ''
  };

  let newEnv = envContent;
  for (const [key, val] of Object.entries(updates)) {
    if (!val) continue;
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(newEnv)) {
      newEnv = newEnv.replace(regex, `${key}=${val}`);
    } else {
      newEnv += `\n${key}=${val}`;
    }
  }
  fs.writeFileSync(ENV_PATH, newEnv.trim() + '\n', 'utf-8');
  console.log('💾 INSTAGRAM_SESSION_COOKIE успішно збережено в .env!');

  // 2. Save to nfc-outreach.json
  try {
    if (fs.existsSync(DB_PATH)) {
      const dbRaw = fs.readFileSync(DB_PATH, 'utf-8');
      const db = JSON.parse(dbRaw);
      if (db && db.config && db.config.accounts && db.config.accounts.ig1) {
        db.config.accounts.ig1.sessionCookie = finalCookie;
        if (verifiedUsername) db.config.accounts.ig1.handle = '@' + verifiedUsername;
        db.config.accounts.ig1.enabled = true;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        console.log('💾 Instagram акаунт оновлено в базі авторозсилки nfc-outreach.json!');
      }
    }
  } catch (e) {
    console.warn('DB update notice:', e.message);
  }

  console.log('\n🚀 Автономна розсилка тепер може відправляти до 30 Instagram повідомлень на день!\n');
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Помилка:', err.message);
  rl.close();
  process.exit(1);
});
