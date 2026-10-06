import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database file not found at ${DB_PATH}`);
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { leads: [], crm: [], income: { totalEarned: 0, totalExpected: 0, chart: [], history: [] }, profile: {}, sources: { chats: [], channels: [] } };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database:', err);
    return false;
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
      orders: leadData.orders || [
        {
          id: `ord-${Date.now()}`,
          title: leadData.orderTitle || 'Розробка проєкту',
          amount: Number(leadData.budget) || 0,
          paidStatus: 'unpaid',
          paidStatusLabel: 'Не оплачено',
          paidAmount: 0,
          deadline: leadData.deadline || ''
        }
      ],
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
    return data.income || { totalEarned: 0, totalExpected: 0, chart: [], history: [] };
  },

  addIncomeRecord(record) {
    const data = readDb();
    if (!data.income) {
      data.income = { totalEarned: 0, totalExpected: 0, chart: [], history: [] };
    }

    const amount = Number(record.amount) || 0;
    if (record.isPaid) {
      data.income.totalEarned += amount;
    } else {
      data.income.totalExpected += amount;
    }

    // Append to current history week or create week
    const now = new Date();
    const day = now.getDate();
    const monthNames = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
    const curMonth = monthNames[now.getMonth()];
    const dateFormatted = `${day} ${curMonth}`;

    const newDayEntry = {
      date: dateFormatted,
      dayName: ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][now.getDay()],
      amount,
      client: record.client || 'Клієнт',
      project: record.project || 'Проєкт'
    };

    if (data.income.history && data.income.history.length > 0) {
      data.income.history[0].days.unshift(newDayEntry);
      data.income.history[0].total += amount;
    } else {
      data.income.history = [
        {
          id: `inc-${Date.now()}`,
          period: `Поточний тиждень`,
          weekLabel: `Поточний тиждень`,
          total: amount,
          days: [newDayEntry]
        }
      ];
    }

    writeDb(data);
    return data.income;
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
    const data = readDb();
    return data.sources || { chats: [], channels: [] };
  },

  updateSources(sources) {
    const data = readDb();
    data.sources = sources;
    writeDb(data);
    return data.sources;
  }
};
