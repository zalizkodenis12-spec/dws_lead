import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { getPrimaryMtprotoClient } from '../parser/monitor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, '..', 'db');
const OUTREACH_DB_PATH = process.env.VERCEL
  ? '/tmp/dws-nfc-outreach.json'
  : path.join(DB_DIR, 'nfc-outreach.json');

const CLOUD_KV_STORE_ID = 'sJ4EPV4bcEMHAhMJi';
const CLOUD_OUTREACH_RECORD = 'nfc_outreach_state';
const DEFAULT_APIFY_TOKEN = Buffer.from('YXBpZnlfYXBpX1gzM1I4NEsyWDJia2ZNZjdYQWZrQ1R5RU1rblNiSTR4dXVmWA==', 'base64').toString('utf8');

function getCloudKvOutreachUrl() {
  const token = (process.env.APIFY_TOKEN || DEFAULT_APIFY_TOKEN || '').trim();
  if (!token) return '';
  return `https://api.apify.com/v2/key-value-stores/${CLOUD_KV_STORE_ID}/records/${CLOUD_OUTREACH_RECORD}?token=${encodeURIComponent(token)}`;
}

export const NFC_TG_CONFIRM_TEMPLATES = [
  "Доброго дня! Підкажіть, це заклад «{NAME}» з міста {CITY}?",
  "Добрий день! Скажіть, будь ласка, це «{NAME}» у місті {CITY}?",
  "Вітаю! Хочу уточнити, я правильно написав у заклад «{NAME}» ({CITY})?",
  "Доброго дня! Це актуальний контакт закладу «{NAME}» з м. {CITY}?",
  "Добрий день! Підкажіть, це ви — заклад «{NAME}» у місті {CITY}?",
  "Вітаю! Скажіть, будь ласка, чи правильно я звернувся до «{NAME}» з міста {CITY}?",
  "Доброго дня! Уточніть, будь ласка, це робочий контакт закладу «{NAME}» у м. {CITY}?",
  "Добрий день! Це заклад «{NAME}» з міста {CITY}, вірно?",
  "Вітаю! Підкажіть, чи це контакт закладу «{NAME}» у місті {CITY}?",
  "Доброго дня! Я на зв'язку із закладом «{NAME}» з м. {CITY}?"
];

export const NFC_IG_OFFER_TEMPLATES = [
  "Доброго дня! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво глянути?",
  "Доброго дня! Пишу вам із пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи було б цікаво поглянути?",
  "Доброго дня! Пишу з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, цікаво було б глянути?",
  "Добрий день! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво переглянути?",
  "Доброго дня! Пишу вам з пропозицією, що допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи цікаво було б глянути?",
  "Доброго дня! Пишу з пропозицією, що допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво поглянути?",
  "Добрий день! Пишу вам із пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи було б цікаво глянути?",
  "Доброго дня! Пишу вам з пропозицією, яка без реклами допоможе збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи цікаво глянути?",
  "Вітаю! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво глянути?",
  "Доброго дня! Звертаюсь до вас з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи було б цікаво глянути?"
];

const DEFAULT_OUTREACH_DB = {
  config: {
    warmupMode: 'warmup', // 'warmup' (10+10+30 = 50/day) | 'warmed' (20+20+30 = 70/day)
    tgIntervalMinutes: 10,
    igIntervalMinutes: 3,
    cooldownMinHours: 15,
    cooldownMaxHours: 20,
    accounts: {
      tg1: {
        id: 'tg1',
        label: 'Telegram Акаунт #1',
        handle: '@denis_nfc_developing',
        enabled: true,
        hasSession: true,
        dailyLimit: 10,
        sentToday: 0,
        lastSentAt: null
      },
      tg2: {
        id: 'tg2',
        label: 'Telegram Акаунт #2',
        handle: '@denis_DWS_owner',
        enabled: true,
        hasSession: true,
        dailyLimit: 10,
        sentToday: 0,
        lastSentAt: null,
        sessionString: ''
      },
      ig1: {
        id: 'ig1',
        label: 'Instagram Акаунт #1',
        handle: '@denis__zalizko',
        enabled: true,
        hasSession: true,
        dailyLimit: 30,
        sentToday: 0,
        lastSentAt: null,
        sessionCookie: ''
      }
    },
    tgTemplates: [...NFC_TG_CONFIRM_TEMPLATES],
    igTemplates: [...NFC_IG_OFFER_TEMPLATES]
  },
  activeJobId: null,
  campaigns: {},
  updatedAt: 0
};

let memoryState = null;
let primaryFallbackMtprotoClient = null;
let secondaryMtprotoClient = null;
let listenersAttached = { tg1: false, tg2: false };
let igBrowserInstance = null;
let igDispatchLock = false;

const WORD_BOUNDARY = (pattern) => new RegExp(`(?<!\\p{L})(?:${pattern})(?!\\p{L})`, 'iu');
const NEGATIVE_REPLY_REGEX = WORD_BOUNDARY(
  'ні|нi|нє|не+|нет|неа|ноу|no|не цікаво|нецікаво|не інтересно|не интересно|не треба|не потрібно|не нужно|не надо|не актуально|неактуально|не пишіть|не пишите|не турбуйте|не беспокойте|відпишіться|отпишитесь|спам|spam|стоп|stop|помилил\\p{L}*|помилка|ошиблис\\p{L}*|ошибка|не туди|не туда|це не ми|это не мы|не ми|не мы|не той|не тот|не працюємо|не работаем|закрил\\p{L}*|відмовля\\p{L}*|вже маємо|уже есть|дякую,? не|спасибо,? не'
);
const POSITIVE_REPLY_REGEX = WORD_BOUNDARY(
  'так|такк|та|ага|угу|да|дa|yes|ок|окей|ok|вірно|верно|правильно|саме так|именно|так точно|це ми|это мы|слухаю|слушаю|а що|а шо|а что|що саме|что именно|що хотіли|что хотели|чим можу допомогти|чем могу помочь|по якому питанню|по какому вопросу|в чому справа|цікаво|интересно|надсилайте|присылайте|скидайте|давайте|добрий день|доброго дня|вітаю|привіт'
);

export function classifyIncomingReplyText(text) {
  const clean = String(text || '').trim();
  if (!clean) return null;
  if (NEGATIVE_REPLY_REGEX.test(clean)) {
    return 'Ні / не цікаво';
  }
  if (POSITIVE_REPLY_REGEX.test(clean)) {
    return 'Так';
  }
  if (clean.length >= 2) {
    return 'Так';
  }
  return null;
}

function ensureDefaultHandles(state) {
  if (!state || !state.config || !state.config.accounts) return;
  const accs = state.config.accounts;
  if (accs.tg1) {
    if (!accs.tg1.handle) accs.tg1.handle = '@denis_nfc_developing';
    accs.tg1.hasSession = true;
  }
  if (accs.tg2) {
    if (!accs.tg2.handle) accs.tg2.handle = process.env.TELEGRAM_USERNAME_2 || '@denis_DWS_owner';
    accs.tg2.hasSession = true;
  }
  if (accs.ig1) {
    if (!accs.ig1.handle) accs.ig1.handle = process.env.INSTAGRAM_USERNAME || '@denis__zalizko';
    accs.ig1.hasSession = true;
  }
}

export function loadNfcOutreachDb() {
  if (memoryState) {
    ensureDefaultHandles(memoryState);
    return memoryState;
  }
  try {
    if (fs.existsSync(OUTREACH_DB_PATH)) {
      const raw = fs.readFileSync(OUTREACH_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      memoryState = {
        ...DEFAULT_OUTREACH_DB,
        ...parsed,
        config: {
          ...DEFAULT_OUTREACH_DB.config,
          ...(parsed.config || {}),
          accounts: {
            tg1: { ...DEFAULT_OUTREACH_DB.config.accounts.tg1, ...(parsed.config?.accounts?.tg1 || {}) },
            tg2: { ...DEFAULT_OUTREACH_DB.config.accounts.tg2, ...(parsed.config?.accounts?.tg2 || {}) },
            ig1: { ...DEFAULT_OUTREACH_DB.config.accounts.ig1, ...(parsed.config?.accounts?.ig1 || {}) }
          }
        },
        campaigns: parsed.campaigns || {}
      };
      ensureDefaultHandles(memoryState);
      return memoryState;
    }
  } catch (err) {
    console.warn('[NFC Outreach] Read DB warning:', err.message);
  }
  memoryState = JSON.parse(JSON.stringify(DEFAULT_OUTREACH_DB));
  ensureDefaultHandles(memoryState);
  return memoryState;
}

export function saveNfcOutreachDb(stateToSave = null, syncCloud = true) {
  if (stateToSave) memoryState = stateToSave;
  if (!memoryState) return;
  ensureDefaultHandles(memoryState);
  memoryState.updatedAt = Date.now();
  try {
    if (!process.env.VERCEL && !fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTREACH_DB_PATH, JSON.stringify(memoryState, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[NFC Outreach] Write DB warning:', err.message);
  }
  if (syncCloud) {
    pushNfcOutreachToCloud(memoryState).catch(() => {});
  }
}

export async function pushNfcOutreachToCloud(state = null) {
  const targetState = state || memoryState;
  if (!targetState) return false;
  const url = getCloudKvOutreachUrl();
  if (!url) return false;

  try {
    // Strip sensitive raw session strings before uploading to Cloud KV
    const sanitized = JSON.parse(JSON.stringify(targetState));
    if (sanitized.config?.accounts?.tg2) {
      delete sanitized.config.accounts.tg2.sessionString;
      sanitized.config.accounts.tg2.hasSession = true;
    }
    if (sanitized.config?.accounts?.ig1) {
      delete sanitized.config.accounts.ig1.sessionCookie;
      sanitized.config.accounts.ig1.hasSession = true;
    }
    if (sanitized.config?.accounts?.tg1) {
      sanitized.config.accounts.tg1.hasSession = true;
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(sanitized)
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

export async function syncNfcOutreachFromCloud() {
  const local = loadNfcOutreachDb();
  const url = getCloudKvOutreachUrl();
  if (!url) return local;

  try {
    const res = await fetch(`${url}&_t=${Date.now()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) return local;
    const cloud = await res.json().catch(() => null);
    if (!cloud || typeof cloud !== 'object') return local;

    // Merge config
    if (cloud.config) {
      if (cloud.config.warmupMode && (!local.updatedAt || (cloud.updatedAt || 0) >= (local.updatedAt || 0))) {
        local.config.warmupMode = cloud.config.warmupMode;
        const tgLimit = cloud.config.warmupMode === 'warmed' ? 20 : 10;
        local.config.accounts.tg1.dailyLimit = tgLimit;
        local.config.accounts.tg2.dailyLimit = tgLimit;
        local.config.accounts.ig1.dailyLimit = 30;
      }
      for (const accKey of ['tg1', 'tg2', 'ig1']) {
        const cAcc = cloud.config.accounts?.[accKey];
        const lAcc = local.config.accounts?.[accKey];
        if (cAcc && lAcc) {
          if (cAcc.handle) lAcc.handle = cAcc.handle;
          if ((cAcc.sentToday || 0) > (lAcc.sentToday || 0)) {
            lAcc.sentToday = cAcc.sentToday;
          }
          if (cAcc.lastSentAt && (!lAcc.lastSentAt || new Date(cAcc.lastSentAt) > new Date(lAcc.lastSentAt))) {
            lAcc.lastSentAt = cAcc.lastSentAt;
          }
        }
      }
    }

    if (cloud.activeJobId && !local.activeJobId) {
      local.activeJobId = cloud.activeJobId;
    } else if (cloud.updatedAt && (!local.updatedAt || cloud.updatedAt > local.updatedAt)) {
      local.activeJobId = cloud.activeJobId;
    }

    // Merge campaigns
    if (cloud.campaigns && typeof cloud.campaigns === 'object') {
      if (!local.campaigns) local.campaigns = {};
      for (const [jobId, cCamp] of Object.entries(cloud.campaigns)) {
        if (!cCamp || typeof cCamp !== 'object') continue;
        const lCamp = local.campaigns[jobId];
        if (!lCamp) {
          local.campaigns[jobId] = cCamp;
          continue;
        }

        const cloudNewer = (cCamp.updatedAt || cloud.updatedAt || 0) >= (lCamp.updatedAt || local.updatedAt || 0);
        if (cloudNewer && cCamp.status) {
          lCamp.status = cCamp.status;
          lCamp.currentStage = cCamp.currentStage || lCamp.currentStage;
          lCamp.nextSendAt = cCamp.nextSendAt !== undefined ? cCamp.nextSendAt : lCamp.nextSendAt;
          lCamp.cooldownUntil = cCamp.cooldownUntil !== undefined ? cCamp.cooldownUntil : lCamp.cooldownUntil;
        }
        if (cCamp.forceImmediateSend) {
          lCamp.forceImmediateSend = true;
        }

        // Merge items by id
        const lItemsById = new Map((lCamp.items || []).map(it => [String(it.id), it]));
        const cItems = Array.isArray(cCamp.items) ? cCamp.items : [];
        if (lCamp.items && lCamp.items.length > 0) {
          for (const cIt of cItems) {
            const lIt = lItemsById.get(String(cIt.id));
            if (!lIt) {
              lCamp.items.push(cIt);
              continue;
            }
            // If either side marked item as sent, preserve sent state
            if (cIt.sendState === 'sent' && lIt.sendState !== 'sent') {
              Object.assign(lIt, cIt);
            } else if (lIt.sendState === 'sent' && cIt.sendState === 'sent') {
              if (cIt.result && cIt.result !== 'Ігнор / не відповідає' && cIt.result !== 'Пошук контактів...') {
                lIt.result = cIt.result;
              }
              if (cIt.lastReplyText) lIt.lastReplyText = cIt.lastReplyText;
              if (cIt.repliedAt) lIt.repliedAt = cIt.repliedAt;
            } else if ((cIt.discoveryState === 'found' || cIt.discoveryState === 'not_found') && lIt.discoveryState === 'pending') {
              Object.assign(lIt, cIt);
            } else if (cloudNewer && cIt.result && cIt.result !== lIt.result && !(lIt.discoveryState === 'found' && cIt.discoveryState === 'pending')) {
              lIt.result = cIt.result;
            }
          }
        } else if (cItems.length > 0) {
          lCamp.items = cItems;
        }
      }
    }

    ensureDefaultHandles(local);
    saveNfcOutreachDb(local, false);
    return local;
  } catch (_) {
    return local;
  }
}

export function computeCooldownDurationMs() {
  const now = new Date();
  const kyivHour = (now.getUTCHours() + 2) % 24;
  let hoursToWait = 18;
  if (kyivHour >= 14 && kyivHour <= 23) {
    hoursToWait = (24 - kyivHour) + 10;
  } else {
    hoursToWait = 16 + Math.random() * 3;
  }
  const clampedHours = Math.max(15, Math.min(20, hoursToWait));
  return Math.round(clampedHours * 60 * 60 * 1000);
}

export function normalizeVenueContacts(venue) {
  const cleanTgRaw = String(venue.telegram || '')
    .replace(/^https?:\/\/(www\.)?t\.me\//i, '')
    .replace(/^@+/, '')
    .replace(/[\/?#].*$/, '')
    .trim();

  const cleanInstaRaw = String(venue.instagram || '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/[\/?#].*$/, '')
    .trim();

  const digits = String(venue.phone || '').replace(/\D/g, '');
  let cleanPhone380 = '';
  if (digits.length === 10 && digits.startsWith('0')) {
    cleanPhone380 = '+38' + digits;
  } else if (digits.length === 12 && digits.startsWith('380')) {
    cleanPhone380 = '+' + digits;
  } else if (digits.length === 9) {
    cleanPhone380 = '+380' + digits;
  }

  const isUaMobile = /^\+380(50|66|95|99|67|68|96|97|98|77|63|73|93)\d{7}$/.test(cleanPhone380);
  const tgTarget = cleanTgRaw
    ? ('@' + cleanTgRaw)
    : (isUaMobile ? cleanPhone380 : '');
  const igTarget = cleanInstaRaw ? ('@' + cleanInstaRaw) : '';

  return {
    tgTarget,
    igTarget,
    hasTg: Boolean(tgTarget),
    hasIg: Boolean(igTarget),
    displayHandle: tgTarget || igTarget || cleanPhone380 || '—'
  };
}

export function buildMessageForVenue(venueName, city, channel, templateIdx, state) {
  const cleanName = String(venueName || 'Заклад').trim();
  const cleanCity = String(city || 'Київ').trim();
  if (channel === 'telegram') {
    const list = (Array.isArray(state?.config?.tgTemplates) && state.config.tgTemplates.length > 0)
      ? state.config.tgTemplates
      : NFC_TG_CONFIRM_TEMPLATES;
    const raw = list[templateIdx % list.length] || NFC_TG_CONFIRM_TEMPLATES[0];
    return raw.replace(/\{NAME\}/gi, cleanName).replace(/\{CITY\}/gi, cleanCity);
  } else {
    const list = (Array.isArray(state?.config?.igTemplates) && state.config.igTemplates.length > 0)
      ? state.config.igTemplates
      : NFC_IG_OFFER_TEMPLATES;
    const raw = list[templateIdx % list.length] || NFC_IG_OFFER_TEMPLATES[0];
    return raw.replace(/\{NAME\}/gi, cleanName).replace(/\{CITY\}/gi, cleanCity);
  }
}

export function createOrUpdateCampaign(jobData, startImmediately = true) {
  const state = loadNfcOutreachDb();
  const jobId = String(jobData?.id || '').trim();
  if (!jobId) throw new Error('Не вказано ID збору NFC');

  const city = String(jobData.city || 'Київ').trim();
  const title = String(jobData.cluster || jobData.niche || jobData.categoryLabel || jobData.query || 'Заклади NFC').trim();
  const venues = Array.isArray(jobData.items) ? jobData.items : [];

  let campaign = state.campaigns[jobId];
  const existingById = new Map();
  if (campaign && Array.isArray(campaign.items)) {
    campaign.items.forEach(it => existingById.set(String(it.id), it));
  }

  const items = [];
  venues.forEach((v, idx) => {
    const vid = String(v.id || `v_${idx}`);
    if (existingById.has(vid)) {
      const ex = existingById.get(vid);
      // Reset failed items back to queued if user restarts campaign
      if (startImmediately && ex.sendState === 'failed') {
        ex.sendState = 'queued';
        ex.result = 'Ігнор / не відповідає';
      }
      items.push(ex);
      return;
    }

    const contacts = normalizeVenueContacts(v);
    if (!contacts.hasTg && !contacts.hasIg) return;

    const preferredChannel = contacts.hasTg ? 'telegram' : 'instagram';
    const displayUsername = preferredChannel === 'telegram' ? contacts.tgTarget : contacts.igTarget;

    items.push({
      id: vid,
      name: String(v.name || 'Заклад').trim(),
      city,
      username: displayUsername,
      tgTarget: contacts.tgTarget,
      igTarget: contacts.igTarget,
      channel: preferredChannel,
      accountId: '',
      accountLabel: '',
      templateIndex: idx % 10,
      messageSent: '',
      sendState: 'queued', // 'queued' | 'sent' | 'skipped' | 'failed'
      sentAt: null,
      peerId: '',
      result: 'Ігнор / не відповідає',
      lastReplyText: '',
      repliedAt: null
    });
  });

  if (!campaign) {
    campaign = {
      jobId,
      title,
      city,
      createdAt: new Date().toISOString(),
      updatedAt: Date.now(),
      status: startImmediately ? 'running' : 'idle',
      currentStage: 'tg1',
      nextSendAt: startImmediately ? Date.now() + 1000 : null,
      cooldownUntil: null,
      forceImmediateSend: Boolean(startImmediately),
      items
    };
  } else {
    campaign.title = title;
    campaign.city = city;
    if (items.length > 0) {
      campaign.items = items;
    }
    campaign.updatedAt = Date.now();
    if (startImmediately) {
      if (campaign.status === 'cooldown' && campaign.cooldownUntil && campaign.cooldownUntil > Date.now()) {
        // Keep active cooldown
      } else {
        campaign.status = 'running';
        campaign.forceImmediateSend = true;
        if (!campaign.nextSendAt || campaign.nextSendAt < Date.now()) {
          campaign.nextSendAt = Date.now() + 1000;
        }
      }
    }
  }

  state.campaigns[jobId] = campaign;
  if (startImmediately) {
    state.activeJobId = jobId;
  }
  saveNfcOutreachDb(state);
  return campaign;
}

export function createOrUpdateCustomCampaign(payload = {}, startImmediately = true) {
  const state = loadNfcOutreachDb();
  const jobId = String(payload.jobId || payload.id || `nfc_custom_${Date.now()}`).trim();
  const city = String(payload.city || '').trim();
  const rawNames = Array.isArray(payload.names)
    ? payload.names
    : (Array.isArray(payload.items) ? payload.items.map(i => i?.name).filter(Boolean) : []);
  const cleanNames = [];
  const seenLower = new Set();
  for (const raw of rawNames) {
    const clean = String(raw || '').replace(/^\s*(?:[-•*]|\d+[.)])\s*/, '').trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seenLower.has(key)) continue;
    seenLower.add(key);
    cleanNames.push(clean);
  }
  if (cleanNames.length === 0) {
    throw new Error('Додайте хоча б одну назву закладу');
  }

  const title = String(payload.title || `Власний список (${cleanNames.length})`).trim();
  const incomingItems = Array.isArray(payload.items) ? payload.items : [];

  const items = cleanNames.map((name, idx) => {
    const inc = incomingItems[idx] || {};
    const vid = String(inc.id || `custom_${jobId}_${idx}`);
    const contacts = normalizeVenueContacts(inc);
    const alreadyFound = contacts.hasTg || contacts.hasIg;
    const preferredChannel = contacts.hasTg ? 'telegram' : (contacts.hasIg ? 'instagram' : 'pending');
    const displayUsername = alreadyFound
      ? (preferredChannel === 'telegram' ? contacts.tgTarget : contacts.igTarget)
      : 'Пошук TG/IG...';

    return {
      id: vid,
      name,
      city: city || inc.city || '',
      username: displayUsername,
      tgTarget: contacts.tgTarget || '',
      igTarget: contacts.igTarget || '',
      phone: inc.phone || '',
      website: inc.website || '',
      channel: preferredChannel,
      needsDiscovery: !alreadyFound,
      discoveryState: alreadyFound ? 'found' : 'pending',
      accountId: '',
      accountLabel: '',
      templateIndex: idx % 10,
      messageSent: '',
      sendState: 'queued',
      sentAt: null,
      peerId: '',
      result: alreadyFound ? 'Ігнор / не відповідає' : 'Пошук контактів...',
      lastReplyText: '',
      repliedAt: null
    };
  });

  const campaign = {
    jobId,
    title,
    city: city || 'Україна',
    isCustomList: true,
    createdAt: new Date().toISOString(),
    updatedAt: Date.now(),
    status: startImmediately ? 'running' : 'idle',
    currentStage: 'tg1',
    nextSendAt: startImmediately ? Date.now() + 1000 : null,
    cooldownUntil: null,
    forceImmediateSend: Boolean(startImmediately),
    items
  };

  state.campaigns[jobId] = campaign;
  if (startImmediately) {
    state.activeJobId = jobId;
  }
  saveNfcOutreachDb(state);
  return campaign;
}

export function finishOutreachCampaign(jobId) {
  const state = loadNfcOutreachDb();
  const camp = state.campaigns[String(jobId)];
  if (!camp) return null;
  camp.status = 'completed';
  camp.currentStage = 'done';
  camp.nextSendAt = null;
  camp.cooldownUntil = null;
  camp.forceImmediateSend = false;
  camp.updatedAt = Date.now();
  if (String(state.activeJobId) === String(jobId)) {
    state.activeJobId = null;
  }
  saveNfcOutreachDb(state);
  return camp;
}

export function updateOutreachConfig(updates = {}) {
  const state = loadNfcOutreachDb();
  const cfg = state.config;

  if (updates.warmupMode === 'warmup' || updates.warmupMode === 'warmed') {
    cfg.warmupMode = updates.warmupMode;
    const tgLimit = updates.warmupMode === 'warmed' ? 20 : 10;
    cfg.accounts.tg1.dailyLimit = tgLimit;
    cfg.accounts.tg2.dailyLimit = tgLimit;
    cfg.accounts.ig1.dailyLimit = 30;
  }

  if (updates.tgIntervalMinutes !== undefined) {
    cfg.tgIntervalMinutes = Math.max(1, Number(updates.tgIntervalMinutes) || 10);
  }
  if (updates.igIntervalMinutes !== undefined) {
    cfg.igIntervalMinutes = Math.max(1, Number(updates.igIntervalMinutes) || 3);
  }

  if (updates.accounts && typeof updates.accounts === 'object') {
    for (const key of ['tg1', 'tg2', 'ig1']) {
      if (updates.accounts[key]) {
        const inc = updates.accounts[key];
        cfg.accounts[key] = {
          ...cfg.accounts[key],
          ...inc,
          handle: inc.handle || cfg.accounts[key].handle
        };
      }
    }
  }

  if (Array.isArray(updates.tgTemplates) && updates.tgTemplates.length === 10) {
    cfg.tgTemplates = updates.tgTemplates.map(s => String(s || '').trim());
  }
  if (Array.isArray(updates.igTemplates) && updates.igTemplates.length === 10) {
    cfg.igTemplates = updates.igTemplates.map(s => String(s || '').trim());
  }

  ensureDefaultHandles(state);
  saveNfcOutreachDb(state);
  return cfg;
}

async function getMtprotoClientForAccount(accountId) {
  const state = loadNfcOutreachDb();
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = String(process.env.TELEGRAM_API_HASH || '').trim();

  if (accountId === 'tg1') {
    const primary = getPrimaryMtprotoClient();
    if (primary && primary.connected) {
      attachRealtimeReplyListener(primary, 'tg1');
      primary.getMe().then(me => {
        if (me?.username && state.config?.accounts?.tg1) {
          state.config.accounts.tg1.handle = '@' + me.username;
        }
      }).catch(() => {});
      return primary;
    }

    if (primaryFallbackMtprotoClient && primaryFallbackMtprotoClient.connected) {
      attachRealtimeReplyListener(primaryFallbackMtprotoClient, 'tg1');
      return primaryFallbackMtprotoClient;
    }

    const sess1 = process.env.TELEGRAM_SESSION || process.env.TELEGRAM_SESSION_STRING || '';
    if (!sess1 || !apiId || !apiHash) return null;

    try {
      const { TelegramClient } = await import('telegram');
      const { StringSession } = await import('telegram/sessions/index.js');
      const client1 = new TelegramClient(new StringSession(sess1), apiId, apiHash, {
        connectionRetries: 3
      });
      await client1.connect();
      primaryFallbackMtprotoClient = client1;
      attachRealtimeReplyListener(client1, 'tg1');
      client1.getMe().then(me => {
        if (me?.username && state.config?.accounts?.tg1) {
          state.config.accounts.tg1.handle = '@' + me.username;
          saveNfcOutreachDb(state);
        }
      }).catch(() => {});
      return client1;
    } catch (err) {
      console.warn('[NFC Outreach] TG #1 fallback connect error:', err.message);
      return null;
    }
  }

  if (accountId === 'tg2') {
    const sess2 = state.config.accounts.tg2?.sessionString || process.env.TELEGRAM_SESSION_2 || '';
    const apiId2 = Number(process.env.TELEGRAM_API_ID_2 || apiId);
    const apiHash2 = String(process.env.TELEGRAM_API_HASH_2 || apiHash).trim();
    if (!sess2 || !apiId2 || !apiHash2) return null;

    if (secondaryMtprotoClient && secondaryMtprotoClient.connected) {
      attachRealtimeReplyListener(secondaryMtprotoClient, 'tg2');
      return secondaryMtprotoClient;
    }
    try {
      const { TelegramClient } = await import('telegram');
      const { StringSession } = await import('telegram/sessions/index.js');
      const client2 = new TelegramClient(new StringSession(sess2), apiId2, apiHash2, {
        connectionRetries: 5
      });
      await client2.connect();
      secondaryMtprotoClient = client2;
      attachRealtimeReplyListener(client2, 'tg2');
      client2.getMe().then(me => {
        if (me?.username && state.config?.accounts?.tg2) {
          state.config.accounts.tg2.handle = '@' + me.username;
          saveNfcOutreachDb(state);
        }
      }).catch(() => {});
      return client2;
    } catch (err) {
      console.warn('[NFC Outreach] TG #2 connect error:', err.message);
      return null;
    }
  }
  return null;
}

async function attachRealtimeReplyListener(client, accountKey) {
  if (!client || listenersAttached[accountKey]) return;
  try {
    const { NewMessage } = await import('telegram/events/index.js');
    listenersAttached[accountKey] = true;

    client.addEventHandler(async (event) => {
      try {
        const msg = event.message;
        if (!msg || msg.out || !event.isPrivate) return;
        const text = String(msg.message || '').trim();
        if (!text) return;

        const sender = await msg.getSender().catch(() => null);
        const senderId = String(msg.senderId || sender?.id || '');
        const senderUsername = sender?.username ? ('@' + sender.username.toLowerCase()) : '';
        const senderPhone = sender?.phone ? ('+' + String(sender.phone).replace(/\D/g, '')) : '';

        handleIncomingLeadReply({
          peerId: senderId,
          username: senderUsername,
          phone: senderPhone,
          text
        });
      } catch (_) {}
    }, new NewMessage({ incoming: true }));
  } catch (err) {
    listenersAttached[accountKey] = false;
  }
}

export function handleIncomingLeadReply({ peerId = '', username = '', phone = '', text = '' }) {
  const state = loadNfcOutreachDb();
  const classification = classifyIncomingReplyText(text);
  if (!classification) return false;

  const normUser = String(username || '').toLowerCase().replace(/^@+/, '').trim();
  const normPhone = String(phone || '').replace(/\D/g, '');
  let updatedAny = false;

  for (const camp of Object.values(state.campaigns || {})) {
    for (const item of (camp.items || [])) {
      if (item.sendState !== 'sent') continue;
      const itemUser = String(item.username || '').toLowerCase().replace(/^@+/, '').trim();
      const itemTg = String(item.tgTarget || '').toLowerCase().replace(/^@+/, '').trim();
      const itemIg = String(item.igTarget || '').toLowerCase().replace(/^@+/, '').trim();
      const itemDigits = String(item.tgTarget || item.username || '').replace(/\D/g, '');

      const matchByPeer = peerId && item.peerId && String(item.peerId) === String(peerId);
      const matchByUser = normUser && (itemUser === normUser || itemTg === normUser || itemIg === normUser);
      const matchByPhone = normPhone && normPhone.length >= 9 && itemDigits.endsWith(normPhone.slice(-9));

      if (matchByPeer || matchByUser || matchByPhone) {
        item.result = classification;
        item.lastReplyText = String(text || '').slice(0, 300);
        item.repliedAt = new Date().toISOString();
        camp.updatedAt = Date.now();
        updatedAny = true;
      }
    }
  }

  if (updatedAny) {
    saveNfcOutreachDb(state);
  }
  return updatedAny;
}

async function dispatchTelegramMessageMtproto(accountId, item, messageText) {
  const client = await getMtprotoClientForAccount(accountId);
  if (!client) {
    return { sentViaMtproto: false, reason: 'no_client', peerId: '' };
  }

  try {
    const { Api } = await import('telegram');
    const target = String(item.tgTarget || item.username || '').trim();
    if (!target) return { sentViaMtproto: false, reason: 'no_target', peerId: '' };

    let entity = null;
    const isPhone = target.startsWith('+') || /^\d{9,15}$/.test(target.replace(/[\s()-]/g, ''));
    if (isPhone) {
      let normPhone = target.replace(/[\s()-]/g, '');
      if (normPhone.startsWith('0') && normPhone.length === 10) normPhone = '+38' + normPhone;
      else if (!normPhone.startsWith('+')) normPhone = '+' + normPhone;

      try {
        const importRes = await client.invoke(
          new Api.contacts.ImportContacts({
            contacts: [
              new Api.InputPhoneContact({
                clientId: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
                phone: normPhone,
                firstName: String(item.name || 'Заклад').slice(0, 30),
                lastName: String(item.city || '').slice(0, 30)
              })
            ]
          })
        );
        if (importRes?.users?.length > 0) {
          entity = importRes.users[0];
        }
      } catch (_) {}
      if (!entity) {
        entity = await client.getEntity(normPhone).catch(() => null);
      }
    } else {
      const cleanHandle = target.replace(/^@+/, '').split(/[/?#]/)[0].trim();
      entity = await client.getEntity(cleanHandle).catch(() => null);
    }

    if (!entity) {
      return { sentViaMtproto: false, reason: 'entity_not_found', peerId: '' };
    }

    const sentMsg = await client.sendMessage(entity, { message: messageText });
    return {
      sentViaMtproto: true,
      peerId: String(entity.id || sentMsg?.peerId?.userId || '')
    };
  } catch (err) {
    console.warn(`[NFC Outreach] MTProto send warning (${accountId} -> ${item.username}):`, err.message);
    return { sentViaMtproto: false, reason: 'send_error', peerId: '', error: err.message };
  }
}

function findLocalBrowserPath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function dispatchInstagramDirectMessage(item, messageText) {
  if (process.env.VERCEL) {
    return { sentViaApi: false, reason: 'no_client' };
  }

  const state = loadNfcOutreachDb();
  const sessionCookie = state.config.accounts.ig1?.sessionCookie || process.env.INSTAGRAM_SESSION_COOKIE || '';
  if (!sessionCookie) {
    return { sentViaApi: false, reason: 'no_client' };
  }

  const rawHandle = String(item.igTarget || item.username || '').replace(/^@+/, '').split(/[/?#]/)[0].trim();
  if (!rawHandle) return { sentViaApi: false, reason: 'no_target_handle' };

  const chromePath = findLocalBrowserPath();
  if (!chromePath) {
    return { sentViaApi: false, reason: 'no_client' };
  }

  while (igDispatchLock) {
    await new Promise(r => setTimeout(r, 500));
  }
  igDispatchLock = true;

  let page = null;
  try {
    const puppeteer = await import('puppeteer-core');
    if (!igBrowserInstance || !igBrowserInstance.connected) {
      igBrowserInstance = await puppeteer.default.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--lang=uk-UA,uk']
      });
    }

    page = await igBrowserInstance.newPage();
    await page.setViewport({ width: 1280, height: 840 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

    const sessVal = sessionCookie.replace(/^.*sessionid=/, '').split(';')[0].trim();
    const dsUserId = decodeURIComponent(sessVal).match(/^(\d+):/)?.[1] || '67526535310';

    await page.setCookie(
      { name: 'sessionid', value: sessVal, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
      { name: 'ds_user_id', value: dsUserId, domain: '.instagram.com', path: '/', secure: true }
    );

    await page.goto(`https://www.instagram.com/${encodeURIComponent(rawHandle)}/`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await new Promise(r => setTimeout(r, 3500));

    const html = await page.content();
    const targetUserId = html.match(/"profilePage_(\d+)"/)?.[1] || rawHandle;

    // Check if profile does not exist
    const isNotFound = await page.evaluate(() => {
      const txt = document.body?.innerText || '';
      return txt.includes("Sorry, this page isn't available") || txt.includes('На жаль, ця сторінка недоступна');
    });
    if (isNotFound) {
      await page.close().catch(() => {});
      return { sentViaApi: false, reason: 'user_not_found' };
    }

    // Dismiss any "Not Now" / "Не зараз" popup if shown
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const dismiss = btns.find(b => /^(Не зараз|Not Now)$/i.test((b.innerText || '').trim()));
      if (dismiss) dismiss.click();
    });

    // Click "Повідомлення" / "Message" inside profile header
    const clickedProfileMsg = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('header div[role="button"], header button, main header div[role="button"]'));
      const btn = candidates.find(el => /^(Повідомлення|Message|Send message|Написати)$/i.test((el.innerText || '').trim()));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!clickedProfileMsg) {
      // Fallback: open Direct inbox and start thread via New Message dialog
      await page.goto('https://www.instagram.com/direct/inbox/', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      await new Promise(r => setTimeout(r, 3500));

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button, div[role="button"]'));
        const dismiss = btns.find(b => /^(Не зараз|Not Now)$/i.test((b.innerText || '').trim()));
        if (dismiss) dismiss.click();
      });

      const openedModal = await page.evaluate(() => {
        const svgs = Array.from(document.querySelectorAll('svg[aria-label="Нове повідомлення"], svg[aria-label="New message"]'));
        if (svgs.length > 0) {
          const parentBtn = svgs[0].closest('div[role="button"], button') || svgs[0].parentElement;
          if (parentBtn) {
            parentBtn.click();
            return true;
          }
        }
        return false;
      });

      if (openedModal) {
        await new Promise(r => setTimeout(r, 1500));
        const searchInput = await page.$('div[role="dialog"] input');
        if (searchInput) {
          await searchInput.click();
          await searchInput.type(rawHandle, { delay: 45 });
          await new Promise(r => setTimeout(r, 2500));
          await page.evaluate((handle) => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) return;
            const rows = Array.from(dialog.querySelectorAll('div[role="button"], button, span'));
            const match = rows.find(r => (r.innerText || '').toLowerCase().includes(handle.toLowerCase()));
            if (match) match.click();
          }, rawHandle);
          await new Promise(r => setTimeout(r, 1000));
          await page.evaluate(() => {
            const dialog = document.querySelector('div[role="dialog"]');
            if (!dialog) return;
            const btns = Array.from(dialog.querySelectorAll('div[role="button"], button'));
            const chatBtn = btns.find(b => /^(Чат|Chat)$/i.test((b.innerText || '').trim()));
            if (chatBtn) chatBtn.click();
          });
        }
      }
    }

    // Wait for DM textbox
    const textboxSelector = 'div[role="textbox"][contenteditable="true"]';
    await page.waitForSelector(textboxSelector, { timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    await page.click(textboxSelector);
    const lines = String(messageText || '').split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) {
        await page.keyboard.type(lines[i], { delay: 15 });
      }
      if (i < lines.length - 1) {
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
      }
    }
    await new Promise(r => setTimeout(r, 400));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 2800));

    await page.close().catch(() => {});
    return { sentViaApi: true, targetUserId: String(targetUserId) };
  } catch (err) {
    console.warn(`[NFC Outreach] Instagram DM error (@${rawHandle}):`, err.message);
    if (page) await page.close().catch(() => {});
    return { sentViaApi: false, reason: 'send_error', error: err.message };
  } finally {
    igDispatchLock = false;
  }
}

const UA_STOP_WORDS = new Set([
  'кафе', 'кавярня', 'кав\'ярня', 'ресторан', 'бар', 'паб', 'піцерія', 'піца',
  'суші', 'клуб', 'салон', 'студія', 'клініка', 'стоматологія', 'магазин',
  'крамниця', 'заклад', 'пекарня', 'кондитерська', 'барбершоп', 'офіс',
  'м', 'місто', 'city', 'cafe', 'coffee', 'bar', 'restaurant', 'studio', 'shop', 'club', 'the', 'and', 'for'
]);

const CYR_TO_LAT_MAP = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e',
  'є': 'ye', 'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y',
  'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya',
  'ы': 'y', 'э': 'e', 'ё': 'yo', 'ъ': ''
};

function transliterateToLat(str) {
  return String(str || '')
    .toLowerCase()
    .split('')
    .map(ch => (CYR_TO_LAT_MAP[ch] !== undefined ? CYR_TO_LAT_MAP[ch] : ch))
    .join('');
}

function getVenueMatchTokens(venueName) {
  const clean = String(venueName || '').toLowerCase().replace(/["'«»ʼ`]/g, ' ');
  const words = clean.split(/[\s,.\-_/|()]+/).filter(Boolean);
  let sigWords = words.filter(w => w.length >= 3 && !UA_STOP_WORDS.has(w));
  if (sigWords.length === 0) sigWords = words.filter(w => w.length >= 2);

  const tokens = new Set();
  for (const w of sigWords) {
    tokens.add(w);
    const tr = transliterateToLat(w).replace(/[^a-z0-9]/g, '');
    if (tr.length >= 3) {
      tokens.add(tr);
      tokens.add(tr.replace(/kh/g, 'h').replace(/ye/g, 'e').replace(/yi/g, 'i').replace(/yi/g, 'y'));
      tokens.add(tr.replace(/o/g, 'e'));
    }
  }
  const joinedLat = transliterateToLat(sigWords.join('')).replace(/[^a-z0-9]/g, '');
  if (joinedLat.length >= 4) tokens.add(joinedLat);
  return Array.from(tokens).filter(t => t.length >= 3);
}

function scoreCandidateRelevance(candidateText, venueName) {
  const tokens = getVenueMatchTokens(venueName);
  if (tokens.length === 0) return 0;
  const hay = String(candidateText || '').toLowerCase().replace(/["'«»ʼ`._\-]/g, '');
  const hayLat = transliterateToLat(candidateText).toLowerCase().replace(/[^a-z0-9]/g, '');
  let score = 0;
  for (const t of tokens) {
    const cleanT = t.replace(/[^a-zа-яіїєґ0-9]/g, '');
    if (cleanT.length < 3) continue;
    if (hay.includes(cleanT) || hayLat.includes(cleanT)) {
      score += cleanT.length;
    }
  }
  return score;
}

const CITY_ALIASES_MAP = {
  'вінниц': ['вінниця', 'вінниці', 'вінницьк', 'винница', 'виннице', 'vinnytsia', 'vinnitsa', 'vinnytsa', 'vinn', '_vin', '.vin', '_vn', '.vn'],
  'київ': ['київ', 'києві', 'києва', 'киев', 'киеве', 'kyiv', 'kiev'],
  'львів': ['львів', 'львові', 'львова', 'львов', 'lviv', 'lvov'],
  'одес': ['одеса', 'одесі', 'одесса', 'odesa', 'odessa'],
  'дніпр': ['дніпро', 'дніпрі', 'днепр', 'dnipro', 'dnepr'],
  'харків': ['харків', 'харкові', 'харьков', 'kharkiv', 'kharkov'],
  'хмельниц': ['хмельницьк', 'хмельницк', 'khmelnytskyi', 'khmelnitsky'],
  'житомир': ['житомир', 'zhytomyr', 'zhitomir'],
  'терноп': ['тернопіль', 'тернополі', 'тернополь', 'ternopil'],
  'черкас': ['черкаси', 'черкасах', 'черкассы', 'cherkasy'],
  'полтав': ['полтава', 'полтаві', 'полтаве', 'poltava'],
  'рівн': ['рівне', 'рівному', 'ровно', 'rivne'],
  'франків': ['івано-франківськ', 'франківськ', 'ivano-frankivsk', 'frankivsk'],
  'чернівц': ['чернівці', 'чернівцях', 'черновцы', 'chernivtsi'],
  'луцьк': ['луцьк', 'луцк', 'lutsk'],
  'ужгород': ['ужгород', 'uzhhorod', 'uzhgorod']
};

function getCityVariants(city) {
  const c = String(city || '').toLowerCase().trim();
  if (!c || c === 'україна' || c === 'власний список') return [];
  for (const [root, aliases] of Object.entries(CITY_ALIASES_MAP)) {
    if (c.includes(root) || aliases.some(a => a.length >= 4 && c.includes(a))) {
      return aliases;
    }
  }
  const lat = transliterateToLat(c).replace(/[^a-z0-9]/g, '');
  const list = [c];
  if (c.length >= 5) list.push(c.slice(0, -1));
  if (lat.length >= 4) list.push(lat);
  return Array.from(new Set(list));
}

function textMatchesCity(text, targetCity) {
  const variants = getCityVariants(targetCity);
  if (variants.length === 0) return false;
  const hay = String(text || '').toLowerCase();
  const hayLat = transliterateToLat(hay);
  return variants.some(v => hay.includes(v) || (v.length >= 4 && hayLat.includes(v)));
}

function hasForeignCityMismatch(text, targetCity) {
  const variants = getCityVariants(targetCity);
  if (variants.length === 0) return false;
  if (textMatchesCity(text, targetCity)) return false;
  const hay = String(text || '').toLowerCase();
  for (const [root, aliases] of Object.entries(CITY_ALIASES_MAP)) {
    if (variants.some(v => v.includes(root) || aliases.includes(v))) continue;
    // Match explicit full city names/roots (skip short handle-only suffixes like _vin/.vn)
    const explicitHit = aliases.some(a => a.length >= 4 && !a.startsWith('_') && !a.startsWith('.') && hay.includes(a));
    if (explicitHit) return true;
  }
  return false;
}

const NOISE_PROFILE_RE = /(новини|тривог|світло|подслушано|підслухано|афіша|барахолка|огляди|блогер|відгуки|каталог заклад|vgorode|vinbazar|afisha|truexa|typical_|podslushano|foodblog|food_blog|guidenet|work_|robota_|vakans|rabota|реклама в |туристичн|офіс туризму)/i;
const BOT_OR_SPAM_TG_RE = /(казино|ставк|крипт|crypto|vip signal|інтим|escort|арбітраж|гарант|реклама і співпраця лише)/i;
const VENUE_BUSINESS_SIGNAL_RE = /(ресторан|кафе|кав['’ʼ]?ярн|кофейн|бар|паб|піц|суші|салон|студія|барбер|стоматолог|клініка|бронь|резерв|заброн|меню|доставк|вул\.|просп\.|пров\.|графік|щодня|запис|direct|по замовленн|заклад|кухня|гостей|готель|рецепц|адмін)/i;

const IG_RESERVED_PATHS = new Set([
  'explore', 'p', 'reels', 'reel', 'stories', 'direct', 'accounts', 'tags', 'tv', 'locations', 'directory', 'about', 'legal', 'popular', 'share'
]);

const TG_RESERVED_PATHS = new Set([
  's', 'joinchat', 'addstickers', 'share', 'iv', 'proxy', 'socks', 'setlanguage', 'addlist', 'boost', 'c'
]);

const BIO_LINK_DOMAINS_RE = /https?:\/\/(?:www\.)?(?:linktr\.ee|taplink\.cc|mssg\.me|hipolink\.me|beacons\.ai|bento\.me|campsite\.bio|bio\.link)\/[a-zA-Z0-9._-]+/gi;

function extractPhonesFromText(str) {
  const out = new Set();
  const s = String(str || '');
  const matches = s.matchAll(/(?:\+?38[\s\-()]*)?0[\s\-()]*\d{2}[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/g);
  for (const m of matches) {
    const digits = m[0].replace(/\D/g, '');
    const norm = digits.startsWith('380') ? digits : (digits.startsWith('0') ? ('38' + digits) : '');
    if (norm.length === 12 && norm.startsWith('380')) {
      out.add('+' + norm);
    }
  }
  return Array.from(out);
}

function isUkrainianMobileNormalized(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return /^380(50|63|66|67|68|73|75|77|89|91|92|93|94|95|96|97|98|99)\d{7}$/.test(digits);
}

function extractSocialHandlesFromHtml(html, baseUrl = '') {
  const igSet = new Set();
  const tgSet = new Set();
  const linktreeSet = new Set();
  const str = String(html || '');

  for (const m of str.matchAll(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{2,30})/gi)) {
    const h = m[1].replace(/[\/?#&"'<>].*$/, '').trim().toLowerCase();
    if (h && !IG_RESERVED_PATHS.has(h) && !h.endsWith('.js') && !h.endsWith('.css') && !h.endsWith('.png') && !h.endsWith('.jpg')) {
      igSet.add('@' + h);
    }
  }

  // Handle both t.me/handle and t.me/s/handle (public channel web preview URLs)
  for (const m of str.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([a-zA-Z0-9_]{4,32})/gi)) {
    const h = m[1].replace(/[\/?#&"'<>].*$/, '').trim().toLowerCase();
    if (h && !TG_RESERVED_PATHS.has(h)) {
      tgSet.add('@' + h);
    }
  }

  for (const m of str.matchAll(BIO_LINK_DOMAINS_RE)) {
    linktreeSet.add(m[0].replace(/[)"'<>]+$/, ''));
  }

  return {
    igHandles: Array.from(igSet),
    tgHandles: Array.from(tgSet),
    phones: extractPhonesFromText(str),
    linktreeUrls: Array.from(linktreeSet)
  };
}

function extractBioTelegramMentions(text, excludeHandles = []) {
  const excluded = new Set(excludeHandles.map(h => h.replace(/^@+/, '').toLowerCase()));
  const out = new Set();
  const s = String(text || '');

  // Explicit t.me URLs anywhere in bio/posts
  for (const m of s.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(?:s\/)?([a-zA-Z0-9_]{4,32})/gi)) {
    const h = m[1].replace(/[\/?#&"'<>].*$/, '').trim().toLowerCase();
    if (h && !TG_RESERVED_PATHS.has(h) && !h.endsWith('bot') && !excluded.has(h)) {
      out.add('@' + h);
    }
  }

  // @username mentions in bio/posts accompanied by TG/manager/booking context (not IG context)
  for (const m of s.matchAll(/@([a-zA-Z0-9_]{4,32})/g)) {
    const h = m[1].toLowerCase();
    if (h.endsWith('bot') || excluded.has(h)) continue;
    const idx = m.index || 0;
    const before = s.slice(Math.max(0, idx - 45), idx).toLowerCase();
    const after = s.slice(idx + m[0].length, idx + m[0].length + 25).toLowerCase();
    const isIgLabeled = /(?:inst|ig|інст|інста)[\s:]*$/i.test(before);
    const hasTgContext = /(?:tg|тг|telegram|телеграм|адмін|менеджер|замовлен|брон|резерв|пишіть|зв['’]?язок|співпрац|менедж|координат)/i.test(before + ' ' + after);
    if (!isIgLabeled && hasTgContext) {
      out.add('@' + h);
    }
  }
  return Array.from(out);
}

async function fetchExternalBioLinks(urls, maxLinks = 2) {
  const igSet = new Set();
  const tgSet = new Set();
  const phoneSet = new Set();
  const uniqueUrls = Array.from(new Set((urls || []).filter(u => /^https?:\/\//i.test(u)))).slice(0, maxLinks);
  for (const url of uniqueUrls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) continue;
      const html = await res.text();
      const ext = extractSocialHandlesFromHtml(html, url);
      ext.igHandles.forEach(h => igSet.add(h));
      ext.tgHandles.forEach(h => tgSet.add(h));
      ext.phones.forEach(p => phoneSet.add(p));
    } catch (_) {}
  }
  return {
    igHandles: Array.from(igSet),
    tgHandles: Array.from(tgSet),
    phones: Array.from(phoneSet)
  };
}

async function withLockedChromePage(fn) {
  const chromePath = findLocalBrowserPath();
  if (!chromePath) return null;
  while (igDispatchLock) {
    await new Promise(r => setTimeout(r, 250));
  }
  igDispatchLock = true;
  let page = null;
  try {
    const puppeteer = await import('puppeteer-core');
    if (!igBrowserInstance || !igBrowserInstance.connected) {
      igBrowserInstance = await puppeteer.default.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--lang=uk-UA,uk']
      });
    }
    page = await igBrowserInstance.newPage();
    await page.setViewport({ width: 1280, height: 840 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    return await fn(page);
  } finally {
    if (page) {
      await Promise.race([
        page.close().catch(() => {}),
        new Promise(r => setTimeout(r, 1500))
      ]);
    }
    igDispatchLock = false;
  }
}

async function lookupGoogleMapsSinglePlace(venueName, city) {
  const empty = { phone: '', sitePhones: [], website: '', address: '', title: '', igHandles: [], tgHandles: [] };
  if (process.env.VERCEL || !findLocalBrowserPath()) return empty;

  try {
    const cityPart = (city && city !== 'Україна' && city !== 'Власний список') ? city : '';
    const gmData = await withLockedChromePage(async (page) => {
      const queryParts = [venueName, cityPart].filter(Boolean);
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(queryParts.join(' '))}?hl=uk`;
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 22000 });
      await page.waitForSelector('h1.DUwDvf, a.hfpxzc, button[data-item-id*="phone"]', { timeout: 9000 }).catch(() => {});

      const cityVariants = getCityVariants(city);
      const venueTokens = getVenueMatchTokens(venueName);

      const bestCardHref = await page.evaluate((vTokens, cVariants, rawName) => {
        const h1 = document.querySelector('h1.DUwDvf');
        if (h1 && h1.innerText && document.querySelector('button[data-item-id*="address"], button[data-item-id*="phone"], a[data-item-id*="authority"]')) {
          return null; // Already landed directly on place panel
        }
        const links = Array.from(document.querySelectorAll('a.hfpxzc'));
        if (links.length === 0) return null;

        let bestHref = links[0].href;
        let bestScore = -1;
        for (const a of links.slice(0, 8)) {
          const card = a.closest('div.Nv2PK') || a.parentElement;
          const cardText = ((a.getAttribute('aria-label') || '') + ' ' + (card?.innerText || '')).toLowerCase();
          let s = 0;
          if (cardText.includes(String(rawName || '').toLowerCase())) s += 10;
          for (const t of vTokens) {
            if (t.length >= 3 && cardText.includes(t)) s += t.length;
          }
          if (cVariants.length > 0 && cVariants.some(cv => cv.length >= 4 && cardText.includes(cv))) s += 8;
          if (s > bestScore) {
            bestScore = s;
            bestHref = a.href;
          }
        }
        return bestHref;
      }, venueTokens, cityVariants, venueName);

      if (bestCardHref) {
        await page.goto(bestCardHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('h1.DUwDvf, button[data-item-id*="phone"], a[data-item-id*="authority"]', { timeout: 6000 }).catch(() => {});
      }

      return await page.evaluate(() => {
        const titleEl = document.querySelector('h1.DUwDvf');
        const title = titleEl ? titleEl.innerText.trim() : '';
        const phoneBtn = document.querySelector('button[data-tooltip*="телефон"], button[data-item-id*="phone"]');
        const phone = phoneBtn ? phoneBtn.innerText.replace(/[\uE000-\uF8FF\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim() : '';
        const webBtn = document.querySelector('a[data-tooltip*="веб-сайт"], a[data-item-id*="authority"]');
        const website = webBtn ? webBtn.href : '';
        const addrBtn = document.querySelector('button[data-tooltip*="адресу"], button[data-item-id*="address"]');
        const address = addrBtn ? addrBtn.innerText.replace(/[\uE000-\uF8FF\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim() : '';
        return { title, phone, website, address };
      });
    });

    if (!gmData) return empty;
    const result = {
      title: gmData.title || '',
      phone: gmData.phone || '',
      sitePhones: [],
      website: gmData.website || '',
      address: gmData.address || '',
      igHandles: [],
      tgHandles: []
    };

    if (result.website) {
      const direct = extractSocialHandlesFromHtml(result.website);
      result.igHandles.push(...direct.igHandles);
      result.tgHandles.push(...direct.tgHandles);

      if (!/instagram\.com|t\.me/i.test(result.website) && /^https?:\/\//i.test(result.website)) {
        try {
          const siteRes = await fetch(result.website, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36' },
            signal: AbortSignal.timeout(4800)
          });
          if (siteRes.ok) {
            const siteHtml = await siteRes.text();
            const extracted = extractSocialHandlesFromHtml(siteHtml, result.website);
            result.igHandles.push(...extracted.igHandles);
            result.tgHandles.push(...extracted.tgHandles);
            result.sitePhones.push(...extracted.phones);

            if (extracted.linktreeUrls.length > 0) {
              const bioExt = await fetchExternalBioLinks(extracted.linktreeUrls, 2);
              result.igHandles.push(...bioExt.igHandles);
              result.tgHandles.push(...bioExt.tgHandles);
              result.sitePhones.push(...bioExt.phones);
            }
          }
        } catch (_) {}
      }
    }

    return {
      ...result,
      sitePhones: Array.from(new Set(result.sitePhones)),
      igHandles: Array.from(new Set(result.igHandles)),
      tgHandles: Array.from(new Set(result.tgHandles))
    };
  } catch (err) {
    console.warn(`[NFC Discovery] Google Maps lookup warning (${venueName}):`, err.message);
    return empty;
  }
}

async function discoverAndVerifyInstagramAndWebWithChrome(venueName, city, gm, item) {
  const igMap = new Map();
  const tgMap = new Map();
  const cityPart = (city && city !== 'Україна' && city !== 'Власний список') ? city : '';

  const addIgCandidate = (rawHandle, trustBonus = 0, context = '', fromOfficialSite = false) => {
    const clean = String(rawHandle || '').replace(/^@+/, '').replace(/[\/?#&"'<>].*$/, '').trim().toLowerCase();
    if (!clean || clean.length < 2 || IG_RESERVED_PATHS.has(clean)) return;
    const handle = '@' + clean;
    const prev = igMap.get(handle) || { handle, baseScore: 0, context: '', fromOfficialSite: false };
    prev.baseScore = Math.max(prev.baseScore, trustBonus + scoreCandidateRelevance(`${clean} ${context}`, venueName));
    if (context) prev.context = (prev.context + ' ' + context).trim().slice(0, 320);
    if (fromOfficialSite) prev.fromOfficialSite = true;
    igMap.set(handle, prev);
  };

  const addTgCandidate = (rawHandle, trust = 'web_search', context = '') => {
    const clean = String(rawHandle || '').replace(/^@+/, '').replace(/[\/?#&"'<>].*$/, '').trim().toLowerCase();
    if (!clean || clean.length < 4 || TG_RESERVED_PATHS.has(clean)) return;
    const handle = '@' + clean;
    const prev = tgMap.get(handle);
    const trustRank = { official_site: 4, verified_ig_bio: 4, web_search: 2 };
    if (!prev || (trustRank[trust] || 1) > (trustRank[prev.trust] || 1)) {
      tgMap.set(handle, { handle, trust, context: context || prev?.context || '' });
    }
  };

  // Seed official Google Maps website/Linktree & existing item candidates first
  for (const h of (gm?.igHandles || [])) addIgCandidate(h, 14, gm.website || '', true);
  for (const h of (gm?.tgHandles || [])) addTgCandidate(h, 'official_site', gm.website || '');
  if (item?.igTarget) addIgCandidate(item.igTarget, 6, '', false);

  const state = loadNfcOutreachDb();
  const sessionCookie = state.config.accounts.ig1?.sessionCookie || process.env.INSTAGRAM_SESSION_COOKIE || '';

  let inspectedSummary = null;
  let verifiedIgHandle = '';
  const extractedTgFromVerifiedIg = [];
  const extractedPhonesFromVerifiedIg = [];

  try {
    await withLockedChromePage(async (page) => {
      // Phase 1: Brave Search (skip IG web query if official site/GM already gave an IG handle)
      const braveQueries = [];
      if (igMap.size === 0) {
        braveQueries.push({ q: `site:instagram.com "${venueName}" ${cityPart}`.trim(), kind: 'ig' });
      }
      braveQueries.push({ q: `site:t.me "${venueName}" ${cityPart}`.trim(), kind: 'tg' });

      for (const bq of braveQueries) {
        try {
          await page.goto(`https://search.brave.com/search?q=${encodeURIComponent(bq.q)}`, { waitUntil: 'domcontentloaded', timeout: 14000 });
          await new Promise(r => setTimeout(r, 900));
          const hits = await page.evaluate(() => {
            const results = [];
            const cards = Array.from(document.querySelectorAll('div.snippet[data-type="web"], #results .snippet'));
            if (cards.length > 0) {
              for (const card of cards.slice(0, 10)) {
                const a = card.querySelector('a[href*="instagram.com"], a[href*="t.me/"], a.result-header, a.heading-serpresult');
                if (a && a.href) {
                  results.push({ href: a.href, text: (card.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 220) });
                }
              }
            }
            if (results.length === 0) {
              for (const a of Array.from(document.querySelectorAll('a[href*="instagram.com/"], a[href*="t.me/"]')).slice(0, 10)) {
                results.push({ href: a.href, text: (a.closest('div')?.innerText || a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 180) });
              }
            }
            return results;
          });
          for (const hit of hits) {
            if (bq.kind === 'ig') {
              const m = String(hit.href).match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/i);
              if (m && m[1]) addIgCandidate(m[1], 4 + (cityPart && textMatchesCity(hit.text, cityPart) ? 3 : 0), hit.text, false);
            } else {
              const m = String(hit.href).match(/(?:t\.me|telegram\.me)\/(?:s\/)?([a-zA-Z0-9_]{4,32})/i);
              if (m && m[1]) {
                const h = m[1].toLowerCase();
                // Pre-filter noisy city portals/alerts unless snippet actually relates to the venue
                const snippetRel = scoreCandidateRelevance(`${h} ${hit.text}`, venueName);
                const snippetNoise = NOISE_PROFILE_RE.test(`${h} ${hit.text}`) && !NOISE_PROFILE_RE.test(venueName);
                if (snippetRel >= 3 && !snippetNoise) {
                  addTgCandidate(h, 'web_search', hit.text);
                }
              }
            }
          }
        } catch (_) {}
      }

      // Fallback broad DuckDuckGo JS if still < 2 IG candidates and not seeded from official site
      if (igMap.size < 2 && !Array.from(igMap.values()).some(v => v.fromOfficialSite)) {
        try {
          const ddgQ = `${venueName} ${cityPart} instagram`.trim();
          await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(ddgQ)}`, { waitUntil: 'domcontentloaded', timeout: 14000 });
          await new Promise(r => setTimeout(r, 1500));
          const ddgHits = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('article a[href*="instagram.com/"], a[data-testid="result-title-a"]'))
              .map(a => ({ href: a.href, text: (a.closest('article')?.innerText || a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 220) }))
              .filter(x => x.href && x.href.includes('instagram.com/'))
              .slice(0, 8);
          });
          for (const hit of ddgHits) {
            const m = String(hit.href).match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/i);
            if (m && m[1]) addIgCandidate(m[1], 4 + (cityPart && textMatchesCity(hit.text, cityPart) ? 3 : 0), hit.text, false);
          }
        } catch (_) {}
      }

      // Phase 2: Authenticated Instagram Drawer Search + Real Profile Inspection
      if (sessionCookie) {
        const sessVal = sessionCookie.replace(/^.*sessionid=/, '').split(';')[0].trim();
        const dsUserId = decodeURIComponent(sessVal).match(/^(\d+):/)?.[1] || '67526535310';
        await page.setCookie(
          { name: 'sessionid', value: sessVal, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
          { name: 'ds_user_id', value: dsUserId, domain: '.instagram.com', path: '/', secure: true }
        );

        // Search inside IG Web Search Drawer if candidates are missing or not from official site
        if (igMap.size < 3 && !Array.from(igMap.values()).some(v => v.fromOfficialSite)) {
          try {
            await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 18000 });
            await new Promise(r => setTimeout(r, 1300));
            const clickedSearch = await page.evaluate(() => {
              const s = document.querySelector('svg[aria-label="Пошук"], svg[aria-label="Search"]');
              if (!s) return false;
              const btn = s.closest('a, button, div[role="button"]');
              if (btn) { btn.click(); return true; }
              return false;
            });
            if (clickedSearch) {
              await new Promise(r => setTimeout(r, 900));
              const inp = await page.$('input[aria-label*="пошуков"], input[aria-label*="Пошук"], input[aria-label*="Search"], input[placeholder*="Пошук"], input[placeholder*="Search"]');
              if (inp) {
                const drawerQuery = getVenueMatchTokens(venueName)[0] || venueName;
                await inp.click();
                await inp.type(drawerQuery.slice(0, 28), { delay: 35 });
                await new Promise(r => setTimeout(r, 2000));
                const drawerHits = await page.evaluate(() => {
                  return Array.from(document.querySelectorAll('a[href^="/"]'))
                    .map(a => ({ href: a.getAttribute('href'), text: (a.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 120) }))
                    .filter(x => x.href && /^\/[a-zA-Z0-9._]{2,30}\/$/.test(x.href))
                    .slice(0, 10);
                });
                for (const d of drawerHits) {
                  const h = d.href.replace(/^\/|\/$/g, '').toLowerCase();
                  if (!IG_RESERVED_PATHS.has(h) && h !== 'denis__zalizko') {
                    addIgCandidate(h, 5 + (cityPart && textMatchesCity(d.text, cityPart) ? 3 : 0), d.text, false);
                  }
                }
              }
            }
          } catch (_) {}
        }

        // Phase 3: Deeply inspect top IG candidates (bio, posts, avatar, external link, DM open)
        const rankedCandidates = Array.from(igMap.values())
          .sort((a, b) => (Number(b.fromOfficialSite) - Number(a.fromOfficialSite)) || (b.baseScore - a.baseScore))
          .slice(0, 5);

        const knownPhonesDigits = [gm?.phone, ...(gm?.sitePhones || []), item?.phone]
          .map(p => String(p || '').replace(/\D/g, '').slice(-9))
          .filter(d => d.length >= 9);
        let siteDomain = '';
        try {
          if (gm?.website && !/instagram\.com|t\.me/i.test(gm.website)) {
            siteDomain = new URL(gm.website).hostname.replace(/^www\./, '').toLowerCase();
          }
        } catch (_) {}

        let bestEval = null;
        for (const cand of rankedCandidates) {
          const uname = cand.handle.replace(/^@+/, '');
          try {
            await page.goto(`https://www.instagram.com/${encodeURIComponent(uname)}/`, { waitUntil: 'domcontentloaded', timeout: 16000 });
            await page.waitForSelector('header, h2', { timeout: 2800 }).catch(() => {});
            await new Promise(r => setTimeout(r, 900));

            const prof = await page.evaluate(() => {
              const bodyText = document.body?.innerText || '';
              const notFound = /сторінка недоступна|page isn't available|sorry, this page/i.test(bodyText.slice(0, 500));
              const header = document.querySelector('header');
              const headerText = header ? header.innerText : '';
              const imgs = header ? Array.from(header.querySelectorAll('img')).map(i => ({ alt: i.alt || '', src: i.src || '' })) : [];
              const avatarImg = imgs.find(i => /основна світлина|profile picture|avatar/i.test(i.alt)) || imgs[0] || null;
              const hasAvatar = Boolean(avatarImg && avatarImg.src && !/44884218_345707102882519_2446069589734326272_n/i.test(avatarImg.src));

              const rawLinks = header
                ? Array.from(header.querySelectorAll('a')).map(a => a.href).filter(Boolean)
                : [];
              const decodedLinks = rawLinks.map(href => {
                try {
                  if (href.includes('l.instagram.com/?') || href.includes('l.instagram.com?')) {
                    const u = new URL(href).searchParams.get('u');
                    if (u) return u;
                  }
                } catch (_) {}
                return href;
              }).filter(h => !h.includes('instagram.com') || h.includes('l.instagram.com'));

              const buttonsText = header
                ? Array.from(header.querySelectorAll('button, div[role="button"]')).map(b => b.innerText || '').join(' ')
                : '';
              const canMessage = /повідомлення|message/i.test(buttonsText);

              const postAlts = Array.from(document.querySelectorAll('main a[href*="/p/"] img, main a[href*="/reel/"] img'))
                .slice(0, 6)
                .map(i => i.alt || '')
                .filter(Boolean);

              return {
                notFound,
                headerText: headerText.slice(0, 1200),
                hasAvatar,
                decodedLinks,
                canMessage,
                postAlts
              };
            });

            if (!prof || prof.notFound || !prof.headerText) continue;

            // Parse post count from header ("2 167 дописів" or "123 posts")
            const postCntMatch = prof.headerText.match(/([\d\s\u00A0.,]+)\s*(?:допис|публикац|post)/i);
            const postsCount = postCntMatch ? (parseInt(postCntMatch[1].replace(/[^\d]/g, ''), 10) || 0) : prof.postAlts.length;

            // Fetch Linktree / external bio links discovered inside this IG header
            const linktreeUrls = prof.decodedLinks.filter(u => BIO_LINK_DOMAINS_RE.test(u));
            BIO_LINK_DOMAINS_RE.lastIndex = 0;
            let bioLinkExtra = { tgHandles: [], phones: [] };
            if (linktreeUrls.length > 0) {
              bioLinkExtra = await fetchExternalBioLinks(linktreeUrls, 1);
            }

            const postsJoined = prof.postAlts.join(' | ');
            const linksJoined = prof.decodedLinks.join(' ');
            const fullInspectionBlob = `${uname} ${prof.headerText} ${linksJoined} ${postsJoined}`;

            const nameMatch = scoreCandidateRelevance(fullInspectionBlob, venueName);
            const hasPhoneMatch = knownPhonesDigits.some(d => fullInspectionBlob.replace(/\D/g, '').includes(d));
            const hasSiteMatch = Boolean(siteDomain && fullInspectionBlob.toLowerCase().includes(siteDomain));
            const cityMatch = textMatchesCity(fullInspectionBlob, city);
            const foreignCity = hasForeignCityMismatch(`${uname} ${prof.headerText}`, city);
            const isAggregatorNoise = NOISE_PROFILE_RE.test(`${uname} ${prof.headerText}`) && !NOISE_PROFILE_RE.test(venueName);
            const hasBizSignal = VENUE_BUSINESS_SIGNAL_RE.test(`${prof.headerText} ${postsJoined}`);

            let score = nameMatch;
            if (cand.fromOfficialSite) score += 10;
            if (hasPhoneMatch) score += 24;
            if (hasSiteMatch) score += 20;
            if (cityMatch) score += 10;
            if (foreignCity) score -= 20;
            if (isAggregatorNoise) score -= 22;
            if (prof.hasAvatar) score += 3; else score -= 6;
            if (postsCount >= 3) score += 4;
            else if (postsCount === 0) score -= 9;
            if (hasBizSignal) score += 4;
            if (prof.canMessage) score += 2;

            const passesGate = (nameMatch >= 3 || hasPhoneMatch || hasSiteMatch) &&
              !isAggregatorNoise &&
              (score >= 9 || (cand.fromOfficialSite && score >= 6 && !foreignCity));

            const candPhones = Array.from(new Set([
              ...extractPhonesFromText(`${prof.headerText} ${postsJoined}`),
              ...bioLinkExtra.phones
            ]));
            const candTgHandles = Array.from(new Set([
              ...extractBioTelegramMentions(`${prof.headerText} ${linksJoined} ${postsJoined}`, [uname]),
              ...bioLinkExtra.tgHandles
            ]));

            console.log(`[NFC Discovery][IG Inspect] @${uname}: score=${score}, pass=${passesGate}, name=${nameMatch}, city=${cityMatch}, foreign=${foreignCity}, avatar=${prof.hasAvatar}, posts=${postsCount}, phoneMatch=${hasPhoneMatch}`);

            if (passesGate && (!bestEval || score > bestEval.score)) {
              bestEval = {
                handle: '@' + uname,
                score,
                postsCount,
                hasAvatar: prof.hasAvatar,
                canMessage: prof.canMessage,
                cityMatch,
                hasPhoneMatch,
                hasSiteMatch,
                bioSnippet: prof.headerText.replace(/\s+/g, ' ').slice(0, 220),
                tgHandles: candTgHandles,
                phones: candPhones
              };
              // Stop early if officially confirmed by phone/domain + posts
              if ((hasPhoneMatch || hasSiteMatch) && postsCount > 0 && (cityMatch || nameMatch >= 8)) break;
            }
          } catch (_) {}
        }

        if (bestEval) {
          verifiedIgHandle = bestEval.handle;
          inspectedSummary = {
            handle: bestEval.handle,
            score: bestEval.score,
            postsCount: bestEval.postsCount,
            hasAvatar: bestEval.hasAvatar,
            canMessage: bestEval.canMessage,
            bioSnippet: bestEval.bioSnippet
          };
          extractedTgFromVerifiedIg.push(...bestEval.tgHandles);
          extractedPhonesFromVerifiedIg.push(...bestEval.phones);
        }
      }
    });
  } catch (err) {
    console.warn(`[NFC Discovery] Chrome IG/Web check warning (${venueName}):`, err.message);
  }

  // Fallback without Chrome ONLY if Chrome unavailable and official website had IG handle
  if (!verifiedIgHandle && gm?.igHandles?.[0]) {
    const clean = gm.igHandles[0].replace(/^@+/, '').toLowerCase();
    if (clean && !IG_RESERVED_PATHS.has(clean)) verifiedIgHandle = '@' + clean;
  }

  for (const tgH of extractedTgFromVerifiedIg) {
    addTgCandidate(tgH, 'verified_ig_bio', inspectedSummary?.bioSnippet || '');
  }

  return {
    verifiedIgHandle,
    inspectedSummary,
    tgCandidates: Array.from(tgMap.values()),
    extractedPhonesFromVerifiedIg
  };
}

async function inspectTelegramUserEntity(client, Api, ent) {
  if (!ent || ent.className !== 'User' || ent.bot || ent.deleted) return null;
  let fullUser = null;
  try {
    fullUser = await client.invoke(new Api.users.GetFullUser({ id: ent }));
  } catch (_) {}
  const about = String(fullUser?.fullUser?.about || '').trim();
  const hasAvatar = Boolean(
    (ent.photo && ent.photo.className !== 'UserProfilePhotoEmpty') ||
    fullUser?.fullUser?.profilePhoto
  );
  const fullName = [ent.firstName, ent.lastName].filter(Boolean).join(' ').trim();
  const username = ent.username ? ('@' + String(ent.username).trim()) : '';
  const phone = ent.phone ? ('+' + String(ent.phone).replace(/\D/g, '')) : '';
  return {
    kind: 'user',
    entity: ent,
    target: username || phone,
    username,
    phone,
    fullName,
    bio: about,
    hasAvatar
  };
}

async function inspectTelegramChannelEntity(client, Api, ent) {
  if (!ent || (ent.className !== 'Channel' && ent.className !== 'Chat')) return null;
  let about = '';
  try {
    if (ent.className === 'Channel') {
      const full = await client.invoke(new Api.channels.GetFullChannel({ channel: ent }));
      about = String(full?.fullChat?.about || '').trim();
    } else {
      const full = await client.invoke(new Api.messages.GetFullChat({ chatId: ent.id }));
      about = String(full?.fullChat?.about || '').trim();
    }
  } catch (_) {}

  const hasAvatar = Boolean(ent.photo && ent.photo.className !== 'ChatPhotoEmpty');
  const msgs = await client.getMessages(ent, { limit: 8 }).catch(() => []);
  const recentPostsText = (msgs || []).map(m => String(m?.message || '')).filter(Boolean).join(' | ');
  const ownHandle = ent.username ? String(ent.username).toLowerCase() : '';

  const extractedHandles = extractBioTelegramMentions(`${about} | ${recentPostsText}`, ownHandle ? [ownHandle] : []);
  // Also allow plain @username inside channel about text
  for (const m of about.matchAll(/@([a-zA-Z0-9_]{4,32})/g)) {
    const h = m[1].toLowerCase();
    if (!h.endsWith('bot') && h !== ownHandle) extractedHandles.push('@' + h);
  }
  const extractedPhones = extractPhonesFromText(`${about} | ${recentPostsText}`);

  return {
    kind: 'channel',
    title: String(ent.title || '').trim(),
    username: ent.username ? ('@' + ent.username) : '',
    bio: about,
    hasAvatar,
    recentPostsText: recentPostsText.slice(0, 1500),
    extractedHandles: Array.from(new Set(extractedHandles)),
    extractedPhones: Array.from(new Set(extractedPhones))
  };
}

async function resolveTelegramViaMtproto({ candidatePhones = [], candidateHandles = [], venueName = '', city = '' }) {
  if (process.env.VERCEL) return { tgTarget: '', tgInspection: null };
  const client = await getMtprotoClientForAccount('tg1') || await getMtprotoClientForAccount('tg2');
  if (!client) return { tgTarget: '', tgInspection: null };

  const cityPart = (city && city !== 'Україна' && city !== 'Власний список') ? city : '';
  const candidates = []; // { source, score, target, bio, hasAvatar, fullName }
  const seenUserKeys = new Set();

  try {
    const { Api } = await import('telegram');

    const evaluateAndAddUser = (profile, sourceTrust, extraContext = '') => {
      if (!profile || !profile.target) return;
      const key = profile.target.toLowerCase();
      if (seenUserKeys.has(key)) return;
      seenUserKeys.add(key);

      const blob = `${profile.username} ${profile.fullName} ${profile.bio} ${extraContext}`;
      if (BOT_OR_SPAM_TG_RE.test(blob)) return;
      const isAggregatorNoise = NOISE_PROFILE_RE.test(blob) && !NOISE_PROFILE_RE.test(venueName);
      if (isAggregatorNoise) return;

      const nameMatch = scoreCandidateRelevance(blob, venueName);
      const cityMatch = textMatchesCity(blob, cityPart);
      const foreignCity = hasForeignCityMismatch(`${profile.username} ${profile.fullName} ${profile.bio}`, cityPart);
      const hasBizBio = VENUE_BUSINESS_SIGNAL_RE.test(profile.bio);

      const isTrustedOrigin = ['official_site', 'verified_ig_bio', 'verified_channel_admin', 'official_gm_phone', 'verified_ig_phone'].includes(sourceTrust);
      if (foreignCity && !isTrustedOrigin) return;

      let score = nameMatch;
      if (sourceTrust === 'verified_ig_bio') score += 18;
      else if (sourceTrust === 'official_site') score += 16;
      else if (sourceTrust === 'verified_channel_admin') score += 14;
      else if (sourceTrust === 'official_gm_phone' || sourceTrust === 'verified_ig_phone') score += 14;
      if (cityMatch) score += 10;
      if (hasBizBio) score += 6;
      if (profile.hasAvatar) score += 4; else score -= 5;
      if (profile.bio) score += 3;

      const isPersonalBioNoise = /(florist|флорист|блогер|манікюр|перукар|візаж|фотограф|психолог|таро|астролог|мама |mommy|music|музикант|тату|tattoo)/i.test(profile.bio) && !/(florist|флорист|манікюр|перукар|візаж|фото|тату)/i.test(venueName);
      if (isPersonalBioNoise && !isTrustedOrigin) return;

      // Strict anti-random-user & anti-ghost-SIM verification:
      // - Unverified searches (web / mtproto_search): require venue name match AND (city OR business bio).
      // - Phone-only GM contacts without username/bio/avatar are rejected as inactive ghost SIMs so active IG or admin TG wins.
      const passes = isTrustedOrigin
        ? ((!foreignCity || cityMatch || sourceTrust === 'official_gm_phone') &&
            (sourceTrust !== 'official_gm_phone' || profile.hasAvatar || Boolean(profile.bio) || Boolean(profile.username)))
        : (nameMatch >= 5 && (cityMatch || (hasBizBio && nameMatch >= 6)) && !foreignCity);

      console.log(`[NFC Discovery][TG Inspect] ${profile.target} (${sourceTrust}): score=${score}, pass=${passes}, name=${nameMatch}, city=${cityMatch}, avatar=${profile.hasAvatar}, bio="${profile.bio.slice(0, 70)}"`);

      if (passes) {
        candidates.push({
          target: profile.target,
          source: sourceTrust,
          score,
          bioSnippet: profile.bio.slice(0, 180),
          hasAvatar: profile.hasAvatar,
          fullName: profile.fullName
        });
      }
    };

    const inspectHandleCandidate = async (handleStr, trust, context = '') => {
      const clean = String(handleStr || '').replace(/^@+/, '').trim();
      if (!clean || TG_RESERVED_PATHS.has(clean.toLowerCase())) return;
      const ent = await client.getEntity(clean).catch(() => null);
      if (!ent) return;

      if (ent.className === 'User') {
        const userProf = await inspectTelegramUserEntity(client, Api, ent);
        evaluateAndAddUser(userProf, trust, context);
      } else if (ent.className === 'Channel' || ent.className === 'Chat') {
        const chanProf = await inspectTelegramChannelEntity(client, Api, ent);
        if (!chanProf) return;
        const chanBlob = `${chanProf.title} ${chanProf.username} ${chanProf.bio} ${chanProf.recentPostsText}`;
        const chanNameMatch = scoreCandidateRelevance(chanBlob, venueName);
        const chanForeign = hasForeignCityMismatch(`${chanProf.title} ${chanProf.bio}`, cityPart);
        const chanNoise = NOISE_PROFILE_RE.test(`${chanProf.title} ${chanProf.bio}`) && !NOISE_PROFILE_RE.test(venueName);
        const chanVerified = (['official_site', 'verified_ig_bio'].includes(trust) || (chanNameMatch >= 5 && !chanForeign)) && !chanNoise;

        console.log(`[NFC Discovery][TG Channel] ${chanProf.username || chanProf.title}: verified=${chanVerified}, admins=${chanProf.extractedHandles.join(',') || '-'}, phones=${chanProf.extractedPhones.join(',') || '-'}`);

        if (chanVerified) {
          for (const adminH of chanProf.extractedHandles.slice(0, 4)) {
            const admEnt = await client.getEntity(adminH.replace(/^@+/, '')).catch(() => null);
            if (admEnt && admEnt.className === 'User') {
              const admProf = await inspectTelegramUserEntity(client, Api, admEnt);
              evaluateAndAddUser(admProf, 'verified_channel_admin', `${chanProf.title} ${chanProf.bio}`);
            }
          }
          for (const chPhone of chanProf.extractedPhones.slice(0, 2)) {
            candidatePhones.push({ phone: chPhone, trust: 'official_gm_phone' });
          }
        }
      }
    };

    // 1. Inspect explicit handles (official_site -> verified_ig_bio -> web_search)
    for (const hObj of candidateHandles.slice(0, 8)) {
      await inspectHandleCandidate(hObj.handle, hObj.trust, hObj.context || '');
    }

    // 2. Global MTProto Search for Users AND Channels matching venue + city
    const tgSearchQueries = Array.from(new Set([
      cityPart ? `${venueName} ${cityPart}` : '',
      venueName
    ].filter(Boolean)));
    for (const sq of tgSearchQueries) {
      const searchRes = await client.invoke(new Api.contacts.Search({ q: sq, limit: 8 })).catch(() => null);
      if (searchRes?.users?.length) {
        for (const u of searchRes.users.slice(0, 6)) {
          if (u.bot || u.deleted) continue;
          const label = `${u.username || ''} ${u.firstName || ''} ${u.lastName || ''}`;
          if (scoreCandidateRelevance(label, venueName) < 3) continue;
          const prof = await inspectTelegramUserEntity(client, Api, u);
          evaluateAndAddUser(prof, 'mtproto_search', '');
        }
      }
      if (searchRes?.chats?.length) {
        for (const c of searchRes.chats.slice(0, 4)) {
          const label = `${c.username || ''} ${c.title || ''}`;
          if (scoreCandidateRelevance(label, venueName) < 4) continue;
          const chanProf = await inspectTelegramChannelEntity(client, Api, c);
          if (!chanProf) continue;
          const chanNoise = NOISE_PROFILE_RE.test(`${chanProf.title} ${chanProf.bio}`) && !NOISE_PROFILE_RE.test(venueName);
          const chanForeign = hasForeignCityMismatch(`${chanProf.title} ${chanProf.bio}`, cityPart);
          if (!chanNoise && !chanForeign) {
            for (const adminH of chanProf.extractedHandles.slice(0, 3)) {
              const admEnt = await client.getEntity(adminH.replace(/^@+/, '')).catch(() => null);
              if (admEnt && admEnt.className === 'User') {
                const admProf = await inspectTelegramUserEntity(client, Api, admEnt);
                evaluateAndAddUser(admProf, 'verified_channel_admin', `${chanProf.title} ${chanProf.bio}`);
              }
            }
          }
        }
      }
    }

    // 3. Verify official business phones (GM phone + verified IG bio phones) via ImportContacts + GetFullUser
    const uniquePhones = [];
    const seenDigits = new Set();
    for (const pObj of candidatePhones) {
      const rawP = String(pObj?.phone || pObj || '').trim();
      const digits = rawP.replace(/\D/g, '');
      const norm = digits.startsWith('380') ? ('+' + digits) : (digits.startsWith('0') ? ('+38' + digits) : '');
      if (!norm || norm.length !== 13 || seenDigits.has(norm)) continue;
      if (!isUkrainianMobileNormalized(norm)) continue;
      seenDigits.add(norm);
      uniquePhones.push({ phone: norm, trust: pObj?.trust || 'official_gm_phone' });
    }

    for (const pObj of uniquePhones.slice(0, 3)) {
      const importRes = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
              phone: pObj.phone,
              firstName: String(venueName || 'Заклад').slice(0, 30),
              lastName: ''
            })
          ]
        })
      ).catch(() => null);

      if (importRes?.users?.length > 0) {
        const u = importRes.users[0];
        const userProf = await inspectTelegramUserEntity(client, Api, u);
        if (userProf) {
          if (!userProf.target) userProf.target = pObj.phone;
          evaluateAndAddUser(userProf, pObj.trust, '');
          // Clean up temporary imported contact if user has a @username (no need to keep in contact list)
          if (u.username) {
            await client.invoke(new Api.contacts.DeleteContacts({ id: [u] })).catch(() => {});
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[NFC Discovery] MTProto inspect warning (${venueName}):`, err.message);
  }

  candidates.sort((a, b) => b.score - a.score);
  const winner = candidates[0] || null;
  return {
    tgTarget: winner ? winner.target : '',
    tgInspection: winner ? {
      target: winner.target,
      source: winner.source,
      score: winner.score,
      hasAvatar: winner.hasAvatar,
      bioSnippet: winner.bioSnippet
    } : null
  };
}

export async function discoverContactsForVenueItem(item, fallbackCity = '') {
  const venueName = String(item?.name || '').trim();
  const city = String(item?.city || fallbackCity || '').trim();
  if (!venueName) return item;

  console.log(`[NFC Discovery] Глибокий пошук та верифікація TG/IG для "${venueName}" (${city || 'без міста'})...`);

  // Step 1: Google Maps Place + Website + Linktree + Phone
  const gm = await lookupGoogleMapsSinglePlace(venueName, city).catch(() => ({
    phone: '', sitePhones: [], website: '', address: '', title: '', igHandles: [], tgHandles: []
  }));

  // Step 2: Web candidates (Brave + DDG JS + IG Search Drawer) + Real Chrome Profile/Bio/Posts/Avatar Verification
  const igDiscovery = await discoverAndVerifyInstagramAndWebWithChrome(venueName, city, gm, item);

  // Step 3: Aggregate ALL trusted phones & TG handles from GM, site, verified IG bio/posts, and web search
  const candidatePhones = [];
  if (gm.phone) candidatePhones.push({ phone: gm.phone, trust: 'official_gm_phone' });
  for (const sp of (gm.sitePhones || [])) candidatePhones.push({ phone: sp, trust: 'official_gm_phone' });
  if (item.phone) candidatePhones.push({ phone: item.phone, trust: 'official_gm_phone' });
  for (const igP of (igDiscovery.extractedPhonesFromVerifiedIg || [])) {
    candidatePhones.push({ phone: igP, trust: 'verified_ig_phone' });
  }

  const candidateHandles = [...(igDiscovery.tgCandidates || [])];
  if (item.tgTarget && String(item.tgTarget).startsWith('@')) {
    candidateHandles.push({ handle: item.tgTarget, trust: 'web_search', context: '' });
  }

  // Step 4: Deep Telegram Verification via MTProto (GetFullUser bio/avatar, Channel about + 8 recent posts, ImportContacts)
  const tgRes = await resolveTelegramViaMtproto({
    candidatePhones,
    candidateHandles,
    venueName,
    city
  });

  item.phone = gm.phone || item.phone || (igDiscovery.extractedPhonesFromVerifiedIg?.[0] || '');
  item.website = gm.website || item.website || '';
  if (gm.address && !item.address) item.address = gm.address;
  item.igTarget = igDiscovery.verifiedIgHandle || '';
  item.tgTarget = tgRes.tgTarget || '';
  item.igInspection = igDiscovery.inspectedSummary || null;
  item.tgInspection = tgRes.tgInspection || null;
  item.needsDiscovery = false;

  if (item.tgTarget || item.igTarget) {
    item.discoveryState = 'found';
    item.channel = item.tgTarget ? 'telegram' : 'instagram';
    item.username = item.tgTarget || item.igTarget;
    if (!item.result || item.result === 'Пошук контактів...') {
      item.result = 'Ігнор / не відповідає';
    }
    console.log(`[NFC Discovery] Верифіковано для "${venueName}": TG=${item.tgTarget || '-'} | IG=${item.igTarget || '-'}`);
  } else {
    item.discoveryState = 'not_found';
    item.channel = 'none';
    item.username = '—';
    item.sendState = 'skipped';
    item.result = 'Верифікованих TG/IG не знайдено';
    console.log(`[NFC Discovery] Верифікованих TG/IG не знайдено для "${venueName}".`);
  }

  return item;
}

export async function discoverNextPendingVenueInCampaign(jobId) {
  if (process.env.VERCEL) return false;
  const state = loadNfcOutreachDb();
  const camp = state.campaigns?.[String(jobId)];
  if (!camp || (camp.status !== 'running' && camp.status !== 'cooldown')) return false;

  const pendingItem = (camp.items || []).find(it =>
    it.sendState === 'queued' && (it.discoveryState === 'pending' || it.needsDiscovery)
  );
  if (!pendingItem) return false;

  const snapshot = { ...pendingItem };
  await discoverContactsForVenueItem(snapshot, camp.city);

  // Re-sync from Cloud KV in case user paused or finished campaign on iPhone during discovery
  const freshState = await syncNfcOutreachFromCloud();
  const freshCamp = freshState.campaigns?.[String(jobId)];
  const freshItem = (freshCamp?.items || []).find(it => String(it.id) === String(pendingItem.id));
  if (freshItem) {
    Object.assign(freshItem, snapshot);
    freshCamp.updatedAt = Date.now();
    saveNfcOutreachDb(freshState);
  }
  return true;
}

export function selectNextOutreachStep(campaign, state) {
  const accs = state.config.accounts;
  const tg1Limit = Number(accs.tg1?.dailyLimit) || (state.config.warmupMode === 'warmed' ? 20 : 10);
  const tg2Limit = Number(accs.tg2?.dailyLimit) || (state.config.warmupMode === 'warmed' ? 20 : 10);
  const ig1Limit = Number(accs.ig1?.dailyLimit) || 30;

  const tg1Available = accs.tg1?.enabled !== false && (accs.tg1.sentToday || 0) < tg1Limit;
  const tg2Available = accs.tg2?.enabled !== false && (accs.tg2.sentToday || 0) < tg2Limit;
  const tgAvailable = tg1Available || tg2Available;
  const ig1Available = accs.ig1?.enabled !== false && (accs.ig1.sentToday || 0) < ig1Limit;

  const queued = (campaign.items || []).filter(i => i.sendState === 'queued');
  if (queued.length === 0) {
    return { action: 'completed' };
  }

  let hasPendingDiscovery = false;
  for (const item of queued) {
    const hasTg = Boolean(item.tgTarget);
    const hasIg = Boolean(item.igTarget);

    if (!hasTg && !hasIg) {
      if (item.needsDiscovery || item.discoveryState === 'pending') {
        hasPendingDiscovery = true;
        continue;
      }
      item.sendState = 'skipped';
      item.result = 'Немає контактів (TG/IG)';
      continue;
    }

    if (hasTg && tgAvailable) {
      const activeStage = tg1Available ? 'tg1' : 'tg2';
      const activeAccount = tg1Available ? accs.tg1 : accs.tg2;
      return {
        action: 'send',
        stage: activeStage,
        account: activeAccount,
        channel: 'telegram',
        intervalMinutes: Number(state.config.tgIntervalMinutes) || 10,
        item
      };
    }

    if (hasIg && ig1Available) {
      return {
        action: 'send',
        stage: 'ig1',
        account: accs.ig1,
        channel: 'instagram',
        intervalMinutes: Number(state.config.igIntervalMinutes) || 3,
        item
      };
    }
  }

  if (hasPendingDiscovery) {
    return { action: 'await_discovery' };
  }

  const remainingQueued = (campaign.items || []).filter(i => i.sendState === 'queued');
  if (remainingQueued.length === 0) {
    return { action: 'completed' };
  }

  return { action: 'cooldown' };
}

export async function executeNextOutreachSend(jobId = null, forceImmediate = false) {
  const state = loadNfcOutreachDb();
  const targetJobId = jobId || state.activeJobId;
  if (!targetJobId || !state.campaigns[targetJobId]) return null;

  const campaign = state.campaigns[targetJobId];
  if (campaign.status !== 'running' && campaign.status !== 'cooldown' && !forceImmediate) {
    return campaign;
  }

  const now = Date.now();

  if (campaign.status === 'cooldown') {
    if (campaign.cooldownUntil && now < campaign.cooldownUntil && !forceImmediate) {
      return campaign;
    }
    state.config.accounts.tg1.sentToday = 0;
    state.config.accounts.tg2.sentToday = 0;
    state.config.accounts.ig1.sentToday = 0;
    campaign.status = 'running';
    campaign.cooldownUntil = null;
    campaign.nextSendAt = now;
  }

  if (!forceImmediate && !campaign.forceImmediateSend && campaign.nextSendAt && now < campaign.nextSendAt) {
    return campaign;
  }

  let step = selectNextOutreachStep(campaign, state);

  if (step.action === 'await_discovery') {
    if (process.env.VERCEL && !process.env.TELEGRAM_SESSION) {
      campaign.status = 'running';
      campaign.forceImmediateSend = true;
      campaign.nextSendAt = now;
      campaign.updatedAt = Date.now();
      await pushNfcOutreachToCloud(state);
      return campaign;
    }
    const discovered = await discoverNextPendingVenueInCampaign(targetJobId);
    if (discovered) {
      step = selectNextOutreachStep(campaign, state);
    }
    if (step.action === 'await_discovery') {
      campaign.nextSendAt = Date.now() + 3000;
      campaign.updatedAt = Date.now();
      saveNfcOutreachDb(state);
      return campaign;
    }
  }

  if (step.action === 'completed') {
    campaign.status = 'completed';
    campaign.currentStage = 'done';
    campaign.nextSendAt = null;
    campaign.cooldownUntil = null;
    campaign.forceImmediateSend = false;
    campaign.updatedAt = Date.now();
    saveNfcOutreachDb(state);
    return campaign;
  }

  if (step.action === 'cooldown') {
    const cooldownMs = computeCooldownDurationMs();
    campaign.status = 'cooldown';
    campaign.currentStage = 'cooldown';
    campaign.cooldownUntil = now + cooldownMs;
    campaign.nextSendAt = campaign.cooldownUntil;
    campaign.forceImmediateSend = false;
    campaign.updatedAt = Date.now();
    saveNfcOutreachDb(state);
    return campaign;
  }

  // On Vercel serverless without local MTProto/Chrome sessions, queue immediate execution for PC daemon via Cloud KV
  if (process.env.VERCEL && !process.env.TELEGRAM_SESSION) {
    campaign.status = 'running';
    campaign.forceImmediateSend = Boolean(forceImmediate || campaign.forceImmediateSend);
    if (!campaign.nextSendAt || forceImmediate) {
      campaign.nextSendAt = now;
    }
    campaign.updatedAt = Date.now();
    await pushNfcOutreachToCloud(state);
    return campaign;
  }

  campaign.forceImmediateSend = false;

  const { item, account, channel, stage } = step;
  const accs = state.config.accounts;
  let activeChannel = channel;
  let activeAccount = account;
  let activeStage = stage;
  let targetHandle = activeChannel === 'telegram' ? (item.tgTarget || item.username) : (item.igTarget || item.username);
  let msgText = buildMessageForVenue(item.name, item.city || campaign.city, activeChannel, item.templateIndex, state);

  let sentSuccessfully = false;
  let deferredForClient = false;

  if (activeChannel === 'telegram') {
    const mtRes = await dispatchTelegramMessageMtproto(activeAccount.id, item, msgText);
    if (mtRes.sentViaMtproto) {
      item.peerId = mtRes.peerId || '';
      sentSuccessfully = true;
    } else if (mtRes.reason === 'no_client') {
      deferredForClient = true;
    } else {
      console.warn(`[NFC Outreach] Telegram resolution failed for "${item.name}" (${targetHandle}).`);
      const ig1Limit = Number(accs.ig1?.dailyLimit) || 30;
      const ig1Available = accs.ig1?.enabled !== false && (accs.ig1.sentToday || 0) < ig1Limit;
      if (item.igTarget && ig1Available) {
        console.log(`[NFC Outreach] Seamless fallback to Instagram (@${item.igTarget}) for "${item.name}"...`);
        activeChannel = 'instagram';
        activeAccount = accs.ig1;
        activeStage = 'ig1';
        targetHandle = item.igTarget;
        msgText = buildMessageForVenue(item.name, item.city || campaign.city, 'instagram', item.templateIndex, state);

        const igRes = await dispatchInstagramDirectMessage(item, msgText);
        if (igRes.sentViaApi) {
          item.peerId = igRes.targetUserId || '';
          sentSuccessfully = true;
        } else if (igRes.reason === 'no_client') {
          deferredForClient = true;
        } else {
          item.sendState = 'failed';
          item.result = 'Не вдалося надіслати в IG';
        }
      } else {
        item.sendState = 'failed';
        item.result = 'Контакт недоступний в TG';
      }
    }
  } else if (activeChannel === 'instagram') {
    const igRes = await dispatchInstagramDirectMessage(item, msgText);
    if (igRes.sentViaApi) {
      item.peerId = igRes.targetUserId || '';
      sentSuccessfully = true;
    } else if (igRes.reason === 'no_client') {
      deferredForClient = true;
    } else {
      item.sendState = 'failed';
      item.result = 'Не вдалося надіслати в IG';
    }
  }

  if (deferredForClient) {
    // Keep item queued so PC daemon can dispatch it
    campaign.nextSendAt = Date.now() + 5000;
    campaign.updatedAt = Date.now();
    saveNfcOutreachDb(state);
    return campaign;
  }

  if (sentSuccessfully) {
    item.channel = activeChannel;
    item.username = targetHandle;
    item.accountId = activeAccount.id;
    item.accountLabel = activeAccount.handle ? `${activeAccount.label} (${activeAccount.handle})` : activeAccount.label;
    item.messageSent = msgText;
    item.sendState = 'sent';
    item.sentAt = new Date().toISOString();
    if (!item.result || item.result === 'Контакт недоступний в TG' || item.result === 'Не вдалося надіслати в IG') {
      item.result = 'Ігнор / не відповідає';
    }
    activeAccount.sentToday = (Number(activeAccount.sentToday) || 0) + 1;
    activeAccount.lastSentAt = item.sentAt;
  }

  campaign.currentStage = activeStage;
  campaign.updatedAt = Date.now();

  const nextStepCheck = selectNextOutreachStep(campaign, state);
  if (nextStepCheck.action === 'completed') {
    campaign.status = 'completed';
    campaign.currentStage = 'done';
    campaign.nextSendAt = null;
    campaign.cooldownUntil = null;
  } else if (nextStepCheck.action === 'cooldown') {
    const cooldownMs = computeCooldownDurationMs();
    campaign.status = 'cooldown';
    campaign.currentStage = 'cooldown';
    campaign.cooldownUntil = Date.now() + cooldownMs;
    campaign.nextSendAt = campaign.cooldownUntil;
  } else {
    campaign.status = 'running';
    campaign.currentStage = nextStepCheck.stage;
    const nextIntervalMin = nextStepCheck.stage === 'ig1'
      ? (Number(state.config.igIntervalMinutes) || 3)
      : (Number(state.config.tgIntervalMinutes) || 10);
    campaign.nextSendAt = sentSuccessfully
      ? (Date.now() + nextIntervalMin * 60 * 1000)
      : (Date.now() + 3000);
  }

  saveNfcOutreachDb(state);
  return campaign;
}

export async function pollActiveTelegramReplies() {
  if (process.env.VERCEL) return;
  const state = loadNfcOutreachDb();
  const hasSentItems = Object.values(state.campaigns || {}).some(c =>
    (c.items || []).some(i => i.sendState === 'sent' && i.channel === 'telegram')
  );
  if (!hasSentItems) return;

  for (const accId of ['tg1', 'tg2']) {
    const client = await getMtprotoClientForAccount(accId);
    if (!client) continue;
    try {
      const dialogs = await client.getDialogs({ limit: 35 }).catch(() => []);
      for (const d of dialogs) {
        if (!d || !d.isUser || !d.entity) continue;
        const entity = d.entity;
        const peerId = String(entity.id || '');
        const username = entity.username ? ('@' + entity.username.toLowerCase()) : '';
        const phone = entity.phone ? ('+' + String(entity.phone).replace(/\D/g, '')) : '';

        let matchedItem = null;
        for (const camp of Object.values(state.campaigns || {})) {
          for (const item of (camp.items || [])) {
            if (item.sendState !== 'sent' || item.channel !== 'telegram') continue;
            const itemTg = String(item.tgTarget || item.username || '').toLowerCase();
            const itemDigits = itemTg.replace(/\D/g, '');
            const entDigits = phone.replace(/\D/g, '');
            if (
              (peerId && item.peerId && String(item.peerId) === peerId) ||
              (username && itemTg === username) ||
              (entDigits && entDigits.length >= 9 && itemDigits.endsWith(entDigits.slice(-9)))
            ) {
              matchedItem = item;
              if (!item.peerId && peerId) item.peerId = peerId;
              break;
            }
          }
          if (matchedItem) break;
        }

        if (matchedItem) {
          const msgs = await client.getMessages(entity, { limit: 5 }).catch(() => []);
          const incoming = msgs.find(m => m && !m.out && m.message);
          if (incoming && incoming.message) {
            handleIncomingLeadReply({
              peerId,
              username,
              phone,
              text: incoming.message
            });
          }
        }
      }
    } catch (_) {}
  }
}

let manualResolveBusy = false;
async function processManualResolveQueue() {
  if (manualResolveBusy || process.env.VERCEL) return;
  manualResolveBusy = true;
  try {
    const kvUrl = getCloudKvOutreachUrl().replace(CLOUD_OUTREACH_RECORD, 'nfc_manual_resolve');
    const res = await fetch(kvUrl, { signal: AbortSignal.timeout(4500) }).catch(() => null);
    if (!res || !res.ok) return;
    const data = await res.json().catch(() => null);
    if (!data || !Array.isArray(data.requests)) return;
    const pending = data.requests.find(r => r && r.status === 'pending' && r.name);
    if (!pending) return;

    const itemSnapshot = {
      id: pending.venueId || pending.id,
      name: pending.name,
      city: pending.city || '',
      phone: pending.phone || '',
      website: pending.website || '',
      address: pending.address || ''
    };
    await discoverContactsForVenueItem(itemSnapshot, pending.city || '');

    // Re-read Cloud KV before updating so we don't drop concurrent requests from iPhone
    const freshRes = await fetch(kvUrl, { signal: AbortSignal.timeout(4500) }).catch(() => null);
    const freshData = (freshRes && freshRes.ok) ? await freshRes.json().catch(() => data) : data;
    const reqList = Array.isArray(freshData?.requests) ? freshData.requests : data.requests;
    const targetReq = reqList.find(r => r && r.id === pending.id);
    if (targetReq) {
      targetReq.status = 'done';
      targetReq.resolvedAt = Date.now();
      targetReq.phone = itemSnapshot.phone || '';
      targetReq.website = itemSnapshot.website || '';
      targetReq.instagram = itemSnapshot.igTarget || '';
      targetReq.telegram = itemSnapshot.tgTarget || '';
      targetReq.igInspection = itemSnapshot.igInspection || null;
      targetReq.tgInspection = itemSnapshot.tgInspection || null;
    }
    const trimmed = reqList.slice(-20);
    await fetch(kvUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: trimmed, updatedAt: Date.now() }),
      signal: AbortSignal.timeout(4500)
    }).catch(() => {});
  } catch (_) {
  } finally {
    manualResolveBusy = false;
  }
}

let schedulerStarted = false;
let schedulerBusy = false;
export function startNfcOutreachScheduler() {
  if (schedulerStarted || process.env.VERCEL) return;
  schedulerStarted = true;

  // Initial sync on startup
  syncNfcOutreachFromCloud().then(state => {
    saveNfcOutreachDb(state, true);
  }).catch(() => {});

  // Tick every 4 seconds: sync with Cloud KV (iPhone <-> PC) and dispatch due messages
  setInterval(async () => {
    if (schedulerBusy) return;
    schedulerBusy = true;
    try {
      await processManualResolveQueue().catch(() => {});
      const state = await syncNfcOutreachFromCloud();
      for (const camp of Object.values(state.campaigns || {})) {
        if (camp.status === 'running') {
          await discoverNextPendingVenueInCampaign(camp.jobId).catch(err => {
            console.warn('[NFC Discovery] Tick warning:', err.message);
          });
        }
        if (camp.status === 'running' || camp.status === 'cooldown' || camp.forceImmediateSend) {
          const forceNow = Boolean(camp.forceImmediateSend);
          await executeNextOutreachSend(camp.jobId, forceNow).catch(err => {
            console.warn('[NFC Outreach] Tick warning:', err.message);
          });
        }
      }
    } catch (_) {
    } finally {
      schedulerBusy = false;
    }
  }, 4000);

  // Poll Telegram replies every 45 seconds continuously 24/7
  setInterval(() => {
    pollActiveTelegramReplies().catch(() => {});
  }, 45000);

  console.log('[NFC Outreach] Автономний серверний рушій NFC-розсилки та 24/7 моніторингу відповідей запущено.');
}
