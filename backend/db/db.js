import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialDatabase } from './defaultDatabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BUNDLED_DB_PATH = path.join(__dirname, 'database.json');

const IS_SERVERLESS = !!process.env.VERCEL;
const DB_PATH = IS_SERVERLESS ? '/tmp/dws-database.json' : BUNDLED_DB_PATH;

let memoryCache = null;

function readDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file:', err.message);
  }

  if (!memoryCache) {
    memoryCache = JSON.parse(JSON.stringify(initialDatabase));
  }
  return memoryCache;
}

function writeDb(data) {
  memoryCache = data;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    const miniappLeadsPath = path.join(__dirname, '..', '..', 'miniapp', 'leads-data.json');
    if (data.leads && Array.isArray(data.leads)) {
      try {
        fs.writeFileSync(miniappLeadsPath, JSON.stringify({
          success: true,
          count: data.leads.length,
          data: data.leads
        }, null, 2), 'utf-8');
      } catch (e) {}
    }
    return true;
  } catch (err) {
    return true;
  }
}

export const db = {
  // ---- LEADS ----
  getLeads(filters = {}) {
    const data = readDb();
    let leads = [...(data.leads || [])];

    // Filter by category
    if (filters.category && filters.category !== 'all') {
      leads = leads.filter(l => l.category === filters.category);
    }

    // Filter by subcategory
    if (filters.subcategory && filters.subcategory !== 'all') {
      leads = leads.filter(l => l.subcategory === filters.subcategory);
    }

    // Filter by budget
    if (filters.budget) {
      if (filters.budget === 'under5k') leads = leads.filter(l => (l.budget || 0) < 5000);
      else if (filters.budget === '5k-15k') leads = leads.filter(l => (l.budget || 0) >= 5000 && (l.budget || 0) <= 15000);
      else if (filters.budget === '15k-30k') leads = leads.filter(l => (l.budget || 0) > 15000 && (l.budget || 0) <= 30000);
      else if (filters.budget === '30k+') leads = leads.filter(l => (l.budget || 0) > 30000);
    }

    // Filter by portfolio
    if (filters.portfolio && filters.portfolio !== 'any') {
      if (filters.portfolio === 'required') leads = leads.filter(l => l.requiresPortfolio);
      else if (filters.portfolio === 'none') leads = leads.filter(l => !l.requiresPortfolio);
    }

    // Filter by experience
    if (filters.exp && filters.exp !== 'any') {
      if (filters.exp === 'required') leads = leads.filter(l => l.experienceRequired);
      else if (filters.exp === 'none') leads = leads.filter(l => !l.experienceRequired);
    }

    // Filter by search query
    if (filters.query && typeof filters.query === 'string' && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      leads = leads.filter(l =>
        (l.title && l.title.toLowerCase().includes(q)) ||
        (l.text && l.text.toLowerCase().includes(q)) ||
        (l.categoryName && l.categoryName.toLowerCase().includes(q)) ||
        (l.authorUsername && l.authorUsername.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (filters.sortBy === 'budget_desc') {
      leads.sort((a, b) => (b.budget || 0) - (a.budget || 0));
    } else if (filters.sortBy === 'rating_desc') {
      leads.sort((a, b) => (b.aiRating || 0) - (a.aiRating || 0));
    } else {
      // Default: date desc
      leads.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    }

    return leads;
  },

  getLeadById(id) {
    const data = readDb();
    return data.leads.find(l => l.id === id) || null;
  },

  addLead(newLead) {
    const data = readDb();
    if (!newLead.id) {
      newLead.id = `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    // Deduplication check: by title or first 80 characters of text
    const textSnippet = (newLead.text || '').trim().substring(0, 80);
    const isDuplicate = (data.leads || []).some(l => {
      if (l.title && newLead.title && l.title.trim().toLowerCase() === newLead.title.trim().toLowerCase()) return true;
      if (textSnippet && l.text && l.text.trim().substring(0, 80) === textSnippet) return true;
      return false;
    });
    if (isDuplicate) {
      return null;
    }

    if (!newLead.date) {
      newLead.date = new Date().toISOString();
    }
    data.leads.unshift(newLead);
    writeDb(data);
    return newLead;
  },

  updateLead(id, updates) {
    const data = readDb();
    const idx = data.leads.findIndex(l => l.id === id);
    if (idx === -1) return null;
    data.leads[idx] = { ...data.leads[idx], ...updates };
    writeDb(data);
    return data.leads[idx];
  },

  // ---- CRM ----
  getCrmLeads(status = 'all') {
    const data = readDb();
    let crm = [...(data.crm || [])];
    if (status && status !== 'all') {
      crm = crm.filter(c => c.status === status);
    }
    // Sort recently updated first
    crm.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    return crm;
  },

  getCrmLeadById(id) {
    const data = readDb();
    return data.crm.find(c => c.id === id) || null;
  },

  addCrmLead(leadData) {
    const data = readDb();
    const newId = `crm-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const avatarLetter = (leadData.name && leadData.name.trim()) ? leadData.name.trim().charAt(0).toUpperCase() : 'Л';

    const newCrmItem = {
      id: newId,
      leadId: leadData.leadId || null,
      name: leadData.name || 'Клієнт',
      username: leadData.username || '@username',
      avatarLetter,
      status: leadData.status || 'follow_up',
      statusLabel: leadData.statusLabel || 'Follow-up',
      service: leadData.service || 'development',
      serviceLabel: leadData.serviceLabel || 'Розробка',
      niche: leadData.niche || '',
      budget: Number(leadData.budget) || 0,
      currency: '₴',
      source: leadData.source || 'tg_leads',
      sourceLabel: leadData.sourceLabel || 'DWS Lead',
      notes: leadData.notes || '',
      links: leadData.links || {
        telegram: leadData.username ? `https://t.me/${leadData.username.replace('@', '')}` : '',
        instagram: '',
        tiktok: '',
        site: '',
        phone: ''
      },
      orders: Array.isArray(leadData.orders) ? leadData.orders : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.crm.unshift(newCrmItem);

    // If originated from lead, mark lead as inCrm
    if (leadData.leadId) {
      const leadIdx = data.leads.findIndex(l => l.id === leadData.leadId);
      if (leadIdx !== -1) {
        data.leads[leadIdx].inCrm = true;
      }
    }

    writeDb(data);
    return newCrmItem;
  },

  updateCrmLead(id, updates) {
    const data = readDb();
    const idx = data.crm.findIndex(c => c.id === id);
    if (idx === -1) return null;

    updates.updatedAt = new Date().toISOString();
    data.crm[idx] = { ...data.crm[idx], ...updates };
    writeDb(data);
    return data.crm[idx];
  },

  deleteCrmLead(id) {
    const data = readDb();
    const idx = data.crm.findIndex(c => c.id === id);
    if (idx === -1) return false;

    const removed = data.crm.splice(idx, 1)[0];
    // If was tied to lead, unmark lead
    if (removed && removed.leadId) {
      const lIdx = data.leads.findIndex(l => l.id === removed.leadId);
      if (lIdx !== -1) {
        data.leads[lIdx].inCrm = false;
      }
    }
    writeDb(data);
    return true;
  },

  // ---- INCOME ----
  getIncome() {
    const data = readDb();
    if (!data.income) {
      data.income = { records: [], currency: '₴' };
    }
    if (!Array.isArray(data.income.records)) {
      data.income.records = [];
    }
    let totalEarned = 0;
    let totalExpected = 0;
    for (const r of data.income.records) {
      const amt = Number(r.amount) || 0;
      if (r.isPaid) totalEarned += amt;
      else totalExpected += amt;
    }
    return {
      records: data.income.records,
      totalEarned,
      totalExpected,
      currency: data.income.currency || '₴'
    };
  },

  addIncomeRecord(record) {
    const data = readDb();
    if (!data.income) {
      data.income = { records: [], currency: '₴' };
    }
    if (!Array.isArray(data.income.records)) {
      data.income.records = [];
    }

    const amount = Number(record.amount) || 0;
    const isPaid = record.isPaid === true || record.isPaid === 'true';
    const date = record.date ? new Date(record.date).toISOString() : new Date().toISOString();

    const newRecord = {
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      project: record.project || 'Замовлення',
      client: record.client || 'Клієнт',
      amount,
      currency: '₴',
      isPaid,
      date
    };

    data.income.records.unshift(newRecord);
    writeDb(data);
    return this.getIncome();
  },

  deleteIncomeRecord(id) {
    const data = readDb();
    if (data.income && Array.isArray(data.income.records)) {
      data.income.records = data.income.records.filter(r => r.id !== id);
      writeDb(data);
    }
    return this.getIncome();
  },

  updateIncomeRecord(id, updates) {
    const data = readDb();
    if (data.income && Array.isArray(data.income.records)) {
      const idx = data.income.records.findIndex(r => r.id === id);
      if (idx !== -1) {
        if (updates.amount !== undefined) updates.amount = Number(updates.amount) || 0;
        if (updates.isPaid !== undefined) updates.isPaid = Boolean(updates.isPaid);
        data.income.records[idx] = { ...data.income.records[idx], ...updates };
        writeDb(data);
      }
    }
    return this.getIncome();
  },

  // ---- EXPENSES ----
  getExpenses() {
    const data = readDb();
    if (!data.expenses) {
      data.expenses = {
        records: [
          {
            id: "exp-1792170001-1",
            title: "Реклама Meta (Instagram / Facebook)",
            category: "Маркетинг",
            amount: 4000,
            isPaid: true,
            currency: "₴",
            date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: "exp-1792170002-2",
            title: "NFC акрил, заготовки та безконтактні чіпи",
            category: "Виробництво",
            amount: 3200,
            isPaid: true,
            currency: "₴",
            date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
          },
          {
            id: "exp-1792170003-3",
            title: "Підписка Cursor Pro + Vercel Pro",
            category: "Сервіси",
            amount: 1450,
            isPaid: true,
            currency: "₴",
            date: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString()
          }
        ],
        currency: '₴'
      };
    }
    if (!Array.isArray(data.expenses.records)) {
      data.expenses.records = [];
    }
    let totalSpent = 0;
    for (const r of data.expenses.records) {
      const amt = Number(r.amount) || 0;
      if (r.isPaid) totalSpent += amt;
    }
    return {
      records: data.expenses.records,
      totalSpent,
      currency: data.expenses.currency || '₴'
    };
  },

  addExpenseRecord(record) {
    const data = readDb();
    if (!data.expenses) {
      data.expenses = { records: [], currency: '₴' };
    }
    if (!Array.isArray(data.expenses.records)) {
      data.expenses.records = [];
    }

    const amount = Number(record.amount) || 0;
    const isPaid = record.isPaid === true || record.isPaid === 'true';
    const date = record.date ? new Date(record.date).toISOString() : new Date().toISOString();

    const newRecord = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: record.title || 'Витрата',
      category: record.category || 'Загальне',
      amount,
      currency: '₴',
      isPaid,
      date
    };

    data.expenses.records.unshift(newRecord);
    writeDb(data);
    return this.getExpenses();
  },

  deleteExpenseRecord(id) {
    const data = readDb();
    if (data.expenses && Array.isArray(data.expenses.records)) {
      data.expenses.records = data.expenses.records.filter(r => r.id !== id);
      writeDb(data);
    }
    return this.getExpenses();
  },

  updateExpenseRecord(id, updates) {
    const data = readDb();
    if (data.expenses && Array.isArray(data.expenses.records)) {
      const idx = data.expenses.records.findIndex(r => r.id === id);
      if (idx !== -1) {
        if (updates.amount !== undefined) updates.amount = Number(updates.amount) || 0;
        if (updates.isPaid !== undefined) updates.isPaid = Boolean(updates.isPaid);
        data.expenses.records[idx] = { ...data.expenses.records[idx], ...updates };
        writeDb(data);
      }
    }
    return this.getExpenses();
  },

  // ---- PROFILE ----
  getProfile() {
    const data = readDb();
    return data.profile || {};
  },

  updateProfile(updates) {
    const data = readDb();
    data.profile = { ...data.profile, ...updates };
    writeDb(data);
    return data.profile;
  },

  // ---- SOURCES ----
  getSources() {
    try {
      const p = path.join(__dirname, '..', 'parser', 'sources.json');
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (e) {}
    const data = readDb();
    return data.sources || { chats: [], channels: [] };
  },

  updateSources(sources) {
    const data = readDb();
    data.sources = sources;
    writeDb(data);
    return data.sources;
  },

  // ---- MULTI-DEVICE ACCOUNTS & SYNC ----
  getAccountData(accountKey = 'default') {
    const data = readDb();
    if (!data.accounts) data.accounts = {};
    const cleanKey = String(accountKey).trim().toLowerCase().replace(/^@/, '') || 'default';
    const isDenis = cleanKey === 'absolutikdenchik' || cleanKey === 'zalizkodenis12' || cleanKey === '5278970111';
    const targetKey = isDenis ? 'absolutikdenchik' : cleanKey;

    if (!data.accounts[targetKey] && isDenis && data.accounts['zalizkodenis12']) {
      data.accounts[targetKey] = {
        ...data.accounts['zalizkodenis12'],
        accountKey: 'absolutikdenchik',
        username: '@absolutikdenchik'
      };
    }

    if (!data.accounts[targetKey]) {
      data.accounts[targetKey] = {
        accountKey: targetKey,
        username: isDenis ? '@absolutikdenchik' : ('@' + targetKey),
        name: isDenis ? 'Денис Залізко' : 'Спеціаліст',
        role: isDenis ? 'owner' : 'member',
        crm: isDenis ? (data.crm || []) : [],
        income: isDenis ? (data.income || { records: [], currency: '₴' }) : { records: [], currency: '₴' },
        expenses: isDenis ? (data.expenses || { records: [], currency: '₴' }) : { records: [], currency: '₴' },
        profile: isDenis ? (data.profile || {}) : {},
        takenLeadIds: isDenis ? (data.leads || []).filter(l => l.inCrm).map(l => l.id) : [],
        createdAt: new Date().toISOString()
      };
      writeDb(data);
    }
    return data.accounts[targetKey];
  },

  syncAccount(accountKey = 'default', payload = {}) {
    const data = readDb();
    if (!data.accounts) data.accounts = {};
    const cleanKey = String(accountKey).trim().toLowerCase().replace(/^@/, '') || 'default';
    const isDenis = cleanKey === 'absolutikdenchik' || cleanKey === 'zalizkodenis12' || cleanKey === '5278970111';
    const targetKey = isDenis ? 'absolutikdenchik' : cleanKey;

    const acc = data.accounts[targetKey] || data.accounts['zalizkodenis12'] || {
      crm: isDenis ? (data.crm || []) : [],
      income: isDenis ? (data.income || { records: [], currency: '₴' }) : { records: [], currency: '₴' },
      expenses: isDenis ? (data.expenses || { records: [], currency: '₴' }) : { records: [], currency: '₴' },
      profile: isDenis ? (data.profile || {}) : {},
      takenLeadIds: []
    };

    if (Array.isArray(payload.crm)) {
      acc.crm = payload.crm;
      if (isDenis) data.crm = payload.crm;
    }
    if (payload.income && Array.isArray(payload.income.records)) {
      acc.income = payload.income;
      if (isDenis) data.income = payload.income;
    }
    if (payload.expenses && Array.isArray(payload.expenses.records)) {
      acc.expenses = payload.expenses;
      if (isDenis) data.expenses = payload.expenses;
    }
    if (payload.profile) {
      acc.profile = { ...acc.profile, ...payload.profile };
      if (isDenis) data.profile = { ...data.profile, ...payload.profile };
    }
    if (Array.isArray(payload.takenLeadIds)) {
      acc.takenLeadIds = payload.takenLeadIds;
      if (isDenis) {
        const takenSet = new Set(payload.takenLeadIds);
        (data.leads || []).forEach(l => {
          if (takenSet.has(l.id)) l.inCrm = true;
        });
      }
    }
    acc.accountKey = targetKey;
    acc.username = isDenis ? '@absolutikdenchik' : (payload.username || acc.username || ('@' + targetKey));
    if (payload.name) acc.name = payload.name;
    if (payload.avatar !== undefined && payload.avatar !== '') acc.avatar = payload.avatar;
    if (payload.role !== undefined) acc.role = isDenis ? 'owner' : payload.role;
    if (payload.theme) acc.theme = payload.theme;
    if (payload.lang) acc.lang = payload.lang;
    if (payload.requisites) acc.requisites = payload.requisites;
    if (payload.sources) acc.sources = payload.sources;
    if (Array.isArray(payload.scrapes)) acc.scrapes = payload.scrapes;
    if (Array.isArray(payload.nfcJobs)) acc.nfcJobs = payload.nfcJobs;
    if (Array.isArray(payload.crmPinnedStages)) acc.crmPinnedStages = payload.crmPinnedStages;
    if (payload.deviceId) acc.deviceId = payload.deviceId;
    if (payload.syncId) acc.syncId = payload.syncId;
    acc.updatedAt = payload.updatedAt || Date.now();
    data.accounts[targetKey] = acc;
    if (isDenis) {
      data.accounts['zalizkodenis12'] = acc;
    }
    writeDb(data);
    return acc;
  }
};
