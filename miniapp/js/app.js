/**
 * DWS Lead — Telegram Mini App Interactive Logic
 * DenisWeb Studio · Zero Token Wastage · On-Demand AI
 */

// Initialize Telegram WebApp SDK if running inside Telegram
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // Enable closing confirmation if needed
  if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
}

function haptic(type = 'light') {
  if (tg?.HapticFeedback) {
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    else tg.HapticFeedback.impactOccurred('light');
  }
}

const DEFAULT_DATA = {
  leads: [
    {
      id: "lead-1",
      category: "development",
      categoryName: "Веброзробка",
      subcategory: "landing",
      subcategoryName: "Односторінковий сайт",
      sourceType: "chat",
      sourceName: "IT Фріланс Україна | Замовлення",
      sourceUsername: "@it_freelance_ua",
      authorName: "Катерина",
      authorUsername: "@kateryna_coffee",
      title: "Терміново потрібен лендінг для кав'ярні у Львові",
      text: "Терміново шукаю розробника на сайт для кав'ярні! Потрібен сучасний стильний односторінковий сайт з меню, контактами, картою та формою замовлення столика. Дедлайн: 2-3 дні. Бюджет: 15 000 ₴. Шукаємо досвідченого розробника з портфоліо схожих робіт. Пишіть в особисті з прикладами!",
      date: "2026-10-06T12:37:00.000Z",
      dateFormatted: "Сьогодні, 12:37",
      budget: 15000,
      currency: "₴",
      isUrgent: true,
      requiresPortfolio: true,
      experienceRequired: true,
      aiRating: 85,
      aiSummary: "Термінова розробка конверсійного лендінгу для кав'ярні за 2-3 дні. Бюджет 15 000 ₴.",
      aiAnalysis: {
        score: 85,
        summary: "Термінова розробка лендінгу для кав'ярні за 2-3 дні.",
        pros: ["Високий адекватний бюджет (15 000 ₴)", "Чіткі вимоги та конкретні блоки", "Прямий контакт замовника"],
        cons: ["Стислий дедлайн (2-3 дні)"]
      },
      inCrm: false
    }
  ],
  crm: [
    {
      id: "crm-1",
      leadId: "lead-1",
      name: "Олексій",
      username: "@olexa12",
      avatarLetter: "О",
      status: "offer",
      statusLabel: "Оффер",
      service: "development",
      serviceLabel: "Розробка",
      niche: "Кав'ярня / Ресторан",
      budget: 14000,
      currency: "₴",
      source: "partners",
      sourceLabel: "Партнери",
      notes: "Обговорили вимоги. Чекає договір та демо.",
      links: { telegram: "https://t.me/olexa12", phone: "+380971234567" },
      orders: [{ id: "ord-1", title: "Створення односторінкового сайту", amount: 14000, paidStatus: "partial", deadline: "2026-10-15" }]
    }
  ],
  income: {
    totalEarned: 120500,
    totalExpected: 20000,
    currency: "₴",
    chart: [
      { month: "Чер", amount: 18000 },
      { month: "Лип", amount: 24000 },
      { month: "Сер", amount: 29000 },
      { month: "Вер", amount: 37500 },
      { month: "Жов", amount: 12000 }
    ],
    history: [
      {
        id: "inc-w1",
        period: "1-7 жов 2026",
        weekLabel: "1–7 жовтня",
        total: 4500,
        days: [
          { date: "1 жов", dayName: "Пн", amount: 1000, client: "Кафе 'Затишок'" },
          { date: "4 жов", dayName: "Чт", amount: 2500, client: "Андрій" },
          { date: "6 жов", dayName: "Сб", amount: 500, client: "Ольга" },
          { date: "7 жов", dayName: "Нд", amount: 500, client: "Дмитро" }
        ]
      },
      {
        id: "inc-w2",
        period: "8-14 жов 2026",
        weekLabel: "8–14 жовтня",
        total: 2000,
        days: [{ date: "8 жов", dayName: "Пн", amount: 2000, client: "Beauty Studio" }]
      },
      {
        id: "inc-w3",
        period: "15-21 жов 2026",
        weekLabel: "15–21 жовтня",
        total: 0,
        days: []
      },
      {
        id: "inc-w4",
        period: "22-31 жов 2026",
        weekLabel: "22–31 жовтня",
        total: 5500,
        days: [{ date: "24 жов", dayName: "Ср", amount: 5500, client: "Віктор" }]
      }
    ]
  },
  profile: {
    agencyName: "DenisWeb Studio",
    ownerName: "Денис Залізко",
    theme: "light",
    about: "DenisWeb Studio — діджитал-агентство сучасної веброзробки та результативного маркетингу. Створюємо висококонверсійні лендінги, інтернет-магазини, 3D-сайти, каталоги та Telegram-боти. Наші стандарти: чистий код, PageSpeed 90+, адаптив під усі гаджети, інтеграція ШІ у процеси та безкоштовне інтерактивне демо до внесення авансу. Оплата 40% аванс / 60% після запуску.",
    responseTemplate: "Вітаю, {NAME}! Побачив ваше замовлення щодо {TASK}. У DenisWeb Studio ми реалізуємо подібні проєкти під ключ за 2-4 дні з гарантією швидкості та чистого коду.\n\nГотові безкоштовно розробити концепт та інтерактивне демо головного блоку ще до початку оплати, щоб ви наочно побачили результат.\n\nНаш сайт та кейси: https://denis-webstudio.site\nКоли вам зручно коротко обговорити деталі?"
  }
};

// ============================================================
// APP STATE
// ============================================================
const state = {
  currentTab: 'tab-leads',
  theme: localStorage.getItem('dws_theme') || 'light',
  leads: JSON.parse(localStorage.getItem('dws_leads') || 'null') || [...DEFAULT_DATA.leads],
  crm: JSON.parse(localStorage.getItem('dws_crm') || 'null') || [...DEFAULT_DATA.crm],
  income: JSON.parse(localStorage.getItem('dws_income') || 'null') || JSON.parse(JSON.stringify(DEFAULT_DATA.income)),
  profile: JSON.parse(localStorage.getItem('dws_profile') || 'null') || { ...DEFAULT_DATA.profile },
  sources: { chats: [], channels: [] },
  activeCrmLead: null,
  activeLeadForAi: null,
  filters: {
    category: 'all',
    subcategory: 'all',
    budget: 'all',
    portfolio: 'any',
    exp: 'any',
    query: '',
    sortBy: 'date'
  },
  activeCrmStatus: 'all'
};

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNav();
  setupModals();
  setupProfileCounters();
  setupEventListeners();
  loadAllData();
});

// ============================================================
// THEME MANAGEMENT (Light / Dark)
// ============================================================
function initTheme() {
  applyTheme(state.theme);

  // Sync with Telegram theme if user has no saved preference
  if (!localStorage.getItem('dws_theme') && tg?.colorScheme) {
    applyTheme(tg.colorScheme);
  }
}

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('dws_theme', theme);

  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'block';
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
    if (sunIcon) sunIcon.style.display = 'block';
    if (moonIcon) moonIcon.style.display = 'none';
  }

  // Sync profile theme pills
  document.querySelectorAll('.theme-choice-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  // Set Telegram header color
  if (tg?.setHeaderColor) {
    tg.setHeaderColor(theme === 'dark' ? '#0F0F0F' : '#FFFFFF');
  }
}

function toggleTheme() {
  haptic('medium');
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  // Persist to profile backend
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: newTheme })
  }).catch(() => {});
}

// ============================================================
// NAVIGATION (TAB SWITCHER)
// ============================================================
function setupNav() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      switchTab(targetTab);
    });
  });
}

function switchTab(tabId) {
  if (state.currentTab === tabId) return;
  haptic('light');
  state.currentTab = tabId;

  // Update tabs active state
  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.toggle('active', view.id === tabId);
  });

  // Update nav buttons active state
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Scroll to top of main container
  document.querySelector('.app-main').scrollTop = 0;
}

// ============================================================
// DATA FETCHING & RENDERING
// ============================================================
async function loadAllData() {
  await Promise.all([
    fetchLeads(),
    fetchCrm(),
    fetchIncome(),
    fetchProfile(),
    fetchSources()
  ]);
}

// ---- 1. LEADS FEED ----
async function fetchLeads() {
  try {
    const params = new URLSearchParams();
    if (state.filters.category !== 'all') params.set('category', state.filters.category);
    if (state.filters.subcategory !== 'all') params.set('subcategory', state.filters.subcategory);
    if (state.filters.budget !== 'all') params.set('budget', state.filters.budget);
    if (state.filters.query) params.set('query', state.filters.query);
    if (state.filters.sortBy) params.set('sortBy', state.filters.sortBy);

    const res = await fetch(`/api/leads?${params.toString()}`);
    const json = await res.json();
    if (json.success) {
      state.leads = json.data;
      renderLeads();
    }
  } catch (err) {
    console.warn('Using offline mock for leads:', err);
    renderLeads();
  }
}

function renderLeads() {
  const container = document.getElementById('leadsList');
  const countBadge = document.getElementById('leadsTodayCount');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${state.leads.length} сьогодні`;
  }

  if (state.leads.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align:center; padding: 40px 20px; color: var(--muted);">
        <p style="font-weight:600; font-size:1.05rem;">Заявки за обраними фільтрами відсутні</p>
        <p style="font-size:0.85rem; margin-top:6px;">Спробуйте скинути фільтри або обрати інші ніші</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.leads.map(lead => {
    const isUrgent = lead.isUrgent;
    const author = lead.authorUsername ? lead.authorUsername : (lead.authorName || 'Клієнт');
    const budgetTxt = lead.budget ? `${lead.budget.toLocaleString('uk-UA')} ₴` : 'Договірний';

    return `
      <div class="lead-card" data-id="${lead.id}">
        <div class="lead-card-header">
          <div>
            <span class="lead-subcat-tag">${lead.subcategoryName || lead.categoryName}</span>
            <div class="lead-meta">
              <span>${lead.dateFormatted || 'Сьогодні'}</span> • <span class="author">${author}</span>
            </div>
          </div>
          <button class="ai-rating-badge" data-action="ai-rating" data-id="${lead.id}">
            <span>AI ${lead.aiRating || 85}/100</span>
          </button>
        </div>

        <!-- AI Summary Box -->
        <div class="ai-summary-box" data-action="ai-summary" data-id="${lead.id}">
          <span class="ai-summary-label">Коротко від AI:</span>
          <span class="ai-summary-text">${lead.aiSummary || 'Натисніть для миттєвої AI-вижимки'}</span>
        </div>

        <!-- Full text -->
        <div class="lead-text">${escapeHtml(lead.text)}</div>

        <!-- Badges -->
        <div class="lead-tags-row">
          <span class="lead-tag budget">Бюджет: ${budgetTxt}</span>
          ${isUrgent ? `<span class="lead-tag urgent">⚡ Терміново</span>` : ''}
          ${lead.requiresPortfolio ? `<span class="lead-tag">📁 Портфоліо</span>` : ''}
        </div>

        <!-- Action buttons -->
        <div class="lead-actions-row">
          <button class="btn btn--fill btn--take-crm ${lead.inCrm ? 'btn--out' : ''}" data-action="take-crm" data-id="${lead.id}">
            ${lead.inCrm ? 'В РОБОТІ ✓' : 'ВЗЯТИ В РОБОТУ'}
          </button>
          <button class="btn btn--out" data-action="ai-offer" data-id="${lead.id}">
            AI-ВІДГУК
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ---- 2. CRM FEED ----
async function fetchCrm() {
  try {
    const res = await fetch(`/api/crm?status=${state.activeCrmStatus}`);
    const json = await res.json();
    if (json.success) {
      state.crm = json.data;
      renderCrm();
    }
  } catch (err) {
    console.warn('Error fetching CRM:', err);
  }
}

function renderCrm() {
  const container = document.getElementById('crmList');
  const countBadge = document.getElementById('crmTotalCount');
  if (!container) return;

  if (countBadge) {
    countBadge.textContent = `${state.crm.length} лідів`;
  }

  // Update status count numbers in horizontal bar
  updateCrmStatusCounts();

  if (state.crm.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align:center; padding: 40px 20px; color: var(--muted);">
        <p style="font-weight:600; font-size:1.05rem;">Немає лідів у цьому статусі</p>
        <p style="font-size:0.85rem; margin-top:6px;">Перенесіть замовлення із вкладки «Заявки» або додайте клієнта вручну (+)</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.crm.map(item => {
    const initial = item.avatarLetter || (item.name ? item.name.charAt(0).toUpperCase() : 'Л');
    const amount = item.budget ? `${item.budget.toLocaleString('uk-UA')} ₴` : '';

    return `
      <div class="crm-card" data-id="${item.id}">
        <div class="crm-card-left">
          <div class="client-avatar">${initial}</div>
          <div class="crm-card-info">
            <h4>${escapeHtml(item.name)}</h4>
            <span class="crm-card-user">${escapeHtml(item.username || '')}</span>
            <div class="crm-card-service">${escapeHtml(item.serviceLabel || 'Розробка')} • ${escapeHtml(item.niche || '')}</div>
          </div>
        </div>
        <div class="crm-card-right">
          <span class="status-chip ${item.status}">${escapeHtml(item.statusLabel || item.status)}</span>
          ${amount ? `<span class="crm-amount">${amount}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function updateCrmStatusCounts() {
  const allEl = document.getElementById('st-all-count');
  if (allEl) allEl.textContent = state.crm.length;
}

// ---- 3. INCOME TRACKER ----
async function fetchIncome() {
  try {
    const res = await fetch('/api/income');
    const json = await res.json();
    if (json.success) {
      state.income = json.data;
      renderIncome();
    }
  } catch (err) {
    console.warn('Error fetching income:', err);
  }
}

function renderIncome() {
  const earnedEl = document.getElementById('totalEarnedVal');
  const expectedEl = document.getElementById('totalExpectedVal');
  const barsContainer = document.getElementById('incomeBars');
  const accordionContainer = document.getElementById('incomeAccordion');

  if (earnedEl) earnedEl.textContent = `${(state.income.totalEarned || 0).toLocaleString('uk-UA')} ₴`;
  if (expectedEl) expectedEl.textContent = `${(state.income.totalExpected || 0).toLocaleString('uk-UA')} ₴`;

  // Render Bar Chart
  if (barsContainer && state.income.chart) {
    const maxVal = Math.max(...state.income.chart.map(c => c.amount || 0), 40000);
    barsContainer.innerHTML = state.income.chart.map((c, idx) => {
      const isCurrentMonth = idx === state.income.chart.length - 1;
      const heightPercent = Math.max(15, Math.round((c.amount / maxVal) * 100));
      return `
        <div class="bar-col ${isCurrentMonth ? 'active' : ''}" data-month="${c.month}" data-amount="${c.amount}">
          <div class="bar-pill" style="height: ${heightPercent}%;"></div>
          <span class="bar-month-name">${c.month}</span>
        </div>
      `;
    }).join('');

    // Clicking bar selects month
    barsContainer.querySelectorAll('.bar-col').forEach(col => {
      col.addEventListener('click', () => {
        barsContainer.querySelectorAll('.bar-col').forEach(c => c.classList.remove('active'));
        col.classList.add('active');
        const month = col.dataset.month;
        const amount = Number(col.dataset.amount).toLocaleString('uk-UA');
        const labelEl = document.getElementById('chartActiveMonthLabel');
        if (labelEl) labelEl.textContent = `${month}: ${amount} ₴`;
        haptic('light');
      });
    });
  }

  // Render Accordion History (weeks and days)
  if (accordionContainer && state.income.history) {
    accordionContainer.innerHTML = state.income.history.map((week, idx) => {
      const isOpen = idx === 0; // First week open by default
      const daysHtml = (week.days && week.days.length > 0)
        ? week.days.map(d => `
            <div class="day-row">
              <div class="day-info">
                <span class="day-date">${d.date} (${d.dayName || ''})</span>
                <span class="day-client">${d.client || '-'}</span>
              </div>
              <span class="day-sum">${d.amount ? d.amount.toLocaleString('uk-UA') + ' ₴' : '—'}</span>
            </div>
          `).join('')
        : `<div style="text-align:center; padding:10px; color:var(--muted); font-size:0.8rem;">Немає оплат за цей період</div>`;

      return `
        <div class="week-accordion-item ${isOpen ? 'open' : ''}">
          <div class="week-header">
            <span class="week-title">${week.weekLabel || week.period}</span>
            <div style="display:flex; align-items:center;">
              <span class="week-total">${week.total ? week.total.toLocaleString('uk-UA') + ' ₴' : '— ₴'}</span>
              <svg class="chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>
          <div class="days-breakdown">
            ${daysHtml}
          </div>
        </div>
      `;
    }).join('');

    // Accordion toggle click handlers
    accordionContainer.querySelectorAll('.week-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const item = hdr.parentElement;
        item.classList.toggle('open');
        haptic('light');
      });
    });
  }
}

// ---- 4. PROFILE ----
async function fetchProfile() {
  try {
    const res = await fetch('/api/profile');
    const json = await res.json();
    if (json.success) {
      state.profile = json.data;
      const aboutEl = document.getElementById('profileAbout');
      const tmplEl = document.getElementById('profileTemplate');

      if (aboutEl && json.data.about) {
        aboutEl.value = json.data.about;
        updateCharCount(aboutEl, 'aboutCounter');
      }
      if (tmplEl && json.data.responseTemplate) {
        tmplEl.value = json.data.responseTemplate;
        updateCharCount(tmplEl, 'templateCounter');
      }
      if (json.data.theme) {
        applyTheme(json.data.theme);
      }
    }
  } catch (err) {
    console.warn('Error fetching profile:', err);
  }
}

// ---- 5. SOURCES ----
async function fetchSources() {
  try {
    const res = await fetch('/api/sources');
    const json = await res.json();
    if (json.success) {
      state.sources = json.data;
    }
  } catch (err) {}
}

// ============================================================
// EVENT LISTENERS & MODAL HANDLERS
// ============================================================
function setupEventListeners() {
  // Theme toggle button in header
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Theme toggle buttons in profile
  document.querySelectorAll('.theme-choice-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
    });
  });

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      haptic('medium');
      refreshBtn.style.transform = 'rotate(360deg)';
      refreshBtn.style.transition = 'transform 0.5s ease';
      loadAllData().finally(() => {
        setTimeout(() => {
          refreshBtn.style.transform = '';
          refreshBtn.style.transition = '';
        }, 500);
      });
    });
  }

  // Lead search
  const searchInput = document.getElementById('leadSearchInput');
  const searchBtn = document.getElementById('leadSearchBtn');
  if (searchBtn && searchInput) {
    const doSearch = () => {
      haptic('light');
      state.filters.query = searchInput.value.trim();
      fetchLeads();
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }

  // Toggle sort
  const sortBtn = document.getElementById('toggleSortBtn');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      haptic('light');
      if (state.filters.sortBy === 'date') {
        state.filters.sortBy = 'budget_desc';
        sortBtn.classList.add('active');
        sortBtn.title = "Сортування за бюджетом";
      } else if (state.filters.sortBy === 'budget_desc') {
        state.filters.sortBy = 'rating_desc';
        sortBtn.classList.add('active');
        sortBtn.title = "Сортування за AI-рейтингом";
      } else {
        state.filters.sortBy = 'date';
        sortBtn.classList.remove('active');
        sortBtn.title = "Сортування за датою";
      }
      fetchLeads();
    });
  }

  // CRM status tabs click
  document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeCrmStatus = tab.dataset.status;
      haptic('light');
      fetchCrm();
    });
  });

  // Delegate clicks on Leads Feed
  const leadsFeed = document.getElementById('leadsList');
  if (leadsFeed) {
    leadsFeed.addEventListener('click', (e) => {
      const card = e.target.closest('.lead-card');
      if (!card) return;
      const leadId = card.dataset.id;
      const lead = state.leads.find(l => l.id === leadId);
      if (!lead) return;

      // 1. "Взяти в роботу" button
      const takeBtn = e.target.closest('[data-action="take-crm"]');
      if (takeBtn) {
        handleTakeToCrm(lead, takeBtn);
        return;
      }

      // 2. "AI-відгук" button
      const offerBtn = e.target.closest('[data-action="ai-offer"]');
      if (offerBtn) {
        handleOpenAiOffer(lead);
        return;
      }

      // 3. AI Rating badge
      const ratingBadge = e.target.closest('[data-action="ai-rating"]');
      if (ratingBadge) {
        handleOpenAiRating(lead);
        return;
      }

      // 4. AI Summary box
      const summaryBox = e.target.closest('[data-action="ai-summary"]');
      if (summaryBox) {
        handleOpenAiRating(lead);
        return;
      }
    });
  }

  // Delegate clicks on CRM Feed -> open detail modal
  const crmFeed = document.getElementById('crmList');
  if (crmFeed) {
    crmFeed.addEventListener('click', (e) => {
      const card = e.target.closest('.crm-card');
      if (!card) return;
      const crmId = card.dataset.id;
      const item = state.crm.find(c => c.id === crmId);
      if (item) {
        handleOpenCrmDetail(item);
      }
    });
  }

  // Save profile button
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
      haptic('medium');
      const about = document.getElementById('profileAbout').value;
      const template = document.getElementById('profileTemplate').value;

      saveProfileBtn.textContent = 'ЗБЕРІГАЄМО...';
      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ about, responseTemplate: template, theme: state.theme })
        });
        haptic('success');
        saveProfileBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
        setTimeout(() => { saveProfileBtn.textContent = 'ЗБЕРЕГТИ НАЛАШТУВАННЯ'; }, 2000);
      } catch (err) {
        saveProfileBtn.textContent = 'ПОМИЛКА';
      }
    });
  }

  // Sources manage button
  const openSourcesBtn = document.getElementById('openSourcesBtn');
  if (openSourcesBtn) {
    openSourcesBtn.addEventListener('click', () => {
      const area = document.getElementById('sourcesTextarea');
      if (area && state.sources) {
        const allUsernames = [
          ...(state.sources.chats || []).map(c => c.username),
          ...(state.sources.channels || []).map(ch => ch.username)
        ].filter(Boolean);
        area.value = allUsernames.join('\n');
      }
      openModal('modalSources');
    });
  }

  const saveSourcesBtn = document.getElementById('saveSourcesBtn');
  if (saveSourcesBtn) {
    saveSourcesBtn.addEventListener('click', async () => {
      const lines = document.getElementById('sourcesTextarea').value
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 1);

      const chats = lines.slice(0, Math.floor(lines.length / 2)).map((u, i) => ({
        id: `c-${i}`, username: u, name: u, type: 'chat', active: true
      }));
      const channels = lines.slice(Math.floor(lines.length / 2)).map((u, i) => ({
        id: `ch-${i}`, username: u, name: u, type: 'channel', active: true
      }));

      await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chats, channels })
      });

      haptic('success');
      closeModal('modalSources');
    });
  }
}

// ============================================================
// ACTIONS: TAKE TO CRM, AI RATING, AI OFFER
// ============================================================

async function handleTakeToCrm(lead, btn) {
  haptic('medium');
  btn.textContent = 'ДОДАЄМО...';
  try {
    const res = await fetch(`/api/leads/${lead.id}/take-to-crm`, { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      lead.inCrm = true;
      btn.textContent = 'В РОБОТІ ✓';
      btn.classList.add('btn--out');
      btn.classList.remove('btn--fill');
      haptic('success');
      fetchCrm(); // Refresh CRM list
    }
  } catch (err) {
    btn.textContent = 'ВЗЯТИ В РОБОТУ';
  }
}

// On-Demand AI Rating (with Skeleton loader)
async function handleOpenAiRating(lead) {
  state.activeLeadForAi = lead;
  const contentEl = document.getElementById('aiRatingContent');
  openModal('modalAiRating');

  // Render Skeleton Loader while AI scores
  contentEl.innerHTML = `
    <div style="text-align:center; padding: 20px 0;">
      <div class="skeleton" style="width: 100px; height: 50px; margin: 0 auto 16px; border-radius: 12px;"></div>
      <div class="skeleton skeleton-text" style="width: 80%; margin: 0 auto 8px;"></div>
      <div class="skeleton skeleton-text short" style="margin: 0 auto 16px;"></div>
      <div class="skeleton skeleton-text" style="width: 90%; margin: 0 auto 8px;"></div>
      <div class="skeleton skeleton-text" style="width: 70%; margin: 0 auto;"></div>
    </div>
  `;

  try {
    const res = await fetch(`/api/leads/${lead.id}/ai-score`, { method: 'POST' });
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      contentEl.innerHTML = `
        <div class="ai-score-big">${d.score}/100</div>
        <p style="text-align:center; font-weight:600; font-size:0.95rem; margin-bottom:16px;">
          ${escapeHtml(d.summary || lead.title)}
        </p>
        <div class="ai-bullets-list">
          ${(d.pros || []).map(p => `
            <div class="ai-bullet">
              <span class="bullet-icon">✓</span>
              <span>${escapeHtml(p)}</span>
            </div>
          `).join('')}
          ${(d.cons || []).map(c => `
            <div class="ai-bullet">
              <span class="bullet-icon" style="color:var(--danger)">!</span>
              <span style="color:var(--muted)">${escapeHtml(c)}</span>
            </div>
          `).join('')}
        </div>
      `;
      haptic('light');
    }
  } catch (err) {
    contentEl.innerHTML = `<p style="color:var(--danger); text-align:center;">Не вдалося отримати AI-аналіз</p>`;
  }
}

// On-Demand AI Offer (with Skeleton loader)
async function handleOpenAiOffer(lead) {
  state.activeLeadForAi = lead;
  const contentEl = document.getElementById('aiOfferContent');
  const chatBtn = document.getElementById('openClientChatBtn');
  openModal('modalAiOffer');

  // Setup telegram direct link button
  if (chatBtn) {
    const username = lead.authorUsername ? lead.authorUsername.replace('@', '') : '';
    chatBtn.onclick = () => {
      if (username) {
        window.open(`https://t.me/${username}`, '_blank');
      } else {
        alert('У цій заявці автор не вказав прямий @username. Зв\'яжіться через чат, де було опубліковано замовлення.');
      }
    };
  }

  // Skeleton Loader shimmer
  contentEl.innerHTML = `
    <div style="padding: 10px 0;">
      <div class="skeleton skeleton-text" style="width: 40%; margin-bottom: 12px;"></div>
      <div class="skeleton skeleton-text" style="width: 100%; margin-bottom: 8px;"></div>
      <div class="skeleton skeleton-text" style="width: 95%; margin-bottom: 8px;"></div>
      <div class="skeleton skeleton-text" style="width: 85%; margin-bottom: 12px;"></div>
      <div class="skeleton skeleton-text" style="width: 70%;"></div>
    </div>
  `;

  try {
    const res = await fetch(`/api/leads/${lead.id}/ai-response`, { method: 'POST' });
    const json = await res.json();
    if (json.success && json.data) {
      const offer = json.data.offer;
      contentEl.innerHTML = `
        <textarea id="aiOfferTextarea" class="form-textarea" rows="6" style="border:none; background:transparent; padding:0;">${escapeHtml(offer)}</textarea>
      `;

      // Copy button handler
      const copyBtn = document.getElementById('copyAiOfferBtn');
      if (copyBtn) {
        copyBtn.onclick = () => {
          const text = document.getElementById('aiOfferTextarea')?.value || offer;
          navigator.clipboard.writeText(text);
          haptic('success');
          copyBtn.innerHTML = `<span>СКОПІЙОВАНО ✓</span>`;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>КОПІЮВАТИ ТЕКСТ</span>
            `;
          }, 2000);
        };
      }
    }
  } catch (err) {
    contentEl.innerHTML = `<p style="color:var(--danger)">Помилка створення відгуку</p>`;
  }
}

// ============================================================
// CRM DETAIL MODAL & EDITING
// ============================================================
function handleOpenCrmDetail(item) {
  state.activeCrmLead = item;

  document.getElementById('crmDetailAvatar').textContent = item.avatarLetter || item.name.charAt(0);
  document.getElementById('crmDetailName').textContent = item.name;
  document.getElementById('crmDetailUsername').textContent = item.username || '';

  const statusSelect = document.getElementById('crmDetailStatusSelect');
  if (statusSelect) statusSelect.value = item.status || 'in_progress';

  const tgLink = document.getElementById('crmDetailTgLink');
  if (tgLink) {
    const u = item.username ? item.username.replace('@', '') : '';
    tgLink.href = u ? `https://t.me/${u}` : '#';
  }

  const servSelect = document.getElementById('crmDetailService');
  if (servSelect) servSelect.value = item.service || 'development';

  const budgetInput = document.getElementById('crmDetailBudget');
  if (budgetInput) budgetInput.value = item.budget || '';

  const nicheInput = document.getElementById('crmDetailNiche');
  if (nicheInput) nicheInput.value = item.niche || '';

  const notesText = document.getElementById('crmDetailNotes');
  if (notesText) notesText.value = item.notes || '';

  // Order block
  const order = item.orders && item.orders[0] ? item.orders[0] : {};
  const orderTitle = document.getElementById('crmOrderTitle');
  if (orderTitle) orderTitle.value = order.title || 'Розробка проєкту';

  const paidSelect = document.getElementById('crmOrderPaidStatus');
  if (paidSelect) paidSelect.value = order.paidStatus || 'unpaid';

  const deadlineInput = document.getElementById('crmOrderDeadline');
  if (deadlineInput) deadlineInput.value = order.deadline || '';

  openModal('modalCrmDetail');
}

// Save CRM detail
const saveCrmDetailBtn = document.getElementById('saveCrmDetailBtn');
if (saveCrmDetailBtn) {
  saveCrmDetailBtn.addEventListener('click', async () => {
    if (!state.activeCrmLead) return;
    haptic('medium');

    const status = document.getElementById('crmDetailStatusSelect').value;
    const service = document.getElementById('crmDetailService').value;
    const budget = Number(document.getElementById('crmDetailBudget').value) || 0;
    const niche = document.getElementById('crmDetailNiche').value;
    const notes = document.getElementById('crmDetailNotes').value;
    const orderTitle = document.getElementById('crmOrderTitle').value;
    const paidStatus = document.getElementById('crmOrderPaidStatus').value;
    const deadline = document.getElementById('crmOrderDeadline').value;

    const updates = {
      status,
      service,
      budget,
      niche,
      notes,
      orders: [
        {
          id: state.activeCrmLead.orders?.[0]?.id || `ord-${Date.now()}`,
          title: orderTitle,
          amount: budget,
          paidStatus,
          deadline
        }
      ]
    };

    saveCrmDetailBtn.textContent = 'ЗБЕРІГАЄМО...';
    try {
      await fetch(`/api/crm/${state.activeCrmLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      haptic('success');
      saveCrmDetailBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
      closeModal('modalCrmDetail');
      fetchCrm();
    } catch (err) {
      saveCrmDetailBtn.textContent = 'ПОМИЛКА';
    } finally {
      setTimeout(() => { saveCrmDetailBtn.textContent = 'ЗБЕРЕГТИ ЗМІНИ'; }, 1500);
    }
  });
}

// Delete CRM lead
const deleteCrmLeadBtn = document.getElementById('deleteCrmLeadBtn');
if (deleteCrmLeadBtn) {
  deleteCrmLeadBtn.addEventListener('click', async () => {
    if (!state.activeCrmLead) return;
    if (!confirm('Ви дійсно хочете видалити цього ліда з CRM?')) return;
    haptic('medium');

    await fetch(`/api/crm/${state.activeCrmLead.id}`, { method: 'DELETE' });
    haptic('success');
    closeModal('modalCrmDetail');
    fetchCrm();
  });
}

// Add CRM client modal (+)
const addCrmBtn = document.getElementById('addCrmBtn');
if (addCrmBtn) {
  addCrmBtn.addEventListener('click', () => {
    openModal('modalAddCrm');
  });
}

const submitAddCrmBtn = document.getElementById('submitAddCrmBtn');
if (submitAddCrmBtn) {
  submitAddCrmBtn.addEventListener('click', async () => {
    const name = document.getElementById('newCrmName').value.trim();
    const username = document.getElementById('newCrmUsername').value.trim();
    const service = document.getElementById('newCrmService').value;
    const source = document.getElementById('newCrmSource').value;
    const niche = document.getElementById('newCrmNiche').value.trim();
    const budget = Number(document.getElementById('newCrmBudget').value) || 0;
    const status = document.getElementById('newCrmStatus').value;
    const orderTitle = document.getElementById('newCrmOrderTitle').value.trim();

    if (!name) {
      alert('Будь ласка, введіть ім\'я клієнта');
      return;
    }

    haptic('medium');
    await fetch('/api/crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, username, service, source, niche, budget, status, orderTitle })
    });

    haptic('success');
    closeModal('modalAddCrm');
    fetchCrm();
  });
}

// Add Income record modal (+)
const addIncomeBtn = document.getElementById('addIncomeBtn');
if (addIncomeBtn) {
  addIncomeBtn.addEventListener('click', () => {
    openModal('modalAddIncome');
  });
}

let newIncomePaidStatus = true;
document.querySelectorAll('#modalAddIncome .opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#modalAddIncome .opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    newIncomePaidStatus = btn.dataset.paid === 'true';
  });
});

const submitAddIncomeBtn = document.getElementById('submitAddIncomeBtn');
if (submitAddIncomeBtn) {
  submitAddIncomeBtn.addEventListener('click', async () => {
    const project = document.getElementById('newIncomeProject').value.trim();
    const client = document.getElementById('newIncomeClient').value.trim();
    const amount = Number(document.getElementById('newIncomeAmount').value) || 0;

    if (!project || !amount) {
      alert('Введіть назву замовлення та суму');
      return;
    }

    haptic('medium');
    await fetch('/api/income', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, client, amount, isPaid: newIncomePaidStatus })
    });

    haptic('success');
    closeModal('modalAddIncome');
    fetchIncome();
  });
}

// Time filter modal
const openTimeFilterBtn = document.getElementById('openTimeFilterBtn');
if (openTimeFilterBtn) {
  openTimeFilterBtn.addEventListener('click', () => {
    openModal('modalTimeFilter');
  });
}

document.querySelectorAll('.time-choice-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.time-choice-item').forEach(b => {
      b.classList.remove('active');
      const ch = b.querySelector('.check');
      if (ch) ch.remove();
    });
    btn.classList.add('active');
    btn.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');
    const label = btn.querySelector('span')?.textContent || 'За весь час';
    const activeLabel = document.getElementById('activeTimeLabel');
    if (activeLabel) activeLabel.textContent = label;
    haptic('light');
  });
});

// Niches modal
const openNichesBtn = document.getElementById('openNichesBtn');
if (openNichesBtn) {
  openNichesBtn.addEventListener('click', () => {
    openModal('modalNiches');
  });
}

// Toggle niche sub-list accordion
document.querySelectorAll('.niche-group-header').forEach(hdr => {
  hdr.addEventListener('click', () => {
    const targetId = hdr.dataset.toggle;
    const subList = document.getElementById(targetId);
    if (subList) {
      const isHidden = subList.style.display === 'none';
      subList.style.display = isHidden ? 'flex' : 'none';
      haptic('light');
    }
  });
});

// Filters modal
const openFiltersBtn = document.getElementById('openFiltersBtn');
if (openFiltersBtn) {
  openFiltersBtn.addEventListener('click', () => {
    openModal('modalFilters');
  });
}

document.querySelectorAll('#modalFilters .opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.filter-options-grid');
    parent.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    haptic('light');
  });
});

const applyFiltersBtn = document.getElementById('applyFiltersBtn');
if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', () => {
    const budgetBtn = document.querySelector('#modalFilters .opt-btn[data-budget].active');
    if (budgetBtn) state.filters.budget = budgetBtn.dataset.budget;
    closeModal('modalFilters');
    fetchLeads();
  });
}

// ============================================================
// MODAL CONTROLS
// ============================================================
function setupModals() {
  // Close buttons with data-close
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      closeModal(modalId);
    });
  });

  // Clicking backdrop closes modal
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });
}

function openModal(modalId) {
  haptic('light');
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('open');
}

function closeModal(modalId) {
  haptic('light');
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

// ============================================================
// PROFILE TEXTAREA CHAR COUNTERS
// ============================================================
function setupProfileCounters() {
  const about = document.getElementById('profileAbout');
  const tmpl = document.getElementById('profileTemplate');

  if (about) {
    about.addEventListener('input', () => updateCharCount(about, 'aboutCounter'));
  }
  if (tmpl) {
    tmpl.addEventListener('input', () => updateCharCount(tmpl, 'templateCounter'));
  }
}

function updateCharCount(el, counterId) {
  const counter = document.getElementById(counterId);
  if (counter) {
    counter.textContent = `${el.value.length}/${el.maxLength}`;
  }
}

// Utility
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
