import { db } from '../../backend/db/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { category, subcategory, budget, portfolio, exp, query, sortBy } = req.query || {};
    const leads = db.getLeads({ category, subcategory, budget, portfolio, exp, query, sortBy });
    return res.status(200).json({
      success: true,
      count: leads.length,
      data: leads
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
