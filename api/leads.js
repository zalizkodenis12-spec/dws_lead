import { initialLeads } from './data.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { category, subcategory, budget, query, sortBy } = req.query || {};
  let list = [...initialLeads];

  if (category && category !== 'all') {
    list = list.filter(l => l.category === category);
  }
  if (subcategory && subcategory !== 'all') {
    list = list.filter(l => l.subcategory === subcategory);
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(l => (l.title || '').toLowerCase().includes(q) || (l.text || '').toLowerCase().includes(q));
  }

  return res.status(200).json({
    success: true,
    count: list.length,
    data: list
  });
}
