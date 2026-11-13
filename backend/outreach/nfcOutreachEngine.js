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
    if (!igBrowserInstance || !igBrowserInstance.isConnected()) {
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
  'м', 'місто', 'city', 'cafe', 'coffee', 'bar', 'restaurant', 'studio', 'shop', 'club'
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
      // Common Russian/Ukrainian transliteration variants (chornomorka/chernomorka, hlib/khlib, y/i)
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

const IG_RESERVED_PATHS = new Set([
  'explore', 'p', 'reels', 'reel', 'stories', 'direct', 'accounts', 'tags', 'tv', 'locations', 'directory', 'about', 'legal'
]);

const TG_RESERVED_PATHS = new Set([
  's', 'joinchat', 'addstickers', 'share', 'iv', 'proxy', 'socks', 'setlanguage', 'addlist', 'boost'
]);

function extractSocialHandlesFromHtml(html, baseUrl = '') {
  const igSet = new Set();
  const tgSet = new Set();
  const str = String(html || '');

  for (const m of str.matchAll(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{2,30})/gi)) {
    const h = m[1].replace(/[\/?#&"'<>].*$/, '').trim().toLowerCase();
    if (h && !IG_RESERVED_PATHS.has(h) && !h.endsWith('.js') && !h.endsWith('.css') && !h.endsWith('.png')) {
      igSet.add('@' + h);
    }
  }

  for (const m of str.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,32})/gi)) {
    const h = m[1].replace(/[\/?#&"'<>].*$/, '').trim().toLowerCase();
    if (h && !TG_RESERVED_PATHS.has(h)) {
      tgSet.add('@' + h);
    }
  }

  return {
    igHandles: Array.from(igSet),
    tgHandles: Array.from(tgSet)
  };
}

async function lookupGoogleMapsSinglePlace(venueName, city) {
  if (process.env.VERCEL) return { phone: '', website: '', address: '', igHandles: [], tgHandles: [] };
  const chromePath = findLocalBrowserPath();
  if (!chromePath) return { phone: '', website: '', address: '', igHandles: [], tgHandles: [] };

  while (igDispatchLock) {
    await new Promise(r => setTimeout(r, 300));
  }
  igDispatchLock = true;
  let page = null;
  try {
    const puppeteer = await import('puppeteer-core');
    if (!igBrowserInstance || !igBrowserInstance.isConnected()) {
      igBrowserInstance = await puppeteer.default.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--lang=uk-UA,uk']
      });
    }

    page = await igBrowserInstance.newPage();
    await page.setViewport({ width: 1280, height: 840 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

    const queryParts = [venueName, (city && city !== 'Україна' && city !== 'Власний список') ? city : ''].filter(Boolean);
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(queryParts.join(' '))}?hl=uk`;
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 22000 });
    await page.waitForSelector('h1.DUwDvf, a.hfpxzc, button[data-item-id*="phone"]', { timeout: 9000 }).catch(() => {});

    // Check if landed directly on place panel or search list
    const firstCardHref = await page.evaluate((vName) => {
      const h1 = document.querySelector('h1.DUwDvf');
      if (h1 && h1.innerText && document.querySelector('button[data-item-id*="address"], button[data-item-id*="phone"], a[data-item-id*="authority"]')) {
        return null; // Already on place page
      }
      const links = Array.from(document.querySelectorAll('a.hfpxzc'));
      if (links.length === 0) return null;
      const lowerName = String(vName || '').toLowerCase();
      const best = links.find(a => (a.getAttribute('aria-label') || '').toLowerCase().includes(lowerName)) || links[0];
      return best ? best.href : null;
    }, venueName);

    if (firstCardHref) {
      await page.goto(firstCardHref, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('h1.DUwDvf, button[data-item-id*="phone"], a[data-item-id*="authority"]', { timeout: 6000 }).catch(() => {});
    }

    const details = await page.evaluate(() => {
      const phoneBtn = document.querySelector('button[data-tooltip*="телефон"], button[data-item-id*="phone"]');
      const phone = phoneBtn ? phoneBtn.innerText.replace(/[\uE000-\uF8FF\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim() : '';
      const webBtn = document.querySelector('a[data-tooltip*="веб-сайт"], a[data-item-id*="authority"]');
      const website = webBtn ? webBtn.href : '';
      const addrBtn = document.querySelector('button[data-tooltip*="адресу"], button[data-item-id*="address"]');
      const address = addrBtn ? addrBtn.innerText.replace(/[\uE000-\uF8FF\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').trim() : '';
      return { phone, website, address };
    });

    await page.close().catch(() => {});
    page = null;

    const result = {
      phone: details.phone || '',
      website: details.website || '',
      address: details.address || '',
      igHandles: [],
      tgHandles: []
    };

    if (result.website) {
      const direct = extractSocialHandlesFromHtml(result.website);
      result.igHandles.push(...direct.igHandles);
      result.tgHandles.push(...direct.tgHandles);

      // Fetch venue website / Linktree / Taplink HTML if not directly a social URL
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
          }
        } catch (_) {}
      }
    }

    return {
      ...result,
      igHandles: Array.from(new Set(result.igHandles)),
      tgHandles: Array.from(new Set(result.tgHandles))
    };
  } catch (err) {
    console.warn(`[NFC Discovery] Google Maps lookup warning (${venueName}):`, err.message);
    if (page) await page.close().catch(() => {});
    return { phone: '', website: '', address: '', igHandles: [], tgHandles: [] };
  } finally {
    igDispatchLock = false;
  }
}

async function searchDuckDuckGoContacts(venueName, city) {
  const igCandidates = [];
  const tgCandidates = [];
  const cityPart = (city && city !== 'Україна' && city !== 'Власний список') ? city : '';

  const parseDdgBlocks = (html) => {
    const blocks = String(html || '').split(/class="result\s/i);
    const out = [];
    for (let i = 1; i < blocks.length; i++) {
      const b = blocks[i];
      const hrefMatch = b.match(/href="([^"]+)"/i);
      const titleMatch = b.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/i);
      const snipMatch = b.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div)>/i);
      let url = hrefMatch ? decodeURIComponent(hrefMatch[1].replace(/.*uddg=/, '').split('&')[0]) : '';
      const stripTags = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const title = stripTags(titleMatch ? titleMatch[1] : '');
      const snippet = stripTags(snipMatch ? snipMatch[1] : '');
      out.push({ url, title, snippet });
    }
    return out;
  };

  try {
    const qIg = `site:instagram.com "${venueName}" ${cityPart}`.trim();
    const resIg = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(qIg)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(5500)
    });
    if (resIg.ok) {
      let blocks = parseDdgBlocks(await resIg.text());
      if (blocks.length === 0) {
        const resIgBroad = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(`${venueName} ${cityPart} instagram`.trim())}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36' },
          signal: AbortSignal.timeout(5500)
        });
        if (resIgBroad.ok) blocks = parseDdgBlocks(await resIgBroad.text());
      }
      for (const blk of blocks) {
        const m = blk.url.match(/instagram\.com\/([a-zA-Z0-9._]{2,30})/i);
        if (m && m[1]) {
          const handle = m[1].replace(/[\/?#].*$/, '').toLowerCase();
          if (!IG_RESERVED_PATHS.has(handle)) {
            const relScore = scoreCandidateRelevance(`${handle} ${blk.title} ${blk.snippet}`, venueName);
            if (relScore >= 3) {
              igCandidates.push({ handle: '@' + handle, score: relScore + (cityPart && (`${blk.title} ${blk.snippet}`.toLowerCase().includes(cityPart.toLowerCase())) ? 3 : 0) });
            }
          }
        }
      }
    }
  } catch (_) {}

  try {
    const qTg = `site:t.me "${venueName}" ${cityPart}`.trim();
    const resTg = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(qTg)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(5500)
    });
    if (resTg.ok) {
      const blocks = parseDdgBlocks(await resTg.text());
      for (const blk of blocks) {
        const m = blk.url.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]{4,32})/i);
        if (m && m[1]) {
          const handle = m[1].replace(/[\/?#].*$/, '').toLowerCase();
          if (!TG_RESERVED_PATHS.has(handle)) {
            const relScore = scoreCandidateRelevance(`${handle} ${blk.title} ${blk.snippet}`, venueName);
            if (relScore >= 4) {
              tgCandidates.push({ handle: '@' + handle, score: relScore });
            }
          }
        }
      }
    }
  } catch (_) {}

  igCandidates.sort((a, b) => b.score - a.score);
  tgCandidates.sort((a, b) => b.score - a.score);
  return {
    igHandle: igCandidates[0]?.handle || '',
    tgHandle: tgCandidates[0]?.handle || ''
  };
}

async function searchInstagramTopsearch(venueName, city) {
  if (process.env.VERCEL) return '';
  const state = loadNfcOutreachDb();
  const sessionCookie = state.config.accounts.ig1?.sessionCookie || process.env.INSTAGRAM_SESSION_COOKIE || '';
  const chromePath = findLocalBrowserPath();
  if (!sessionCookie || !chromePath) return '';

  while (igDispatchLock) {
    await new Promise(r => setTimeout(r, 300));
  }
  igDispatchLock = true;
  let page = null;
  try {
    const puppeteer = await import('puppeteer-core');
    if (!igBrowserInstance || !igBrowserInstance.isConnected()) {
      igBrowserInstance = await puppeteer.default.launch({
        executablePath: chromePath,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-notifications', '--lang=uk-UA,uk']
      });
    }

    page = await igBrowserInstance.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');
    const sessVal = sessionCookie.replace(/^.*sessionid=/, '').split(';')[0].trim();
    const dsUserId = decodeURIComponent(sessVal).match(/^(\d+):/)?.[1] || '67526535310';
    await page.setCookie(
      { name: 'sessionid', value: sessVal, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
      { name: 'ds_user_id', value: dsUserId, domain: '.instagram.com', path: '/', secure: true }
    );

    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    const cityPart = (city && city !== 'Україна' && city !== 'Власний список') ? city : '';
    const queries = cityPart ? [`${venueName} ${cityPart}`, venueName] : [venueName];
    let users = [];

    for (const q of queries) {
      const resData = await page.evaluate(async (queryStr) => {
        try {
          const r = await fetch(`/api/v1/web/search/topsearch/?context=blended&query=${encodeURIComponent(queryStr)}`, {
            headers: { 'x-requested-with': 'XMLHttpRequest' }
          });
          if (!r.ok) return null;
          return await r.json();
        } catch (_) {
          return null;
        }
      }, q);
      if (resData && Array.isArray(resData.users) && resData.users.length > 0) {
        users = users.concat(resData.users.map(u => u.user).filter(Boolean));
      }
      if (users.length >= 5) break;
    }

    await page.close().catch(() => {});
    page = null;

    let bestHandle = '';
    let bestScore = 0;
    for (const u of users) {
      const uname = String(u.username || '').trim();
      if (!uname) continue;
      const fullName = String(u.full_name || '').trim();
      const s = scoreCandidateRelevance(`${uname} ${fullName}`, venueName)
        + (cityPart && `${uname} ${fullName}`.toLowerCase().includes(cityPart.toLowerCase()) ? 4 : 0);
      if (s > bestScore && s >= 3) {
        bestScore = s;
        bestHandle = '@' + uname;
      }
    }
    return bestHandle;
  } catch (_) {
    if (page) await page.close().catch(() => {});
    return '';
  } finally {
    igDispatchLock = false;
  }
}

async function resolveTelegramViaMtproto(candidatePhone, candidateHandle, venueName) {
  if (process.env.VERCEL) return '';
  const client = await getMtprotoClientForAccount('tg1') || await getMtprotoClientForAccount('tg2');
  if (!client) return candidateHandle || candidatePhone || '';

  try {
    const { Api } = await import('telegram');

    // 1. Verify @username handle if present; if it's a channel, inspect about text for admin @username
    if (candidateHandle) {
      const clean = candidateHandle.replace(/^@+/, '').trim();
      const ent = await client.getEntity(clean).catch(() => null);
      if (ent) {
        if (ent.className === 'User' && !ent.bot) {
          return ent.username ? ('@' + ent.username) : candidateHandle;
        }
        if (ent.className === 'Channel' || ent.className === 'Chat') {
          try {
            const full = await client.invoke(new Api.channels.GetFullChannel({ channel: ent }));
            const about = String(full?.fullChat?.about || '');
            const mentionMatch = about.match(/@([a-zA-Z0-9_]{4,32})/) || about.match(/t\.me\/([a-zA-Z0-9_]{4,32})/i);
            if (mentionMatch && mentionMatch[1] && !TG_RESERVED_PATHS.has(mentionMatch[1].toLowerCase())) {
              const adminEnt = await client.getEntity(mentionMatch[1]).catch(() => null);
              if (adminEnt && adminEnt.className === 'User' && !adminEnt.bot) {
                return '@' + (adminEnt.username || mentionMatch[1]);
              }
            }
          } catch (_) {}
        }
      }
    }

    // 2. Verify mobile phone registration in Telegram via ImportContacts
    if (candidatePhone) {
      const importRes = await client.invoke(
        new Api.contacts.ImportContacts({
          contacts: [
            new Api.InputPhoneContact({
              clientId: BigInt(Date.now() + Math.floor(Math.random() * 1000)),
              phone: candidatePhone,
              firstName: String(venueName || 'Заклад').slice(0, 30),
              lastName: ''
            })
          ]
        })
      ).catch(() => null);
      if (importRes?.users?.length > 0) {
        const u = importRes.users[0];
        return u.username ? ('@' + u.username) : candidatePhone;
      }
    }

    // 3. Fallback global Telegram contacts search for matching private user
    if (!candidateHandle && venueName) {
      const searchRes = await client.invoke(new Api.contacts.Search({ q: venueName, limit: 5 })).catch(() => null);
      if (searchRes?.users?.length > 0) {
        for (const u of searchRes.users) {
          if (u.bot) continue;
          const label = `${u.username || ''} ${u.firstName || ''} ${u.lastName || ''}`;
          if (scoreCandidateRelevance(label, venueName) >= 4) {
            return u.username ? ('@' + u.username) : '';
          }
        }
      }
    }
  } catch (_) {}

  return '';
}

export async function discoverContactsForVenueItem(item, fallbackCity = '') {
  const venueName = String(item?.name || '').trim();
  const city = String(item?.city || fallbackCity || '').trim();
  if (!venueName) return item;

  console.log(`[NFC Discovery] Пошук TG/IG для "${venueName}" (${city || 'без міста'})...`);

  // Step 1: Google Maps Place Lookup + Website HTML scraping
  const gm = await lookupGoogleMapsSinglePlace(venueName, city);
  const norm = normalizeVenueContacts({
    phone: gm.phone || item.phone || '',
    instagram: gm.igHandles[0] || item.igTarget || '',
    telegram: gm.tgHandles[0] || item.tgTarget || ''
  });

  let rawIg = gm.igHandles[0] || norm.igTarget || '';
  let rawTgHandle = gm.tgHandles[0] || (norm.tgTarget && norm.tgTarget.startsWith('@') ? norm.tgTarget : '');
  const rawPhone = (norm.tgTarget && norm.tgTarget.startsWith('+')) ? norm.tgTarget : '';

  // Step 2: DuckDuckGo Web Search (Instagram + Telegram)
  if (!rawIg || !rawTgHandle) {
    const ddg = await searchDuckDuckGoContacts(venueName, city);
    if (!rawIg && ddg.igHandle) rawIg = ddg.igHandle;
    if (!rawTgHandle && ddg.tgHandle) rawTgHandle = ddg.tgHandle;
  }

  // Step 3: Logged-in Instagram Topsearch (if still missing IG)
  if (!rawIg) {
    const igTop = await searchInstagramTopsearch(venueName, city);
    if (igTop) rawIg = igTop;
  }

  // Step 4: Verify Telegram availability via MTProto (phone registration / @username / admin extract)
  const verifiedTg = await resolveTelegramViaMtproto(rawPhone, rawTgHandle, venueName);

  item.phone = gm.phone || item.phone || '';
  item.website = gm.website || item.website || '';
  item.tgTarget = verifiedTg || '';
  item.igTarget = rawIg || '';
  item.needsDiscovery = false;

  if (item.tgTarget || item.igTarget) {
    item.discoveryState = 'found';
    item.channel = item.tgTarget ? 'telegram' : 'instagram';
    item.username = item.tgTarget || item.igTarget;
    if (!item.result || item.result === 'Пошук контактів...') {
      item.result = 'Ігнор / не відповідає';
    }
    console.log(`[NFC Discovery] Знайдено для "${venueName}": TG=${item.tgTarget || '-'} | IG=${item.igTarget || '-'}`);
  } else {
    item.discoveryState = 'not_found';
    item.channel = 'none';
    item.username = '—';
    item.sendState = 'skipped';
    item.result = 'Контактів TG/IG не знайдено';
    console.log(`[NFC Discovery] Контакти TG/IG не знайдено для "${venueName}".`);
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
