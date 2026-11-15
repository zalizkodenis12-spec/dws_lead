import { scrapeD2dRadar } from '../backend/scraper/d2dScraper.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { niche, city, cluster, limit, waveOffset, googleKey } = req.body || {};
    const result = await scrapeD2dRadar({ niche, city, cluster, limit, waveOffset, googleKey });
    return res.status(200).json({
      success: true,
      count: result.items.length,
      items: result.items,
      stats: result.stats,
      waveKey: result.waveKey,
      nextWaveOffset: result.nextWaveOffset
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'D2D search error' });
  }
}
