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
        handle: '@absolutikdenchik',
        enabled: true,
        dailyLimit: 10,
        sentToday: 0,
        lastSentAt: null
      },
      tg2: {
        id: 'tg2',
        label: 'Telegram Акаунт #2',
        handle: '',
        enabled: true,
        dailyLimit: 10,
        sentToday: 0,
        lastSentAt: null,
        sessionString: ''
      },
      ig1: {
        id: 'ig1',
        label: 'Instagram Акаунт #1',
        handle: '',
        enabled: true,
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
  campaigns: {}
};

let memoryState = null;
let secondaryMtprotoClient = null;
let listenersAttached = { tg1: false, tg2: false };

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
  // If they wrote a meaningful response without negative words, treat as engaged ('Так')
  if (clean.length >= 2) {
    return 'Так';
  }
  return null;
}

export function loadNfcOutreachDb() {
  if (memoryState) return memoryState;
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
      return memoryState;
    }
  } catch (err) {
    console.warn('[NFC Outreach] Read DB warning:', err.message);
  }
  memoryState = JSON.parse(JSON.stringify(DEFAULT_OUTREACH_DB));
  return memoryState;
}

export function saveNfcOutreachDb(stateToSave = null) {
  if (stateToSave) memoryState = stateToSave;
  if (!memoryState) return;
  try {
    if (!process.env.VERCEL && !fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(OUTREACH_DB_PATH, JSON.stringify(memoryState, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[NFC Outreach] Write DB warning:', err.message);
  }
}

export function computeCooldownDurationMs() {
  // Calculate smart 15-20h cooldown targeting next day morning window (approx 10:00 Kyiv time)
  const now = new Date();
  const kyivHour = (now.getUTCHours() + 2) % 24;
  let hoursToWait = 18;
  if (kyivHour >= 14 && kyivHour <= 23) {
    hoursToWait = (24 - kyivHour) + 10; // Wakes up around 10:00 next morning
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
  const title = String(jobData.cluster || jobData.niche || 'Заклади NFC').trim();
  const venues = Array.isArray(jobData.items) ? jobData.items : [];

  let campaign = state.campaigns[jobId];
  const existingById = new Map();
  if (campaign && Array.isArray(campaign.items)) {
    campaign.items.forEach(it => existingById.set(it.id, it));
  }

  const items = [];
  venues.forEach((v, idx) => {
    const vid = String(v.id || `v_${idx}`);
    if (existingById.has(vid)) {
      items.push(existingById.get(vid));
      return;
    }

    const contacts = normalizeVenueContacts(v);
    // Filter only venues that can be contacted via Telegram or Instagram
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
      sendState: 'queued', // 'queued' | 'sent' | 'skipped'
      sentAt: null,
      peerId: '',
      result: 'Ігнор / не відповідає', // Strictly one of: 'Ігнор / не відповідає' | 'Ні / не цікаво' | 'Так'
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
      status: startImmediately ? 'running' : 'idle',
      currentStage: 'tg1',
      nextSendAt: startImmediately ? Date.now() + 2000 : null,
      cooldownUntil: null,
      items
    };
  } else {
    campaign.title = title;
    campaign.city = city;
    campaign.items = items;
    if (startImmediately) {
      if (campaign.status === 'cooldown' && campaign.cooldownUntil && campaign.cooldownUntil > Date.now()) {
        // Keep active cooldown
      } else {
        campaign.status = 'running';
        if (!campaign.nextSendAt || campaign.nextSendAt < Date.now()) {
          campaign.nextSendAt = Date.now() + 2000;
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
        cfg.accounts[key] = {
          ...cfg.accounts[key],
          ...updates.accounts[key]
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

  saveNfcOutreachDb(state);
  return cfg;
}

async function getMtprotoClientForAccount(accountId) {
  if (process.env.VERCEL) return null;
  const state = loadNfcOutreachDb();
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;
  if (!apiId || !apiHash) return null;

  if (accountId === 'tg1') {
    const primary = getPrimaryMtprotoClient();
    if (primary && primary.connected) {
      attachRealtimeReplyListener(primary, 'tg1');
      return primary;
    }
    return null;
  }

  if (accountId === 'tg2') {
    const sess2 = state.config.accounts.tg2?.sessionString || process.env.TELEGRAM_SESSION_2 || '';
    if (!sess2) return null;
    if (secondaryMtprotoClient && secondaryMtprotoClient.connected) {
      attachRealtimeReplyListener(secondaryMtprotoClient, 'tg2');
      return secondaryMtprotoClient;
    }
    try {
      const { TelegramClient } = await import('telegram');
      const { StringSession } = await import('telegram/sessions/index.js');
      const client2 = new TelegramClient(new StringSession(sess2), apiId, apiHash, {
        connectionRetries: 5
      });
      await client2.connect();
      secondaryMtprotoClient = client2;
      attachRealtimeReplyListener(client2, 'tg2');
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
    return { sentViaMtproto: false, peerId: '' };
  }

  try {
    const { Api } = await import('telegram');
    const target = String(item.tgTarget || item.username || '').trim();
    if (!target) return { sentViaMtproto: false, peerId: '' };

    let entity = null;
    if (target.startsWith('+')) {
      try {
        const importRes = await client.invoke(
          new Api.contacts.ImportContacts({
            contacts: [
              new Api.InputPhoneContact({
                clientId: BigInt(Date.now()),
                phone: target,
                firstName: item.name || 'Заклад',
                lastName: item.city || ''
              })
            ]
          })
        );
        if (importRes?.users?.length > 0) {
          entity = importRes.users[0];
        }
      } catch (_) {}
      if (!entity) {
        entity = await client.getEntity(target).catch(() => null);
      }
    } else {
      const cleanHandle = target.replace(/^@+/, '');
      entity = await client.getEntity(cleanHandle).catch(() => null);
    }

    if (!entity) {
      return { sentViaMtproto: false, peerId: '' };
    }

    await client.sendMessage(entity, { message: messageText });
    return {
      sentViaMtproto: true,
      peerId: String(entity.id || '')
    };
  } catch (err) {
    console.warn(`[NFC Outreach] MTProto send warning (${accountId} -> ${item.username}):`, err.message);
    return { sentViaMtproto: false, peerId: '', error: err.message };
  }
}

async function dispatchInstagramDirectMessage(item, messageText) {
  const state = loadNfcOutreachDb();
  let sessionCookie = state.config.accounts.ig1?.sessionCookie || process.env.INSTAGRAM_SESSION_COOKIE || '';
  if (!sessionCookie) {
    return { sentViaApi: false, reason: 'no_session_cookie' };
  }

  const rawHandle = String(item.igTarget || item.username || '').replace(/^@+/, '').split(/[/?#]/)[0].trim();
  if (!rawHandle) return { sentViaApi: false, reason: 'no_target_handle' };

  try {
    let cleanCookie = sessionCookie.trim();
    if (!cleanCookie.includes('sessionid=')) {
      cleanCookie = `sessionid=${cleanCookie}`;
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
      'X-IG-App-ID': '936619743392459',
      'X-Requested-With': 'XMLHttpRequest',
      'Cookie': cleanCookie,
      'Referer': `https://www.instagram.com/${rawHandle}/`,
      'Origin': 'https://www.instagram.com'
    };

    const csrfMatch = cleanCookie.match(/csrftoken=([^;]+)/);
    if (csrfMatch) {
      headers['X-CSRFToken'] = csrfMatch[1];
    }

    // 1. Get user ID from web profile info
    const infoRes = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(rawHandle)}`, {
      headers
    }).catch(() => null);

    let targetUserId = null;
    if (infoRes && infoRes.ok) {
      const infoData = await infoRes.json().catch(() => null);
      targetUserId = infoData?.data?.user?.id;
    }

    if (!targetUserId) {
      return { sentViaApi: false, reason: 'user_id_not_found' };
    }

    // 2. Broadcast Direct Message via Instagram Web API
    const broadcastBody = new URLSearchParams({
      recipient_users: JSON.stringify([targetUserId]),
      action: 'send-item',
      client_context: String(Date.now()) + Math.floor(Math.random() * 10000),
      text: messageText
    });

    const sendRes = await fetch('https://www.instagram.com/api/v1/direct_v2/threads/broadcast/text/', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: broadcastBody.toString()
    }).catch(() => null);

    if (sendRes && sendRes.ok) {
      return { sentViaApi: true, targetUserId: String(targetUserId) };
    } else {
      const errText = sendRes ? await sendRes.text().catch(() => '') : 'network_error';
      return { sentViaApi: false, reason: 'broadcast_failed', error: errText };
    }
  } catch (err) {
    return { sentViaApi: false, error: err.message };
  }
}

/**
 * Picks the next account + venue in strict sequential order:
 * 1) TG Account #1 (up to 10 or 20 msgs, 10m interval)
 * 2) TG Account #2 (up to 10 or 20 msgs, 10m interval)
 * 3) IG Account #1 (up to 30 msgs, 3m interval)
 * 4) If all active accounts reached daily limits and queued items remain -> 15-20h Cooldown!
 */
export function selectNextOutreachStep(campaign, state) {
  const accs = state.config.accounts;
  const tg1Limit = Number(accs.tg1?.dailyLimit) || (state.config.warmupMode === 'warmed' ? 20 : 10);
  const tg2Limit = Number(accs.tg2?.dailyLimit) || (state.config.warmupMode === 'warmed' ? 20 : 10);
  const ig1Limit = Number(accs.ig1?.dailyLimit) || 30;

  const queued = (campaign.items || []).filter(i => i.sendState === 'queued');
  if (queued.length === 0) {
    return { action: 'completed' };
  }

  const queuedWithTg = queued.filter(i => Boolean(i.tgTarget));
  const queuedWithIg = queued.filter(i => Boolean(i.igTarget));

  // Stage 1: Telegram Account #1 (first 10 or 20 venues with Telegram)
  if (accs.tg1?.enabled !== false && (accs.tg1.sentToday || 0) < tg1Limit && queuedWithTg.length > 0) {
    return {
      action: 'send',
      stage: 'tg1',
      account: accs.tg1,
      channel: 'telegram',
      intervalMinutes: Number(state.config.tgIntervalMinutes) || 10,
      item: queuedWithTg[0]
    };
  }

  // Stage 2: Telegram Account #2 (next 10 or 20 venues with Telegram)
  if (accs.tg2?.enabled !== false && (accs.tg2.sentToday || 0) < tg2Limit && queuedWithTg.length > 0) {
    return {
      action: 'send',
      stage: 'tg2',
      account: accs.tg2,
      channel: 'telegram',
      intervalMinutes: Number(state.config.tgIntervalMinutes) || 10,
      item: queuedWithTg[0]
    };
  }

  // Stage 3: Instagram Account #1 (next 30 venues with Instagram)
  if (accs.ig1?.enabled !== false && (accs.ig1.sentToday || 0) < ig1Limit && queuedWithIg.length > 0) {
    return {
      action: 'send',
      stage: 'ig1',
      account: accs.ig1,
      channel: 'instagram',
      intervalMinutes: Number(state.config.igIntervalMinutes) || 3,
      item: queuedWithIg[0]
    };
  }

  // Check if remaining items have no available channel on remaining accounts, or if daily limits were hit
  const anyAccountHitLimit =
    ((accs.tg1?.enabled !== false && (accs.tg1.sentToday || 0) >= tg1Limit) ||
     (accs.tg2?.enabled !== false && (accs.tg2.sentToday || 0) >= tg2Limit)) && queuedWithTg.length > 0
    ||
    (accs.ig1?.enabled !== false && (accs.ig1.sentToday || 0) >= ig1Limit && queuedWithIg.length > 0);

  if (anyAccountHitLimit) {
    return { action: 'cooldown' };
  }

  // Fallback if an item only has TG and IG still has quota (or vice versa): use whichever contact the item has if an account has quota
  if (queued.length > 0) {
    const fallbackItem = queued[0];
    if (fallbackItem.igTarget && accs.ig1?.enabled !== false && (accs.ig1.sentToday || 0) < ig1Limit) {
      return {
        action: 'send',
        stage: 'ig1',
        account: accs.ig1,
        channel: 'instagram',
        intervalMinutes: Number(state.config.igIntervalMinutes) || 3,
        item: fallbackItem
      };
    }
    return { action: 'cooldown' };
  }

  return { action: 'completed' };
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

  // Check if cooldown has expired
  if (campaign.status === 'cooldown') {
    if (campaign.cooldownUntil && now < campaign.cooldownUntil && !forceImmediate) {
      return campaign;
    }
    // Cooldown finished -> reset daily counters for the new day and resume!
    state.config.accounts.tg1.sentToday = 0;
    state.config.accounts.tg2.sentToday = 0;
    state.config.accounts.ig1.sentToday = 0;
    campaign.status = 'running';
    campaign.cooldownUntil = null;
    campaign.nextSendAt = now;
  }

  if (!forceImmediate && campaign.nextSendAt && now < campaign.nextSendAt) {
    return campaign;
  }

  const step = selectNextOutreachStep(campaign, state);

  if (step.action === 'completed') {
    campaign.status = 'completed';
    campaign.currentStage = 'done';
    campaign.nextSendAt = null;
    campaign.cooldownUntil = null;
    saveNfcOutreachDb(state);
    return campaign;
  }

  if (step.action === 'cooldown') {
    const cooldownMs = computeCooldownDurationMs();
    campaign.status = 'cooldown';
    campaign.currentStage = 'cooldown';
    campaign.cooldownUntil = now + cooldownMs;
    campaign.nextSendAt = campaign.cooldownUntil;
    saveNfcOutreachDb(state);
    return campaign;
  }

  const { item, account, channel, stage, intervalMinutes } = step;
  const targetHandle = channel === 'telegram' ? (item.tgTarget || item.username) : (item.igTarget || item.username);
  const msgText = buildMessageForVenue(item.name, item.city || campaign.city, channel, item.templateIndex, state);

  item.channel = channel;
  item.username = targetHandle;
  item.accountId = account.id;
  item.accountLabel = account.handle ? `${account.label} (${account.handle})` : account.label;
  item.messageSent = msgText;
  item.sendState = 'sent';
  item.sentAt = new Date().toISOString();
  if (!item.result) {
    item.result = 'Ігнор / не відповідає';
  }

  if (channel === 'telegram') {
    const mtRes = await dispatchTelegramMessageMtproto(account.id, item, msgText);
    if (mtRes.peerId) {
      item.peerId = mtRes.peerId;
    }
  } else if (channel === 'instagram') {
    const igRes = await dispatchInstagramDirectMessage(item, msgText);
    if (igRes.targetUserId) {
      item.peerId = igRes.targetUserId;
    }
  }

  account.sentToday = (Number(account.sentToday) || 0) + 1;
  account.lastSentAt = item.sentAt;
  campaign.currentStage = stage;

  // Check what the NEXT step after this message will be
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
    campaign.nextSendAt = Date.now() + nextIntervalMin * 60 * 1000;
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

        // Check if this dialog belongs to any sent NFC venue lead
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
export function startNfcOutreachScheduler() {
  if (schedulerStarted || process.env.VERCEL) return;
  schedulerStarted = true;

  // Tick every 5 seconds for exact 10m TG / 3m IG / 15-20h cooldown scheduling
  setInterval(() => {
    const state = loadNfcOutreachDb();
    for (const camp of Object.values(state.campaigns || {})) {
      if (camp.status === 'running' || camp.status === 'cooldown') {
        executeNextOutreachSend(camp.jobId, false).catch(err => {
          console.warn('[NFC Outreach] Tick warning:', err.message);
        });
      }
    }
  }, 5000);

  // Poll Telegram replies every 45 seconds continuously 24/7
  setInterval(() => {
    pollActiveTelegramReplies().catch(() => {});
  }, 45000);

  console.log('[NFC Outreach] Автономний серверний рушій NFC-розсилки та 24/7 моніторингу відповідей запущено.');
}
