import { db } from '../backend/db/db.js';
import { cleanTelegramPostText, extractAuthorHandle, ingestMessage, loadSources } from '../backend/parser/monitor.js';
import { scanAllExchanges } from '../backend/parser/exchanges.js';
import { sendScanReport } from '../backend/bot.js';

const FAST_CHANNELS = [
  { handle: 'workplaceinukraine', title: 'Work Place UA' },
  { handle: 'aplaywork', title: 'A-Play Work UA' },
  { handle: 'jecontact', title: 'Je Contact IT & Digital' },
  { handle: 'adgoodashell', title: 'Ad Good as Hell' },
  { handle: 'top_vacansii', title: 'Топ Вакансії UA' },
  { handle: 'work_in_ukraine_golovne', title: 'Робота в Україні' },
  { handle: 'jobzy', title: 'Jobzy UA' },
  { handle: 'freelance_projects', title: 'Фріланс проєкти UA' },
  { handle: 'remote_jobs_ua', title: 'Віддалена робота UA' },
  { handle: 'ua_work', title: 'Робота UA' },
  { handle: 'it_jobs_ukraine', title: 'IT Вакансії Україна' },
  { handle: 'robota_viddaleno', title: 'Робота віддалено' },
  { handle: 'remote_work_ukraine', title: 'Remote Work Ukraine' },
  { handle: 'it_work_ua', title: 'IT Робота Україна' },
  { handle: 'smm_work_ua', title: 'SMM Вакансії та Маркетинг' },
  { handle: 'freelance_hub_ua', title: 'Freelance Hub UA' },
  { handle: 'robota_v_it', title: 'Робота в IT & Digital' },
  { handle: 'zaichenkoteam', title: 'Zaichenko Team' },
  { handle: 'lobbyx', title: 'Lobby X' },
  { handle: 'happymonday', title: 'Happy Monday' },
  { handle: 'kievy_rabota', title: 'Київ Робота' },
  { handle: 'remote_it_ua', title: 'Remote IT Ukraine' },
  { handle: 'digital_work_ua', title: 'Digital Work UA' },
  { handle: 'work_ua_it', title: 'Work UA IT' }
];

async function fastScanTelegramBatch(channels) {
  let telegramNew = 0;
  const BATCH_SIZE = 8;
  for (let i = 0; i < channels.length; i += BATCH_SIZE) {
    const batch = channels.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(batch.map(async (src) => {
      try {
        const res = await fetch(`https://t.me/s/${src.handle}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
          },
          signal: AbortSignal.timeout(4200)
        });
        if (!res.ok) return;
        const html = await res.text();
        const parts = html.split('tgme_widget_message_wrap');
        if (parts.length <= 1) return;

        for (let pIdx = 1; pIdx < parts.length; pIdx++) {
          const block = parts[pIdx];
          const textMatch = block.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<(?:div class="tgme_widget_message_footer"|\/div)/i) ||
                            block.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
          if (!textMatch) continue;

          const rawBodyHtml = textMatch[1];
          let cleanText = rawBodyHtml
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#39;/g, "'")
            .replace(/&#036;/g, '$')
            .replace(/&#33;/g, '!')
            .replace(/&nbsp;/g, ' ')
            .trim();

          cleanText = cleanTelegramPostText(cleanText);
          if (cleanText.length < 25) continue;

          const authorUsername = extractAuthorHandle(cleanText, rawBodyHtml, src.handle);
          if (!authorUsername) continue;

          const lead = ingestMessage({
            text: cleanText,
            authorName: authorUsername.replace('@', ''),
            authorUsername,
            sourceTitle: src.title,
            sourceUsername: '@' + src.handle,
            sourceType: 'channel'
          });

          if (lead) {
            telegramNew++;
          }
        }
      } catch (_) {}
    }));
  }
  return telegramNew;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const sources = loadSources();
    const customChannels = (sources.channels || []).slice(0, 16).map( item => {
      const raw = (typeof item === 'string' ? item : (item.username || '')).trim();
      const handle = raw.replace('https://t.me/', '').replace('@', '').split('/')[0].trim();
      return handle ? { handle, title: (typeof item === 'object' && item.title) ? item.title : handle } : null;
    }).filter(Boolean);

    const seen = new Set();
    const targetChannels = [];
    for (const ch of [...FAST_CHANNELS, ...customChannels]) {
      if (!ch.handle || seen.has(ch.handle.toLowerCase())) continue;
      seen.add(ch.handle.toLowerCase());
      targetChannels.push(ch);
    }

    const [tgRes, exRes] = await Promise.allSettled([
      Promise.race([
        fastScanTelegramBatch(targetChannels.slice(0, 32)),
        new Promise(r => setTimeout(() => r(0), 6500))
      ]),
      Promise.race([
        scanAllExchanges(),
        new Promise(r => setTimeout(() => r({ newLeads: 0, bySource: {} }), 6500))
      ])
    ]);

    const telegramNew = tgRes.status === 'fulfilled' ? (Number(tgRes.value) || 0) : 0;
    const exchangeResult = exRes.status === 'fulfilled' ? (exRes.value || { newLeads: 0, bySource: {} }) : { newLeads: 0, bySource: {} };
    const newLeads = telegramNew + (Number(exchangeResult.newLeads) || 0);

    const scanResult = {
      scanned: targetChannels.length,
      newLeads,
      telegramNew,
      exchanges: exchangeResult.bySource || {}
    };

    const shouldReport = req.query?.report === '1' || req.body?.sendReport !== false;
    if (shouldReport) {
      try {
        await sendScanReport(scanResult);
      } catch (e) {
        console.warn('[API Scan] sendScanReport warning:', e.message);
      }
    }

    const leads = db.getLeads();
    return res.status(200).json({
      success: true,
      scanResult,
      count: leads.length,
      data: leads.slice(0, 400)
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Scan failed'
    });
  }
}
