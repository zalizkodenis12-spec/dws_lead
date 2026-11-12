/**
 * DWS Lead — Instagram Auth Helper
 * Connects Instagram Account via automatic Chrome browser login OR manual sessionid cookie
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

function findChromePath() {
  const possible = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of possible) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

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

function saveInstagramSession(cookieStr, username) {
  let cleanCookie = cookieStr.trim();
  if (!cleanCookie.includes('sessionid=')) {
    cleanCookie = `sessionid=${cleanCookie}`;
  }

  // 1. Update .env
  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf-8');
  }

  const updates = {
    INSTAGRAM_SESSION_COOKIE: cleanCookie,
    INSTAGRAM_USERNAME: username ? ('@' + username.replace(/^@+/, '')) : ''
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

  // 2. Update nfc-outreach.json
  try {
    if (fs.existsSync(DB_PATH)) {
      const dbRaw = fs.readFileSync(DB_PATH, 'utf-8');
      const db = JSON.parse(dbRaw);
      if (db && db.config && db.config.accounts && db.config.accounts.ig1) {
        db.config.accounts.ig1.sessionCookie = cleanCookie;
        if (username) db.config.accounts.ig1.handle = '@' + username.replace(/^@+/, '');
        db.config.accounts.ig1.enabled = true;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        console.log('💾 Instagram акаунт оновлено в базі авторозсилки nfc-outreach.json!');
      }
    }
  } catch (e) {
    console.warn('DB update notice:', e.message);
  }
}

async function loginViaChromeBrowser() {
  const chromePath = findChromePath();
  if (!chromePath) {
    console.log('❌ Chrome або Edge не знайдено за стандартними шляхами.');
    return false;
  }

  console.log(`\n🌐 Запускаємо вікно браузера (${chromePath})...`);
  console.log('👉 Увійдіть у ваш Instagram акаунт у вікні, що відкрилося.');
  console.log('👉 Як тільки ви увійдете, сесія автоматично перехопиться!\n');

  try {
    const puppeteer = await import('puppeteer-core');
    const browser = await puppeteer.default.launch({
      executablePath: chromePath,
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox']
    });

    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' });

    let capturedSessionId = '';
    let capturedUsername = '';

    const startTime = Date.now();
    while (Date.now() - startTime < 240000) {
      if (!browser.isConnected()) {
        console.log('\nБраузер було закрито користувачем.');
        break;
      }

      const cookies = await page.cookies().catch(() => []);
      const sessCookie = cookies.find(c => c.name === 'sessionid');
      if (sessCookie && sessCookie.value) {
        capturedSessionId = sessCookie.value;
        const dsUser = cookies.find(c => c.name === 'ds_user_id');
        const check = await verifyInstagramSession(capturedSessionId);
        capturedUsername = check.username || (dsUser ? `id_${dsUser.value}` : '');
        break;
      }

      await new Promise(r => setTimeout(r, 2000));
    }

    if (capturedSessionId) {
      console.log(`\n✅ Авторизація в Instagram успішна! Акаунт: @${capturedUsername || 'підтверджено'}`);
      saveInstagramSession(capturedSessionId, capturedUsername);
      await browser.close().catch(() => {});
      return true;
    } else {
      console.log('\nСесію не було перехоплено вчасно.');
      await browser.close().catch(() => {});
      return false;
    }
  } catch (err) {
    console.warn('Chrome launcher error:', err.message);
    return false;
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('📸 DWS Lead — Підключення Instagram Акаунта');
  console.log('======================================================\n');
  console.log('Оберіть найзручніший спосіб:');
  console.log('1. Автоматично відкрити вікно Chrome для входу (найпростіше, 1 клік)');
  console.log('2. Вставити значення cookie sessionid вручну з браузера\n');

  const choice = await question('Ваш вибір (1 або 2, за замовчуванням 1): ');
  const mode = choice.trim() || '1';

  if (mode === '1') {
    const success = await loginViaChromeBrowser();
    if (success) {
      console.log('\n🚀 Instagram акаунт готовий до авторозсилки (до 30 DM на день)!\n');
      rl.close();
      process.exit(0);
    } else {
      console.log('\nПереходимо до ручного введення sessionid...');
    }
  }

  console.log('\nЯк скопіювати sessionid вручну:');
  console.log('1. Відкрийте instagram.com у звичайному браузері, де ви вже залогінені.');
  console.log('2. Натисніть F12 -> вкладка Application (Сховище) -> Cookies -> instagram.com.');
  console.log('3. Скопіюйте значення рядка "sessionid".\n');

  const rawInput = await question('Вставте sessionid: ');
  const inputStr = rawInput.trim();

  if (!inputStr) {
    console.log('Введено порожній рядок. Авторизацію скасовано.');
    rl.close();
    process.exit(1);
  }

  console.log('\nПеревірка Instagram сесії...');
  const check = await verifyInstagramSession(inputStr);

  let verifiedUsername = check.username;
  if (check.ok) {
    console.log(`\n✅ Сесію підтверджено! Ви авторизовані як @${verifiedUsername}`);
  } else {
    console.log('\n⚠️ Instagram прийняв cookie, але ім\'я користувача потрібно вказати.');
    const manualUser = await question('Введіть ваш Instagram @username: ');
    verifiedUsername = manualUser.trim().replace(/^@+/, '');
  }

  saveInstagramSession(inputStr, verifiedUsername);
  console.log('\n🚀 Instagram акаунт готовий до авторозсилки!\n');
  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Помилка:', err.message);
  rl.close();
  process.exit(1);
});
