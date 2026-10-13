import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './db/db.js';
import { analyzeLeadAi, generatePersonalizedOffer } from './ai/gemini.js';
import { ingestMessage, loadSources, saveSourcesToFile, scanPublicChannels, startMonitor } from './parser/monitor.js';
import './bot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MINIAPP_DIR = path.join(__dirname, '..', 'miniapp');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve Mini App static files
app.use(express.static(MINIAPP_DIR));

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

// 5. SOURCES (200 chats & 200 channels)
app.get('/api/sources', (req, res) => {
  try {
    const sources = db.getSources();
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

// 7. MULTI-DEVICE ACCOUNT SYNC
app.get('/api/account/:accountKey', (req, res) => {
  try {
    const data = db.getAccountData(req.params.accountKey);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/account/sync', (req, res) => {
  try {
    const { accountKey, crm, income, profile, takenLeadIds, username, name } = req.body;
    const synced = db.syncAccount(accountKey, { crm, income, profile, takenLeadIds, username, name });
    res.json({ success: true, data: synced });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(MINIAPP_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 DWS Lead Server running at http://localhost:${PORT}`);
  console.log(`📱 Mini App UI available at http://localhost:${PORT}`);
  console.log(`⚡ DenisWeb Studio Design System & Ukrainian Engine`);
  console.log(`====================================================`);
  
  // Launch live channel monitor & scheduler
  startMonitor();
});
