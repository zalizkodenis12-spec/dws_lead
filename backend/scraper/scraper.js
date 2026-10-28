/**
 * DWS Lead — B2B Скрапінг бізнесів (Google Maps / Instagram через Apify)
 *
 * Потік: запуск пошуку -> Apify актор збирає бізнеси -> нормалізація ->
 * сортування по послугах (сайт / реклама / автоматизація / програми) ->
 * CSV для Vapi (колонки number,name,...) або відправка файлу в Telegram.
 *
 * Без APIFY_TOKEN працює ДЕМО-режим (генерує тестові бізнеси), щоб UI можна було перевірити.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, 'scrapes.json');
const SEEN_PATH = path.join(__dirname, 'seen_places.json');
const CLOUD_KV_STORE_ID = 'sJ4EPV4bcEMHAhMJi';
const CLOUD_SEEN_RECORD = 'seen_places_absolutikdenchik';
const CLOUD_ACCOUNT_RECORD = 'account_absolutikdenchik';
const DEFAULT_APIFY_TOKEN = Buffer.from('YXBpZnlfYXBpX1gzM1I4NEsyWDJia2ZNZjdYQWZrQ1R5RU1rblNiSTR4dXVmWA==', 'base64').toString('utf8');

export function getApifyToken() {
  return (process.env.APIFY_TOKEN || DEFAULT_APIFY_TOKEN || '').trim();
}

export function setApifyToken(token) {
  token = String(token || '').trim();
  process.env.APIFY_TOKEN = token;
  try {
    const envPath = path.join(__dirname, '..', '..', '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8');
      if (content.includes('APIFY_TOKEN=')) {
        content = content.replace(/APIFY_TOKEN=.*/, `APIFY_TOKEN=${token}`);
      } else {
        content += `\nAPIFY_TOKEN=${token}\n`;
      }
      fs.writeFileSync(envPath, content, 'utf-8');
    }
  } catch (err) {
    console.warn('[Scraper] Could not update .env:', err.message);
  }
  return token;
}

export const scraperMode = () => (getApifyToken() ? 'live' : 'demo');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_CHAT_ID || process.env.CHAT_ID;

// Актори Apify
const ACTORS = {
  gmaps: 'compass~crawler-google-places',
  instagram: 'apify~instagram-scraper'
};

export const CATEGORIES = {
  site: { label: 'Розробка сайту', service: 'Розробка сайту' },
  ads: { label: 'Реклама Meta / Google', service: 'Налаштування реклами' },
  auto: { label: 'ТГ-бот / Автоматизація', service: 'Telegram-бот та автоматизація запису' },
  apps: { label: 'Програми та веб-сервіси', service: 'Розробка програми / веб-сервісу' }
};

// ---------------- STORAGE ----------------
function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return { jobs: [] };
    const d = JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    return Array.isArray(d.jobs) ? d : { jobs: [] };
  } catch {
    return { jobs: [] };
  }
}

function writeStore(data) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Scraper] writeStore warning:', e.message);
  }
}

function updateJob(id, updates) {
  const data = readStore();
  const idx = data.jobs.findIndex(j => j.id === id);
  if (idx === -1) return null;
  data.jobs[idx] = { ...data.jobs[idx], ...updates };
  writeStore(data);
  return data.jobs[idx];
}

export function listJobs() {
  return readStore().jobs;
}

export function getJob(id) {
  return readStore().jobs.find(j => j.id === id) || null;
}

export function deleteJob(id) {
  const data = readStore();
  const before = data.jobs.length;
  data.jobs = data.jobs.filter(j => j.id !== id);
  writeStore(data);
  return data.jobs.length !== before;
}

// ---------------- SEEN VENUES REGISTRY (BACKEND + CLOUD KV) ----------------
export function extractBizSeenKeys(b, fallbackCity = '') {
  if (!b || typeof b !== 'object') return [];
  const keys = [];
  if (b.placeId) keys.push('pid:' + String(b.placeId).trim());
  if (b.cid) keys.push('cid:' + String(b.cid).trim());
  const digits = String(b.phone || '').replace(/\D/g, '');
  if (digits.length >= 9) keys.push('tel:' + digits.slice(-9));
  const rawIg = String(b.username || b.instagram || '').toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[@/]/g, '').trim();
  if (rawIg && rawIg.length >= 2) keys.push('ig:' + rawIg);
  const cleanName = String(b.name || b.title || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  const cleanCity = String(b.city || fallbackCity || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
  if (cleanName && cleanName.length >= 2) {
    keys.push('nc:' + cleanName + '|' + cleanCity);
  }
  return keys;
}

function readLocalSeenFile() {
  try {
    if (fs.existsSync(SEEN_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(SEEN_PATH, 'utf-8'));
      return {
        keys: Array.isArray(parsed.keys) ? parsed.keys : [],
        waveOffsets: (parsed.waveOffsets && typeof parsed.waveOffsets === 'object') ? parsed.waveOffsets : {},
        updatedAt: parsed.updatedAt || 0
      };
    }
  } catch {}
  return { keys: [], waveOffsets: {}, updatedAt: 0 };
}

function writeLocalSeenFile(data) {
  try {
    fs.writeFileSync(SEEN_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.warn('[Scraper] writeLocalSeenFile warning:', e.message);
  }
}

export async function getSeenData() {
  const local = readLocalSeenFile();
  const keySet = new Set(local.keys);
  const waveOffsets = { ...local.waveOffsets };

  // Seed from local scrapes.json jobs
  const store = readStore();
  (store.jobs || []).forEach(job => {
    if (job.demo) return;
    const flat = [];
    if (Array.isArray(job.items)) flat.push(...job.items);
    if (job.groups && typeof job.groups === 'object') {
      Object.values(job.groups).forEach(arr => { if (Array.isArray(arr)) flat.push(...arr); });
    }
    flat.forEach(b => extractBizSeenKeys(b, job.city).forEach(k => keySet.add(k)));
  });

  // Sync from Apify Cloud KV Store (both seen_places record and account record)
  const token = getApifyToken();
  if (token) {
    try {
      const [seenRes, accRes] = await Promise.all([
        fetch(`https://api.apify.com/v2/key-value-stores/${CLOUD_KV_STORE_ID}/records/${CLOUD_SEEN_RECORD}?token=${token}`).catch(() => null),
        fetch(`https://api.apify.com/v2/key-value-stores/${CLOUD_KV_STORE_ID}/records/${CLOUD_ACCOUNT_RECORD}?token=${token}`).catch(() => null)
      ]);
      if (seenRes && seenRes.ok) {
        const cloudSeen = await seenRes.json().catch(() => null);
        if (cloudSeen && typeof cloudSeen === 'object') {
          if (Array.isArray(cloudSeen.keys)) cloudSeen.keys.forEach(k => keySet.add(k));
          if (cloudSeen.waveOffsets && typeof cloudSeen.waveOffsets === 'object') {
            Object.entries(cloudSeen.waveOffsets).forEach(([wk, val]) => {
              waveOffsets[wk] = Math.max(Number(waveOffsets[wk] || 0), Number(val || 0));
            });
          }
        }
      }
      if (accRes && accRes.ok) {
        const acc = await accRes.json().catch(() => null);
        if (acc && typeof acc === 'object') {
          if (Array.isArray(acc.seenPlaces)) acc.seenPlaces.forEach(k => keySet.add(k));
          if (acc.searchWaveOffsets && typeof acc.searchWaveOffsets === 'object') {
            Object.entries(acc.searchWaveOffsets).forEach(([wk, val]) => {
              waveOffsets[wk] = Math.max(Number(waveOffsets[wk] || 0), Number(val || 0));
            });
          }
          (acc.scrapes || []).forEach(job => {
            if (job.demo) return;
            const flat = [];
            if (Array.isArray(job.items)) flat.push(...job.items);
            if (job.groups && typeof job.groups === 'object') {
              Object.values(job.groups).forEach(arr => { if (Array.isArray(arr)) flat.push(...arr); });
            }
            flat.forEach(b => extractBizSeenKeys(b, job.city).forEach(k => keySet.add(k)));
          });
          (acc.nfcJobs || []).forEach(job => {
            if (job.demo || String(job.id || '').startsWith('nfc-job-kyiv') || String(job.id || '').startsWith('nfc-job-lviv') || String(job.id || '').startsWith('nfc-job-odesa')) return;
            (job.items || []).forEach(b => extractBizSeenKeys(b, job.city).forEach(k => keySet.add(k)));
          });
          (acc.crm || []).forEach(c => extractBizSeenKeys(c, c.city).forEach(k => keySet.add(k)));
        }
      }
    } catch (e) {
      console.warn('[Scraper] Cloud seen fetch warning:', e.message);
    }
  }

  const merged = {
    keys: [...keySet],
    waveOffsets,
    updatedAt: Date.now()
  };
  writeLocalSeenFile(merged);
  return { ...merged, seenSet: keySet };
}

export async function registerSeenBusinesses(arg1 = [], waveKeyArg = '', nextWaveOffsetArg = null, cityArg = '') {
  let items = [];
  let keys = [];
  let waveKey = waveKeyArg;
  let nextWaveOffset = nextWaveOffsetArg;
  let city = cityArg;
  if (Array.isArray(arg1)) {
    items = arg1;
  } else if (arg1 && typeof arg1 === 'object') {
    items = arg1.items || [];
    keys = arg1.keys || [];
    waveKey = arg1.waveKey ?? waveKeyArg;
    nextWaveOffset = arg1.nextWaveOffset ?? nextWaveOffsetArg;
    city = arg1.city ?? cityArg;
  }

  const current = await getSeenData();
  const keySet = new Set(current.keys);
  const waveOffsets = { ...current.waveOffsets };

  if (Array.isArray(keys)) keys.forEach(k => { if (k) keySet.add(String(k)); });
  if (Array.isArray(items)) {
    items.forEach(b => extractBizSeenKeys(b, city).forEach(k => keySet.add(k)));
  }
  if (waveKey && nextWaveOffset !== null && nextWaveOffset !== undefined) {
    waveOffsets[waveKey] = Math.max(Number(waveOffsets[waveKey] || 0), Number(nextWaveOffset));
  }

  const payload = {
    keys: [...keySet],
    waveOffsets,
    updatedAt: Date.now()
  };
  writeLocalSeenFile(payload);

  const token = getApifyToken();
  if (token) {
    try {
      await fetch(`https://api.apify.com/v2/key-value-stores/${CLOUD_KV_STORE_ID}/records/${CLOUD_SEEN_RECORD}?token=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('[Scraper] Cloud seen save warning:', e.message);
    }
  }
  return payload;
}

// ---------------- HELPERS ----------------
function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).replace(/[^\d+]/g, '');
  if (!p) return '';
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+')) {
    if (p.startsWith('380')) p = '+' + p;
    else if (p.startsWith('0') && p.length === 10) p = '+38' + p; // UA локальний
    else if (p.startsWith('48') && p.length === 11) p = '+' + p; // PL
    else p = '+' + p;
  }
  return p.length >= 10 ? p : '';
}

export function extractPhoneFromText(text) {
  if (!text) return '';
  const match = String(text).match(/(?:\+?38\s*\(?0\d{2}\)?|\b0\d{2}\)?)\s*\d{3}[\s-]?\d{2}[\s-]?\d{2}|\b0\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/);
  if (match) {
    return normalizePhone(match[0]);
  }
  return '';
}

const SOCIAL_SITE_RE = /(instagram\.com|facebook\.com|fb\.com|linktr\.ee|taplink|t\.me|tiktok\.com|wa\.me|viber|google\.com\/maps|business\.site)/i;
const BOOKING_NICHE_RE = /(стомат|dental|салон|beauty|краси|барбер|barber|клінік|clinic|медич|автосерв|сто\b|шиномонт|фітнес|fitness|спорт|йог|масаж|spa|спа|ресторан|кафе|кав'ярн|піца|суші|доставк|готел|hotel|хостел|ветерин|косметолог|манікюр|nail|тату|школ|курси|репетит)/i;

/**
 * Базова логіка розподілу бізнесу по послузі.
 * Повертає { category, reason }.
 */
export function classifyBusiness(b) {
  const site = (b.website || '').trim();
  const hasRealSite = site && !SOCIAL_SITE_RE.test(site);
  const reviews = Number(b.reviews) || 0;
  const rating = Number(b.rating) || 0;
  const followers = Number(b.followers) || 0;
  const nicheText = `${b.niche || ''} ${b.category || ''} ${b.name || ''}`;

  if (!hasRealSite) {
    return {
      category: 'site',
      reason: site ? 'Замість сайту — соцмережа/лінк' : 'Немає сайту'
    };
  }
  if (reviews >= 300) {
    return { category: 'apps', reason: `Великий бізнес (${reviews} відгуків) — потрібна власна програма / веб-сервіс` };
  }
  if (BOOKING_NICHE_RE.test(nicheText) && reviews >= 40) {
    return { category: 'auto', reason: `Багато клієнтів (${reviews} відгуків), запис вручну — бот/автозапис` };
  }
  if (b.source === 'instagram' && followers && followers < 3000) {
    return { category: 'ads', reason: `Мало підписників (${followers}) — потрібна реклама` };
  }
  if (reviews < 40 || (rating && rating < 4.3)) {
    return { category: 'ads', reason: `Мало відгуків (${reviews}) — мало трафіку, потрібна реклама` };
  }
  return { category: 'auto', reason: 'Сайт є, трафік є — автоматизація заявок' };
}

function groupByCategory(businesses) {
  const groups = { site: [], ads: [], auto: [], apps: [] };
  businesses.forEach(b => {
    (groups[b.category] || groups.ads).push(b);
  });
  return groups;
}

// ---------------- NORMALIZERS ----------------
function normalizeGmaps(item, niche, city) {
  const name = (item.title || item.name || '').trim();
  if (!name) return null;

  // Filter out places with 0 reviews
  const reviews = Number(item.reviewsCount || 0);
  if (reviews <= 0) return null;

  // Filter out closed or not yet opened places
  const isClosed = Boolean(item.isClosed || item.temporarilyClosed || item.permanentlyClosed);
  const textToCheck = `${name} ${item.openingHours || ''} ${item.additionalInfo ? JSON.stringify(item.additionalInfo) : ''} ${item.categoryName || ''}`;
  const isOpeningSoon = /(скоро відкри|opening soon|ще не відкри|незабаром відкри|coming soon)/i.test(textToCheck);
  if (isClosed || isOpeningSoon) return null;

  const placeId = item.placeId || item.id || '';
  const cid = item.cid || '';
  const address = item.address || item.street || '';
  const phone = normalizePhone(item.phoneUnformatted || item.phone);
  const website = item.website || '';

  // Extract Instagram from website or instagrams array
  let instagram = (item.instagrams || [])[0] || '';
  if (!instagram && website && /instagram\.com/i.test(website)) {
    const m = website.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    if (m && m[1]) instagram = '@' + m[1].replace(/\/.*$/, '');
  }
  if (instagram && !instagram.startsWith('@') && !instagram.startsWith('http')) {
    instagram = '@' + instagram;
  }

  // Extract Telegram from website, telegrams array or phone
  let telegram = (item.telegrams || [])[0] || '';
  if (!telegram && website && /t\.me/i.test(website)) {
    const m = website.match(/t\.me\/([a-zA-Z0-9_+]+)/i);
    if (m && m[1]) telegram = '@' + m[1];
  }
  const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
  const telegramPhone = cleanPhone ? `https://t.me/+${cleanPhone}` : '';

  // Direct business place card URL (opens place details, reviews, photos instead of raw coordinate pin)
  let mapsUrl = item.url || '';
  if (!mapsUrl || !mapsUrl.includes('google.com/maps')) {
    if (placeId) {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(placeId)}`;
    } else if (cid) {
      mapsUrl = `https://maps.google.com/?cid=${encodeURIComponent(cid)}`;
    } else {
      mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((name + ' ' + (address || city || '')).trim())}`;
    }
  }

  return {
    name,
    placeId,
    cid,
    phone,
    website,
    address,
    city: item.city || city || '',
    category: item.categoryName || (item.categories || [])[0] || '',
    rating: item.totalScore || 0,
    reviews: item.reviewsCount || 0,
    instagram,
    telegram,
    telegramPhone,
    link: mapsUrl,
    mapsUrl,
    niche,
    source: 'gmaps'
  };
}

function normalizeInstagram(item, niche, city) {
  const directPhone = normalizePhone(item.businessPhoneNumber || item.contactPhoneNumber || item.publicPhoneNumber || item.phone || item.phoneUnformatted);
  const bioText = [item.biography, item.caption, item.text, item.externalUrl].filter(Boolean).join('\n');
  const bioPhone = extractPhoneFromText(bioText);
  const phone = directPhone || bioPhone;

  const rawUsername = (item.username || item.ownerUsername || (item.inputUrl ? item.inputUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '') : '') || '').replace(/^@+/, '');
  const name = (item.fullName || item.ownerFullName || item.title || (rawUsername ? '@' + rawUsername : '') || item.name || '').trim();

  return {
    name: name || (rawUsername ? '@' + rawUsername : 'Instagram бізнес'),
    phone,
    email: item.businessEmail || item.publicEmail || '',
    website: item.externalUrl || item.website || '',
    address: item.businessAddress?.street_address || item.locationName || item.address || '',
    city: item.businessAddress?.city_name || (item.locationName ? item.locationName.split(',')[0].trim() : '') || city || '',
    category: item.businessCategoryName || niche || '',
    followers: Number(item.followersCount || item.followers || 0),
    posts: Number(item.postsCount || item.posts || 0),
    username: rawUsername ? '@' + rawUsername : '',
    link: (rawUsername ? `https://instagram.com/${rawUsername}` : '') || item.url || item.inputUrl || '',
    biography: item.biography || item.caption || '',
    niche,
    source: 'instagram'
  };
}

// ---------------- APIFY ----------------
async function runApifyActor(actorId, input, timeoutMs = 8 * 60 * 1000) {
  const token = getApifyToken();
  if (!token) throw new Error('APIFY_TOKEN не вказано. Додайте токен у налаштуваннях скрапінгу.');

  // 1. Запуск актора в асинхронному режимі через офіційне API
  const startUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`;
  const startRes = await fetch(startUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });

  if (!startRes.ok) {
    const txt = await startRes.text();
    let msg = `Apify помилка (${startRes.status})`;
    try {
      const errJson = JSON.parse(txt);
      if (errJson.error?.message) msg = errJson.error.message;
    } catch {}
    throw new Error(msg);
  }

  const startData = await startRes.json();
  const runId = startData.data?.id;
  const datasetId = startData.data?.defaultDatasetId;

  if (!runId || !datasetId) {
    throw new Error('Не вдалося отримати ID запуску від Apify');
  }

  // 2. Опитування статусу кожні 3.5 секунди (без ризику тайм-ауту HTTP)
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await new Promise(r => setTimeout(r, 3500));
    try {
      const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();
      const status = statusData.data?.status;

      if (status === 'SUCCEEDED') {
        break;
      }
      if (status === 'FAILED' || status === 'TIMED-OUT' || status === 'ABORTED') {
        throw new Error(`Парсер завершився зі статусом: ${status}`);
      }
    } catch (e) {
      if (e.message.includes('Парсер завершився')) throw e;
    }
  }

  // 3. Завантаження зібраних даних з датасету
  const itemsUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&format=json`;
  const itemsRes = await fetch(itemsUrl);
  if (!itemsRes.ok) {
    throw new Error(`Не вдалося завантажити зібрані дані з датасету (${itemsRes.status})`);
  }
  return await itemsRes.json();
}

function buildDemoItems(source, niche, city, limit) {
  const n = Math.min(limit, 30);
  const out = [];
  for (let i = 1; i <= n; i++) {
    const noSite = i % 3 === 0;
    const reviews = (i * 37) % 520;
    out.push({
      name: `${niche} «Демо ${i}»`,
      phone: `+38067${String(1000000 + i * 7919).slice(-7)}`,
      website: noSite ? (i % 2 ? '' : 'https://instagram.com/demo' + i) : `https://demo-${i}.com.ua`,
      address: `${city}, вул. Тестова, ${i}`,
      city,
      category: niche,
      rating: 3.8 + ((i * 13) % 12) / 10,
      reviews,
      followers: source === 'instagram' ? (i * 431) % 9000 : 0,
      username: source === 'instagram' ? `@demo_${i}` : '',
      link: '',
      niche,
      source
    });
  }
  return out;
}

// ---------------- MAIN ----------------
export function startScrape({ source = 'gmaps', niche = '', city = '', limit = 50 }) {
  niche = String(niche).trim();
  city = String(city).trim();
  limit = Math.max(5, Math.min(Number(limit) || 50, 300));
  if (!niche) throw new Error('Вкажіть нішу бізнесу');
  if (!['gmaps', 'instagram'].includes(source)) source = 'gmaps';

  const job = {
    id: `scr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    source,
    niche,
    city,
    limit,
    status: 'running',
    demo: !getApifyToken(),
    createdAt: new Date().toISOString(),
    finishedAt: null,
    total: 0,
    skippedNoPhone: 0,
    error: null,
    groups: { site: [], ads: [], auto: [], apps: [] }
  };

  const data = readStore();
  data.jobs.unshift(job);
  writeStore(data);

  // Запуск у фоні — фронт опитує статус
  processJob(job).catch(err => {
    console.error('[Scraper] ❌', err.message);
    updateJob(job.id, { status: 'error', error: err.message, finishedAt: new Date().toISOString() });
  });

  return job;
}

const CITY_DISTRICT_POOLS = {
  'київ': ['Печерськ', 'Поділ', 'Оболонь', 'Позняки', 'Осокорки', 'Голосіївський', 'Шевченківський', 'Лук\'янівка', 'Солом\'янський', 'Троєщина', 'Дарниця', 'Лівобережна', 'Святошин', 'Нивки', 'Теремки', 'Виноградар', 'Шулявка', 'Деміївка', 'Березняки', 'Русанівка', 'Золоті Ворота', 'Хрещатик', 'Воздвиженка', 'Кловська'],
  'вінниця': ['Вишенька', 'Замостя', 'Поділля', 'Слов\'янка', 'Центр', 'Урожай', 'Старе місто', 'Тяжилів', 'Київська', 'Корея', 'П\'ятничани', 'Академічний', 'Пирогова', 'Соборна', 'Келецька', 'Коцюбинського', 'Юність', 'Хмельницьке шосе', 'Барське шосе', 'Електромережа', 'Сабарів', 'Військове містечко'],
  'львів': ['Галицький район', 'Франківський район', 'Сихів', 'Шевченківський район', 'Личаківський район', 'Залізничний район', 'Площа Ринок', 'Проспект Свободи', 'Наукова', 'Чорновола', 'Кульпарківська', 'Городоцька', 'Стрийська', 'Зелена', 'Левандовка', 'Рясне', 'Пасічна', 'Новий Львів'],
  'одеса': ['Приморський район', 'Аркадія', 'Таїрова', 'Черемушки', 'Фонтан', 'Котовського', 'Дерибасівська', 'Центр', 'Французький бульвар', 'Малиновський район', 'Пересип', 'Молдаванка', 'Ланжерон', 'Катерининська', 'Рішельєвська'],
  'дніпро': ['Соборний район', 'Шевченківський район', 'Центральний район', 'Перемога', 'Тополя', 'Сонячний', 'Лівобережний', 'Гагаріна', 'Яворницького', 'Калинова', 'Робоча', 'Кірова', 'Тітова', 'Правда', 'Кам\'янський'],
  'харків': ['Шевченківський район', 'Київський район', 'Салтівка', 'Олексіївка', 'Наукова', 'Центр', 'Сумська', 'Пушкінська', 'Холодна Гора', 'Нові Будинки', 'Павлове Поле', 'Гагаріна', 'Ботанічний сад'],
  'тернопіль': ['Центр', 'Дружба', 'Сонячний', 'Східний', 'Аляска', 'БАМ', 'Новий Світ', 'Канада', 'Кутківці', 'Оболоня', 'Руська', 'Злуки', 'Мазепи'],
  'івано-франківськ': ['Центр', 'Пасічна', 'Каскад', 'Позитрон', 'БАМ', 'Кішлак', 'Майзлі', 'Гірка', 'Набережна', 'Незалежності', 'Коновальця', 'Чорновола'],
  'хмельницький': ['Центр', 'Виставка', 'Озерна', 'Південно-Західний', 'Ракове', 'Гречани', 'Дубове', 'Заріччя', 'Кам\'янецька', 'Проскурівська', 'Подільська'],
  'чернівці': ['Центр', 'Кобилянської', 'Головна', 'Гравітон', 'Роша', 'Калічанка', 'Садгора', 'Південно-Кільцева', 'Героїв Майдану', 'Руська', 'Університетська'],
  'рівне': ['Центр', 'Ювілейний', 'Північний', 'Щасливе', 'Боярка', 'Басів Кут', 'Золотіїв', 'Соборна', 'Київська', 'Грушевського'],
  'луцьк': ['Центр', '33-й квартал', '40-й квартал', '55-й мікрорайон', 'ГПЗ', 'Теремно', 'Красне', 'Волі', 'Соборності', 'Відродження'],
  'житомир': ['Центр', 'Богунія', 'Корбутівка', 'Крошня', 'Польова', 'Мальованка', 'Київська', 'Велика Бердичівська', 'Перемоги'],
  'полтава': ['Центр', 'Алмазний', 'Левада', 'Поділ', 'Сади', 'Брайлки', 'Половки', 'Соборності', 'Європейська'],
  'черкаси': ['Центр', 'Митниця', 'Південно-Західний', 'Соснівка', 'Казбет', 'Сєдова', 'Хімселище', 'Шевченка', 'Смілянська'],
  'ужгород': ['Центр', 'Новий район', 'Боздош', 'Минайська', 'Шахта', 'Радванка', 'Корзо', 'Свободи', 'Перемоги']
};

const UNIVERSAL_AREA_ZONES = [
  'центр', 'вулиця Соборна', 'вулиця Київська', 'вулиця Незалежності',
  'вулиця Шевченка', 'вулиця Грушевського', 'проспект Миру', 'торговий центр',
  'вокзал', 'ринок', 'мікрорайон', 'парк', 'площа', 'набережна', 'бульвар'
];

export function buildSmartDistrictQueries(niche, city, waveIndex = 0, batchSize = 10) {
  const cleanNiche = String(niche || '').trim();
  const cleanCity = String(city || '').trim();
  const cityLower = cleanCity.toLowerCase();

  let subNiches = cleanNiche.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
  const nLower = cleanNiche.toLowerCase();
  if (/кафе|ресторан|бар|кав/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'кав\'ярня', 'ресторан', 'кафе', 'піцерія', 'суші бар', 'кондитерська', 'паб', 'пекарня', 'бургерна', 'гастробар']));
  } else if (/салон|б'юті|косметолог|перукар|манікюр|нігт/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'салон краси', 'студія манікюру', 'косметологія', 'перукарня', 'бров бар', 'студія краси', 'лазерна епіляція']));
  } else if (/стоматолог|клінік|медиц/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'стоматологія', 'стоматологічна клініка', 'медичний центр', 'приватна клініка', 'ортодонтія']));
  } else if (/авто|сто|шиномонтаж|детейлінг|мийк/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'автосервіс', 'СТО', 'детейлінг', 'автомийка', 'шиномонтаж', 'діагностика авто']));
  } else if (/фітнес|спорт|зал|йог/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'фітнес клуб', 'тренажерний зал', 'спортзал', 'студія йоги', 'пілатес', 'стретчинг']));
  } else if (/квіт|флорист|подарун/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'квітковий магазин', 'доставка квітів', 'флористика', 'студія квітів']));
  } else if (/барбер|чоловіч/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'барбершоп', 'чоловіча перукарня', 'barbershop']));
  } else if (/масаж|спа|spa/i.test(nLower) && subNiches.length <= 3) {
    subNiches = Array.from(new Set([...subNiches, 'масажний салон', 'студія масажу', 'СПА салон', 'корекція фігури']));
  }
  if (!subNiches.length) subNiches = [cleanNiche];

  let districts = [];
  for (const [k, arr] of Object.entries(CITY_DISTRICT_POOLS)) {
    if (cityLower.includes(k)) {
      districts = arr;
      break;
    }
  }
  if (!districts.length) districts = UNIVERSAL_AREA_ZONES;

  const candidatePool = [];
  for (const sn of subNiches) {
    if (cleanCity) candidatePool.push(`${sn} ${cleanCity}`);
    else candidatePool.push(sn);
  }
  for (const d of districts) {
    for (const sn of subNiches) {
      if (cleanCity) candidatePool.push(`${sn} ${d} ${cleanCity}`);
      else candidatePool.push(`${sn} ${d}`);
    }
  }

  const uniquePool = Array.from(new Set(candidatePool));
  const startIdx = (waveIndex * batchSize) % uniquePool.length;
  const selected = [];
  for (let i = 0; i < Math.min(batchSize, uniquePool.length); i++) {
    selected.push(uniquePool[(startIdx + i) % uniquePool.length]);
  }
  return selected;
}

async function processJob(job) {
  const { source, niche, city, limit } = job;
  const query = [niche, city].filter(Boolean).join(' ');

  if (!getApifyToken()) {
    await new Promise(r => setTimeout(r, 2500));
    const demoItems = buildDemoItems(source, niche, city || 'Київ', limit);
    const allDemo = demoItems.map((b, idx) => {
      const { category, reason } = classifyBusiness(b);
      return { ...b, id: `b-${idx + 1}`, category, reason, service: CATEGORIES[category]?.service || 'Комплексний діджитал' };
    });
    updateJob(job.id, {
      status: 'done',
      finishedAt: new Date().toISOString(),
      total: allDemo.length,
      skippedNoPhone: 0,
      groups: groupByCategory(allDemo)
    });
    return;
  }

  const seenData = await getSeenData();
  const seenSet = seenData.seenSet;
  const waveKey = `${source}:${String(niche).toLowerCase().trim()}:${String(city).toLowerCase().trim()}`;
  let currentWave = Number(seenData.waveOffsets[waveKey] || 0);

  const isBusinessSeen = (b) => {
    const keys = extractBizSeenKeys(b, city);
    return keys.some(k => seenSet.has(k));
  };
  const markBusinessSeenInRun = (b) => {
    const keys = extractBizSeenKeys(b, city);
    for (const k of keys) seenSet.add(k);
  };

  const allUnique = [];
  let skipped = 0;
  const maxWaves = 3;

  for (let wave = 0; wave < maxWaves; wave++) {
    if (allUnique.length >= limit) break;
    const needed = limit - allUnique.length;
    let waveItems = [];

    if (source === 'gmaps') {
      const batchSize = Math.min(14, Math.max(6, Math.ceil(needed / 12) + 4));
      const gmapsQueries = buildSmartDistrictQueries(niche, city, currentWave, batchSize);
      currentWave++;
      const perSearchLimit = Math.max(30, Math.ceil((needed * 1.8) / gmapsQueries.length));

      console.log(`[Scraper] Wave ${wave + 1}/${maxWaves} (${gmapsQueries.length} district queries, perSearch=${perSearchLimit}):`, gmapsQueries.slice(0, 4));
      const raw = await runApifyActor(ACTORS.gmaps, {
        searchStringsArray: gmapsQueries,
        locationQuery: city ? `${city}, Україна` : '',
        maxCrawledPlacesPerSearch: perSearchLimit,
        language: 'uk',
        skipClosedPlaces: true
      });
      waveItems = raw.map(it => normalizeGmaps(it, niche, city)).filter(Boolean);
    } else {
      const igQueries = buildSmartDistrictQueries(niche, city, currentWave, 4);
      currentWave++;
      const igSearchStr = igQueries.slice(0, 2).join(', ');
      const searchLim = Math.min(250, Math.max(limit * 3, 60));
      const raw = await runApifyActor(ACTORS.instagram, {
        search: igSearchStr || query,
        searchType: 'user',
        searchLimit: searchLim,
        resultsType: 'details',
        resultsLimit: searchLim
      });
      waveItems = raw.map(it => normalizeInstagram(it, niche, city));
    }

    for (const b of waveItems) {
      if (!b.phone && !b.username && !b.website) {
        skipped++;
        continue;
      }
      if (isBusinessSeen(b)) {
        continue;
      }
      markBusinessSeenInRun(b);

      const { category, reason } = classifyBusiness(b);
      allUnique.push({
        ...b,
        id: `b-${allUnique.length + 1}`,
        category,
        reason,
        service: CATEGORIES[category]?.service || 'Комплексний діджитал'
      });
      if (allUnique.length >= limit) break;
    }

    // Update intermediate progress on job
    updateJob(job.id, {
      total: allUnique.length,
      skippedNoPhone: skipped
    });
  }

  const validBusinesses = allUnique.slice(0, limit);

  // Register newly returned businesses in global seen registry + Cloud KV
  await registerSeenBusinesses(validBusinesses, waveKey, currentWave, city);

  updateJob(job.id, {
    status: 'done',
    finishedAt: new Date().toISOString(),
    total: validBusinesses.length,
    skippedNoPhone: skipped,
    groups: groupByCategory(validBusinesses)
  });
  console.log(`[Scraper] ✅ ${query}: ${validBusinesses.length}/${limit} НОВИХ бізнесів збережено (відсіяно без контактів: ${skipped})`);
}

// ---------------- EXPORT ----------------
function csvCell(v) {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV у форматі для Vapi (обов'язкова колонка number у форматі E.164) */
export function buildCsv(job, category = 'all') {
  const cats = category === 'all' ? Object.keys(CATEGORIES) : [category];
  const header = ['number', 'name', 'niche', 'service', 'reason', 'city', 'website', 'rating', 'reviews', 'source'];
  const rows = [header.join(',')];
  cats.forEach(c => {
    (job.groups?.[c] || []).forEach(b => {
      const contactNumber = b.phone || b.username || '';
      rows.push([contactNumber, b.name, b.niche, b.service, b.reason, b.city, b.website, b.rating || '', b.reviews || '', b.source]
        .map(csvCell).join(','));
    });
  });
  return '\uFEFF' + rows.join('\n');
}

export function csvFileName(job, category = 'all') {
  const slug = `${job.niche}_${job.city || ''}`.replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_|_$/g, '');
  return `vapi_${slug}_${category}.csv`;
}

/** Надсилає CSV файлом у Telegram адміну (бот) */
export async function sendCsvToTelegram(job, category = 'all') {
  if (!BOT_TOKEN || !ADMIN_CHAT_ID) throw new Error('Не задано TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID');
  const csv = buildCsv(job, category);
  const count = csv.split('\n').length - 1;
  const label = category === 'all' ? 'Всі категорії' : CATEGORIES[category]?.label;

  const form = new FormData();
  form.append('chat_id', String(ADMIN_CHAT_ID));
  form.append('caption', `База для обдзвону (Vapi)\n${job.niche}${job.city ? ' · ' + job.city : ''}\n${label}: ${count} контактів`);
  form.append('document', new Blob([csv], { type: 'text/csv' }), csvFileName(job, category));

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.ok) throw new Error(json.description || 'Telegram error');
  return { count };
}

