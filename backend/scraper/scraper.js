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

export function getApifyToken() {
  return (process.env.APIFY_TOKEN || '').trim();
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
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
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
  return {
    name: item.title || item.name || '',
    phone: normalizePhone(item.phoneUnformatted || item.phone),
    website: item.website || '',
    address: item.address || item.street || '',
    city: item.city || city || '',
    category: item.categoryName || (item.categories || [])[0] || '',
    rating: item.totalScore || 0,
    reviews: item.reviewsCount || 0,
    instagram: (item.instagrams || [])[0] || '',
    link: item.url || '',
    niche,
    source: 'gmaps'
  };
}

function normalizeInstagram(item, niche, city) {
  return {
    name: item.fullName || item.username || '',
    phone: normalizePhone(item.businessPhoneNumber || item.contactPhoneNumber || item.publicPhoneNumber),
    email: item.businessEmail || item.publicEmail || '',
    website: item.externalUrl || '',
    address: item.businessAddress?.street_address || '',
    city: item.businessAddress?.city_name || city || '',
    category: item.businessCategoryName || '',
    followers: item.followersCount || 0,
    posts: item.postsCount || 0,
    username: item.username ? '@' + item.username : '',
    link: item.url || (item.username ? `https://instagram.com/${item.username}` : ''),
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

async function processJob(job) {
  const { source, niche, city, limit } = job;
  const query = [niche, city].filter(Boolean).join(' ');
  let items;

  if (!getApifyToken()) {
    await new Promise(r => setTimeout(r, 2500));
    items = buildDemoItems(source, niche, city || 'Київ', limit);
  } else if (source === 'gmaps') {
    const raw = await runApifyActor(ACTORS.gmaps, {
      searchStringsArray: [query],
      maxCrawledPlacesPerSearch: limit,
      language: 'uk',
      skipClosedPlaces: true
    });
    items = raw.map(it => normalizeGmaps(it, niche, city));
  } else {
    const raw = await runApifyActor(ACTORS.instagram, {
      search: query,
      searchType: 'user',
      searchLimit: Math.min(limit, 100),
      resultsType: 'details',
      resultsLimit: limit
    });
    items = raw.map(it => normalizeInstagram(it, niche, city));
  }

  // Дедуплікація по телефону + тільки ті, кому можна подзвонити
  const seen = new Set();
  const withPhone = [];
  let skipped = 0;
  for (const b of items) {
    if (!b.phone) { skipped++; continue; }
    if (seen.has(b.phone)) continue;
    seen.add(b.phone);
    const { category, reason } = classifyBusiness(b);
    withPhone.push({ ...b, id: `b-${seen.size}`, category, reason, service: CATEGORIES[category].service });
  }

  updateJob(job.id, {
    status: 'done',
    finishedAt: new Date().toISOString(),
    total: withPhone.length,
    skippedNoPhone: skipped,
    groups: groupByCategory(withPhone)
  });
  console.log(`[Scraper] ✅ ${query}: ${withPhone.length} бізнесів з телефоном (відсіяно ${skipped})`);
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
      rows.push([b.phone, b.name, b.niche, b.service, b.reason, b.city, b.website, b.rating || '', b.reviews || '', b.source]
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
  form.append('caption', `📞 База для обдзвону (Vapi)\n${job.niche}${job.city ? ' · ' + job.city : ''}\n${label}: ${count} контактів`);
  form.append('document', new Blob([csv], { type: 'text/csv' }), csvFileName(job, category));

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, { method: 'POST', body: form });
  const json = await res.json();
  if (!json.ok) throw new Error(json.description || 'Telegram error');
  return { count };
}

