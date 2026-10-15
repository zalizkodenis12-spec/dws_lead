import { initialDatabase } from '../backend/db/defaultDatabase.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const leads = initialDatabase.leads || [];
    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
