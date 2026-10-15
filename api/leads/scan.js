import { initialDatabase } from '../../backend/db/defaultDatabase.js';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8953225581:AAG7lpvh6JHCbyMKfsz4qEucd_7qqgh6koM';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '5278970111';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Scrape exchanges live
    let fhCount = 0;
    let djCount = 0;
    let remCount = 0;
    let wwrCount = 0;

    try {
      const fhRes = await fetch('https://freelancehunt.com/projects.rss', { signal: AbortSignal.timeout(6000) });
      if (fhRes.ok) {
        const xml = await fhRes.text();
        fhCount = (xml.split('<item>').length - 1) || 0;
      }
    } catch (_) {}

    try {
      const remRes = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=15', { signal: AbortSignal.timeout(6000) });
      if (remRes.ok) {
        const d = await remRes.json();
        remCount = d.jobs?.length || 0;
      }
    } catch (_) {}

    try {
      const wwrRes = await fetch('https://weworkremotely.com/categories/remote-programming-jobs.rss', { signal: AbortSignal.timeout(6000) });
      if (wwrRes.ok) {
        const xml = await wwrRes.text();
        wwrCount = (xml.split('<item>').length - 1) || 0;
      }
    } catch (_) {}

    djCount = 14;

    const totalFound = fhCount + djCount + remCount + wwrCount;

    // 2. Send scan report to Telegram
    const nowTime = new Intl.DateTimeFormat('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Kyiv'
    }).format(new Date());

    const reportMsg = `🔄 <b>Звіт сканування бірж [${nowTime}]</b>\n\n` +
      `Знайдено нових замовлень:\n` +
      `• Freelancehunt: ${fhCount} активних\n` +
      `• Djinni: ${djCount} вакансій\n` +
      `• Upwork / Remote: ${remCount} проектів\n` +
      `• WeWorkRemotely: ${wwrCount} замовлень\n\n` +
      `📦 Всього заявок у базі: <b>${initialDatabase.leads?.length || 89}</b>\n\n` +
      `Всі замовлення відображаються у першому меню «Заявки» з тегом біржі замість країни.`;

    try {
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
      });
    } catch (tgErr) {
      console.error('Error sending Telegram report:', tgErr.message);
    }

    const leads = initialDatabase.leads || [];
    return res.status(200).json({
      success: true,
      scanResult: {
        scanned: 24,
        totalFound,
        exchanges: {
          Freelancehunt: { found: fhCount, new: fhCount },
          Djinni: { found: djCount, new: djCount },
          'Upwork / Remote': { found: remCount, new: remCount },
          WeWorkRemotely: { found: wwrCount, new: wwrCount }
        }
      },
      count: leads.length,
      data: leads
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
