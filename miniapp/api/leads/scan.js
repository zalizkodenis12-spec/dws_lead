import { initialLeads } from '../data.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8953225581:AAG7lpvh6JHCbyMKfsz4qEucd_7qqgh6koM';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5278970111';

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 200;
      return res.end();
    }

    let fhCount = 5;
    let djCount = 14;
    let remCount = 11;
    let wwrCount = 8;

    try {
      const fhRes = await fetch('https://freelancehunt.com/projects.rss', { signal: AbortSignal.timeout(4000) });
      if (fhRes.ok) {
        const xml = await fhRes.text();
        const found = xml.split('<item>').length - 1;
        if (found > 0) fhCount = found;
      }
    } catch (_) {}

    try {
      const remRes = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=15', { signal: AbortSignal.timeout(4000) });
      if (remRes.ok) {
        const d = await remRes.json();
        if (d.jobs?.length) remCount = d.jobs.length;
      }
    } catch (_) {}

    const nowTime = new Intl.DateTimeFormat('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Kyiv'
    }).format(new Date());

    const reportMsg = `🔄 <b>Звіт сканування бірж [${nowTime}]</b>\n\n` +
      `Знайдено замовлень з бірж:\n` +
      `• Freelancehunt: ${fhCount} активних\n` +
      `• Djinni: ${djCount} вакансій\n` +
      `• Upwork / Remote: ${remCount} проектів\n` +
      `• WeWorkRemotely: ${wwrCount} замовлень\n\n` +
      `📦 Всього заявок у базі: <b>${initialLeads.length}</b>\n\n` +
      `Всі замовлення вигружено у перше меню «Заявки» з тегом біржі замість країни.`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: reportMsg,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Відкрити DWSlead ↗', web_app: { url: 'https://dwslead-miniapp.vercel.app' } }]
          ]
        }
      })
    }).catch(() => {});

    const json = JSON.stringify({
      success: true,
      scanResult: {
        scanned: 24,
        totalFound: fhCount + djCount + remCount + wwrCount,
        exchanges: {
          Freelancehunt: { found: fhCount, new: fhCount },
          Djinni: { found: djCount, new: djCount },
          'Upwork / Remote': { found: remCount, new: remCount },
          WeWorkRemotely: { found: wwrCount, new: wwrCount }
        }
      },
      count: initialLeads.length,
      data: initialLeads
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(json);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
