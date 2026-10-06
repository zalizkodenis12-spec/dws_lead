import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './db/db.js';
import { analyzeLeadAi, generatePersonalizedOffer } from './ai/gemini.js';
import { ingestMessage, loadSources } from './parser/monitor.js';
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
    const { category, subcategory, budget, query, sortBy } = req.query;
    const leads = db.getLeads({ category, subcategory, budget, query, sortBy });
    res.json({ success: true, count: leads.length, data: leads });
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

app.post('/api/sources', (req, res) => {
  try {
    const updated = db.updateSources(req.body);
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
});
