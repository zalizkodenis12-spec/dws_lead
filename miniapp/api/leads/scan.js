import { scanPublicChannels } from '../../../backend/parser/monitor.js';
import { sendScanReport } from '../../../backend/bot.js';
import { db } from '../../../backend/db/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const result = await scanPublicChannels();
    try {
      await sendScanReport(result, '🔄 Оновлення вакансій через кнопку "Оновити"');
    } catch (err) {
      console.error('[Scan Handler] Error sending report:', err.message);
    }

    const leads = db.getLeads();
    return res.status(200).json({
      success: true,
      scanResult: result,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    console.error('[Scan Handler] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
