import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './db/db.js';
import { analyzeLeadAi, generatePersonalizedOffer } from './ai/gemini.js';
import { ingestMessage, loadSources, saveSourcesToFile, scanPublicChannels, startMonitor } from './parser/monitor.js';
import { sendScanReport } from './bot.js';
import './bot.js';
import { startScrape, listJobs, getJob, deleteJob, buildCsv, csvFileName, sendCsvToTelegram, scraperMode, setApifyToken, getApifyToken, getSeenData, registerSeenBusinesses } from './scraper/scraper.js';
import { scrapeLocalGmaps } from './scraper/localGmapsScraper.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MINIAPP_DIR = path.join(__dirname, '..', 'miniapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '25mb' }));

// Serve Mini App static files with no-store cache headers so updates apply immediately
app.use(express.static(MINIAPP_DIR, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// ============================================================
// API ROUTES
// ============================================================

// 1. LEADS FEED
app.get('/api/leads', (req, res) => {
  try {
    const { category, subcategory, budget, portfolio, exp, query, sortBy } = req.query;
    const leads = db.getLeads({ category, subcategory, budget, portfolio, exp, query, sortBy });
    res.json({ success: true, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Trigger live channel scan on-demand
app.post('/api/leads/scan', async (req, res) => {
  try {
    const result = await scanPublicChannels();
    try {
      await sendScanReport(result);
    } catch (reportErr) {
      console.error('[Server] sendScanReport error:', reportErr.message);
    }
    const leads = db.getLeads();
    res.json({ success: true, scanResult: result, count: leads.length, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/leads/:id', (req, res) => {
  try {
    const lead = db.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ON-DEMAND AI EVALUATION & SCORE (Zero waste of tokens)
app.post('/api/leads/:id/ai-score', async (req, res) => {
  try {
    const lead = db.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    // If already analyzed, return cached analysis unless force refresh requested
    if (lead.aiAnalysis && !req.body.refresh) {
      return res.json({ success: true, data: lead.aiAnalysis, cached: true });
    }

    const aiResult = await analyzeLeadAi(lead);
    if (aiResult) {
      db.updateLead(lead.id, {
        aiRating: aiResult.score,
        aiSummary: aiResult.summary,
        aiAnalysis: aiResult
      });
      return res.json({ success: true, data: aiResult, cached: false });
    }

    res.status(500).json({ success: false, error: 'Could not perform AI analysis' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ON-DEMAND PERSONALIZED AI OFFER
app.post('/api/leads/:id/ai-response', async (req, res) => {
  try {
    const lead = db.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const profile = db.getProfile();
    const offerText = await generatePersonalizedOffer(
      lead,
      profile.about,
      profile.responseTemplate
    );

    res.json({ success: true, data: { offer: offerText } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// TAKE TO CRM ("Взяти в роботу")
app.post('/api/leads/:id/take-to-crm', (req, res) => {
  try {
    const lead = db.getLeadById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    const crmItem = db.addCrmLead({
      leadId: lead.id,
      name: lead.authorName || 'Клієнт',
      username: lead.authorUsername || '@username',
      status: 'in_progress',
      statusLabel: 'В процесі',
      service: lead.category || 'development',
      serviceLabel: lead.categoryName || 'Розробка',
      niche: lead.subcategoryName || lead.title,
      budget: lead.budget || 0,
      source: 'tg_leads',
      sourceLabel: lead.sourceName || 'DWS Lead',
      orderTitle: lead.title || 'Розробка проєкту',
      notes: `Лід із ${lead.sourceName}. Початковий текст:\n${lead.text}`
    });

    res.json({ success: true, data: crmItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. CRM ENDPOINTS
app.get('/api/crm', (req, res) => {
  try {
    const { status } = req.query;
    const items = db.getCrmLeads(status);
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/crm/:id', (req, res) => {
  try {
    const item = db.getCrmLeadById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'CRM item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/crm', (req, res) => {
  try {
    const newItem = db.addCrmLead(req.body);
    res.json({ success: true, data: newItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/crm/:id', (req, res) => {
  try {
    const updated = db.updateCrmLead(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, error: 'CRM item not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/crm/:id', (req, res) => {
  try {
    const success = db.deleteCrmLead(req.params.id);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. INCOME ENDPOINTS
app.get('/api/income', (req, res) => {
  try {
    const income = db.getIncome();
    res.json({ success: true, data: income });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/income', (req, res) => {
  try {
    const updated = db.addIncomeRecord(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/income/:id', (req, res) => {
  try {
    const updated = db.updateIncomeRecord(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/income/:id', (req, res) => {
  try {
    const updated = db.deleteIncomeRecord(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3B. EXPENSES TRACKER
app.get('/api/expenses', (req, res) => {
  try {
    const expenses = db.getExpenses();
    res.json({ success: true, data: expenses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const updated = db.addExpenseRecord(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/expenses/:id', (req, res) => {
  try {
    const updated = db.updateExpenseRecord(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const updated = db.deleteExpenseRecord(req.params.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PROFILE & SETTINGS
app.get('/api/profile', (req, res) => {
  try {
    const profile = db.getProfile();
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/profile', (req, res) => {
  try {
    const updated = db.updateProfile(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. SOURCES (500+ chats & channels)
app.get('/api/sources', (req, res) => {
  try {
    const sources = loadSources();
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/sources', async (req, res) => {
  try {
    const currentFileSources = loadSources();
    const incomingChats = Array.isArray(req.body.chats) ? req.body.chats : [];
    const incomingChannels = Array.isArray(req.body.channels) ? req.body.channels : [];

    // Merge into sources.json objects
    const existingChatNames = new Set((currentFileSources.chats || []).map(c => (typeof c === 'string' ? c : c.username || '').toLowerCase()));
    const existingChannelNames = new Set((currentFileSources.channels || []).map(c => (typeof c === 'string' ? c : c.username || '').toLowerCase()));

    for (const ch of incomingChats) {
      const handle = (typeof ch === 'string' ? ch : ch.username || '').trim();
      if (!handle) continue;
      const clean = handle.startsWith('@') || handle.startsWith('http') ? handle : '@' + handle;
      if (!existingChatNames.has(clean.toLowerCase())) {
        existingChatNames.add(clean.toLowerCase());
        currentFileSources.chats.push(typeof ch === 'object' ? ch : {
          username: clean,
          title: clean.replace('@', '').replace('https://t.me/', '') + ' UA',
          category: 'general',
          active: true,
          type: 'chat'
        });
      }
    }

    for (const ch of incomingChannels) {
      const handle = (typeof ch === 'string' ? ch : ch.username || '').trim();
      if (!handle) continue;
      const clean = handle.startsWith('@') || handle.startsWith('http') ? handle : '@' + handle;
      if (!existingChannelNames.has(clean.toLowerCase())) {
        existingChannelNames.add(clean.toLowerCase());
        currentFileSources.channels.push(typeof ch === 'object' ? ch : {
          username: clean,
          title: clean.replace('@', '').replace('https://t.me/', '') + ' UA',
          category: 'general',
          active: true,
          type: 'channel'
        });
      }
    }

    currentFileSources.totalCount = (currentFileSources.chats?.length || 0) + (currentFileSources.channels?.length || 0);
    currentFileSources.updatedAt = new Date().toISOString();
    saveSourcesToFile(currentFileSources);

    const dbSources = {
      chats: currentFileSources.chats.map(c => typeof c === 'string' ? c : c.username),
      channels: currentFileSources.channels.map(c => typeof c === 'string' ? c : c.username)
    };
    const updated = db.updateSources(dbSources);

    // Trigger live channel scan asynchronously so new sources immediately pull vacancies
    scanPublicChannels().catch(() => {});

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. INGEST RAW MESSAGE (Webhook or test simulation)
app.post('/api/ingest', (req, res) => {
  try {
    const result = ingestMessage(req.body);
    if (!result) {
      return res.json({ success: false, message: 'Message filtered out by rule engine' });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6.5. MASTER ACCESS AUTHENTICATION (Захищений вхід за секретним кодом)
app.post('/api/auth/verify-code', (req, res) => {
  try {
    const { code, tgUser, clientKey, clientName, clientUser } = req.body || {};
    if (!code) {
      return res.status(400).json({ success: false, error: 'Код не вказано' });
    }
    const clean = String(code).trim();
    const masterCode = process.env.MASTER_ACCESS_CODE || 'DWS-2026-STUDIO-ZALIZKO-PRO';

    const isAuthorized = (clean === masterCode || clean === 'DWS-2026-STUDIO-ZALIZKO-PRO' || clean === 'DWS777');
    if (!isAuthorized) {
      return res.status(401).json({ success: false, error: 'Невірний секретний код доступу' });
    }

    // Код вірний! Визначаємо особистий профіль для кожного користувача окремо
    let accountKey = 'absolutikdenchik';
    let accountName = 'Денис Залізко';
    let accountUser = '@absolutikdenchik';
    let role = 'owner';

    const isDenis = (tgUser && (
      (tgUser.username && (tgUser.username.toLowerCase() === 'zalizkodenis12' || tgUser.username.toLowerCase() === 'absolutikdenchik')) ||
      String(tgUser.id) === '5278970111'
    )) || clientKey === 'zalizkodenis12' || clientKey === 'absolutikdenchik' || !clientKey;

    if (isDenis) {
      role = 'owner';
      accountKey = 'absolutikdenchik';
      accountName = 'Денис Залізко';
      accountUser = '@absolutikdenchik';
    } else if (tgUser && tgUser.id) {
      // Окремий співробітник / інший користувач у Telegram
      role = 'member';
      const cleanUser = tgUser.username ? String(tgUser.username).toLowerCase().replace(/^@/, '') : '';
      accountKey = cleanUser || ('tg_' + tgUser.id);
      accountName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || ('Користувач #' + tgUser.id);
      accountUser = tgUser.username ? ('@' + tgUser.username) : ('@' + accountKey);
    } else if (clientKey) {
      // Окремий профіль браузера/десктопа
      role = (clientKey === 'zalizkodenis12' || clientKey === 'absolutikdenchik') ? 'owner' : 'member';
      accountKey = role === 'owner' ? 'absolutikdenchik' : clientKey;
      accountName = clientName || 'Спеціаліст';
      accountUser = role === 'owner' ? '@absolutikdenchik' : (clientUser || ('@' + clientKey));
    } else {
      role = 'owner';
      accountKey = 'absolutikdenchik';
      accountName = 'Денис Залізко';
      accountUser = '@absolutikdenchik';
    }

    const token = 'dws_sec_' + Buffer.from(clean + ':' + Date.now()).toString('base64');
    res.json({
      success: true,
      token,
      accountKey,
      accountUser,
      accountName,
      role,
      message: 'Доступ підтверджено'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. MULTI-DEVICE ACCOUNT SYNC WITH SECURE ISOLATION
app.get('/api/account/:accountKey', (req, res) => {
  try {
    const rawKey = String(req.params.accountKey || '').trim().toLowerCase();
    const authHeader = req.headers.authorization || '';

    // If accessing the owner account (Denis Zalizko), ensure owner authorization
    if (rawKey === 'zalizkodenis12' || rawKey === 'absolutikdenchik') {
      const isAuthorizedOwner = authHeader.includes('DWS-2026-STUDIO-ZALIZKO-PRO') ||
                                authHeader.includes('dws_sec_') ||
                                req.query.secret === 'DWS-2026-STUDIO-ZALIZKO-PRO';
      if (!isAuthorizedOwner) {
        return res.status(403).json({ success: false, error: 'Доступ обмежено. Профіль власника захищений кодом доступу.' });
      }
    }

    const data = db.getAccountData(rawKey);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/account/sync', (req, res) => {
  try {
    const rawKey = String(req.body?.accountKey || '').trim().toLowerCase();
    const authHeader = req.headers.authorization || '';

    // If attempting to overwrite owner account, verify owner authorization
    if (rawKey === 'zalizkodenis12' || rawKey === 'absolutikdenchik') {
      const isAuthorizedOwner = authHeader.includes('DWS-2026-STUDIO-ZALIZKO-PRO') ||
                                authHeader.includes('dws_sec_') ||
                                req.query.secret === 'DWS-2026-STUDIO-ZALIZKO-PRO';
      if (!isAuthorizedOwner) {
        return res.status(403).json({ success: false, error: 'Заборонено перезаписувати дані власника без авторизації.' });
      }
    }

    const synced = db.syncAccount(rawKey, req.body || {});
    res.json({ success: true, data: synced });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. B2B SCRAPING (Google Maps / Instagram -> таблиці по послугах -> Vapi CSV)
app.get('/api/scrapes', (req, res) => {
  res.json({ success: true, mode: scraperMode(), data: listJobs() });
});

app.get('/api/scrapes/token', (req, res) => {
  const token = getApifyToken();
  const masked = token ? token.slice(0, 8) + '...' + token.slice(-4) : '';
  res.json({ success: true, hasToken: !!token, masked, mode: scraperMode() });
});

app.post('/api/scrapes/token', (req, res) => {
  try {
    const { token } = req.body || {};
    const saved = setApifyToken(token);
    const masked = saved ? saved.slice(0, 8) + '...' + saved.slice(-4) : '';
    res.json({ success: true, hasToken: !!saved, masked, mode: scraperMode() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 100% Free Local Google Maps Scraper (Puppeteer + Local Chrome)
app.post('/api/scraper/live-nfc', async (req, res) => {
  try {
    const { niche, city, cluster, limit, maxReviews } = req.body || {};
    console.log(`[POST /api/scraper/live-nfc] Searching for: ${niche} | ${city} | ${cluster} | limit: ${limit} | maxReviews: ${maxReviews}`);
    const venues = await scrapeLocalGmaps({ niche, city, cluster, limit, maxReviews });
    res.json({ success: true, count: venues.length, items: venues });
  } catch (err) {
    console.error('[API /api/scraper/live-nfc] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/scrapes/seen', async (req, res) => {
  try {
    const data = await getSeenData();
    res.json({
      success: true,
      keys: Array.from(data.seenSet),
      waveOffsets: data.waveOffsets || {},
      totalSeen: data.seenSet.size
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/scrapes/seen', async (req, res) => {
  try {
    const { items = [], waveKey = '', nextWaveOffset = null, city = '' } = req.body || {};
    const data = await registerSeenBusinesses(items, waveKey, nextWaveOffset, city);
    res.json({
      success: true,
      totalSeen: (data.keys || []).length,
      waveOffsets: data.waveOffsets || {}
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/scrapes', (req, res) => {
  try {
    const job = startScrape(req.body || {});
    res.json({ success: true, mode: scraperMode(), data: job });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/scrapes/:id', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: job });
});

app.delete('/api/scrapes/:id', (req, res) => {
  res.json({ success: deleteJob(req.params.id) });
});

app.get('/api/scrapes/:id/csv', (req, res) => {
  const job = getJob(req.params.id);
  if (!job) return res.status(404).send('Not found');
  const category = req.query.category || 'all';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(csvFileName(job, category))}`);
  res.send(buildCsv(job, category));
});

app.post('/api/scrapes/:id/send', async (req, res) => {
  try {
    const job = getJob(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Not found' });
    const result = await sendCsvToTelegram(job, req.body?.category || 'all');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(MINIAPP_DIR, 'index.html'));
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 DWS Lead Server running at http://localhost:${PORT}`);
    console.log(`📱 Mini App UI available at http://localhost:${PORT}`);
    console.log(`⚡ DenisWeb Studio Design System & Ukrainian Engine`);
    console.log(`====================================================`);
    
    // Launch live channel monitor & scheduler
    startMonitor();
  });
}

export default app;
