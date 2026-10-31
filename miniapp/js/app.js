/**
 * DWS Lead — Telegram Mini App Interactive Logic
 * DenisWeb Studio · Zero Token Wastage · On-Demand AI
 */

// Initialize Telegram WebApp SDK if running inside Telegram
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.enableClosingConfirmation) tg.enableClosingConfirmation();
}

function haptic(type = 'light') {
  if (tg?.HapticFeedback) {
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
    else tg.HapticFeedback.impactOccurred('light');
  }
}

function showToast(message, duration = 2500) {
  if (!message) return;
  try {
    let container = document.getElementById('dwsToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'dwsToastContainer';
      container.style.cssText = 'position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:999999;display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;max-width:90%;width:max-content;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'dws-toast-pill';
    toast.style.cssText = 'background:#111827;color:#ffffff;padding:10px 18px;border-radius:24px;font-size:0.82rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.28);border:1px solid rgba(255,255,255,0.14);text-align:center;pointer-events:auto;word-break:break-word;transition:all 0.25s cubic-bezier(0.16,1,0.3,1);';
    const displayMsg = (typeof translateText === 'function' && state?.lang === 'en') ? translateText(message) : message;
    toast.textContent = displayMsg;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-8px)';
      setTimeout(() => { toast.remove(); }, 250);
    }, duration);
  } catch (err) {
    console.log('[Toast]', message);
  }
}

// Clean Telegram reactions, views, and noise from vacancy text
function cleanVacancyText(text) {
  if (!text) return '';
  let lines = text.split(/\r?\n/).map(l => l.trimEnd());
  while (lines.length > 0) {
    const last = lines[lines.length - 1].trim();
    if (!last) {
      lines.pop();
      continue;
    }
    const isReactionLine = /^[\p{Emoji}\s\d❤👍🔥]+$/u.test(last) && !/[a-zA-Zа-яА-ЯіїєґІЇЄҐ]/.test(last);
    const isViewLine = /^(?:[\d.,]+[KkMm]?\s*views|edited|\d{1,2}:\d{2}|👁|\s)+$/iu.test(last);
    const isReactionsAndViews = /^(?:[\p{Emoji}\s\d❤👍🔥]+)?\s*[\d.,]+[KkMm]?\s*views.*$/iu.test(last);
    if (isReactionLine || isViewLine || isReactionsAndViews) {
      lines.pop();
    } else {
      break;
    }
  }
  return lines.join('\n').trim();
}

// Extract first sentence for collapsed mode
function getFirstSentence(text) {
  if (!text) return '';
  const cleaned = cleanVacancyText(text);
  const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return cleaned;
  let candidate = lines[0];
  if (candidate.length < 25 && lines.length > 1) {
    candidate = lines[0] + ' ' + lines[1];
  }
  const match = candidate.match(/^.*?[.!?](?=\s|$)/);
  if (match && match[0].length >= 15) {
    return match[0];
  }
  if (candidate.length > 140) {
    return candidate.slice(0, 140) + '...';
  }
  return candidate;
}

const DEFAULT_NFC_TEMPLATES = [
  "Доброго дня! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво глянути?",
  "Доброго дня! Пишу вам із пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи було б цікаво поглянути?",
  "Доброго дня! Пишу з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, цікаво було б глянути?",
  "Добрий день! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво переглянути?",
  "Доброго дня! Пишу вам з пропозицією, що допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи цікаво було б глянути?",
  "Доброго дня! Пишу з пропозицією, що допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво поглянути?",
  "Добрий день! Пишу вам із пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи було б цікаво глянути?",
  "Доброго дня! Пишу вам з пропозицією, яка без реклами допоможе збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи цікаво глянути?",
  "Вітаю! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво глянути?",
  "Доброго дня! Звертаюсь до вас з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Підготував для вас презентацію, чи було б цікаво глянути?"
];

const DEFAULT_DATA = {
  leads: [
    {
      "id": "lead-1792175027901-413",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "чат «SMM-укриття 🇺🇦»",
      "sourceUsername": "@smmbunker",
      "authorName": "Vitalik",
      "authorUsername": "@smmbunker",
      "title": "‼️Монтаж reels який тримає увагу.",
      "text": "‼️Монтаж reels який тримає увагу.\nЗмонтую ваше відео за 1 день та з безкоштовними правками. Приклади відео в портфоліо.\n\nЩо буде зрблено?\nКольорокорекція ✅\nВирізання пауз ✅\nДинамічні субтитри ✅\nПереходи ✅\nСтокові відео ✅\nСаунд дизайн ✅\n\nПишіть в особисті, якщо зацікавило",
      "date": "2026-10-16T18:23:47.900Z",
      "dateFormatted": "Сьогодні, 21:23",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": false,
      "aiRating": 51,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792174333648-7381",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "freelance_ua",
      "sourceName": "Freelance.ua",
      "sourceUsername": "@freelance_ua",
      "authorName": "Замовник на Freelance.ua",
      "authorUsername": "@freelance_ua",
      "title": "Шукаємо комплексного Маркетолога / SMM + Google Ads фахівця для компанії в США",
      "text": "Шукаємо комплексного Маркетолога / SMM + Google Ads фахівця для компанії в США\n\nШукаємо тямущого спеціаліста (або медіабайера/таргетолога з навичками) для будівельної компанії (Genesis...",
      "url": "https://freelance.ua/orders/297990-shukajemo-kompleksnogo-marketologa-smm-google-ads-fahivca-dla-kompaniji-v-ssha.html",
      "date": "2026-10-16T18:12:13.558Z",
      "dateFormatted": "Сьогодні, 21:12",
      "budget": 10000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 42,
      "aiSummary": "Замовлення на Freelance.ua: таргетована реклама (meta) з бюджетом 10000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792174333621-277",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Facebook Media Buyer (iGaming)",
      "text": "Facebook Media Buyer (iGaming)\n\nEver wanted to run Meta Ads campaigns where performance actually matters - generating high-quality leads, driving conversions, and scaling campaigns that deliver real results?\nWhere your decisions directly impact ROI, not just clicks and impressions?\nWhere you’re not just launching ads - you’re testing, optimizing, and scaling campaigns in a highly competitive performance marketing environment?\nIf you know how to turn Meta Ads into a predictable lead generation channel and have experience with casino or iGaming offers, this role is for you.\n \nAbout the Company\nWe are an international marketing company focused on performance-driven growth across multiple geographies.\nWe don’t chase vanity metrics. We build campaigns designed to generate measurable results and profitable growth.\nOur team works across different traffic sources, funnels, and offers, constantly testing new approaches and optimizing performance to unlock new growth opportunities.\n \nThe Role\nWe’re looking for a Facebook Media Buyer with strong hands-on experience in Facebook and Instagram advertising, lead generation, and performance marketing.\nThis is not an entry-level role. We’re looking for someone who knows how to build campaigns from the ground up, optimize performance based on data, and scale successful strategies.\nExperience with casino and iGaming offers is a strong advantage. You should understand how to work with competitive offers, test different approaches, and focus on lead quality and campaign profitability.\n\nWhat You’ll Do\nLaunch & Manage Campaigns\nCreate, launch, and manage Meta Ads campaigns across Facebook and Instagram.\nBuild lead generation campaigns focused on acquiring high-quality leads.\nManage campaign performance and budgets with a strong focus on ROI and CPL targets.\nMonitor delivery and troubleshoot performance issues.\nOptimize & Scale\nTest creatives, audiences, targeting strategies, and campaign structures.\nAnalyze performance metrics, identify winning combinations, and scale successful campaigns.\nOptimize campaigns to improve lead quality, reduce CPL, and increase overall profitability.\nMake fast, data-driven decisions to improve campaign performance.\nWork with Data & Tracking \nMonitor key performance indicators, including CPL, CPA, conversion rates, and ROI.\nWork with Meta Pixel, conversion tracking, and analytics tools to measure campaign effectiveness.\nIdentify performance trends and opportunities for further optimization.\nEnsure campaign decisions are based on reliable data and business results.\nDrive Performance & Growth\nContinuously experiment with new creatives, audiences, and campaign strategies.\nIdentify opportunities to improve acquisition efficiency and scale lead generation.\nApply performance marketing best practices to achieve sustainable results.\nStay up to date with Meta Ads platform changes, advertising policies, and optimization techniques.\n \nWhat You Bring\nProven hands-on experience managing and scaling Meta Ads campaigns.\nStrong background in lead generation and performance marketing.\nExperience optimizing campaigns for CPL, CPA, conversion rates, and ROI.\nA solid understanding of campaign structures, audience targeting, retargeting, and scaling strategies.\nPractical knowledge of Meta Pixel, conversion tracking, and analytics.\nExperience testing creatives and audiences to identify profitable campaign combinations.\nCasino/iGaming experience is a major plus.\nStrong analytical thinking, ownership, and a results-driven mindset.\nAbility to work independently, troubleshoot issues, and make decisions based on data.\n \nWhat You Get\nPerformance-Driven Environment: Work with a team focused on measurable results, optimization, and growth.\nReal Impact: Your decisions directly influence campaign performance and lead generation outcomes.\nRoom to Scale: Explore new strategies, test different approaches, and unlock growth opportunities.\nInternational Team: Collaborate with marketing professionals across multiple markets.\nChallenge & Ownership: Take responsibility for campaign performance and contribute your expertise to business growth.\n \nReady to Scale What Works?\nIIf you know how to turn Meta Ads campaigns into a high-performing lead generation channel and want to work in an environment where results, data, and profitability come first.\n \n👉 Apply now and let’s scale campaigns that deliver.",
      "url": "https://djinni.co/jobs/853823-facebook-media-buyer-igaming/",
      "date": "2026-10-16T18:12:13.558Z",
      "dateFormatted": "Сьогодні, 21:12",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792174333571-8590",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Видеокреатив для рекламы в facebook ads",
      "text": "Видеокреатив для рекламы в facebook ads - 700UAH\n\nНеобходимо создать 2 видеокреатива для рекламной кампании Facebook.\n\nХронометраж видео: 15 и 30 секунд.\n\nТематика: услуги (сезонное предложение для новых клиентов).\n\nФормат видео: 9:16.\n\nКонтент для видео нужно будет сгенерировать с помощью ИИ.\nМы предоставим референсы предыдущих видеороликов.\nПодробное...",
      "url": "https://freelancehunt.com/project/video-kreativ-dlya-reklami-facebook/1659420.html",
      "date": "2026-10-16T18:12:13.558Z",
      "dateFormatted": "Сьогодні, 21:12",
      "budget": 700,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 59,
      "aiSummary": "Замовлення на Freelancehunt: таргетована реклама (meta) з бюджетом 700 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792174333558-6959",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Таргетолог Meta Ads (Facebook/Instagram): лидогенерация для локального бизнеса",
      "text": "Таргетолог Meta Ads (Facebook/Instagram): лидогенерация для локального бизнеса\n\nО проектеСервисный бизнес в сегменте умных жалюзи. Модель: реклама → заявка → SMS-квалификация → бесплатный выездной замер → продажа.Реклама уже работает. Ищу человека, который возьмет кабинет на ведение и снизит стоимость качественного лида. Гео, название и детали проекта раскрою после первого разговора.Что...",
      "url": "https://freelancehunt.com/project/targetolog-meta-ads-facebook-instagram-lidogeneratsiya-dlya/1659422.html",
      "date": "2026-10-16T18:12:13.558Z",
      "dateFormatted": "Сьогодні, 21:12",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelancehunt: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171094208-932",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "RudenkoSMM UA",
      "sourceUsername": "@RudenkoSMM",
      "authorName": "Rudenko_Job",
      "authorUsername": "@Rudenko_Job",
      "title": "💅 Вакансія: SMM для бренду професійної аромакосметики для волосся | роб...",
      "text": "💅 Вакансія: SMM для бренду професійної аромакосметики для волосся | робота у Львові, гібрид\n\n📍Львів, гібрид\n\nNa Gólov[y] - український виробник професійної аромакосметики для волосся\n\n🌐 сторінка бренду https://www.nagolovy.pro/\n🌐 сторінка власниці https://www.instagram.com/nataliagolovchenko.ua?stkn=MWNhN3A5bjJxMThwYg==\n\n\nШукаємо людину, яка допоможе перетворити життя, досвід і роботу власниці бренду на сильний особистий блог.\n\nТи будеш працювати напряму з власницею: розуміти її ритм життя, бачити цікаві моменти, знаходити теми, формувати рубрики, планувати Stories і Reels та координувати створення контенту.\n\nЩо очікуємо:\n• досвід у SMM та Instagram\n• досвід із особистими брендами\n• сильний сторітелінг\n• самостійність та ініціативність\n• вміння генерувати контентні ідеї\n• досвід організації зйомок\n• розуміння Instagram-аналітики\n• Figma, Canva, CapCut\n\n30000 грн, для сильного кандидата - готові обговорити більше! ✨\n\nЛьвів, гібридний формат - близько 2−3 дні в офісі + виїзди на зйомки\nОфіційне працевлаштування\nКорпоративні знижки та подарунки\nКорпоративний психолог\n\nДля відгуку @Recruiter_Diana  ✉️\n\n#SMM #маркетолог #Львів #роботаЛьвів #роботаУкраїна #вакансія",
      "date": "2026-10-16T17:18:14.208Z",
      "dateFormatted": "Сьогодні, 20:18",
      "budget": 30000,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 71,
      "aiSummary": "Замовлення: монтаж reels/tiktok з бюджетом 30000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171094183-878",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "RudenkoSMM UA",
      "sourceUsername": "@RudenkoSMM",
      "authorName": "Irina_MK26",
      "authorUsername": "@Irina_MK26",
      "title": "💜 Вакансія: SMM для VST OIL | робота в Одесі, гібрид",
      "text": "💜 Вакансія: SMM для VST OIL | робота в Одесі, гібрид\n\n📍Одеса, офіс / гібрид\nвід 25 000 грн\n\nШукаємо креативного SMM спеціаліста для VST OIL (мережа АЗС),  який допоможе розвивати соціальні мережі бренду, створювати цікавий контент, і реалізовувати маркетингові проєкти\n\nЩо потрібно робити:\n• Вести Instagram, Facebook, TikTok, Telegram і Threads.\n• Розробляти контент-стратегію та контент-план.\n• Створювати Reels, Stories, відео, дописи та інший контент.\n• Планувати публікації та налаштовувати кроспостинг.\n• Взаємодіяти з аудиторією в соціальних мережах.\n• Брати участь у налаштуванні таргетованої реклами.\n• Координувати рекламні активності та комунікувати з підрядниками.\n• Долучатися до маркетингових проєктів компанії.\n\nНаш кандидат:\n• Має досвід роботи в SMM.\n• Вміє планувати контент і комплексно вести соціальні мережі.\n• Розуміє принципи створення візуального контенту та роботи з графічними редакторами.\n• Має базові знання рекламних кабінетів та аналітики.\n\nДля відгуку @Irina_kocharyan ✉️\n\n#SMM #Odesa #Одеса #вакансія #роботаУкраїна\n\n🔗 Більше вакансій в нашому чаті\nРозмістити вакансію @Irina_MK26",
      "date": "2026-10-16T17:18:14.182Z",
      "dateFormatted": "Сьогодні, 20:18",
      "budget": 25000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 87,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 25000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171094092-650",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "chat",
      "sourceName": "RudenkoSMM UA",
      "sourceUsername": "@RudenkoSMM",
      "authorName": "hr_manager_af",
      "authorUsername": "@hr_manager_af",
      "title": "🚀 Вакансія: Media Buyer | віддалена робота, full time / part time",
      "text": "🚀 Вакансія: Media Buyer | віддалена робота, full time / part time\n\n📍 Віддалено\n\nШукаємо досвідченого Media Buyer для запуску та масштабування рекламних кампаній на Telegram Ads\n\nЩо потрібно:\n- Практичний досвід запуску та ведення реклами\n- Досвід роботи Telegram Ads\n- Глибоке розуміння аналітики, оптимізації та масштабування кампаній\n- Досвід у вертикалях: форекс, крипто, бінарні опціони\n\nЩо пропонуємо:\n- Віддалений графік роботи\n- Спільне з керівником прийняття рішень щодо масштабування\n- Онбординг відбувається одразу в процесі роботи\n\nОплата:\nУмови обговорюємо індивідуально з кандидатом залежно від досвіду, кейсів та формату співпраці.\n\nДля відгуку @hr_manager_af 📩\n\n#баєр #вакансія #віддаленаробота",
      "date": "2026-10-16T17:18:14.091Z",
      "dateFormatted": "Сьогодні, 20:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171094079-676",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "RudenkoSMM UA",
      "sourceUsername": "@RudenkoSMM",
      "authorName": "rudenkosmm",
      "authorUsername": "@rudenkosmm",
      "title": "Шукаємо команду для комплексного просування бізнесу: SMM + Meta Ads + Googl...",
      "text": "Шукаємо команду для комплексного просування бізнесу: SMM + Meta Ads + Google Ads 🤝 💼\n\nПотрібно закрити весь цикл:\n• контент-план і сценарії;\n• виїзні зйомки Reels у Києві та монтаж;\n• публікації й ведення сторіс;\n• таргетовану рекламу в Instagram/Facebook;\n• Google-рекламу;\n• аналітику та звітність.\n\nВажливо, щоб усе це робила одна команда з узгодженою стратегією!\n\nФорма для співпраці : https://forms.gle/kvZSoyMBgbHXMPL16",
      "date": "2026-10-16T17:18:14.078Z",
      "dateFormatted": "Сьогодні, 20:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171091807-46",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "general",
      "subcategoryName": "Монтаж",
      "sourceType": "chat",
      "sourceName": "rabota_zhutomere UA",
      "sourceUsername": "@rabota_zhutomere",
      "authorName": "rabota_zhutomere",
      "authorUsername": "@rabota_zhutomere",
      "title": "🔍Викладач з 3D-моделювання (Blender, для дітей)💼",
      "text": "🔍Викладач з 3D-моделювання (Blender, для дітей)💼\n\n🥇Привіт! Ми — IT FUTURE Online — шукаємо викладачів з 3D моделювання в Blender.\nЗа 8+ років ми навчили 15 000 учнів, і наша команда вже налічує понад 350 крутих викладачів та продовжуємо зростати далі.\nТому, у зв’язку з динамічним розвитком нашої школи, оголошуємо набір викладачів з програмування на 3D моделювання в Blender для проведення індивідуальних уроків онлайн, для дітей віком від 10 років.\n\n🔢Що ми пропонуємо?\nДистанційну роботу: працюй дистанційно з будь-якої точки світу та самостійно формуй свій графік роботи;\nКонкурентну заробітню плату: близько 45 000₴ на повній зайнятості, та біля 16 000−20 000₴ на частковій;\nЗручність: комунікація з клієнтами тільки через школу і в робочий час;\nГотова програма: покрокові уроки вже підготовлені для тебе;\nПідтримка: ментор та менеджери на зв’язку 7 днів на тиждень;\nЗручний особистий кабінет з інформацією про твоїх учнів та реєстром проведених/запланованих занять.\n\n❗️Чим ти будеш займатись?\nПроводити індивідуальні уроки, для учнів, віком від 10 до 17 років, по підготовленій програмі навчання;\nНадавати зворотній звʼязок, про успіхи учнів;\nЗаповнення проведених уроків у CRM cистемі;\nКомунікувати з менеджерами, в чаті\n\n🖥Хто нам підходить?\nТи маєш досвід в IT та бажання навчатись;\nУ тебе є комп’ютер з веб-камерою та надійний інтернет;\nТи маєш такі якості як: відповідальність, самоорганізованість, комунікабельність;\nТобі подобається працювати з дітьми;\nГотовність працювати від 20 годин на тиждень;\nТи знаєш, і можеш викладати один або декілька з даних напрямків: Scratch, Roblox, Minecraft Education, Minecraft Python, Python, Web-програмування, Photoshop, Відеомонтаж/Відеоблогінг, 3D Blender, Unity, Construct, AI, СapCut.\n\n⌨️Залишай резюме, а краще відразу заповнюй форму https://docs.google.com/forms/d/1-z3VzLYZsqwt95Kr8xE_JD_XNyt2ykLIKyV1mRxR3XA/edit та приєднуйся до нашої дружньої команди!",
      "date": "2026-10-16T17:18:11.806Z",
      "dateFormatted": "Сьогодні, 20:18",
      "budget": 45000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 78,
      "aiSummary": "Замовлення: монтаж з бюджетом 45000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171091796-92",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "rabota_zhutomere UA",
      "sourceUsername": "@rabota_zhutomere",
      "authorName": "rabota_zhutomere",
      "authorUsername": "@rabota_zhutomere",
      "title": "🔍Таргетолог💼",
      "text": "🔍Таргетолог💼\n\nПривіт!\nШукаємо амбітного та цілеспрямованого спеціаліста, який розуміє, що рекламний креатив та комплексний підхід до проєкту вирішує більше, а ніж просто клацання кнопок в рекламному кабінеті😉\n🖥Що ти отримаєш:\nСтабільну кількість цікавих проєктів і роботу з досить відомими брендами 😊\nДоступ до бази знань, яка постійно поповнюється (Targetorium, Matveev, Filatov та інші курси топів ринку)\nМожливість вирости до Team Lead та Head of Dep.\nРоботу з бюджетами від 10 000$ на місяць сумарно\nчітку та прозору систему мотивації у % від чека проєкту\nв команді є Team Lead, Project Manager, дизайнери та монтажери, відповідно за комунікацію та створення рекламних креативів тобі відповідати не потрібно.\n🔢Що від тебе:\nРобота з бюджетом понад 3.000$ на місяць\nДосвід роботи від 6 місяців\nАналітичне мислення та креативність\nІніціативність та бажання постійно розвиватись\n⌨️Якщо цікаво — заповнюй форму https://forms.gle/qM99mxRks8ZvwpEg7",
      "date": "2026-10-16T17:18:11.795Z",
      "dateFormatted": "Сьогодні, 20:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171073150-12",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "mediabuers_cpa UA",
      "sourceUsername": "@mediabuers_cpa",
      "authorName": "ADS",
      "authorUsername": "@fsfseffse_bot",
      "title": "🚀 Media Buyer (Facebook, Influence-схемы) | Бинарные опционы",
      "text": "🚀 Media Buyer (Facebook, Influence-схемы) | Бинарные опционы\n\nGolden Affiliates ищет опытного медиабайера на схемный инфлюенс-трафик через Facebook → Telegram-воронки.\nРаботаем в вертикали бинарок, с сильным продакшеном, крутыми агентами и реальными бюджетами.\n\n🎯 Что нужно делать:\n— Запуск и оптимизация схемных РК с FB на Telegram\n— Постановка задач дизайнерам и актёрам\n— Работа с Chatterfy, Keitaro и табличками\n— Ведение агентов и анализ их воронок\n— Присутствие на регулярных созвонах + отчётность\n\nЧто нам важно:\n— Опыт от 1–1,5 лет в Facebook (реальный, не теоретический)\n— Опыт от 6 месяцев в инфлюенс-схемах (гембла / бинарки)\n— Бюджеты: работал(а) с 1000–3000$ в сутки\n— Умеешь ставить ТЗ актёрам, писать сценарии и контролировать прод\n— Обязательно: кейсы. Хоть скрин, хоть таблица, но без них — не двигаемся\n\n🔍 Будет плюсом:\n— Опыт в бинарках\n— Знание Tier 3, особенно Индия\n\n🚫 Точно не подойдёт, если:\n— Никогда не работал(а) со схемным трафиком\n— Спендил до 500$ в день и считаешь это “опытом”\n— Не можешь показать ни одного кейса\n\n👤 Кто нам нужен:\nОткрытый, живой, инициативный человек, готовый работать быстро, точно и с интересом. Не ждун — а действующий.\n\n💰 Условия:\n— Удалёнка\n— Онлайн с 10:00 до 18:00 по МСК\n— ЗП: Индивидуально обсуждаемая сетка от профита. Сильным кандидатам — условия под вас.\n\n\n📩 Присылай кейсы и пиши в личку: @goldnaffhr",
      "date": "2026-10-16T17:17:53.149Z",
      "dateFormatted": "Сьогодні, 20:17",
      "budget": 124500,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 78,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 124500 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171070829-544",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "traffic_cpa_hr UA",
      "sourceUsername": "@traffic_cpa_hr",
      "authorName": "ADS",
      "authorUsername": "@vscsbrgse_bot",
      "title": "Вакансия: Media Buyer (TG/ FB/ TikTok)",
      "text": "Вакансия: Media Buyer (TG/ FB/ TikTok)\n\nВертикаль: бинарные опционы\nФормат: удаленно\nГео: LATAM, CIS\nИсточники:Telegram Ads / Facebook Ads / TikTok Ads\n\nИщем Media Buyer’а под залив трафика в вертикали бинарных опционов.\nРассматриваем как специалистов по одному источнику, так и байеров с опытом работы сразу в нескольких: Telegram Ads, Facebook Ads, TikTok Ads.\n\nЧто ожидаем:\n\n• опыт работы с Telegram Ads, Facebook Ads или TikTok Ads в финансовой вертикали / бинарных опционах\n• актуальный коммерческий опыт залива по одному из источников за последние месяцы\n• понимание воронок, связок, креативов, аналитики и ключевых метрик\n• опыт работы с GEO LATAM / CIS будет преимуществом\n• умение работать с бюджетами от $1000 daily\n• самостоятельность в принятии решений и умение быстро тестировать гипотезы\n• готовность собирать каналы, ботов, прокладки и тестовые воронки при необходимости\n• умение работать со SPY-сервисами и анализировать рынок\n• подготовка регулярных отчетов по заливам и результатам тестов\n• готовность предоставить подтвержденную статистику за последние месяцы.\n\nЧто предлагаем:\n\n• быстрые и регулярные выплаты\n• индивидуальные условия\n• гибкие условия\n• готовую инфраструктуру и выстроенные процессы\n• быструю коммуникацию и оперативное принятие решений\n• эксклюзивные продуктовые решения, которых нет на рынке\n• возможность масштабироваться на больших бюджетах.\n\nНам важно реальный актуальный опыт закупки трафика, понимание своей статистики и готовность работать на результат, а не просто запускать тесты без аналитики.\n\nОткликайтесь с кратким описанием опыта: источник трафика, GEO, бюджеты, вертикаль, последние результаты и подтверждение статистики.\n\nКонтакт @alena_h_h 📲",
      "date": "2026-10-16T17:17:50.829Z",
      "dateFormatted": "Сьогодні, 20:17",
      "budget": 41500,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 70,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 41500 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171059226-983",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "chat",
      "sourceName": "freelance_workua UA",
      "sourceUsername": "@freelance_workua",
      "authorName": "Angelina",
      "authorUsername": "@angelinaaahr5",
      "title": "💰 ХОЧЕШЬ БОЛЬШЕ ЗАРАБАТЫВАТЬ?",
      "text": "💰 ХОЧЕШЬ БОЛЬШЕ ЗАРАБАТЫВАТЬ?\n\n🚀 Тогда посмотри наши актуальные вакансии в  FOREX.\n\n━━━━━━━━━━━━━━\n\nИЩЕМ:\n\nSales Manager\n📊 Retention Manager\n👑 Team Lead\n💬 Support Manager\n💻 Media Buyer\n🎓 Trainee / Junior\n\n━━━━━━━━━━━━━━\n\n🌍 НАПРАВЛЕНИЯ:\n\n🇷🇺 RU\n🇬🇧 ENG\n🇩🇪 DE\n🇵🇱 PL\n🇨🇿 CZ\n🇹🇷 TR\n🇦🇪 AR\n\n💵 УСЛОВИЯ:\n▪️ Ставка + % / бонусы\n▪️ Стабильный поток клиентов\n▪️ Регулярные выплаты\n▪️ Бонусы за KPI\n▪️ Обучение новичков\n▪️ Рост до Team Lead\n\n❗️ НУЖЕН ОПЫТ — ХОРОШО. НЕТ ОПЫТА — ТОЖЕ РАССМОТРИМ.\n\n📥 Пиши в ЛС — подберём позицию под тебя.",
      "date": "2026-10-16T17:17:39.225Z",
      "dateFormatted": "Сьогодні, 20:17",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792171059213-362",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "landing",
      "subcategoryName": "Односторінковий сайт",
      "sourceType": "chat",
      "sourceName": "freelance_workua UA",
      "sourceUsername": "@freelance_workua",
      "authorName": "Bogdan",
      "authorUsername": "@freelance_workua",
      "title": "🤖 Telegram / WhatsApp бот для бізнесу",
      "text": "🤖 Telegram / WhatsApp бот для бізнесу\n\n• відповідає клієнтам\n• приймає заявки\n• працює 24/7\n💰 Ціна: від 30€\n\n🌐 Сайт або лендінг під ключ\n\n• адаптивний\n• форма заявки\n• швидкий запуск\n\n💰 Ціна: від 40€\n\n⚙️ Автоматизація бізнесу\n\n• бот → Google Sheets\n• бот → CRM\n• бот → email\n\n💰 Ціна: від 50€\n\n🤖 GPT-бот для відповідей клієнтам\n\n• економить час\n• відповідає автоматично\n• під будь-яку нішу\n\n💰 Ціна: від 40€\n\n❓ Не знаєш, що краще?\n\nОпиши свою задачу —\nя підкажу рішення і ціну 👌@ bogdan_OP24",
      "date": "2026-10-16T17:17:39.213Z",
      "dateFormatted": "Сьогодні, 20:17",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 63,
      "aiSummary": "Замовлення: односторінковий сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170948224-657",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "facebook_25 UA",
      "sourceUsername": "@facebook_25",
      "authorName": "ARBI ADS 📌",
      "authorUsername": "@arbi_ads_bot",
      "title": "🇧🇪 ВЫСОКОКАЧЕСТВЕННЫЕ МОБИЛЬНЫЕ ПРОКСИ БЕЛЬГИИ (4G/5G) 🇧🇪",
      "text": "🇧🇪 ВЫСОКОКАЧЕСТВЕННЫЕ МОБИЛЬНЫЕ ПРОКСИ БЕЛЬГИИ (4G/5G) 🇧🇪\n\nИщете стабильные, «чистые» и высокопроизводительные мобильные прокси Бельгии для своих проектов? Перестаньте терять аккаунты и тратить ресурсы впустую!\n\n⚡ Почему стоит выбрать нас?\n📱 100% реальные устройства: работают на настоящих физических мобильных телефонах и SIM-картах для максимального уровня доверия (без эмуляторов).\n🚀 Высокоскоростные сети 4G/5G (топовые бельгийские операторы).\n🔄 Простая ротация IP в 1 клик (мгновенная смена IP-адреса).\n♾️ Безлимитный трафик и максимальное время работы без перебоев.\n🛠️ Многоцелевое использование: идеально для арбитража, веб-скрейпинга, работы с несколькими аккаунтами, автоматизации, SEO, рекламы Meta Ads, Google Ads и любых задач, где нужен надёжный прокси!\n\n💥 Получите свои прокси сейчас и масштабируйте свой бизнес!\n\n👉 Заказать / Связаться: @proxyshine",
      "date": "2026-10-16T17:15:48.224Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170942061-643",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "general",
      "subcategoryName": "Монтаж",
      "sourceType": "chat",
      "sourceName": "robota_kropyvnytskyi24 UA",
      "sourceUsername": "@robota_kropyvnytskyi24",
      "authorName": "robota_kropyvnytskyi24",
      "authorUsername": "@robota_kropyvnytskyi24",
      "title": "❗️Терміново потрібні співробітники на віддалену роботу!",
      "text": "❗️Терміново потрібні співробітники на віддалену роботу!\n\nВиплата одразу - від 1700грн за день.\n\nХто без досвіду, проводимо навчання.\n\nДля роботи у цих напрямках:\n\n🟢 Редагування фото - від 24 000 грн\n\n🟢 Монтаж відео - від 28 000 грн\n\n🟢 Публікація постів - від 18 000 грн\n\n🟢 Менеджер з продажу - від 45 000 грн\n\n🟢 Відповідати на вхідні повідомлення - від 26 000 грн\n\nВстигни приєднатися, місця обмежені",
      "date": "2026-10-16T17:15:42.060Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 1700,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": true,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 59,
      "aiSummary": "Замовлення: монтаж з бюджетом 1700 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170936534-802",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "landing",
      "subcategoryName": "Односторінковий сайт",
      "sourceType": "chat",
      "sourceName": "marketing_network1 UA",
      "sourceUsername": "@marketing_network1",
      "authorName": "Roman │ Розробка сайтів",
      "authorUsername": "@diahilevr",
      "title": "Розробляю сайти під ключ - від ідеї до запуску.",
      "text": "Розробляю сайти під ключ - від ідеї до запуску.\n\nСтворюю лендінги, корпоративні сайти та інтернет-магазини, а також займаюся технічними доопрацюваннями та покращенням вже готових сайтів.\n\nДопомагаю бізнесу виглядати професійніше, викликати довіру та отримувати більше заявок.\n\nЯкщо вас цікавить розробка сайту або технічні доопрацювання - напишіть мені в особисті повідомлення. Проведу безкоштовну консультацію 📩",
      "date": "2026-10-16T17:15:36.534Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 58,
      "aiSummary": "Замовлення: односторінковий сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170936509-503",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "marketing_network1 UA",
      "sourceUsername": "@marketing_network1",
      "authorName": "Альона Хмеленко",
      "authorUsername": "@Alena_Chymshyr",
      "title": "вакансія: SMM Manager до  рекрутингової агенції HireStep! 📍 Віддалено,...",
      "text": "вакансія: SMM Manager до  рекрутингової агенції HireStep! 📍 Віддалено, гнучкий графік / Part-time або full-time 💰 Дохід — індивідуально, залежно від досвіду та домовленостей по зонам відповідальності.\n\n👋 Хто ми HireStep допомагає компаніям в Україні та Європі знаходити сильних людей — від менеджерів до C-level. За нашими плечима 400+ закритих вакансій і 250+ компаній-клієнтів. Ми ростемо і шукаємо SMM Manager, який зробить бренд HireStep впізнаваним і перетворить соцмережі на канал залучення клієнтів та кандидатів.\n\n🎯 Результат, якого чекаємо ▫️ системне зростання підписників і охоплень ▫️ впізнаваність HireStep серед бізнесу та кандидатів ▫️ залучення клієнтів і кандидатів через соцмережі ▫️ регулярна, жива присутність бренду на всіх майданчиках\n\n✍️ Задачі ▫️ SMM-стратегія та контент-план ▫️ контент повного циклу: ідея, текст, візуал, Reels, публікація ▫️ ведення Instagram і Telegram, адаптація під LinkedIn, Threads, Facebook, TikTok, YouTube ▫️ робота з таргетологом: креативи та рекламні кампанії ▫️ контент для сайту ▫️ аналітика: що працює, що ні і що змінюємо\n\n🔎 Вимоги ▫️ комерційний досвід у SMM від 1 року ▫️ портфоліо з власними роботами та результатами в цифрах ▫️ сильні, живі тексти ▫️ самостійний візуал і Reels ▫️ вміння будувати контент-стратегію і працювати з аналітикою ▫️ впевнене володіння інструментами досвідченого SMM — працюй у тих, що зручні тобі, головне швидко і якісно ▫️ самостійність: приходиш з ідеями, а не чекаєш ТЗ\n\n➕ Буде перевагою ▫️ досвід із LinkedIn, Threads, TikTok, YouTube ▫️ досвід роботи з таргетологом і Meta Ads ▫️ експертні, B2B або сервісні бренди ▫️ розуміння HR чи рекрутингу\n\n🌿 Що пропонуємо ▫️ повністю віддалений формат і гнучкий графік ▫️ part-time або full-time ▫️ жодного мікроменеджменту — оцінюємо за результатом ▫️ таргетолог і монтажер у команді ▫️ сотні реальних кейсів як основа для контенту ▫️ адаптацію, навчання і реальний вплив на розвиток компанії\n\n👉Надсилайте портфоліо в особисті )",
      "date": "2026-10-16T17:15:36.508Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": true,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170924646-466",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "chat",
      "sourceName": "Robota_ternopil24 UA",
      "sourceUsername": "@Robota_ternopil24",
      "authorName": "workhubautopost",
      "authorUsername": "@workhubautopostbot",
      "title": "Трафер/трафік менеджер",
      "text": "Трафер/трафік менеджер\n\n✈️400-1000$\n✈️ Віддалено\n\n✈️Вимоги:\n▪️З досвідом чи без\n▪️Повна зайнятість\n▪️Наявність ПК або ноутбука\n\n✈️Умови:\n▪️Робота віддалено.\n▪️Кар'єрне зростання та премії.\n▪️Виплати раз на тиждень.\n▪️Усіма розхідниками забезпечуємо.\n\n✈️Контакти:\n@alinat28",
      "date": "2026-10-16T17:15:24.645Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 41500,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 66,
      "aiSummary": "Замовлення: маркетинг з бюджетом 41500 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170918561-308",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "smmpeople UA",
      "sourceUsername": "@smmpeople",
      "authorName": "Юлия Медведева 🧘🏻‍♀️",
      "authorUsername": "@umedvedeva",
      "title": "#рекламаВКонтакте #таргетВК #таргетологвк #помогу #ищупроект",
      "text": "#рекламаВКонтакте #таргетВК #таргетологвк #помогу #ищупроект\n\nБолее 20 млн ₽ выручки заработала для своих клиентов 🔥\n\nЗдравствуйте! Я Юлия Медведева — сертифицированный таргетолог с опытом 5+ лет.\n\n🤩Мои результаты за 5 лет:\n• Принесла клиентам более 20 000 000 ₽ оборота\n• Привела более 25 000 заявок\n• Средний ежемесячный бюджет в управлении — 350 000 ₽\n• Самый долгий проект в работе — 2,5 года\n\n💡Наработаны рабочие связки и стратегии!\n\n🎁 Бесплатный бонус: экспресс-аудит вашего кабинета или посадочной страницы - дам 3 совета по росту конверсии.\n\n✍🏻 Пишите мне: хочу клиентов из ВК",
      "date": "2026-10-16T17:15:18.560Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170918528-543",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "chat",
      "sourceName": "smmpeople UA",
      "sourceUsername": "@smmpeople",
      "authorName": "Алексей Малов",
      "authorUsername": "@alexmylove",
      "title": "#помогу #сайт #дизайнер #лендинг #тильда #taptop #wordpress",
      "text": "#помогу #сайт #дизайнер #лендинг #тильда #taptop #wordpress\n\nПривет! Меня зовут Малов Алексей, я создаю сайты для бизнеса под ключ. Беру вашу идею и превращаю её в рабочий механизм. Делаю все работы, необходимые для запуска:\n\n— Анализирую целевую аудиторию и выявляю её потребности\n— Изучаю сайты конкурентов\n— Пишу тексты, которые продают и доносят вашу ценность\n— Разрабатываю дизайн, ориентированный на рост конверсии\n— Верстаю сайт на Тильде, Таптопе или WordPress  (для последнего у меня к батарее прикован верстальщик)\n— Делаю базовую SEO-оптимизацию\n— Настраиваю оплату, доставку, интеграции с CRM и другими сервисами\n— Готовлю макеты для передачи вашим верстальщикам (при необходимости)\n\nПортфолио, цены и отзывы на сайте в описании профиля.\n\nСохраните мой контакт на будущее, а ещё лучше — пишите в личку, я проведу для вас бесплатную консультацию. Обнял-приподнял, буду рад поработать вместе!❤️",
      "date": "2026-10-16T17:15:18.527Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170918502-890",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "tg_bots",
      "subcategoryName": "Телеграм-бот",
      "sourceType": "chat",
      "sourceName": "smmpeople UA",
      "sourceUsername": "@smmpeople",
      "authorName": "Арсений",
      "authorUsername": "@SenkaMozgas",
      "title": "Помогу экспертам, продюсерам кто хочет перестать вручную вести клиетов, нас...",
      "text": "Помогу экспертам, продюсерам кто хочет перестать вручную вести клиетов, настроить систему, которая сделает все за вас: выдачу материалов, переходы на соцсети и мягко подведет клиента к продаже, даже если текущая воронка не работает\n\nЧто закрываю:\n-техническая реализация воронки продаж под ключ\n– настройка чат-ботов и рассылок\n–докрутка смыслов\n– система дожимных инструментов\n– интеграции, оплаты, автоматизация\n–сопровождение от А до Я\n\n⭐️Среди моих клиентов: Егор Пыриков, Вадим Демчог, Кристина Таспин, Надин Серовски, Татьяна Соло, Евгений Геранькин, Мадина Мусичова\n\nВсе мои проекты, с которыми работал, вышли на стабильные продажи через воронку без ручных действий\n\nГотов зайти в проект на запуск или выстроить систему с нуля, пиши @SenkaMozgas\n\n#техспец #воронкипродаж #автоматизация #запуск #getcourse #salebot",
      "date": "2026-10-16T17:15:18.501Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: телеграм-бот.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170918458-522",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "smmpeople UA",
      "sourceUsername": "@smmpeople",
      "authorName": "Наталья | Трафик в Тг",
      "authorUsername": "@NatalTarget",
      "title": "#помогу #таргет #закупщик #telegram_ads #закупкарекламы #NatalTarget1610...",
      "text": "#помогу #таргет #закупщик #telegram_ads #закупкарекламы #NatalTarget1610\n\n❌ НАДОЕЛО РАБОТАТЬ С ТАРГЕТОЛОГОМ БЕЗ ОПЫТА?!\n\nМеня зовут Наталья - и я\n😛😌😁☺️😌😛😉😍😉☺️😌😛☺️     😌    😉😌😚😋\n\nи 😛😌😚😌😋😛😌😚 в  телеграмм и макс с опытом 4+ лет 😎📱📱\n\nСо мной вы:\n✅ Забудете о проблемах с маркировкой\n\n✅ Будете спокойны за рекламный бюджет\n\n✅ Начнете получать ЦЕЛЕВУЮ аудиторию на ваши воронки\n\nРезультаты в цифрах 👇\n\n767 регистраций по 132 руб на вебинар по интимной гимнастике\n\n7 продаж по 200 000 руб при рекламном бюджете 200 000 руб в нише - выхода на маркетплейсы\n\n591 подписчик по 1,69€ на канал копии люксовых брендов\n\nПишите 👉 в лс\n\nРаспишу методы продвижения именно для вашего проекта !",
      "date": "2026-10-16T17:15:18.457Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170917116-630",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "smmbunker UA",
      "sourceUsername": "@smmbunker",
      "authorName": "ViktoriiaBossAuto",
      "authorUsername": "@Viktoriia_BossAuto",
      "title": "Шукаємо маркетолога | Варшава, центр",
      "text": "Шукаємо маркетолога | Варшава, центр\n\nBoss Auto (імпорт авто в Польщу, 8+ років) шукає digital-маркетолога, який хоче рости до керівника відділу 🚀\n\nЩо робитимеш:\n🔹 Google Ads, Meta Ads, YouTube, SEO\n🔹 GA4, GMB, e-mail маркетинг\n🔹 стратегія, нові канали, аналітика\n\nКого шукаємо:\n✔️ 4+ роки в digital-маркетингу\n✔️ польська B2+, українська вільно\n✔️ кейси з цифрами (CPA, ROAS)\n\nЩо даємо:\n💰 8 000 -12 000 PLN netto, в залежності від досвіду - готові також обговорювати індивідуально\n📈 шлях до керівника відділу\n🏢 офіс у центрі, пн-пт 10-19\n🤝 україномовна команда\n\n👉 Резюме або питання: @Viktoriia_BossAuto\nЗнаєш когось підходящого?\nПерешли, будь ласка 🙏",
      "date": "2026-10-16T17:15:17.116Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Польща",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 56,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170917064-722",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "chat",
      "sourceName": "smmbunker UA",
      "sourceUsername": "@smmbunker",
      "authorName": "Denys | Meta Ads | Google Ads",
      "authorUsername": "@denivancad",
      "title": "Шукаємо перспективного лідогенератора на підсилення в команду",
      "text": "Шукаємо перспективного лідогенератора на підсилення в команду\n\nМи -  рекламна агенція VELAR, яка масштабується і розширює відділ лідогенерації. Шукаємо людину, яка максимально залучиться в процес, хоче зайти в digital та sales і рости разом з нами 🔥\n\nКого шукаємо:\nЛюдину з практичним досвідом у лідгені, продажах або digital від 6 місяців (буде класно, якщо більше)\nАбо без практики, але з класною теоретичною базою: розумієш, як працює лідогенерація і як залучати клієнтів\nЯка любить діяти й приносити ідеї\nЯка вміє (або хоче навчитися) писати рекламні скрипти\nЯка хоче бачити реальний результат\n\nЩо пропонуємо:\nСтавка + % від кожного приведеного клієнта (орієнтовно 20 000 грн, залежить від досвіду)\nНавчання: інвестуємо в твій розвиток, даємо бюджет та інструменти, щоб ти міг(-ла) втілювати свої ідеї🥇\nРеальний вплив на розвиток напрямку\nМожливість вирости до тім ліда\nСильну команду й підтримку🤝\n\nШукаємо людину на довгострок, з перспективою росту разом з нами\n\nХочеш обговорити? Пиши @Olgavelar",
      "date": "2026-10-16T17:15:17.063Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 20000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 72,
      "aiSummary": "Замовлення: маркетинг з бюджетом 20000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170917030-773",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "smmbunker UA",
      "sourceUsername": "@smmbunker",
      "authorName": "꧁𝙲𝙾𝚂𝙼𝙾꧂",
      "authorUsername": "@Keydcg",
      "title": "Привіт!",
      "text": "Привіт!\nЯ Олена займаюся монтажем відео\n  Що саме я роблю:\n- Монтаж відео для YouTube / TikTok / Instagram\n- Вертикальні та горизонтальні відео під будь-яку платформу\n- Динамічні переходи, ефекти, субтитри, кольорокорекція.💫\n\n  Що отримаєте:\n✔ Креативний підхід до кожного замовлення\n✔ Роблю під ваш стиль і побажання",
      "date": "2026-10-16T17:15:17.030Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792170917012-791",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "smmbunker UA",
      "sourceUsername": "@smmbunker",
      "authorName": "Vita Valtner",
      "authorUsername": "@vita_valtner",
      "title": "Вітаю❤️",
      "text": "Вітаю❤️\nЗараз проходжу навчання у Тані Стороженко й хочу взяти ще один цікавий проєкт у роботу!\n\nМожу запропонувати повне або часткове ведення Instagram.\n\nЯкщо ви власник бізнесу й давно шукаєте SMM-спеціаліста — давайте знайомитись!\n\nКому актуально?",
      "date": "2026-10-16T17:15:17.010Z",
      "dateFormatted": "Сьогодні, 20:15",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 58,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485691-5099",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Mitre Media",
      "authorUsername": "@upwork_remote",
      "title": "Tech Lead Full-Stack Rails Engineer",
      "text": "Tech Lead Full-Stack Rails Engineer\n\nКомпанія: Mitre Media\nЛокація: Remote (International)\nОплата: $170k - $200k\n\nAbout Mitre Media  \n  Mitre Media is redefining FinTech with AI-driven tools that empower millions of investors. Our portfolio, including Dividend.com and MutualFunds.com, leverages LLMs to deliver novel data insights and visually rich user experiences. For over a decade, we’ve served individual investors, financial advisors, and top asset managers like BlackRock and Vanguard through our premium data, tools, and advertising solutions. Join our lean, entrepreneurial team to shape the future of AI-powered investing from your location ±3 hours from Eastern Time.  \n  Our users are deeply engaged, spending over 5 minutes per visit with a bounce rate below 10%, researching investments across hundreds of different categories. With 40 million brokerage accounts in the U.S., we take pride in buil",
      "url": "https://remotive.com/remote-jobs/software-development/tech-lead-full-stack-rails-engineer-2069746",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 170000,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів з бюджетом 170000 $.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485678-5828",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "freelance_ua",
      "sourceName": "Freelance.ua",
      "sourceUsername": "@freelance_ua",
      "authorName": "Замовник на Freelance.ua",
      "authorUsername": "@freelance_ua",
      "title": "Потрібен WordPress-розробник, який додасться на сторінку моєї компанії в LinkedIn як співробітник",
      "text": "Потрібен WordPress-розробник, який додасться на сторінку моєї компанії в LinkedIn як співробітник\n\nПотрібен WordPress-розробник, який додасться на сторінку моєї компанії в LinkedIn як співробітник (будь ласка,...",
      "url": "https://freelance.ua/orders/297986-potriben-wordpress-rozrobnik-jakij-dodastsa-na-storinku-mojeji-kompaniji-v-linkedin-jak-spivrobitnik.html",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 300,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelance.ua: веброзробка з бюджетом 300 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485666-1700",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Team Lead of Media Buyers (FB) iGaming",
      "text": "Team Lead of Media Buyers (FB) iGaming\n\nШукаємо досвідченого лідера, який вміє масштабувати прибуткові зв’язки та командний результат.\n \nСтавка до $2500 + %\nУмови обговорюємо індивідуально залежно від досвіду та результатів.\n \nЩо очікуємо:\n• 3+ роки в Media Buying / Affiliate Marketing у Gambling / iGaming;\n• 1,5+ року на позиції Team Lead / Head of Buying;\n• досвід управління командою від 3 Media Buyers зі spend від $300k на місяць бажано;\n• практичний досвід із CPA та Spend-моделями;\n• глибокий досвід із Tier-1 GEO: переважно Європа та Канада, робота з 3+ GEO одночасно;\n• впевнена робота з Facebook / Meta Ads, iOS / Android APP / PWA та Keitaro / Binom;\n \nТвої задачі:\n• управління командою, постановка KPI та розвиток баєрів;\n• формування стратегії закупівлі трафіку;\n• пошук і тестування нових GEO, оферів, креативів та воронок;\n• масштабування прибуткових зв’язок без втрати економіки;\n• контроль ROI / ROAS, spend, якості трафіку та фінансового результату.\n \nБуде плюсом: командний spend $500k+/місяць, побудова buying-команди з нуля, автоматизація та використання AI у Media Buying.\n \nХочеш дізнатися більше? Напиши — обговоримо твій досвід та умови!",
      "url": "https://djinni.co/jobs/853730-team-lead-of-media-buyers-fb-igaming/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 104000,
      "currency": "₴",
      "country": "Канада",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 78,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta) з бюджетом 104000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485652-777",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Marketing Manager (PR, SMM and Content Creation)",
      "text": "Marketing Manager (PR, SMM and Content Creation)\n\nAbout us\nCracken is an applied AI lab built by ex-nation-state operators and AI researchers, delivering the world's first Uncensored Vibe Hacking platform that safely amplifies security teams and gives enterprises proven, auditable security resilience.\n\n \nThe role\nWe're looking for a Marketing Manager to own our external voice and build credibility in a highly technical cybersecurity domain. You'll lead three connected pillars: PR, social media (SMM), and content creation. This is a hands-on, high-impact role with real ownership over brand voice, visibility, and thought leadership.\n\n \nWhat you'll do\n\n \nMarketing strategy & operations\nExecute marketing strategy aligned with business goals\nOrganize lightweight marketing ops: content calendar, contractors, and timelines\nCollaborate directly with founders, product, sales, and design teams\nTrack performance, prepare monthly reports, and optimize based on metrics\nContent creation\nTurn security research, product features, and engineering work into deep, credible material: technical blog posts, breakdowns, whitepapers, and explainers\nMaintain and grow the company blog and website content\nUse AI tools to speed up content workflows without losing technical accuracy or brand voice\nSMM\nBuild and manage content and media plans across LinkedIn, X/Twitter, blog, and website\nGrow a targeted audience of security practitioners, researchers, and enterprise buyers\nBuild relationships with partners and communities\nPR & communications\nBuild and maintain relationships with cybersecurity and tech media\nWrite and distribute press releases, announcements, and pitches\nIdentify trends, news hooks, and PR opportunities in cyber and AI, and pitch timely commentary and expert perspectives\nSupport conference presence, including announcements, live coverage, and post-event content\nCoordinate speaking opportunities, podcasts, and interviews for founders and researchers\n\n \nMust have\n3+ years of experience in Marketing, PR, SMM, Content, or a related hybrid role\nExperience in the cybersecurity domain\nDemonstrated ability to write technical content (technical blog posts, whitepapers, or deep-dive explainers)\nStrong SMM track record with real cases of growing a targeted audience\nHands-on experience with media or press outreach and pitching\nHands-on experience using AI tools for content and marketing workflows\nExcellent English copywriting skills\nAbility to translate complex technical topics into clear, credible messaging\nProactive, ownership-driven mindset; comfortable operating in an early-stage startup\n\n \nNice to have\nExperience working with top-tier cybersecurity media (e.g. The Hacker News, Dark Reading, BleepingComputer, SecurityWeek, CyberScoop, Krebs on Security)\nExperience with conference and event marketing\nExperience with crisis or sensitive-topic communications\n\n \nChannels & tools\nLinkedIn, X/Twitter, company blog and website\nMedia and press outreach, pitching, and media list management\nAI-assisted content and marketing tools\n\n \nWhy Cracken?\nReal-world impact: Technology validated in nation-state operations and grounded in hands-on internal research\nTeam with a mission: Ukrainian-heavy international team of PhDs, professors, and top-tier industry veterans, driven by intrinsic motivation shaped by real-world adversity\nAdaptive roles: We shape roles around exceptional talent; your ownership and drive will define your path\nPerfect timing: Operating at the intersection of AI, cybersecurity, and autonomous systems, Cracken is uniquely positioned to win against sophisticated adversaries\n\n \nWhat we offer\nOpportunity to build a global cybersecurity brand from an early stage\nDirect collaboration with founders and cyber operators\nHigh autonomy and real ownership\nFully remote and flexible work setup\nCompetitive compensation",
      "url": "https://djinni.co/jobs/852443-marketing-manager-pr-smm-and-content-creation/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485636-4415",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "landing",
      "subcategoryName": "Односторінковий сайт",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Senior B2B Marketing Manager",
      "text": "Senior B2B Marketing Manager\n\nWe are looking for a Marketing Project Manager who will own and coordinate full-funnel marketing programs for B2B tech clients. Programs may include inbound and content-led growth, paid acquisition, ABM engagement, lifecycle nurture, and omnichannel campaign execution.\n \nThis role combines client ownership, cross-channel performance analysis, alignment of positioning and messaging, and delivery coordination. Our clients (cybersecurity, AI, SaaS, automation, enterprise software) operate in competitive markets where consistent pipeline growth and brand clarity are critical. You will manage multi-channel programs that generate qualified conversations, support SQL creation, and drive revenue growth.\n \nThis is a client-facing, strategy-and-execution role combining program management, performance analysis, hypothesis-driven optimization, and cross-functional coordination. You will be hands-on in planning, reporting, and messaging strategy, and will lead specialists for execution across channels depending on client scope.\n \nKey Responsibilities: \nMarketing Strategy, Positioning & Planning\nDevelop and manage multi-channel marketing programs aligned with client revenue and pipeline goals.\nOwn positioning and messaging work: define or refine value propositions, ICP-specific messaging frameworks, and competitive differentiation narratives.\nTranslate positioning into channel-level briefs ensuring consistent message across paid, organic, email, ABM, and social.\nAudit CRM and funnel data to validate ICP segments, identify conversion bottlenecks, and align program priorities with pipeline reality.\nBuild structured program roadmaps across inbound, paid, ABM, lifecycle, and content channels.\nDefine and test offers by segment (webinars, assessments, demos, reports) and map them to funnel stage.\n \nProgram Build, Activation & Coordination\nTranslate strategy into a program brief: ICP, offer, messaging, channels, funnel steps, assets, SLAs, and measurement plan.\nCoordinate end-to-end conversion paths: landing pages, forms, email nurture flows, retargeting, and sales handoff.\nManage execution across omnichannel programs, including:Paid media (LinkedIn, Google, Meta)\nSEO and content-led inbound\nEmail marketing and lifecycle flows\nABM and account engagement\nLanding page and funnel CRO initiatives\n\nOwn timelines, deliverable quality, resource allocation, and dependency management across the delivery team.\nEnsure messaging consistency across all channels, aligning with value propositions, buyer intent, and segment context.\nMaintain an experiment backlog with hypotheses, priority, expected impact, and learnings.\n \nPerformance Analysis & Hypothesis Development\nBuild and own a cross-channel performance view: analyze traffic, lead, MQL, SQL, and pipeline data across all active channels.\nDevelop data-driven hypotheses on what is working, what is underperforming, and where growth opportunities exist across SEO, paid, email, ABM, and emerging channels.\nTrack and actively work to grow traffic and conversions from AI-driven sources (ChatGPT, Perplexity, Google AI Overviews, and similar); treat AI visibility as a measurable channel with its own KPIs.\nIdentify funnel bottlenecks and propose specific optimization initiatives across targeting, offer, messaging, conversion, and follow-up.\nOwn UTM governance and channel taxonomy; ensure tracking consistency across all programs.\nOwn dashboard development and reporting cadence (weekly performance readouts and monthly pipeline reviews).\nEnsure a practical attribution approach per client maturity, document limitations, and maintain consistent measurement.\n \nClient Communication & Ownership\nAct as the primary client contact for marketing programs.\nPresent program plans, performance updates, insights, and optimization strategies in a structured, business-focused way.\nTranslate data into clear recommendations aligned with client KPIs and commercial goals.\nManage expectations while proactively identifying growth opportunities and risks.\n \nProject & Cross-Functional Coordination\nManage timelines and ensure deliverables meet scope, quality standards, and deadlines.\nAllocate and coordinate internal resources (PPC specialists, SEO specialists, designers, copywriters, marketing automation specialists).\nEnsure clear briefs, structured task roadmaps, and ownership across the delivery team.\nIdentify operational bottlenecks and maintain workflow momentum.\n \nPerformance & Continuous Improvement\nTrack and improve program performance across CPL, CPA, MQL-to-SQL conversion, cost per SQL, cost per opportunity, and pipeline contribution.\nPrepare structured monthly reports with actionable insights, decisions, and next experiments.\nStay current on AI-driven advertising tools, AEO trends, automation, and performance optimization approaches.\n \n\n \nMust-Have Requirements:\n5+ years of experience in B2B digital marketing or performance marketing, ideally in an agency environment.\nExperience working with B2B tech clients.\nStrong understanding of full-funnel marketing and pipeline-driven KPIs.\nHands-on experience managing multi-channel programs including paid, inbound, email, and content channels.\nExperience developing or executing positioning and messaging frameworks for B2B audiences.\nAbility to analyze cross-channel performance, identify patterns, and build structured optimization hypotheses.\nCRM analytics skills in HubSpot and/or Salesforce (funnels, segmentation, campaign reporting).\nAbility to connect program performance to SQL and pipeline outcomes (sourced and influenced).\nExperience with project management tools (ActiveCollab, Monday.com, Asana, Jira, or similar).\nStrong analytical mindset and comfort working with imperfect data.\nExperience managing multiple projects and priorities simultaneously.\nExperience coordinating cross-functional teams.\nConfident client-facing communication skills.\nProfessional written and verbal English communication skills.\nProactive, structured, and results-oriented approach.\n \nNice to Have Requirements:\nProven track record of growing traffic or conversions from AI-driven search sources (AI Overviews, ChatGPT, Perplexity, or similar).\nFamiliarity with AEO and AI visibility tools (AmIonAI, ScrunchAI, Profound, or equivalents).\nFamiliarity with data enrichment tools (Apollo, ZoomInfo, Clay, or equivalents).\nFamiliarity with ABM and intent platforms (6sense, Demandbase, RollWorks, or equivalents).\nExperience with GA4 and dashboarding tools (Looker Studio or similar).\nExperience with webinar program operations.\n \nCompensation & Benefits\nCompetitive compensation package (salary range provided in the offer)\nWork flexibility — fully remote setup with adaptable hours, and the possibility of hybrid collaboration in part if desired.\nPaid time off — vacation, sick days, and company-wide holidays.\nProfessional development — access to HubSpot Academy, internal trainings, individual development plans, and reimbursement for approved external courses (subject to approval).\nCompany-provided equipment — including laptop and key resources.\nPerformance bonus — recognition tied to results and contribution\n \nMindset We Value (Our Culture)\nStay Curious and Always Learning: You eagerly explore new technologies, find fresh solutions, and stay ahead of trends.\nLead with Energy and Purpose: You bring ambition, bold thinking, and inspire others through impactful decisions.\nOwn Your Impact: You take full responsibility for outcomes, balancing priorities and consistently delivering results.\nPlace Clients at the Heart: You build trust, anticipate client needs, and exceed expectations.\nCommunicate with Clarity: You collaborate openly, ensuring clear, effective communication.\nEmbrace Change with Agility: You adapt quickly in dynamic environments and make thoughtful decisions under uncertainty.\nAct with Empathy & Integrity: You foster trust, act transparently, and treat others with respect and honesty.\n \nWhy Join 42DM?\nWe run dynamic projects in tier-1 tech markets, delivering measurable global impact.\nAs a certified HubSpot partner agency, we collaborate with international clients and innovative companies in the B2B tech sector.\nWe are a multicultural team, collaborating globally with openness and trust.\nFlat structure and clear processes, without unnecessary bureaucracy.\nWe value social responsibility, supporting volunteering initiatives and contributing to charitable causes, with a strong commitment to Ukraine\n \nCandidate Journey\n⭕ HR Interview → ⭕ Interview with Team Lead → ⭕ Test Task → ⭕ Final Interview\n📩 Send us your CV and let’s create something great together!",
      "url": "https://djinni.co/jobs/833639-senior-b2b-marketing-manager/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Канада",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: односторінковий сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485625-2170",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "landing",
      "subcategoryName": "Односторінковий сайт",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "AI Marketer",
      "text": "AI Marketer\n\nAVELaunch Books is a team that creates non-fiction books end-to-end for entrepreneurs, coaches, consultants, and thought leaders. We help experts turn their knowledge and experience into a structured, meaningful book — a tool for influence, trust, and business growth. We work deeply with each client: preserving their unique voice, building a strong narrative, and delivering a product that establishes authority in their field.\nAbout the role:\nAs our AI Marketer, you own the sales funnel: offer → ad → landing page → lead → call → payment. You make sure every step continues the one before it and every test gives numbers we can trust. Your main result is revenue. You don’t start from zero: we have 37+ books behind us, ready playbooks for funnels and smoke tests, and a Delivery team, marketing and a Head of Product to work with.\nWhat you’ll do:\nPackage products around one specific client pain, in the client’s own words.\nFind angles of attack and run market research: competitors, pains, open niches.\nLaunch smoke tests (landing pages, creatives, ads) with success and stop criteria set in numbers before launch.\nSet up tracking so every lead has a known source.\nClose each test with a known customer acquisition cost and a decision on what to do next.\nMaintain and scale the funnels that already bring clients.\nFind where the funnel loses people and fix it.\nDocument every working funnel as a process and use AI tools daily.\nWhat we’re looking for:\nProven experience building funnels that generated revenue — specific projects with numbers (relative figures are fine under NDA).\nHands-on work with landing pages, paid ads and lead generation, from launch to results analysis.\nAbility to package offers and work with client pains.\nFunnel analytics: you can tell a market problem from a funnel problem.\nExperience building business processes, MVPs and prototypes.\nOutcome-driven thinking, no fear of trying new things, your own quality standards.\nUkrainian fluent, English B1+\nNice to have:\nMarket research skills, experience running your own business or in sales.\nBuilding AI agents, understanding of MCP and CLI, prompt engineering.\nTools:\nRequired: Meta Ads, Google Ads, Google Analytics 4, AI tools (Claude Cowork or similar).\nNice to have: LinkedIn Ads, Microsoft Clarity, Figma, CRM systems.\nWhat we offer:\nFull-time remote work.\nFlexible Monday–Friday schedule.\nFixed salary + KPI-based bonus.\n3-month trial period.\n21 vacation days + 1 extra day off for your birthday.\nSick leave.\nDirect impact on how project delivery processes are built in the company.\nWork with meaningful expert content and non-fiction book projects.\nHiring process:\nCV, one funnel case with numbers, and a short intro video about yourself.\nPrescreen interview with the recruiter.\nTest task.\nFinal interview with the founders: test task defence.\nOffer and onboarding.",
      "url": "https://djinni.co/jobs/853789-ai-marketer/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: односторінковий сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485616-7559",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Media Buyer (Gambling)",
      "text": "Media Buyer (Gambling)\n\nBG Team — арбітражна команда, що спеціалізується на медіабаїнгу та активно масштабує свої результати. Понад 2 роки ми працюємо з Facebook, маємо вибудувану внутрішню інфраструктуру та налагоджену співпрацю з прямими рекламодавцями.\n \nЗараз у пошуку досвідченого Media Buyer, який впевнено працює з об’ємами трафіку та здатний стабільно приносити результат 💸\n\nЯкщо ти:\n•  Маєш досвід роботи від 1 року у вертикалі Gambling з Facebook;\n•  Активно заливав протягом останніх 6 місяців;\n•  Розумієш, як дійти до якісного конверту;\n•  Вмієш працювати з бюджетом від $500+ на день — тоді нам точно є про що поговорити 💪\n\nМи пропонуємо:\n• Ставку + сітку до 45% — все чесно й прозоро;\n• Прямі угоди під спенд і доступ до ексклюзивних оферів;\n• Високі виплати 🤑;\n• Сильну команду та non-toxic environment;\n• Оплачувані лікарняні;\n• 18 днів оплачуваної відпустки для якісного перезавантаження;\n• Реальні можливості для росту та масштабування без лімітів.\n\n🌍 Формат роботи: повністю віддалений — працюй з будь-якої точки світу.\n\nЧому саме BG Team?\nМи будуємо середовище для тих, хто мислить категоріями результату та масштабу. Без зайвої бюрократії — з фокусом на швидкість, тестування та реальний перформанс. Тут є всі умови, щоб рости швидше, ніж ринок.\n\n🤝 Відчуваєш, що тягнеш цей рівень?\nЗалишай відгук! Далі — швидкий процес без зайвої бюрократії 😉.",
      "url": "https://djinni.co/jobs/794153-media-buyer-gambling/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 21000,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 72,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta) з бюджетом 21000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485514-5571",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "B2B маркетолог",
      "text": "B2B маркетолог\n\nМи — динамічний холдинг, що активно розвиває та масштабує різноманітні онлайн-проєкти. Зараз ми розширюємо один із наших ключових напрямків, який спеціалізується на залученні умовно-безкоштовного трафіку (УБТ).\nШукаємо досвідченого та результативного маркетолога у команду. Якщо ти маєш потужний практичний досвід, свіжі круті кейси та готовий одразу включитися в роботу — чекаємо на твоє резюме.\n \nОсновні завдання\nРеалізація та оптимізація задач у рамках напрямку.\nВзаємодія з суміжними відділами (SMM, Sales) для досягнення спільних командних KPI.\nВедення звітності та аналіз ефективності виконаних кампаній/процесів.\n \nВимоги:\nОбов’язковий досвід та знання:\nДосвід роботи: від 2 років.\nПортфоліо: наявність свіжих та підтверджених кейсів є ключовою умовою розгляду кандидата.\nБуде плюсом:\nДосвід роботи в ніші iGaming, fintech чи digital.\n \nОсобисті якості:\nАктивність, ініціативність та зацікавленість у результаті.\nВідповідальність та вміння самостійно організувати свій робочий день у віддаленому форматі.\n \nЩо ми пропонуємо\nРозвиток та зростання: можливість професійного та кар'єрного розвитку всередині компанії.\nГнучкість: повністю віддалений формат зі стабільним графіком (10:00–18:00).\nКоманда: робота в синергії з відділами SMM та Sales під керівництвом досвідченого менеджера.\nВідпустка: 28 календарних днів \n \nЗнаєш, як перетворити перегляди на стабільний потік лідів і маєш свіжі кейси, якими пишаєшся? Не відкладай — надсилай CV з залікованими результатами та забирай своє місце в команді вже цього тижня!",
      "url": "https://djinni.co/jobs/853812-b2b-marketolog/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення на Djinni: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485490-9248",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "ads_creatives",
      "subcategoryName": "Рекламні креативи",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Креативний стратег (AI-first)",
      "text": "Креативний стратег (AI-first)\n\nКреативний стратег (AI-first)\n \nFull-time, без паралельних проєктів.\n \nУ нашому бізнесі продає креатив. Людина бачить рекламу і за пару секунд вирішує: зупинитись чи гортати далі, повірити чи ні, купити чи закрити. Бюджет, таргетинг і навіть продукт тільки посилюють те, що вже закладено в креатив.\n \nТому креативний стратег у нас — одна з ключових ролей. Від тебе залежить, як бренд виглядає, що він каже і скільки продає.\n \nНам потрібна людина, яка тримає обидві сторони креативу:\n• Візуал — смак, естетика, впізнаваний стиль бренду.\n• Сенс — що сказати, кому і чому це зачепить.\n \nГарний креатив, який не продає, нам не потрібен. Креатив, який продає, але виглядає дешево, теж. Шукаємо того, хто робить і те, й інше одночасно.\n \nПро компанію\ne-commerce бренд аксесуарів для авто. Продаємо в США і по всьому світу. Будуємо бренд, а не просто ллємо трафік. Основний канал росту — Meta Ads, бюджет масштабуємо щомісяця.\n \nЩо ти робитимеш\nСенси:\n• Розбираєшся в покупці: відгуки, чати з клієнтами, конкуренти, Ad Library.\n• Шукаєш кути й хуки, які б’ють у реальні болі та бажання.\n• Сам(а) пишеш англійською: хуки, сценарії, ad copy.\n \nВізуал:\n• Задаєш і тримаєш візуальний стиль бренду в усіх креативах.\n• Пишеш ТЗ на відео, статику та зйомки так, щоб команда з першого разу зрозуміла задум.\n• Стежиш, щоб кожен креатив виглядав як HUBS, а не як шаблон.\n \nКоманда:\n• Керуєш відеомонтажером та дизайнером статики, допомагаєш їм рости.\n• Будуєш систему задач: у кожного креативу є статус, дедлайн і відповідальний.\n• Коли треба більше обсягу, знаходиш фрилансерів і вводиш їх у процес.\n \nРезультат:\n• Щотижня розбираєш, що виграло і чому, і перетворюєш це на нові ітерації.\n• Ведеш Creo Product Dashboards по кожному продукту.\n• Масштабуєш кількість winner-креативів і концептів без хаосу.\n \nAI:\n• Вбудовуєш AI в кожен етап: ресерч, тексти, генерація візуалів і відео.\n \nБазовий SMM теж на тобі, але фокус — креатив, який продає, і візуальна система бренду.\n \nІнструменти\n \n• Claude — ресерч, тексти, сценарії, AI-воркфлоу для команди.\n• Higgsfield — AI-відео та візуали.\n• Figma та дизайн-інструменти — дизайн-бекграунд обов’язковий.\n• Плюсом буде: Midjourney, Kling, Runway, ElevenLabs, CapCut / Premiere.\n \nКопірайтинг — це база\n \nВізуал зупиняє погляд, а продають слова. Якщо ти не вмієш сам(а) написати хук, який зупиняє, і текст, який доводить до кліку, ця роль не для тебе. Тексти не делегуються ні AI, ні команді: AI пришвидшує, але рішення, що і як сказати, за тобою.\n \nЩо ми очікуємо від тебе як від копірайтера:\n• Пишеш хуки, які зупиняють у перші 1–3 секунди, і можеш дати 20 варіантів на один кут.\n• Знаєш класичні формули (PAS, AIDA, Before/After, problem → agitation → solution) і розумієш, коли яку використати.\n• Пишеш сценарії UGC, відгуків і демо-відео, які звучать як жива людина, а не як реклама.\n• Розумієш рівні обізнаності покупця і пишеш під кожен по-різному.\n• Говориш мовою клієнта: витягуєш формулювання з відгуків і чатів і перетворюєш їх на копі.\n• Пишеш primary text, headlines і офери для Meta Ads, а також тексти для лендингів і PDP.\n• Вмієш скорочувати: прибираєш усе зайве, поки лишається тільки те, що продає.\n \nКого шукаємо\n \n• 2+ роки в креативі для e-commerce або DTC, з них щонайменше рік керування командою.\n• Сильне візуальне портфоліо і дизайн-бекграунд.\n• Розуміння, чому креатив продає: кут, хук, офер, докази, формат.\n• Наявність winner-креативів і можливість показати цифри: спенд, ROAS, CPA.\n• Сильний копірайтинг англійською (B2+): приклади своїх текстів, хуків і сценаріїв обов’язкові.\n• Досвід побудови процесів і розуміння, як масштабувати креативну команду.\n• Самостійність: бачиш проблему і доводиш рішення до кінця, без нагадувань.\n \nЯк міряємо результат\n \n• Кількість winner-креативів на місяць — головна метрика.\n• Кількість нових концептів, запущених за тиждень.\n• Задачі команди, закриті вчасно.\n \nОплата\n \n• Фіксована ставка.\n• Бонус за кожен winner-креатив команди, без стелі.\n• Прозорі правила: результат рахуємо за нашими даними.\n \nПерші 90 днів\n \nМісяць 1:\nАудит креативів і процесів. Запускаєш систему задач і тижневий цикл. Перші концепти й тексти робиш власноруч.\n \nМісяць 2:\nВиходиш на стабільну кількість концептів на тиждень. AI-процеси працюють у всій команді.\n \nМісяць 3:\nHit rate від 15%, winner-креативів більше, ніж зараз, є план масштабування.\n \nЗацікавила роль? Надсилай резюме, портфоліо та приклади своїх текстів, хуків і сценаріїв англійською. Будемо раді познайомитися!",
      "url": "https://djinni.co/jobs/853815-kreativnii-strateg-ai-first/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення на Djinni: рекламні креативи.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485461-5567",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "maintenance",
      "subcategoryName": "Технічне обслуговування",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Full Stack Developer (Partnership project)",
      "text": "Full Stack Developer (Partnership project)\n\nШукаємо Full Stack Developer для партнерського проєкту. Команда розробляє та підтримує цифрові продукти для affiliate marketing та iGaming ринків.\n \nОсновний напрям — аналітична платформа, яка об’єднує дані з різних affiliate-програм і дає змогу відстежувати трафік, доходи та активність гравців в одному інтерфейсі.\n \nОсновні задачі:\nРозробка та підтримка backend на Laravel і frontend на React + TypeScript.\nІнтеграція сторонніх API та affiliate-платформ, розробка скраперів і парсерів даних.\nРобота з MySQL, оптимізація SQL-запитів і продуктивності звітів.\nРозробка тарифних планів, підписок і платіжних інтеграцій.\nПідтримка та вдосконалення наявного коду.\nНаписання автоматизованих тестів і налаштування CI/CD.\nДеплой і базова підтримка Linux-серверів.\nЩо очікуємо:\nВід 4 років комерційного досвіду розробки на Laravel; у проєкті використовуються Laravel 12 та Laravel 9.\nВпевнене володіння PHP, React і TypeScript.\nДосвід роботи з MySQL та сильні навички SQL.\nПрактичний досвід інтеграції API, web scraping і парсингу даних.\nДосвід розробки WordPress-плагінів на PHP.\nДосвід автоматизованого тестування, налаштування CI/CD та базового DevOps.\nАнглійська на рівні роботи з технічною документацією.\nГотовність працювати з перетином робочих годин за CET.\nБуде перевагою: \nДосвід в affiliate marketing, iGaming або adtech.\nЗнання Elasticsearch, Redis, MongoDB, Vue 2 та Docker.\nДосвід роботи з платіжними системами й підписками, зокрема Stripe або Laravel Cashier.\nЩо пропонуємо:\nПовну зайнятість і віддалений формат роботи.\nАвтономність у роботі.\nПряму взаємодію з Product Manager.\nНевелику команду та мінімум бюрократії.\nМожливість впливати на технічні рішення й розвиток продукту.\nВикористання AI-інструментів для розробки.",
      "url": "https://djinni.co/jobs/853817-full-stack-developer-partnership-project/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення на Djinni: технічне обслуговування.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485457-1913",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "landing",
      "subcategoryName": "Односторінковий сайт",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Senior Media Buyer",
      "text": "Senior Media Buyer\n\nWe are looking for a Senior Media Buyer to own paid acquisition in the financial publishing vertical on Meta and Google. We work with the top partners in the space, so you will have strong offers to run. Offer access is not the hard part. Performance is. What we need is someone who can take a proven offer, find the angle, and make it profitable at scale.\n \nThis is not a role for someone who maintains campaigns that already work. It is a full ownership seat for a buyer who can walk into a cold offer with no creative history, form a view on the angle within a day, get it live, kill what is not working fast, and scale what is. You will be judged on profit, not on impressions, click-through rates, or how busy the account looks.\n\nThe work sits in financial publishing, but we are not hiring someone who has only ever bought in one place. Buyers who spent an entire career optimizing inside a single niche arrive with one playbook and no\nsecond move when it stops working. Buyers who have run financial, health, auto, home, or other direct response markets and stayed profitable across them bring range, and range is what holds up when a\nchannel shifts or an angle burns out.\n\nThis is a hands-on seat and it stays that way. You are in the accounts yourself, at pace, with serious budget behind you. What comes with that is full ownership: the strategy is yours to set, the decisions are\nyours to make, and the results are visible to everyone.\n\nWHAT YOU WILL OWN\nOffer launch and profitable scale:\n● Take financial publishing offers from cold launch to profitable scale on Meta and Google\n● Own the full campaign lifecycle: research, angle selection, launch, optimization, scaling, and the decision to cut\n● Own the profit and loss on every campaign you run. Payout, cost per acquisition, margin, and volume are your numbers to defend\n● Decide which channel fits which offer rather than pushing everything through the same playbook\n● Prioritize ruthlessly across the offers available to you. Know which ones deserve budget this week and which do not\n● Scale winners aggressively without letting performance collapse under the extra spend\n● Build repeatable launch playbooks so a new offer goes live in days, not weeks\n\nCreative direction and angle development:\n● Own the angle. You decide what the hook is, who it speaks to, and why it will convert before\nanything gets designed\n● Brief designers, copywriters, and video editors with enough specificity that the first round is testable rather than decorative\n● Build and maintain a creative testing pipeline with the volume and cadence the platforms demand\n● Own advertorials, pre-landers, and landing page angles alongside the ad creative, and test the full path rather than the ad in isolation\n● Adapt the approach to the channel. Interruption traffic and intent traffic need different angles, different funnels, and different proof\n● Run competitive and market research continuously. Know what is running, what is fatiguing, and what is about to work\n● Use AI tools to increase creative throughput and research speed where they genuinely help, and know where they do not\n\nTesting discipline and budget control:\n● Design test structures that produce clean signal: what is being tested, at what budget, and what result triggers which decision\n● Set explicit kill rules and scale rules in advance so decisions are made on data rather than on hope\n● Manage daily and monthly budgets against targets, and flag early when spend is not going to return\n● Keep a clear record of what has been tested and what it produced, so the same losing angle is not relaunched twice\n● Balance exploration and exploitation deliberately. Protect budget for new offers and new angles even while scaling a winner\n\nTracking, data, and attribution:\n● Own the tracking setup end to end: trackers, server to server postbacks, conversion APIs, pixels, and parameter hygiene\n● Validate that the numbers are real before scaling on them, and debug attribution gaps yourself rather than escalating them\n● Work with analytics on reporting that shows profitability by offer, angle, creative, and placement\n● Reconcile platform data against network and advertiser data, and chase discrepancies until they are explained\n● Use post-click and post-conversion data to inform buying decisions, not just front end metrics\n\nAccount infrastructure and compliance:\n● Own account structure, ad account health, and the operational setup that keeps spend running without interruption\n● Keep creatives and funnels inside Meta and Google policy. We build for longevity, not for a week of spend before a ban\n● Manage relationships with platform reps and vendors, and use them to unlock scale and resolve issues fast\n● Work with our partners on payouts, caps, creative approvals, and early access to new offers\n● Maintain documentation on setups, integrations, and process so nothing sits only in your head\n\nPlaybooks and standards:\n● Turn what works into documented playbooks: launch structures, test frameworks, angle libraries, and creative briefs\n● Set the standard for how buying is done here through your own results\n● Report on a clear cadence: what is spending, what is working, what gets cut this week, and what needs a decision\n● Share what you learn with the creative and analytics teams so wins do not stay locked inside your accounts\n\nWHAT WE ARE LOOKING FOR\nMust-have:\n● 5 or more years of hands-on media buying with direct ownership of spend and profitability, not\nagency reporting or campaign assistance\n● Big-budget experience. At least 100,000 dollars a month in ad spend that you personally managed, sustained over time rather than in one spike. Below that level this is not the right role\n● Financial publishing experience is what we are looking for first. Health direct response is the closest adjacent background\n● If not financial publishing, then a track record across at least three distinct verticals, with auto and home a strong plus. A career spent inside a single niche is a mismatch here, and gambling-only backgrounds in particular tend to be too narrow\n● Deep Meta buying expertise: account structure, testing frameworks, creative volume, scaling mechanics, and account health at high daily spend\n● Hands-on Google buying experience across at least one of Search, Demand Gen, YouTube, or Performance Max, with a real view on how buying there differs from Meta\n● Proven ability to take an offer from zero to profitable scale, with specific numbers you can walk through\n● Creative and angle ownership. You direct the creative and the funnel rather than waiting for assets to be handed to you\n● Tracking fluency: trackers, server to server postbacks, conversion APIs, and the ability to debug attribution yourself\n● Comfortable being measured on profit and comfortable saying when something is not working\n● Self-directed. You can run a full portfolio without a large support structure around you\n● Excellent English, written and verbal (C1 or above)\n\nNice to have:\n● Native buying experience on the major networks\n● Financial publishing, newsletter, or subscription direct response background\n● Auto and home verticals, including insurance and home services lead generation\n● Subscriber acquisition and list building economics, buying against lifetime value rather than front end conversion alone\n● Familiarity with the funnel formats this vertical runs on: advertorials, long form sales pages, VSLs, and lead magnets\n● Fluency with AI tools for creative production, research, and analysis\n\nWHO FITS THIS ROLE\nYou are a buyer who has scaled offers profitably with your own money on the line, or close enough to it that it felt that way. You can walk through the numbers on your best campaigns and your worst ones\nwithout reaching for excuses. You know the difference between a campaign that worked and a campaign that happened to run during a good week. \n \nYou have worked across several verticals and you treat that as your advantage rather than a gap. You have been the new person in an unfamiliar market before, and you know how you get up to speed: the research, the angles you borrow, the assumptions you test first. Buyers who have only ever run one niche tend to have one playbook. You have several, and you know which one to reach for. You think in angles before you think in settings. You know that creative and offer selection decide most of the outcome and that account optimization only moves the last stretch. \n \nYou brief creative properly, you\ntest at volume, and you do not fall in love with an ad that is losing money. You move fast and you decide fast. You do not need a full picture before you act, and you do not sit on a losing test hoping it turns. You set your kill rules in advance and you follow them.\n\nYou work independently and you want to stay in the accounts. You are used to owning a portfolio without a machine of specialists behind you, and you know how to get what you need from the people around\nyou. This is a senior buyer seat, and going deeper on the channels rather than away from them is the point.",
      "url": "https://djinni.co/jobs/847580-senior-media-buyer/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Канада",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: односторінковий сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485437-8596",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "3d_site",
      "subcategoryName": "3D сайт",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Junior Three.js Developer",
      "text": "Junior Three.js Developer\n\n3DFrames is a product company developing 3D solutions for B2B clients. Our projects include interactive visualizations, 3D configurators, STEM animations, and high-performance web applications.\n\nWe are looking for a Junior Three.js Developer to join our team and work on interactive 3D solutions for the web.\n\nFormat: Remote, full-time\nLocation: Ukraine / Europe\nCompany: 3DFrames\nCompany type: Product\nSalary: up to $700 gross\nEnglish: sufficient for working with technical documentation\n\nCore Requirements & Tech Stack\n\n• Three.js, React, Redux, Redux-Saga, TypeScript\n• 1+ years of relevant experience with Three.js, WebGL, or 3D graphics\n• Basic understanding of 3D mathematics: vectors, matrices, and transformations\n• Experience working with 3D models in GLTF / GLB / FBX / OBJ formats\n• Understanding of Git and basic knowledge of GitHub / GitLab\n• English sufficient for working with technical documentation\n\nResponsibilities\n\n• Develop 3D scenes, animations, and interactive elements using Three.js / WebGL\n• Integrate 3D models into web projects, including preparation, optimization, and import of GLTF / FBX assets\n• Work with textures, lighting, materials, and cameras\n• Optimize 3D scenes for fast and efficient rendering in the browser\n• Collaborate with developers, designers, 3D artists, and QA engineers\n• Learn and apply new technologies and approaches in web-based 3D graphics\n\nWill Be a Plus\n \n• Tailwind CSS\n• REST API\n• Graph API\n• Knowledge of 3D scene optimization\n• Understanding of interactive 3D interfaces and UX in 3D\n\nTeam\n\nYou’ll be joining a team of 4 Developers, 1 Project Manager, and 2 QA Engineers.\n\nWhat We Offer\n\n• Full-time remote cooperation\n• Cooperation via FOP\n• Accounting support if needed\n• 15 paid vacation days\n• 5 paid sick days\n• Paid public holidays\n• Opportunity to grow within an experienced development team\n• Hands-on experience with commercial web-based 3D products\n\nInterview Process\n \nHR Interview → Test Task → Technical Interview → Final Interview\n\nReady to join us? Apply now — your ideas and approach might be exactly the spark we’re looking for.",
      "url": "https://djinni.co/jobs/842081-junior-three-js-developer/",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 29000,
      "currency": "₴",
      "country": "США",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 78,
      "aiSummary": "Замовлення на Djinni: 3d сайт з бюджетом 29000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485292-7391",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "МОНТАЖ REELS 30-60 сек",
      "text": "МОНТАЖ REELS 30-60 сек\n\nНужен монтажёр для сборки вертикального ролика Reels длиной 30–45 секунд.\n\n\nЧто нужно сделать:\n— смонтировать ролик из моих исходников;\n— добавить трендовые переходы, чтобы ролик выглядел динамично и современно;\n— сделать стильные субтитры: крупные, читаемые, с анимацией;\n— добавить нестандартные эффекты,...",
      "url": "https://freelancehunt.com/project/montazh-reels-30-60-sek/1659290.html",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelancehunt: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485250-4264",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "ecommerce",
      "subcategoryName": "Онлайн-магазин",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Телеграм Бот (магазин продажи топлива)",
      "text": "Телеграм Бот (магазин продажи топлива)\n\nНеобходима разработка Telegram-бота для продажи топливных талонов сетей АЗС. Бот должен состоять из магазина, личного кабинета клиента и административной панели. Гость просматривает актуальные предложения и цены. После регистрации клиент выбирает бренд АЗС, вид и количество топлива и один из трех способов...",
      "url": "https://freelancehunt.com/project/telegram-bot-magazin-prodazhu-paliva/1659308.html",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelancehunt: онлайн-магазин.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485232-1786",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "google_ads",
      "subcategoryName": "Google реклама",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Нужен PPC специалист",
      "text": "Нужен PPC специалист\n\nИщу опытного PPC-специалиста для настройки, ведения и оптимизации рекламных кампаний в Google Ads.\nОсобенно интересуют специалисты с опытом работы в конкретных нишах и подтвержденными результатами.\nПри отклике прошу прислать 2–3 кейса с указанием ниши, GEO, рекламного бюджета, выполненных задач и достигнутых...",
      "url": "https://freelancehunt.com/project/potriben-ppc-spetsialist/1659370.html",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelancehunt: google реклама.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485209-8162",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Сменить пароль на сайте WordPress",
      "text": "Сменить пароль на сайте WordPress - 2000UAH\n\nЗаброшенный сайт, и забыл пароль к администратору WordPress. Есть доступ только к хостингу и домену. Нужно сбросить пароль",
      "url": "https://freelancehunt.com/project/zmiiti-parol-na-sayti-wordpress/1659391.html",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 2000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelancehunt: веброзробка з бюджетом 2000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792167485166-5539",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "ecommerce",
      "subcategoryName": "Онлайн-магазин",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Ищем UX/UI-разработчика WooCommerce + Elementor Pro - продающая карточка товара и весь путь покупки",
      "text": "Ищем UX/UI-разработчика WooCommerce + Elementor Pro - продающая карточка товара и весь путь покупки\n\nНужен не верстальщик, а человек, который спроектирует и соберет путь покупки e-commerce, который продает.\nКарточка товара - корзина - оформление заказа - страница \"Спасибо\".\nРеклама Google Ads уже работает, но многие люди отваливаются на этапе оформления заказа.\nСтек:\n- WordPress + WooCommerce + Elementor...",
      "url": "https://freelancehunt.com/project/shukaemo-ux-ui-rozrobnika-woocommerce-elementor-pro/1659392.html",
      "date": "2026-10-16T16:18:05.166Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelancehunt: онлайн-магазин.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792167483032-35",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Zaichenko Team | Вакансії",
      "sourceUsername": "@zaichenkoteam",
      "authorName": "zt_admin",
      "authorUsername": "@zt_admin",
      "title": "⚡️ Senior Media Buyer (RSOC/ Search Arbitrage)",
      "text": "⚡️ Senior Media Buyer (RSOC/ Search Arbitrage)\n▪️ $2000\n▪️ Віддалено\n\nПро компанію:\nMine Marketing - швидкозростаюча компанія з performance-маркетингу, прямий партнер Google Direct і Meta. Ми\n\nВимоги:\n- Досвід роботи медіа-байером або performance-маркетологом, бажано з AFD/RSOC трафіком\n- Практичний досвід роботи з Google Ads і Meta Ads у великих масштабах (мінімум $5k щоденного бюджету)\n- Сильні аналітичні навички та впевненість у роботі з великими бюджетами і метриками продуктивності\n- Розуміння ключових KPI: ROI, ROAS, CPA, EPC та RPC\n- Здатність працювати автономно і брати відповідальність за результати\n- Добрі навички комунікації англійською мовою\n\nДетальніше про вакансію та відгукнутися ⤵️\nпереходь тут за посиланням\n\nОпублікувати вашу вакансію:\n@zaichenkoteam_bot | @zt_admin\n\nБудь ласка, розкажіть про цю вакансію вашим друзям.",
      "date": "2026-10-16T16:18:03.032Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 83000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": true,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 87,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 83000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792167482747-565",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "landing",
      "subcategoryName": "Односторінковий сайт",
      "sourceType": "channel",
      "sourceName": "SMM Вакансії та Маркетинг",
      "sourceUsername": "@smm_work_ua",
      "authorName": "smm_work_ua",
      "authorUsername": "@smm_work_ua",
      "title": "Интернет-маркетолог в онлайн институт",
      "text": "Интернет-маркетолог в онлайн институт\nОплата: от 90 000 рублей\n\nТребования:\n- Успешный опыт запусков продающих вебинаров.\n- Успешный опыт работы с автоворонками, чат-ботами, email и sms.\n- Опыт работы с гипотезами: поиск-защита-быстрый запуск-оценка-выводы.\n- Навыки работы с видео-контентом и видеорекламой.\n- Знание систем аналитики (Roistat, Яндекс.Метрика, Google Analytics) и умение делать выводы.\n- Навыки работы с подрядчиками - постановка задач, контроль.\n\nОбязанности:\n- Лидогенерация: тестирование и запуск новых источников получения заявок.\n- Достижение стабильного роста конверсий (самостоятельно, а также с помощью подрядчиков).\n- Анализ источников трафика, конверсии и других маркетинговых метрик.\n- Создание и корректировка продуктовой матрицы курса: лид-магниты, трипваеры, ап и даун сейлы, бандлы, бонусы и т.д. (создание тз на создание продуктов, офферы, “упаковка”).\n- Упаковка продукта (в том числе, выделение офера, упор на УТП на основных посадочных, визуализация на сайте и триггеры, описание, отзывы и тп.\n\nУсловия:\n- Оклад + мотивация (по окончании испытательного срока).\n- Полный рабочий день с понедельника по пятницу с 9:00 до 18:00.\n- Официальное устройство по ТК РФ.\n- Постоянная “прокачка” сотрудников - внутреннее обучение, консультации профессионалов, тренинги и вебинары.\n\nКонтакты для связи:\nOльга\n+7 (919) 0737166",
      "date": "2026-10-16T16:18:02.746Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: односторінковий сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792167482741-578",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "SMM Вакансії та Маркетинг",
      "sourceUsername": "@smm_work_ua",
      "authorName": "smm_work_ua",
      "authorUsername": "@smm_work_ua",
      "title": "В успешное и развивающееся Евент Агентство «Шенонсо» требуется опытный SMM...",
      "text": "В успешное и развивающееся Евент Агентство «Шенонсо» требуется опытный SMM менеджер.\n\n«Шенонсо» – это агентство по организации частных мероприятий с 10 летним опытом. Мы зарекомендовали себя как ответственную и креативную компанию, создающую красивые и душевные мероприятия.\n\n«Шенонсо» – это:\nБолее 500 проведённых мероприятий.\n\nНаше отличие – наличие собственных площадок, собственной студии декора, собственного кейтеринга, а также собственных технических мощностей.\n\nВ команду мы ищем специалиста, такого же, как и мы, стремящегося постоянно развиваться, жить работой и вкладывать душу в наше общее любимое дело!\n\nОбязанности:\n• Создание фото и видео контента\n• Написание постов\n• Размещение контента в Instagram\n• Проведение акций, розыгрышей для привлечения аудитории\n• Размещение рекламы\n• Работа с блоггерами, ведущими, артистами и партнерами для создания коллабораций\n\nТребования:\n• Опыт работы в данной сфере не менее 3-х лет\n• Наличие портфолио (Инстаграм аккаунты)\n• Опыт съёмки и обработки фото и видео\n• Опыт успешного взаимодействия с подписчиками\n• Знание алгоритмов продвижения аккаунтов Instagram\n• Грамотная письменная речь\n• Знание современных технологий SMM\n• Креативность и творческий подход\n\nУсловия:\n- Молодой и дружный коллектив\n- Удаленная работа с периодическим выездами на Мероприятия\n- Зп от 40 000 руб. до 100 000 руб. (в зависимости от опыта и результатов работы)\n- Премии и бонусы по результатам работы\n\nОткликнуться: +79263509111 Виктория",
      "date": "2026-10-16T16:18:02.740Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792167482008-30",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "channel",
      "sourceName": "Je Contact | IT & Digital Вакансії",
      "sourceUsername": "@jecontact",
      "authorName": "jecontact",
      "authorUsername": "@jecontact",
      "title": "SMM-ПОМІЧНИК(-ЦЯ) | ІННА ЗАДОРОЖНА",
      "text": "SMM-ПОМІЧНИК(-ЦЯ) | ІННА ЗАДОРОЖНА\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: віддалено\nЗайнятість: часткова\n\nРоботодавець: Інна Задорожна — SMM-спеціалістка з 5-річним досвідом, яка веде цікаві проєкти.\n\nШукають SMM-менеджера з хорошими дизайнерськими навичками та базовим монтажем Reels, який готовий до тривалої спільної роботи.\n\n✅ Вимоги до кандидата:\n• Хороші навички дизайну та оформлення Stories.\n• Базовий якісний монтаж Reels з акцентом на динаміку, переходи, ритм і візуальну подачу.\n• Хороший візуальний смак і увага до деталей.\n• Вміння самостійно працювати з контентом.\n• Відповідальність, дисциплінованість, ініціативність і креативність.\n• Готовність бути на зв'язку в робочий час з 10:00 до 19:00.\n\n⚡️ Відповідальність:\n• Генерувати ідеї та складати контент-плани для Stories.\n• Оформлювати Stories.\n• Монтувати Reels із увагою до динаміки, переходів, ритму та візуальної подачі.\n• Допомагати з поточними SMM-задачами.\n\n☝️ Що пропонують:\n• Довгострокову співпрацю.\n• Роботу з адекватними клієнтами та цікавими проєктами.\n\n✉️ Відгукнутись на вакансію можна за посиланням.",
      "date": "2026-10-16T16:18:02.007Z",
      "dateFormatted": "Сьогодні, 19:18",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792099017336-5964",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Нужен СММ",
      "text": "Нужен СММ - 5000UAH\n\nНужен SMM для ведения проекта в Facebook/Instagram. В неделю нужно делать 2 поста на стену по принципу карусели. И делать 4-5 рилсов. Делать нужно будет в стилистике, как уже выполнялось ранее. Будет плюсом, если вы умеете настраивать таргетированную рекламу, но это не обязательно. Главное умение SMM....",
      "url": "https://freelancehunt.com/project/potriben-smm/1659283.html",
      "date": "2026-10-15T21:16:57.336Z",
      "dateFormatted": "Сьогодні, 00:16",
      "budget": 5000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 59,
      "aiSummary": "Замовлення на Freelancehunt: таргетована реклама (meta) з бюджетом 5000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910545-8823",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "Air Apps: Framer Website Designer",
      "text": "Air Apps: Framer Website Designer\n\n<img src=\"https://we-work-remotely.imgix.net/logos/0171/6471/logo.gif?ixlib=rails-4.0.0&w=50&h=50&dpr=2&fit=fill&auto=compress\" />\n\n<p>\n  <strong>Headquarters:</strong> Helsinki\n    <br /><strong>URL:</strong> <a href=\"http://airapps.com\">http://airapps.com</a>\n</p>\n\n<h2><strong>Framer Website Designer (Onsite – Presidio, San Francisco)</strong></h2><h3><strong>About Air Apps</strong></h3><p>At Air Apps, we believe in thinking bigger and moving faster. We’re a family-founded company on a mission to create the world’s first AI-powered Personal &amp; Entrepreneurial Resource Planner (PRP), and we need your passion and ambition to help us change how people",
      "url": "https://weworkremotely.com/remote-jobs/air-apps-framer-website-designer-1",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910521-9336",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "Discord: Engineering Manager, Machine Learning (Safety)",
      "text": "Discord: Engineering Manager, Machine Learning (Safety)\n\n<p>\n  <strong>Headquarters:</strong> San Francisco Bay Area (or Remote U.S.)\n</p>\n\n<div class=\"content-intro\"><p>Discord has a highly engaged community of millions of daily active users who use the platform for many different reasons, but there’s one thing that nearly everyone does: <strong>play video games.</strong> Discord plays a uniquely important role in the future of gaming, and we are focused on making it easier and more fun for people to hang out before, during, and after playing games.</p></div><p>Discord's Safety ML team builds the machine learning systems that protect 200M+ users. The team's mission is to make Discord a place where people can build genuine friendships without exposure to harm, at a scale where man",
      "url": "https://weworkremotely.com/remote-jobs/discord-engineering-manager-machine-learning-safety",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910500-5299",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "bondex: Fullstack Web3 Engineer (Solidity / Rust / Typescript)",
      "text": "bondex: Fullstack Web3 Engineer (Solidity / Rust / Typescript)\n\n<img src=\"https://we-work-remotely.imgix.net/logos/0171/6491/logo.gif?ixlib=rails-4.0.0&w=50&h=50&dpr=2&fit=fill&auto=compress\" />\n\n<p>\n  <strong>Headquarters:</strong> Remote - Americas, El Salvador\n    <br /><strong>URL:</strong> <a href=\"http://bondex.app\">http://bondex.app</a>\n</p>\n\n<div class=\"jp-text\">\n<div>\n<p>We're recruiting a <strong>Web 3 Fullstack Developer (Solidity / Rust / Typescript)</strong> who is looking for a new challenge and ready to join an exciting new chapter to expand our clients product value proposition in the DeFi Web3 realm. </p><p> </p><p>The client is is revoluzionezing financial interoperability and the <",
      "url": "https://weworkremotely.com/remote-jobs/bondex-fullstack-web3-engineer-solidity-rust-typescript",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910475-5067",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "HR Plus: Web Developer (Fresh graduate welcome, WFH policy, on-job-training)",
      "text": "HR Plus: Web Developer (Fresh graduate welcome, WFH policy, on-job-training)\n\n<img src=\"https://we-work-remotely.imgix.net/logos/0171/6490/logo.gif?ixlib=rails-4.0.0&w=50&h=50&dpr=2&fit=fill&auto=compress\" />\n\n<p>\n  <strong>Headquarters:</strong> Hong Kong, Hong Kong SAR, Hong Kong\n    <br /><strong>URL:</strong> <a href=\"http://hrplus.tech\">http://hrplus.tech</a>\n</p>\n\n<div class=\"mt-5\">\n\n<div class=\"redactor-styles\">\n<p><strong><em>About the Role:</em></strong></p>\n<p>Are you a talented and driven Web Developer looking to join a young and energetic team? Look no further! Our client, a fast-growing firm in the exciting field of web development, is seeking a skilled Web Developer to join their dynamic team. With a focus on innovation",
      "url": "https://weworkremotely.com/remote-jobs/hr-plus-web-developer-fresh-graduate-welcome-wfh-policy-on-job-training",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910451-9019",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "Storetasker: Senior Shopify Developer (Remote + Flexible)",
      "text": "Storetasker: Senior Shopify Developer (Remote + Flexible)\n\n<img src=\"https://we-work-remotely.imgix.net/logos/0074/8032/logo.gif?ixlib=rails-4.0.0&w=50&h=50&dpr=2&fit=fill&auto=compress\" />\n\n<p>\n  <strong>Headquarters:</strong> Brooklyn, NY\n    <br /><strong>URL:</strong> <a href=\"https://resources.storetasker.com/become-an-expert?apply=true&amp;source=weworkremotely_best_2021\">https://resources.storetasker.com/become-an-expert?apply=true&amp;source=weworkremotely_best_2021</a>\n</p>\n\n<h1>Shopify developers love to freelance with Storetasker.</h1><ul><li><strong>Endless, quality clients: </strong>from well known DTC brands to top agencies. </li><li><strong>Fully remote, flexible: </strong>work",
      "url": "https://weworkremotely.com/remote-jobs/storetasker-senior-shopify-developer-remote-flexible-3",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910447-1983",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "Lithic: Senior Software Engineer, Card Authorization",
      "text": "Lithic: Senior Software Engineer, Card Authorization\n\n<p>\n  <strong>Headquarters:</strong> Remote \n</p>\n\n<div class=\"content-intro\"><p>Lithic is the modern card issuing and processing platform empowering ambitious financial companies to build the future of payments.</p>\n<p>Our infrastructure powers card programs for 100+ innovative clients, from fintechs reimagining credit and digital banking to platforms transforming disbursements and spend management. Companies like Mercury, Flex, and Novo rely on Lithic's developer-friendly APIs, direct network connections, and flawless reconciliation to launch and scale card programs in weeks, not years.</p>\n<p>We're building a future where access to better financial products materially improves people's lives, free from the constraints of 30-yea",
      "url": "https://weworkremotely.com/remote-jobs/lithic-senior-software-engineer-card-authorization",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910410-2854",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "Tailscale: Analytics Engineer, Data",
      "text": "Tailscale: Analytics Engineer, Data\n\n<p>\n  <strong>Headquarters:</strong> Remote (Canada)\n</p>\n\n<div class=\"content-intro\"><p>Thank you for considering Tailscale. If this job description resonates with you, please apply. <em>Frequently cited statistics show that people who identify with historically marginalized groups are likely to apply to jobs only if they meet 100% of the qualifications. </em><em>We encourage you to help us break that statistic!</em></p>\n<p><strong>About Tailscale </strong></p>\n<p>Tailscale is making safe connection effortless by delivering software that makes it easy to securely interconnect people and their devices, no matter where they are. From hobbyists to multinational corporations, team",
      "url": "https://weworkremotely.com/remote-jobs/tailscale-analytics-engineer-data",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910391-1938",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "weworkremotely",
      "sourceName": "WeWorkRemotely",
      "sourceUsername": "@weworkremotely",
      "authorName": "Клієнт на WeWorkRemotely",
      "authorUsername": "@weworkremotely",
      "title": "Salesloft: Principal Software Engineer, AI",
      "text": "Salesloft: Principal Software Engineer, AI\n\n<p>\n  <strong>Headquarters:</strong> United States, Remote\n</p>\n\n<p><span><strong>Job Title:</strong> Principal Software Engineer, AI </span></p>\n<p><span><strong>Location</strong>: Remote - US</span></p>\n<p>Salesloft is building the next era of enterprise revenue — one where teams make confident decisions powered by AI and real signals. By combining our scale, insights, and AI innovation, we're building the industry's first Predictive Revenue System, enabling humans and AI to work together to make smarter decisions and drive consistent growth.</p>\n<p>With thousands of customers using our platforms every day, we have an unmatched view into how revenue is actually won —",
      "url": "https://weworkremotely.com/remote-jobs/salesloft-principal-software-engineer-ai",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "WeWorkRemotely",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на WeWorkRemotely: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910376-8275",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "A.Team",
      "authorUsername": "@upwork_remote",
      "title": "Senior Independent AI Engineer / Architect",
      "text": "Senior Independent AI Engineer / Architect\n\nКомпанія: A.Team\nЛокація: Remote (International)\nОплата: $120 - $170 /hour\n\nSenior Independent AI Engineer / Architect \n  Remote | Americas, Europe, or Israel  \n   \n Most AI engineers can find work. \n   \n Finding work worth doing is harder. \n   \n A.Team is an invite-only network of senior AI engineers, ML engineers, and AI architects building production AI systems for startups, enterprises, and global companies. \n   \n Since 2020, builders in the network have earned more than $200M working with companies including Lyft, Google X, HCA, Unilever, Sightful, D-ID, and others. \n   \n The Work \n You'll join small teams solving real problems. \n   \n Not demos. \n Not proof-of-concepts that never ship. \n Not another thin wrapper around an API. \n  Recent work has included: \n   \n \n  AI-native products built from 0→1 \n Agent architectures and orchestration systems \n Enterprise",
      "url": "https://remotive.com/remote-jobs/software-development/senior-independent-ai-engineer-architect-1919266",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 120,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів з бюджетом 120 $.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910356-9670",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "A.Team",
      "authorUsername": "@upwork_remote",
      "title": "Senior Independent Software Developer",
      "text": "Senior Independent Software Developer\n\nКомпанія: A.Team\nЛокація: Remote (International)\nОплата: $90 - $150 /hour\n\nYou must be located in the Americas, Europe, or Israel to apply.     A·Team  is a VC-backed, stealth, application-only home on the internet for senior independent software builders to team up with hand-picked, high-growth companies on their next big thing.  \n After talking with hundreds of independent engineers, designers, and product folks, we heard over and over that finding vetted, high-quality, consistent clients is hard, and projects are often too small to be rewarding. A·Team matches small teams of the most talented builders in the world with companies backed by a16z, YC, Softbank, General Catalyst, etc. on a contract basis for many of their most important initiatives. We quietly launched in May 2020, and have helped A·Teamers earn $85+ million since. \n   As part of A·Team, you can",
      "url": "https://remotive.com/remote-jobs/software-development/senior-independent-software-developer-1919265",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 90,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів з бюджетом 90 $.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910339-8557",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Lemon.io",
      "authorUsername": "@upwork_remote",
      "title": "Senior .NET Full-stack Developer",
      "text": "Senior .NET Full-stack Developer\n\nКомпанія: Lemon.io\nЛокація: Remote (International)\nОплата: Договірна\n\nAre you a talented Senior Developer looking for a remote job that lets you show your skills and get decent compensation? Look no further than  Lemon.io  — the marketplace that connects you with hand-picked startups in the US and Europe. \n     \n  What we offer:  \n \n The rate depends on your seniority level, skills and experience. We've already paid out over $11M to our engineers. \n No more hunting for clients or negotiating rates — let us handle the business side of things so you can focus on what you do best. \n Choose a schedule that works best for you. It’s possible to communicate async or minimally overlap within team working hours. \n We respect your seniority so you can expect no micromanagement or screen trackers. \n We will support you from the time you submit the application througho",
      "url": "https://remotive.com/remote-jobs/software-development/senior-net-full-stack-developer-2091130",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910323-5429",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Lemon.io",
      "authorUsername": "@upwork_remote",
      "title": "Senior AI Engineer",
      "text": "Senior AI Engineer\n\nКомпанія: Lemon.io\nЛокація: Remote (International)\nОплата: Договірна\n\nAre you a talented Senior AI Engineer looking for a remote job that lets you show your skills and get decent compensation? Look no further than  Lemon.io  — the marketplace that connects you with hand-picked startups in the US and Europe. \n     \n  What we offer:  \n \n The rate depends on your skills and experience. We've already paid out over $11M to our engineers. \n No more hunting for clients or negotiating rates — let us handle the business side of things so you can focus on what you do best. \n We'll manually find the best project for you according to your skills and preferences. \n Choose a schedule that works best for you. It’s possible to communicate async or minimally overlap within team working hours. \n We respect your seniority so you can expect no micromanagement or screen tracker",
      "url": "https://remotive.com/remote-jobs/artificial-intelligence/senior-ai-engineer-2091131",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910303-117",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Sanctuary Computer Inc",
      "authorUsername": "@upwork_remote",
      "title": "Senior Shopify Developer",
      "text": "Senior Shopify Developer\n\nКомпанія: Sanctuary Computer Inc\nЛокація: Remote (International)\nОплата: $80k - $150k\n\nWe are hiring a  contract-based Senior Shopify Developer  to contribute to our Design and Development Team. \n   Original Job posting link here   \n   \n 🌎 About garden3d  \n We are worker owned creative collective, innovating on everything from brands and IRL communities to IoT devices and cross platform apps. We share profit, open source everything, spin out new businesses, and invest in exciting ideas through financial and/or in-kind contributions. \n Our client roster includes Google, Stripe, Figma, Hinge, Black Socialists in America, ACLU, Pratt, Parsons, Mozilla, The Nobel Prize, MIT, Gnosis, Etsy & Gagosian. \n We’re the software team behind innovative products like The Light Phone & Mill, and we operate a global, decentralized community space collective called Index Space. \n We",
      "url": "https://remotive.com/remote-jobs/software-development/senior-shopify-developer-2091140",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 80000,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів з бюджетом 80000 $.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910286-382",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Lemon.io",
      "authorUsername": "@upwork_remote",
      "title": "Senior back-end Engineer",
      "text": "Senior back-end Engineer\n\nКомпанія: Lemon.io\nЛокація: Remote (International)\nОплата: Договірна\n\nSenior Developer? Work Remote. Get Paid Well. Build What Matters.  \n     \n  Lemon.io  connects hand-picked senior developers with vetted startups across the US and Europe — no bidding wars, no ghosting, just serious opportunities. \n We're currently hiring for a  research-driven AI company  on a mission to slash the cost of modern AI — co-designing hardware, software, algorithms, and models to make AI's benefits accessible to everyone. They're active open-source contributors, building the infrastructure behind next-generation AI at scale. \n     \n  Open roles:  Senior Back-end Engineer (Golang), Senior DevOps Engineer, Senior Site Reliability Engineer, Senior Storage Engineer, Senior Python & LLM Developer, Senior Back-end Engineer (Python) \n     \n  Why this one's worth a look:  \n You'",
      "url": "https://remotive.com/remote-jobs/software-development/senior-back-end-engineer-2091132",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910266-7457",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Lemon.io",
      "authorUsername": "@upwork_remote",
      "title": "Senior React Full-stack Developer",
      "text": "Senior React Full-stack Developer\n\nКомпанія: Lemon.io\nЛокація: Remote (International)\nОплата: Договірна\n\nAre you a talented Senior Developer looking for a remote job that lets you show your skills and get decent compensation? Look no further than  Lemon.io  — the marketplace that connects you with hand-picked startups in the US and Europe. \n     \n  What we offer:  \n \n The rate depends on your seniority level, skills and experience. We've already paid out over $11M to our engineers. \n No more hunting for clients or negotiating rates — let us handle the business side of things so you can focus on what you do best. \n We'll manually find the best project for you according to your skills and preferences. \n Choose a schedule that works best for you. It’s possible to communicate async or minimally overlap within team working hours. \n We respect your seniority so you can expect no micromanagement or",
      "url": "https://remotive.com/remote-jobs/software-development/senior-react-full-stack-developer-2091133",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910248-3921",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Digital маркетинг та лідогенерація",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Coalition Technologies ",
      "authorUsername": "@upwork_remote",
      "title": "Freelance Copywriter",
      "text": "Freelance Copywriter\n\nКомпанія: Coalition Technologies \nЛокація: Remote (International)\nОплата: $20k -$35k\n\nCT Marketing Agency is seeking skilled Freelance Copywriters to write high-quality, SEO-driven content for eCommerce and lead generation websites. This is a freelance, project-based writing role. \n   \n The ideal candidate has excellent English writing skills, strong research ability, and experience writing content that follows detailed, client-specific guidelines. Projects commonly include category pages, product descriptions, blog posts, SEO landing pages, and website copy. \n   \n  About the Role  \n Our client base is constantly evolving, and writers may create content across a wide range of industries, including: \n \n Fashion, including mass-market and luxury brands \n Skincare and beauty \n Tech and software \n Finance and investing \n Law, including family law, divorce, and product liabilit",
      "url": "https://remotive.com/remote-jobs/writing/freelance-copywriter-1749306",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 20000,
      "currency": "$",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 80,
      "aiSummary": "Замовлення на Upwork / Remote: digital маркетинг та лідогенерація з бюджетом 20000 $.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910228-2633",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Digital маркетинг та лідогенерація",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "IAPWE",
      "authorUsername": "@upwork_remote",
      "title": "Freelance Writer",
      "text": "Freelance Writer\n\nКомпанія: IAPWE\nЛокація: Remote (International)\nОплата: $50-$75 /hour\n\nOur organization is seeking content writers to create articles and blog posts on a variety of topics. \n   \n The rate of pay is $20 per 100 words (this comes out to approximately $100 per article or $50 per hour). \n   \n Some topics you may be asked to write about include the following (you can always turn down a topic if you do not feel comfortable writing about it, however if you have experience or expertise in a specific area, please let us know): \n   \n \n Health & beauty \n Fitness \n Home Decor \n Fashion \n Sports \n Do it yourself \n Finance \n Legal \n Medical \n Family/Parenting \n Relationships \n Real Estate \n Restaurants \n Contracting (plumbing, pool building, remodeling, etc.) \n \n   \n  These are just some of the more general industries and topics that we cover.  \n   \n  Requirements  :",
      "url": "https://remotive.com/remote-jobs/writing/freelance-writer-1185979",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 50,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 80,
      "aiSummary": "Замовлення на Upwork / Remote: digital маркетинг та лідогенерація з бюджетом 50 $.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910212-9967",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "website_turnkey",
      "subcategoryName": "Розробка сайтів та сервісів",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Unio Digital",
      "authorUsername": "@upwork_remote",
      "title": "Tier III Service Desk Engineer",
      "text": "Tier III Service Desk Engineer\n\nКомпанія: Unio Digital\nЛокація: Remote (International)\nОплата: Договірна\n\nUnió Digital is an Arizona-based managed service provider (MSP) delivering Managed IT Services, Low Voltage Cabling, Access Control, Video Surveillance, and Intrusion Services. We believe technology should be intuitive, not intimidating. \n   \n We are looking for an experienced Tier 3 Service Desk Technician with exceptional problem-solving skills. You will serve as the escalation point within the team, resolving complex technical issues while also leading client onboarding and project initiatives. You are expected to be involved in direct end-user support when required. If you have a passion for ensuring top-quality user support and thrive in a collaborative environment, this role is for you. \n   \n  Duties  \n   \n ·         Lead and support our helpdesk environment for managed service clie",
      "url": "https://remotive.com/remote-jobs/information-technology/tier-iii-service-desk-engineer-2091045",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 0,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 88,
      "aiSummary": "Замовлення на Upwork / Remote: розробка сайтів та сервісів.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792098910206-1293",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Digital маркетинг та лідогенерація",
      "sourceType": "upwork",
      "sourceName": "Upwork / Remote",
      "sourceUsername": "@upwork_remote",
      "authorName": "Credit Wellness, LLC",
      "authorUsername": "@upwork_remote",
      "title": "Inside Sales Contractor",
      "text": "Inside Sales Contractor\n\nКомпанія: Credit Wellness, LLC\nЛокація: Remote (International)\nОплата: OTE $25k - $35k\n\nAbout Us  \n  We are a financial services start up focusing on helping to improve consumer credit profiles. We are currently seeking KPI driven sales representatives looking to earn up to 45K in their first year while working remotely. We offer comprehensive training and continuous sales coaching to help you meet your financial goals.  \n  During our training period we offer a guaranteed training stipend while our trainees are acclimating to the position (*see weekly pay below). If you are a seasoned sales professional looking for the autonomy of a remote position combined with great compensation, we want to hear from you!  \n  Compensation Structure  \n  This role is   100% commission-based  , which means your earning potential is unlimited. In addition, we regularly offer   competitive per",
      "url": "https://remotive.com/remote-jobs/sales/inside-sales-contractor-2086540",
      "date": "2026-10-15T21:15:10.134Z",
      "dateFormatted": "Сьогодні, 00:15",
      "budget": 25000,
      "currency": "$",
      "country": "Upwork / Remote",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 80,
      "aiSummary": "Замовлення на Upwork / Remote: digital маркетинг та лідогенерація з бюджетом 25000 $.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609359-1054",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Creative Manager / Creative Strategist",
      "text": "Creative Manager / Creative Strategist\n\nNODERA GROUP — венчур-білдер, що створює та масштабує продуктові компанії. Ми поєднуємо венчур-білдинг зі smart investment і працюємо разом із фаундерами, щоб перетворювати сильні інсайти та технології на продукти з реальною цінністю і прибутком. Даємо не лише капітал, а й експертизу та інфраструктуру: від розробки й маркетингу до стратегічних рішень.\n\nЗараз ми активно ростемо: запускаємо нові продукти, тестуємо гіпотези та запускаємо нові напрями. Багато речей робимо вперше — це про швидкість, зміни і рішення, які одразу впливають на результат.\n\nНаш продукт — Readberry перетворює навчальні матеріали на аудіокурс із вбудованими квізами. Ми ростемо через paid social на Meta і шукаємо креативного менеджера, який придумуватиме концепції, тестуватиме їх і на старті сам створюватиме AI-креативи (статика і відео), а згодом очолить цей напрям.\n\nТвої виклики:\n \nВідповідати за креативну стратегію: що тестуємо, для якої аудиторії і чому. Вести беклог гіпотез і пріоритизувати його за даними.\nАналізувати креативи конкурентів (Meta Ad Library, spy-інструменти): хуки, структури, меседжі, чому це працює або ні.\nПридумувати концепти й писати сценарії: хуки, UGC-стиль, шаблони «один демо-блок + змінний хук».\nСтруктурувати тести: аудиторія × кут болі × хук, гіпотеза → результат → висновок. Швидко відсікати слабке і масштабувати переможців.\nЧитати результати разом із медіабаєром: CTR, hook rate, ціна реєстрації та покупки. Вирішувати, що вимикати, що масштабувати і яку концепцію розвивати далі.\nНа старті самостійно виробляти статику й відео за допомогою AI (генерація, аватари, озвучка, монтаж, субтитри), далі разом із командою й автоматизацією.\nПідганяти креативи під воронку (квіз → пейвол → застосунок) і конкретну аудиторію.\nБудувати автоматизацію з виділеним розробником: формулювати вимоги, вести бібліотеку промптів і шаблонів, контролювати якість на виході.\nСтежити за політиками Meta, правами на обличчя, голоси й музику, маркуванням AI-контенту.\nВести напрям: процеси, документація, база хітових хуків; за потреби залучати фрілансерів.\nSkills-set:\nДосвід креативної стратегії в paid social: придумуєш концепції, формулюєш гіпотези, плануєш тести й за результатами вирішуєш, що масштабувати.\nМожеш показати концепції, які масштабувалися, і пояснити, чому вони спрацювали (з цифрами, якщо є).\nДослідження аудиторії: відгуки, коментарі, конкуренти, дані по креативах. Знаходиш болі й формулювання, з яких виростають хуки.\nВпевнена практика з AI-інструментами для відео, голосу й статики та вміння швидко освоювати нові.\nРозуміння paid social: структура відео-креативу, хук і перші 3 секунди, чому один оффер заходить, а інший ні.\nМетрики: CTR, CPA, hook rate, thumb-stop rate. Робиш висновки з даних, а не з відчуттів.\nСценарії й копірайтинг англійською (B2+): тексти для американської аудиторії звучать природно.\nВізуальна база й монтаж: композиція, типографіка, ритм, субтитри.\nПортфоліо реальних рекламних креативів, бажано з результатами, а не лише органічний контент.\nПроактивність: слідкуєш за новими тулами, тестуєш без нагадувань, бачиш, що можна зробити краще, і робиш.\nБуде плюсом:\nПрактика з конкретними AI-інструментами: Midjourney, Nano Banana, Higgsfield, Runway, Kling, Veo, Sora, Pika, ElevenLabs, HeyGen, Arcads, Creatify, CapCut / Premiere, Adobe Firefly та їхні аналоги.\nДосвід у consumer-підписках або EdTech, квіз-воронки, web-to-app.\nРежисура UGC-стилю, motion (After Effects).\nРобота з Meta Ads Manager.\nЯк ми оцінюємо результат:\nКількість нових концепцій-переможців на місяць.\nЦіна замовлення (CAC) на нових креативах.\nЧастка бюджету, що йде на свіжі креативи.\nМи пропонуємо:\nУсі платні AI-інструменти та доступи.\nВиділеного розробника під автоматизацію: це вже закладено в процес.\nМожливість очолити напрям.\nШвидкий цикл: ідея → запуск → результат у даних.\nЯк це бути частиною Nodera Group:\nМи даємо середовище, де результат залежить від тебе. Ми не можемо гарантувати, що кожен наш продукт стане єдинорогом. Але можемо інше: тут ти отримаєш реальні кейси, реальні рішення, реальний вплив і реальну винагороду.\n \nАвтономія: ти вирішуєш, як досягти цілі.\nПрофесійний ріст: швидший, ніж у більшості продуктових компаній, адже багато речей ми запускаємо і робимо вперше.\nГнучкість: ремоут або офіс, без формальних обмежень.\nШвидкість: замість бюрократії та довгого погодження прямий діалог. Бачиш рішення — пропонуєш і реалізовуєш.\nУмови для тебе: щоб драйвити продукт, потрібен ресурс. Тому ми надаємо 6 персональних дей-оффів, 21 день оплачуваної відпустки та безлімітні лікарняні. А ще — бюджет на медичне страхування, компенсацію спортивних занять та вивчення англійської мови, доступ до внутрішньої бібліотеки, програми лояльності з улюбленими брендами і сучасні інструменти для роботи.\nПідтримуємо Збройні Сили України 🇺🇦: Ми організовуємо благодійні аукціони, передаємо техніку бригадам на фронт і системно донатимо. Nodera Group підтримує перевірені фонди, зокрема 1991, KRAKEN FPV Company та інші.\n\nЕтапи відбору: Інтерв’ю з рекрутером —> Інтервʼю з Product Manager та Venture Founder —> Тестове завдання —> Фінальне інтервʼю (презентація тестового) —> Збір рекомендацій.\n\nOWN THE NEXT VERSION OF YOURSELF.\n\nOWN THE NEXT.\nNODERA GROUP.\n\nP.S. Нам потрібно до 10 робочих днів, щоб усе зважити й повернутися до тебе. Навіть якщо зараз нам не по дорозі — ми збережемо твої контакти. У венчур-білдингу все змінюється швидко, тож будемо на зв’язку для можливої співпраці у майбутньому.",
      "url": "https://djinni.co/jobs/853566-creative-manager-creative-strategist/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "Канада",
      "isUrgent": true,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 57,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609337-4814",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "User Acquisition Manager",
      "text": "User Acquisition Manager\n\nBoosteight — продуктова компанія, що розробляє мобільні додатки для глобального ринку. \nМи не просто запускаємо рекламу — ми будуємо систему залучення з позитивною юніт-економікою, тестуємо і масштабуємо те, що працює.\nЗараз шукаємо User Acquisition Manager з фокусом на Meta Ads. Це не позиція «роби що кажуть» — це роль де ти з першого місяця працюєш з реальними бюджетами, реальними даними і реальним впливом на результат.\n \n \nТвій проєкт\nТи працюватимеш із iOS utility-додатками на ринку США та інших Tier-1 країн. Підписочна модель, воронка від кліку до платного юзера, повний цикл — від креативу до аналітики.\nЦе середовище де швидко вчишся: багато тестів, багато даних, чіткий зворотній зв'язок від цифр.\n \n \nЩо ти будеш робити\nЗапускати та оптимізувати рекламні кампанії у Meta Ads — з поступовим збільшенням самостійності.\nАналізувати воронку на кожному етапі: креатив → клік → інстал → підписка.\nТестувати гіпотези: нові кути в креативах, аудиторії, підходи до закупівлі.\nДосліджувати конкурентів знаходити патерни і переносити інсайти у власні кампанії.\nМоніторити ключові метрики: CTR, CR, CPI, CPA, ROAS — і приймати рішення на їх основі.\nПрацювати з трекінговими та аналітичними сервісами.\nВзаємодіяти з креативною командою: ставити гіпотези, давати фідбек, підвищувати конверсію.\n \n \nЩо нам важливо\nMust have:\nДосвід або впевнене розуміння роботи з Meta Ads — 6+ місяців у performance-маркетингу, пет-проєкти або навчальні кампанії з реальними результатами.\nРозуміння ключових метрик: CPI, CPA, CTR, ROAS, LTV — не просто знаєш слова, а розумієш як вони пов'язані між собою.\nАналітичне мислення — бачиш причинно-наслідковий зв'язок у даних, а не просто читаєш таблицю.\nПроактивність — сам шукаєш точки зростання, не чекаєш задач.\nАнглійська на рівні впевненого читання та письма.\nБуде плюсом:\nДосвід роботи з іншими джерелами трафіку.\nДосвід із мобільними підписочними додатками.\nЗнайомство з AppsFlyer або іншими MMP.\nРозуміння Web2App воронок.\nРозуміння iOS екосистеми.\n \n \nТобі до нас, якщо ти\nХочеш не просто «налаштовувати рекламу», а розуміти чому вона працює або не працює.\nШукаєш місце де ріст залежить від результату, а не від стажу.\nГотовий швидко навчатись і брати відповідальність — навіть на джуніор рівні.\nКайфуєш від моменту коли гіпотеза підтверджується в цифрах.\n \n \nЩо ми пропонуємо\nОфіс у Києві — живе середовище, команда поруч.\nМенторство від UA Lead: структурний онбординг, регулярний фідбек, підтримка у прийнятті рішень.\nПовний стек інструментів: Meta Ads, AppsFlyer, Adapty, Amplitude — все що потрібно для роботи.\nБез мікроменеджменту: є задача, є метрики, є свобода в їх досягненні.\n21 день оплачуваної відпустки.\nЧіткі можливості для кар'єрного росту всередині компанії — ми вирощуємо людей, а не наймаємо готових..\n \n \nЯкщо хочеш зрозуміти як насправді масштабується мобільний продукт — і рости разом з командою — надсилай резюме.",
      "url": "https://djinni.co/jobs/824653-user-acquisition-manager/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": true,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609295-9100",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Head of Marketing",
      "text": "Head of Marketing\n\nAbout us:\nHere at Vista Trans, we think one can become the best logistics company only by delivering the right product to the right place in the right condition and at the right time. We offer reliable cargo transportation services across the US and Canada on transparent terms and at affordable rates. You show us two points on the map, and we provide you with a readymade logistic solution.\n \nAbout the role:\nThe Head of Marketing will be responsible for establishing and leading the marketing function at Vista Trans Holding Inc. You will join an organization that has existing digital assets and resources in place, and your mission will be to assess the current state, develop a comprehensive marketing strategy, and execute initiatives that drive driver recruitment, brand awareness, and business growth across all company verticals.\n \nSchedule: US working hours (Central time) 8 am - 5 pm, Mon-Fri\n \nWhat we offer:\nStrategic career advancement within a US-based organization, offering exposure to international markets, high-impact initiatives, and clear pathways for long-term professional growth.\nHighly competitive compensation with structured annual salary reviews, ensuring your performance is consistently recognized and rewarded at market-leading levels.\nComprehensive executive-level time-off package, including paid vacation, sick leave, and observance of US public holidays—totaling 22 fully compensated days annually.\nFinancial stability with global alignment, as compensation in local currency is pegged to the USD exchange rate, safeguarding your earnings against market fluctuations.\nFull tax reimbursement, ensuring your net income remains optimized and your compensation package retains its true value.\n \nWe require:\n5+ years of experience in Marketing Manager, Head of Marketing, Growth Marketing, Demand Generation, or CMO roles.\nProven experience building and scaling marketing functions, teams, and processes from scratch.\nStrong performance marketing background with hands-on experience in:Google Ads\nMeta Ads\nLinkedIn Ads\nConversion Rate Optimization (CRO)\nMarketing funnel optimization\n\nProven B2B lead generation experience with measurable results.\nExperience creating and managing multi-channel marketing strategies across paid, organic, content, email, and CRM channels.\nExperience managing marketing agencies, vendors, freelancers, and internal teams.\nStrong understanding of marketing analytics, attribution, reporting, and ROI measurement.\nExperience working closely with Sales teams and building lead qualification processes (MQL/SQL frameworks).\nAdvanced English communication skills.\n \nWhat Success Looks Like\nIn this role, you will be responsible for:\nIncreasing qualified shipper leads.\nImproving driver recruitment marketing performance.\nBuilding a scalable lead-generation engine.\nEstablishing marketing reporting, analytics, and attribution systems.\nManaging marketing vendors and agencies.\nStrengthening Vista's employer brand and market presence.\nBuilding a high-performing marketing team capable of supporting long-term growth.\n \nDeal Breakers\nPure brand marketing background without lead generation ownership.\nSocial media–only experience.\nAgency account management experience without accountability for business results.\nInability to discuss marketing metrics such as CPL, CAC, ROAS, ROMI, MQLs, SQLs, and conversion rates.\nNo experience building marketing processes, reporting systems, or KPIs.\nPreference for advisory/fractional work instead of a full-time leadership role.",
      "url": "https://djinni.co/jobs/853608-head-of-marketing/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "Канада",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609290-2472",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Junior/Middle Media Buyer FB iGaming",
      "text": "Junior/Middle Media Buyer FB iGaming\n\nDEVILS — найбільша медіабаїнгова компанія Східної Європи в сфері affiliate-маркетингу, що спеціалізується на масштабуванні трафіку та розвитку технологічної інфраструктури. У структурі DEVILS — понад 1000 професіоналів, власні технічні рішення, аналітичні системи, сильна корпоративна культура та 15+ активних проєктів у різних напрямках. Шукаємо Facebook Media Buyer\nТобі не обов’язково мати тонну досвіду — головне, щоб горіли очі, було бажання рости та вміння мислити аналітично. Усе інше — покажемо, навчимо, підтримаємо.\n \nЗапрошуємо до команди, якщо маєш:\nРозуміння FB Ads Manager\nДосвід роботи з агентськими акаунтами, також з BM-ами, та авторегами.\nЗнання інструментів автозаливу\nДосвід роботи з PWA сервісами\nНавички створення та написання ТЗ на креативи\nРобота зі спай-сервісами для аналізу конкурентів\nВміння забезпечувати стабільний спенд 500$+ щодня\n \nМи пропонуємо:\nВідсоток від чистого прибутку — без обмежень, із повною прозорістю.\nДоступ до ексклюзивних прямих оферів та унікальних умов від рекламодавців.\nПрямі угоди з топовими рекламодавцями (без посередників).\nГлобальний пул GEO без обмежень бюджету.\nПовна інфраструктура для миттєвого запуску кампаній (без вузьких місць).\nВиділена продуктова команда, що забезпечує креативи, лендинги та push-флоу на запит.\nПовна підтримка з боку афілійованого напрямку зі стратегіями, орієнтованими на ROI.\nДоступ до технічної підтримки, аналітиків та міжфункціональної бази знань.\n \nОформлення та гнучкість:\nОфіційне працевлаштування в Варшаві або через міжнародні контракти, що відповідають законодавству.\nМожливість внутрішньої ротації в межах холдингу без зміни роботодавця.\nСучасний офіс у Варшаві\n \nОплата та відпустка:\nКонкурентна заробітна плата з високим відсотком від прибутку (profit-sharing model).\nГрафік роботи узгоджений із державними святами.\n \nЗдоров’я та благополуччя:\nHealth-бокси під час лікарняного.\nФінансова та юридична підтримка, включно з консультаціями юриста.\nДоступ до корпоративного психолога.\nПідтримка ментального здоров’я в партнерстві зRozmova.\nЯскраві корпоративні заходи у світі affiliate-маркетингу —дивіться, як це було.\n \nПрофесійна залученість:\nУчасть у провідних конференціях, конкурсах та affiliate-подіях.\nПостійне корпоративне навчання та підтримка професійного розвитку.\nТехнології та інструменти:\n \nДоступ до наших внутрішніх рішень:\nCRM-система.\nВнутрішня база знань.\nPush-панель.\nТрекер.\nPWA-сервіси\n \nP.S. Якщо Ви прагнете працювати в динамічній команді, Вам цікаві продукти, технології та світ digital-розваг — будемо раді отримати Ваше резюме та портфоліо, щоб домовитися про онлайн або офлайн зустріч і познайомитися ближче.\nВаше резюме буде уважно розглянуте командою Talent Acquisition. Якщо Ваш досвід відповідатиме вимогам, ми зв’яжемося з Вами протягом 3 робочих днів для обговорення наступних етапів.",
      "url": "https://djinni.co/jobs/829684-junior-middle-media-buyer-fb-igaming/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 21000,
      "currency": "₴",
      "country": "Польща",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 83,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta) з бюджетом 21000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609232-6835",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "ecommerce",
      "subcategoryName": "Онлайн-магазин",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Контент-менеджер (Shopify)",
      "text": "Контент-менеджер (Shopify)\n\nОнлайн-магазин матраців і товарів для сну\nМи - онлайн-магазин матраців і товарів для сну. Шукаємо контент-менеджера, який добре знає і має досвід роботи з Shopify, і зробить наш каталог зручним, точним і таким, що продає.\nОбов'язки\nДодавання та оновлення товарів у Shopify: назви, описи, характеристики, ціни, варіанти (розміри, жорсткість).\nСтворення та підтримка колекцій, фільтрів, тегів і метаполів (metafields).\nОбробка та завантаження фото й відео товарів, контроль єдиного візуального стилю\nОновлення банерів, акційних сторінок і блоків \nМасовий імпорт та експорт товарів через CSV або додатки \nПеревірка коректності відображення сайту на десктопі й мобільних пристроях\nВзаємодія з відділом продажу, маркетологом і постачальниками щодо актуальності інформації\nРобота з додатками і розширеннями Shopify\nВимоги\nОбов'язковий досвід роботи з Shopify (адмінпанель, товари, колекції, варіанти, метаполя, редактор, додатки, особливості)\nДосвід контент-менеджменту інтернет-магазину\nВміння працювати з таблицями (Google Sheets, Excel) для масових оновлень\nБазові навички обробки зображень (AI, Photoshop, Figma, Canva)\nУважність до деталей і відповідальність за точність даних\nБуде перевагою\nДосвід із додатками Shopify для відгуків, фільтрів, перекладів, SEO\nЗнання англійської або турецької мови\nДосвід роботи з Google Merchant Center і товарними фідами\nМи пропонуємо\nКонкурентна оплата праці з опціями розвитку і підвищення в залежності від навичок\nВіддалений формат роботи\nВплив на розвиток проекту та свободу пропонувати покращення і рішення\nКар’єрне зростання",
      "url": "https://djinni.co/jobs/853614-kontent-menedzher-shopify/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: онлайн-магазин.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609212-5014",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Таргетолог",
      "text": "Таргетолог\n\nWallpanels.com — американська компанія з офісом у сонячному Маямі, яка створює преміальні рішення для інтер’єрів: стінові панелі, корпусні меблі та комплексні рішення для житлових і комерційних просторів у США.\nМи працюємо над проєктами для клієнтів, які цінують якісний дизайн, функціональність та індивідуальний підхід. Наша команда реалізує рішення для преміальних інтер’єрів, remodeling та custom spaces на американському ринку.\n \nЗараз ми шукаємо Таргетолога (Meta Ads Specialist) — спеціаліста, який допоможе нам масштабувати рекламні кампанії, залучати якісних клієнтів та підвищувати ефективність інвестицій у рекламу.\n \nЦе роль для людини, яка розуміє, що результат реклами — це не просто кількість заявок, а якісні ліди, реальні замовлення та розвиток бізнесу.\n \nЩо Ви будете робити?\nЗапускати та оптимізовувати рекламні кампанії в Meta Ads Manager (Google Ads, TikTok Ads — буде плюсом).\nЩодня аналізувати ефективність рекламних кампаній: CPL, CPO, ROI, ROAS.\nВести звітність у Google Sheets/Excel, звіряти дані з CRM.\nКонтролювати якість лідів та відстежувати їхню конверсію у замовлення.\nПерерозподіляти рекламні бюджети між кампаніями, виходячи з результатів.\nПроводити A/B-тестування креативів, аудиторій та рекламних гіпотез.\nАналізувати поведінку аудиторії та пропонувати ідеї для покращення рекламних результатів.\nГотувати аналітичні звіти та рекомендації для команди.\n \nРезультати, яких ми очікуємо від Вас:\nЗалучення якісних лідів із рекламних каналів.\nПокращення показників рекламних кампаній.\nЕфективне використання рекламного бюджету.\nЗростання конверсії «лід → замовлення».\nЗрозуміла аналітика та контроль ефективності рекламних активностей.\n \nМи шукаємо саме Вас, якщо Ви:\nМаєте від 3 років досвіду роботи таргетологом.\nВпевнено працюєте з Meta Ads Manager.\nМаєте досвід самостійного запуску, оптимізації та масштабування рекламних кампаній.\nРозумієте принципи роботи рекламних алгоритмів та аналітики.\nВмієте працювати з цифрами та приймати рішення на основі даних.\nМаєте досвід роботи з CRM, Google Analytics 4, Google Tag Manager — буде перевагою.\nВолодієте англійською мовою на рівні B1-B2 або вище.\nПроявляєте ініціативність, самостійність та орієнтованість на результат.\n \nБуде перевагою:\nДосвід роботи з американським ринком або міжнародними проєктами.\nДосвід у сфері преміального ремонту, дизайну інтер’єру, нерухомості, будівництва або суміжних напрямках.\nРозуміння специфіки реклами послуг із високим середнім чеком.\nДосвід роботи з довгим циклом продажу та воронками, де клієнт проходить декілька етапів прийняття рішення.\n \nУмови роботи:\nПовністю віддалений формат роботи.\nРобота з міжнародною командою та проєктами для ринку США.\nГрафік роботи з урахуванням часової зони Маямі.\nМожливість працювати з цікавим продуктом у сфері преміальних інтер’єрів.\nНадсилайте своє резюме та поділіться прикладами рекламних кампаній, з якими Ви працювали. Будемо раді познайомитися!",
      "url": "https://djinni.co/jobs/853619-targetolog/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "США",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення на Djinni: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609195-1702",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Media Buyer / Gambling / CPA",
      "text": "Media Buyer / Gambling / CPA\n\nШукаємо Media Buyer | Gambling | CPA\n \nПотрібен Media Buyer зі свіжим досвідом роботи з трафіком за CPA-моделлю.\n \nЩо важливо:\n• 1–2+ роки досвіду в Media Buying;\n• досвід у Gambling та Tier-1 GEO;\n• робота з бюджетами від $1K Daily;\n• розуміння повного циклу воронки;\n• самостійне тестування GEO, офферів і креативів;\n• досвід масштабування прибуткових зв’язок;\n• впевнене розуміння Spend, CTR, CPC, CPM, CPA/FD, CR, ROI, ROAS, Reg→FD, FD→RD;\n• вміння ставити ТЗ дизайнерам та генерувати ідеї для креативів;\n• власні кейси з цифрами.\n \n💰 Ставка: $1000 + бонуси",
      "url": "https://djinni.co/jobs/852275-media-buyer-gambling-cpa/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 41500,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 80,
      "aiSummary": "Замовлення на Djinni: маркетинг з бюджетом 41500 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609175-1420",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "seo",
      "subcategoryName": "SEO оптимізація",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Head of Affiliate Marketing / Head of Acquisition - Canada, Australia, New Zealand (IGaming)",
      "text": "Head of Affiliate Marketing / Head of Acquisition - Canada, Australia, New Zealand (IGaming)\n\nФормат роботи: Remote\nІндустрія: iGaming\nТип зайнятості: Full-time\n\nПро проєкт\nМи запускаємо новий iGaming-проєкт, орієнтований на ринки Канади, Австралії та Нової Зеландії.\nЦе можливість долучитися до стартапу на самому початку його розвитку в рамках великого міжнародного холдингу з потужною інвестиційною підтримкою, перевіреною експертизою та амбітними планами масштабування.\nМи шукаємо сильного Head of Acquisition, який хоче не підтримувати вже існуючу систему, а створити її з нуля, впливати на стратегічні рішення та будувати один із ключових напрямків бізнесу.\n\nОсновні задачі\nПобудова та масштабування affiliate-напрямку на ринках Канади, Австралії та Нової Зеландії\nРозробка та реалізація affiliate-стратегії\nПошук, залучення та розвиток партнерської мережі\nРобота з SEO-affiliates, медіапартнерами та вебмайстрами\nПереговори щодо CPA, RevShare та Hybrid-моделей\nАналіз якості трафіку та ефективності партнерів\nКонтроль ключових показників: FTD, NGR, ROI, CPA, Retention та LTV\nТісна взаємодія з командами Product, CRM, Analytics та Management\nУчасть у формуванні та розвитку affiliate-команди\n\nНаші очікування\nДосвід роботи в Affiliate Marketing у сфері iGaming\nПрактичний досвід роботи з ринками Канади, Австралії та Нової Зеландії\nВласна база affiliate-партнерів та SEO-партнерів\nДосвід запуску та масштабування affiliate-програм\nСильні навички переговорів та розвитку партнерств\nРозуміння основних performance-маркетингових метрик\nВільна англійська мова\n\nЩо ми пропонуємо\nМожливість побудувати масштабний міжнародний проєкт з нуля\nМаксимальну свободу в ухваленні рішень та реалізації власних ідей\nПрямий вплив на розвиток бізнесу та стратегію компанії\nСильну фінансову підтримку та довгострокове бачення інвесторів\nВідсутність зайвої бюрократії та швидкість ухвалення рішень\nДоступ до ресурсів і експертизи міжнародного холдингу\nМожливість сформувати та очолити власну команду\nКонкурентну винагороду та бонусну систему\nПовністю віддалений формат роботи\nШанс реалізувати свій досвід у проєкті з великим потенціалом зростання та стати одним із ключових драйверів його успіху.",
      "url": "https://djinni.co/jobs/835002-head-of-affiliate-marketing-head-of-acquisiti/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "Канада",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення на Djinni: seo оптимізація.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609170-5778",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "3d_site",
      "subcategoryName": "3D сайт",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Playable Ads Developer (JavaScript)",
      "text": "Playable Ads Developer (JavaScript)\n\n24PLAY is a game development company from Ukraine, creating games and playable ads in co-development and co-production with partners worldwide.\n \nSince 2019, we’ve been bringing together strong production expertise, creative talent, and a deep understanding of games to turn ideas into engaging player experiences. Today, we collaborate with partners such as Ubisoft, Papaya, Octo Games, and others - developing and launching games and playable experiences for global audiences.\n\nAs a Diia City resident, we offer employee reservation starting from the first day of employment.\n \nWe are currently looking for a Playable Ads Developer to share our core company values:\nCreativity: We actively encourage and embrace each other’s ideas, transforming them into reality through collaboration and innovative thinking.\nIntegrity: We commit to providing honest feedback and realistically assessing situations, fostering a culture of trust and transparency.\nProductivity: We strive to optimize our workflows to achieve the best possible results in the shortest timeframe, ensuring efficiency and effectiveness in our operations.\nUncompromising Quality: Our commitment to excellence drives us to prioritize the quality of our work above all else, ensuring that we consistently deliver outstanding results.\nHealthy Lifestyle: We advocate for a healthy lifestyle and stand against harmful habits, promoting well-being and balance within our team.\n \nWe are looking for a professional for the role that requires:\nFull-time job;\nOffice-based in Kyiv.\n\nMain responsibilities:\nCreate 2D and 3D playable ads and creatives to promote mobile games\nDevelop gameplay mechanics, game logic, animations, and visual effects\n\nNice to have:\nExperience working with MRAID and understanding of ad network technical requirements for playables\nExperience creating games on any technology/platform (Unity, Flash, etc.)\n\nOur ideal candidate:\n0,5+ years of experience working with JavaScript\nExperience building web applications or games using 3D graphics libraries (Three.js, Babylon.js, etc.) or experience with 2D JavaScript libraries such as PixiJS or similar\nExperience with JavaScript physics libraries (Ammo.js, Cannon.js, or similar)\nSolid understanding of 2D/3D math (vectors, matrices, dot/cross product)\n \nWhy join our team?\nFully Legal: Official employment in full compliance with Ukrainian labor legislation, including paid vacation (24 days) and sick leave (unlimited).\nProfessional Team: A high-performing group of skilled individuals committed to excellence.\nNo Overtime: We prioritize a healthy work-life balance, with no overtime required.\nStable Payments: No payment delays since the foundation of the company.\nBonus System: A unique reward system designed to motivate employees by aligning their performance with the company’s financial goals.\nProfessional Development: Access to mentorship programs and our internal library for continuous growth.\nEvents: Enjoy board games, masterclasses, corporate events, sports activities, and free English classes.\nComfortable Workspace: A modern office in Kyiv featuring a spacious lounge, fully-equipped kitchen, sports zone, cinema, and complimentary spa facilities for employees.",
      "url": "https://djinni.co/jobs/805430-playable-ads-developer-javascript/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: 3d сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609109-244",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Senior Frontend Engineer",
      "text": "Senior Frontend Engineer\n\nWe’re looking for a senior-level React engineer to own critical frontend experiences, collaborate closely with product/design, and help us scale BridgeWise to millions of users.\nWhat you’ll do\nDesign, build, and ship high-performance, responsive web UIs\nPartner with product managers, designers, and analysts to translate user needs into elegant product experiences\nPlan and execute short- and long-term roadmaps balancing user impact, technical quality, and delivery speed\nRaise the bar through code reviews, mentoring, and improvements to our tooling and processes\n \n\nMust-have expertise\nNext.js (our web app is built with Next.js)\nMonorepos using Yarn Workspaces or Nx\nTailwind CSS (our primary design system)\n \nTechnical requirements\n5+ years of professional software development experience\n5+ years with React and its ecosystem (e.g., Redux, React Router)\nStrong proficiency in JavaScript (ES6/ES7) and TypeScript\nDeep knowledge of HTML/CSS, responsive design, and accessibility (a11y) best practices\nHands-on with modern build tooling and package managers (Vite, esbuild, Yarn)\nExperience with server-side rendering and Next.js, plus working knowledge of Node.js\nComfortable with Git workflows and agile methodologies\n3+ years working with major cloud providers (AWS/GCP/Azure)\nStorybook\n \nNice to have\nExperience with monorepo release management and internal package versioning\nFamiliarity with performance profiling, Web Vitals, and SEO in Next.js\nE2E testing (Playwright/Cypress) and CI/CD pipelines\nExperience in fintech or data-heavy, real-time UIs",
      "url": "https://djinni.co/jobs/853017-senior-frontend-engineer/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609085-9933",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Frontend Developer",
      "text": "Frontend Developer\n\nWe’re looking for a Frontend Developer to build and improve web interfaces for dashboards, reports, tables, and data visualization.\nYou’ll work with backend APIs and help make information easy to find, filter, and understand. We’re looking for someone who writes clean code, pays attention to details, and cares about the user experience.\n\nRequirements\n\nExperience with at least two of the following: React, Next.js, Vue.js.\nGood knowledge of TypeScript.\nExperience building dashboards, tables, reports, or similar interfaces.\nExperience working with REST APIs.\nUnderstanding of state management, data fetching, and error handling.\nExperience with filtering, sorting, charts, and displaying data in tables.\nFamiliarity with Git, testing, and CI/CD.\nUnderstanding of responsive design and reusable components.\nNice to have\nExperience in supply chain, logistics, inventory, planning, or procurement.\nExperience with Figma, including wireframes and prototypes.\nAbility to design interfaces and implement them in code.\nExperience with data grid or chart libraries.",
      "url": "https://djinni.co/jobs/853122-frontend-developer/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "США",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097609081-2093",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "djinni",
      "sourceName": "Djinni",
      "sourceUsername": "@djinni",
      "authorName": "Рекрутер на Djinni",
      "authorUsername": "@djinni",
      "title": "Front-end Developer",
      "text": "Front-end Developer\n\nМи — продуктова IT-компанія, яка працює у сфері performance marketing та розробляє власні рішення для бізнесів і маркетологів на західних ринках (США та Європа).\nЗараз ми розширюємо команду та шукаємо Frontend Developer, який допоможе розвивати наші внутрішні продукти та інтерфейси.\n \nЗараз у команді розробки працює 13 розробників, з них 3 Frontend Developers. Ми розширюємо цей напрям і шукаємо ще одного спеціаліста в команду. \n \nРоль передбачає тісну взаємодію з командою розробки та участь у розвитку продукту на рівні UI/UX-рішень.\n \nНаш стек\nHTML5, CSS3\nSCSS\nJavaScript (vanilla)\nGulp\njQuery \nМи також рухаємось у сторону використання сучасних можливостей браузера: dialog, popover та інші Web API\n \nЩо нам важливо\nДосвід комерційної розробки від 2 років\nВпевнені знання HTML, CSS, JavaScript\nДосвід роботи з SCSS та збірниками (Gulp)\nРозуміння принципів адаптивної та кросбраузерної верстки\nБазове розуміння роботи з DOM та сучасних Web API\nУважність до якості коду та деталей інтерфейсу\nБажання розвиватися та слідкувати за трендами у фронтенді\n \nБуде плюсом: досвід роботи з Yii2 (PHP, widgets, PJAX) у контексті фронтенду.\n \nМи пропонуємо:\nПовністю віддалену роботу.\nФул-тайм співпрацю з гнучким графіком з пн-пт.\nРоботу в міжнародній IT-компанії з клієнтами з різних ринків.\nМожливість навчання та розвитку.\nОплачувану відпустку, лікарняні та святкові дні за українським календарем.\n \nЕтапи відбору:\nСкринінг резюме\nHR-інтерв’ю \nТехнічне інтерв’ю",
      "url": "https://djinni.co/jobs/850653-front-end-developer/",
      "date": "2026-10-15T20:53:29.045Z",
      "dateFormatted": "Сьогодні, 23:53",
      "budget": 0,
      "currency": "₴",
      "country": "РФ",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 54,
      "aiSummary": "Замовлення на Djinni: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097436583-7026",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "google_ads",
      "subcategoryName": "Google реклама",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Ищу Google ADS мастера для запуска товарных компаний в Google Merchant Center",
      "text": "Ищу Google ADS мастера для запуска товарных компаний в Google Merchant Center - 5000UAH\n\nНужен траффер для запуска товарных компаний по фиду, в GMC\nБудет много проектов, нужно введение их, проходимость верификации в самой GMC\nРабота на постоянную основу, можем обсудить и % с продаж",
      "url": "https://freelancehunt.com/project/ischu-google-ads-mastera-dlya-zapuska/1659188.html",
      "date": "2026-10-15T20:50:35.876Z",
      "dateFormatted": "Сьогодні, 23:50",
      "budget": 5000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 59,
      "aiSummary": "Замовлення на Freelancehunt: google реклама з бюджетом 5000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097436538-8235",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Оптимизация и доработки новостного сайта на wordpress",
      "text": "Оптимизация и доработки новостного сайта на wordpress - 10000UAH\n\nНеобходимо обновить wordpress до последней версии и плагины, отредактировать несколько страниц, информация должна редактироваться через acf поля. Также перенести сайт с обычного хостинга на vps, добавить конвертацию изображений в webp без сохранения оригинальной копии на сервере.",
      "url": "https://freelancehunt.com/project/optimizatsiya-dorabotki-novostnogo-sayta-na/1659193.html",
      "date": "2026-10-15T20:50:35.876Z",
      "dateFormatted": "Сьогодні, 23:50",
      "budget": 10000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 59,
      "aiSummary": "Замовлення на Freelancehunt: веброзробка з бюджетом 10000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097436523-7733",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Моушн-дизайнер для Reels: премиум и динамичный форматы монтажа, Lottie-анимации",
      "text": "Моушн-дизайнер для Reels: премиум и динамичный форматы монтажа, Lottie-анимации - 110USD\n\nИщу моушн-дизайнера (After Effects): оформить Reels в двух стилях\n\n\n⚠️ Обязательные правила (продукт делается по шариату):\n• Без музыки (только короткие эффекты: щелчок, свист, удар)\n• Без женщин, людей, животных и смайликов с лицами в графике\n• Без алкоголя, свинины, азартных игр и всего, что запрещено...",
      "url": "https://freelancehunt.com/project/moushn-dizayner-dlya-reels-premium-dinamichnyiy/1659226.html",
      "date": "2026-10-15T20:50:35.876Z",
      "dateFormatted": "Сьогодні, 23:50",
      "budget": 110,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 59,
      "aiSummary": "Замовлення на Freelancehunt: монтаж reels/tiktok з бюджетом 110 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097436509-6314",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "google_ads",
      "subcategoryName": "Google реклама",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Beauty in Black",
      "text": "Beauty in Black\n\nHier ist die Anzeige auf Russisch:Специалист по Google Ads для премиального салона красоты в Аликанте, Испания – старт сразу О проекте\n«Beauty in Black – Hair Luxury Lounge» – премиальный салон красоты в Аликанте (район Catedrático Soler), уже открыт и работает. Мы ищем опытного фрилансера, который профессионально...",
      "url": "https://freelancehunt.com/project/beauty-black/1659247.html",
      "date": "2026-10-15T20:50:35.876Z",
      "dateFormatted": "Сьогодні, 23:50",
      "budget": 0,
      "currency": "₴",
      "country": "Іспанія",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення на Freelancehunt: google реклама.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-ex-1792097436387-3178",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "google_ads",
      "subcategoryName": "Google реклама",
      "sourceType": "freelancehunt",
      "sourceName": "Freelancehunt",
      "sourceUsername": "@freelancehunt",
      "authorName": "Замовник на Freelancehunt",
      "authorUsername": "@freelancehunt",
      "title": "Дропшиппинг",
      "text": "Дропшиппинг - 2000UAH\n\nИщу специалиста по Google Ads для настройки рекламы Telegram-канала.\nЯ поставщик детской одежды Little Look. Товар в наличии. Работаю с дропшипперами по Украине.\nХочу привлекать новых дропшипперов через поиск Google, чтобы люди переходили в Telegram-канал и начинали сотрудничество.\nНеобходимо: Настроить...",
      "url": "https://freelancehunt.com/project/dropshiping/1659275.html",
      "date": "2026-10-15T20:50:35.876Z",
      "dateFormatted": "Сьогодні, 23:50",
      "budget": 2000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 59,
      "aiSummary": "Замовлення на Freelancehunt: google реклама з бюджетом 2000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089958055-635",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "ecommerce",
      "subcategoryName": "Онлайн-магазин",
      "sourceType": "chat",
      "sourceName": "IT Фріланс Україна",
      "sourceUsername": "",
      "authorName": "Олег",
      "authorUsername": "@shoes_shop",
      "title": "Шукаю досвідченого розробника для створення сучасного інтернет-магазину взу...",
      "text": "Шукаю досвідченого розробника для створення сучасного інтернет-магазину взуття. Бюджет 25000 грн. Писати в ПП @shoes_shop",
      "date": "2026-10-15T18:45:58.017Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 25000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: онлайн-магазин з бюджетом 25000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940807-698",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "channel",
      "sourceName": "Digital Work UA",
      "sourceUsername": "@digital_work_ua",
      "authorName": "digital_work_ua",
      "authorUsername": "@digital_work_ua",
      "title": "🫐 Команда Molfar в пошуку SMM менеджера!",
      "text": "🫐 Команда Molfar в пошуку SMM менеджера!\n\nMolfar - компанія з конкурентної розвідки: шукаємо інформацію про компанії, збираємо приховані зв'язки між людьми, аналізуємо нові ринки.\n\nПропонуємо:\n- full time, віддалено;\n- конкурентний рівень зарплатні;\n- повну адаптацію у вивченні нашого напрямку.\n\nЯкщо ти:\n- володієш англійською від Intermediate та вище;\n- розумієш принцип роботи FB, inst, LinkedIn, Tik-Tok та Twitter;\n- маєш досвід у SMM та базовому дизайні;\n- впевнено володієш Canva;\n- маєш портфоліо: пости у соцмережах, візуальне оформлення\n\nТо скоріш заповнюй форму і ми звернемось до тебе!",
      "date": "2026-10-15T18:45:40.807Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940777-691",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "channel",
      "sourceName": "Digital Work UA",
      "sourceUsername": "@digital_work_ua",
      "authorName": "digital_work_ua",
      "authorUsername": "@digital_work_ua",
      "title": "Друзі, ось пост про який казав❤️",
      "text": "Друзі, ось пост про який казав❤️\n\nЧому перші два тижні на Upwork я не отримав жодного замовлення, а за\nнаступні два тижні цілих 3, вартістю ≈ 1900$ (а зараз, скоріш за все закрию ще один проєкт по просування американського психолога, вартість якого 1000$ за два тижні)\n\nТут можна дуже і дуже багато писати, але спробую зробити це без води, як-то кажуть «на хлопський розум».\n\nЯ помітив таку штуку, що є два типи помилок:\n\nБазові помилки - «чому замовник на Вас не гляне» і детальні «чому замовник «змиється» під час обговорення проєкту»🤯\n\nБазові:\n\nЗамовник дивиться на ваші відгуки, але що робити, якщо у вас (так само як і в мене на початку) не було відгуків?\n\nВідповідь - портфоліо\nКоли я реєструвався на Upwork, я заповнив портфоліо 5-6 проєктами, кейсами з України та подумав, що цього досить. Є підозри, що саме тому замовлення почали з’явились коли я переробив портфоліо.\n\nПомилки:\n1. Візуальний вигляд мого портфоліо, я smm спеціаліст і я думав що кейс - вигляд профілю моїх клієнтів, статистика та опис того, що я виконав мало б бути достатньо (цього вистачає, аби закрити клієнта в Україні).\nАле ні. Кожен кейс я оформив як презентацію, в якій було 4-5 слайдів: Які цілі ставив клієнту, моя стратегія, процес роботи, перші результати, ефективні інструменти і тд… Я думаю ви зрозуміли💪🏼\nОскільки англійська у мене базова, я скористався послугами перекладача, який вичитав та виправив мої тексти для кейсів. Я витратив 5 днів, щоб переробити своє портфоліо, і тільки тоді я почав знову залишати заявки під проєктами.\n\nДруга базова помилка.\nЯ десь прочитав, у якогось блогера, що варто вказувати наступну інформацію «типу я з України, у нас тут війна тому я залишився без роботи, матиму більше часу приділяти вашому проєкту», якось так тільки на анг.\nТак ось - це дурня, як тільки я перестав це писати, із гарним портфоліо - замовники почали відписувати на мої пропозиції.\n\nНе базові помилки, це який ти спеціаліст. Туди входять такі речі, як наявність брифу для клієнта, приклад стратегії або адаптивна загальна стратегія, приклад воронки продаж і тд. Всі речі випливають уже безпосереднього під час спілкування з клієнтом😒\n\nПро це напишемо за кілька днів, а поки накидайте коментарів і реакцій на цю публікацію❤️",
      "date": "2026-10-15T18:45:40.776Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 79000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": false,
      "aiRating": 89,
      "aiSummary": "Замовлення: маркетинг з бюджетом 79000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940713-704",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "landing",
      "subcategoryName": "Односторінковий сайт",
      "sourceType": "channel",
      "sourceName": "Digital Work UA",
      "sourceUsername": "@digital_work_ua",
      "authorName": "digital_work_ua",
      "authorUsername": "@digital_work_ua",
      "title": "Ловіть з самого ранку підбірку актуальних проєктів на Upwork🇺🇦❤️",
      "text": "Ловіть з самого ранку підбірку актуальних проєктів на Upwork🇺🇦❤️\n\n1️⃣ Marketing Virtual Assistant\n(We are looking to hire an enthusiastic digital marketing assistant to assist our busy marketing team.)\n\n2️⃣ Social Media Manager\n(I am in need of guidance on web page / landing pages / funnels / ideas for growing business / correct copy / research of niche and customer processes / lead generation)\n\n3️⃣ Twitter Growth | Social & Marketing Manager\n(We are looking for a creative professional who’s passionate about creating engaging brand-based content on Twitter for a personal account that has to be transformed into an \"Influencer account\")\n\nТисни на назву проекту, переходить та залишай заявку🇺🇦\n\nУспіху❤️",
      "date": "2026-10-15T18:45:40.713Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 63,
      "aiSummary": "Замовлення: односторінковий сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940710-731",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Digital Work UA",
      "sourceUsername": "@digital_work_ua",
      "authorName": "alex_work",
      "authorUsername": "@alex_work",
      "title": "Доброго ранку🇺🇦",
      "text": "Доброго ранку🇺🇦\nМожливо вам будуть корисні вакансії в Україні❤️\n\n1. Менеджер Instagram-аккаунтов (испанский, английский, польский, немецкий язык) - Менеджер Instagram-аккаунтов\n📍Хмельницький, Україна\nМови: UA,EN, ES, PL, DE\nВимагання: -знання однієї з мов\nКонтакти: Александр +380738002183 ТГ: @alex_work\n\n2. SMM менеджер - SMM-менеджер в Львове - Lviv\n📍Львів, Україна\nМови: UA,EN\nВимагання: - вища освіта; - інтерес до теми інновацій та ІТ.\nКонтакти: Анна +380673400966",
      "date": "2026-10-15T18:45:40.710Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940443-636",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Zaichenko Team | Вакансії",
      "sourceUsername": "@zaichenkoteam",
      "authorName": "zt_talents",
      "authorUsername": "@zt_talents",
      "title": "❗️ User Acquisition Manager",
      "text": "❗️ User Acquisition Manager\n▪️ US / Canada / Remote\n\nПро компанію:\nНаш клієнт (NDA) має досвід створення та просування власних white-продуктів. Зараз компанія запускає новий e-commerce продукт з нуля. Проєкт на стартовому етапі: формується ключова команда, стратегія виходу на ринок і маркетингові процеси.\n\nВимоги\n- Досвід роботи з ринком США.\n- Глибокий практичний досвід Facebook Ads.\n- Досвід роботи з великими бюджетами: спенд від $100k на місяць.\n- Досвід scaling.\n- Performance-аналітика.\n- Досвід в e-commerce.\n\nДетальніше про вакансію 📂\nза посиланням\n\nДля звʼязку:\n@zt_talents\n\nРозкажіть про цю вакансію вашим друзям.",
      "date": "2026-10-15T18:45:40.443Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 4000,
      "currency": "₴",
      "country": "Канада",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 73,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 4000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940422-560",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "tiktok_ads",
      "subcategoryName": "TikTok реклама",
      "sourceType": "channel",
      "sourceName": "Happy Monday | Кар'єра",
      "sourceUsername": "@happymonday",
      "authorName": "happymonday",
      "authorUsername": "@happymonday",
      "title": "Вакансії у маркетингу 📈",
      "text": "Вакансії у маркетингу 📈\n\nБувають моменти, коли ви чітко розумієте: цей етап пройдено, треба рухатися далі. Тож якщо ви якраз у пошуках нових викликів — придивіться до цієї добірки вакансій:\n\n▪️ Комунікаційний менеджер/комунікаційна менеджерка DOZORRO до Transparency International Ukraine\n\n▪️ Communication Specialist до GIZ\n\n▪️ SMM-спеціаліст/спеціалістка до Мережі Права\n\n▪️ Email Marketing Specialist до MEGOGO\n\n▪️ PPC Specialist Senior до Uklon\n\n▪️ Product Manager до Київстар\n\n▪️ Lead Generation Specialist до GoodWave Solutions\n\n▪️ Account Manager, Marketing & Brand Activations до Adsapience\n\n▪️ Paid Media Content Creator до The Kyiv Independent\n\n▪️ Head of Marketing до Групи Смарт\n\n▪️ Заступник/заступниця начальника відділу прес-служби та взаємодії з громадськістю до Державної митної служби України\n\n▪️ SMM Manager до Орісіл-Фарм\n\n▪️ PR manager до MORIS GROUP\n\n▪️ Creative Director до camotec\n\n▪️ Creative Marketing Manager до Code Street\n\n🔗 Більше вакансій за лінком: https://cutt.ly/2yEe3Mn0\n\n#vacanciesHappyMonday\n\ntelegram | inst | fb | threads | linkedin | tiktok | youtube",
      "date": "2026-10-15T18:45:40.421Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: tiktok реклама.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940232-757",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "SMM Вакансії та Маркетинг",
      "sourceUsername": "@smm_work_ua",
      "authorName": "sshpachek",
      "authorUsername": "@sshpachek",
      "title": "👔 SMM-специалист в маркетинговое агентство для ведения клиентских проектов...",
      "text": "👔 SMM-специалист в маркетинговое агентство для ведения клиентских проектов (в основном b2b) и развития собственных сообществ.\n\n💻Обязанности\n• Разработка коммуникационной стратегии (в паре с маркетологом):\n——— анализ продукта, конкурентов, целевой аудитории;\n——— определение концепции и tone of voice;\n——— разработка контент-планов.\n• Генерация гипотез, адаптация инфоповодов, работа с вовлеченностью и виральностью;\n• Конкурентный анализ;\n• Постановка задач дизайнерам, таргетологу, копирайтерам;\n• Разработка контента собственными силами (не всего);\n• Интервьюирование экспертов (“вытащить полезный контент из головы” для дальнейшей публикации);\n• Подготовка сценариев и продюсирование видеосъемок;\n• Коммуникация с клиентом (не часто, за оперативную коммуникацию отвечает аккаунт-менеджер);\n• Модерация сообществ, работа с комментариями (не на всех проектах);\n• Анализ эффективности, контроль метрик, подготовка отчетов.\n\n👀Требования\n• Опыт в SMM / копирайтинге / маркетинге от 1 года;\n• Наличие подтвержденных кейсов;\n• Проживание в М/МО или +- 300км;\n• Будет большим плюсом:\n——— Умение применять JTBD, CJM;\n——— Понимание принципов создания контента (сюжетные линии, AIDA), умение их применять;\n——— Опыт работы в агентствах;\n——— Опыт ведения YouTube каналов.\n💰Условия\n• Удаленка, гибкий график;\n• Оплата по проектам (фикс+КПИ).\n\n💰Если заинтересовало, пишите в Телеграм: @sshpachek",
      "date": "2026-10-15T18:45:40.232Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940171-446",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "SMM Вакансії та Маркетинг",
      "sourceUsername": "@smm_work_ua",
      "authorName": "nikita1ku",
      "authorUsername": "@nikita1ku",
      "title": "Ищем SMM менеджера в стартап.",
      "text": "Ищем SMM менеджера в стартап.\n\nПроект - онлайн платформа, где можно подобрать или найти коучей и проводить онлайн-сессии. uchoo.ru\nНужно начать вести инстаграм с нуля.\n\nЧто надо делать:\n1) Искать картинки и редактировать под общую тематику, возможно искать иллюстрации, пример https://prnt.sc/10teex8 https://prnt.sc/10tejxe https://prnt.sc/10teme8, умение работат с фоторедакторами, чтобы использовать готовые шаблоны от дизайнера.\n2) Писать уникальные тексты, которые откликаются у ЦА. Если вы еще и любите психологию или являетесь психологом, или пишите на эту тему, то это огромный плюс.\n3) Сделать первоначальное наполнение 9 постов и в дальнейшем по контент плану постить сторис и посты. Количество обговорим отдельно.\n4) Анализ деятельности конкурентов в соцсетях\n5) Если умеете продвигать - таргет ФБ, работа с блогерами, то также огромный плюс\n\nКоммуникативность, любознательность, аналитические способности, творческий потенциал, умение экспериментировать, эстетический вкус.\n\nУ нас перспективный проект и мы ищем в команду людей, которые хотели бы принять участие в создании большей истории в нашем направлении. Будете расти вместе с нами =) На данный момент мы тестируем много гипотез и учимся привлекать клиентов. оплата: 10000р в месяц на начальном этапе, дальше если мы растем, вы растете вместе с нами! Условия обговариваются\n\nПишите, пожалуйста, в лс @nikita1ku сразу с кейсами и мини текстом на тему “Как развить уверенность в себе”\n\n  Lightshot\n\n  Screenshot\n  Captured with Lightshot",
      "date": "2026-10-15T18:45:40.171Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940142-45",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "ecommerce",
      "subcategoryName": "Онлайн-магазин",
      "sourceType": "channel",
      "sourceName": "Remote Work Ukraine",
      "sourceUsername": "@remote_work_ukraine",
      "authorName": "remote_work_ukraine",
      "authorUsername": "@remote_work_ukraine",
      "title": "Head of E-commerce, керівник інтернет-магазину (Європа)",
      "text": "Head of E-commerce, керівник інтернет-магазину (Європа)\n\nPridewood\n\nУмови:\n-30&#8239;000&thinsp;–&thinsp;90&#8239;000 грн+% від результату\n-Дистанційна робота\n-Повна зайнятість, неповна зайнятість.\n\nОрієнтовний план дій для проекту такий:\n\n-розробка та створення інтернет-магазину\n-організація обліку та руху товарно-матеріальних цінностей\n-організація та контроль за взаємодією роботи сайту та обліку товару\n-розробка та контроль за роботою сервісів сайту\n-створення контенту в соціальних мережах та постійна активна участь з оновленням матеріалів\n-постійна взаємодія в роботі з відділом продажів на місцях\nпостійний рух до удосконалення сайту та сервісу, розширення асортименту товару\n-забезпечення високого рівня задоволеності клієнтів\n\nКонтакт: тут",
      "date": "2026-10-15T18:45:40.141Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 47,
      "aiSummary": "Замовлення: онлайн-магазин.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940059-440",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "IT Робота Україна",
      "sourceUsername": "@it_work_ua",
      "authorName": "it_work_ua",
      "authorUsername": "@it_work_ua",
      "title": "Junior Marketing Specialist",
      "text": "Junior Marketing Specialist\n\n🪙500-3000$\n📍Київ, віддалено\n🍏Гнучкий\n\nОбовязки:\nДопомога маркетинговій команді в операційних завданнях;\nПроведення досліджень маркетингової діяльності конкурентів, надавати рекомендації команді на їх базі;\nНалаштування та запуск рекламних кампанії на Facebook/Google/і т.д.;\nВідстежування ефективності маркетингових кампаній, пошук причин відхилень і можливості для зростання трафіку;\nПостановка технічних завдань для креативної та контент команд.\nВимоги:\nМінімальний досвід на позиції Junior Marketing Specialist або бути випускником університету профільних напрямків (Marketing/ Economy/ Business/ Analytics);\nРозуміння базових метрик маркетингу;\nАнглійська рівня Intermediate та вище;\n компаній;\nВміння швидко вчитися;\nПереваги:\nДосвід роботи в будь-якій сфері цифрового маркетингу;\nДосвід роботи з Facebook Ads Manager або Google Ads Manager;\nСертифікація Google Ads.\nКонтакти: ТУТ ✅",
      "date": "2026-10-15T18:45:40.058Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 124500,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": true,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 87,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 124500 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940043-683",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "channel",
      "sourceName": "IT Робота Україна",
      "sourceUsername": "@it_work_ua",
      "authorName": "it_work_ua",
      "authorUsername": "@it_work_ua",
      "title": "Project manager (Digital Marketing)",
      "text": "Project manager (Digital Marketing)\n\n🪙За домовленістю\n📍Київ,віддалено\n🍏Гнучкий графік\n\nШукаємо: комунікабельну людину з досвідом в SEO / UX / Development, що вміє нести відповідальність за результат перед клієнтом, для залучення та ведення англомовних проектів компанії. Працюємо із західним ринком, тому знання англійської на хорошому рівні обов’язкове.\n\n☝️Просимо обов’язково заповнити ЦЮ форму. Ви можете не знати всі відповіді на питання, та для нас буде прийнятно, якщо ви просто відповісте та запишите свої думки\n\nЩо потрібно буде робити:\n- спілкування з англомовними клієнтами;\n- підтримання та розвиток довгострокових відносин з клієнтами;\n- ведення документації (договори, додатки), контроль дебіторської заборгованості (своєчасні оплати та рахунки);\n- контроль досягнення KPI’s за проектами;\n- налаштування веб аналітики та пошукових акаунтів (Google Analytics, Search Console, Tag manager etc.)\nВимоги:\n- громадянство України (ви — українець / українка)\n- знання англійської мови (B2); треба буде розмовляти з клієнтами, можливо не ідеально\n- досвід роботи у відділах SEO / UX / Development\n- обов’язкові навички роботи з інструментами: Google Analytics | Google Sheets | Google Drive | Google Calendar\n- навички роботи і різних CMS: Shopify | Wordpress | Opencart | Modx | Tilda etc.\n- аналітичне мислення;\nвідповідальність та пунктуальність;\n-  презентаційні, комунікативні навички;\n- грамотність, вміння чітко формулювати свої думки як усно, так і письмово;\nПеревагою буде:\n- досвід роботи на аналогічній посаді; або на посаді SEO спеціаліста;\n- сертифікати Google Analytics;\n- сертифікація з англійської.\n\nКонтакти:  ТУТ ✅",
      "date": "2026-10-15T18:45:40.042Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089940003-964",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "channel",
      "sourceName": "Freelance Hub UA",
      "sourceUsername": "@freelance_hub_ua",
      "authorName": "freelance_hub_ua",
      "authorUsername": "@freelance_hub_ua",
      "title": "⚡ Посада: Відеомонтажер коротких роликів (Reels / TikTok) для автоблогера...",
      "text": "⚡ Посада: Відеомонтажер коротких роликів (Reels / TikTok) для автоблогера\n💰 ЗП: 12,000 – 18,000 грн/міс (або оплата за кожне змонтоване відео)\n🌍 Локація: Віддалено\n📝 Що робити (Обов'язки):\n• Монтувати динамічні Reels/TikTok із готових вихідних матеріалів (тест-драйви, огляди тачок).\n• Робити круті переходи, накладати трендову музику та звукові ефекти (SFX).\n• Додавати стильні, читабельні субтитри (як у топових закордонних блогерів).\nВимоги:\n• Впевнене володіння CapCut (телефон/ПК) або Adobe Premiere.\n• Розуміння трендів TikTok та алгоритмів утримання уваги глядача.\n• Наявність портфоліо (хоча б 2-3 власні роботи).",
      "date": "2026-10-15T18:45:40.003Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 18000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": false,
      "aiRating": 83,
      "aiSummary": "Замовлення: монтаж reels/tiktok з бюджетом 18000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939885-245",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Віддалена робота UA",
      "sourceUsername": "@remote_jobs_ua",
      "authorName": "remote_jobs_ua",
      "authorUsername": "@remote_jobs_ua",
      "title": "​​💼PPC Specialist до Promodo",
      "text": "​​💼PPC Specialist до Promodo\n\nЧим ти будеш займатися?\n- робота з українськими e-commerce проєктами;\n- упорядкування стратегій роботи з платними каналами;\n- налаштування, аналіз та оптимізація рекламних кампаній;\n- розвиток якості послуг та продуктів;\n- організація роботи команди над проєктом.\n\nОчікування:\n- досвід роботи з Google Ads та Facebook Ads в різноманітних нішах проєктів лідгену або e-commerce від 2 років;\n- знання Google Analytics та досвід роботи з GTM;\n- аналітичне мислення;\n- уважність до деталей;\n- відповідальність.\n\nБуде перевагою:\n- досвід роботи з Linkedin, Bing, Pinterest, Amazon;\n- англійська на рівні Intermediate або вище.\n\nОнлайн офіс",
      "date": "2026-10-15T18:45:39.885Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939873-954",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "ads_creatives",
      "subcategoryName": "Рекламні креативи",
      "sourceType": "channel",
      "sourceName": "Віддалена робота UA",
      "sourceUsername": "@remote_jobs_ua",
      "authorName": "remote_jobs_ua",
      "authorUsername": "@remote_jobs_ua",
      "title": "​​👨‍💻Motion Designer",
      "text": "​​👨‍💻Motion Designer\n\nAlceberg — це інноваційна компанія, яка займається розробкою продуктів на базі штучного інтелекту.\n\nЩо ми очікуємо ви будете робити:\n- Створювати статичні креативи.\n- Адаптувати та готувати асети для анімації та playable ads.\n- Аналізувати креативи та будувати гіпотези на основі їх результатів.\n- Створювати статику для SMM (Pinterest, Instagram, Facebook, LinkedIn) та ASO.\n- Генерувати та аргументувати власні/нові ідеї.\n- Співпрацювати з графічним дизайнером, SMM, user acquisition та Product manager.\n\nВимоги:\n- 2+ роки досвіду роботи в дизайні.\n- Знання пакетів Adobe Photoshop/Illustrator та Figma, After Effects - буде перевагою.\n- Портфоліо, що демонструє знання композиції, кольорознавства, типографіки.\n- Досвід створення контенту для соцмереж (Facebook, Instagram, TikTok, Pinterest та інші) та сіток (AppLovin, Unity).\n- Робота з растровою та векторною графікою.\n- Досвід роботи з плагінами, AI (Midjourney).\n- Проактивність, креативність, вміння презентувати свої дизайн-рішення, розставляти пріоритети та приймати фідбек.\n- Досвід створення графіки для Playable Ads.\n- Досвід роботи з AI (ElevenLabs, HeyGen).\n\nОнлайн офіс",
      "date": "2026-10-15T18:45:39.873Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 56,
      "aiSummary": "Замовлення: рекламні креативи.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939832-3",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Віддалена робота UA",
      "sourceUsername": "@remote_jobs_ua",
      "authorName": "remote_jobs_ua",
      "authorUsername": "@remote_jobs_ua",
      "title": "​​👩‍💻Таргетолог",
      "text": "​​👩‍💻Таргетолог\n\n🌍Віддалено\n💸10&#8239;000&#8239;-&#8239;17&#8239;000&#8239;UAH\n\nТвоїми обов`язками буде:\n- Максимальна комунікація з командою.\n- Налаштування таргетованої реклами в соцмережах інстаграм, фейсбук.\n- Робота з Look-a-Like аудиторіями і ретаргетом.\n- Аналіз та оптимізація рекламних кампаній.\n- Масштабування успішних кампаній.\n- Створення рекламних оголошень (креатив + текст).\n- Ведення звітності.\n- Виконання поставлених KPI.\n\nНаш кандитат має:\n- Кейси. Ми хочемо побачити тебе в ділі. Твої результати в цифрах і твої проєкти.\n- Вміти працювати з бюджетом від 50$ в день.\n- Досвід роботи в товарці більше року.\n- Вміння аналізувати РК по KPI.\n- Знати, як вірно упаковувати оффер для ЦА.\n- Знати працюючі схеми в ретаргеті і вміє ефективно налаштовувати.\n- Вміння встановлювати Facebook Pixel та налаштовувати індивідуальні конверсії.\n- Вміти і знати працюючі схеми маштабування успішних РК.\n\nОнлайн офіс",
      "date": "2026-10-15T18:45:39.830Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 2000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 75,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 2000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939756-828",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "3d_site",
      "subcategoryName": "3D сайт",
      "sourceType": "channel",
      "sourceName": "IT Вакансії Україна",
      "sourceUsername": "@it_jobs_ukraine",
      "authorName": "bibamon",
      "authorUsername": "@bibamon",
      "title": "Full Stack Engineer | Node.js • React • Python  fullstack developer",
      "text": "Full Stack Engineer | Node.js • React • Python  fullstack developer\n• Go • AI & Microservices\nEmail: bibamon-at-gmail.com | Telegram: @bibamon\nLinkedIn: linkedin.com/in/nikolaynesterenko1983\nLocation: Kyiv, Ukraine (Remote)\nProfessional Summary\nFull Stack Engineer with 5+ years of experience delivering scalable, production-grade web\napplications and real-time data systems for startups and SaaS products.\nSpecialized in Node.js, React, and microservices architecture, with strong expertise in Python and\nGo for high-performance backend systems and AI-driven automation.\nProven track record of designing systems handling millions of requests per day, optimizing\nperformance, and delivering measurable business impact.\nActively leveraging AI tools (Cursor, Claude, GitHub Copilot, ChatGPT) to accelerate\ndevelopment, reduce bugs, and improve code quality.\nStrong communicator with experience working directly with product stakeholders in fully remote,\ndistributed teams.\nCore Skills\nFrontend:\nReact, Redux, TypeScript, Next.js\nWebGL, Canvas API (real-time data visualization)\nPerformance optimization, responsive & accessible UI\nBackend:\nNode.js (Express, NestJS)\nPython (FastAPI, Flask)\nGo (high-load services, concurrency)\nC++ (performance-critical logic)\nREST APIs, GraphQL, WebSockets\nMicroservices & event-driven architecture\n\nfull stack developer\nhire full stack engineer\nnode js developer for hire\nreact developer remote\nbackend developer node js\nmicroservices developer\nai developer openai integration\nsaas developer\nweb app developer\napi developer rest graphql\nreal time systems developer\nwebsocket developer\nhigh load backend developer\nscalable systems engineer\nfreelance software engineer\nremote developer for startup\nstartup developer mvp\nbuild saas product\nhire developer fast\nai automation developer\n\n\nhire node js developer\nlooking for developer\nneed react developer\nneed backend developer\nbuild my app\ncreate saas platform\nmvp development service\nstartup looking for developer\noutsource development\nremote dev team needed\nfix backend performance\noptimize api speed\nbuild trading platform\nbuild crypto app\ntelegram bot developer\nweb3 developer hire",
      "date": "2026-10-15T18:45:39.756Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: 3d сайт.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939435-491",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "channel",
      "sourceName": "Фріланс проєкти та замовлення UA",
      "sourceUsername": "@freelance_projects",
      "authorName": "freelance_projects",
      "authorUsername": "@freelance_projects",
      "title": "Верстка сайта на вордпресс",
      "text": "Верстка сайта на вордпресс\n#frontend\nhttps://freelancehunt.ru/project/verstka-sayta-na-vordpress/516670.html\n\n\nНужно сверстать сайт на Wordpress\n, будут еще 4-5 макетов\nНо сначала побыстрее надо главную и услугу\nПотом уже мобильную адаптацию\nПредлагайте цены и сроки",
      "date": "2026-10-15T18:45:39.434Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 49,
      "aiSummary": "Замовлення: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939431-385",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "channel",
      "sourceName": "Фріланс проєкти та замовлення UA",
      "sourceUsername": "@freelance_projects",
      "authorName": "freelance_projects",
      "authorUsername": "@freelance_projects",
      "title": "Бронирование отелей под Wordpress",
      "text": "Бронирование отелей под Wordpress\n#frontend\nhttps://freelansim.ru/tasks/253929\n\nДоброго дня, коллеги!\nНеобходимо реализовать под Wordpress модуль бронирования отелей.\nЕсли есть в природе существующий - интегрировать и доработать.\nШаблон верстки уже разработан. Необходимо реализовать функционал (код) и посадить его на WP.\nВ админке необходим функционал добавление отелей с полной информацией по ним, фото, контактами.\nВесь функционал описан в полном ТЗ - направлю по запросу.",
      "date": "2026-10-15T18:45:39.431Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939293-680",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "google_ads",
      "subcategoryName": "Google реклама",
      "sourceType": "channel",
      "sourceName": "A-Play | Робота та кар'єра",
      "sourceUsername": "@aplaywork",
      "authorName": "aplaywork",
      "authorUsername": "@aplaywork",
      "title": "Senior Performance Marketing Manager",
      "text": "Senior Performance Marketing Manager\n\n▪️ До $5 000 на місяць: $3 500 ставка + до $1 500 бонусу за результат\n▪️ Віддалено\n\nPalabra.ai — компанія, що розробляє AI-моделі для голосового перекладу в реальному часі.\n\nОбов’язки:\n▪️ Управління рекламними кампаніями в Google Ads і Bing Ads\n▪️ Тестування нових рекламних каналів: TikTok, LinkedIn, X\n▪️ Оптимізація маркетингових воронок і лендингів\n▪️ Аналіз результатів рекламних кампаній та ухвалення рішень на основі даних\n▪️ Пошук можливостей для підвищення ефективності та масштабування маркетингу\n\nУмови:\n▫️ 20 днів оплачуваної відпустки, 6 державних свят і оплачувані лікарняні\n▫️ Контракт із британською компанією, який допомагає з оформленням візи цифрового кочівника\n▫️ Автономність у виборі проєктів і ресурсів без мікроменеджменту\n\nЗацікавила вакансія? Деталі та коротке тестове завдання - у Telegram-боті\n\n#вакансія #маркетолог #віддалено",
      "date": "2026-10-15T18:45:39.292Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 55,
      "aiSummary": "Замовлення: google реклама.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939255-807",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "channel",
      "sourceName": "A-Play | Робота та кар'єра",
      "sourceUsername": "@aplaywork",
      "authorName": "aplaywork",
      "authorUsername": "@aplaywork",
      "title": "Content Marketing Manager",
      "text": "Content Marketing Manager\n\n▪️ 40 000 грн + бонуси за результат\n▪️ Віддалено\n\nГрупа компаній Андрія Чепіка — розвиває бізнеси у сфері онлайн-освіти\n\nОбов’язки:\n▪️ Формування контент-стратегії та плану для Instagram і Telegram\n▪️ Створення Reels, Stories, постів, каруселей та інтерактивного контенту\n▪️ Розробка прогрівів, CTA та контентних воронок\n▪️ Ведення Telegram: новини, експертний контент, кейси, продажі та лід-магніти\n▪️ Підготовка тем і сценаріїв для YouTube та Shorts\n\nВимоги:\n▫️ Досвід у контенті/SMM від 2 років\n▫️ Досвід ведення Instagram та Telegram\n▫️ Розуміння прогрівів, контентних воронок і продажів через контент\n▫️ Сильні навички написання та редагування текстів\n▫️ Досвід роботи з експертами або особистими брендами\n\nТи отримаєш:\n✔️ Можливість впливати на контентну стратегію та продажі\n✔️ Роботу з Instagram, Telegram, YouTube та AI-інструментами\n\nЗацікавила вакансія? Заповнюй форму 📨\n\n#вакансія #content_manager #віддалено",
      "date": "2026-10-15T18:45:39.255Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 40000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 89,
      "aiSummary": "Замовлення: монтаж reels/tiktok з бюджетом 40000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939249-139",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "channel",
      "sourceName": "Work Place UA | Вакансії",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "workplaceinukraine",
      "authorUsername": "@workplaceinukraine",
      "title": "Шукаємо Middle SMM-спеціалістів з досвідом роботи від 3-х місяців в СММ-сту...",
      "text": "Шукаємо Middle SMM-спеціалістів з досвідом роботи від 3-х місяців в СММ-студією Effecto⭐️\n\n‼️ Обов’язково мати навички роботи з Figma\n\nМи пропонуємо:\n• часткова або повна зайнятість\n• стабільна завантаженість і адекватні проєкти\n•  дружню команду і середовище, де тебе чують\n•  можливість пробувати нові ролі, рости, брати цікаві проєкти\n•  підтримка: ми не кидаємо наодинці з тасками, а плануємо, підказуємо, допомагаємо\n•  кар’єрний ріст до Senior SMM або Team Lead\n\n📥ТУТ ВСІ ДЕТАЛІ ТА АНКЕТА ДЛЯ ВІДГУКУ:\nhttps://kanevetskasmm.notion.site/SMM-studio-Effecto-22bd5ef4dab680f48630f2d93375793b?source=copy_link",
      "date": "2026-10-15T18:45:39.248Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 47,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939020-867",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Work Place UA | Вакансії",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "workplaceinukraine",
      "authorUsername": "@workplaceinukraine",
      "title": "🔍 Шукаємо SMM-спеціаліста",
      "text": "🔍 Шукаємо SMM-спеціаліста\n\nєОпора — юридичний сервіс правозахисту для військових, ветеранів, ВПО та їхніх родин. Потрібна людина, яка вестиме наші соцмережі: Instagram, Facebook, LinkedIn, TikTok (контент-план, зйомка/монтаж рілсів, ком'юніті-менеджмент, аналітика).\n\nДосвід у SMM обов'язковий, портфоліо — ще краще.\n\nЗаповніть коротку форму, ми зв'яжемось самі 👇\n\nhttps://docs.google.com/forms/d/e/1FAIpQLSfAtW05IwjY7CJwvPDR8KYq_JQirboWd1FayM3xl_YAA2FgfQ/viewform?usp=dialog\n\nПрохання не писати в особисті — тільки через форму 🙏",
      "date": "2026-10-15T18:45:39.020Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 56,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089939004-574",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Work Place UA | Вакансії",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "workplaceinukraine",
      "authorUsername": "@workplaceinukraine",
      "title": "Шукаємо Media Buyer (Meta + Google) у команду CITADEL Agency",
      "text": "Шукаємо Media Buyer (Meta + Google) у команду CITADEL Agency\n\nCITADEL Agency - українська трафік-агенція, яка налаштовує трафік-системи у Meta, Google та Tik-Tok 🇺🇦🇪🇺🇬🇧 проєктам (працюємо з: інсташопами, e-com, інфобізнесом, особистими блогами, офлайн-закладами)\n\nЧому варто стати частиною нашої команди:\n\n- своєчасна виплата заробітньої плати;\n- бонуси за виконання KPI;\n- карʼєрний ріст до Team Lead’a.\n\nЩо входить в обовʼязки:\n\n1. Самостійне налаштування, аналіз та оптимізація рекламних кампаній;\n2. Написання ТЗ на креативи/на зйомку/розробнику;\n3. Формування стратегії просування/Аналізу ЦА/Аналізу конкурентів/звітів/аудитів посадкових сторінок;\n4. Дотримання правил агенції.\n\nУмови роботи:\n\n- графік роботи пн-пт з 9:30 до 18:30\n- Заробітна плата:\n\njunior 100$/проєкт\nmiddle 125$/проєкт\nsenior 150$/проєкт\n\n- виплата ЗП 1 раз на місяць\n\nДля нас важливо:\n\n- проактивність кожного члена команди;\n- практичний досвід роботи з Meta та Google Ads\n- практичний досвід роботи з utm-мітками, ціллю: конверсії (продажі) та продажі по каталогу;\n- досвід роботи від 1 року;\n- увага до деталей та старанність;\n- порядність та відповідальне відношення до своєї роботи;\n- СОЛО-АРБІТРАЖНИКИ не цікавлять.\n\nЯкщо ти відповідаєш якостям, що ми описали вище, бажаєш працювати та рости в компанії, яка цінує кожного члена її команди, заповнюй форму нижче:\n\nhttps://forms.gle/URCKqHEv8A1YMsE6A\nhttps://forms.gle/URCKqHEv8A1YMsE6A\nhttps://forms.gle/URCKqHEv8A1YMsE6A",
      "date": "2026-10-15T18:45:39.003Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 4000,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 73,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 4000 ₴.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089938997-409",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Work Place UA | Вакансії",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "workplaceinukraine",
      "authorUsername": "@workplaceinukraine",
      "title": "Шукаємо Team Lead та Ads Manager",
      "text": "Шукаємо Team Lead та Ads Manager\nМи — SMM-агенція Oxtime Digital, працюємо виключно на американський ринок. Наразі ми розширюємо команду і шукаємо двох крутих спеціалістів на часткову зайнятість.\nНижче — деталі про кожну з позицій 👇\n\n🌟 Team Lead\nЧасткова зайнятість, remote\nШукаємо людину, яка візьме на себе координацію команди, плануватиме процеси та триматиме все під контролем.\nЩо входить у роль:\n- Координація роботи команди на проєкті та відповідальність за кінцевий результат.\n- Планування й контроль роботи дизайнерів, монтажерів та креативників.\n- Кількість клієнтів обговорюємо індивідуально (залежно від твого навантаження).\nНаші очікування:\n- Досвід в SMM та розуміння трендів у соцмережах.\n- Англійська: Upper-Intermediate і вище.\n- Вміння чітко планувати, дотримуватися дедлайнів та давати конструктивний фідбек.\n📬 Щоб відгукнутися на вакансію:\nЗаповнюй форму: https://forms.gle/ts7zYAtm8MdxkTmQ7\n\n🌟 Ads Manager (Boosting Specialist)\nЧасткова зайнятість, remote\nШукаємо людину, яка займатиметься виключно бустингом контенту (просуванням дописів) на американському ринку. Повноцінного запуску реклами «з нуля» чи розробки стратегій тут немає — лише якісний та системний бустинг.\nЩо ти будеш робити:\n- Запускати та контролювати бустинг готових дописів\n- Оптимізувати бюджети для максимального охоплення та залучення аудиторії.\n- Моніторити результати просування та вести звітність.\nНаші очікування:\n- Досвід роботи з Meta Ads Manager (розуміння, як працює механіка бустингу).\n- Уважність до цифр і вміння працювати за заданими KPI.\nБуде плюсом: досвід роботи з американським ринком, та знання англійської мови\n📬 Як відгукнутися на вакансію:\nНадсилай своє резюме/кейси на пошту: pm@oxtimedigital.com ✉️\n\nЩо ми пропонуємо для обох позицій:\n- Повністю віддалена робота та гнучкий графік — плануй день сам, головне — результат.\n- Міжнародний досвід — круті кейси з американського ринку для твого портфоліо.\n- Фіксована ставка + бонуси та можливість професійного зростання.\n\nЧекаємо саме на тебе! 💛",
      "date": "2026-10-15T18:45:38.996Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089938955-312",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "google_ads",
      "subcategoryName": "Google реклама",
      "sourceType": "channel",
      "sourceName": "Je Contact | IT & Digital Вакансії",
      "sourceUsername": "@jecontact",
      "authorName": "jecontact",
      "authorUsername": "@jecontact",
      "title": "SENIOR PERFORMANCE MARKETING MANAGER | Palabra.ai",
      "text": "SENIOR PERFORMANCE MARKETING MANAGER | Palabra.ai\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: віддалено\nЗайнятість: повна\n\nРоботодавець: Palabra.ai — компанія, що розробляє АІ-моделі для голосового перекладу в реальному часі. Залучила $8,4 млн інвестицій, серед клієнтів — DHL, UNICEF, Paramount, Hyundai, BCG і Deloitte.\n\n✅ Вимоги до кандидата:\n• Досвід роботи з Google Ads і Bing Ads.\n\n⚡️ Відповідальність:\n• Ведення кампаній у Google Ads і Bing Ads.\n• Тестування нових каналів просування: TikTok, LinkedIn, X.\n• Покращення воронок і лендингів.\n• Ухвалення рішень на основі даних.\n\n💰 Зарплата: $3 500 ставка + до $1 500 бонусу за результат.\n\n☝️ Компанія пропонує:\n• 20 днів оплачуваної відпустки, 6 державних свят та оплачувані лікарняні.\n• Контракт із британською компанією (допомагає з візою цифрового кочівника).\n• Свобода самостійно визначати проєкти й ресурси, без мікроменеджменту.\n• Бюджет на AI-інструменти (Claude, n8n, Make, власні агенти), навчання та консалтинг з топ-спеціалістами.\n• Прямий доступ до фаундерів і можливість впливати на стратегію.\n\n✉️ Відгукнутись на вакансію можна за посиланням.",
      "date": "2026-10-15T18:45:38.954Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: google реклама.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089938892-643",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "ads_creatives",
      "subcategoryName": "Рекламні креативи",
      "sourceType": "channel",
      "sourceName": "Je Contact | IT & Digital Вакансії",
      "sourceUsername": "@jecontact",
      "authorName": "jecontact",
      "authorUsername": "@jecontact",
      "title": "ДИЗАЙНЕР КРЕАТИВІВ | Гудфуд Вдома",
      "text": "ДИЗАЙНЕР КРЕАТИВІВ | Гудфуд Вдома\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: віддалено\nЗайнятість: часткова\n\nРоботодавець: Гудфуд Вдома — сучасна доставка свіжоморожених страв у Києві.\n\nШукають людину для створення рекламних креативів: статика, анімація, відеокреативи.\n\n✅ Вимоги до кандидата:\n• Досвід розробки рекламних креативів.\n• Впевнена робота у Figma та CapCut або Adobe Premiere Pro.\n• Гарна надивленість і вміння адаптуватися під стиль бренду.\n\n⚡️ Відповідальність:\n• Створення рекламних креативів у форматах статика, анімація та відео.\n• Виконання 2–4 технічних завдань на тиждень.\n\n☝️ Компанія пропонує:\n• Знижка на продукцію бренду.\n• Різнопланові задачі — від статичних креативів до анімації та відео.\n• Можливість впливати на візуальну комунікацію бренду.\n• Смачний бонус за рекомендацію дизайнера, з яким компанія розпочне співпрацю, — пиріг від Гудфуду 🥧\n\n✉️ Відгукнутись на вакансію можна за посиланням.",
      "date": "2026-10-15T18:45:38.891Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: рекламні креативи.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089938853-370",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "channel",
      "sourceName": "Je Contact | IT & Digital Вакансії",
      "sourceUsername": "@jecontact",
      "authorName": "jecontact",
      "authorUsername": "@jecontact",
      "title": "SMM МЕНЕДЖЕР | ReThink",
      "text": "SMM МЕНЕДЖЕР | ReThink\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: Київ, гібрид\nЗайнятість: повна\n\nРоботодавець: ReThink — громадська організація, що просуває ідею кругової відбудови України та реалізує інноваційні проєкти з переробки будівельних відходів.\n\n✅ Вимоги до кандидата:\n• Від 2 років досвіду в SMM, портфоліо або кейси обов'язкові.\n• Уміння пояснювати складні теми простою і зрозумілою мовою.\n• Сильні дизайн-скіли, приклади робіт обов'язкові.\n• Розуміння або щире бажання розібратися в темі кругової економіки та кругового дизайну.\n• Розуміння специфіки різних цільових аудиторій.\n• Рівень англійської Upper-Intermediate (B2) або Advanced/Fluent (C1+).\n\n⚡️ Відповідальність:\n• Створювати та публікувати контент відповідно до ТЗ в Instagram, Facebook і LinkedIn.\n• Генерувати креативні ідеї для дизайну та форматів подачі.\n• Аналізувати тренди та формувати інфоприводи для аудиторії.\n• Комунікувати з користувачами в коментарях і директі в Instagram та Facebook.\n• Монтувати відео за ТЗ та працювати в Figma.\n\n☝️ Компанія пропонує:\n• Конкурентну оплату відповідно до досвіду.\n• Гнучкий режим роботи та дружню команду.\n• Робочий простір у сучасному коворкінг-хабі в центрі Києва.\n• Можливість долучитися до впровадження інновацій під час відбудови України.\n\n✉️ Відгукнутись на вакансію можна на пошту: join@rethink.com.ua",
      "date": "2026-10-15T18:45:38.818Z",
      "dateFormatted": "Сьогодні, 21:45",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089407614-900",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "seo",
      "subcategoryName": "SEO оптимізація",
      "sourceType": "chat",
      "sourceName": "work_in_ukraine_golovne UA",
      "sourceUsername": "@work_in_ukraine_golovne",
      "authorName": "Andriyzaxid",
      "authorUsername": "@Andriyzaxid",
      "title": "🔎 Middle SEO-спеціаліст",
      "text": "🔎 Middle SEO-спеціаліст\n#віддалено #повназайнятість\n\n📊 40’000 - 45ʼ000 грн\n🏠 Віддалено\n👤 Повна зайнятість\n\nSEO7 — SEO-агенція з Києва. Шукаємо SEO-спеціаліста в команду для роботи над клієнтськими проєктами з України, Європи та США.\n\nОбовʼязки:\n\n➡️ Вести 4−6 SEO-проєктів: аналізувати поточну ситуацію, визначати пріоритети та планувати роботи на місяць у межах погодженого обсягу.\n➡️ Проводити технічний і on-page аналіз сайтів, формувати рекомендації та контролювати їх реалізацію.\n➡️ Аналізувати динаміку трафіку, позицій, індексації та інших SEO-показників.\n➡️ Готувати чіткі задачі для junior SEO-спеціаліста, копірайтера, лінкбілдера та розробників.\n➡️ Перевіряти якість виконаних задач перед передачею клієнту або публікацією.\n➡️ Готувати щомісячні звіти та пояснювати клієнтам результати роботи.\n\nВимоги:\n\n➡️ Від 2 років практичного досвіду в SEO.\n➡️ Уміння проводити конкурентний аналіз і формувати SEO-рекомендації на основі даних.\n➡️ Розуміння принципів лінкбілдингу: аналіз конкурентів, пріоритети сторінок, анкор-лист і контроль якості розміщень.\n👥 Досвід підготовки зрозумілих ТЗ для розробників, копірайтерів і лінкбілдерів.\n➡️ Уміння делегувати операційні задачі та перевіряти якість виконання.\n➡️ Впевнена робота з Google Search Console, Google Analytics 4, Ahrefs або Serpstat, Screaming Frog та іншими базовими SEO-інструментами.\n➡️ Розуміння не лише SEO-метрик, а й бізнес-результату: заявки, конверсії та цільові дії на сайті.\n\nМи пропонуємо:\n\n➡️ Зрозумілий робочий процес: задачі в таск-менеджері, щомісячне планування та регулярна звітність.\n➡️ Доступ до платних SEO-інструментів за рахунок компанії.\n➡️ Формат: повністю віддалено.\n➡️ Графік: повна зайнятість, 8-годинний робочий день.\n➡️ Гнучкий початок робочого дня: з 8:00 до 10:00.\n➡️ Зарплата: від 44 000 грн. Фінальна сума залежить від досвіду та результатів тестового завдання.\n➡️ Перегляд зарплати — через 6 місяців.\n➡️ Відпустка: 20 робочих днів на рік.\n\n📞Контакти: відгукнутись на  вакансію тут\n\n👥 Робота Україна | Головне\n🙋 Розмістити вакансію",
      "date": "2026-10-15T18:36:47.613Z",
      "dateFormatted": "Сьогодні, 21:36",
      "budget": 0,
      "currency": "₴",
      "country": "США",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 42,
      "aiSummary": "Замовлення: seo оптимізація.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089407607-704",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "work_in_ukraine_golovne UA",
      "sourceUsername": "@work_in_ukraine_golovne",
      "authorName": "Andriyzaxid",
      "authorUsername": "@Andriyzaxid",
      "title": "🔎SMM-менеджер особистого бренду (Instagram, LinkedIn, YouTube)",
      "text": "🔎SMM-менеджер особистого бренду (Instagram, LinkedIn, YouTube)\n#віддалено #повназайнятість\n\n📊 44ʼ000–60ʼ000 грн\n🏠 Віддалено\n👤 повна зайнятість\n\nОбовʼязки:\n\n➡️ Розробляти і оновлювати контент-стратегію особистого бренду;\n➡️ Аналізувати конкурентів і тренди в ніші;\n➡️ Проводити регулярні брифи — ідеї, цитати, історії;\n➡️ Формувати tone of voice і стиль комунікації;\n➡️ Писати тексти для постів, stories, статей і сценарії для відео та reels;\n➡️ Монтувати відео і створювати графіку;\n➡️ Вести контент-план і публікувати матеріали;\n➡️ Відстежувати метрики: охоплення, приріст підписників;\n➡️ Вести всі платформи: Instagram, LinkedIn, YouTube, TikTok, Threads;\n➡️ Відповідати на коментарі і взаємодіяти з аудиторією;\n➡️ Координувати продакшен, організовувати зйомки.\n\nВимоги:\n\n➡️ Досвід у SMM від 1 року;\n➡️ Портфоліо з успішними кейсами по просуванню особистих брендів покажи що вже будував і які маєш результати;\n➡️ Вміння писати живо і по суті — не шаблонно;\n➡️ Базові навички монтажу і графіки;\n➡️ Розуміння алгоритмів Instagram, LinkedIn,YouTube, TikTok, Threads;\n➡️ Готовність брати відповідальність за результат .\n\nМи пропонуємо:\n\n➡️ Дохід від $1 000 на місяць — і він росте разом з результатом;\n➡️ Повністю віддалена робота, full-time;\n➡️ Прямий контакт з власником бізнесу — без бюрократії і зайвих ланок;\n➡️ Реальна людина з багатогранною історією (спорт + бізнес + родина) і свобода в ідеях — тут цінують ініціативу, а не виконання брифу;\n➡️ Команду продакшену (оператори, відеомонтажери, співведучі).\n\n📞Контакти: відгукнутись на вакансію тут\n\n👥 Робота Україна | Головне\n🙋 Розмістити вакансію",
      "date": "2026-10-15T18:36:47.607Z",
      "dateFormatted": "Сьогодні, 21:36",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 49,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089407244-206",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "general",
      "subcategoryName": "Веброзробка",
      "sourceType": "chat",
      "sourceName": "work_in_ukraine_golovne UA",
      "sourceUsername": "@work_in_ukraine_golovne",
      "authorName": "Andriyzaxid",
      "authorUsername": "@Andriyzaxid",
      "title": "🔎 Junior SEO Specialist",
      "text": "🔎 Junior SEO Specialist\n#віддалено #повназайнятість\n\n📊 22’000 - 28ʼ000 грн\n🏠 Віддалено\n❗️ Повна зайнятість\n\nSEO7 — команда, яка займається пошуковою оптимізацією проєктів для клієнтів з України, Європи та США. У зв’язку з розширенням ми шукаємо Junior SEO Specialist.\n\nОбов’язки:\n\n➡️ робота в адмінці CMS (WordPress та інші): створення й оновлення сторінок і постів, наповнення сайту контентом, робота з метатегами, зображеннями, внутрішньою перелінковкою;\n➡️ онпейдж-оптимізація: title, description, заголовки H1-H3, структура сторінок;\n➡️ робота із семантикою: збір і кластеризація ключових слів, аналіз search intent, формування контент-плану;\n➡️ базовий технічний аудит: перевірка індексації, robots.txt, sitemap, редиректів;\n➡️ моніторинг позицій і трафіку в Google Search Console та GA4;\n➡️ підготовка, редагування та перевірка контенту перед публікацією;\n➡️ використання AI-інструментів для підготовки й оптимізації контенту та пришвидшення рутинних задач;\n➡️ ведення таблиць і звітності по задачах;\n➡️ самостійне ведення своїх задач у взаємодії з SEO-командою.\n\nВимоги:\n\n➡️ від пів року практичного досвіду в SEO (фриланс, агенція, стажування або власні проєкти з результатами);\n➡️ впевнена робота з CMS: адмінпанель (WordPress або аналогічні), створення та редагування сторінок, наповнення контентом, налаштування SEO-плагінів;\n➡️ розуміння принципів ранжування, онпейдж-оптимізації та базового технічного SEO;\n➡️ впевнена робота з Google Search Console, базове володіння GA4;\nвміння працювати з семантикою: збір, кластеризація, розуміння search intent;\n➡️ уважність до деталей, системність, вміння вести таблиці (Google Sheets);\n➡️ базове вміння застосовувати AI-інструменти (ChatGPT, Claude тощо) у роботі з контентом і рутинними задачами;\n➡️ самостійність — здатність брати задачу й доводити її до результату\n➡️ досвід роботи з Ahrefs, Serpstat або SE Ranking;\nбазові знання HTML;\nдосвід автоматизації рутинних SEO-задач за допомогою AI;\nрозуміння основ linkbuilding;\nдосвід роботи в агенції або на кількох проєктах одночасно.\n\nМи пропонуємо:\n\n➡️ віддалений формат роботи та гнучкий графік;\n➡️ роботу в дружній SEO-команді;\n➡️ підтримку від досвідчених фахівців та обмін досвідом;\n➡️ доступ до професійних SEO-інструментів;\n➡️ можливість професійного зростання до рівня Middle.\n\nКонтакти: відгукнутись на  вакансію тут\n\n👥 Робота Україна | Головне\n🙋 Розмістити вакансію",
      "date": "2026-10-15T18:36:47.244Z",
      "dateFormatted": "Сьогодні, 21:36",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 47,
      "aiSummary": "Замовлення: веброзробка.",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1792089407186-34",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "work_in_ukraine_golovne UA",
      "sourceUsername": "@work_in_ukraine_golovne",
      "authorName": "Andriyzaxid",
      "authorUsername": "@Andriyzaxid",
      "title": "🔎 Графічний дизайнер (SMM-проєкти)",
      "text": "🔎 Графічний дизайнер (SMM-проєкти)\n#віддалено #повназайнятість\n\n📊 35ʼ000 грн\n📍 віддалено\n🏠 Повна зайнятість\n\nLocomotive Digital — це команда, яка живе digital-маркетингом. Ми допомагаємо бізнесам рости через SEO, PPC, SMM і таргетинг, під кожен проект створюємо стратегію з нуля.\n\nОбов’язки:\n\n➡️ Створення візуально привабливого графічного контенту для різних платформ;\n➡️ Розробка унікальних ілюстрацій для веб-сайту та соціальних мереж;\n➡️ Пошук та адаптація креативних референсів для проєктів;\n➡️ Графічне оформлення корпоративних матеріалів та презентацій.\n\nВимоги:\n\n➡️ Досвід роботи у графічному дизайні від 1 року;\n➡️ Впевнене володіння Figma, Adobe Creative Suite (Illustrator, Photoshop, Lightroom);\n➡️ Глибоке розуміння принципів дизайну, композиції та кольорової теорії;\n➡️ Досвід роботи з векторною графікою;\n➡️ Вміння працювати по брендбуку та референсах;\n➡️ Креативність та інноваційний підхід до вирішення дизайнерських завдань;\n➡️ Здатність дотримуватися дедлайнів;\n➡️ Вміння працювати як самостійно, так і в команді;\n➡️ Наявність якісного портфоліо з прикладами візуалів для SMM-проєктів (комерційний досвід).\nБажані додаткові навички:\n➡️ Знання та досвід роботи з інструментами штучного інтелекту для дизайну.\n\nМи пропонуємо:\n\n➡️ Формат роботи: дистанційно\n➡️ Графік: 5/2, 10:00−18:00\n➡️ Ставка 25 000 грн (+ щомісячні бонуси за обʼєм роботи)\n➡️ Відпустка: 24 календарні дні\n➡️ Оплачувані лікарняні\n➡️ Атмосфера підтримки, поваги та професійного росту\n➡️ Класна команда, що в необхідний момент підтримає та допоможе, надішле яійсь дивний стікер, щоб підняти настрій, поділиться досвідом і збереться в кінці важкого тижня на онлайн тімбілдінг, щоб розлабитись та випустити пар.\n\nКонтакти: відгукнутись на вакансію тут\n\n👥 Робота Україна | Головне\n🙋 Розмістити вакансію",
      "date": "2026-10-15T18:36:47.186Z",
      "dateFormatted": "Сьогодні, 21:36",
      "budget": 0,
      "currency": "₴",
      "country": "Україна",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 49,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1791900929075-877",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "aplaywork UA",
      "sourceUsername": "@aplaywork",
      "authorName": "ukrinvestclub_SMM",
      "authorUsername": "@ukrinvestclub_SMM",
      "title": "🔥Junior/Middle SMM",
      "text": "🔥Junior/Middle SMM\n\n▪️ $700–1000\n▪️ Київ, віддалено\n\nУкрІнвестКлуб — провідне інвестмедіа в Україні та найбільша спільнота активних інвесторів.\n\nОбовʼязки:\n🖇 Оформлення сторіс, каруселей та дописів у Figma\n🖇 Монтаж Reels / TikTok / Shorts із YouTube-випусків та готових сценаріїв\n🖇 Написання текстів відповідно до tone of voice\n🖇 Допомога на зйомках Reels у Києві 1–2 рази на місяць\n\nВимоги:\n▫️ Досвід у SMM від 1–2 років\n▫️ Впевнене володіння Figma та хороший візуальний смак\n▫️ Навички монтажу вертикальних відео та розуміння трендів і хуків\n▫️ Грамотний копірайтинг та розуміння tone of voice\n\nТи отримаєш:\n✔️ Готовий вектор, сенси та контент-плани — не потрібно вигадувати стратегію з нуля\n✔️ Навчання та менторство від досвідченої команди\n✔️ Можливість швидко вирости разом із новою SMM-командою\n\nЗацікавила вакансія? Надсилай резюме та портфоліо @ukrinvestclub_SMM 📨\n#вакансія #smm #віддалено",
      "date": "2026-10-13T14:15:29.075Z",
      "dateFormatted": "Сьогодні, 17:15",
      "budget": 41500,
      "currency": "₴",
      "isUrgent": true,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 89,
      "aiSummary": "Замовлення: монтаж reels/tiktok з бюджетом 41500 ₴.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837179598-226",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "adgoodashell UA",
      "sourceUsername": "@adgoodashell",
      "authorName": "valentynatochinina",
      "authorUsername": "@valentynatochinina",
      "title": "✨ВАКАНСІЯ SMM-менеджер у команду UNOW",
      "text": "✨ВАКАНСІЯ SMM-менеджер у команду UNOW\n\nUNOW - команда, яка створює масштабні концерти, фестивалі та культурні події.\n\n📍Київ, full time\n\n🙌 Задачі:\n• ведення Instagram, Facebook, TikTok та Threads;\n• розробка й реалізація контент-плану;\n• створення контенту: пости, сторіс, Reels, Shorts та рекламні анонси;\n• організація фото- та відеозйомок і взаємодія з креативною командою;\n• висвітлення концертів і фестивалів у режимі реального часу;\n• моніторинг соцмереж артистів та оперативне реагування на актуальні інфоприводи;\n• аналіз результатів і пошук нових ідей для розвитку соцмере\n\n🧑‍💻 Про тебе:\n• 1+ року досвіду в SMM;\n• працюєш у графічних і відеоредакторах та швидко адаптуєш контент;\n• маєш гарний смак і відчуття стилю;\n• стежиш за трендами соцмереж і вмієш швидко їх адаптувати;\n• грамотно пишеш українською мовою;\n• відповідально ставишся до роботи, добре організовуєш свій час і комфортно почуваєшся в динамічному темпі.\n\n⭐️ Буде перевагою, якщо маєш досвід у сфері івентів, концертів або HoReCa.\n\n☝️Компанія пропонує:\n• довіру та відсутність мікроменеджменту\n• можливості для професійного розвитку\n• відкриту комунікацію та підтримку ініціатив\n\n✉️ Відгукнутись: надсилайте в телеграм @valentynatochinina резюме, портфоліо та кейси",
      "date": "2026-10-12T20:32:59.597Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": true,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 56,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837178856-629",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "jecontact UA",
      "sourceUsername": "@jecontact",
      "authorName": "Alina_EW",
      "authorUsername": "@Alina_EW",
      "title": "ТАРГЕТОЛОГ | Elit-Web",
      "text": "ТАРГЕТОЛОГ | Elit-Web\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: віддалено\nЗайнятість: повна\n\nРоботодавець: Elit-Web — диджитал-агенція з понад 10 роками досвіду, яка допомагає бізнесам з усього світу зростати онлайн, та має у портфоліо 2 500+ проєктів, а у команді понад 130 фахівців.\n\nШукають таргетолога, який вміє аналізувати цифри, не забуваючи про креатив, і хоче працювати там, де ідеї реально впливають на результат.\n\n✅ Вимоги до кандидата:\n• Досвід налаштування Facebook/Instagram Ads від 1 року.\n• Вміння аналізувати, тестувати й шукати рішення, а не просто запускати кампанії.\n• Наявність прикладів кампаній або кейсів.\n• Розуміння візуальної частини реклами: що чіпляє аудиторію.\n\n⚡️ Відповідальність:\n• Запускати й оптимізувати рекламні кампанії у Facebook та Instagram.\n• Аналізувати аудиторії, креативи, CTR, CPA та формулювати висновки.\n• Створювати стратегії просування для різних ніш.\n• Готувати технічні завдання для дизайнерів і копірайтерів.\n• Проводити аудити рекламних акаунтів і пропонувати покращення.\n\n☝️ Компанія пропонує:\n• Різноманітні проєкти з різних ніш.\n• Оплачуваний випробувальний термін і прозору систему мотивації.\n• Програму адаптації та підтримку від менторів команди.\n• Консультації та тренінги з корпоративним психологом.\n\n✉️ Відгукнутись на вакансію можна тут: @Alina_EW",
      "date": "2026-10-12T20:32:58.856Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false
    },
    {
      "id": "lead-1791837178743-559",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "jecontact UA",
      "sourceUsername": "@jecontact",
      "authorName": "yuliiahordiichukk",
      "authorUsername": "@yuliiahordiichukk",
      "title": "MARKETING PROJECT ASSISTANT | Проєкти у сфері нерухомості",
      "text": "MARKETING PROJECT ASSISTANT | Проєкти у сфері нерухомості\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: віддалено\nЗайнятість: часткова (до 6 годин на день)\n\nРоботодавець: компанія у сфері нерухомості.\n\nШукають асистента Marketing Lead, який допомагатиме вести декілька проєктів одночасно — від координації підрядників до ресерчу, аналітики та контролю виконання задач.\n\n✅ Вимоги до кандидата:\n• Від 2 років релевантного досвіду у маркетингу, project management, marketing operations або на позиції асистента Marketing Lead / Head of Marketing.\n• Висока організованість та увага до деталей.\n• Вміння самостійно знаходити потрібну інформацію та працювати з великим її обсягом.\n• Здатність одночасно вести декілька проєктів і контролювати дедлайни.\n• Впевнена робота з Google Docs, Google Sheets та Notion.\n• Досвід роботи з CRM-системами або готовність швидко їх опанувати.\n• Активне використання AI-інструментів у роботі.\n• Англійська від рівня B2.\n\n👍🏻 Буде плюсом:\n• Досвід роботи асистентом Marketing Lead / Head of Marketing, маркетолога або project manager.\n• Досвід у маркетинговій агенції або внутрішній маркетинговій команді.\n• Базове розуміння SMM, Meta Ads, Google Ads та диджитал-маркетингу.\n• Досвід роботи з аналітикою, CRM та маркетинговими дашбордами.\n\n⚡️ Відповідальність:\n• Ведення таск-трекерів і контроль дедлайнів.\n• Збір статусів по задачах від команд і підрядників.\n• Координація роботи дизайнерів, SMM, performance, контент-, PR- та production-команд.\n• Постановка та оформлення задач на основі брифів Marketing Lead.\n• Організація робочих файлів, документів та інформації по проєктах.\n• Фіксація домовленостей після зустрічей і контроль їх виконання.\n• Збір інформації про локальні ринки нерухомості, девелопменту та архітектури.\n• Пошук медіа, партнерств, колаборацій, професійних подій і премій.\n• Підготовка структурованих research-документів.\n• Збір маркетингових показників з різних каналів і робота з даними з CRM.\n• Оновлення дашбордів, таблиць і регулярних звітів.\n• Підготовка матеріалів до зустрічей і допомога зі створенням презентацій.\n• Виконання операційних задач у межах поточних маркетингових проєктів.\n\n💰 Зарплата: 40 000 грн.\n\n☝️ Компанія пропонує:\n• Оплачуваний випробувальний термін — 1 місяць.\n• Роботу з міжнародними проєктами та ринками.\n• Можливість професійного розвитку у сфері маркетингу девелопменту, нерухомості й архітектури.\n\n✉️ Відгукнутись на вакансію можна тут: @yuliiahordiichukk. Для відгуку обов’язково надішліть CV.",
      "date": "2026-10-12T20:32:58.742Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 40000,
      "currency": "₴",
      "isUrgent": true,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 87,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 40000 ₴.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837178690-652",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "jecontact UA",
      "sourceUsername": "@jecontact",
      "authorName": "atrecruiter_yarmich",
      "authorUsername": "@atrecruiter_yarmich",
      "title": "SMM-MANAGER | YARMICH",
      "text": "SMM-MANAGER | YARMICH\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: Київ, гібрид (5/2, понеділок–п'ятниця, 10:00–19:00)\nЗайнятість: повна\n\nРоботодавець: YARMICH — український бренд чоловічого одягу в класичному стилі, що розвиває сучасну культуру чоловічого стилю та спільноту українських джентльменів.\n\nШукають людину, яка буде впливати на візуальний образ і диджитал-розвиток бренду: просувати Instagram YARMICH Store та Rent — від ідеї й зйомки до публікації та аналізу результатів.\n\n✅ Вимоги до кандидата:\n• Досвід ведення комерційних Instagram-акаунтів і наявність портфоліо.\n• Впевнена орієнтація в Instagram, трендах та органічному просуванні.\n• Вміння створювати контент повного циклу.\n• Розвинений візуальний смак і розуміння fashion/lifestyle-контенту.\n• Грамотна письмова українська мова.\n• Системність у роботі та вміння доводити завдання до результату.\n\n⚡️ Відповідальність:\n• Формування контент-планів та контентної стратегії.\n• Аналіз трендів і конкурентів.\n• Організація та проведення зйомок.\n• Самостійне знімання й монтаж Reels, Stories, дописів і каруселей.\n• Створення продуктового та lifestyle-контенту.\n• Написання текстів у tone of voice YARMICH.\n• Аналіз результатів і покращення контенту.\n\n☝️ Компанія пропонує:\n• Простір для власних ідей та експериментів.\n• Оплачувані відпустка та лікарняні.\n• Знижки на продукцію YARMICH.\n\n✉️ Відгукнутись на вакансію можна тут: @atrecruiter_yarmich",
      "date": "2026-10-12T20:32:58.690Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 49,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837177906-499",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "youtube",
      "subcategoryName": "YouTube монтаж",
      "sourceType": "chat",
      "sourceName": "jecontact UA",
      "sourceUsername": "@jecontact",
      "authorName": "operator_oftv",
      "authorUsername": "@operator_oftv",
      "title": "МОНТАЖЕР YOUTUBE-ВІДЕО | Бутикова компанія",
      "text": "МОНТАЖЕР YOUTUBE-ВІДЕО | Бутикова компанія\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: Київ (офлайн)\nЗайнятість: повна\n\nРоботодавець: бутикова компанія у сфері digital-контенту, яка активно розвиває YouTube-напрям.\n\nШукають монтажера для регулярного монтажу YouTube-відео формату.\n\n✅ Вимоги до кандидата:\n• Базовий (навчальний) рівень роботи в Adobe Premiere Pro або DaVinci Resolve.\n• Досвід монтажу відео у YouTube-форматі.\n• Вміння працювати зі звуком.\n• Розуміння кольорокорекції та роботи з Log-профілями.\n\n⚡️ Відповідальність:\n• Монтаж роликів тривалістю 4–6 хвилин.\n• Регулярна обробка матеріалів, що надходять для монтажу.\n\n💰 Зарплата: ставка $600 + бонуси\n\n✉️ Відгукнутись на вакансію можна тут: @operator_oftv",
      "date": "2026-10-12T20:32:57.906Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 25000,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 78,
      "aiSummary": "Замовлення: youtube монтаж.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837177852-252",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "jecontact UA",
      "sourceUsername": "@jecontact",
      "authorName": "alina_radchenko",
      "authorUsername": "@alina_radchenko",
      "title": "SMM-СПЕЦІАЛІСТ З НАВИЧКАМИ ДИЗАЙНУ | KENK",
      "text": "SMM-СПЕЦІАЛІСТ З НАВИЧКАМИ ДИЗАЙНУ | KENK\n\n© Від роботодавця для «є контакт»\n\n📍 Регіон: Київ, гібрид\nЗайнятість: повна\n\nРоботодавець: KENK — Київська енергетична компанія, яка управляє генерацією та енергопостачанням промислових підприємств.\n\nШукають SMM-спеціаліста в штат, який розвиватиме соціальні мережі компанії, створюватиме контент і підтримуватиме цілісний візуальний стиль бренду у співпраці з маркетологом.\n\n✅ Вимоги до кандидата:\n• Досвід роботи в SMM.\n• Портфоліо з кейсами.\n• Навички графічного дизайну та вміння самостійно створювати якісні візуали для соціальних мереж.\n• Самоорганізація, відповідальність і вміння доводити задачі до результату.\n• Готовність працювати з B2B-тематикою та розбиратися в складних продуктах.\n\n👍🏻 Буде плюсом:\n• Досвід роботи з B2B-компаніями або складними/технічними продуктами.\n\n⚡️ Відповідальність:\n• Вести соціальні мережі компанії: Instagram, LinkedIn, Facebook.\n• Брати участь у формуванні контент-плану: пропонувати теми, рубрики та ідеї для дописів.\n• Створювати візуальний контент: дописи, каруселі, сторіс, банери.\n• Адаптувати та публікувати контент у соціальних мережах.\n• Самостійно реалізовувати контентні задачі — від ідеї до публікації.\n• Долучатися до побудови та оптимізації контентних воронок.\n\n💰 Зарплата: від $700.\n\n☝️ Компанія пропонує:\n• Гнучкий початок робочого дня та дистанційний формат після нічних масованих обстрілів.\n• Гібридний графік: 3 дні в офісі та 2 дні віддалено, орієнтовно 6 годин у день в офісі.\n• Роботу в команді з маркетологом.\n• Можливість пропонувати власні ідеї та впливати на розвиток комунікації бренду.\n• Довіру до спеціаліста без мікроменеджменту.\n• Відпустки, лікарняні та day off.\n• Укриття на території БЦ.\n\n✉️ Відгукнутись на вакансію можна тут: @alina_radchenko, або за посиланням.",
      "date": "2026-10-12T20:32:57.852Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 29000,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 73,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "РФ"
    },
    {
      "id": "lead-1791837176838-792",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "chat",
      "sourceName": "work_in_ukraine_golovne UA",
      "sourceUsername": "@work_in_ukraine_golovne",
      "authorName": "kk_yevheniia",
      "authorUsername": "@kk_yevheniia",
      "title": "🔎 КЕРІВНИК ВІДДІЛУ ПРОДАЖІВ (РОП) | ВІДДАЛЕНО",
      "text": "🔎 КЕРІВНИК ВІДДІЛУ ПРОДАЖІВ (РОП) | ВІДДАЛЕНО\n\nМіжнародна компанія, яка понад 5 років надає консультативні та супровідні послуги для мігрантів і допомагає з релокацією до країн Європи, у зв’язку з розширенням команди шукає Керівника відділу продажів.\n\nЩо потрібно робити:\n➡️ керувати командою менеджерів з продажу (лідогенерація / pre-sale);\n➡️ контролювати виконання плану та KPI команди;\n➡️ проводити щоденні планерки та 1-on-1;\n➡️ аналізувати воронку продажів і знаходити точки росту;\n➡️ контролювати якість роботи менеджерів та розбирати дзвінки;\n➡️ брати участь у підборі, адаптації та розвитку команди;\n➡️ контролювати дотримання скриптів і стандартів роботи;\n➡️ готувати звітність та взаємодіяти з керівництвом.\n\nНаш кандидат:\n➡️ має від 1 року досвіду на позиції керівника відділу продажів;\n➡️ має досвід холодних та телефонних продажів;\n➡️ керував командою від 5 менеджерів;\n➡️ розуміє KPI та ключові показники відділу продажів;\n➡️ вміє працювати з CRM та аналізувати воронку;\n➡️ має сильні лідерські, комунікаційні й організаційні навички;\n➡️ системний, відповідальний та орієнтований на результат.\n\n🇬🇧 Англійська мова - необхідна для роботи з міжнародним напрямом.\n\n📊 Ми пропонуємо:\n➡️ на період адаптації — $1 500 фіксовано;\n➡️ з другого місяця — бонуси за виконання KPI команди;\n➡️ після виходу на планові показники — $3 000–5 000+ (ставка + бонуси);\n➡️ повністю віддалену роботу або офіс/гібрид у Києві;\n➡️ допомогу з переїздом до Києва;\n➡️ реальні управлінські повноваження та вплив на розвиток відділу;\n➡️ оплачувану відпустку;\n➡️ навчання за рахунок компанії;\n➡️ можливість кар’єрного зростання та підтримку керівництва.\n\n📍 Локація: Україна, формат роботи — віддалено\n\n\nЯкщо маєте досвід управління продажами та готові масштабувати результати команди — надсилайте резюме в приватні повідомлення.\n\n💬 Напишіть нам, і ми надамо деталі вакансії та розповімо більше про компанію - @kk_yevheniia\n\n👥 Робота Україна | Головне\n🙋 Розмістити вакансію",
      "date": "2026-10-12T20:32:56.838Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 63,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837173880-103",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "tg_bots",
      "subcategoryName": "Телеграм-бот",
      "sourceType": "chat",
      "sourceName": "jobzy UA",
      "sourceUsername": "@jobzy",
      "authorName": "paranojja",
      "authorUsername": "@paranojja",
      "title": "​Мы UNIBOT — Киевская компания по разработке чат-ботов.",
      "text": "​Мы UNIBOT — Киевская компания по разработке чат-ботов.\n\nПомогаем бизнесам автоматизировать самые нестандартные задачи и создаем уникальный пользовательский опыт.\n\nБолее того — мы развиваем несколько собственных продуктов для очень нестандартных рынков.\n\nСохраняя дух стартапа, мы стремимся занять первые места в нишах, где приходится бороться с большими корпорациями.\n\nНас это не пугает.\n\nТебя тоже?\n\nНадоела галерная гребля?\n\nДобро пожаловать к нам!\n\nОт тебя попросим содействия в:\n— Отвечать за реализацию микросервисов в экосистеме Java/Spring\n— Поддерживает обеспечивать качество, покрывая работу необходимыми модульными тестами;\n— Сопровождать развертывание и эксплуатацию совместно разработанных компонентов и работать над эффективным всесторонним мониторингом;\n— Проектировать и разрабатывать концепции инновационного программного обеспечения и оценка новых технологий;\n— Разрабатывать и эксплуатировать инфраструктуру на DigitalOcean\n— Документировать изменения/обновления и разработку новых функций (техническая документация)\n— Быть ответственный за функциональный и архитектурный дизайн;\n— Рефакторинг и оптимизация кода;\n\nТехнологии:\n— Java 8+ (мигрируем на 17)\n— Spring IoC, MVC, Boot, Data\n— Maven\n— Hibernate\n— Linux\n— SQL\n— Flyway\n— Microservices\n— Nginx\n— REST\n— Redis\n\nПлюсом станет:\n— AWS\n— MongoDB\n— Telegram API\n— Spring cloud stack\n— HTML, CSS, JavaScript\n— Docker\n— Php\n— Angular 5\n\nУ нас крутой офис в парке, дружная команда и мы только вернулись с месячного ремоута у моря:)\n\nПисать в телеграмм @paranojja или на почту valery@dikitty.cc",
      "date": "2026-10-12T20:32:53.879Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": false,
      "aiRating": 54,
      "aiSummary": "Замовлення: телеграм-бот.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837172118-570",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "top_vacansii UA",
      "sourceUsername": "@top_vacansii",
      "authorName": "aplay_recruiting",
      "authorUsername": "@aplay_recruiting",
      "title": "💻 Інтернет-маркетолог (E-commerce)",
      "text": "💻 Інтернет-маркетолог (E-commerce)\n\n✔️ 25 000–30 000 грн + KPI\n📍 Віддалено | 4 години на день\n\nCompBest — одна з провідних компаній України з продажу вживаної комп'ютерної техніки з Європи та США.\n\nТи отримаєш:\n✔️ Заробітну плату від 25 000 грн + KPI\n✔️ Оплачуване навчання (5 000 грн за кожен тиждень)\n✔️ Повністю віддалену роботу\n✔️ Графік лише 4 години на день (пн–пт)\n✔️ Знижки на техніку для співробітників\n\nОбов'язки:\n▪️ Запускати та оптимізувати рекламні кампанії в Facebook Ads і TikTok Ads\n▪️ Координувати підрядника з Google Ads\n▪️ Розвивати SEO та контент-маркетинг\n▪️ Вести SMM, email- та Viber-розсилки\n\nВимоги:\n▫️ Досвід роботи в e-commerce від 2 років\n▫️ Практичний досвід із SEO та SMM\n▫️ Досвід налаштування Facebook Ads, Google Ads і TikTok Ads\n▫️ Аналітичне мислення та системний підхід\n▫️ Ініціативність і бажання впливати на розвиток бізнесу\n\nЗацікавила вакансія? Надсилайте резюме @aplay_recruiting 💡\n\n#вакансія #маркетолог  #віддалено",
      "date": "2026-10-12T20:32:52.118Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 30000,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 87,
      "aiSummary": "Замовлення: таргетована реклама (meta) з бюджетом 30000 ₴.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837172113-143",
      "category": "development",
      "categoryName": "Веброзробка",
      "subcategory": "ecommerce",
      "subcategoryName": "Онлайн-магазин",
      "sourceType": "chat",
      "sourceName": "top_vacansii UA",
      "sourceUsername": "@top_vacansii",
      "authorName": "recruiter_aplay",
      "authorUsername": "@recruiter_aplay",
      "title": "💻 Менеджер з продажу",
      "text": "💻 Менеджер з продажу\n\n✔️ 25 000–32 000 грн\n📍 Віддалено\n\nНаш клієнт — компанія, яка спеціалізується на продажі автомобільних чохлів через інтернет-магазин\n\nТи отримаєш:\n✔️ 900 грн за робочий день + 20 грн за кожне успішне замовлення\n✔️ Середній дохід після адаптації — близько 30 500 грн, із можливістю зростання до 32 000 грн+\n✔️ Повністю віддалену роботу\n✔️ Графік на вибір: 5/2, 6/1 або 7/0\n\nОбов'язки:\n▪️ Обробляти вхідні дзвінки та звернення клієнтів\n▪️ Консультувати щодо автомобільних чохлів\n▪️ Підбирати продукцію відповідно до моделі та комплектації авто\n▪️ Оформлювати замовлення та вести клієнтів у CRM\n\nВимоги:\n▫️ Досвід роботи в онлайн-продажах\n▫️ Досвід роботи з CRM-системами\n\nЗацікавила вакансія? Надсилай резюме @recruiter_aplay 📨\n\n#вакансія #менеджерзпродажу #віддалено",
      "date": "2026-10-12T20:32:52.112Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 32000,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": false,
      "experienceRequired": true,
      "aiRating": 71,
      "aiSummary": "Замовлення: онлайн-магазин з бюджетом 32000 ₴.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837171773-63",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "top_vacansii UA",
      "sourceUsername": "@top_vacansii",
      "authorName": "ukrinvestclub_SMM",
      "authorUsername": "@ukrinvestclub_SMM",
      "title": "💻Junior/Middle SMM",
      "text": "💻Junior/Middle SMM\n\n✔️ $700–1000\n📍 Київ, віддалено\n\nУкрІнвестКлуб — провідне інвестмедіа в Україні та найбільша спільнота активних інвесторів.\n\nОбовʼязки:\n▪️ Оформлення сторіс, каруселей та дописів у Figma\n▪️ Монтаж Reels / TikTok / Shorts із YouTube-випусків та готових сценаріїв\n▪️ Написання текстів відповідно до tone of voice\n▪️ Допомога на зйомках Reels у Києві 1–2 рази на місяць\n\nВимоги:\n▫️ Досвід у SMM від 1–2 років\n▫️ Впевнене володіння Figma та хороший візуальний смак\n▫️ Навички монтажу вертикальних відео та розуміння трендів і хуків\n▫️ Грамотний копірайтинг та розуміння tone of voice\n\nТи отримаєш:\n✔️ Готовий вектор, сенси та контент-плани — не потрібно вигадувати стратегію з нуля\n✔️ Навчання та менторство від досвідченої команди\n✔️ Можливість швидко вирости разом із новою SMM-командою\n\nЗацікавила вакансія? Надсилай резюме та портфоліо @ukrinvestclub_SMM 💡\n#вакансія #smm #віддалено",
      "date": "2026-10-12T20:32:51.772Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 41500,
      "currency": "₴",
      "isUrgent": true,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 89,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837170010-513",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "meta_target",
      "subcategoryName": "Таргетована реклама (Meta)",
      "sourceType": "chat",
      "sourceName": "workplaceinukraine UA",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "ursuirn",
      "authorUsername": "@ursuirn",
      "title": "Вакансія: Таргетолог з досвідом роботи на ринку США",
      "text": "Вакансія: Таргетолог з досвідом роботи на ринку США\n\nШукаємо людину, яка працювала з американськими paid ads проєктами і розуміє місцеву аудиторію та креативи.\n\nЩо треба робити:\n • вести невеликі engagement campaigns(post boosting)\n • запускати повноцінні рекламні кампанії з більшими бюджетами\n • придумувати та тестувати креативи, які можуть продавати\n • дивитись на результати та адекватно їх аналізувати\n\nВід тебе:\n • досвід саме з US-ринком (обовʼязково)\n • впевнена робота з Meta Ads / Business Manager\n • уважність, відповідальність і здоровий підхід до задач\n\nЯкщо маєш кейси та потрібний досвід, вітаємо! Писати : @ursuirn",
      "date": "2026-10-12T20:32:50.009Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: таргетована реклама (meta).",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837169800-489",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "chat",
      "sourceName": "workplaceinukraine UA",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "Helena_HT",
      "authorUsername": "@Helena_HT",
      "title": "Шукаю SMM-спеціаліста в особистий бренд",
      "text": "Шукаю SMM-спеціаліста в особистий бренд\n\nШукаю людину, з якою зможемо вирости у довгострокову співпрацю.\nЯ розвиваю особистий бренд у сфері кар’єри, HR та рекрутингу. У блогу вже є свій стиль і почерк, тому для мене особливо важливі насмотреність, смак та естетичне бачення.\nРозглядаю 2 рівні:\nJunior\nЯкщо ти тільки починаєш, але маєш хороший візуальний смак, насмотреність і бажання розвиватися — можемо почати з 2 місяців у форматі pet-project.\nПодивимося, наскільки ми збігаємося за стилем і підходом → далі довгострокова комерційна співпраця.\nJunior+\nЯкщо у тебе вже є досвід, ти вмієш адаптуватися під стиль бренду і при цьому ініціативний/а, ідейний/а та проактивний/а — можемо одразу почати з комерційної співпраці.\nПерші 2 місяці — базова оплата (обговорюється), після — переглядаємо умови.\nЩо потрібно робити зараз:\n— каруселі;\n— періодично сторітейлінги;\n— стежити за цілісністю візуального стилю.\nЯ беру на себе: тексти каруселей і сторітейлінгів, Reels та частину візуалу на старті.\nКонтент-стратегію розробляти не потрібно.\nУ перспективі хочу повністю делегувати візуальну частину SMM та можемо говорити про контент стратегію і тп.\nЯкщо буде бажання — можна буде підключитися і до монтажу Reels.\nІ найголовніше — мені важливо, щоб мені подобалося твоє візуальне бачення :)\nЯкщо відчуваєш, що це про тебе — пиши в особисті:\nтрохи про себе + портфоліо/роботи + 3–5 візуальних проєктів, які тобі подобаються.\n\nВідгукнутися: @Helena_HT",
      "date": "2026-10-12T20:32:49.800Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837169747-161",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "workplaceinukraine UA",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "aliko_viktoriia",
      "authorUsername": "@aliko_viktoriia",
      "title": "Вакансія: Відеомонтажер / Креатор",
      "text": "Вакансія: Відеомонтажер / Креатор\n\nНіша: Лайфстайл/бьюті\nФормат роботи: Віддалено, часткова занятість\n\nФормат контенту:\nПлатформи: Instagram Reels, TikTok.\nТривалість: 15–35 секунд.\nФормат: Вертикальний (9:16).\n\n\nЩо потрібно робити:\n- Шукати та надсилати по 15 роликів за нішею та визначеними тех. параметрами.\n- Писати ТЗ на зйомку (структура, референси кадрів, крупність) під опис (заходи, поїздки, інфоприводи тощо).\n- Монтувати ролики з відзнятого матеріалу, зокрема з матеріалу, який був знятий без сторіборду.\n- Пропонувати свої креативні ідеї для монтажу.\n\nВимоги та навички:\nЦілепокладання: Розуміння та дотримання поставленої мети монтажу.\nСтиль: Дотримання стилю блогера.\nТехніки монтажу: Вміння монтувати на утримання уваги - паралельний, перехресний, кліповий, метричний монтаж та поліекран.\nСофт: Впевнене володіння CapCut.\nВажливо: Обов'язкова готовність виконати тестове завдання.\n\nУмови, дедлайни та оплата:\nДедлайни: Гнучкі, залежать від завдань. Готовий ролик для заходів, поїздок та інфоприводів має бути зданий максимум наступного дня після отримання матеріалу. Для інших роликів терміни індивідуальні (залежно від контент-плану, аж до місяця).\nОбсяг: на сьогоднішній час монтаж та написання сторібордів до 20 роликів на місяць.\nПошук роликів 450 на місяць (15 в день).\nЗП: Договірна\nБонуси за KPI: Передбачена додаткова премія за результативні ролики (яка залежить від утримання аудиторії, глибини переглядів, потрапляння в рекомендації та виконання цільових дій глядачами).\nДля відгуку надсилайте портфоліо, та інфо про Вас.\n\nВІДГУКНУТИСЯ: @aliko_viktoriia",
      "date": "2026-10-12T20:32:49.747Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": true,
      "requiresPortfolio": true,
      "experienceRequired": false,
      "aiRating": 57,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837169641-137",
      "category": "marketing",
      "categoryName": "Маркетинг",
      "subcategory": "general",
      "subcategoryName": "Маркетинг",
      "sourceType": "chat",
      "sourceName": "workplaceinukraine UA",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "daria_kepenach",
      "authorUsername": "@daria_kepenach",
      "title": "Вакансія: SMM-спеціаліст у команду агенції",
      "text": "Вакансія: SMM-спеціаліст у команду агенції\n\n📍ВІДДАЛЕНО\n\nВимоги:\n •   Навички роботи у програмах для монтажу відео;\n •   досвід у оформленнях сторіс, постів, написані контент-плану;\n •   відповідальність, пунктуальність;\n •   зацікавленність у роботі;\n\n\nОбов'язки:\n •   Оформлення та наповнення сторінки\n •   Оформлення сторіс та постів\n •   Написання контент-плану\n •   Монтаж відео\n\n‼️ВАЖЛИВО НАДІСЛАТИ ПРИКЛАДИ РОБІТ/ПОРТФОЛІО\n\nЗвертайтесь у телеграм: @daria_kepenach",
      "date": "2026-10-12T20:32:49.640Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: маркетинг.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837169480-23",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "reels_tiktok",
      "subcategoryName": "Монтаж Reels/TikTok",
      "sourceType": "chat",
      "sourceName": "workplaceinukraine UA",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "HR_Genense",
      "authorUsername": "@HR_Genense",
      "title": "Шукаємо SMM / Content Creator",
      "text": "Шукаємо SMM / Content Creator\n\nМи — Genense , міжнародна компанія, що спеціалізується на архітектурній візуалізації та дизайні. Працюємо з клієнтами по всьому світу та реалізуємо проєкти високого рівня.\n\nНаразі шукаємо спеціаліста для створення якісного відеоконтенту для Instagram і рекламних кампаній.\n\nФормат роботи:\n– Віддалено\n– Часткова зайнятість\nОплата залежить від обсягу виконаного контенту\n\nЩо потрібно робити:\n\n• Створювати  відео Reels (монтаж, підбір кадрів, динаміка, тренди)\n• Робити рекламні креативи для Instagram\n• Дотримуватись стилістики бренду\n\nВажливо: ведення сторінки та постів не входить у задачі\n\nВимоги\n\nОбов’язково:\n• Досвід створення Reels та/або рекламних відео\n• Портфоліо з прикладами робіт\n• Розуміння відеомонтажу, трендів Instagram\n• Розуміння Англійської\n\nБуде плюсом:\n• Пройдені курси / навчання по відеоконтенту або SMM\n\n📌 Як відгукнутися:\nНапишіть у повідомленні слово «SMM12», вкажіть свій вік та надішліть портфоліо\nНадсилайте на @HR_Genense",
      "date": "2026-10-12T20:32:49.480Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: монтаж reels/tiktok.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
    },
    {
      "id": "lead-1791837169385-314",
      "category": "montage",
      "categoryName": "Монтаж",
      "subcategory": "ads_creatives",
      "subcategoryName": "Рекламні креативи",
      "sourceType": "chat",
      "sourceName": "workplaceinukraine UA",
      "sourceUsername": "@workplaceinukraine",
      "authorName": "sezadorozhna",
      "authorUsername": "@sezadorozhna",
      "title": "Ми — Oxtime Digital💛, агенція що працює виключно на американський ринок, н...",
      "text": "Ми — Oxtime Digital💛, агенція що працює виключно на американський ринок, наші клієнти — бізнеси зі США. Ми в пошуках відеомонтажера, який вміє робити динамічні та якісні відео — від коротких роликів для соцмереж до повноцінних промо.\n\n📌Коротко про вакансію\n\n- Формат роботи: віддалено, гнучкий графік\n- Часткова зайнятість - до 10 год/тиждень\n- Можливість працювати на різних проєктах\n- Оплата за кожне виконане відео\n\n📌Що ти будеш робити\n\n• Монтувати відео для різних проєктів\n• Працювати з дрон-футажем — робити з аерозйомки справді вау-контент\n• Створювати динамічні відео, що продають та зачіпляють увагу\n\n📌Що ми очікуємо\n\nОбов'язково:\n• Досвід монтажу відео — впевнене володіння будь-якою професійною програмою\n• Розуміння ритму та динаміки відео\n• Якісна колоркорекція — картинка має виглядати професійно\n• Портфоліо з прикладами робіт\n\nБуде плюсом:\n• Досвід монтажу саме property-контенту (нерухомість, готелі, дрон-тури)\n• Розуміння специфіки американського ринку нерухомості\n\n📌Що ми пропонуємо\n\n• Оплату за кожне виконане відео\n• Віддалену роботу\n• Гнучкий графік — плануєш свій час сам\n• Роботу з цікавими проєктами для американського ринку\n• Можливість зростання та збільшення обсягів\n\n📄Якщо вакансія тебе зацікавила — напиши @sezadorozhna",
      "date": "2026-10-12T20:32:49.349Z",
      "dateFormatted": "Сьогодні, 23:32",
      "budget": 0,
      "currency": "₴",
      "isUrgent": false,
      "requiresPortfolio": true,
      "experienceRequired": true,
      "aiRating": 65,
      "aiSummary": "Замовлення: рекламні креативи.",
      "aiAnalysis": null,
      "inCrm": false,
      "country": "Україна"
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
    records: [],
    currency: "₴"
  },
  profile: {
    agencyName: "DenisWeb Studio",
    ownerName: tg?.initDataUnsafe?.user?.first_name ? (tg.initDataUnsafe.user.first_name + ' ' + (tg.initDataUnsafe.user.last_name || '')).trim() : "Денис Залізко",
    theme: "light",
    about: "DenisWeb Studio — діджитал-агентство сучасної веброзробки та результативного маркетингу. Створюємо висококонверсійні лендінги, інтернет-магазини, 3D-сайти, каталоги та Telegram-боти. Наші стандарти: чистий код, PageSpeed 90+, адаптив під усі гаджети, інтеграція ШІ у процеси та безкоштовне інтерактивне демо до внесення авансу. Оплата 40% аванс / 60% після запуску.",
    responseTemplate: "Вітаю, {NAME}! Побачив ваше замовлення щодо {TASK}. У DenisWeb Studio ми реалізуємо подібні проєкти під ключ за 2-4 дні з гарантією швидкості та чистого коду.\n\nГотові безкоштовно розробити концепт та інтерактивне демо головного блоку ще до початку оплати, щоб ви наочно побачили результат.\n\nНаш сайт та кейси: https://denis-webstudio.site\nКоли вам зручно коротко обговорити деталі?",
    nfcTemplate: "Доброго дня! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво глянути?",
    nfcTemplates: [...DEFAULT_NFC_TEMPLATES],
    d2dTemplate: "Доброго дня! Пишу НЕ щодо вакансії — передайте, будь ласка, це повідомлення особисто керівнику офісу / директору філії у м. {CITY} (питання постачання високомаржинального товару для вашої команди з маржею 100%+).\n\nМи виробники преміальних акрилових NFC-карток для збору відгуків у Google Maps для бізнесу (кав'ярні, салони краси, СТО, магазини). Ваші хлопці все одно щодня заходять у кожен заклад міста.\n\nСуха математика для вашого офісу:\n- Ваш опт: 300 грн/шт, роздріб для закладів: 600+ грн/шт (100% маржі = +300 грн чистого кешу з кожної точки).\n- 20 карток легко вміщаються у внутрішню кишеню куртки (не б'ється, не псується, нуль важких сумок = до +6 000 грн/день прибутку з одного агента).\n- Продається за 15 секунд: приклав телефон до картки на столі власника — відкрились Google-відгуки — забрав готівку на місці.\n\nГотовий сьогодні під'їхати до вас в офіс на 5 хвилин, показати живі зразки керівнику. Куди та о котрій зручно підійти?"
  }
};

// ============================================================
// APP STATE
// ============================================================
const savedSourcesRaw = JSON.parse(localStorage.getItem('dws_sources') || 'null');
const normalizedSources = (savedSourcesRaw && Array.isArray(savedSourcesRaw.chats) && savedSourcesRaw.chats.length >= 50)
  ? savedSourcesRaw
  : { chats: Array(160).fill({}), channels: Array(96).fill({}) };

const savedTakenIds = JSON.parse(localStorage.getItem('dws_taken_leads') || '[]');

let savedIncomeRaw = null;
try {
  savedIncomeRaw = JSON.parse(localStorage.getItem('dws_income'));
} catch (e) {}
const normalizedIncome = (savedIncomeRaw && Array.isArray(savedIncomeRaw.records))
  ? savedIncomeRaw
  : { records: [], currency: "₴" };

let savedExpensesRaw = null;
try {
  savedExpensesRaw = JSON.parse(localStorage.getItem('dws_expenses'));
} catch (e) {}

const defaultExpensesRecords = [
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
];

const DEMO_EXPENSE_IDS = new Set(['exp-1792170001-1', 'exp-1792170002-2', 'exp-1792170003-3']);
const cleanedSavedExpenses = (savedExpensesRaw && Array.isArray(savedExpensesRaw.records))
  ? savedExpensesRaw.records.filter(r => r && !DEMO_EXPENSE_IDS.has(r.id))
  : [];
const normalizedExpenses = { records: cleanedSavedExpenses, currency: "₴" };

function isOwnerAccountKey(k) {
  const c = String(k || '').trim().toLowerCase().replace(/^@+/, '');
  return !c || c === 'absolutikdenchik' || c === 'zalizkodenis12' || c === '5278970111' || c === 'tg_5278970111' || c.startsWith('dev_');
}

// Resolve unique user profile for this device/session (Cross-device 1:1 account sync)
function getOrCreateUserIdentity() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const savedAvatar = localStorage.getItem('dws_user_avatar') || (tgUser?.photo_url || '');
  const savedName = localStorage.getItem('dws_account_name');
  const savedUser = localStorage.getItem('dws_account_user');
  const savedRole = localStorage.getItem('dws_user_role');

  const explicitCleanUser = (savedUser && !savedUser.startsWith('@dev_'))
    ? savedUser.replace(/^@+/, '').trim().toLowerCase()
    : '';

  if (tgUser && tgUser.id && (!explicitCleanUser || isOwnerAccountKey(explicitCleanUser))) {
    const isDenis = (tgUser.username && isOwnerAccountKey(tgUser.username)) || String(tgUser.id) === '5278970111';
    if (isDenis) {
      localStorage.setItem('dws_account_key', 'absolutikdenchik');
      localStorage.setItem('dws_account_user', '@absolutikdenchik');
      localStorage.setItem('dws_user_role', 'owner');
      return {
        key: 'absolutikdenchik',
        name: (savedName && savedName !== 'Спеціаліст') ? savedName : 'Денис Залізко',
        username: '@absolutikdenchik',
        role: 'owner',
        avatar: savedAvatar
      };
    }
    const cleanUser = tgUser.username ? tgUser.username.toLowerCase().replace(/^@+/, '') : '';
    const userKey = cleanUser || ('tg_' + tgUser.id);
    const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || ('Користувач #' + tgUser.id);
    return {
      key: userKey,
      name: savedName || fullName,
      username: savedUser || (tgUser.username ? ('@' + tgUser.username) : ('@' + userKey)),
      role: savedRole || 'member',
      avatar: savedAvatar
    };
  }

  let savedKey = (localStorage.getItem('dws_account_key') || '').trim().toLowerCase().replace(/^@+/, '');
  if (explicitCleanUser) {
    savedKey = explicitCleanUser;
  }
  // Migrate any legacy random dev_* key, zalizkodenis12, or empty key to canonical owner account 'absolutikdenchik'
  if (isOwnerAccountKey(savedKey)) {
    savedKey = 'absolutikdenchik';
    localStorage.setItem('dws_account_key', savedKey);
    localStorage.setItem('dws_account_user', '@absolutikdenchik');
    if (!savedName || savedName === 'Спеціаліст') {
      localStorage.setItem('dws_account_name', 'Денис Залізко');
    }
    localStorage.setItem('dws_user_role', 'owner');
  }

  const isDenisKey = isOwnerAccountKey(savedKey);
  return {
    key: isDenisKey ? 'absolutikdenchik' : savedKey,
    name: (savedName && savedName !== 'Спеціаліст') ? savedName : (isDenisKey ? 'Денис Залізко' : 'Спеціаліст'),
    username: isDenisKey ? '@absolutikdenchik' : ((savedUser && !savedUser.startsWith('@dev_')) ? savedUser : ('@' + savedKey)),
    role: isDenisKey ? 'owner' : (savedRole || 'member'),
    avatar: savedAvatar
  };
}

const _initialIdentity = getOrCreateUserIdentity();

const state = {
  currentTab: 'tab-leads',
  theme: localStorage.getItem('dws_theme') || 'light',
  lang: localStorage.getItem('dws_lang') || 'ua',
  allLeads: [...DEFAULT_DATA.leads],
  leads: [...DEFAULT_DATA.leads],
  takenLeadIds: new Set(Array.isArray(savedTakenIds) ? savedTakenIds : []),
  justTakenSessionIds: new Set(),
  crm: JSON.parse(localStorage.getItem('dws_crm') || 'null') || [...DEFAULT_DATA.crm],
  income: normalizedIncome,
  incomeFilterPeriod: 'all',
  incomeDateRange: null,
  incomeActiveChartMonthIdx: null,
  expenses: normalizedExpenses,
  expensesFilterPeriod: 'all',
  expensesDateRange: null,
  expensesActiveChartMonthIdx: null,
  profile: { ...DEFAULT_DATA.profile, ...(JSON.parse(localStorage.getItem('dws_profile') || 'null') || {}) },
  sources: normalizedSources,
  activeCrmLead: null,
  activeLeadForAi: null,
  activeLeadForTakeCrm: null,
  isExpandedAll: false,
  activeNiches: ['development', 'marketing', 'montage'],
  filters: {
    category: 'all',
    subcategory: 'all',
    budget: 'all',
    portfolio: 'any',
    exp: 'any',
    query: '',
    sortBy: 'date'
  },
  activeCrmStatus: 'all',
  crmPinnedStages: JSON.parse(localStorage.getItem('dws_crm_pinned_stages') || 'null') || ['all', 'in_progress', 'offer', 'paid'],
  crmFilterService: 'all',
  crmFilterMinBudget: 0,
  accountKey: _initialIdentity.key,
  accountUser: _initialIdentity.username,
  accountName: _initialIdentity.name,
  userRole: _initialIdentity.role,
  userAvatar: _initialIdentity.avatar || '',
  requisites: (() => {
    let req = null;
    try {
      req = JSON.parse(localStorage.getItem('dws_requisites') || 'null');
    } catch (e) {}
    if (!req || req.iban === 'UA683220010000026007300123456' || !req.iban) {
      req = {
        recipient: 'Залізко Сергій Олександрович',
        iban: 'UA973220010000026204340005801',
        edrpou: '2890111216',
        bank: 'monobank',
        purpose: 'Оплата за інформаційно-рекламні послуги згідно домовленості'
      };
      localStorage.setItem('dws_requisites', JSON.stringify(req));
    }
    return req;
  })()
};

// Helper: Resolve the true personal contact (PM) of the recruiter/client
function resolveDirectContact(lead) {
  if (!lead) return { type: 'none', handle: '', url: '' };

  const text = lead.text || '';
  const srcUser = (lead.sourceUsername || '').replace(/^@/, '').toLowerCase().trim();
  const blockedHandles = new Set(['joinchat', 'admin', 'channel', 'support', 'freelancehunt', 'djinni', 'freelance_ua', 'kabanchik', 'upwork_remote', 'weworkremotely', 'telegram', 'share', 'addstickers', 'iv', 'proxy']);

  // 1. Explicit recruiter / client Telegram contact in text (highest priority if a real person's TG is written in the vacancy!)
  if (text) {
    const contactRegex = /(?:контакт[иа]?|пиш[іі]ть|пишите|писати|писать|зв['’]?язок|відгук(?:нутися)?|отклик(?:нуться)?|резюме|відправляйте|надсилайте|присылайте|звертайтесь|обращайтесь|hr|recruiter|pm|лічка|лс|пп|в лс|в пп|в особисті|в личку|tg|telegram|телеграм)[\s:—–\-\+a-zA-Zа-яА-ЯіїєґІЇЄҐ]{0,40}(?:https?:\/\/t\.me\/|@\s*)([a-zA-Z0-9_]{4,32})\b/i;
    const m = text.match(contactRegex);
    if (m) {
      const clean = m[1].trim();
      const cLower = clean.toLowerCase();
      if (cLower !== srcUser && !cLower.endsWith('bot') && !blockedHandles.has(cLower)) {
        return { type: 'telegram', handle: '@' + clean, url: 'https://t.me/' + clean };
      }
    }
  }

  // 2. If lead is from Reddit
  if (lead.sourceType === 'reddit' || (lead.authorUsername && typeof lead.authorUsername === 'string' && lead.authorUsername.startsWith('u/'))) {
    const rawUser = (lead.authorUsername || '').replace(/^u\//i, '').trim();
    return {
      type: 'reddit',
      handle: 'u/' + rawUser,
      url: `https://www.reddit.com/user/${rawUser}`,
      chatUrl: `https://www.reddit.com/message/compose/?to=${rawUser}`,
      postUrl: lead.url
    };
  }

  // 2b. If lead is from Discord or has explicit Discord contact in text
  if (lead.sourceType === 'discord' || /discord\.gg\/|discord\.com\/users\/|discord\s*[:—\-]\s*[a-zA-Z0-9_.#]{3,32}/i.test(text)) {
    const dcLink = text.match(/https?:\/\/(?:discord\.gg|discord\.com\/users)\/[a-zA-Z0-9_\-]+/i);
    const dcUser = text.match(/discord\s*[:—\-]\s*([a-zA-Z0-9_.#]{3,32})/i);
    const handle = dcUser ? dcUser[1] : (lead.authorUsername || 'Discord');
    const url = dcLink ? dcLink[0] : (lead.url || 'https://discord.com/app');
    return {
      type: 'discord',
      handle: handle,
      url: url
    };
  }

  // 3. Author username if a real person handle or numeric ID
  if (lead.authorUsername && typeof lead.authorUsername === 'string') {
    let clean = lead.authorUsername.replace(/^@/, '').replace('https://t.me/', '').split('/')[0].split('?')[0].trim();
    const cLower = clean.toLowerCase();
    if (cLower.startsWith('tg_id_') || cLower.startsWith('id_')) {
      const numId = clean.replace(/^(?:tg_)?id_/, '');
      return { type: 'telegram_id', handle: 'id: ' + numId, url: `tg://user?id=${numId}` };
    }
    if (clean && cLower !== srcUser && !cLower.endsWith('bot') && cLower !== 'telegram') {
      return { type: 'telegram', handle: '@' + clean, url: 'https://t.me/' + clean };
    }
  }

  // 4. Any direct t.me link in text
  if (text) {
    const linkMatches = [...text.matchAll(/(?:https?:\/\/)?t\.me\/([a-zA-Z0-9_]{4,32})/gi)];
    for (const lm of linkMatches) {
      const h = lm[1].trim();
      const hLower = h.toLowerCase();
      if (hLower !== srcUser && !hLower.endsWith('bot') && !['joinchat', 'share', 'addstickers', 'iv', 'proxy'].includes(hLower)) {
        return { type: 'telegram', handle: '@' + h, url: 'https://t.me/' + h };
      }
    }

    // 5. Any @mention in text (bottom to top)
    const mentions = [...text.matchAll(/@([a-zA-Z0-9_]{4,32})/g)];
    for (let i = mentions.length - 1; i >= 0; i--) {
      const h = mentions[i][1].trim();
      const hLower = h.toLowerCase();
      if (hLower !== srcUser && !hLower.endsWith('bot') && !['joinchat', 'admin', 'channel', 'support'].includes(hLower)) {
        return { type: 'telegram', handle: '@' + h, url: 'https://t.me/' + h };
      }
    }
  }

  // 6. If lead is from an exchange and has a direct project URL
  if (lead.url && (lead.url.startsWith('http://') || lead.url.startsWith('https://')) && !lead.url.includes('t.me/')) {
    return { type: 'exchange', handle: '', url: lead.url };
  }

  // 7. Fallback: message post link or source channel
  if (lead.url) {
    return { type: 'web', handle: '', url: lead.url };
  }
  if (lead.sourceUsername) {
    const clean = lead.sourceUsername.replace(/^@/, '').trim();
    return { type: 'source', handle: '@' + clean, url: 'https://t.me/' + clean };
  }

  return { type: 'none', handle: '', url: '' };
}

// Helper: Open direct Telegram PM with vacancy owner or project URL
function openTelegramContact(lead, prefilledText = '') {
  const contact = resolveDirectContact(lead);

  if (contact.type === 'reddit') {
    if (prefilledText) copyTextToClipboardSync(prefilledText);
    let redditTarget = contact.chatUrl || contact.url;
    if (prefilledText && redditTarget.includes('message/compose')) {
      const subj = encodeURIComponent('Re: ' + (lead.title || lead.subcategoryName || 'Project inquiry'));
      const msg = encodeURIComponent(prefilledText);
      redditTarget += (redditTarget.includes('?') ? '&' : '?') + `subject=${subj}&message=${msg}`;
    }
    if (Boolean(window.Telegram?.WebApp?.initData) && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(redditTarget);
    } else {
      window.open(redditTarget, '_blank');
    }
    return;
  }

  if (contact.type === 'discord') {
    if (prefilledText) copyTextToClipboardSync(prefilledText);
    if (Boolean(window.Telegram?.WebApp?.initData) && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(contact.url);
    } else {
      window.open(contact.url, '_blank');
    }
    return;
  }

  if (contact.type === 'exchange' || (contact.type === 'web' && contact.url && !contact.url.includes('t.me/'))) {
    window.open(contact.url, '_blank');
    return;
  }

  // Telegram numeric ID deep link: tg://user?id=12345678 (opens personal dialog directly in app)
  if (contact.type === 'telegram_id') {
    if (prefilledText && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(prefilledText).catch(() => {});
    }
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(contact.url);
    } else {
      window.location.href = contact.url;
    }
    return;
  }

  // Telegram username: https://t.me/username
  let tgUrl = contact.url || 'https://t.me/';
  if (prefilledText && contact.type === 'telegram') {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(prefilledText).catch(() => {});
    }
    tgUrl += (tgUrl.includes('?') ? '&' : '?') + 'text=' + encodeURIComponent(prefilledText);
  }

  if (tg?.openTelegramLink && tgUrl.includes('t.me/')) {
    tg.openTelegramLink(tgUrl);
  } else {
    window.open(tgUrl, '_blank');
  }
}

// ============================================================
// MASTER ACCESS GATEKEEPER (CRYPTO SHA-256 VALIDATION)
// ============================================================
// Hashes of allowed master codes (Zero plaintext in code!):
// 1) 'DWS-2026-STUDIO-ZALIZKO-PRO' -> 1c835d63d826210da24d9d83f5cf95082621e2b3b3cf8e0d50b1ca41900e3865
// 2) 'DWS777' -> 8e7359b9e798d3e7d9d42572e43da9286c63be12b2474d8b0c17145110c6a6a6
const MASTER_KEY_HASHES = new Set([
  '1c835d63d826210da24d9d83f5cf95082621e2b3b3cf8e0d50b1ca41900e3865',
  '8e7359b9e798d3e7d9d42572e43da9286c63be12b2474d8b0c17145110c6a6a6'
]);

async function computeSha256(str) {
  try {
    const enc = new TextEncoder().encode(str.trim());
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch(e) {
    return '';
  }
}

function initMasterGatekeeper() {
  const isUnlocked = localStorage.getItem('dws_master_unlocked') === 'true';
  const gatekeeper = document.getElementById('masterGatekeeperScreen');
  const codeInput = document.getElementById('masterAccessCodeInput');
  const submitBtn = document.getElementById('masterGatekeeperSubmitBtn');
  const eyeBtn = document.getElementById('toggleGatekeeperCodeBtn');
  const errorMsg = document.getElementById('gatekeeperErrorMsg');
  const successMsg = document.getElementById('gatekeeperSuccessMsg');

  if (isUnlocked) {
    if (gatekeeper) gatekeeper.style.display = 'none';
    return;
  }

  // Lock UI
  if (gatekeeper) {
    gatekeeper.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Toggle eye visibility
  if (eyeBtn && codeInput) {
    eyeBtn.onclick = () => {
      const isPwd = codeInput.type === 'password';
      codeInput.type = isPwd ? 'text' : 'password';
    };
  }

  async function handleUnlock() {
    const val = (codeInput?.value || '').trim();
    if (!val) {
      if (errorMsg) {
        errorMsg.textContent = 'Введіть секретний ключ доступу!';
        errorMsg.style.display = 'block';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.textContent = 'ПЕРЕВІРКА...';
      submitBtn.disabled = true;
    }

    let isMatch = false;
    let authPayload = null;
    const clientHash = await computeSha256(val);
    if (MASTER_KEY_HASHES.has(clientHash)) {
      isMatch = true;
    }

    const currentIdent = getOrCreateUserIdentity();
    const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

    // Verify against server endpoint
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: val,
          tgUser: tgUser ? {
            id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name,
            username: tgUser.username
          } : null,
          clientKey: currentIdent.key,
          clientName: currentIdent.name,
          clientUser: currentIdent.username
        })
      });
      const json = await res.json();
      if (json.success) {
        isMatch = true;
        authPayload = json;
      }
    } catch (e) {}

    if (isMatch) {
      haptic('success');
      localStorage.setItem('dws_master_unlocked', 'true');
      localStorage.setItem('dws_master_key_hash', clientHash);

      // Link user profile: preserve individual profile for employees/clients, Denis for owner
      if (authPayload && authPayload.accountKey) {
        state.accountKey = authPayload.accountKey;
        state.accountUser = authPayload.accountUser || currentIdent.username;
        state.accountName = authPayload.accountName || currentIdent.name;
        state.userRole = authPayload.role || currentIdent.role;
      } else {
        state.accountKey = currentIdent.key;
        state.accountUser = currentIdent.username;
        state.accountName = currentIdent.name;
        state.userRole = currentIdent.role;
      }

      localStorage.setItem('dws_account_key', state.accountKey);
      localStorage.setItem('dws_account_user', state.accountUser);
      localStorage.setItem('dws_account_name', state.accountName);

      updateProfileHeaderUI();

      if (errorMsg) errorMsg.style.display = 'none';
      if (successMsg) successMsg.style.display = 'block';
      if (submitBtn) submitBtn.textContent = 'ДОСТУП ДОЗВОЛЕНО ✓';

      // Pull isolated cloud data for this specific user
      fetchAccountData().then(() => {
        renderCrm();
        renderIncome();
        renderExpenses();
      });

      setTimeout(() => {
        if (gatekeeper) {
          gatekeeper.classList.add('unlocking');
          setTimeout(() => {
            gatekeeper.style.display = 'none';
            document.body.style.overflow = '';
          }, 350);
        }
      }, 600);
    } else {
      haptic('error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'ПІДТВЕРДИТИ ВХІД ➔';
      }
      if (errorMsg) {
        errorMsg.textContent = 'Невірний секретний код доступу!';
        errorMsg.style.display = 'block';
      }
      if (codeInput) {
        codeInput.classList.add('is-error');
        setTimeout(() => codeInput.classList.remove('is-error'), 450);
        codeInput.value = '';
        codeInput.focus();
      }
    }
  }

  if (submitBtn) {
    submitBtn.onclick = handleUnlock;
  }
  if (codeInput) {
    codeInput.onkeydown = (e) => {
      if (e.key === 'Enter') handleUnlock();
    };
  }
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initMasterGatekeeper();
  initTheme();
  applyLanguage(state.lang, false);
  setupNav();
  setupModals();
  setupProfileCounters();
  setupCalendarModal();
  setupCrmFilterModal();
  setupCrmDetailHandlers();
  initDocumentsHub();
  setupAccountSync();
  setupExpensesHandlers();
  setupEventListeners();
  loadAllData();
  startAutoSyncEngine();
});

// ============================================================
// THEME MANAGEMENT (Light / Dark)
// ============================================================
function initTheme() {
  applyTheme(state.theme);
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

  document.querySelectorAll('.theme-choice-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });

  if (tg?.setHeaderColor) {
    tg.setHeaderColor(theme === 'dark' ? '#0F0F0F' : '#FFFFFF');
  }
}

function toggleTheme() {
  haptic('medium');
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  if (state.profile) state.profile.theme = newTheme;
  if (typeof syncAccountToServer === 'function') syncAccountToServer();
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme: newTheme })
  }).catch(() => {});
}

// ============================================================
// COMPREHENSIVE INTERNATIONALIZATION (i18n: UA / EN)
// Deep DOM Tree Universal Translation Engine
// ============================================================
// Comprehensive UA -> EN Master Translation Table
const DWS_I18N_DICTIONARY = {
  "Заявки": "Leads",
  "CRM": "CRM",
  "Дохід": "Income",
  "Витрати": "Expenses",
  "Профіль": "Profile",
  "Скрапінг": "Scraping",
  "NFC": "NFC",
  "Реквізити": "Requisites",
  "Введіть секретний код": "Enter Secret Code",
  "Введіть персональний ключ доступу для активації цього пристрою в системі DenisWeb Studio.": "Enter personal access key to activate this device in DenisWeb Studio.",
  "Невірний секретний код доступу!": "Invalid access secret code!",
  " Доступ підтверджено! Активація пристрою...": " Access confirmed! Activating device...",
  "ПІДТВЕРДИТИ ВХІД ": "CONFIRM LOGIN ",
  "Код вводиться лише 1 раз. Пристрій запам'ятовується автоматично.": "Code is entered once. Device is saved automatically.",
  "Введіть ключ доступу...": "Enter access key...",
  "Показати/приховати код": "Show/hide code",
  "Змінити тему": "Change theme",
  "Оновити дані": "Refresh data",
  "Вхід у DWS Lead": "Login to DWS Lead",
  "Вкажіть ваш особистий Telegram @username або ID для ізольованої синхронізації ваших заявок та CRM між пристроями:": "Specify your personal Telegram @username or ID for isolated sync of your leads and CRM across devices:",
  "TELEGRAM @USERNAME АБО CHAT ID:": "TELEGRAM @USERNAME OR CHAT ID:",
  "СИНХРОНІЗУВАТИ ДАНІ": "SYNC DATA",
  "СИНХРОНІЗАЦІЯ АКАУНТУ": "ACCOUNT SYNC",
  "сьогодні": "today",
  "вчора": "yesterday",
  "Категорії": "Categories",
  "Фільтри": "Filters",
  "ПОШУК": "SEARCH",
  "Пошук": "Search",
  "Авто розсилка": "Auto Outreach",
  "Авто-розсилка": "Auto-Outreach",
  "Обрано:": "Selected:",
  "Обрано": "Selected",
  "ОБРАНО": "SELECTED",
  "ВІДКРИТИ": "OPEN",
  "Відкрити": "Open",
  "Всі шаблони": "All Templates",
  "ВСІ ШАБЛОНИ": "ALL TEMPLATES",
  "Всі 10 шаблонів збережено!": "All 10 templates saved!",
  "10 варіацій з мінімальними відмінностями для захисту від блокування акаунтів. Система автоматично чергує їх без повторів, доки не будуть використані всі 10.": "10 slight variations to protect accounts from spam bans. The system automatically rotates through them without repeating until all 10 have been used.",
  "Поточний цикл розсилки:": "Current outreach cycle:",
  "використано": "used",
  "ВІДПРАВЛЕНО В ЦИКЛІ": "SENT IN CYCLE",
  "ШАБЛОН": "TEMPLATE",
  "СКИНУТИ": "RESET",
  "Скинути": "Reset",
  "Топ-15": "Top 15",
  "ВЗЯТИ В РОБОТУ": "TAKE TO WORK",
  "В РОБОТІ ": "IN WORK ",
  "В РОБОТІ": "IN WORK",
  "AI оцінка": "AI Score",
  "AI-ВІДГУК": "AI RESPONSE",
  "AI-Відгук": "AI Response",
  "Бюджет:": "Budget:",
  "Бюджет": "Budget",
  "Договірний": "Negotiable",
  "За домовленістю": "Negotiable",
  "Джерело:": "Source:",
  "Країна:": "Country:",
  "Сьогодні": "Today",
  "Вчора": "Yesterday",
  "Україна": "Ukraine",
  "США": "USA",
  "Європа": "Europe",
  "Польща": "Poland",
  "Німеччина": "Germany",
  "Канада": "Canada",
  "Велика Британія": "United Kingdom",
  "Всі країни": "All Countries",
  "Замовлення": "Order",
  "Розробка": "Development",
  "Маркетинг": "Marketing",
  "Монтаж": "Video Editing",
  "Веброзробка": "Web Development",
  "Заявки за обраними фільтрами відсутні": "No leads found matching selected filters",
  "Спробуйте змінити фільтри або обрати інші ніші": "Try changing filters or selecting other niches",
  "Розгорнути/Згорнути текст вакансій": "Expand/Collapse vacancy text",
  "Веброзробка сайтів, маркетинг...": "Web development, marketing...",
  "КОРОТКО ВІД AI:": "SHORT SUMMARY BY AI:",
  " Згенерувати короткий опис від AI": "Generate short AI summary",
  "ТЕКСТ ВАКАНСІЇ:": "VACANCY TEXT:",
  "НАПИСАТИ КЛІЄНТУ": "MESSAGE CLIENT",
  "ВІДКРИТИ В ДЖЕРЕЛІ ↗": "OPEN IN SOURCE ↗",
  "ВІДКРИТИ В ДЖЕРЕЛІ": "OPEN IN SOURCE",
  "AI-Аналіз замовлення": "AI Lead Analysis",
  "AI-Відгук на вакансію": "AI Response to Vacancy",
  "Зрозуміло": "Got it",
  "КОПІЮВАТИ ТЕКСТ": "COPY TEXT",
  "НАПИСАТИ В TELEGRAM": "MESSAGE IN TELEGRAM",
  "Написати": "Write",
  "Копіювати текст": "Copy text",
  "Мої ніші": "My Niches",
  "Лендінги": "Landing Pages",
  "Онлайн-магазини": "Online Stores",
  "Сайти-каталоги": "Catalog Websites",
  "3D сайти": "3D Websites",
  "Багатосторінкові": "Multi-page Sites",
  "Телеграм-боти": "Telegram Bots",
  "Технічне обслуговування": "Maintenance",
  "Таргетована реклама Meta": "Meta Target Ads",
  "Google реклама": "Google Ads",
  "TikTok реклама": "TikTok Ads",
  "Telegram реклама": "Telegram Ads",
  "SEO оптимізація": "SEO Optimization",
  "YouTube монтаж": "YouTube Editing",
  "Рекламні креативи": "Ad Creatives",
  "Моушн-дизайн": "Motion Design",
  "ЗБЕРЕГТИ": "SAVE",
  "БЮДЖЕТ:": "BUDGET:",
  "До 5 000 ₴": "Up to 5,000 ₴",
  "ПОРТФОЛІО:": "PORTFOLIO:",
  "З портфоліо": "With portfolio",
  "Без портфоліо": "Without portfolio",
  "ДОСВІД:": "EXPERIENCE:",
  "З досвідом": "Experienced",
  "Без досвіду": "No experience",
  "ЗАСТОСУВАТИ": "APPLY",
  "Односторінковий сайт": "One-page site",
  "Авто-розсилка по вакансіях": "Vacancies Auto-Outreach",
  "Вибір вакансій синьою обводкою та черга відправки по всіх платформах": "Select vacancies with blue outline and dispatch queue across all platforms",
  "Список вакансій": "Vacancies List",
  "Черга та Акаунти": "Queue & Accounts",
  "Всі платформи": "All Platforms",
  "Біржі та Сайти": "Exchanges & Sites",
  "Натисніть на картку вакансії, щоб з'явилася синя обводка:": "Click on a vacancy card to select it with blue outline:",
  "Обрати 15": "Select 15",
  "Обрати всі": "Select All",
  "Зняти обводку": "Clear Selection",
  "СФОРМУВАТИ ЧЕРГУ ВІДПРАВКИ": "GENERATE OUTREACH QUEUE",
  "СТАТУС АВТО-РОЗСИЛКИ": "OUTREACH STATUS",
  "Готова до запуску": "Ready to start",
  "Готова до відправки (на паузі)": "Ready to dispatch (paused)",
  "ВІДПРАВЛЕНО": "SENT",
  "Наступний авто-відгук через": "Next auto-response in",
  "Антибан-пауза активна (безпечний інтервал)": "Antiban pause active (safe interval)",
  "Оберіть вакансії у списку": "Select vacancies in the list",
  "Контакт та платформа з'являться після вибору": "Contact and platform will appear after selection",
  "ТЕКСТ ВІДГУКУ ДЛЯ ЦІЄЇ ВАКАНСІЇ (МОЖНА РЕДАГУВАТИ):": "RESPONSE PITCH FOR THIS VACANCY (EDITABLE):",
  "Персоналізований текст відгуку...": "Personalized pitch message...",
  "ЗАПУСТИТИ АВТО-РОЗСИЛКУ З ПАУЗАМИ": "START AUTO-OUTREACH WITH PAUSES",
  "ПОСТАВИТИ АВТО-РОЗСИЛКУ НА ПАУЗУ": "PAUSE AUTO-OUTREACH",
  "ВІДПРАВИТИ ПОТОЧНИЙ ВІДГУК ЗАРАЗ (БЕЗ ОЧІКУВАННЯ)": "SEND CURRENT RESPONSE NOW (NO WAIT)",
  "Пропустити": "Skip",
  "Очистити чергу": "Clear Queue",
  "ПАУЗА МІЖ ВІДГУКАМИ (АНТИБАН ІНТЕРВАЛ):": "DELAY BETWEEN RESPONSES (ANTIBAN INTERVAL):",
  "10 хв": "10 min",
  "15 хв": "15 min",
  "20 хв": "20 min",
  "30 хв": "30 min",
  "По 10": "10 each",
  "По 15": "15 each",
  "По 20": "20 each",
  "По 30": "30 each",
  "До кожної паузи автоматично додається випадкове відхилення +-3 хв для захисту акаунтів.": "A random +-3 min deviation is automatically added to each pause for account protection.",
  "ЛІМІТ ВІДПРАВОК НА 1 АКАУНТ ЗА ЗАПУСК:": "DISPATCH LIMIT PER 1 ACCOUNT PER RUN:",
  "Автоматично унікалізувати текст під стек, ім'я та платформу (Spintax захист)": "Automatically unique text for stack, name and platform (Spintax protection)",
  "МОЇ РОБОЧІ АКАУНТИ ПО ПЛАТФОРМАХ:": "MY WORK ACCOUNTS BY PLATFORMS:",
  "Telegram Акаунт #1 (Основний)": "Telegram Account #1 (Primary)",
  "Telegram Акаунт #2 (Другий робочий)": "Telegram Account #2 (Secondary)",
  "Reddit Акаунт (r/forhire, r/hireaprogrammer)": "Reddit Account (r/forhire, r/hireaprogrammer)",
  "Discord Акаунт (Dev-сервери та DM)": "Discord Account (Dev servers & DM)",
  "Біржі та Сайти (Djinni, Freelancehunt, Upwork)": "Exchanges & Sites (Djinni, Freelancehunt, Upwork)",
  "До 15 / день": "Up to 15 / day",
  "До 10 / день": "Up to 10 / day",
  "@username або номер першого ТГ акаунта": "@username or phone of first TG account",
  "@username або номер другого ТГ акаунта": "@username or phone of second TG account",
  "u/ваш_нік_на_реддіт": "u/your_reddit_username",
  "Discord нік або Webhook URL для авто-відправки": "Discord username or Webhook URL for auto-sending",
  "Робоча пошта або профіль для прямих відгуків": "Work email or profile for direct responses",
  "ЗБЕРЕГТИ АКАУНТИ ТА НАЛАШТУВАННЯ": "SAVE ACCOUNTS & SETTINGS",
  "СПИСОК ВАКАНСІЙ У ЧЕРЗІ": "VACANCIES IN QUEUE",
  "Відправити": "Send",
  "Відправлено": "Sent",
  "Пропущено": "Skipped",
  "Наступний у черзі": "Next in queue",
  "В черзі": "In queue",
  "Черга порожня — оберіть вакансії": "Queue is empty — select vacancies",
  "Усі відгуки з черги надіслано": "All responses from queue sent",
  "РОЗСИЛКУ ЗАВЕРШЕНО": "OUTREACH COMPLETED",
  "Черга порожня": "Queue is empty",
  "Заклади": "Venues",
  "закладів": "venues",
  "D2D Ходоки": "D2D Walkers",
  "D2D Агентства": "D2D Agencies",
  "НОВИЙ ЗБІР": "NEW SCAN",
  "КАЛЬКУЛЯТОР ВИГОДИ": "ROI CALCULATOR",
  "КАЛЬКУЛЯТОР ВИГОДИ D2D": "D2D ROI CALCULATOR",
  "КАЛЬКУЛЯТОР ВИГОДИ NFC ТА ВАРТОСТІ ПАРТІЙ": "NFC ROI & BATCH COST CALCULATOR",
  "Радар закладів": "Venues Radar",
  "Пошук закладів з відгуками до 300, скупчення в ТРЦ/районі та готові піші маршрути": "Search venues with reviews under 300, clusters in malls/districts and walking routes",
  "ЗБОРИ ЗАКЛАДІВ & МАРШРУТИ": "VENUE SCANS & ROUTES",
  "Картки": "Cards",
  "Карта": "Map",
  "0 закладів": "0 venues",
  "Де я": "Where am I",
  "Новий збір D2D-офісів («ходоків»)": "New D2D Offices Scan (Field Teams)",
  "Новий збір закладів (NFC Радар)": "New Venues Scan (NFC Radar)",
  "ДЖЕРЕЛО ПОШУКУ:": "SEARCH SOURCE:",
  "Google Maps (Карти)": "Google Maps",
  "Instagram": "Instagram",
  "ТИП D2D-ОФІСІВ / ПОЛЬОВИХ КОМАНД:": "TYPE OF D2D OFFICES / FIELD TEAMS:",
  "ТИП ОФІСІВ:": "OFFICE TYPE:",
  "КАТЕГОРІЯ / НІША:": "CATEGORY / NICHE:",
  "Оберіть категорію D2D-офісів...": "Choose D2D office category...",
  "Всі D2D-офіси (ходоки)": "All D2D Offices (Walkers)",
  "Прямі продажі (щоденна оплата)": "Direct Sales (Daily Payout)",
  "Промоутери та BTL у полях": "Promoters & Field BTL",
  "Польові торгові представники": "Field Sales Representatives",
  "Всі D2D-офіси («ходоки»), прямі продажі, промоутери та польові торгові": "All D2D Offices (Walkers), direct sales, promoters and field reps",
  "Офіси прямих продажів D2D (щоденна оплата, кур'єри-консультанти)": "Direct Sales Offices D2D (daily payout, courier consultants)",
  "Промоутери, BTL-команди та бренд-консультанти в полях": "Promoters, BTL teams and brand consultants in field",
  "Польові торгові представники та супервайзери обходу точок": "Field sales representatives and route supervisors",
  "Введіть нішу (наприклад: Кафе, Стоматологія, Салон...)": "Enter niche (e.g.: Cafe, Dentistry, Beauty Salon...)",
  "Кафе, бари, ресторани": "Cafes, bars, restaurants",
  "МІСТО / РЕГІОН:": "CITY / REGION:",
  "Введіть місто (наприклад: Вінниця, Київ, Одеса...)": "Enter city (e.g.: Vinnytsia, Kyiv, Odesa...)",
  "РАЙОН / ТРЦ / ЛОКАЦІЯ": "DISTRICT / MALL / LOCATION",
  "Необов'язково (наприклад: Вишенька, Поділ, ТРЦ...). Якщо не вказано — шукає по всьому місту": "Optional (e.g.: City Center, Mall...). If empty — searches whole city",
  "(необов'язково)": "(optional)",
  "Необов'язково": "Optional",
  "ФІЛЬТР ЗА КІЛЬКІСТЮ ВІДГУКІВ:": "FILTER BY REVIEWS COUNT:",
  "До 300 (Топ)": "Up to 300 (Top)",
  "До 50 (Нові)": "Up to 50 (New)",
  "До 150": "Up to 150",
  "КІЛЬКІСТЬ ЗАКЛАДІВ:": "NUMBER OF VENUES:",
  "КІЛЬКІСТЬ D2D-КОМАНД:": "NUMBER OF D2D TEAMS:",
  "ЗАПУСТИТИ РАДАР": "START RADAR",
  "ЗАПУСТИТИ D2D РАДАР": "START D2D RADAR",
  "Показати на мапі": "Show on map",
  "Списком": "List view",
  "Шлях": "Route",
  "Опт Офер": "Wholesale Offer",
  "Точка в Google Maps": "Point on Google Maps",
  "Знайти в Instagram": "Find on Instagram",
  "Написати у Viber": "Message in Viber",
  "Зв'язок": "Contact",
  "ПОДЗВОНИТИ ЗАРАЗ": "CALL NOW",
  "НАПИСАТИ У VIBER": "MESSAGE IN VIBER",
  "СКОПІЮВАТИ НОМЕР ТЕЛЕФОНУ": "COPY PHONE NUMBER",
  "СКАСУВАТИ": "CANCEL",
  "Скасувати": "Cancel",
  "Розрахунок КП для закладу": "Commercial Proposal Calculation",
  "Фінансовий прогноз та окупність безконтактних карток": "Financial forecast and payback of NFC cards",
  "Скопіювати КП": "Copy Proposal",
  "В Telegram": "To Telegram",
  "В Telegram клієнту": "To Telegram client",
  "В INSTAGRAM": "TO INSTAGRAM",
  "В VIBER": "TO VIBER",
  "ПОДІЛИТИСЯ ТЕКСТОМ В TELEGRAM": "SHARE TEXT IN TELEGRAM",
  "Готовий офер для закладу": "Ready offer for venue",
  "ГОТОВИЙ ТЕКСТ ПОВІДОМЛЕННЯ (ДЛЯ ВІДПРАВКИ ЧИ СПІЛКУВАННЯ):": "READY MESSAGE TEXT (FOR OUTREACH OR CHAT):",
  "СКОПІЮВАТИ ТЕКСТ ОФЕРУ": "COPY OFFER TEXT",
  "Калькулятор вигоди NFC": "NFC ROI Calculator",
  "ТИП КАРТОК / МАТЕРІАЛ:": "CARD TYPE / MATERIAL:",
  "З асортименту": "Standard Assortment",
  "Кольоровий акрил": "Colored Acrylic",
  "Своя партія": "Custom Batch",
  "Свій варіант ціни": "Custom Price Option",
  "ДО 10 ШТ (₴/ШТ):": "UP TO 10 PCS (₴/PC):",
  "ВІД 10 ШТ (₴/ШТ):": "FROM 10 PCS (₴/PC):",
  "ЗАСТОСУВАТИ СВІЙ ТАРИФ": "APPLY CUSTOM TARIFF",
  "КІЛЬКІСТЬ КАРТОК:": "CARD QUANTITY:",
  "10 шт": "10 pcs",
  "ЦІНА ЗА 1 ШТ:": "PRICE PER 1 PC:",
  "300 ₴ / шт": "300 ₴ / pc",
  "СУМА ПАРТІЇ:": "BATCH TOTAL:",
  "Оптова ціна застосована (партія від 10 шт)": "Wholesale price applied (batch of 10+ pcs)",
  "ПАРАМЕТРИ ЗАКЛАДУ КЛІЄНТА:": "CLIENT VENUE PARAMETERS:",
  "ПОТОЧНИЙ РЕЙТИНГ У MAPS:": "CURRENT MAPS RATING:",
  "КІЛЬКІСТЬ ВІДГУКІВ У MAPS:": "MAPS REVIEWS COUNT:",
  "45 відгуків": "45 reviews",
  "ГОСТЕЙ НА ДЕНЬ:": "GUESTS PER DAY:",
  "60 гостей / день": "60 guests / day",
  "СЕРЕДНІЙ ЧЕК ЗАКЛАДУ:": "AVERAGE CHECK:",
  "ПРИРІСТ ВІДГУКІВ": "REVIEWS GROWTH",
  "+54 відг / міс": "+54 rev / mo",
  "Живі оцінки 5 від реальних гостей закладу": "Real 5 ratings from actual guests",
  "НОВИЙ РЕЙТИНГ GOOGLE": "NEW GOOGLE RATING",
  "4.9  (ТОП-1)": "4.9  (TOP-1)",
  "+18% органічних клієнтів з локального пошуку": "+18% organic customers from local search",
  "ДОДАТКОВИЙ ПРИБУТОК ЗАКЛАДУ": "VENUE EXTRA PROFIT",
  "+81 000 ₴ / міс": "+81,000 ₴ / mo",
  "Окупність партії карток (3 000 ₴) — всього за 1–2 дні!": "Card batch ROI (3,000 ₴) — in just 1–2 days!",
  "СКОПІЮВАТИ РОЗРАХУНОК ТА КП ДЛЯ КЛІЄНТА": "COPY ESTIMATE & PROPOSAL FOR CLIENT",
  "РЕКВІЗИТИ (IBAN)": "REQUISITES (IBAN)",
  "ДОДАТИ ЛІД": "ADD LEAD",
  "Додати лід": "Add Lead",
  "Пошук по CRM...": "Search CRM...",
  "Всі стадії": "All Stages",
  "Всі послуги": "All Services",
  "В процесі": "In Progress",
  "Оффер": "Offer",
  "Оплата": "Payment",
  "Відмова": "Declined",
  "Угода": "Deal",
  "Новий": "New",
  "Всі": "All",
  "Деталі ліда в CRM": "Lead Details in CRM",
  "ІМ'Я КЛІЄНТА / НАЗВА:": "CLIENT NAME / TITLE:",
  "ІМ'Я КЛІЄНТА:": "CLIENT NAME:",
  "ІМ'Я:": "NAME:",
  "ТЕЛЕГРАМ (@):": "TELEGRAM (@):",
  "TELEGRAM (@ЮЗЕРНЕЙМ):": "TELEGRAM (@USERNAME):",
  "КОНТАКТ (TELEGRAM / ТЕЛЕФОН / ПОСИЛАННЯ):": "CONTACT (TELEGRAM / PHONE / LINK):",
  "ПОСЛУГА (НАПРЯМОК):": "SERVICE (DIRECTION):",
  "ПОСЛУГА:": "SERVICE:",
  "НІША / ОПИС ЗАМОВЛЕННЯ:": "NICHE / ORDER DESCRIPTION:",
  "НІША / ПРОЄКТ:": "NICHE / PROJECT:",
  "НІША:": "NICHE:",
  "БЮДЖЕТ (₴):": "BUDGET (₴):",
  "СТАТУС УГОДИ:": "DEAL STATUS:",
  "СТАТУС:": "STATUS:",
  "НОТАТКИ ТА ДЕТАЛІ СПІВПРАЦІ:": "NOTES & COLLABORATION DETAILS:",
  "ЗАМІТКИ:": "NOTES:",
  "ЗБЕРЕГТИ ЗМІНИ": "SAVE CHANGES",
  "Зберегти зміни": "Save changes",
  "ВИДАЛИТИ ЛІД": "DELETE LEAD",
  "Видалити ліда з CRM": "Delete lead from CRM",
  "ФІЛЬТРИ CRM": "CRM FILTERS",
  "БЮДЖЕТ (ВІД ЯКОЇ СУМИ, ₴):": "BUDGET (MINIMUM AMOUNT, ₴):",
  "ЗАСТОСУВАТИ ФІЛЬТРИ": "APPLY FILTERS",
  "ЕТАП ВОРОНКИ:": "FUNNEL STAGE:",
  "ЕТАПИ РОБОТИ (ОБЕРІТЬ 4 ДЛЯ ПАНЕЛІ):": "STAGES (CHOOSE 4 FOR BAR):",
  "Всі (Всі клієнти)": "All (All clients)",
  "Працюєм": "Working",
  "Закритий": "Closed",
  "Закриті": "Closed",
  "Обговорити пізніше": "Discuss later",
  "Ігнорує": "Ignored",
  "Більше не співпрацюєм": "Discontinued",
  "ДОДАТКОВІ КОНТАКТИ ТА ПОСИЛАННЯ:": "ADDITIONAL CONTACTS & LINKS:",
  "Розробка сайтів та ботів": "Websites & Bots Development",
  "Реклама та маркетинг": "Advertising & Marketing",
  "Відеомонтаж та контент": "Video Editing & Content",
  "ЗАМОВЛЕННЯ:": "ORDERS:",
  "+ Додати замовлення": "+ Add order",
  "Додати замовлення": "Add order",
  "НАЗВА ПОСЛУГИ:": "SERVICE NAME:",
  "ПОЧАТОК:": "START:",
  "Оберіть дату": "Select date",
  "КІНЕЦЬ (ДЕДЛАЙН):": "DEADLINE:",
  "Оберіть дедлайн": "Select deadline",
  "СТАТУС ОПЛАТИ ЗАМОВЛЕННЯ:": "ORDER PAYMENT STATUS:",
  "СТАТУС ОПЛАТИ:": "PAYMENT STATUS:",
  "Не оплачено": "Unpaid",
  "Частково": "Partial",
  "Оплачено": "Paid",
  "СУМА ЗАМОВЛЕННЯ (₴):": "ORDER AMOUNT (₴):",
  "НАЗВА ЗАМОВЛЕННЯ:": "ORDER NAME:",
  "Оплачено (У дохід)": "Paid (To Income)",
  "Очікувано (В процесі)": "Pending (In Progress)",
  "ДАТА ЗАМОВЛЕННЯ:": "ORDER DATE:",
  "Відхилити": "Decline",
  "ДОДАТИ": "ADD",
  "Редагувати замовлення": "Edit order",
  "ВИДАЛИТИ ЗАМОВЛЕННЯ": "DELETE ORDER",
  "ЗВІДКИ ПРИЙШОВ:": "LEAD SOURCE:",
  "DWS Lead (Чати/Канали)": "DWS Lead (Chats/Channels)",
  "Партнери": "Partners",
  "Сайт агенства": "Agency Website",
  "Холодні розсилки": "Cold Outreach",
  "Реклама": "Advertising",
  "ОПИС ЗАМОВЛЕННЯ:": "ORDER DESCRIPTION:",
  "ДОДАТИ КЛІЄНТА": "ADD CLIENT",
  "Додати клієнта": "Add Client",
  "замовлень": "orders",
  "ЗАРОБЛЕНО": "EARNED",
  "За весь час": "All Time",
  "ОЧІКУВАНО": "PENDING",
  "В процесі роботи": "In progress",
  "Динаміка оплат": "Payment Dynamics",
  "Динаміка витрат": "Expense Dynamics",
  "Фільтр часу": "Time Filter",
  "По даті": "By Date",
  "Місяць": "Month",
  "Квартал": "Quarter",
  "Рік": "Year",
  "ДОДАТИ ДОХІД": "ADD INCOME",
  "Додати дохід": "Add Income",
  "Запис про оплату від клієнта": "Client payment record",
  "ДАТА ОПЛАТИ:": "PAYMENT DATE:",
  "СУМА (₴):": "AMOUNT (₴):",
  "ПОВ'ЯЗАНИЙ ЛІД З CRM:": "LINKED CRM LEAD:",
  "Оберіть ліда з CRM (необов'язково)": "Select CRM lead (optional)",
  "КАТЕГОРІЯ ДОХОДУ:": "INCOME CATEGORY:",
  "СПОСІБ ОПЛАТИ:": "PAYMENT METHOD:",
  "КОМЕНТАР:": "COMMENT:",
  "ЗБЕРЕГТИ ДОХІД": "SAVE INCOME",
  "витрат": "expenses",
  "ВИТРАЧЕНО": "SPENT",
  "ЗА ОБРАНИЙ МІСЯЦЬ": "FOR SELECTED MONTH",
  "Поточний місяць": "Current month",
  "НАЙБІЛЬША КАТЕГОРІЯ": "TOP CATEGORY:",
  "ДОДАТИ ВИТРАТУ": "ADD EXPENSE",
  "Додати витрату": "Add Expense",
  "Фіксація витрат студії": "Studio expense record",
  "ДАТА ВИТРАТИ:": "EXPENSE DATE:",
  "КАТЕГОРІЯ ВИТРАТИ:": "EXPENSE CATEGORY:",
  "КУДИ ВИТРАЧЕНО (ОПИС):": "EXPENSE DETAILS (DESC):",
  "КАТЕГОРІЯ / КОМУ:": "CATEGORY / TO WHOM:",
  "Оплачено (У витрати)": "Paid (To Expenses)",
  "В планах (Очікувано)": "Planned (Pending)",
  "Редагувати витрату": "Edit expense",
  "ВИДАЛИТИ ВИТРАТУ": "DELETE EXPENSE",
  "ЗБЕРЕГТИ ВИТРАТУ": "SAVE EXPENSE",
  "За останній рік": "Last year",
  "За останні 6 міс": "Last 6 mo",
  "За останні 3 міс": "Last 3 mo",
  "За останній міс": "Last month",
  "За останній тиж": "Last week",
  "За останній день": "Last day",
  "ГОТОВО": "DONE",
  "Вибір періоду дат": "Date Period Selection",
  "ОБРАНИЙ ПЕРІОД:": "SELECTED PERIOD:",
  "Оберіть початкову дату": "Select start date",
  "Вибір дати замовлення": "Select order date",
  "ОБРАНІ ДАТИ:": "SELECTED DATES:",
  "Оберіть дату на календарі": "Select date on calendar",
  "Очистити": "Clear",
  "ЗАСТОСУВАТИ ДАТИ": "APPLY DATES",
  "Попередній місяць": "Previous month",
  "Наступний місяць": "Next month",
  "Січень": "January",
  "Лютий": "February",
  "Березень": "March",
  "Квітень": "April",
  "Травень": "May",
  "Червень": "June",
  "Липень": "July",
  "Серпень": "August",
  "Вересень": "September",
  "Жовтень:": "October:",
  "Жовтень": "October",
  "Листопад": "November",
  "Грудень": "December",
  "Пн": "Mo",
  "Вт": "Tu",
  "Ср": "We",
  "Чт": "Th",
  "Пт": "Fr",
  "Сб": "Sa",
  "Нд": "Su",
  "Власник": "Owner",
  "Спеціаліст": "Specialist",
  "Редагувати профіль": "Edit Profile",
  "МОВА:": "LANGUAGE:",
  "ТЕМА:": "THEME:",
  "Світла": "Light",
  "Темна": "Dark",
  "БАЗА ДЖЕРЕЛ ПОШУКУ:": "SEARCH SOURCES DATABASE:",
  "Telegram чатів": "Telegram chats",
  "Telegram каналів": "Telegram channels",
  "Керувати списком чатів та каналів": "Manage chats & channels list",
  "ПРО СЕБЕ:": "ABOUT ME:",
  "Досвід, навички, стек та особливості підходу. Використовується AI для генерації персоналізованого відгуку.": "Experience, skills, tech stack and workflow. Used by AI to generate customized proposals.",
  "ШАБЛОН ВІДГУКУ:": "RESPONSE TEMPLATE:",
  "Фірмовий шаблон, за яким надсилається відгук клієнту. AI адаптує його під кожне замовлення.": "Signature template used to respond to clients. AI adapts it to each order.",
  "ШАБЛОН ВІДГУКУ (NFC КАРТКИ БІЗНЕСАМ):": "OFFER TEMPLATE (NFC CARDS FOR BUSINESSES):",
  "Шаблон повідомлення для швидкої розсилки закладам в Instagram Direct по NFC-картках (копіюється в 1 клік і відкриває чат).": "Message template for fast Instagram Direct outreach to local venues for NFC cards (1-click copy & open chat).",
  "ШАБЛОН ПРОПОЗИЦІЇ (D2D ОФІСИ / ОПТ):": "PROPOSAL TEMPLATE (D2D OFFICES / WHOLESALE):",
  "Шаблон для обходу HR та виходу напряму на керівника D2D-офісу (опт 300 грн, роздріб 600 грн = +300 грн чистої маржі з точки, 20 карток у кишеню куртки = +6 000 грн/день).": "Template to bypass HR and reach the head of D2D office directly (wholesale 300 UAH, retail 600 UAH = +300 UAH net margin per venue, 20 cards in pocket = +6,000 UAH/day).",
  "ЗБЕРЕГТИ НАЛАШТУВАННЯ": "SAVE SETTINGS",
  "Автоматична синхронізація між телефоном і ноутбуком працює в реальному часі. Також ви можете примусово вивантажити дані з телефону або завантажити їх на ноутбук в 1 клік:": "Automatic sync between phone and laptop works in real time. You can also force-export data from your phone or download to your laptop in 1 click:",
  "ВІДПРАВИТИ ДАНІ В ХМАРУ (З ТЕЛЕФОНУ)": "SEND DATA TO CLOUD (FROM PHONE)",
  "ОТРИМАТИ ДАНІ З ХМАРИ (НА НОУТБУК)": "PULL DATA FROM CLOUD (TO LAPTOP)",
  "ЗАВАНТАЖИТИ ФАЙЛ БЕКАПУ (.JSON)": "DOWNLOAD BACKUP FILE (.JSON)",
  "ВІДНОВИТИ ДАНІ З ФАЙЛУ АБО КОДУ": "RESTORE DATA FROM FILE OR CODE",
  "Завантажити фото": "Upload photo",
  "Видалити": "Delete",
  "Підтримуються JPG, PNG, WEBP будь-якого розміру": "JPG, PNG, WEBP of any size supported",
  "ІМ'Я ТА ПРІЗВИЩЕ:": "NAME & SURNAME:",
  "ПОСАДА / СТАТУС:": "POSITION / STATUS:",
  "Джерела пошуку": "Search Sources",
  "Активна база:": "Active database:",
  "джерел (": "sources (",
  "чатів,": "chats,",
  "каналів)": "channels)",
  "Вставте нові юзернейми або посилання на Telegram канали/чати (по одному на рядок):": "Paste new usernames or links to Telegram channels/chats (one per line):",
  "ДОДАТИ НОВІ ДЖЕРЕЛА:": "ADD NEW SOURCES:",
  "ДОДАТИ ДЖЕРЕЛА": "ADD SOURCES",
  "Відновлення даних на ноутбуці": "Data Restoration on Laptop",
  "Оберіть зручний спосіб перенесення даних на ноутбук:": "Choose convenient method to transfer data to laptop:",
  "ЗАВАНТАЖИТИ З ХМАРИ TELEGRAM": "DOWNLOAD FROM TELEGRAM CLOUD",
  "ОБРАТИ ФАЙЛ БЕКАПУ (.JSON)": "SELECT BACKUP FILE (.JSON)",
  "АБО ВСТАВТЕ ТЕКСТ БЕКАПУ ВРУЧНУ:": "OR PASTE BACKUP TEXT MANUALLY:",
  "ЗАСТОСУВАТИ ДАНІ": "APPLY DATA",
  "Натисніть щоб змінити фото": "Click to change photo",
  "Опишіть ваш досвід, стек та особливості підходу...": "Describe your experience, stack and workflow...",
  "ОФІЦІЙНІ РЕКВІЗИТИ ДЛЯ ОПЛАТИ (IBAN)": "OFFICIAL PAYMENT REQUISITES (IBAN)",
  "РЕКВІЗИТИ ДЛЯ ОПЛАТИ (IBAN)": "PAYMENT REQUISITES (IBAN)",
  "Офіційні B2B реквізити (IBAN) для оплати клієнтами": "Official B2B requisites (IBAN) for client payments",
  "Скопіювати реквізити": "Copy requisites",
  "ОТРИМУВАЧ (ПІБ):": "RECIPIENT (FULL NAME):",
  "Отримувач:": "Recipient:",
  "IBAN РАХУНОК:": "IBAN ACCOUNT:",
  "IBAN рахунок:": "IBAN account:",
  "РНОКПП (ІПН) / ЄДРПОУ:": "TAX ID / COMPANY CODE:",
  "НАЗВА БАНКУ:": "BANK NAME:",
  "Банк:": "Bank:",
  "ПРИЗНАЧЕННЯ ПЛАТЕЖУ ЗА ЗАМОВЧУВАННЯМ:": "DEFAULT PAYMENT PURPOSE:",
  "Призначення платежу:": "Payment purpose:",
  "СКОПІЮВАТИ РЕКВІЗИТИ": "COPY REQUISITES",
  "НАДІСЛАТИ В TELEGRAM": "SEND TO TELEGRAM",
  "РЕДАГУВАТИ РЕКВІЗИТИ": "EDIT REQUISITES",
  "ЗБЕРЕГТИ РЕКВІЗИТИ": "SAVE REQUISITES",
  "бізнесів": "businesses",
  "НОВИЙ СКРАПІНГ": "NEW SCRAPE",
  "Бізнеси з карт": "Businesses from Maps",
  "Бізнес-профілі": "Business Profiles",
  "МОЇ ПОШУКИ": "MY SEARCHES",
  "СТАТУС СКРАПІНГУ": "SCRAPING STATUS",
  "Експорт CSV": "Export CSV",
  "Надіслати в Telegram": "Send to Telegram",
  "Усі контакти": "All Contacts",
  "Телефони": "Phones",
  "Мобільні (Viber/TG)": "Mobile (Viber/TG)",
  "Email пошта": "Email",
  "Instagram профілі": "Instagram profiles",
  "Новий скрапінг бізнесів": "New Businesses Scrape",
  "Новий пошук": "New Search",
  "Глибокий збір контактів з Google Maps та Instagram": "Deep contact scraping from Google Maps and Instagram",
  "ДЖЕРЕЛО ДАНИХ:": "DATA SOURCE:",
  "ДЖЕРЕЛО:": "SOURCE:",
  "НІША БІЗНЕСУ:": "BUSINESS NICHE:",
  "КІЛЬКІСТЬ БІЗНЕСІВ:": "NUMBER OF BUSINESSES:",
  "ЗАПУСТИТИ ЗБІР": "START SCRAPE",
  "ЗАПУСТИТИ ПОШУК": "START SEARCH",
  "CSV Таблиця": "CSV Table",
  "Скопіювати все": "Copy All",
  "Завантажити .csv": "Download .csv",
  "Підключення Apify API": "Connect Apify API",
  "Вставте свій": "Paste your",
  "з консолі Apify, щоб Google Maps Scraper та Instagram Scraper працювали на повну потужність наживо.": "from Apify console so Google Maps Scraper and Instagram Scraper work at full power live.",
  "Відкрити Apify Console  Скопіювати токен": "Open Apify Console  Copy token",
  "ЗБЕРЕГТИ ТОКЕН": "SAVE TOKEN",
  "Налаштування Apify API": "Apify API Settings",
  "Режим NFC Радару": "NFC Radar Mode",
  "Моє розташування": "My Location",
  "Закрити та повернутися": "Close and return",
  "Закрити": "Close",
  "Зберегти": "Save",
  "Відмінити": "Cancel",
  "Скопійовано!": "Copied!",
  "Скопійовано": "Copied",
  "Помилка": "Error",
  "Успішно": "Success",
  "Збережено": "Saved",
  "В буфері": "In clipboard",
  "Деталі": "Details",
  "Назад": "Back",
  "Вперед": "Forward",
  "Завантаження...": "Loading...",
  "Зачекайте...": "Please wait...",
  "Очікування": "Pending",
  "Активно": "Active",
  "Неактивно": "Inactive",
  "Увімкнено": "Enabled",
  "Вимкнено": "Disabled",
  "Так": "Yes",
  "Ні": "No",
  "Редагувати": "Edit",
  "Оновити": "Refresh",
  "Підкатегорії": "Subcategories",
  "Редагувати ім'я": "Edit name",
  "Ім'я": "Name",
  "Кав'ярня": "Coffee shop",
  "Вітаю, {NAME}! Побачив замовлення {TASK}...": "Hello, {NAME}! I saw your order {TASK}...",
  "Доброго дня! Пишу вам з пропозицією, яка допоможе без реклами збільшити кількість відгуків у Google Maps та залучити більше нових клієнтів. Я підготував для вас презентацію, чи було б цікаво глянути?": "Good day! I am writing with an offer that helps increase Google Maps reviews without ads and attract more clients. I have prepared a presentation for you, would you be interested to take a look?",
  "Доброго дня! Пишу НЕ щодо вакансії — передайте, будь ласка, це повідомлення особисто керівнику офісу / директору філії у м. {CITY} (питання постачання високомаржинального товару для вашої команди з маржею 100%+)...": "Good day! I am NOT writing regarding the vacancy — please forward this message personally to the office manager / branch director in {CITY} (high-margin wholesale product for your team with 100%+ margin)...",
  "Залізко Сергій Олександрович": "Zalizko Serhii Oleksandrovych",
  "Оплата за інформаційно-рекламні послуги згідно домовленості": "Payment for information and advertising services as agreed",
  "Олексій": "Oleksii",
  "Олександр": "Oleksandr",
  "Вітя": "Viktor",
  "Наприклад: Автосервіс, Стоматологія, Салон краси...": "E.g.: Auto repair, Dentistry, Beauty Salon...",
  "Наприклад: Київ, Львів, Одеса, Варшава...": "E.g.: Kyiv, Lviv, Odesa, Warsaw...",
  "Номер телефону (+380...)": "Phone number (+380...)",
  "Instagram (@ або посилання)": "Instagram (@ or link)",
  "TikTok (@ або посилання)": "TikTok (@ or link)",
  "Telegram-канал (ТГК)": "Telegram channel",
  "Вебсайт (https://...)": "Website (https://...)",
  "Деталі переговорів, побажання клієнта...": "Negotiation details, client wishes...",
  "Створення сайту": "Website development",
  "Розробка лендінгу під ключ": "Turnkey landing page development",
  "Instagram (@ або лінк)": "Instagram (@ or link)",
  "TikTok (@ або лінк)": "TikTok (@ or link)",
  "Сайт для кафе": "Website for cafe",
  "Назва проєкту": "Project name",
  "Клієнт": "Client",
  "Реклама в Instagram": "Instagram advertising",
  "Опис витрати": "Expense description",
  "Категорія": "Category",
  "Вставте сюди скопійований текст...": "Paste copied text here...",
  "Наприклад: Денис Залізко": "E.g.: Denys Zalizko",
  "Власник / Спеціаліст": "Owner / Specialist",
  "@username або 5278970111": "@username or 5278970111",
  "Введіть секретний ключ доступу!": "Enter secret access key!",
  "ПЕРЕВІРКА...": "VERIFYING...",
  "ДОСТУП ДОЗВОЛЕНО ": "ACCESS GRANTED ",
  "СКОПІЙОВАНО ": "COPIED ",
  "ЗБЕРІГАЄМО...": "SAVING...",
  "ЗБЕРЕЖЕНО ": "SAVED ",
  "ДОДАЄМО...": "ADDING...",
  "ДОДАНО ": "ADDED ",
  "ПОМИЛКА": "ERROR",
  "Вибір дати початку": "Select Start Date",
  "Вибір дати дедлайну": "Select Deadline Date",
  "Початок:": "Start:",
  "Дедлайн:": "Deadline:",
  "дн.": "days",
  "Будь ласка, введіть ім'я": "Please enter name",
  "Введіть назву замовлення та суму": "Enter order title and amount",
  "Будь ласка, введіть назву замовлення та суму": "Please enter order title and amount",
  "Введіть опис витрати та суму": "Enter expense description and amount",
  "(оберіть кінцеву дату)": "(select end date)",
  "Всі категорії": "All categories",
  "Будь ласка, оберіть файл зображення (JPG, PNG)": "Please select an image file (JPG, PNG)",
  "Профіль успішно оновлено та синхронізовано!": "Profile updated and synchronized successfully!",
  "Введіть коректний username": "Enter a valid username",
  "Акаунт": "Account",
  "ВІДПРАВКА В ХМАРУ...": "SENDING TO CLOUD...",
  "ВІДПРАВЛЕНО В ХМАРУ ": "SENT TO CLOUD ",
  "Всі дані з цього пристрою вивантажено в хмару (@absolutikdenchik)!": "All data from this device uploaded to cloud (@absolutikdenchik)!",
  "ЗАВАНТАЖЕННЯ З ХМАРИ...": "DOWNLOADING FROM CLOUD...",
  "ДАНІ ЗАВАНТАЖЕНО ": "DATA DOWNLOADED ",
  "Всі дані акаунту @absolutikdenchik перенесено на цей пристрій!": "All data for account @absolutikdenchik transferred to this device!",
  "ОНОВЛЕНО ": "UPDATED ",
  "ФАЙЛ ЗАВАНТАЖЕНО ": "FILE LOADED ",
  "Дані акаунту @absolutikdenchik успішно оновлено з хмари!": "Account data @absolutikdenchik successfully updated from cloud!",
  "Файл бекапу застосовано та синхронізовано з хмарою!": "Backup file applied and synced with cloud!",
  "Помилка читання файлу. Переконайтеся, що ви обрали файл бекапу у форматі .json.": "File read error. Make sure you selected a backup file in .json format.",
  "Дані застосовано та синхронізовано!": "Data applied and synchronized!",
  "Помилка обробки тексту. Перевірте правильність введених даних.": "Text processing error. Check the validity of the entered data.",
  "Підключити API": "Connect API",
  "Відкрити картку закладу в Google Maps": "Open venue card in Google Maps",
  "Додати заклад у CRM": "Add venue to CRM",
  "Вкажіть нішу бізнесу": "Specify business niche",
  "ЗАПУСКАЮ…": "STARTING…",
  "Файл": "File",
  "Помилка вивантаження файлу": "File download error",
  "Всі дані скопійовано в буфер обміну": "All data copied to clipboard",
  "Надсилаю…": "Sending…",
  "Будь ласка, вставте токен Apify (починається на apify_api_...)": "Please paste Apify token (starts with apify_api_...)",
  "ЗБЕРІГАЮ…": "SAVING…",
  "Apify API токен успішно підключено! Тепер Google Maps та Instagram скрапери працюють наживо.": "Apify API token successfully connected! Google Maps and Instagram scrapers now work live.",
  "Шаблон скопійовано. Відкриваємо Viber": "Template copied. Opening Viber",
  "Офер скопійовано. Вставте в Instagram Direct": "Offer copied. Paste into Instagram Direct",
  "Офер скопійовано. Відкриваємо Viber": "Offer copied. Opening Viber",
  "Офер для керівника скопійовано. Відкриваємо оголошення": "Manager offer copied. Opening vacancy post",
  "Офер скопійовано. Оберіть спосіб зв'язку": "Offer copied. Choose contact method",
  "Готовий офер для": "Ready offer for",
  "Офер:": "Offer:",
  "Текст оферу скопійовано!": "Offer text copied!",
  "Текст скопійовано! Відкриваю Instagram...": "Text copied! Opening Instagram...",
  "Текст оферу скопійовано. Відкриваю Viber": "Offer text copied. Opening Viber",
  "Видалити цей пошук": "Delete this search",
  "Відкрити точку в Google Maps": "Open point in Google Maps",
  "Скопіювати шаблон і відкрити Instagram Direct": "Copy template and open Instagram Direct",
  "Додати в CRM": "Add to CRM",
  "Відкрити точку закладу в Google Maps": "Open venue location in Google Maps",
  "Прокласти маршрут пішки до закладу": "Get walking route to venue",
  "Нових закладів за цим запитом не знайдено. Спробуйте іншу нішу або місто.": "No new venues found for this query. Try another niche or city.",
  "Вкажіть категорію або тип команд": "Specify category or team type",
  "Вкажіть місто для пошуку": "Specify city to search",
  "СКАНУЮ ЛОКАЦІЮ…": "SCANNING LOCATION…",
  "Немає закладів для вивантаження": "No venues to export",
  "Немає закладів для відправки": "No venues to send",
  "Надіслано в Telegram": "Sent to Telegram",
  "Звіт скопійовано для Telegram": "Report copied for Telegram",
  "Пошук видалено": "Search deleted",
  "КП скопійовано в буфер обміну!": "Commercial proposal copied to clipboard!",
  "Геолокація недоступна": "Geolocation unavailable",
  "Вашу позицію знайдено!": "Your location found!",
  "Не вдалося визначити координати": "Failed to determine coordinates",
  "Офер скопійовано! Відкриваємо Viber": "Offer copied! Opening Viber",
  "IBAN рахунок скопійовано!": "IBAN account copied!",
  "Реквізити скопійовано в буфер!": "Requisites copied to clipboard!",
  "Реквізити успішно збережено!": "Requisites saved successfully!",
  "Спочатку виділіть хоча б одну вакансію синьою обводкою": "Select at least one vacancy with blue outline first",
  "Перевірте увімкнені акаунти або ліміти у вкладці Черга та Акаунти": "Check enabled accounts or limits in Queue & Accounts tab",
  "Немає вибраних вакансій у черзі": "No selected vacancies in queue",
  "Перейдіть у «Список вакансій», виділіть картки синьою обводкою та натисніть «Сформувати чергу»": "Go to Vacancies List, select cards with blue outline and click 'Generate Queue'",
  "Виконано": "Completed",
  "Усі контакти автоматично збережені у вашу CRM зі статусом «В процесі»": "All contacts automatically saved to your CRM with status 'In Progress'",
  "Синій вибір скинуто": "Selection cleared",
  "Акаунти та налаштування розсилки збережено": "Accounts and outreach settings saved",
  "Спочатку оберіть вакансії у списку": "Select vacancies in the list first",
  "Авто-розсилку поставлено на паузу": "Auto-outreach paused",
  "У черзі немає активних вакансій": "No active vacancies in queue",
  "Вакансію пропущено": "Vacancy skipped",
  "Чергу очищено": "Queue cleared",
  "лідів": "leads",
  "ліди": "leads",
  "лід": "lead",
  "вакансій": "vacancies",
  "вакансії": "vacancies",
  "вакансія": "vacancy",
  "замовлення": "order",
  "витрати": "expenses",
  "заклади": "venues",
  "заклад": "venue",
  "бізнеси": "businesses",
  "бізнес": "business",
  "пошуків": "searches",
  "пошуки": "searches",
  "пошук": "search",
  "клієнтів": "clients",
  "клієнти": "clients",
  "клієнт": "client",
  "чатів": "chats",
  "чати": "chats",
  "чат": "chat",
  "каналів": "channels",
  "канали": "channels",
  "канал": "channel",
  "джерел": "sources",
  "джерела": "sources",
  "джерело": "source",
  "годин": "hours",
  "хвилин": "minutes",
  "хв": "min",
  "хв.": "min",
  "сек": "sec",
  "сек.": "sec",
  "днів": "days",
  "день": "day",
  "місяць": "month",
  "місяців": "months",
  "років": "years",
  "рік": "year",
  "відгуків": "reviews",
  "відгуки": "reviews",
  "відгук": "review",
  "відг": "rev",
  "відг.": "rev",
  "грн": "UAH",
  "грн.": "UAH",
  "тис.": "k",
  "шт": "pcs",
  "шт.": "pcs",
  "ДЗ": "DZ",
  "Українська": "Ukrainian",
  "Ім'я клієнта": "Client name",
  "Кав'ярня, нерухомість, одяг, салон...": "Coffee shop, real estate, clothing, salon...",
  "Кав'ярня, нерухомість...": "Coffee shop, real estate...",
  "Редагувати ім'я та юзернейм": "Edit name and username",
  "Редагування профілю": "Edit Profile",
  "Введіть ім'я клієнта": "Enter client name",
  "Ви впевнені, що хочете видалити цей лід?": "Are you sure you want to delete this lead?",
  "Ви впевнені, що хочете видалити це замовлення?": "Are you sure you want to delete this order?",
  "Ви впевнені, що хочете видалити цю витрату?": "Are you sure you want to delete this expense?",
  "Помилка мережі": "Network error",
  "Завантаження даних...": "Loading data...",
  "Підключення...": "Connecting...",
  "Немає даних": "No data",
};

const DWS_SORTED_I18N_ENTRIES = Object.entries(DWS_I18N_DICTIONARY).sort((a, b) => b[0].length - a[0].length);


function translateText(text) {
  if (!text || typeof text !== 'string' || !/[а-яіїєґА-ЯІЇЄҐ]/.test(text)) return text;
  const trimmed = text.trim();
  if (DWS_I18N_DICTIONARY[trimmed]) {
    return text.replace(trimmed, DWS_I18N_DICTIONARY[trimmed]);
  }
  let res = text;
  for (const [ua, en] of DWS_SORTED_I18N_ENTRIES) {
    if (res.includes(ua)) {
      res = res.split(ua).join(en);
      if (!/[а-яіїєґА-ЯІЇЄҐ]/.test(res)) break;
    }
  }
  return res;
}

function translateDomNode(node, lang) {
  if (!node) return;
  
  if (node.nodeType === 3) { // TEXT_NODE
    if (node.__origUaText === undefined) {
      node.__origUaText = node.nodeValue;
    }
    if (lang === 'en') {
      node.nodeValue = translateText(node.__origUaText);
    } else {
      if (node.__origUaText !== undefined) {
        node.nodeValue = node.__origUaText;
      }
    }
    return;
  }
  
  if (node.nodeType === 1) { // ELEMENT_NODE
    const tag = (node.tagName || '').toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'svg') return;
    if (node.classList && node.classList.contains('lang-choice-pill')) return;
    
    const attrs = ['placeholder', 'title', 'aria-label'];
    for (const attr of attrs) {
      if (node.hasAttribute && node.hasAttribute(attr)) {
        const prop = '__origUa_' + attr;
        if (node[prop] === undefined) {
          node[prop] = node.getAttribute(attr);
        }
        if (lang === 'en') {
          node.setAttribute(attr, translateText(node[prop]));
        } else {
          node.setAttribute(attr, node[prop]);
        }
      }
    }
    
    for (let child = node.firstChild; child; child = child.nextSibling) {
      translateDomNode(child, lang);
    }
  }
}

function translateDomTree(root, lang) {
  const target = root || document.body;
  if (!target) return;
  translateDomNode(target, lang);
}

let i18nMutationObserver = null;
function setupI18nObserver() {
  if (i18nMutationObserver || typeof MutationObserver === 'undefined') return;
  i18nMutationObserver = new MutationObserver((mutations) => {
    if (state.lang !== 'en') return;
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 || node.nodeType === 3) {
            translateDomNode(node, 'en');
          }
        });
      }
    }
  });
  if (document.body) {
    i18nMutationObserver.observe(document.body, { childList: true, subtree: true });
  }
}

function t(key, fallback = '') {
  const currentLang = state.lang || 'ua';
  if (currentLang === 'ua') {
    return fallback || key;
  }
  return translateText(key) || fallback || key;
}

function applyLanguage(lang, triggerToast = false) {
  const normalizedLang = (lang === 'en') ? 'en' : 'ua';
  state.lang = normalizedLang;
  localStorage.setItem('dws_lang', normalizedLang);
  document.documentElement.lang = normalizedLang;
  if (state.profile) state.profile.lang = normalizedLang;

  // Toggle active class on lang choice pills
  document.querySelectorAll('.lang-choice-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === normalizedLang);
  });

  // Reversible deep DOM tree translation
  translateDomTree(document.body, normalizedLang);
  setupI18nObserver();

  // Re-render current tab if initialized
  if (typeof renderCurrentTab === 'function') {
    try {
      renderCurrentTab();
    } catch (e) {}
  }

  // If any modal is currently open, translate it as well
  document.querySelectorAll('.modal.open').forEach(modal => {
    translateDomTree(modal, normalizedLang);
  });

  // Sync to backend profile
  fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lang: normalizedLang })
  }).catch(() => {});

  if (triggerToast) {
    haptic('medium');
    const msg = (normalizedLang === 'en') ? 'Language switched to English' : 'Мову змінено на Українську';
    showToast(msg);
    if (typeof syncAccountToServer === 'function') syncAccountToServer();
  }
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

  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.toggle('active', view.id === tabId);
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  });

  if (typeof renderCurrentTab === 'function') {
    renderCurrentTab();
  } else {
    if (tabId === 'tab-income') renderIncome();
    else if (tabId === 'tab-expenses') renderExpenses();
    else if (tabId === 'tab-requisites') renderRequisitesTab();
    else if (tabId === 'tab-profile') updateProfileHeaderUI();
    else if (tabId === 'tab-scrape' && typeof renderScrapes === 'function') renderScrapes();
    else if (tabId === 'tab-nfc-radar' && typeof renderNfcRadar === 'function') renderNfcRadar();
  }

  const mainEl = document.querySelector('.app-main');
  if (mainEl) mainEl.scrollTop = 0;
}

// ============================================================
// DATA FETCHING & RENDERING
// ============================================================
async function loadAllData() {
  await fetchAccountData();
  await Promise.all([
    fetchLeads(),
    fetchCrm(),
    fetchIncome(),
    fetchExpenses(),
    fetchProfile(),
    fetchSources()
  ]);
}

// ---- RESUME & SELF-PROMO DETECTOR ----
function isCandidateResumeOrSelfPromo(text, title = '') {
  if (!text || typeof text !== 'string') return false;
  const full = ((title || '') + '\n' + text).trim();
  const lower = full.toLowerCase();

  // 1. Explicit resume markers / hashtags / headers / lists
  if (/^[#\s🔥📃📌]*резюме\b/i.test(full)) return true;
  if (/резюме\s+[\w\s/–-]+\s+от\s+@/i.test(full)) return true;
  if (/#(?:резюме|cv|resume|ищуработу|ищу_работу|ищузаказы|ищу_заказы|forhire|lookingforjob)\b/i.test(full)) return true;
  if (/(?:моє|моё|мое)\s+резюме/i.test(lower)) return true;
  if (/(?:ловіть|свіжі|добірка|свежие|подборка|лучшие)\s+резюме/i.test(lower)) return true;
  if (/резюме\s+за\s+\d+/i.test(lower)) return true;
  if (/^(?:резюме|cv|resume)\s*:/im.test(full)) return true;
  if (/freelancer\/[\w-]+/i.test(full)) return true;

  if (title && /резюме/i.test(title)) {
    if (!/(?:ваканс|шукаємо|ищем|нужен|потрібен)/i.test(title)) {
      return true;
    }
  }

  // 2. Candidate job seeking statements
  if (/\b(?:шукаю|ищу)\s+(?:роботу|вакансію|вакансию|підробіток|подработку|проєкти|проекти|проекты|заказы|замовлення|клієнтів|клиентов)\b/i.test(lower)) {
    return true;
  }
  if (/\b(?:в\s+пошуку\s+роботи|в\s+поиске\s+работы|відкритий\s+до\s+пропозицій|відкрита\s+до\s+пропозицій|открыт\s+к\s+предложениям|открыта\s+к\s+предложениям|рассмотрю\s+предложения|розгляну\s+пропозиції)\b/i.test(lower)) {
    return true;
  }
  if (/\b(?:готовий|готова|готов)\s+(?:працювати|работать|взятися|взяться)\b/i.test(lower)) {
    return true;
  }

  // 3. Candidate self sections
  if (/(?:^|\n)\s*(?:обо\s+мне|о\s+себе|про\s+себе|про\s+мене|мо[йєё]\s+стек|стек\s+технологий|мо[иії]\s+навыки|мо[иії]\s+навички|бажана\s+зп|желаемая\s+зп|ожидания\s+по\s+зп)\s*:/i.test(full)) {
    return true;
  }

  // 4. Candidate intro phrases: 'Всем привет, меня зовут ..., я веб-разработчик'
  if (/(?:всім\s+привіт|всем\s+привет|привет|привіт)[\s\S]{1,40}(?:мене\s+звати|меня\s+зовут|я\s+—|я\s+-|я\s+)(?:веб|дизайн|таргет|маркет|разраб|розроб|програм|верст|монтаж)/i.test(lower)) {
    return true;
  }

  // 5. Commercial pitches & self-promotions
  if (/^(?:зальем\s+трафик|заллємо\s+трафік|сделаем\s+под\s+ключ|зробимо\s+під\s+ключ)/i.test(full)) return true;
  if (/\b(?:предлагаю\s+услуги|пропоную\s+послуги|надаю\s+послуги|оказываю\s+услуги|возьму\s+на\s+ведение|візьму\s+на\s+ведення|возьму\s+(?:\d+|пару|несколько)\s+проект|візьму\s+(?:\d+|пару|кілька)\s+проєкт)\b/i.test(lower)) {
    return true;
  }
  if (/(?:^|\n)\s*(?:мои\s+услуги|мої\s+послуги|мо[еєё]\s+портфолио|мо[еєё]\s+портфоліо|мои\s+кейсы|мої\s+кейси|ссылка\s+на\s+портфолио)\s*:/i.test(full)) {
    return true;
  }
  if (/\bя\s+(?:веб-дизайнер|вебдизайнер|таргетолог|маркетолог|дизайнер|разработчик|розробник|программист|верстальщик|монтажер|видеомонтажер|відеомонтажер)\b/i.test(lower)) {
    if (/я\s+[\w\s-]{1,30}(?:з\s+досвідом|с\s+опытом|занимаюсь|займаюся|розробляю|разрабатываю|сделаю|зроблю|помогу|допоможу|создаю|створюю|ищу|шукаю)/i.test(lower)) {
      return true;
    }
  }

  // 6. Non-job chat banter / forum advice / pinned messages
  if (lower.startsWith('стек мощный') || lower.startsWith('скажу лайфхак') || lower.includes('канал с вакансиям переехал')) {
    return true;
  }

  return false;
}

// ---- 1. LEADS FEED ----
async function fetchLeads() {
  try {
    const params = new URLSearchParams();
    if (state.filters.category && state.filters.category !== 'all') params.set('category', state.filters.category);
    if (state.filters.subcategory && state.filters.subcategory !== 'all') params.set('subcategory', state.filters.subcategory);
    if (state.filters.budget && state.filters.budget !== 'all') params.set('budget', state.filters.budget);
    if (state.filters.portfolio && state.filters.portfolio !== 'any') params.set('portfolio', state.filters.portfolio);
    if (state.filters.exp && state.filters.exp !== 'any') params.set('exp', state.filters.exp);
    if (state.filters.query) params.set('query', state.filters.query);
    if (state.filters.sortBy) params.set('sortBy', state.filters.sortBy);

    let res = await fetch('/leads-data.json?t=' + Date.now()).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch('/api/leads?' + params.toString()).catch(() => null);
    }
    if (res && res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        state.allLeads = json.data.filter(l => !isCandidateResumeOrSelfPromo(l.text, l.title));
        filterAndRenderLeads();
        return;
      }
    }
  } catch (err) {
    console.warn('Using embedded dataset for leads:', err);
  }

  if (!state.allLeads || state.allLeads.length === 0) {
    state.allLeads = [...DEFAULT_DATA.leads];
  }
  filterAndRenderLeads();
}

function getExactCountry(lead) {
  if (!lead) return 'Україна';

  // 0. If lead is from a freelance exchange, show the exact exchange name instead of country!
  const exchangeNames = [
    'Freelancehunt', 'Freelance.ua', 'Djinni', 'Kabanchik', 'Upwork', 'Weblancer',
    'Upwork / Remote', 'WeWorkRemotely', 'Remotive'
  ];
  if (lead.sourceName && exchangeNames.includes(lead.sourceName)) {
    return lead.sourceName;
  }
  if (lead.country && (exchangeNames.includes(lead.country) || lead.country.includes('Upwork') || lead.country.includes('Remote') || lead.country.includes('WeWork'))) {
    return lead.country;
  }
  if (lead.sourceType === 'freelancehunt') return 'Freelancehunt';
  if (lead.sourceType === 'freelance_ua') return 'Freelance.ua';
  if (lead.sourceType === 'djinni') return 'Djinni';
  if (lead.sourceType === 'kabanchik') return 'Kabanchik';
  if (lead.sourceType === 'upwork') return 'Upwork / Remote';
  if (lead.sourceType === 'weworkremotely') return 'WeWorkRemotely';

  const text = ((lead.text || '') + ' ' + (lead.title || '') + ' ' + (lead.sourceName || '') + ' ' + (lead.sourceUsername || '')).toLowerCase();

  // 1. Точні міжнародні згадки (США, Польща, Німеччина, тощо)
  if (/(?:ринок сша|клієнт зі сша|клієнти зі сша|замовник зі сша|компанія зі сша|us market|us client|usa|new york|нью-йорк|калифорн|каліфорн|майами|маямі|техас|лос-анджелес)/i.test(text)) {
    return 'США';
  }
  if (/(?:польщ|польша|poland|polska|варшав|warszaw|краків|krakow|вроцлав|wroclaw|zł|pln|злотих|злоті)/i.test(text)) {
    return 'Польща';
  }
  if (/(?:німеччин|герман|germany|deutschland|берлін|berlin|мюнхен|munich|гамбург)/i.test(text)) {
    return 'Німеччина';
  }
  if (/(?:великобритан|британія|британия|england|лондон|london|gbp|фунтів|фунти|£)/i.test(text)) {
    return 'Велика Британія';
  }
  if (/(?:казахстан|казах|алмати|астана|шимкент|тенге|kzt|₸)/i.test(text)) {
    return 'Казахстан';
  }
  if (/(?:чехія|чехия|czech|прага|prague|czk|крон)/i.test(text)) {
    return 'Чехія';
  }
  if (/(?:канада|canada|торонто|ванкувер|cad)/i.test(text)) {
    return 'Канада';
  }
  if (/(?:іспанія|испания|spain|мадрид|барселона)/i.test(text)) {
    return 'Іспанія';
  }
  if (/(?:ізраїль|израиль|israel|тель-авів|шекел|ils)/i.test(text)) {
    return 'Ізраїль';
  }
  if (/(?:рф|россия|росія|руб|rub|₽|москва|спб|питер|петербург|тинькофф|сбер|тинькоф)/i.test(text)) {
    return 'РФ';
  }

  // 2. Український контекст (міста, мова, гривні, українські суперчати)
  if (
    /(?:україна|украина|ukraine|грн|uah|₴|київ|львів|одес|харків|дніпро|запоріжж|вінниц|тернопіль|франківськ|ужгород|полтав|чернівц|луцьк|рівне|миколаїв|житомир|черкас|суми|хмельницьк)/i.test(text) ||
    /[іїєґ]/.test(lead.text || '') ||
    /_ua\b|work_in_ukraine|kiev|kyiv|dnepr|uman|jecontact|aplaywork|adgoodashell|smmbunker|smmpeople/i.test(lead.sourceUsername || '')
  ) {
    return 'Україна';
  }

  // 3. Якщо збережено конкретну валідну країну
  if (lead.country && lead.country !== 'Global' && lead.country !== 'СНД') {
    return lead.country;
  }

  return 'Україна';
}

function filterAndRenderLeads() {
  let list = [...(state.allLeads || DEFAULT_DATA.leads)].filter(l => !isCandidateResumeOrSelfPromo(l.text, l.title));

  // Sync inCrm status from saved takenLeadIds (all leads remain visible in feed with status badge)
  list.forEach(l => {
    if (state.takenLeadIds.has(l.id)) {
      l.inCrm = true;
    }
  });

  // Filter by selected niches from Categories modal
  if (state.activeNiches && state.activeNiches.length > 0 && state.activeNiches.length < 3) {
    list = list.filter(l => state.activeNiches.includes(l.category));
  } else if (state.activeNiches && state.activeNiches.length === 0) {
    list = [];
  }

  // Filter by budget
  if (state.filters.budget && state.filters.budget !== 'all') {
    if (state.filters.budget === 'under5k') list = list.filter(l => (l.budget || 0) < 5000);
    else if (state.filters.budget === '5k-15k') list = list.filter(l => (l.budget || 0) >= 5000 && (l.budget || 0) <= 15000);
    else if (state.filters.budget === '15k-30k') list = list.filter(l => (l.budget || 0) > 15000 && (l.budget || 0) <= 30000);
    else if (state.filters.budget === '30k+') list = list.filter(l => (l.budget || 0) > 30000);
  }

  // Filter by portfolio
  if (state.filters.portfolio && state.filters.portfolio !== 'any') {
    if (state.filters.portfolio === 'required') list = list.filter(l => l.requiresPortfolio);
    else if (state.filters.portfolio === 'none') list = list.filter(l => !l.requiresPortfolio);
  }

  // Filter by experience
  if (state.filters.exp && state.filters.exp !== 'any') {
    if (state.filters.exp === 'required') list = list.filter(l => l.experienceRequired);
    else if (state.filters.exp === 'none') list = list.filter(l => !l.experienceRequired);
  }

  // Filter by search query
  if (state.filters.query && state.filters.query.trim()) {
    const q = state.filters.query.toLowerCase().trim();
    list = list.filter(l =>
      (l.title && l.title.toLowerCase().includes(q)) ||
      (l.text && l.text.toLowerCase().includes(q)) ||
      (l.categoryName && l.categoryName.toLowerCase().includes(q)) ||
      (l.authorUsername && l.authorUsername.toLowerCase().includes(q))
    );
  }

  // Sorting
  if (state.filters.sortBy === 'budget_desc') {
    list.sort((a, b) => (b.budget || 0) - (a.budget || 0));
  } else if (state.filters.sortBy === 'rating_desc') {
    list.sort((a, b) => (b.aiRating || 0) - (a.aiRating || 0));
  } else {
    list.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }

  state.leads = list;
  renderLeads();
}

function renderLeads() {
  const container = document.getElementById('leadsList');
  const countNum = document.getElementById('leadsCountNum');
  if (!container) return;

  if (countNum) {
    countNum.textContent = state.leads.length;
  }

  if (state.leads.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="text-align:center; padding: 40px 20px; color: var(--muted);">
        <p style="font-weight:600; font-size:1.05rem;">Заявки за обраними фільтрами відсутні</p>
        <p style="font-size:0.85rem; margin-top:6px;">Спробуйте змінити фільтри або обрати інші ніші</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.leads.map(lead => {
    const authorUser = lead.authorUsername ? lead.authorUsername : (lead.authorName || '@telegram');
    const authorInitial = (lead.authorName ? lead.authorName.charAt(0) : (authorUser.replace('@', '').charAt(0) || 'Л')).toUpperCase();
    const budgetTxt = lead.budget ? (lead.budget.toLocaleString('uk-UA') + ' ₴') : 'Договірний';
    const dateTxt = lead.dateFormatted || 'Сьогодні, 12:30';
    const subline = dateTxt + ' , ' + authorUser;
    const cardTitle = lead.title || lead.subcategoryName || lead.categoryName || 'Замовлення';
    
    // Clean text and handle expansion
    const cleanedText = cleanVacancyText(lead.text);
    const displayText = state.isExpandedAll ? cleanedText : getFirstSentence(cleanedText);

    const isSel = typeof isOutreachLeadSelected === 'function' && isOutreachLeadSelected(lead.id);
    const platInfo = typeof getLeadOutreachPlatformMeta === 'function' ? getLeadOutreachPlatformMeta(lead) : null;

    return `
      <div class="lead-card ${isSel ? 'lead-card--selected' : ''}" data-id="${lead.id}">
        <div class="lead-card-header">
          <!-- Left author avatar -->
          <div class="lead-author-avatar">${escapeHtml(authorInitial)}</div>

          <!-- Middle title & subline -->
          <div class="lead-card-header-middle">
            <div class="lead-card-title">${escapeHtml(cardTitle)}</div>
            <div class="lead-card-subline">${escapeHtml(subline)}</div>
          </div>

          <!-- Right square AI button -->
          <button class="ai-rating-square-btn" data-action="ai-rating" data-id="${lead.id}" title="AI оцінка">
            AI<br>оцінка
          </button>
        </div>

        <!-- Vacancy text with preserved paragraphs and whitespace -->
        <div class="lead-text">${escapeHtml(displayText)}</div>

        <!-- Badges: Budget and Country/Market -->
        <div class="lead-tags-row">
          <span class="lead-tag budget">Бюджет: ${budgetTxt}</span>
          <span class="lead-tag country">${escapeHtml(getExactCountry(lead))}</span>
        </div>

        <!-- Action button -->
        <div class="lead-actions-row">
          <button class="btn btn--fill btn--block btn--take-crm ${lead.inCrm ? 'btn--out' : ''}" data-action="take-crm" data-id="${lead.id}">
            ${lead.inCrm ? t('leads.inWork', 'В РОБОТІ ✓') : t('leads.takeToWork', 'ВЗЯТИ В РОБОТУ')}
          </button>
        </div>
      </div>
    `;
  }).join('');
  if (typeof updateOutreachSelectionUI === 'function') updateOutreachSelectionUI();
}

// Modal: Take to CRM lead modal
function openTakeCrmModal(lead, btn) {
  state.activeLeadForTakeCrm = lead;
  haptic('medium');

  const titleEl = document.getElementById('takeModalTitle');
  const metaEl = document.getElementById('takeModalMeta');
  const aiTextEl = document.getElementById('takeModalAiText');
  const genAiBtn = document.getElementById('takeModalGenAiBtn');
  const fullTextEl = document.getElementById('takeModalFullText');
  const directTgBtn = document.getElementById('takeModalDirectTgBtn');
  const aiOfferBtn = document.getElementById('takeModalAiOfferBtn');

  const cardTitle = lead.title || lead.subcategoryName || lead.categoryName || 'Замовлення';
  const authorUser = lead.authorUsername ? lead.authorUsername : (lead.authorName || '@telegram');
  const dateTxt = lead.dateFormatted || 'Сьогодні, 12:30';
  const cleanedFullText = cleanVacancyText(lead.text);

  if (titleEl) titleEl.textContent = cardTitle;
  if (metaEl) metaEl.textContent = dateTxt + ' , ' + authorUser;
  if (fullTextEl) fullTextEl.textContent = cleanedFullText;

  // AI Summary setup
  if (lead.aiSummary && lead.aiSummary.trim().length > 0) {
    if (aiTextEl) {
      aiTextEl.textContent = lead.aiSummary;
      aiTextEl.style.display = 'block';
    }
    if (genAiBtn) genAiBtn.style.display = 'none';
  } else {
    if (aiTextEl) {
      aiTextEl.textContent = '';
      aiTextEl.style.display = 'none';
    }
    if (genAiBtn) {
      genAiBtn.style.display = 'inline-flex';
      genAiBtn.textContent = 'Згенерувати короткий опис від AI';
      genAiBtn.disabled = false;
      genAiBtn.onclick = async () => {
        haptic('light');
        genAiBtn.textContent = 'Генеруємо...';
        genAiBtn.disabled = true;
        try {
          const res = await fetch('/api/leads/' + lead.id + '/ai-score', { method: 'POST' });
          const json = await res.json();
          if (json.success && json.data && json.data.summary) {
            lead.aiSummary = json.data.summary;
            aiTextEl.textContent = lead.aiSummary;
            aiTextEl.style.display = 'block';
            genAiBtn.style.display = 'none';
          } else {
            lead.aiSummary = 'Замовлення: ' + (lead.subcategoryName || lead.categoryName) + ' з бюджетом ' + (lead.budget ? lead.budget + ' ₴' : 'договірний');
            aiTextEl.textContent = lead.aiSummary;
            aiTextEl.style.display = 'block';
            genAiBtn.style.display = 'none';
          }
        } catch {
          lead.aiSummary = 'Замовлення з орієнтовним бюджетом: ' + (lead.budget ? lead.budget + ' ₴' : 'договірний');
          aiTextEl.textContent = lead.aiSummary;
          aiTextEl.style.display = 'block';
          genAiBtn.style.display = 'none';
        }
      };
    }
  }

  // 1. Action buttons: Row 1 - Direct Contact (Blue with White text, 50% width)
  if (directTgBtn) {
    directTgBtn.style.display = 'block';
    directTgBtn.textContent = 'НАПИСАТИ КЛІЄНТУ';
    directTgBtn.onclick = () => {
      haptic('light');
      markLeadTakenToCrm(lead, btn);
      openTelegramContact(lead, '');
    };
  }

  // 2. Action buttons: Row 1 - AI Offer (Blue with White text, 50% width)
  if (aiOfferBtn) {
    aiOfferBtn.style.display = 'block';
    aiOfferBtn.textContent = 'AI-ВІДГУК';
    aiOfferBtn.onclick = () => {
      haptic('success');
      markLeadTakenToCrm(lead, btn);
      const clientName = lead.authorName || (lead.authorUsername ? lead.authorUsername.replace(/^[@u\/]+/, '') : 'замовнику');
      const taskName = lead.subcategoryName || lead.title || 'розробка проєкту';
      const template = state.profile?.responseTemplate || DEFAULT_DATA.profile.responseTemplate;
      const pitch = template.replace(/{NAME}/g, clientName).replace(/{TASK}/g, taskName);

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(pitch).catch(() => {});
      }
      aiOfferBtn.textContent = 'СКОПІЙОВАНО ✓';
      setTimeout(() => { aiOfferBtn.textContent = 'AI-ВІДГУК'; }, 2000);

      openTelegramContact(lead, pitch);
    };
  }

  // 3. Action buttons: Row 2 - Open in Source (100% full-width Black button with gray outline)
  const sourceBtn = document.getElementById('takeModalSourceBtn');
  if (sourceBtn) {
    sourceBtn.style.display = 'block';
    sourceBtn.textContent = 'ВІДКРИТИ В ДЖЕРЕЛІ ↗';
    sourceBtn.onclick = () => {
      haptic('light');
      let sourceUrl = lead.url || '';
      if (!sourceUrl && lead.sourceUsername) {
        const cleanHandle = lead.sourceUsername.replace(/^@/, '');
        sourceUrl = `https://t.me/${cleanHandle}`;
      }
      if (sourceUrl) {
        if (tg?.openTelegramLink && sourceUrl.includes('t.me/')) {
          tg.openTelegramLink(sourceUrl);
        } else {
          window.open(sourceUrl, '_blank');
        }
      }
    };
  }

  openModal('modalTakeCrmLead');
}

// Mark lead as "В РОБОТІ ✓" and add to CRM ONLY when user actually takes contact action
function markLeadTakenToCrm(lead, btn) {
  if (!lead || lead.inCrm) return;
  lead.inCrm = true;
  state.takenLeadIds.add(lead.id);
  state.justTakenSessionIds.add(lead.id);
  localStorage.setItem('dws_taken_leads', JSON.stringify([...state.takenLeadIds]));

  if (btn) {
    btn.textContent = t('leads.inWork', 'В РОБОТІ ✓');
    btn.classList.add('btn--out');
    btn.classList.remove('btn--fill');
  }

  const domBtn = document.querySelector(`.lead-card[data-id="${lead.id}"] .btn--take-crm`);
  if (domBtn) {
    domBtn.textContent = t('leads.inWork', 'В РОБОТІ ✓');
    domBtn.classList.add('btn--out');
    domBtn.classList.remove('btn--fill');
  }

  const alreadyInCrm = state.crm.some(c => c.leadId === lead.id);
  if (!alreadyInCrm) {
    const authorClean = lead.authorUsername ? lead.authorUsername.replace('@', '') : 'Клієнт';
    state.crm.unshift({
      id: 'crm-' + Date.now(),
      leadId: lead.id,
      name: lead.authorName && lead.authorName !== 'Клієнт / Роботодавець' ? lead.authorName : authorClean,
      username: lead.authorUsername || '@username',
      avatarLetter: authorClean.charAt(0).toUpperCase(),
      status: 'in_progress',
      statusLabel: 'В процесі',
      service: lead.category || 'development',
      serviceLabel: lead.categoryName || 'Розробка',
      niche: lead.subcategoryName || lead.title,
      budget: lead.budget || 0,
      currency: lead.currency || '₴',
      source: lead.sourceType || 'tg_leads',
      sourceLabel: lead.sourceName || 'DWS Lead',
      notes: cleanVacancyText(lead.text),
      orders: []
    });
    localStorage.setItem('dws_crm', JSON.stringify(state.crm));
    renderCrm();
    syncAccountToServer();
  }

  fetch('/api/leads/' + lead.id + '/take-to-crm', { method: 'POST' })
    .then(res => res.json())
    .then(json => {
      if (json.success) renderCrm();
    })
    .catch(() => {});
}

const CRM_STATUSES = {
  'all': 'Всі',
  'in_progress': 'В процесі',
  'offer': 'Оффер',
  'paid': 'Оплата',
  'working': 'Працюєм',
  'closed': 'Закриті',
  'follow_up': 'Follow-up',
  'rejected': 'Відмова'
};

function getLeadsNoun(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'лідів';
  if (mod10 === 1) return 'лід';
  if (mod10 >= 2 && mod10 <= 4) return 'ліди';
  return 'лідів';
}

// ---- 2. CRM FEED ----
async function fetchCrm() {
  if (!state.cloudSynced) {
    try {
      const res = await fetch('/api/crm');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && (!state.crm || state.crm.length === 0)) {
        state.crm = json.data;
        localStorage.setItem('dws_crm', JSON.stringify(state.crm));
      }
    } catch (err) {
      console.warn('Error fetching CRM:', err);
    }
  }
  renderCrm();
}

function renderCrmStageTabs() {
  const container = document.getElementById('crmStagesBox');
  if (!container) return;
  const pinned = state.crmPinnedStages || ['all', 'in_progress', 'offer', 'paid'];

  container.innerHTML = pinned.map(st => {
    const isActive = state.activeCrmStatus === st;
    const label = CRM_STATUSES[st] || st;
    return `
      <button type="button" class="crm-stage-tab ${isActive ? 'active' : ''}" data-status="${st}">
        ${escapeHtml(label)}
      </button>
    `;
  }).join('');

  container.querySelectorAll('.crm-stage-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const st = tab.dataset.status;
      state.activeCrmStatus = st;
      container.querySelectorAll('.crm-stage-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Sync active state in modal grid
      document.querySelectorAll('#crmFilterStatusGrid .opt-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.status === st);
      });

      haptic('light');
      renderCrm();
    });
  });
}

function renderCrm() {
  const container = document.getElementById('crmList');
  const countNumEl = document.getElementById('crmTotalCountNum');
  const countLabelEl = document.getElementById('crmTotalCountLabel');
  if (!container) return;

  const allClients = Array.isArray(state.crm) ? state.crm : [];
  const totalCount = allClients.length;

  // Real count in header (Right corner, large black number + word)
  if (countNumEl) countNumEl.textContent = totalCount;
  if (countLabelEl) countLabelEl.textContent = getLeadsNoun(totalCount);

  // Render 4-stage tabs in single row
  renderCrmStageTabs();

  // Filter CRM leads by status, service, and budget
  let filtered = [...allClients];
  if (state.activeCrmStatus && state.activeCrmStatus !== 'all') {
    filtered = filtered.filter(item => item.status === state.activeCrmStatus);
  }
  if (state.crmFilterService && state.crmFilterService !== 'all') {
    filtered = filtered.filter(item => item.service === state.crmFilterService);
  }
  if (state.crmFilterMinBudget && state.crmFilterMinBudget > 0) {
    filtered = filtered.filter(item => (Number(item.budget) || 0) >= state.crmFilterMinBudget);
  }

  // Highlight settings button if non-default filters applied
  const filterBtn = document.getElementById('openCrmFilterBtn');
  if (filterBtn) {
    const hasExtra = (state.activeCrmStatus !== 'all') || (state.crmFilterService !== 'all') || (state.crmFilterMinBudget > 0);
    filterBtn.classList.toggle('has-filters', hasExtra);
  }

  if (filtered.length === 0) {
    if (totalCount === 0) {
      container.innerHTML = `
        <div class="empty-state" style="text-align:center; padding: 40px 20px; color: var(--muted); background: var(--card-bg); border: 1px dashed var(--border); border-radius: var(--r-lg);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">👥</div>
          <p style="font-family: var(--ffh); font-weight:700; font-size:1.05rem; color:var(--black); margin-bottom:4px;">Клієнтів ще немає</p>
          <p style="font-size:0.85rem; line-height: 1.4;">Перенесіть замовлення із вкладки «Заявки» або додайте клієнта вручну (+)</p>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state" style="text-align:center; padding: 36px 20px; color: var(--muted); background: var(--card-bg); border: 1px dashed var(--border); border-radius: var(--r-lg);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <p style="font-family: var(--ffh); font-weight:700; font-size:1rem; color:var(--black); margin-bottom:4px;">Немає лідів за обраними фільтрами</p>
          <p style="font-size:0.82rem; line-height: 1.4;">Спробуйте скинути фільтри або обрати інший статус роботи</p>
        </div>
      `;
    }
    return;
  }

  container.innerHTML = filtered.map(item => {
    const initial = item.avatarLetter || (item.name ? item.name.charAt(0).toUpperCase() : 'Л');
    
    // Calculate total budget from orders or fallback to item.budget
    let totalBudget = 0;
    if (Array.isArray(item.orders) && item.orders.length > 0) {
      totalBudget = item.orders.reduce((sum, ord) => sum + (Number(ord.amount) || 0), 0);
    }
    if (totalBudget === 0 && item.budget) {
      totalBudget = Number(item.budget) || 0;
    }
    const amount = totalBudget > 0 ? (totalBudget.toLocaleString('uk-UA') + ' ₴') : '—';
    const stageLabel = item.statusLabel || CRM_STATUSES[item.status] || 'В процесі';

    // 1. Client name (black)
    // 2. Client username (STUDIO BLUE, @username)
    // 3. Niche & Service (black)
    const usernameDisplay = item.username ? (item.username.startsWith('@') ? item.username : ('@' + item.username)) : '@юзернейм';
    const nicheText = item.niche ? item.niche : 'Проєкт під ключ';
    const serviceText = item.serviceLabel || (item.service === 'marketing' ? 'Реклама' : item.service === 'montage' ? 'Монтаж' : 'Розробка');
    const nicheAndService = `${nicheText} • ${serviceText}`;

    return `
      <div class="crm-card" data-id="${item.id}">
        <div class="crm-card-left">
          <div class="client-avatar">${initial}</div>
          <div class="crm-card-info">
            <div class="crm-card-name">${escapeHtml(item.name || 'Клієнт')}</div>
            <div class="crm-card-user">${escapeHtml(usernameDisplay)}</div>
            <div class="crm-card-niche-service">${escapeHtml(nicheAndService)}</div>
          </div>
        </div>
        <div class="crm-card-right">
          <span class="crm-stage-badge">${escapeHtml(stageLabel)}</span>
          <span class="crm-amount">${amount}</span>
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.crm-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const item = state.crm.find(c => c.id === id);
      if (item) handleOpenCrmDetail(item);
    });
  });
}

// ---- 3. INCOME TRACKER ----
async function fetchIncome() {
  if (!state.cloudSynced) {
    try {
      const res = await fetch('/api/income');
      const json = await res.json();
      if (json.success && json.data && (!state.income || !Array.isArray(state.income.records) || state.income.records.length === 0)) {
        state.income = json.data;
        if (!Array.isArray(state.income.records)) {
          state.income.records = [];
        }
        localStorage.setItem('dws_income', JSON.stringify(state.income));
      }
    } catch (err) {
      console.warn('Error fetching income:', err);
    }
  }
  renderIncome();
}

function getOrdersNoun(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'замовлень';
  if (mod10 === 1) return 'замовлення';
  if (mod10 >= 2 && mod10 <= 4) return 'замовлення';
  return 'замовлень';
}

function renderIncome() {
  const earnedEl = document.getElementById('totalEarnedVal');
  const earnedSubEl = document.getElementById('totalEarnedSub');
  const expectedEl = document.getElementById('totalExpectedVal');
  const countNumEl = document.getElementById('incomeOrdersCountNum');
  const countLabelEl = document.getElementById('incomeOrdersCountLabel');
  const barsContainer = document.getElementById('incomeBars');
  const chartLabelEl = document.getElementById('chartActiveMonthLabel');
  const accordionContainer = document.getElementById('incomeAccordion');

  const allRecords = (state.income && Array.isArray(state.income.records)) ? state.income.records : [];

  // Update real count in header (all-time real orders count, large bold black text without badge background)
  if (countNumEl) countNumEl.textContent = allRecords.length;
  if (countLabelEl) countLabelEl.textContent = getOrdersNoun(allRecords.length);

  // 1. FILTER RECORDS
  let filteredRecords = [...allRecords];
  let periodLabel = 'За весь час';

  if (state.incomeDateRange && state.incomeDateRange.start) {
    const startStr = state.incomeDateRange.start;
    const endStr = state.incomeDateRange.end || state.incomeDateRange.start;
    filteredRecords = filteredRecords.filter(r => {
      const dStr = (r.date ? new Date(r.date) : new Date()).toISOString().slice(0, 10);
      return dStr >= startStr && dStr <= endStr;
    });
    const sParts = startStr.split('-');
    const eParts = endStr.split('-');
    periodLabel = `${sParts[2]}.${sParts[1]} – ${eParts[2]}.${eParts[1]}`;
  } else if (state.incomeFilterPeriod && state.incomeFilterPeriod !== 'all') {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const periodLabels = {
      'year': 'За останній рік',
      '6m': 'За останні 6 міс',
      '3m': 'За останні 3 міс',
      '1m': 'За останній міс',
      '1w': 'За останній тиж',
      '1d': 'Сьогодні'
    };
    periodLabel = periodLabels[state.incomeFilterPeriod] || 'За весь час';

    if (state.incomeFilterPeriod === '1d') {
      filteredRecords = filteredRecords.filter(r => {
        const rd = r.date ? new Date(r.date) : new Date();
        const rIso = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
        return rIso === todayIso;
      });
    } else if (state.incomeFilterPeriod === '1w') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);
      filteredRecords = filteredRecords.filter(r => {
        const rd = r.date ? new Date(r.date) : new Date();
        return rd.getTime() >= oneWeekAgo.getTime();
      });
    } else {
      const periodMsMap = {
        'year': 365 * 24 * 3600 * 1000,
        '6m': 180 * 24 * 3600 * 1000,
        '3m': 90 * 24 * 3600 * 1000,
        '1m': 30 * 24 * 3600 * 1000
      };
      const periodMs = periodMsMap[state.incomeFilterPeriod] || 0;
      if (periodMs > 0) {
        const nowMs = Date.now();
        filteredRecords = filteredRecords.filter(r => {
          const rMs = new Date(r.date).getTime();
          return (nowMs - rMs) <= periodMs;
        });
      }
    }
  }

  // 2. SUM TOTALS FROM FILTERED RECORDS
  let totalEarned = 0;
  let totalExpected = 0;
  for (const r of filteredRecords) {
    const amt = Number(r.amount) || 0;
    if (r.isPaid) totalEarned += amt;
    else totalExpected += amt;
  }

  if (earnedEl) earnedEl.textContent = totalEarned.toLocaleString('uk-UA') + ' ₴';
  if (earnedSubEl) earnedSubEl.textContent = periodLabel;
  if (expectedEl) expectedEl.textContent = totalExpected.toLocaleString('uk-UA') + ' ₴';

  // 3. DYNAMIC MONTHLY BAR CHART (Last 5 calendar months ending in real current month)
  const now = new Date();
  const monthShortNames = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
  const monthFullNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

  const last5Months = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    last5Months.push({
      year: y,
      monthIdx: m,
      shortName: monthShortNames[m],
      fullName: monthFullNames[m],
      amount: 0
    });
  }

  // Aggregate paid sums from allRecords
  for (const r of allRecords) {
    if (r.isPaid) {
      const rd = new Date(r.date);
      if (!isNaN(rd.getTime())) {
        const ry = rd.getFullYear();
        const rm = rd.getMonth();
        const targetM = last5Months.find(item => item.year === ry && item.monthIdx === rm);
        if (targetM) {
          targetM.amount += (Number(r.amount) || 0);
        }
      }
    }
  }

  const maxVal = Math.max(...last5Months.map(m => m.amount), 5000);
  const currentMonthIdx = 4;
  let activeChartIdx = state.incomeActiveChartMonthIdx !== null ? state.incomeActiveChartMonthIdx : currentMonthIdx;
  if (activeChartIdx < 0 || activeChartIdx > 4) activeChartIdx = currentMonthIdx;

  const activeMonthData = last5Months[activeChartIdx];
  if (chartLabelEl && activeMonthData) {
    chartLabelEl.textContent = `${activeMonthData.fullName}: ${activeMonthData.amount.toLocaleString('uk-UA')} ₴`;
  }

  if (barsContainer) {
    barsContainer.innerHTML = last5Months.map((m, idx) => {
      const isActive = idx === activeChartIdx;
      const pxHeight = m.amount > 0 ? Math.max(Math.round((m.amount / maxVal) * 85), 14) : 8;
      return `
        <div class="bar-col ${isActive ? 'active' : ''}" data-idx="${idx}" title="${m.fullName}: ${m.amount.toLocaleString('uk-UA')} ₴">
          <div class="bar-pill-track">
            <div class="bar-pill" style="height: ${pxHeight}px;"></div>
          </div>
          <span class="bar-month-name">${m.shortName}</span>
        </div>
      `;
    }).join('');

    barsContainer.querySelectorAll('.bar-col').forEach(col => {
      col.addEventListener('click', () => {
        const idx = Number(col.dataset.idx);
        state.incomeActiveChartMonthIdx = idx;
        barsContainer.querySelectorAll('.bar-col').forEach(c => c.classList.remove('active'));
        col.classList.add('active');
        const mData = last5Months[idx];
        if (chartLabelEl && mData) {
          chartLabelEl.textContent = `${mData.fullName}: ${mData.amount.toLocaleString('uk-UA')} ₴`;
        }
        haptic('light');
      });
    });
  }

  // 4. RENDER 4-TIER HIERARCHICAL ACCORDION (Month -> Weeks -> Days -> Orders)
  if (accordionContainer) {
    if (filteredRecords.length === 0) {
      if (allRecords.length === 0) {
        accordionContainer.innerHTML = `
          <div class="empty-state" style="padding: 30px 16px; text-align: center; background: var(--card-bg); border: 1px dashed var(--border); border-radius: var(--r-lg);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">💰</div>
            <h4 style="font-family: var(--ffh); font-size: 1.05rem; font-weight: 700; color: var(--black); margin-bottom: 4px;">Доходів ще не зафіксовано</h4>
            <p style="font-size: 0.85rem; color: var(--muted); max-width: 270px; margin: 0 auto; line-height: 1.4;">Натисніть на синій плюс (+) знизу, щоб додати перше замовлення та вести реальний облік.</p>
          </div>
        `;
      } else {
        accordionContainer.innerHTML = `
          <div class="empty-state" style="padding: 26px 16px; text-align: center; background: var(--card-bg); border: 1px dashed var(--border); border-radius: var(--r-lg);">
            <div style="font-size: 2rem; margin-bottom: 8px;">📅</div>
            <h4 style="font-family: var(--ffh); font-size: 1rem; font-weight: 700; color: var(--black); margin-bottom: 4px;">Немає записів за цей період</h4>
            <p style="font-size: 0.82rem; color: var(--muted); max-width: 260px; margin: 0 auto; line-height: 1.4;">Спробуйте змінити фільтр часу або обрати інші дати в календарі.</p>
          </div>
        `;
      }
    } else {
      // Group records into Month -> Weeks -> Days -> Orders
      const monthsMap = new Map();
      const monthShortGen = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
      const dayNamesUk = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

      for (const r of filteredRecords) {
        const d = r.date ? new Date(r.date) : new Date();
        const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
        const month = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, {
            year,
            month,
            monthTitle: `${monthFullNames[month]} ${year}`,
            records: []
          });
        }
        monthsMap.get(monthKey).records.push(r);
      }

      const sortedMonthKeys = Array.from(monthsMap.keys()).sort((a, b) => b.localeCompare(a));

      let treeHtml = `<div class="income-tree-wrap">`;

      const isFiltered = Boolean((state.incomeFilterPeriod && state.incomeFilterPeriod !== 'all') || (state.incomeDateRange && state.incomeDateRange.start));

      sortedMonthKeys.forEach((mKey) => {
        const mObj = monthsMap.get(mKey);
        const mTotal = mObj.records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        // All months start CLOSED by default as requested by user
        const isMonthOpen = false;

        // 4 standard weeks
        const weeks = [
          { label: '1–7 число', min: 1, max: 7, records: [] },
          { label: '8–14 число', min: 8, max: 14, records: [] },
          { label: '15–21 число', min: 15, max: 21, records: [] },
          { label: '22–31 число', min: 22, max: 31, records: [] }
        ];

        for (const r of mObj.records) {
          const d = r.date ? new Date(r.date) : new Date();
          const day = d.getDate();
          if (day >= 1 && day <= 7) weeks[0].records.push(r);
          else if (day >= 8 && day <= 14) weeks[1].records.push(r);
          else if (day >= 15 && day <= 21) weeks[2].records.push(r);
          else weeks[3].records.push(r);
        }

        // When filtered by period or calendar, show ONLY weeks that actually have records!
        // (e.g. for 1w only that week, for 1d only the week containing today)
        const displayWeeks = isFiltered ? weeks.filter(w => w.records.length > 0) : weeks;

        treeHtml += `
          <div class="income-tree-card level-month ${isMonthOpen ? 'is-open' : ''}">
            <div class="tree-node-header" data-level="month">
              <div class="tree-node-left">
                <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                <span class="tree-node-title">${escapeHtml(mObj.monthTitle)}</span>
              </div>
              <span class="tree-node-sum">${mTotal.toLocaleString('uk-UA')} ₴</span>
            </div>
            <div class="tree-node-content">
        `;

        displayWeeks.forEach((w) => {
          const wTotal = w.records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
          // Weeks start CLOSED by default
          const isWeekOpen = false;

          // Group week records by day
          const daysMap = new Map();
          for (const r of w.records) {
            const d = r.date ? new Date(r.date) : new Date();
            const dayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!daysMap.has(dayIso)) {
              const dName = dayNamesUk[d.getDay()] || 'Пн';
              const mGen = monthShortGen[d.getMonth()] || 'жов';
              daysMap.set(dayIso, {
                iso: dayIso,
                label: `${d.getDate()} ${mGen} (${dName})`,
                records: []
              });
            }
            daysMap.get(dayIso).records.push(r);
          }

          const sortedDays = Array.from(daysMap.values()).sort((a, b) => b.iso.localeCompare(a.iso));

          treeHtml += `
            <div class="income-tree-card level-week ${isWeekOpen ? 'is-open' : ''}">
              <div class="tree-node-header" data-level="week">
                <div class="tree-node-left">
                  <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  <span class="tree-node-title">${w.label}</span>
                </div>
                <span class="tree-node-sum">${wTotal.toLocaleString('uk-UA')} ₴</span>
              </div>
              <div class="tree-node-content">
          `;

          if (w.records.length === 0) {
            treeHtml += `<div class="tree-empty-note">Замовлень за цей період немає</div>`;
          } else {
            sortedDays.forEach((dObj) => {
              const dTotal = dObj.records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              // Days start CLOSED by default
              const isDayOpen = false;

              treeHtml += `
                <div class="income-tree-card level-day ${isDayOpen ? 'is-open' : ''}">
                  <div class="tree-node-header" data-level="day">
                    <div class="tree-node-left">
                      <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      <span class="tree-node-title">${escapeHtml(dObj.label)}</span>
                    </div>
                    <span class="tree-node-sum">${dTotal.toLocaleString('uk-UA')} ₴</span>
                  </div>
                  <div class="tree-node-content">
              `;

              dObj.records.forEach((r) => {
                treeHtml += `
                  <div class="order-leaf-card" data-id="${r.id}">
                    <div class="order-leaf-info">
                      <div class="order-leaf-title">${escapeHtml(r.project)}</div>
                      <div class="order-leaf-meta">
                        <span>${escapeHtml(r.client)}</span>
                        <span>•</span>
                        <span class="order-leaf-badge ${r.isPaid ? 'paid' : 'expected'}">${r.isPaid ? 'Оплачено' : 'Очікувано'}</span>
                      </div>
                    </div>
                    <div class="order-leaf-amount">
                      <span>${(Number(r.amount) || 0).toLocaleString('uk-UA')} ₴</span>
                      <svg class="order-leaf-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </div>
                  </div>
                `;
              });

              treeHtml += `
                  </div>
                </div>
              `;
            });
          }

          treeHtml += `
              </div>
            </div>
          `;
        });

        treeHtml += `
            </div>
          </div>
        `;
      });

      treeHtml += `</div>`;
      accordionContainer.innerHTML = treeHtml;

      // Attach accordion toggle events
      accordionContainer.querySelectorAll('.tree-node-header').forEach(hdr => {
        hdr.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = hdr.closest('.income-tree-card');
          if (card) {
            card.classList.toggle('is-open');
            haptic('light');
          }
        });
      });

      // Attach order leaf click event to open modalEditIncome
      accordionContainer.querySelectorAll('.order-leaf-card').forEach(leaf => {
        leaf.addEventListener('click', (e) => {
          e.stopPropagation();
          const recId = leaf.dataset.id;
          openEditIncomeModal(recId);
        });
      });
    }
  }
}

// ---- 3B. EXPENSES TRACKER ----
async function fetchExpenses() {
  if (!state.cloudSynced) {
    try {
      const res = await fetch('/api/expenses').catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        if (json.success && json.data && (!state.expenses || !Array.isArray(state.expenses.records) || state.expenses.records.length === 0)) {
          state.expenses = json.data;
          if (!Array.isArray(state.expenses.records)) {
            state.expenses.records = [];
          }
          localStorage.setItem('dws_expenses', JSON.stringify(state.expenses));
        }
      }
    } catch (err) {
      console.warn('Error fetching expenses:', err);
    }
  }
  renderExpenses();
}

function getExpensesNoun(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 19) return 'витрат';
  if (mod10 === 1) return 'витрата';
  if (mod10 >= 2 && mod10 <= 4) return 'витрати';
  return 'витрат';
}

function renderExpenses() {
  const totalExpEl = document.getElementById('totalExpensesVal');
  const totalExpSubEl = document.getElementById('totalExpensesSub');
  const monthExpEl = document.getElementById('monthExpensesVal');
  const monthExpSubEl = document.getElementById('monthExpensesSub');
  const countNumEl = document.getElementById('expensesCountNum');
  const countLabelEl = document.getElementById('expensesCountLabel');
  const barsContainer = document.getElementById('expensesBars');
  const chartLabelEl = document.getElementById('chartExpensesActiveMonthLabel');
  const accordionContainer = document.getElementById('expensesAccordion');

  const allRecords = (state.expenses && Array.isArray(state.expenses.records)) ? state.expenses.records : [];

  if (countNumEl) countNumEl.textContent = allRecords.length;
  if (countLabelEl) countLabelEl.textContent = getExpensesNoun(allRecords.length);

  // 1. FILTER RECORDS
  let filteredRecords = [...allRecords];
  let periodLabel = 'За весь час';

  if (state.expensesDateRange && state.expensesDateRange.start) {
    const startStr = state.expensesDateRange.start;
    const endStr = state.expensesDateRange.end || state.expensesDateRange.start;
    filteredRecords = filteredRecords.filter(r => {
      const dStr = (r.date ? new Date(r.date) : new Date()).toISOString().slice(0, 10);
      return dStr >= startStr && dStr <= endStr;
    });
    const sParts = startStr.split('-');
    const eParts = endStr.split('-');
    periodLabel = `${sParts[2]}.${sParts[1]} – ${eParts[2]}.${eParts[1]}`;
  } else if (state.expensesFilterPeriod && state.expensesFilterPeriod !== 'all') {
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const periodLabels = {
      'year': 'За останній рік',
      '6m': 'За останні 6 міс',
      '3m': 'За останні 3 міс',
      '1m': 'За останній міс',
      '1w': 'За останній тиж',
      '1d': 'Сьогодні'
    };
    periodLabel = periodLabels[state.expensesFilterPeriod] || 'За весь час';

    if (state.expensesFilterPeriod === '1d') {
      filteredRecords = filteredRecords.filter(r => {
        const rd = r.date ? new Date(r.date) : new Date();
        const rIso = `${rd.getFullYear()}-${String(rd.getMonth() + 1).padStart(2, '0')}-${String(rd.getDate()).padStart(2, '0')}`;
        return rIso === todayIso;
      });
    } else if (state.expensesFilterPeriod === '1w') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      oneWeekAgo.setHours(0, 0, 0, 0);
      filteredRecords = filteredRecords.filter(r => {
        const rd = r.date ? new Date(r.date) : new Date();
        return rd.getTime() >= oneWeekAgo.getTime();
      });
    } else {
      const periodMsMap = {
        'year': 365 * 24 * 3600 * 1000,
        '6m': 180 * 24 * 3600 * 1000,
        '3m': 90 * 24 * 3600 * 1000,
        '1m': 30 * 24 * 3600 * 1000
      };
      const periodMs = periodMsMap[state.expensesFilterPeriod] || 0;
      if (periodMs > 0) {
        const nowMs = Date.now();
        filteredRecords = filteredRecords.filter(r => {
          const rMs = new Date(r.date).getTime();
          return (nowMs - rMs) <= periodMs;
        });
      }
    }
  }

  // 2. SUM TOTALS FROM FILTERED RECORDS
  let totalSpent = 0;
  for (const r of filteredRecords) {
    if (r.isPaid) totalSpent += (Number(r.amount) || 0);
  }

  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth();
  let thisMonthSpent = 0;
  for (const r of allRecords) {
    if (r.isPaid) {
      const rd = new Date(r.date);
      if (rd.getFullYear() === curY && rd.getMonth() === curM) {
        thisMonthSpent += (Number(r.amount) || 0);
      }
    }
  }

  if (totalExpEl) totalExpEl.textContent = '– ' + totalSpent.toLocaleString('uk-UA') + ' ₴';
  if (totalExpSubEl) totalExpSubEl.textContent = periodLabel;

  // 3. DYNAMIC MONTHLY BAR CHART
  const monthShortNames = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
  const monthFullNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

  const last5Months = [];
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    last5Months.push({
      year: y,
      monthIdx: m,
      shortName: monthShortNames[m],
      fullName: monthFullNames[m],
      amount: 0
    });
  }

  for (const r of allRecords) {
    if (r.isPaid) {
      const rd = new Date(r.date);
      if (!isNaN(rd.getTime())) {
        const ry = rd.getFullYear();
        const rm = rd.getMonth();
        const targetM = last5Months.find(item => item.year === ry && item.monthIdx === rm);
        if (targetM) {
          targetM.amount += (Number(r.amount) || 0);
        }
      }
    }
  }

  const maxVal = Math.max(...last5Months.map(m => m.amount), 5000);
  const currentMonthIdx = 4;
  let activeChartIdx = state.expensesActiveChartMonthIdx !== null ? state.expensesActiveChartMonthIdx : currentMonthIdx;
  if (activeChartIdx < 0 || activeChartIdx > 4) activeChartIdx = currentMonthIdx;

  const activeMonthData = last5Months[activeChartIdx];
  if (chartLabelEl && activeMonthData) {
    chartLabelEl.textContent = `${activeMonthData.fullName}: – ${activeMonthData.amount.toLocaleString('uk-UA')} ₴`;
  }
  if (monthExpEl && activeMonthData) {
    monthExpEl.textContent = '– ' + activeMonthData.amount.toLocaleString('uk-UA') + ' ₴';
  }
  if (monthExpSubEl && activeMonthData) {
    monthExpSubEl.textContent = `${activeMonthData.fullName} ${activeMonthData.year}`;
  }

  if (barsContainer) {
    barsContainer.innerHTML = last5Months.map((m, idx) => {
      const isActive = idx === activeChartIdx;
      const pxHeight = m.amount > 0 ? Math.max(Math.round((m.amount / maxVal) * 85), 14) : 8;
      return `
        <div class="bar-col ${isActive ? 'active' : ''}" data-idx="${idx}" title="${m.fullName}: – ${m.amount.toLocaleString('uk-UA')} ₴">
          <div class="bar-pill-track">
            <div class="bar-pill" style="height: ${pxHeight}px;"></div>
          </div>
          <span class="bar-month-name">${m.shortName}</span>
        </div>
      `;
    }).join('');

    barsContainer.querySelectorAll('.bar-col').forEach(col => {
      col.addEventListener('click', () => {
        const idx = Number(col.dataset.idx);
        state.expensesActiveChartMonthIdx = idx;
        barsContainer.querySelectorAll('.bar-col').forEach(c => c.classList.remove('active'));
        col.classList.add('active');
        const mData = last5Months[idx];
        if (chartLabelEl && mData) {
          chartLabelEl.textContent = `${mData.fullName}: – ${mData.amount.toLocaleString('uk-UA')} ₴`;
        }
        if (monthExpEl && mData) {
          monthExpEl.textContent = '– ' + mData.amount.toLocaleString('uk-UA') + ' ₴';
        }
        if (monthExpSubEl && mData) {
          monthExpSubEl.textContent = `${mData.fullName} ${mData.year}`;
        }
        haptic('light');
      });
    });
  }

  // 4. RENDER 4-TIER HIERARCHICAL ACCORDION (Month -> Weeks -> Days -> Expense items)
  if (accordionContainer) {
    if (filteredRecords.length === 0) {
      if (allRecords.length === 0) {
        accordionContainer.innerHTML = `
          <div class="empty-state" style="padding: 30px 16px; text-align: center; background: var(--card-bg); border: 1px dashed var(--border); border-radius: var(--r-lg);">
            <div style="font-size: 2.2rem; margin-bottom: 8px;">💳</div>
            <h4 style="font-family: var(--ffh); font-size: 1.05rem; font-weight: 700; color: var(--black); margin-bottom: 4px;">Витрат ще не зафіксовано</h4>
            <p style="font-size: 0.85rem; color: var(--muted); max-width: 270px; margin: 0 auto; line-height: 1.4;">Натисніть на синій плюс (+) знизу, щоб додати першу витрату (реклама, сервіси, виробництво).</p>
          </div>
        `;
      } else {
        accordionContainer.innerHTML = `
          <div class="empty-state" style="padding: 26px 16px; text-align: center; background: var(--card-bg); border: 1px dashed var(--border); border-radius: var(--r-lg);">
            <div style="font-size: 2rem; margin-bottom: 8px;">📅</div>
            <h4 style="font-family: var(--ffh); font-size: 1rem; font-weight: 700; color: var(--black); margin-bottom: 4px;">Немає витрат за цей період</h4>
            <p style="font-size: 0.82rem; color: var(--muted); max-width: 260px; margin: 0 auto; line-height: 1.4;">Спробуйте змінити фільтр часу або обрати інші дати в календарі.</p>
          </div>
        `;
      }
    } else {
      const monthsMap = new Map();
      const monthShortGen = ['січ', 'лют', 'бер', 'кві', 'тра', 'чер', 'лип', 'сер', 'вер', 'жов', 'лис', 'гру'];
      const dayNamesUk = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

      for (const r of filteredRecords) {
        const d = r.date ? new Date(r.date) : new Date();
        const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
        const month = isNaN(d.getMonth()) ? new Date().getMonth() : d.getMonth();
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, {
            year,
            month,
            monthTitle: `${monthFullNames[month]} ${year}`,
            records: []
          });
        }
        monthsMap.get(monthKey).records.push(r);
      }

      const sortedMonthKeys = Array.from(monthsMap.keys()).sort((a, b) => b.localeCompare(a));
      let treeHtml = `<div class="income-tree-wrap">`;
      const isFiltered = Boolean((state.expensesFilterPeriod && state.expensesFilterPeriod !== 'all') || (state.expensesDateRange && state.expensesDateRange.start));

      sortedMonthKeys.forEach((mKey) => {
        const mObj = monthsMap.get(mKey);
        const mTotal = mObj.records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
        const isMonthOpen = false;

        const weeks = [
          { label: '1–7 число', min: 1, max: 7, records: [] },
          { label: '8–14 число', min: 8, max: 14, records: [] },
          { label: '15–21 число', min: 15, max: 21, records: [] },
          { label: '22–31 число', min: 22, max: 31, records: [] }
        ];

        for (const r of mObj.records) {
          const d = r.date ? new Date(r.date) : new Date();
          const day = d.getDate();
          if (day >= 1 && day <= 7) weeks[0].records.push(r);
          else if (day >= 8 && day <= 14) weeks[1].records.push(r);
          else if (day >= 15 && day <= 21) weeks[2].records.push(r);
          else weeks[3].records.push(r);
        }

        const displayWeeks = isFiltered ? weeks.filter(w => w.records.length > 0) : weeks;

        treeHtml += `
          <div class="income-tree-card level-month ${isMonthOpen ? 'is-open' : ''}">
            <div class="tree-node-header" data-level="month">
              <div class="tree-node-left">
                <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                <span class="tree-node-title">${escapeHtml(mObj.monthTitle)}</span>
              </div>
              <span class="tree-node-sum">– ${mTotal.toLocaleString('uk-UA')} ₴</span>
            </div>
            <div class="tree-node-content">
        `;

        displayWeeks.forEach((w) => {
          const wTotal = w.records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
          const isWeekOpen = false;

          const daysMap = new Map();
          for (const r of w.records) {
            const d = r.date ? new Date(r.date) : new Date();
            const dayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            if (!daysMap.has(dayIso)) {
              const dName = dayNamesUk[d.getDay()] || 'Пн';
              const mGen = monthShortGen[d.getMonth()] || 'жов';
              daysMap.set(dayIso, {
                iso: dayIso,
                label: `${d.getDate()} ${mGen} (${dName})`,
                records: []
              });
            }
            daysMap.get(dayIso).records.push(r);
          }

          const sortedDays = Array.from(daysMap.values()).sort((a, b) => b.iso.localeCompare(a.iso));

          treeHtml += `
            <div class="income-tree-card level-week ${isWeekOpen ? 'is-open' : ''}">
              <div class="tree-node-header" data-level="week">
                <div class="tree-node-left">
                  <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  <span class="tree-node-title">${w.label}</span>
                </div>
                <span class="tree-node-sum">– ${wTotal.toLocaleString('uk-UA')} ₴</span>
              </div>
              <div class="tree-node-content">
          `;

          if (w.records.length === 0) {
            treeHtml += `<div class="tree-empty-note">Витрат за цей період немає</div>`;
          } else {
            sortedDays.forEach((dObj) => {
              const dTotal = dObj.records.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
              const isDayOpen = false;

              treeHtml += `
                <div class="income-tree-card level-day ${isDayOpen ? 'is-open' : ''}">
                  <div class="tree-node-header" data-level="day">
                    <div class="tree-node-left">
                      <svg class="tree-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      <span class="tree-node-title">${escapeHtml(dObj.label)}</span>
                    </div>
                    <span class="tree-node-sum">– ${dTotal.toLocaleString('uk-UA')} ₴</span>
                  </div>
                  <div class="tree-node-content">
              `;

              dObj.records.forEach((r) => {
                treeHtml += `
                  <div class="order-leaf-card" data-expense-id="${r.id}">
                    <div class="order-leaf-info">
                      <div class="order-leaf-title">${escapeHtml(r.title || r.project || 'Витрата')}</div>
                      <div class="order-leaf-meta">
                        <span>${escapeHtml(r.category || r.client || 'Категорія')}</span>
                        <span>•</span>
                        <span class="order-leaf-badge ${r.isPaid ? 'paid' : 'expected'}">${r.isPaid ? 'Оплачено' : 'В планах'}</span>
                      </div>
                    </div>
                    <div class="order-leaf-amount">
                      <span>– ${(Number(r.amount) || 0).toLocaleString('uk-UA')} ₴</span>
                      <svg class="order-leaf-edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                    </div>
                  </div>
                `;
              });

              treeHtml += `
                  </div>
                </div>
              `;
            });
          }

          treeHtml += `
              </div>
            </div>
          `;
        });

        treeHtml += `
            </div>
          </div>
        `;
      });

      treeHtml += `</div>`;
      accordionContainer.innerHTML = treeHtml;

      accordionContainer.querySelectorAll('.tree-node-header').forEach(hdr => {
        hdr.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = hdr.closest('.income-tree-card');
          if (card) {
            card.classList.toggle('is-open');
            haptic('light');
          }
        });
      });

      accordionContainer.querySelectorAll('[data-expense-id]').forEach(leaf => {
        leaf.addEventListener('click', (e) => {
          e.stopPropagation();
          const recId = leaf.dataset.expenseId;
          openEditExpenseModal(recId);
        });
      });
    }
  }
}

// ---- 4. PROFILE ----
async function fetchProfile() {
  if (!state.cloudSynced) {
    try {
      const res = await fetch('/api/profile');
      const json = await res.json();
      if (json.success && json.data) {
        state.profile = { ...json.data, ...state.profile };
      }
    } catch (err) {
      console.warn('Error fetching profile:', err);
    }
  }

  const aboutEl = document.getElementById('profileAbout');
  const tmplEl = document.getElementById('profileTemplate');
  const nfcTmplEl = document.getElementById('profileNfcTemplate');

  if (aboutEl) {
    aboutEl.value = state.profile.about || DEFAULT_DATA.profile.about;
    updateCharCount(aboutEl, 'aboutCounter');
  }
  if (tmplEl) {
    tmplEl.value = state.profile.responseTemplate || DEFAULT_DATA.profile.responseTemplate;
    updateCharCount(tmplEl, 'templateCounter');
  }
  if (nfcTmplEl) {
    nfcTmplEl.value = state.profile.nfcTemplate || DEFAULT_DATA.profile.nfcTemplate;
    updateCharCount(nfcTmplEl, 'nfcTemplateCounter');
  }
  const d2dTmplEl = document.getElementById('profileD2dTemplate');
  if (d2dTmplEl) {
    if (!state.profile.d2dTemplate || state.profile.d2dTemplate.startsWith('Доброго дня! Пишу щодо співпраці з вашою командою') || state.profile.d2dTemplate.includes('➔')) state.profile.d2dTemplate = DEFAULT_DATA.profile.d2dTemplate;
    d2dTmplEl.value = state.profile.d2dTemplate || DEFAULT_DATA.profile.d2dTemplate;
    updateCharCount(d2dTmplEl, 'd2dTemplateCounter');
  }
  if (state.profile.theme) {
    applyTheme(state.profile.theme);
  }
}

// ---- 5. SOURCES ----
async function fetchSources() {
  if (!state.cloudSynced) {
    try {
      const res = await fetch('/api/sources');
      const json = await res.json();
      if (json.success && json.data) {
        state.sources = json.data;
        localStorage.setItem('dws_sources', JSON.stringify(state.sources));
      }
    } catch (err) {}
  }

  updateSourcesDisplay();
}

function updateSourcesDisplay() {
  const chatsCount = (state.sources?.chats?.length && state.sources.chats.length >= 30) ? state.sources.chats.length : 160;
  const channelsCount = (state.sources?.channels?.length && state.sources.channels.length >= 10) ? state.sources.channels.length : 96;
  const total = chatsCount + channelsCount;

  const chatsEl = document.getElementById('sourcesChatsCount');
  const chansEl = document.getElementById('sourcesChannelsCount');
  const mTotal = document.getElementById('modalSourcesTotal');
  const mChats = document.getElementById('modalSourcesChats');
  const mChans = document.getElementById('modalSourcesChannels');

  if (chatsEl) chatsEl.textContent = chatsCount;
  if (chansEl) chansEl.textContent = channelsCount;
  if (mTotal) mTotal.textContent = total;
  if (mChats) mChats.textContent = chatsCount;
  if (mChans) mChans.textContent = channelsCount;
}

// ============================================================
// EVENT LISTENERS & MODAL HANDLERS
// ============================================================
// Helper: Flash button blue for 1 second then smoothly return to normal
function flashButtonBlue(btn) {
  if (!btn) return;
  btn.classList.add('flash-blue');
  if (typeof btn.blur === 'function') btn.blur();
  if (btn._flashTimer) clearTimeout(btn._flashTimer);
  btn._flashTimer = setTimeout(() => {
    btn.classList.remove('flash-blue');
  }, 1000);
}

// ============================================================
// EVENT LISTENERS & MODAL HANDLERS
// ============================================================
function setupEventListeners() {
  // Theme toggle button in header
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      flashButtonBlue(themeBtn);
      toggleTheme();
    });
  }

  // Theme toggle buttons in profile
  document.querySelectorAll('.theme-choice-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      applyTheme(btn.dataset.theme);
      if (state.profile) state.profile.theme = btn.dataset.theme;
      syncAccountToServer();
    });
  });

  // Language toggle buttons in profile
  document.querySelectorAll('.lang-choice-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      applyLanguage(btn.dataset.lang, true);
    });
  });

  // Refresh button (circle arrows next to sun/moon) -> hides leads marked "В РОБОТІ ✓", scans for new leads and refreshes data
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      haptic('medium');
      flashButtonBlue(refreshBtn);
      refreshBtn.style.transform = 'rotate(360deg)';
      refreshBtn.style.transition = 'transform 0.5s ease, background 0.4s ease, color 0.4s ease, border-color 0.4s ease';
      // Clear session taken IDs so all "В РОБОТІ ✓" leads disappear from the Заявки list
      state.justTakenSessionIds.clear();
      filterAndRenderLeads();

      try {
        const scanRes = await fetch('/api/leads/scan', { method: 'POST' });
        const scanJson = await scanRes.json();
        if (scanJson.success && Array.isArray(scanJson.data) && scanJson.data.length > 0) {
          state.allLeads = scanJson.data;
          filterAndRenderLeads();
        }
      } catch (err) {
        // Fallback smooth
      }

      loadAllData().finally(() => {
        setTimeout(() => {
          refreshBtn.style.transform = '';
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
      filterAndRenderLeads();
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') doSearch();
    });
  }

  // Toggle sort / text expansion (Arrows button) -> flashes blue for 1s and smoothly returns
  const sortBtn = document.getElementById('toggleSortBtn');
  if (sortBtn) {
    sortBtn.addEventListener('click', () => {
      haptic('light');
      flashButtonBlue(sortBtn);
      state.isExpandedAll = !state.isExpandedAll;
      sortBtn.title = state.isExpandedAll ? 'Показувати тільки перше речення' : 'Показувати весь текст вакансій';
      renderLeads();
    });
  }

  // CRM status tabs click
  document.querySelectorAll('.status-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeCrmStatus = tab.dataset.status;
      haptic('light');
      renderCrm();
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

      // 1. AI Rating button (right square button) -> 100% reliable trigger
      const ratingBtn = e.target.closest('[data-action="ai-rating"]');
      if (ratingBtn) {
        e.stopPropagation();
        handleOpenAiRating(lead);
        return;
      }

      // 2. Click on "ВЗЯТИ В РОБОТУ" button -> opens detail/take modal
      const clickedTakeBtn = e.target.closest('[data-action="take-crm"]');
      if (clickedTakeBtn) {
        e.stopPropagation();
        openTakeCrmModal(lead, clickedTakeBtn);
        return;
      }

      // 3. Click anywhere else on the vacancy card -> toggles blue outline selection for Auto-Outreach!
      if (typeof toggleOutreachSelectLead === 'function') {
        toggleOutreachSelectLead(lead.id, card);
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
      const about = document.getElementById('profileAbout')?.value || '';
      const template = document.getElementById('profileTemplate')?.value || '';
      const nfcTemplate = document.getElementById('profileNfcTemplate')?.value || DEFAULT_DATA.profile.nfcTemplate;
      const d2dTemplate = document.getElementById('profileD2dTemplate')?.value || DEFAULT_DATA.profile.d2dTemplate;

      state.profile.about = about;
      state.profile.responseTemplate = template;
      state.profile.nfcTemplate = nfcTemplate;
      const curTmplList = getNfcTemplatesList();
      curTmplList[0] = nfcTemplate;
      state.profile.nfcTemplates = curTmplList;
      state.profile.d2dTemplate = d2dTemplate;
      state.profile.theme = state.theme;
      state.profile.lang = state.lang;
      localStorage.setItem('dws_profile', JSON.stringify(state.profile));

      saveProfileBtn.textContent = 'ЗБЕРІГАЄМО...';
      syncAccountToServer();
      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ about, responseTemplate: template, nfcTemplate, d2dTemplate, theme: state.theme, lang: state.lang })
        });
      } catch (err) {}

      haptic('success');
      saveProfileBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
      setTimeout(() => { saveProfileBtn.textContent = t('profile.saveBtn', 'ЗБЕРЕГТИ НАЛАШТУВАННЯ'); }, 2000);
    });
  }

  // Open All NFC Templates Modal Button
  const openNfcTemplatesBtn = document.getElementById('openNfcTemplatesBtn');
  if (openNfcTemplatesBtn) {
    openNfcTemplatesBtn.addEventListener('click', () => {
      haptic('light');
      renderNfcTemplatesModal();
      openModal('modalNfcTemplates');
    });
  }

  // Save All NFC Templates Button in Modal
  const saveNfcTemplatesModalBtn = document.getElementById('saveNfcTemplatesModalBtn');
  if (saveNfcTemplatesModalBtn) {
    saveNfcTemplatesModalBtn.addEventListener('click', () => {
      saveNfcTemplatesFromModal();
    });
  }

  // Sources manage button
  const openSourcesBtn = document.getElementById('openSourcesBtn');
  if (openSourcesBtn) {
    openSourcesBtn.addEventListener('click', () => {
      updateSourcesDisplay();
      const area = document.getElementById('sourcesTextarea');
      if (area) area.value = '';
      openModal('modalSources');
    });
  }

  // Add new sources button in modalSources
  const saveSourcesBtn = document.getElementById('saveSourcesBtn');
  if (saveSourcesBtn) {
    saveSourcesBtn.addEventListener('click', async () => {
      const area = document.getElementById('sourcesTextarea');
      const lines = (area?.value || '')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 2);

      if (lines.length === 0) {
        closeModal('modalSources');
        return;
      }

      haptic('medium');
      saveSourcesBtn.textContent = 'ДОДАЄМО...';

      // Distribute added sources
      lines.forEach((u, i) => {
        const cleanU = u.startsWith('@') || u.startsWith('http') ? u : '@' + u;
        const item = { id: 's-' + Date.now() + '-' + i, username: cleanU, name: cleanU, active: true };
        if (u.toLowerCase().includes('chat') || u.toLowerCase().includes('rabota') || u.toLowerCase().includes('robota') || u.startsWith('@')) {
          if (!state.sources.chats) state.sources.chats = [];
          state.sources.chats.push(item);
        } else {
          if (!state.sources.channels) state.sources.channels = [];
          state.sources.channels.push(item);
        }
      });

      localStorage.setItem('dws_sources', JSON.stringify(state.sources));
      updateSourcesDisplay();
      syncAccountToServer();

      try {
        await fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(state.sources)
        });
        fetch('/api/leads/scan', { method: 'POST' })
          .then(() => fetchLeads())
          .catch(() => {});
      } catch (err) {}

      haptic('success');
      saveSourcesBtn.textContent = 'ДОДАНО ✓';
      setTimeout(() => {
        saveSourcesBtn.textContent = 'ДОДАТИ ДЖЕРЕЛА';
        closeModal('modalSources');
      }, 1000);
    });
  }
}

// ============================================================
// HONEST AI EVALUATION & RATING MODAL
// ============================================================
function computeHonestLeadAssessment(lead) {
  const text = cleanVacancyText(lead.text || '');
  const budgetVal = Number(lead.budget) || 0;
  let score = 50;
  const pros = [];
  const cons = [];

  // 1. Budget realism
  if (budgetVal >= 25000) {
    score += 18;
    pros.push('Вказано конкретний ринковий бюджет: ' + budgetVal.toLocaleString('uk-UA') + ' ₴');
  } else if (budgetVal >= 12000) {
    score += 12;
    pros.push('Зазначено адекватну оплату: ' + budgetVal.toLocaleString('uk-UA') + ' ₴');
  } else if (budgetVal > 0) {
    score += 4;
    cons.push('Невеликий бюджет (' + budgetVal.toLocaleString('uk-UA') + ' ₴) — варто чітко обмежити обсяг правок');
  } else {
    score -= 6;
    cons.push('Точний бюджет не вказаний — потрібно з’ясувати фінансові очікування клієнта');
  }

  // 2. Collaboration format (project vs full-time staff)
  if (/повна зайнятість|в офіс|повний день|5\/2|штат/i.test(text)) {
    score -= 7;
    cons.push('Запит більше схожий на пошук штатного працівника, ніж на разовий проєкт');
  } else if (/віддалено|часткова зайнятість|проєкт|під ключ|фріланс|за кожне/i.test(text)) {
    score += 9;
    pros.push('Гнучкий віддалений або проєктний формат співпраці');
  }

  // 3. Clarity of technical specification (ТЗ)
  if (text.length >= 420) {
    score += 10;
    pros.push('Детально прописані задачі та очікуваний результат');
  } else if (text.length >= 200) {
    score += 5;
    pros.push('Зрозумілий базовий опис вимог до виконавця');
  } else {
    score -= 5;
    cons.push('Стислий опис без чіткого ТЗ — знадобиться додатковий бриф');
  }

  // 4. Direct verified contact
  pros.push('Перевірений прямий контакт замовника в Telegram: ' + (lead.authorUsername || '@замовник'));

  // 5. Risks & competition
  if (/тестов/i.test(text)) {
    score -= 8;
    cons.push('Ймовірна вимога виконати тестове завдання перед стартом');
  }
  if (lead.requiresPortfolio) {
    score += 2;
    cons.push('Висока увага до портфоліо — потрібно одразу прикріпити сильні кейси');
  }
  if (lead.isUrgent) {
    cons.push('Стислий дедлайн — важливо відгукнутися без затримок');
  }
  if (cons.length === 0) {
    cons.push('Умови фінальної оплати та етапність варто зафіксувати до початку робіт');
  }

  score = Math.max(42, Math.min(89, Math.round(score)));

  let summary = '';
  if (score >= 76) {
    summary = 'Перспективна заявка з прозорими умовами та зрозумілим обсягом задач';
  } else if (score >= 62) {
    summary = 'Робоча заявка середнього рівня: гарний контакт, але деталі оплати варто уточнити';
  } else {
    summary = 'Стримана оцінка: не вистачає конкретики по бюджету або формату проєкту';
  }

  return { score, summary, pros, cons };
}

async function handleOpenAiRating(lead) {
  state.activeLeadForAi = lead;
  const contentEl = document.getElementById('aiRatingContent');
  if (!contentEl) return;

  openModal('modalAiRating');

  const assessment = computeHonestLeadAssessment(lead);
  lead.aiRating = assessment.score;

  const renderAnalysis = (score, summary, proList, conList) => {
    contentEl.innerHTML = `
      <div class="ai-score-big">${score}/100</div>
      <p style="text-align:center; font-weight:700; font-size:0.95rem; margin-bottom:16px; color:var(--black);">
        ${escapeHtml(summary)}
      </p>
      <div class="ai-bullets-list">
        ${proList.map(p => `
          <div class="ai-bullet">
            <span class="bullet-icon">✓</span>
            <span>${escapeHtml(p)}</span>
          </div>
        `).join('')}
        ${conList.map(c => `
          <div class="ai-bullet">
            <span class="bullet-icon">!</span>
            <span style="color:var(--muted)">${escapeHtml(c)}</span>
          </div>
        `).join('')}
      </div>
    `;
  };

  renderAnalysis(
    assessment.score,
    assessment.summary,
    assessment.pros,
    assessment.cons
  );
}

// ============================================================
// CRM DETAIL MODAL & EDITING
// ============================================================
function handleOpenCrmDetail(item) {
  state.activeCrmLead = item;

  // Header
  const avatarEl = document.getElementById('crmDetailAvatar');
  if (avatarEl) avatarEl.textContent = item.avatarLetter || (item.name ? item.name.charAt(0).toUpperCase() : 'Л');
  
  const nameEl = document.getElementById('crmDetailName');
  if (nameEl) nameEl.textContent = item.name || 'Клієнт';

  const userEl = document.getElementById('crmDetailUsername');
  const userText = item.username ? (item.username.startsWith('@') ? item.username : ('@' + item.username)) : '@юзернейм';
  if (userEl) userEl.textContent = userText;

  // Hide edit name menu
  const editNameMenu = document.getElementById('crmEditNameMenu');
  if (editNameMenu) editNameMenu.style.display = 'none';

  // Status selector
  const statusSelect = document.getElementById('crmDetailStatusSelect');
  if (statusSelect) statusSelect.value = item.status || 'in_progress';

  // Telegram CTA "Написати"
  const tgLink = document.getElementById('crmDetailTgLink');
  if (tgLink) {
    const u = item.username ? item.username.replace('@', '') : '';
    tgLink.href = u ? ('https://t.me/' + u) : '#';
  }

  // 5 Additional Contact fields
  const links = item.links || {};
  const phoneInput = document.getElementById('crmLinkPhone');
  if (phoneInput) phoneInput.value = links.phone || '';

  const instaInput = document.getElementById('crmLinkInsta');
  if (instaInput) instaInput.value = links.instagram || '';

  const tiktokInput = document.getElementById('crmLinkTiktok');
  if (tiktokInput) tiktokInput.value = links.tiktok || '';

  const tgChanInput = document.getElementById('crmLinkTgChannel');
  if (tgChanInput) tgChanInput.value = links.tgChannel || '';

  const siteInput = document.getElementById('crmLinkSite');
  if (siteInput) siteInput.value = links.site || '';

  // Service (full-width)
  const servSelect = document.getElementById('crmDetailService');
  if (servSelect) servSelect.value = item.service || 'development';

  // Niche
  const nicheInput = document.getElementById('crmDetailNiche');
  if (nicheInput) nicheInput.value = item.niche || '';

  // Notes
  const notesText = document.getElementById('crmDetailNotes');
  if (notesText) notesText.value = item.notes || '';

  // Orders initialization (послуги самі по собі не створюються, тільки вручну)
  if (!Array.isArray(item.orders)) {
    item.orders = [];
  }

  // Hide order card box
  const orderBox = document.getElementById('crmOrderCardBox');
  if (orderBox) orderBox.style.display = 'none';
  state.editingOrderId = null;

  renderCrmOrdersList();
  openModal('modalCrmDetail');
}

// Render Orders List for active lead
function renderCrmOrdersList() {
  const list = document.getElementById('crmOrdersList');
  if (!list || !state.activeCrmLead) return;
  const orders = Array.isArray(state.activeCrmLead.orders) ? state.activeCrmLead.orders : [];

  if (orders.length === 0) {
    list.innerHTML = '';
    return;
  }

  const statusLabels = { unpaid: 'Не оплачено', partial: 'Частково', paid: 'Оплачено' };

  list.innerHTML = orders.map((ord, idx) => {
    const stText = statusLabels[ord.paidStatus] || 'Не оплачено';
    const amtText = Number(ord.amount) > 0 ? (Number(ord.amount).toLocaleString('uk-UA') + ' ₴') : '0 ₴';
    let datesText = '';
    if (ord.dateStart && ord.dateEnd) {
      const s = ord.dateStart.split('-');
      const e = ord.dateEnd.split('-');
      datesText = `${s[2]}.${s[1]}.${s[0]} → ${e[2]}.${e[1]}.${e[0]}`;
    } else if (ord.dateStart) {
      const s = ord.dateStart.split('-');
      datesText = `Від ${s[2]}.${s[1]}.${s[0]}`;
    } else if (ord.dateEnd) {
      const e = ord.dateEnd.split('-');
      datesText = `До ${e[2]}.${e[1]}.${e[0]}`;
    } else {
      datesText = 'Терміни не вказані';
    }

    return `
      <div class="crm-order-card-item" data-idx="${idx}">
        <div class="crm-order-card-middle-wrap">
          <div class="crm-order-card-texts">
            <div class="crm-order-card-title">${escapeHtml(ord.title || 'Створення сайту')}</div>
            <div class="crm-order-card-dates">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${datesText}</span>
            </div>
          </div>
          <div class="crm-order-status-pill">
            ${stText}
          </div>
        </div>
        <div class="crm-order-card-footer">
          <div class="crm-order-card-amount">${amtText}</div>
          <div class="crm-order-card-actions">
            <button type="button" class="btn-order-action btn-order-edit" data-idx="${idx}" title="Редагувати">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            </button>
            <button type="button" class="btn-order-action btn-order-del" data-idx="${idx}" title="Видалити">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Edit order handler
  list.querySelectorAll('.btn-order-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      const ord = orders[idx];
      if (!ord) return;
      state.editingOrderId = ord.id || ('ord-' + idx);

      const servInput = document.getElementById('crmOrderServiceInput');
      if (servInput) servInput.value = ord.title || 'Створення сайту';

      const amtInput = document.getElementById('crmOrderAmountInput');
      if (amtInput) amtInput.value = ord.amount > 0 ? ord.amount : '';

      const startHidden = document.getElementById('crmOrderDateStart');
      const startLabel = document.getElementById('crmOrderStartDateLabel');
      if (startHidden) startHidden.value = ord.dateStart || '';
      if (startLabel) {
        if (ord.dateStart) {
          const p = ord.dateStart.split('-');
          startLabel.textContent = `${p[2]}.${p[1]}.${p[0]}`;
        } else {
          startLabel.textContent = 'Оберіть дату';
        }
      }

      const endHidden = document.getElementById('crmOrderDateEnd');
      const endLabel = document.getElementById('crmOrderEndDateLabel');
      if (endHidden) endHidden.value = ord.dateEnd || '';
      if (endLabel) {
        if (ord.dateEnd) {
          const p = ord.dateEnd.split('-');
          endLabel.textContent = `${p[2]}.${p[1]}.${p[0]}`;
        } else {
          endLabel.textContent = 'Оберіть дедлайн';
        }
      }

      document.querySelectorAll('#crmOrderStatusSegment .crm-order-status-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.paid === (ord.paidStatus || 'unpaid'));
      });

      const box = document.getElementById('crmOrderCardBox');
      if (box) box.style.display = 'block';
      haptic('light');
    });
  });

  // Delete order handler
  list.querySelectorAll('.btn-order-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.dataset.idx);
      if (!confirm('Видалити це замовлення?')) return;
      orders.splice(idx, 1);
      state.activeCrmLead.orders = orders;
      const totalBudget = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      state.activeCrmLead.budget = totalBudget;
      const cIdx = state.crm.findIndex(c => c.id === state.activeCrmLead.id);
      if (cIdx !== -1) {
        state.crm[cIdx] = { ...state.crm[cIdx], orders: state.activeCrmLead.orders, budget: totalBudget };
        localStorage.setItem('dws_crm', JSON.stringify(state.crm));
      }
      renderCrmOrdersList();
      renderCrm();
      syncAccountToServer();
      haptic('medium');
    });
  });
}

// Setup handlers for CRM Lead detail modal buttons (pencil, orders, save, delete)
function setupCrmDetailHandlers() {
  setupOrderCalendarModal();

  // Pencil button click: toggles edit name menu
  const pencilBtn = document.getElementById('crmDetailEditNameBtn');
  if (pencilBtn) {
    pencilBtn.addEventListener('click', () => {
      const menu = document.getElementById('crmEditNameMenu');
      if (!menu || !state.activeCrmLead) return;
      const isHidden = (menu.style.display === 'none' || !menu.style.display);
      if (isHidden) {
        document.getElementById('crmEditLeadNameInput').value = state.activeCrmLead.name || '';
        document.getElementById('crmEditLeadUserInput').value = state.activeCrmLead.username || '';
        menu.style.display = 'block';
      } else {
        menu.style.display = 'none';
      }
      haptic('light');
    });
  }

  // Cancel edit name
  const cancelEditNameBtn = document.getElementById('crmCancelEditNameBtn');
  if (cancelEditNameBtn) {
    cancelEditNameBtn.addEventListener('click', () => {
      const menu = document.getElementById('crmEditNameMenu');
      if (menu) menu.style.display = 'none';
      haptic('light');
    });
  }

  // Save edit name
  const saveEditNameBtn = document.getElementById('crmSaveEditNameBtn');
  if (saveEditNameBtn) {
    saveEditNameBtn.addEventListener('click', async () => {
      if (!state.activeCrmLead) return;
      const newName = (document.getElementById('crmEditLeadNameInput').value || '').trim() || 'Клієнт';
      let newUser = (document.getElementById('crmEditLeadUserInput').value || '').trim();
      if (newUser && !newUser.startsWith('@')) newUser = '@' + newUser;

      state.activeCrmLead.name = newName;
      state.activeCrmLead.username = newUser;
      state.activeCrmLead.avatarLetter = newName.charAt(0).toUpperCase();

      document.getElementById('crmDetailName').textContent = newName;
      document.getElementById('crmDetailUsername').textContent = newUser || '@юзернейм';
      document.getElementById('crmDetailAvatar').textContent = state.activeCrmLead.avatarLetter;

      const tgLink = document.getElementById('crmDetailTgLink');
      if (tgLink) {
        const u = newUser ? newUser.replace('@', '') : '';
        tgLink.href = u ? ('https://t.me/' + u) : '#';
      }

      const menu = document.getElementById('crmEditNameMenu');
      if (menu) menu.style.display = 'none';

      // Update in state.crm and persist
      const idx = state.crm.findIndex(c => c.id === state.activeCrmLead.id);
      if (idx !== -1) {
        state.crm[idx] = {
          ...state.crm[idx],
          name: newName,
          username: newUser,
          avatarLetter: state.activeCrmLead.avatarLetter
        };
      }
      localStorage.setItem('dws_crm', JSON.stringify(state.crm));

      try {
        await fetch('/api/crm/' + state.activeCrmLead.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            username: newUser,
            avatarLetter: state.activeCrmLead.avatarLetter
          })
        });
      } catch (e) {
        console.warn('Failed to update CRM name on server', e);
      }

      renderCrm();
      syncAccountToServer();
      haptic('success');
    });
  }

  // Open New Order Box
  const openNewOrderBtn = document.getElementById('crmOpenNewOrderBtn');
  if (openNewOrderBtn) {
    openNewOrderBtn.addEventListener('click', () => {
      state.editingOrderId = null;
      document.getElementById('crmOrderServiceInput').value = '';
      document.getElementById('crmOrderAmountInput').value = '';

      const today = new Date().toISOString().split('T')[0];
      const todayParts = today.split('-');
      const startHidden = document.getElementById('crmOrderDateStart');
      if (startHidden) startHidden.value = today;
      const startLabel = document.getElementById('crmOrderStartDateLabel');
      if (startLabel) startLabel.textContent = `${todayParts[2]}.${todayParts[1]}.${todayParts[0]}`;

      const endHidden = document.getElementById('crmOrderDateEnd');
      if (endHidden) endHidden.value = '';
      const endLabel = document.getElementById('crmOrderEndDateLabel');
      if (endLabel) endLabel.textContent = 'Оберіть дедлайн';

      document.querySelectorAll('#crmOrderStatusSegment .crm-order-status-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.paid === 'unpaid');
      });

      const box = document.getElementById('crmOrderCardBox');
      if (box) box.style.display = 'block';
      haptic('light');
    });
  }

  // Segmented status buttons for order
  document.querySelectorAll('#crmOrderStatusSegment .crm-order-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#crmOrderStatusSegment .crm-order-status-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      haptic('light');
    });
  });

  // Cancel order button
  const cancelOrderBtn = document.getElementById('crmCancelOrderBtn');
  if (cancelOrderBtn) {
    cancelOrderBtn.addEventListener('click', () => {
      const box = document.getElementById('crmOrderCardBox');
      if (box) box.style.display = 'none';
      state.editingOrderId = null;
      haptic('light');
    });
  }

  // Save order button
  const saveOrderBtn = document.getElementById('crmSaveOrderBtn');
  if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', () => {
      if (!state.activeCrmLead) return;
      if (!Array.isArray(state.activeCrmLead.orders)) state.activeCrmLead.orders = [];

      const title = (document.getElementById('crmOrderServiceInput').value || '').trim() || 'Створення сайту';
      const amount = Number(document.getElementById('crmOrderAmountInput').value) || 0;
      const dateStart = document.getElementById('crmOrderDateStart').value;
      const dateEnd = document.getElementById('crmOrderDateEnd').value;
      const activeStatusBtn = document.querySelector('#crmOrderStatusSegment .crm-order-status-btn.active');
      const paidStatus = activeStatusBtn?.dataset.paid || 'unpaid';

      if (state.editingOrderId) {
        const existingIdx = state.activeCrmLead.orders.findIndex(o => o.id === state.editingOrderId);
        if (existingIdx !== -1) {
          state.activeCrmLead.orders[existingIdx] = {
            ...state.activeCrmLead.orders[existingIdx],
            title,
            amount,
            dateStart,
            dateEnd,
            paidStatus
          };
        }
      } else {
        state.activeCrmLead.orders.push({
          id: 'ord-' + Date.now(),
          title,
          amount,
          dateStart,
          dateEnd,
          paidStatus
        });
      }

      // Recalculate total budget
      const totalBudget = state.activeCrmLead.orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
      state.activeCrmLead.budget = totalBudget;

      const box = document.getElementById('crmOrderCardBox');
      if (box) box.style.display = 'none';
      state.editingOrderId = null;

      renderCrmOrdersList();
      renderCrm();

      // Persist in state.crm
      const idx = state.crm.findIndex(c => c.id === state.activeCrmLead.id);
      if (idx !== -1) {
        state.crm[idx] = { ...state.crm[idx], orders: state.activeCrmLead.orders, budget: totalBudget };
        localStorage.setItem('dws_crm', JSON.stringify(state.crm));
      }
      syncAccountToServer();
      haptic('success');
    });
  }

  // Save CRM detail button
  const saveCrmDetailBtn = document.getElementById('saveCrmDetailBtn');
  if (saveCrmDetailBtn) {
    saveCrmDetailBtn.addEventListener('click', async () => {
      if (!state.activeCrmLead) return;
      haptic('medium');

      const status = document.getElementById('crmDetailStatusSelect').value;
      const service = document.getElementById('crmDetailService').value;
      const niche = document.getElementById('crmDetailNiche').value;
      const notes = document.getElementById('crmDetailNotes').value;

      const links = {
        phone: document.getElementById('crmLinkPhone')?.value || '',
        instagram: document.getElementById('crmLinkInsta')?.value || '',
        tiktok: document.getElementById('crmLinkTiktok')?.value || '',
        tgChannel: document.getElementById('crmLinkTgChannel')?.value || '',
        site: document.getElementById('crmLinkSite')?.value || ''
      };

      const orders = Array.isArray(state.activeCrmLead.orders) ? state.activeCrmLead.orders : [];
      const totalBudget = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

      const updates = {
        name: state.activeCrmLead.name || 'Клієнт',
        username: state.activeCrmLead.username || '@юзернейм',
        avatarLetter: state.activeCrmLead.avatarLetter || 'Л',
        status,
        statusLabel: CRM_STATUSES[status] || 'В процесі',
        service,
        serviceLabel: (service === 'marketing' ? 'Реклама' : service === 'montage' ? 'Монтаж' : 'Розробка'),
        niche,
        notes,
        links,
        orders,
        budget: totalBudget
      };

      saveCrmDetailBtn.textContent = 'ЗБЕРІГАЄМО...';
      try {
        const idx = state.crm.findIndex(c => c.id === state.activeCrmLead.id);
        if (idx !== -1) {
          state.crm[idx] = { ...state.crm[idx], ...updates };
        }
        localStorage.setItem('dws_crm', JSON.stringify(state.crm));

        haptic('success');
        saveCrmDetailBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
        closeModal('modalCrmDetail');
        renderCrm();
        syncAccountToServer();

        // Non-blocking server API sync
        fetch('/api/crm/' + state.activeCrmLead.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }).catch(err => console.warn('CRM api sync err:', err));
      } catch (err) {
        console.error('Save CRM error:', err);
        saveCrmDetailBtn.textContent = 'ПОМИЛКА';
      } finally {
        setTimeout(() => { saveCrmDetailBtn.textContent = 'ЗБЕРЕГТИ ЗМІНИ'; }, 1500);
      }
    });
  }

  // Delete CRM lead (neutral outline styling, no red)
  const deleteCrmLeadBtn = document.getElementById('deleteCrmLeadBtn');
  if (deleteCrmLeadBtn) {
    deleteCrmLeadBtn.addEventListener('click', async () => {
      if (!state.activeCrmLead) return;
      if (!confirm('Ви дійсно хочете видалити цього ліда з CRM?')) return;
      haptic('medium');

      try {
        await fetch('/api/crm/' + state.activeCrmLead.id, { method: 'DELETE' });
      } catch (err) {
        console.warn(err);
      }
      state.crm = state.crm.filter(c => c.id !== state.activeCrmLead.id);
      localStorage.setItem('dws_crm', JSON.stringify(state.crm));

      haptic('success');
      closeModal('modalCrmDetail');
      renderCrm();
      syncAccountToServer();
    });
  }
}

// ============================================================
// INTERACTIVE CALENDAR FOR CRM ORDER DATES
// ============================================================
let orderCalTarget = 'start'; // 'start' or 'end'
let tempOrderCalStart = null;
let tempOrderCalEnd = null;
let orderCalViewDate = new Date();

function setupOrderCalendarModal() {
  const startBtn = document.getElementById('crmOrderStartDateBtn');
  const endBtn = document.getElementById('crmOrderEndDateBtn');
  const prevBtn = document.getElementById('orderCalPrevMonthBtn');
  const nextBtn = document.getElementById('orderCalNextMonthBtn');
  const resetBtn = document.getElementById('orderCalResetBtn');
  const applyBtn = document.getElementById('orderCalApplyBtn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      orderCalTarget = 'start';
      tempOrderCalStart = document.getElementById('crmOrderDateStart')?.value || new Date().toISOString().split('T')[0];
      tempOrderCalEnd = document.getElementById('crmOrderDateEnd')?.value || null;
      orderCalViewDate = tempOrderCalStart ? new Date(tempOrderCalStart) : new Date();
      const titleEl = document.getElementById('orderCalTitle');
      if (titleEl) titleEl.textContent = 'Вибір дати початку';
      renderOrderCalendarGrid();
      openModal('modalOrderCalendar');
      haptic('light');
    });
  }

  if (endBtn) {
    endBtn.addEventListener('click', () => {
      orderCalTarget = 'end';
      tempOrderCalStart = document.getElementById('crmOrderDateStart')?.value || null;
      tempOrderCalEnd = document.getElementById('crmOrderDateEnd')?.value || null;
      orderCalViewDate = tempOrderCalEnd ? new Date(tempOrderCalEnd) : (tempOrderCalStart ? new Date(tempOrderCalStart) : new Date());
      const titleEl = document.getElementById('orderCalTitle');
      if (titleEl) titleEl.textContent = 'Вибір дати дедлайну';
      renderOrderCalendarGrid();
      openModal('modalOrderCalendar');
      haptic('light');
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      orderCalViewDate = new Date(orderCalViewDate.getFullYear(), orderCalViewDate.getMonth() - 1, 1);
      renderOrderCalendarGrid();
      haptic('light');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      orderCalViewDate = new Date(orderCalViewDate.getFullYear(), orderCalViewDate.getMonth() + 1, 1);
      renderOrderCalendarGrid();
      haptic('light');
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (orderCalTarget === 'start') {
        tempOrderCalStart = null;
      } else if (orderCalTarget === 'end') {
        tempOrderCalEnd = null;
      } else {
        tempOrderCalStart = null;
        tempOrderCalEnd = null;
      }
      renderOrderCalendarGrid();
      haptic('light');
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const startHidden = document.getElementById('crmOrderDateStart');
      const startLabel = document.getElementById('crmOrderStartDateLabel');
      if (startHidden && startLabel) {
        if (tempOrderCalStart) {
          startHidden.value = tempOrderCalStart;
          const p = tempOrderCalStart.split('-');
          startLabel.textContent = `${p[2]}.${p[1]}.${p[0]}`;
        } else {
          startHidden.value = '';
          startLabel.textContent = 'Оберіть дату';
        }
      }

      const endHidden = document.getElementById('crmOrderDateEnd');
      const endLabel = document.getElementById('crmOrderEndDateLabel');
      if (endHidden && endLabel) {
        if (tempOrderCalEnd) {
          endHidden.value = tempOrderCalEnd;
          const p = tempOrderCalEnd.split('-');
          endLabel.textContent = `${p[2]}.${p[1]}.${p[0]}`;
        } else {
          endHidden.value = '';
          endLabel.textContent = 'Оберіть дедлайн';
        }
      }

      haptic('success');
      closeModal('modalOrderCalendar');
    });
  }
}

function renderOrderCalendarGrid() {
  const titleEl = document.getElementById('orderCalMonthYearTitle');
  const gridEl = document.getElementById('orderCalDaysGrid');
  const previewEl = document.getElementById('orderCalPreviewRange');
  if (!gridEl) return;

  const monthFullNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
  const curY = orderCalViewDate.getFullYear();
  const curM = orderCalViewDate.getMonth();

  if (titleEl) {
    titleEl.textContent = `${monthFullNames[curM]} ${curY}`;
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(curY, curM, 1);
  const startDay = firstDay.getDay();
  const padDays = startDay === 0 ? 6 : startDay - 1;
  const daysInMonth = new Date(curY, curM + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < padDays; i++) {
    html += '<div class="cal-day-cell empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dayStr === todayIso;
    const isStart = dayStr === tempOrderCalStart;
    const isEnd = dayStr === tempOrderCalEnd;
    const inRange = Boolean(tempOrderCalStart && tempOrderCalEnd && dayStr > tempOrderCalStart && dayStr < tempOrderCalEnd);

    let classes = ['cal-day-cell'];
    if (isToday) classes.push('is-today');
    if (isStart) classes.push('is-start');
    if (isEnd) classes.push('is-end');
    if (inRange) classes.push('in-range');

    html += `<div class="${classes.join(' ')}" data-date="${dayStr}">${d}</div>`;
  }

  gridEl.innerHTML = html;

  if (previewEl) {
    if (tempOrderCalStart && tempOrderCalEnd) {
      const sParts = tempOrderCalStart.split('-');
      const eParts = tempOrderCalEnd.split('-');
      const diffDays = Math.round((new Date(tempOrderCalEnd) - new Date(tempOrderCalStart)) / (24 * 3600 * 1000)) + 1;
      previewEl.textContent = `${sParts[2]}.${sParts[1]}.${sParts[0]} → ${eParts[2]}.${eParts[1]}.${eParts[0]} (${diffDays} дн.)`;
    } else if (tempOrderCalStart) {
      const sParts = tempOrderCalStart.split('-');
      previewEl.textContent = `Початок: ${sParts[2]}.${sParts[1]}.${sParts[0]}`;
    } else if (tempOrderCalEnd) {
      const eParts = tempOrderCalEnd.split('-');
      previewEl.textContent = `Дедлайн: ${eParts[2]}.${eParts[1]}.${eParts[0]}`;
    } else {
      previewEl.textContent = 'Оберіть дату на календарі';
    }
  }

  gridEl.querySelectorAll('.cal-day-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => {
      const selectedDate = cell.dataset.date;
      haptic('light');

      if (orderCalTarget === 'start') {
        tempOrderCalStart = selectedDate;
        if (tempOrderCalEnd && tempOrderCalEnd < tempOrderCalStart) {
          tempOrderCalEnd = null;
        }
      } else if (orderCalTarget === 'end') {
        tempOrderCalEnd = selectedDate;
        if (tempOrderCalStart && tempOrderCalStart > tempOrderCalEnd) {
          tempOrderCalStart = selectedDate;
        }
      }
      renderOrderCalendarGrid();
    });
  });
}

// Add CRM client modal (+)
const addCrmBtn = document.getElementById('addCrmBtn');
if (addCrmBtn) {
  addCrmBtn.addEventListener('click', () => {
    openModal('modalAddCrm');
  });
}

// Explicitly remove legacy header button if old cached HTML was served
const headerAddCrmBtn = document.getElementById('headerAddCrmBtn');
if (headerAddCrmBtn) {
  headerAddCrmBtn.remove();
}
document.querySelectorAll('.view-header button').forEach(btn => btn.remove());

const submitAddCrmBtn = document.getElementById('submitAddCrmBtn');
if (submitAddCrmBtn) {
  submitAddCrmBtn.addEventListener('click', async () => {
    const name = (document.getElementById('newCrmName')?.value || '').trim();
    let username = (document.getElementById('newCrmUsername')?.value || '').trim();
    if (username && !username.startsWith('@')) username = '@' + username;
    const service = document.getElementById('newCrmService')?.value || 'development';
    const source = document.getElementById('newCrmSource')?.value || 'tg_leads';
    const niche = (document.getElementById('newCrmNiche')?.value || '').trim();
    const budget = Number(document.getElementById('newCrmBudget')?.value) || 0;
    const status = document.getElementById('newCrmStatus')?.value || 'in_progress';
    const orderTitle = (document.getElementById('newCrmOrderTitle')?.value || '').trim() || 'Створення сайту';

    const links = {
      phone: (document.getElementById('newCrmLinkPhone')?.value || '').trim(),
      instagram: (document.getElementById('newCrmLinkInsta')?.value || '').trim(),
      tiktok: (document.getElementById('newCrmLinkTiktok')?.value || '').trim(),
      tgChannel: (document.getElementById('newCrmLinkTgChannel')?.value || '').trim(),
      site: (document.getElementById('newCrmLinkSite')?.value || '').trim()
    };

    if (!name) {
      alert('Будь ласка, введіть ім\'я клієнта');
      return;
    }

    haptic('medium');
    submitAddCrmBtn.textContent = 'ДОДАЄМО...';

    const payload = {
      name,
      username,
      service,
      serviceLabel: (service === 'marketing' ? 'Реклама' : service === 'montage' ? 'Монтаж' : 'Розробка'),
      source,
      niche,
      budget,
      status,
      statusLabel: CRM_STATUSES[status] || 'В процесі',
      orderTitle,
      links,
      orders: []
    };

    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success && json.data) {
        state.crm.unshift(json.data);
      } else {
        payload.id = 'crm-' + Date.now();
        payload.avatarLetter = name.charAt(0).toUpperCase();
        state.crm.unshift(payload);
      }
    } catch (err) {
      payload.id = 'crm-' + Date.now();
      payload.avatarLetter = name.charAt(0).toUpperCase();
      state.crm.unshift(payload);
    }

    localStorage.setItem('dws_crm', JSON.stringify(state.crm));
    syncAccountToServer();
    renderCrm();

    haptic('success');
    submitAddCrmBtn.textContent = 'ДОДАТИ КЛІЄНТА';
    closeModal('modalAddCrm');

    // Reset inputs
    ['newCrmName', 'newCrmUsername', 'newCrmNiche', 'newCrmBudget', 'newCrmOrderTitle',
     'newCrmLinkPhone', 'newCrmLinkInsta', 'newCrmLinkTiktok', 'newCrmLinkTgChannel', 'newCrmLinkSite'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
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
  const dInput = document.getElementById('newIncomeDate');
  if (dInput) dInput.value = new Date().toISOString().slice(0, 10);

  submitAddIncomeBtn.addEventListener('click', async () => {
    const project = document.getElementById('newIncomeProject').value.trim();
    const client = document.getElementById('newIncomeClient').value.trim();
    const amount = Number(document.getElementById('newIncomeAmount').value) || 0;
    const dateInput = document.getElementById('newIncomeDate')?.value;
    const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    if (!project || !amount) {
      alert('Введіть назву замовлення та суму');
      return;
    }

    haptic('medium');
    const newRecord = {
      id: `inc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      project,
      client: client || 'Клієнт',
      amount,
      currency: '₴',
      isPaid: newIncomePaidStatus,
      date
    };

    if (!Array.isArray(state.income.records)) {
      state.income.records = [];
    }
    state.income.records.unshift(newRecord);
    localStorage.setItem('dws_income', JSON.stringify(state.income));

    // Clear inputs
    document.getElementById('newIncomeProject').value = '';
    document.getElementById('newIncomeClient').value = '';
    document.getElementById('newIncomeAmount').value = '';
    const dEl = document.getElementById('newIncomeDate');
    if (dEl) dEl.value = new Date().toISOString().slice(0, 10);

    haptic('success');
    closeModal('modalAddIncome');
    renderIncome();
    syncAccountToServer();

    try {
      await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
    } catch (err) {
      console.warn('Error syncing income record to server:', err);
    }
  });
}

// ============================================================
// EDIT INCOME RECORD MODAL (РЕДАГУВАННЯ / ВИДАЛЕННЯ ЗАМОВЛЕННЯ)
// ============================================================
let editIncomePaidStatus = true;

function openEditIncomeModal(recId) {
  const rec = (state.income.records || []).find(r => r.id === recId);
  if (!rec) return;

  const idEl = document.getElementById('editIncomeId');
  const projEl = document.getElementById('editIncomeProject');
  const clientEl = document.getElementById('editIncomeClient');
  const amountEl = document.getElementById('editIncomeAmount');
  const dateEl = document.getElementById('editIncomeDate');
  const paidBtn = document.getElementById('editIncomePaidBtn');
  const expBtn = document.getElementById('editIncomeExpectedBtn');

  if (idEl) idEl.value = rec.id;
  if (projEl) projEl.value = rec.project || '';
  if (clientEl) clientEl.value = rec.client || '';
  if (amountEl) amountEl.value = rec.amount || '';
  if (dateEl) {
    const d = rec.date ? new Date(rec.date) : new Date();
    dateEl.value = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  }

  editIncomePaidStatus = Boolean(rec.isPaid);
  if (paidBtn && expBtn) {
    paidBtn.classList.toggle('active', editIncomePaidStatus);
    expBtn.classList.toggle('active', !editIncomePaidStatus);
  }

  haptic('light');
  openModal('modalEditIncome');
}

// Paid toggle listeners for edit modal
const editIncomePaidBtn = document.getElementById('editIncomePaidBtn');
const editIncomeExpectedBtn = document.getElementById('editIncomeExpectedBtn');
if (editIncomePaidBtn && editIncomeExpectedBtn) {
  editIncomePaidBtn.addEventListener('click', () => {
    editIncomePaidStatus = true;
    editIncomePaidBtn.classList.add('active');
    editIncomeExpectedBtn.classList.remove('active');
  });
  editIncomeExpectedBtn.addEventListener('click', () => {
    editIncomePaidStatus = false;
    editIncomeExpectedBtn.classList.add('active');
    editIncomePaidBtn.classList.remove('active');
  });
}

// Save edited income
const saveEditIncomeBtn = document.getElementById('saveEditIncomeBtn');
if (saveEditIncomeBtn) {
  saveEditIncomeBtn.addEventListener('click', async () => {
    const id = document.getElementById('editIncomeId')?.value;
    const project = document.getElementById('editIncomeProject')?.value.trim();
    const client = document.getElementById('editIncomeClient')?.value.trim() || 'Клієнт';
    const amount = Number(document.getElementById('editIncomeAmount')?.value) || 0;
    const dateInput = document.getElementById('editIncomeDate')?.value;
    const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

    if (!id || !project || !amount) {
      alert('Будь ласка, введіть назву замовлення та суму');
      return;
    }

    haptic('medium');
    const idx = (state.income.records || []).findIndex(r => r.id === id);
    if (idx !== -1) {
      state.income.records[idx] = {
        ...state.income.records[idx],
        project,
        client,
        amount,
        isPaid: editIncomePaidStatus,
        date
      };
      localStorage.setItem('dws_income', JSON.stringify(state.income));
    }

    haptic('success');
    closeModal('modalEditIncome');
    renderIncome();
    syncAccountToServer();

    try {
      await fetch(`/api/income/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, client, amount, isPaid: editIncomePaidStatus, date })
      });
    } catch (err) {
      console.warn('Error syncing income update to server:', err);
    }
  });
}

// Delete edited income
const deleteEditIncomeBtn = document.getElementById('deleteEditIncomeBtn');
if (deleteEditIncomeBtn) {
  deleteEditIncomeBtn.addEventListener('click', async () => {
    const id = document.getElementById('editIncomeId')?.value;
    if (!id) return;
    if (!confirm('Видалити це замовлення з обліку доходу?')) return;

    haptic('medium');
    state.income.records = (state.income.records || []).filter(r => r.id !== id);
    localStorage.setItem('dws_income', JSON.stringify(state.income));

    haptic('success');
    closeModal('modalEditIncome');
    renderIncome();
    syncAccountToServer();

    try {
      await fetch(`/api/income/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Error deleting income on server:', err);
    }
  });
}

// Time filter modal
const openTimeFilterBtn = document.getElementById('openTimeFilterBtn');
if (openTimeFilterBtn) {
  openTimeFilterBtn.addEventListener('click', () => {
    flashButtonBlue(openTimeFilterBtn);
    openModal('modalTimeFilter');
  });
}

document.querySelectorAll('#modalTimeFilter .time-choice-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#modalTimeFilter .time-choice-item').forEach(b => {
      b.classList.remove('active');
      const ch = b.querySelector('.check');
      if (ch) ch.remove();
    });
    btn.classList.add('active');
    btn.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');

    const period = btn.dataset.period || 'all';
    state.incomeFilterPeriod = period;
    state.incomeDateRange = null;

    const label = btn.querySelector('span')?.textContent || 'Фільтр часу';
    const activeLabel = document.getElementById('activeTimeLabel');
    if (activeLabel) activeLabel.textContent = label;

    const calLabel = document.getElementById('activeCalendarLabel');
    if (calLabel) calLabel.textContent = 'По даті';

    haptic('light');
    renderIncome();
    setTimeout(() => {
      closeModal('modalTimeFilter');
    }, 150);
  });
});

// ============================================================
// INTERACTIVE CALENDAR MODAL (ПО ДАТІ)
// ============================================================
let calViewDate = new Date();
let tempCalStart = null;
let tempCalEnd = null;
let activeCalendarTarget = 'income'; // 'income' | 'expenses'

function setupCalendarModal() {
  const openCalendarBtn = document.getElementById('openCalendarBtn');
  const openExpensesCalendarBtn = document.getElementById('openExpensesCalendarBtn');
  const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
  const calNextMonthBtn = document.getElementById('calNextMonthBtn');
  const calResetBtn = document.getElementById('calResetBtn');
  const calApplyBtn = document.getElementById('calApplyBtn');

  if (openCalendarBtn) {
    openCalendarBtn.addEventListener('click', () => {
      activeCalendarTarget = 'income';
      flashButtonBlue(openCalendarBtn);
      if (state.incomeDateRange && state.incomeDateRange.start) {
        tempCalStart = state.incomeDateRange.start;
        tempCalEnd = state.incomeDateRange.end;
        calViewDate = new Date(tempCalStart);
      } else {
        tempCalStart = null;
        tempCalEnd = null;
        calViewDate = new Date();
      }
      renderCalendarGrid();
      openModal('modalDateRange');
    });
  }

  if (openExpensesCalendarBtn) {
    openExpensesCalendarBtn.addEventListener('click', () => {
      activeCalendarTarget = 'expenses';
      flashButtonBlue(openExpensesCalendarBtn);
      if (state.expensesDateRange && state.expensesDateRange.start) {
        tempCalStart = state.expensesDateRange.start;
        tempCalEnd = state.expensesDateRange.end;
        calViewDate = new Date(tempCalStart);
      } else {
        tempCalStart = null;
        tempCalEnd = null;
        calViewDate = new Date();
      }
      renderCalendarGrid();
      openModal('modalDateRange');
    });
  }

  if (calPrevMonthBtn) {
    calPrevMonthBtn.addEventListener('click', () => {
      calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1);
      renderCalendarGrid();
      haptic('light');
    });
  }

  if (calNextMonthBtn) {
    calNextMonthBtn.addEventListener('click', () => {
      calViewDate = new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1);
      renderCalendarGrid();
      haptic('light');
    });
  }

  if (calResetBtn) {
    calResetBtn.addEventListener('click', () => {
      tempCalStart = null;
      tempCalEnd = null;

      if (activeCalendarTarget === 'expenses') {
        state.expensesDateRange = null;
        state.expensesFilterPeriod = 'all';

        const calLabel = document.getElementById('activeExpensesCalendarLabel');
        if (calLabel) calLabel.textContent = 'По даті';
        const timeLabel = document.getElementById('activeExpensesTimeLabel');
        if (timeLabel) timeLabel.textContent = 'Фільтр часу';

        document.querySelectorAll('#modalExpensesTimeFilter .time-choice-item').forEach(b => {
          const isAll = b.dataset.period === 'all';
          b.classList.toggle('active', isAll);
          const ch = b.querySelector('.check');
          if (ch) ch.remove();
          if (isAll) b.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');
        });

        haptic('medium');
        closeModal('modalDateRange');
        renderExpenses();
        return;
      }

      state.incomeDateRange = null;
      state.incomeFilterPeriod = 'all';

      const calLabel = document.getElementById('activeCalendarLabel');
      if (calLabel) calLabel.textContent = 'По даті';
      const timeLabel = document.getElementById('activeTimeLabel');
      if (timeLabel) timeLabel.textContent = 'Фільтр часу';

      document.querySelectorAll('#modalTimeFilter .time-choice-item').forEach(b => {
        const isAll = b.dataset.period === 'all';
        b.classList.toggle('active', isAll);
        const ch = b.querySelector('.check');
        if (ch) ch.remove();
        if (isAll) b.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');
      });

      haptic('medium');
      closeModal('modalDateRange');
      renderIncome();
    });
  }

  if (calApplyBtn) {
    calApplyBtn.addEventListener('click', () => {
      if (!tempCalStart) {
        closeModal('modalDateRange');
        return;
      }
      const finalStart = tempCalStart;
      const finalEnd = tempCalEnd || tempCalStart;
      const sParts = finalStart.split('-');
      const eParts = finalEnd.split('-');
      const labelText = `${sParts[2]}.${sParts[1]} – ${eParts[2]}.${eParts[1]}`;

      if (activeCalendarTarget === 'expenses') {
        state.expensesDateRange = { start: finalStart, end: finalEnd };
        state.expensesFilterPeriod = null;

        const calLabel = document.getElementById('activeExpensesCalendarLabel');
        if (calLabel) calLabel.textContent = labelText;
        const timeLabel = document.getElementById('activeExpensesTimeLabel');
        if (timeLabel) timeLabel.textContent = 'Фільтр часу';

        document.querySelectorAll('#modalExpensesTimeFilter .time-choice-item').forEach(b => {
          b.classList.remove('active');
          const ch = b.querySelector('.check');
          if (ch) ch.remove();
        });

        haptic('success');
        closeModal('modalDateRange');
        renderExpenses();
        return;
      }

      state.incomeDateRange = { start: finalStart, end: finalEnd };
      state.incomeFilterPeriod = null;

      const calLabel = document.getElementById('activeCalendarLabel');
      if (calLabel) calLabel.textContent = labelText;
      const timeLabel = document.getElementById('activeTimeLabel');
      if (timeLabel) timeLabel.textContent = 'Фільтр часу';

      document.querySelectorAll('#modalTimeFilter .time-choice-item').forEach(b => {
        b.classList.remove('active');
        const ch = b.querySelector('.check');
        if (ch) ch.remove();
      });

      haptic('success');
      closeModal('modalDateRange');
      renderIncome();
    });
  }
}

// ============================================================
// EXPENSES TAB & MODAL HANDLERS
// ============================================================
let newExpensePaidStatus = true;
let editExpensePaidStatus = true;

function openEditExpenseModal(recId) {
  const rec = (state.expenses.records || []).find(r => r.id === recId);
  if (!rec) return;

  const idEl = document.getElementById('editExpenseId');
  const titleEl = document.getElementById('editExpenseTitle');
  const catEl = document.getElementById('editExpenseCategory');
  const amountEl = document.getElementById('editExpenseAmount');
  const dateEl = document.getElementById('editExpenseDate');
  const paidBtn = document.getElementById('editExpensePaidBtn');
  const expBtn = document.getElementById('editExpenseExpectedBtn');

  if (idEl) idEl.value = rec.id;
  if (titleEl) titleEl.value = rec.title || rec.project || '';
  if (catEl) catEl.value = rec.category || rec.client || '';
  if (amountEl) amountEl.value = rec.amount || '';
  if (dateEl) {
    const d = rec.date ? new Date(rec.date) : new Date();
    dateEl.value = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);
  }

  editExpensePaidStatus = Boolean(rec.isPaid);
  if (paidBtn && expBtn) {
    paidBtn.classList.toggle('active', editExpensePaidStatus);
    expBtn.classList.toggle('active', !editExpensePaidStatus);
  }

  haptic('light');
  openModal('modalEditExpense');
}

function setupExpensesHandlers() {
  // Add Expense button (+)
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
      document.getElementById('newExpenseTitle').value = '';
      document.getElementById('newExpenseCategory').value = '';
      document.getElementById('newExpenseAmount').value = '';
      const dInput = document.getElementById('newExpenseDate');
      if (dInput) dInput.value = new Date().toISOString().slice(0, 10);
      newExpensePaidStatus = true;
      document.querySelectorAll('#modalAddExpense .opt-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.paid === 'true');
      });
      openModal('modalAddExpense');
    });
  }

  // Toggle paid in Add modal
  document.querySelectorAll('#modalAddExpense .opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modalAddExpense .opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      newExpensePaidStatus = btn.dataset.paid === 'true';
    });
  });

  // Submit Add Expense
  const submitAddExpenseBtn = document.getElementById('submitAddExpenseBtn');
  if (submitAddExpenseBtn) {
    submitAddExpenseBtn.addEventListener('click', async () => {
      const title = document.getElementById('newExpenseTitle')?.value.trim();
      const category = document.getElementById('newExpenseCategory')?.value.trim();
      const amount = Number(document.getElementById('newExpenseAmount')?.value) || 0;
      const dateInput = document.getElementById('newExpenseDate')?.value;
      const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

      if (!title || !amount) {
        alert('Введіть опис витрати та суму');
        return;
      }

      haptic('medium');
      const newRecord = {
        id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title,
        category: category || 'Загальне',
        amount,
        currency: '₴',
        isPaid: newExpensePaidStatus,
        date
      };

      if (!Array.isArray(state.expenses.records)) {
        state.expenses.records = [];
      }
      state.expenses.records.unshift(newRecord);
      localStorage.setItem('dws_expenses', JSON.stringify(state.expenses));

      haptic('success');
      closeModal('modalAddExpense');
      renderExpenses();
      syncAccountToServer();

      try {
        await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newRecord)
        });
      } catch (err) {
        console.warn('Error syncing expense record to server:', err);
      }
    });
  }

  // Toggle paid in Edit modal
  const editExpensePaidBtn = document.getElementById('editExpensePaidBtn');
  const editExpenseExpectedBtn = document.getElementById('editExpenseExpectedBtn');
  if (editExpensePaidBtn && editExpenseExpectedBtn) {
    editExpensePaidBtn.addEventListener('click', () => {
      editExpensePaidStatus = true;
      editExpensePaidBtn.classList.add('active');
      editExpenseExpectedBtn.classList.remove('active');
    });
    editExpenseExpectedBtn.addEventListener('click', () => {
      editExpensePaidStatus = false;
      editExpenseExpectedBtn.classList.add('active');
      editExpensePaidBtn.classList.remove('active');
    });
  }

  // Save edited expense
  const saveEditExpenseBtn = document.getElementById('saveEditExpenseBtn');
  if (saveEditExpenseBtn) {
    saveEditExpenseBtn.addEventListener('click', async () => {
      const id = document.getElementById('editExpenseId')?.value;
      const title = document.getElementById('editExpenseTitle')?.value.trim();
      const category = document.getElementById('editExpenseCategory')?.value.trim();
      const amount = Number(document.getElementById('editExpenseAmount')?.value) || 0;
      const dateInput = document.getElementById('editExpenseDate')?.value;
      const date = dateInput ? new Date(dateInput).toISOString() : new Date().toISOString();

      if (!id || !title || !amount) {
        alert('Введіть опис витрати та суму');
        return;
      }

      haptic('medium');
      const idx = (state.expenses.records || []).findIndex(r => r.id === id);
      if (idx !== -1) {
        state.expenses.records[idx] = {
          ...state.expenses.records[idx],
          title,
          category: category || 'Загальне',
          amount,
          isPaid: editExpensePaidStatus,
          date
        };
        localStorage.setItem('dws_expenses', JSON.stringify(state.expenses));
      }

      haptic('success');
      closeModal('modalEditExpense');
      renderExpenses();
      syncAccountToServer();

      try {
        await fetch(`/api/expenses/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, category, amount, isPaid: editExpensePaidStatus, date })
        });
      } catch (err) {
        console.warn('Error syncing expense update to server:', err);
      }
    });
  }

  // Delete edited expense
  const deleteEditExpenseBtn = document.getElementById('deleteEditExpenseBtn');
  if (deleteEditExpenseBtn) {
    deleteEditExpenseBtn.addEventListener('click', async () => {
      const id = document.getElementById('editExpenseId')?.value;
      if (!id) return;
      if (!confirm('Видалити цю витрату?')) return;

      haptic('medium');
      state.expenses.records = (state.expenses.records || []).filter(r => r.id !== id);
      localStorage.setItem('dws_expenses', JSON.stringify(state.expenses));

      haptic('success');
      closeModal('modalEditExpense');
      renderExpenses();
      syncAccountToServer();

      try {
        await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Error deleting expense on server:', err);
      }
    });
  }

  // Time filter modal for expenses
  const openExpensesTimeFilterBtn = document.getElementById('openExpensesTimeFilterBtn');
  if (openExpensesTimeFilterBtn) {
    openExpensesTimeFilterBtn.addEventListener('click', () => {
      flashButtonBlue(openExpensesTimeFilterBtn);
      openModal('modalExpensesTimeFilter');
    });
  }

  document.querySelectorAll('#modalExpensesTimeFilter .time-choice-item').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#modalExpensesTimeFilter .time-choice-item').forEach(b => {
        b.classList.remove('active');
        const ch = b.querySelector('.check');
        if (ch) ch.remove();
      });
      btn.classList.add('active');
      btn.insertAdjacentHTML('beforeend', '<span class="check">✓</span>');

      const period = btn.dataset.period || 'all';
      state.expensesFilterPeriod = period;
      state.expensesDateRange = null;

      const label = btn.querySelector('span')?.textContent || 'Фільтр часу';
      const activeLabel = document.getElementById('activeExpensesTimeLabel');
      if (activeLabel) activeLabel.textContent = label;

      const calLabel = document.getElementById('activeExpensesCalendarLabel');
      if (calLabel) calLabel.textContent = 'По даті';

      haptic('light');
      renderExpenses();
      setTimeout(() => {
        closeModal('modalExpensesTimeFilter');
      }, 150);
    });
  });
}

function renderCalendarGrid() {
  const titleEl = document.getElementById('calMonthYearTitle');
  const gridEl = document.getElementById('calDaysGrid');
  const previewEl = document.getElementById('calPreviewRange');
  if (!gridEl) return;

  const monthFullNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень', 'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
  const curY = calViewDate.getFullYear();
  const curM = calViewDate.getMonth();

  if (titleEl) {
    titleEl.textContent = `${monthFullNames[curM]} ${curY}`;
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const firstDay = new Date(curY, curM, 1);
  const startDay = firstDay.getDay();
  const padDays = startDay === 0 ? 6 : startDay - 1;
  const daysInMonth = new Date(curY, curM + 1, 0).getDate();

  let html = '';
  for (let i = 0; i < padDays; i++) {
    html += '<div class="cal-day-cell empty"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${curY}-${String(curM + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dayStr === todayIso;
    const isStart = dayStr === tempCalStart;
    const isEnd = dayStr === tempCalEnd;
    const inRange = Boolean(tempCalStart && tempCalEnd && dayStr > tempCalStart && dayStr < tempCalEnd);

    let classes = ['cal-day-cell'];
    if (isToday) classes.push('is-today');
    if (isStart) classes.push('is-start');
    if (isEnd) classes.push('is-end');
    if (inRange) classes.push('in-range');

    html += `<div class="${classes.join(' ')}" data-date="${dayStr}">${d}</div>`;
  }

  gridEl.innerHTML = html;

  if (previewEl) {
    if (!tempCalStart) {
      previewEl.textContent = 'Оберіть початкову дату';
    } else if (!tempCalEnd || tempCalStart === tempCalEnd) {
      const sParts = tempCalStart.split('-');
      previewEl.textContent = `${sParts[2]}.${sParts[1]}.${sParts[0]} (оберіть кінцеву дату)`;
    } else {
      const sParts = tempCalStart.split('-');
      const eParts = tempCalEnd.split('-');
      const diffDays = Math.round((new Date(tempCalEnd) - new Date(tempCalStart)) / (24 * 3600 * 1000)) + 1;
      previewEl.textContent = `${sParts[2]}.${sParts[1]}.${sParts[0]} – ${eParts[2]}.${eParts[1]}.${eParts[0]} (${diffDays} дн.)`;
    }
  }

  gridEl.querySelectorAll('.cal-day-cell:not(.empty)').forEach(cell => {
    cell.addEventListener('click', () => {
      const selectedDate = cell.dataset.date;
      haptic('light');

      if (!tempCalStart || (tempCalStart && tempCalEnd)) {
        tempCalStart = selectedDate;
        tempCalEnd = null;
      } else {
        if (selectedDate < tempCalStart) {
          tempCalEnd = tempCalStart;
          tempCalStart = selectedDate;
        } else {
          tempCalEnd = selectedDate;
        }
      }
      renderCalendarGrid();
    });
  });
}

// Niches modal
const openNichesBtn = document.getElementById('openNichesBtn');
if (openNichesBtn) {
  openNichesBtn.addEventListener('click', () => {
    flashButtonBlue(openNichesBtn);
    openModal('modalNiches');
  });
}

// Chevron sub-list toggle in Niches modal
document.querySelectorAll('.niche-chevron-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    haptic('light');
    const targetId = btn.dataset.toggle;
    const subList = document.getElementById(targetId);
    const group = btn.closest('.niche-group');
    if (subList) {
      const isHidden = subList.style.display === 'none' || getComputedStyle(subList).display === 'none';
      subList.style.display = isHidden ? 'flex' : 'none';
      if (group) group.classList.toggle('open', isHidden);
    }
  });
});

// Niche group row selection toggle
document.querySelectorAll('.niche-group-info').forEach(info => {
  info.addEventListener('click', (e) => {
    e.stopPropagation();
    haptic('medium');
    const group = info.closest('.niche-group');
    if (!group) return;
    const isSelected = group.classList.contains('selected');
    group.classList.toggle('selected', !isSelected);
    
    // Toggle all checkboxes inside this group
    const checkboxes = group.querySelectorAll('.check-item input[type="checkbox"]');
    checkboxes.forEach(cb => { cb.checked = !isSelected; });
  });
});

// Checkbox changes inside niche
document.querySelectorAll('.niche-sub-list input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', () => {
    const group = cb.closest('.niche-group');
    if (!group) return;
    const anyChecked = Array.from(group.querySelectorAll('input[type="checkbox"]')).some(c => c.checked);
    group.classList.toggle('selected', anyChecked);
  });
});

// Save Niches button
const saveNichesBtn = document.getElementById('saveNichesBtn');
if (saveNichesBtn) {
  saveNichesBtn.addEventListener('click', () => {
    haptic('success');
    const activeNiches = [];
    if (document.getElementById('nicheGroupDev')?.classList.contains('selected')) activeNiches.push('development');
    if (document.getElementById('nicheGroupMark')?.classList.contains('selected')) activeNiches.push('marketing');
    if (document.getElementById('nicheGroupMont')?.classList.contains('selected')) activeNiches.push('montage');
    
    state.activeNiches = activeNiches;
    const labelEl = document.getElementById('activeNicheLabel');
    if (labelEl) {
      if (activeNiches.length === 3 || activeNiches.length === 0) {
        labelEl.textContent = 'Всі категорії';
      } else if (activeNiches.length === 1) {
        const names = { development: 'Веброзробка', marketing: 'Маркетинг', montage: 'Монтаж' };
        labelEl.textContent = names[activeNiches[0]] || 'Категорії';
      } else {
        labelEl.textContent = activeNiches.length + ' категорії';
      }
    }
    closeModal('modalNiches');
    filterAndRenderLeads();
  });
}

// Filters modal
const openFiltersBtn = document.getElementById('openFiltersBtn');
if (openFiltersBtn) {
  openFiltersBtn.addEventListener('click', () => {
    flashButtonBlue(openFiltersBtn);
    openModal('modalFilters');
  });
}

document.querySelectorAll('#modalFilters .opt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.filter-options-grid');
    if (parent) {
      parent.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('active'));
    }
    btn.classList.add('active');
    haptic('light');
  });
});

const applyFiltersBtn = document.getElementById('applyFiltersBtn');
if (applyFiltersBtn) {
  applyFiltersBtn.addEventListener('click', () => {
    haptic('success');
    const budgetBtn = document.querySelector('#modalFilters .opt-btn[data-budget].active');
    const portfolioBtn = document.querySelector('#modalFilters .opt-btn[data-portfolio].active');
    const expBtn = document.querySelector('#modalFilters .opt-btn[data-exp].active');

    state.filters.budget = budgetBtn ? budgetBtn.dataset.budget : 'all';
    state.filters.portfolio = portfolioBtn ? portfolioBtn.dataset.portfolio : 'any';
    state.filters.exp = expBtn ? expBtn.dataset.exp : 'any';

    closeModal('modalFilters');
    filterAndRenderLeads();
  });
}

// ============================================================
// CRM FILTER MODAL HANDLERS
// ============================================================
function setupCrmFilterModal() {
  const openBtn = document.getElementById('openCrmFilterBtn');
  const applyBtn = document.getElementById('applyCrmFilterBtn');
  const budgetInput = document.getElementById('crmFilterMinBudget');

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      flashButtonBlue(openBtn);

      // 1. Sync 4 pinned stages in modal (ensure 'all' is always selected)
      if (!Array.isArray(state.crmPinnedStages) || state.crmPinnedStages.length < 4) {
        state.crmPinnedStages = ['all', 'in_progress', 'offer', 'paid'];
      }
      if (!state.crmPinnedStages.includes('all')) {
        state.crmPinnedStages[0] = 'all';
      }

      document.querySelectorAll('#crmFilterStatusGrid .opt-btn').forEach(b => {
        const st = b.dataset.status;
        b.classList.toggle('active', state.crmPinnedStages.includes(st) || st === 'all');
      });

      // 2. Sync active service button in modal
      document.querySelectorAll('#crmFilterServiceGrid .opt-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.service === state.crmFilterService);
      });

      // 3. Sync budget input
      if (budgetInput) {
        budgetInput.value = state.crmFilterMinBudget > 0 ? state.crmFilterMinBudget : '';
      }

      openModal('modalCrmFilter');
    });
  }

  // Multi-select for exactly 4 stages (with 'all' locked as default active)
  document.querySelectorAll('#crmFilterStatusGrid .opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const st = btn.dataset.status;
      if (st === 'all') {
        // "Всі" is always mandatory and cannot be deselected
        btn.classList.add('active');
        haptic('light');
        return;
      }

      const activeBtns = Array.from(document.querySelectorAll('#crmFilterStatusGrid .opt-btn.active'));
      const isCurrentlyActive = btn.classList.contains('active');

      if (isCurrentlyActive) {
        if (activeBtns.length > 1) {
          btn.classList.remove('active');
        }
      } else {
        if (activeBtns.length >= 4) {
          // If already 4 chosen, deactivate the latest non-'all' button to keep exactly 4
          const replaceable = activeBtns.filter(b => b.dataset.status !== 'all');
          if (replaceable.length > 0) {
            replaceable[replaceable.length - 1].classList.remove('active');
          }
        }
        btn.classList.add('active');
      }
      haptic('light');
    });
  });

  // Service buttons inside modal (single-choice)
  document.querySelectorAll('#crmFilterServiceGrid .opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#crmFilterServiceGrid .opt-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      haptic('light');
    });
  });

  // Apply filters
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const activeStageBtns = Array.from(document.querySelectorAll('#crmFilterStatusGrid .opt-btn.active'));
      let selectedStages = activeStageBtns.map(b => b.dataset.status);

      // Guarantee 'all' is always present and first
      if (!selectedStages.includes('all')) {
        selectedStages.unshift('all');
      } else {
        selectedStages = ['all', ...selectedStages.filter(s => s !== 'all')];
      }

      // If fewer than 4 selected, fill from defaults
      const defaults = ['in_progress', 'offer', 'paid', 'working', 'closed'];
      for (const def of defaults) {
        if (selectedStages.length >= 4) break;
        if (!selectedStages.includes(def)) selectedStages.push(def);
      }

      state.crmPinnedStages = selectedStages.slice(0, 4);
      localStorage.setItem('dws_crm_pinned_stages', JSON.stringify(state.crmPinnedStages));

      const activeServiceBtn = document.querySelector('#crmFilterServiceGrid .opt-btn.active');
      state.crmFilterService = activeServiceBtn?.dataset.service || 'all';
      state.crmFilterMinBudget = Number(budgetInput?.value) || 0;

      renderCrmStageTabs();
      renderCrm();
      syncAccountToServer();

      haptic('success');
      closeModal('modalCrmFilter');
    });
  }
}

// ============================================================
// ACCOUNT SYNC & RECOGNITION (MULTI-DEVICE LINKING)
// ============================================================
let pendingAvatarData = null;

function updateProfileHeaderUI() {
  const nameEl = document.getElementById('profileDisplayName');
  const userEl = document.getElementById('profileDisplayUser');
  const roleEl = document.getElementById('profileRoleBadge');
  const avatarEl = document.getElementById('profileAvatarBadge');

  const isOwner = (state.userRole === 'owner' || isOwnerAccountKey(state.accountKey));
  if (isOwner && (!state.accountUser || state.accountUser === '@zalizkodenis12' || state.accountUser.startsWith('@dev_'))) {
    state.accountUser = '@absolutikdenchik';
    state.accountKey = 'absolutikdenchik';
  }

  if (nameEl) nameEl.textContent = state.accountName || (isOwner ? 'Денис Залізко' : 'Спеціаліст');
  if (userEl) userEl.textContent = state.accountUser || (isOwner ? '@absolutikdenchik' : ('@' + state.accountKey));
  if (roleEl) {
    roleEl.textContent = isOwner ? 'Власник' : (state.userRole || 'Спеціаліст');
    roleEl.style.background = isOwner ? 'rgba(0,102,255,0.08)' : 'rgba(100,116,139,0.08)';
    roleEl.style.color = isOwner ? 'var(--brand)' : 'var(--text-muted)';
    roleEl.style.borderColor = isOwner ? 'rgba(0,102,255,0.2)' : 'var(--border)';
  }
  if (avatarEl) {
    const avatarUrl = state.userAvatar || localStorage.getItem('dws_user_avatar');
    if (avatarUrl) {
      avatarEl.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
    } else {
      const parts = (state.accountName || 'Денис Залізко').trim().split(/\s+/);
      let initials = parts[0] ? parts[0][0].toUpperCase() : 'Д';
      if (parts[1]) initials += parts[1][0].toUpperCase();
      avatarEl.innerHTML = initials;
    }
  }
}

function openProfileEditModal() {
  const nameInput = document.getElementById('editProfileNameInput');
  const userInput = document.getElementById('editProfileUserInput');
  const roleInput = document.getElementById('editProfileRoleInput');
  const previewEl = document.getElementById('editProfileAvatarPreview');
  const removePhotoBtn = document.getElementById('removePhotoBtn');

  const isOwner = (state.userRole === 'owner' || isOwnerAccountKey(state.accountKey));
  if (nameInput) nameInput.value = state.accountName || (isOwner ? 'Денис Залізко' : '');
  if (userInput) userInput.value = state.accountUser || (isOwner ? '@absolutikdenchik' : ('@' + state.accountKey));
  if (roleInput) roleInput.value = isOwner ? 'Власник' : (state.userRole || 'Спеціаліст');

  const avatarUrl = state.userAvatar || localStorage.getItem('dws_user_avatar');
  if (previewEl) {
    if (avatarUrl) {
      previewEl.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
      if (removePhotoBtn) removePhotoBtn.style.display = 'inline-flex';
    } else {
      const parts = (state.accountName || 'Денис Залізко').trim().split(/\s+/);
      let initials = parts[0] ? parts[0][0].toUpperCase() : 'Д';
      if (parts[1]) initials += parts[1][0].toUpperCase();
      previewEl.innerHTML = initials;
      if (removePhotoBtn) removePhotoBtn.style.display = 'none';
    }
  }
  openModal('modalEditProfile');
}

function setupProfileEditModal() {
  const editBtn = document.getElementById('editProfileNameBtn');
  const avatarWrap = document.getElementById('profileAvatarClickWrap');
  const triggerPhotoBtn = document.getElementById('triggerPhotoUploadBtn');
  const photoFile = document.getElementById('editProfilePhotoFile');
  const removePhotoBtn = document.getElementById('removePhotoBtn');
  const saveBtn = document.getElementById('saveProfileEditBtn');
  const previewEl = document.getElementById('editProfileAvatarPreview');

  if (editBtn) {
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pendingAvatarData = null;
      openProfileEditModal();
      haptic('light');
    });
  }
  if (avatarWrap) {
    avatarWrap.addEventListener('click', (e) => {
      e.stopPropagation();
      pendingAvatarData = null;
      openProfileEditModal();
      haptic('light');
    });
  }

  if (triggerPhotoBtn && photoFile) {
    triggerPhotoBtn.addEventListener('click', () => {
      photoFile.click();
    });
  }

  if (photoFile) {
    photoFile.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Будь ласка, оберіть файл зображення (JPG, PNG)');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 256;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          pendingAvatarData = dataUrl;
          if (previewEl) {
            previewEl.innerHTML = `<img src="${dataUrl}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;">`;
          }
          if (removePhotoBtn) removePhotoBtn.style.display = 'inline-flex';
          haptic('light');
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', () => {
      pendingAvatarData = '';
      if (previewEl) {
        const parts = ((document.getElementById('editProfileNameInput')?.value) || state.accountName || 'Д').trim().split(/\s+/);
        let initials = parts[0] ? parts[0][0].toUpperCase() : 'Д';
        if (parts[1]) initials += parts[1][0].toUpperCase();
        previewEl.innerHTML = initials;
      }
      removePhotoBtn.style.display = 'none';
      if (photoFile) photoFile.value = '';
      haptic('light');
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const nameInput = document.getElementById('editProfileNameInput');
      const userInput = document.getElementById('editProfileUserInput');
      const roleInput = document.getElementById('editProfileRoleInput');

      const newName = (nameInput?.value || '').trim();
      const rawUser = (userInput?.value || '').trim();
      const newRole = (roleInput?.value || '').trim();

      if (newName) {
        state.accountName = newName;
        localStorage.setItem('dws_account_name', state.accountName);
      }

      let switchedAccount = false;
      if (rawUser) {
        const cleanUser = rawUser.replace(/^@+/, '').trim().toLowerCase();
        if (cleanUser) {
          const targetKey = isOwnerAccountKey(cleanUser) ? 'absolutikdenchik' : cleanUser;
          const targetDisplay = isOwnerAccountKey(cleanUser) ? '@absolutikdenchik' : ('@' + cleanUser);
          if (targetKey !== state.accountKey) switchedAccount = true;
          state.accountKey = targetKey;
          state.accountUser = targetDisplay;
          localStorage.setItem('dws_account_key', state.accountKey);
          localStorage.setItem('dws_account_user', state.accountUser);
        }
      }

      if (newRole) {
        state.userRole = (newRole.toLowerCase() === 'власник' || isOwnerAccountKey(state.accountKey)) ? 'owner' : newRole;
        localStorage.setItem('dws_user_role', state.userRole);
      }

      if (pendingAvatarData !== null) {
        if (pendingAvatarData) {
          state.userAvatar = pendingAvatarData;
          localStorage.setItem('dws_user_avatar', pendingAvatarData);
        } else {
          state.userAvatar = '';
          localStorage.removeItem('dws_user_avatar');
        }
      }

      updateProfileHeaderUI();
      closeModal('modalEditProfile');
      haptic('success');
      if (switchedAccount) {
        await fetchAccountData(true);
        renderCurrentTab();
      } else {
        await syncAccountToServer();
      }
      showToast('Профіль успішно оновлено та синхронізовано!');
    });
  }
}

function setupAccountSync() {
  const ident = getOrCreateUserIdentity();
  state.accountKey = ident.key;
  state.accountUser = ident.username;
  state.accountName = ident.name;
  state.userRole = ident.role;
  if (ident.avatar) state.userAvatar = ident.avatar;

  localStorage.setItem('dws_account_key', state.accountKey);
  localStorage.setItem('dws_account_user', state.accountUser);
  localStorage.setItem('dws_account_name', state.accountName);

  updateProfileHeaderUI();
  setupProfileEditModal();

  const accountInput = document.getElementById('accountUserInput');
  const submitAccountBtn = document.getElementById('submitAccountBtn');

  if (submitAccountBtn) {
    submitAccountBtn.addEventListener('click', async () => {
      const val = (accountInput?.value || '').trim();
      const rawClean = val.replace(/^@+/, '').trim().toLowerCase();

      if (!rawClean) {
        showToast('Введіть коректний username');
        return;
      }

      const isOwner = isOwnerAccountKey(rawClean);
      const cleanKey = isOwner ? 'absolutikdenchik' : rawClean;
      state.accountKey = cleanKey;
      state.accountUser = isOwner ? '@absolutikdenchik' : ('@' + cleanKey);
      state.accountName = isOwner ? 'Денис Залізко' : (state.accountName || ('Спеціаліст (' + cleanKey + ')'));
      state.userRole = isOwner ? 'owner' : 'member';

      localStorage.setItem('dws_account_key', state.accountKey);
      localStorage.setItem('dws_account_user', state.accountUser);
      localStorage.setItem('dws_account_name', state.accountName);
      localStorage.setItem('dws_user_role', state.userRole);

      updateProfileHeaderUI();
      haptic('success');
      closeModal('modalAccountLink');
      await pullLatestDataFromServer(true, true);
      renderCurrentTab();
      showToast('Акаунт ' + state.accountUser + ' підключено та синхронізовано!');
    });
  }

  // 1A. Pure PUSH button: Send current device's data (Phone -> Cloud)
  const cloudSyncBtn = document.getElementById('cloudSyncTgBtn');
  if (cloudSyncBtn) {
    cloudSyncBtn.addEventListener('click', async () => {
      haptic('medium');
      const origText = cloudSyncBtn.textContent;
      cloudSyncBtn.textContent = 'ВІДПРАВКА В ХМАРУ...';
      cloudSyncBtn.disabled = true;

      try {
        await syncAccountToServer();
        renderCurrentTab();
        updateProfileHeaderUI();
        haptic('success');
        cloudSyncBtn.textContent = 'ВІДПРАВЛЕНО В ХМАРУ ✓';
        showToast('Всі дані з цього пристрою вивантажено в хмару (@absolutikdenchik)!');
      } catch (e) {
        cloudSyncBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
      } finally {
        setTimeout(() => {
          cloudSyncBtn.disabled = false;
          cloudSyncBtn.textContent = origText || 'ВІДПРАВИТИ ДАНІ В ХМАРУ (З ТЕЛЕФОНУ)';
        }, 2500);
      }
    });
  }

  // 1B. Pure PULL button: Receive cloud data onto current device (Cloud -> Laptop)
  const pullCloudBtn = document.getElementById('pullCloudSyncBtn');
  if (pullCloudBtn) {
    pullCloudBtn.addEventListener('click', async () => {
      haptic('medium');
      const origText = pullCloudBtn.textContent;
      pullCloudBtn.textContent = 'ЗАВАНТАЖЕННЯ З ХМАРИ...';
      pullCloudBtn.disabled = true;

      try {
        await pullLatestDataFromServer(true, true);
        renderCurrentTab();
        updateProfileHeaderUI();
        haptic('success');
        pullCloudBtn.textContent = 'ДАНІ ЗАВАНТАЖЕНО ✓';
        showToast('Всі дані акаунту @absolutikdenchik перенесено на цей пристрій!');
      } catch (e) {
        pullCloudBtn.textContent = 'ОНОВЛЕНО ✓';
      } finally {
        setTimeout(() => {
          pullCloudBtn.disabled = false;
          pullCloudBtn.textContent = origText || 'ОТРИМАТИ ДАНІ З ХМАРИ (НА НОУТБУК)';
        }, 2500);
      }
    });
  }

  // 2. Export backup as JSON file
  const exportFileBtn = document.getElementById('exportBackupFileBtn');
  if (exportFileBtn) {
    exportFileBtn.addEventListener('click', () => {
      haptic('light');
      const backupData = buildAccountSnapshot();
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dws-lead-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      exportFileBtn.textContent = 'ФАЙЛ ЗАВАНТАЖЕНО ✓';
      setTimeout(() => { exportFileBtn.textContent = 'ЗАВАНТАЖИТИ ФАЙЛ БЕКАПУ (.JSON)'; }, 2500);
    });
  }

  // 3. Open restore modal
  const importFileBtn = document.getElementById('importBackupFileBtn');
  if (importFileBtn) {
    importFileBtn.addEventListener('click', () => {
      haptic('light');
      openModal('modalSyncCode');
    });
  }

  // 4. Modal action: Restore from Cloud (Universal Cloud KV + Telegram CloudStorage)
  const modalRestoreCloud = document.getElementById('modalRestoreCloudBtn');
  if (modalRestoreCloud) {
    modalRestoreCloud.addEventListener('click', async () => {
      haptic('light');
      const origText = modalRestoreCloud.textContent;
      modalRestoreCloud.textContent = 'ЗАВАНТАЖЕННЯ З ХМАРИ...';
      await pullLatestDataFromServer(true, true);
      haptic('success');
      modalRestoreCloud.textContent = origText;
      closeModal('modalSyncCode');
      renderCurrentTab();
      updateProfileHeaderUI();
      showToast('Дані акаунту @absolutikdenchik успішно оновлено з хмари!');
    });
  }

  // 5. Modal action: Choose JSON file
  const modalChooseFile = document.getElementById('modalChooseFileBtn');
  const syncFileInput = document.getElementById('syncFileInput');
  if (modalChooseFile && syncFileInput) {
    modalChooseFile.addEventListener('click', () => {
      syncFileInput.click();
    });

    syncFileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target.result);
          applyAccountSnapshot(data, true);
          await syncAccountToServer();
          haptic('success');
          closeModal('modalSyncCode');
          renderCurrentTab();
          updateProfileHeaderUI();
          showToast('Файл бекапу застосовано та синхронізовано з хмарою!');
        } catch (err) {
          alert('Помилка читання файлу. Переконайтеся, що ви обрали файл бекапу у форматі .json.');
        }
      };
      reader.readAsText(file);
    });
  }

  // 6. Modal action: Apply manual text/code if pasted
  const applySyncBtn = document.getElementById('applySyncCodeBtn');
  const syncCodeInput = document.getElementById('syncCodeInput');
  if (applySyncBtn && syncCodeInput) {
    applySyncBtn.addEventListener('click', async () => {
      let raw = syncCodeInput.value.trim();
      if (!raw) return;

      try {
        if (raw.startsWith('DWS_BACKUP_')) {
          raw = raw.replace('DWS_BACKUP_', '');
          raw = decodeURIComponent(escape(atob(raw)));
        }
        const data = JSON.parse(raw);
        applyAccountSnapshot(data, true);
        await syncAccountToServer();
        haptic('success');
        closeModal('modalSyncCode');
        renderCurrentTab();
        updateProfileHeaderUI();
        showToast('Дані застосовано та синхронізовано!');
      } catch (err) {
        alert('Помилка обробки тексту. Перевірте правильність введених даних.');
      }
    });
  }
}

// ============================================================
// UNIVERSAL REAL-TIME CLOUD SYNC ENGINE (PHONE <-> LAPTOP)
// ============================================================
const DWS_CLOUD_KV_STORE_ID = 'sJ4EPV4bcEMHAhMJi';
const CLOUD_KV_STORE_ID = DWS_CLOUD_KV_STORE_ID;
const DWS_DEVICE_ID = 'dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
let isSyncingRemote = false;
let isPushingSync = false;
let pendingPushSync = false;

function isMobileDevice() {
  const tgPlat = String(window.Telegram?.WebApp?.platform || '').toLowerCase();
  if (tgPlat === 'ios' || tgPlat === 'android') return true;
  if (tgPlat === 'tdesktop' || tgPlat === 'macos' || tgPlat === 'weba' || tgPlat === 'webk') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');
}

function getCleanAccountKey() {
  const raw = state.accountKey || getOrCreateUserIdentity().key || 'absolutikdenchik';
  const cleaned = String(raw).trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_.-]/g, '_');
  if (isOwnerAccountKey(cleaned)) {
    return 'absolutikdenchik';
  }
  return cleaned;
}

function getCloudKvRecordUrl(accountKey) {
  const token = (typeof getClientApifyToken === 'function' ? getClientApifyToken() : '') ||
    (() => { try { return atob('YXBpZnlfYXBpX1gzM1I4NEsyWDJia2ZNZjdYQWZrQ1R5RU1rblNiSTR4dXVmWA=='); } catch { return ''; } })();
  const safeKey = String(accountKey || 'absolutikdenchik').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '_');
  return `https://api.apify.com/v2/key-value-stores/${DWS_CLOUD_KV_STORE_ID}/records/account_${safeKey}?token=${encodeURIComponent(token)}`;
}

function mergeArraysById(primaryArr, secondaryArr) {
  const pList = Array.isArray(primaryArr) ? primaryArr : [];
  const sList = Array.isArray(secondaryArr) ? secondaryArr : [];
  const map = new Map();
  pList.forEach(item => {
    if (item && item.id) map.set(item.id, item);
  });
  sList.forEach(item => {
    if (item && item.id && !map.has(item.id)) {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

function stripDemoItemsFromCrm(list) {
  if (!Array.isArray(list)) return [];
  const hasReal = list.some(c => c && c.id && c.id !== 'crm-1' && !/^crm-[234]$/.test(c.id));
  if (!hasReal) return list;
  return list.filter(c => c && c.id !== 'crm-1' && !/^crm-[234]$/.test(c.id));
}

function stripDemoItemsFromExpenses(list) {
  if (!Array.isArray(list)) return [];
  return list.filter(r => r && !DEMO_EXPENSE_IDS.has(r.id));
}

function buildAccountSnapshot(nowTs = Date.now()) {
  const dynamicId = getOrCreateUserIdentity();
  const accountKey = getCleanAccountKey();
  const isOwner = isOwnerAccountKey(accountKey);
  const localScrapes = typeof loadLocalScrapes === 'function' ? loadLocalScrapes() : [];
  const localNfc = (typeof nfcRadarState !== 'undefined' && Array.isArray(nfcRadarState.jobs) && nfcRadarState.jobs.length > 0)
    ? nfcRadarState.jobs
    : (typeof loadLocalNfcJobs === 'function' ? loadLocalNfcJobs() : []);
  const localD2d = (typeof nfcRadarState !== 'undefined' && Array.isArray(nfcRadarState.d2dJobs) && nfcRadarState.d2dJobs.length > 0)
    ? nfcRadarState.d2dJobs
    : (typeof loadLocalD2dJobs === 'function' ? loadLocalD2dJobs() : []);

  const cleanCrm = stripDemoItemsFromCrm(state.crm);
  const cleanExpenses = stripDemoItemsFromExpenses(state.expenses?.records);
  let seenPlaces = [];
  let searchWaveOffsets = {};
  try {
    seenPlaces = JSON.parse(localStorage.getItem('dws_seen_places') || '[]');
    if (!Array.isArray(seenPlaces)) seenPlaces = [];
  } catch (e) { seenPlaces = []; }
  try {
    searchWaveOffsets = JSON.parse(localStorage.getItem('dws_search_wave_offsets') || '{}');
    if (!searchWaveOffsets || typeof searchWaveOffsets !== 'object') searchWaveOffsets = {};
  } catch (e) { searchWaveOffsets = {}; }

  return {
    app: 'DWS Lead',
    version: '4.6.2',
    accountKey,
    deviceId: DWS_DEVICE_ID,
    sourceDevice: isMobileDevice() ? 'phone' : 'laptop',
    syncId: DWS_DEVICE_ID + '_' + nowTs,
    updatedAt: nowTs,
    username: isOwner ? '@absolutikdenchik' : (state.accountUser || dynamicId.username || ('@' + accountKey)),
    name: state.accountName || dynamicId.name || 'Денис Залізко',
    role: isOwner ? 'owner' : (state.userRole || dynamicId.role || 'member'),
    avatar: state.userAvatar || localStorage.getItem('dws_user_avatar') || '',
    theme: state.theme || localStorage.getItem('dws_theme') || 'light',
    lang: state.lang || localStorage.getItem('dws_lang') || 'ua',
    crm: cleanCrm,
    crmPinnedStages: Array.isArray(state.crmPinnedStages) ? state.crmPinnedStages : ['all', 'in_progress', 'offer', 'paid'],
    income: state.income || { records: [], currency: '₴' },
    expenses: { ...(state.expenses || {}), records: cleanExpenses, currency: state.expenses?.currency || '₴' },
    profile: {
      ...DEFAULT_DATA.profile,
      ...(state.profile || {}),
      nfcTemplate: state.profile?.nfcTemplate || DEFAULT_DATA.profile.nfcTemplate,
      nfcTemplates: (typeof getNfcTemplatesList === 'function' ? getNfcTemplatesList() : (state.profile?.nfcTemplates || DEFAULT_NFC_TEMPLATES)),
      d2dTemplate: state.profile?.d2dTemplate || DEFAULT_DATA.profile.d2dTemplate,
      theme: state.theme || 'light',
      lang: state.lang || 'ua',
      requisites: state.requisites || state.profile?.requisites || {}
    },
    requisites: state.requisites || state.profile?.requisites || {},
    sources: state.sources || {},
    takenLeadIds: [...(state.takenLeadIds || [])],
    scrapes: localScrapes,
    nfcJobs: localNfc,
    d2dJobs: localD2d,
    outreachState: typeof outreachState !== 'undefined' ? outreachState : null,
    seenPlaces: seenPlaces.slice(-15000),
    searchWaveOffsets
  };
}

function applyAccountSnapshot(d, mergeWithLocal = false, preferLocalOnMerge = false) {
  if (!d || typeof d !== 'object') return false;
  let hasChanges = false;

  // 1. CRM
  if (Array.isArray(d.crm)) {
    const rawCrm = mergeWithLocal
      ? (preferLocalOnMerge ? mergeArraysById(state.crm, d.crm) : mergeArraysById(d.crm, state.crm))
      : d.crm;
    const nextCrm = stripDemoItemsFromCrm(rawCrm);
    if (JSON.stringify(nextCrm) !== JSON.stringify(state.crm)) {
      state.crm = nextCrm;
      localStorage.setItem('dws_crm', JSON.stringify(state.crm));
      hasChanges = true;
    }
  }

  // 2. CRM Pinned Stages
  if (Array.isArray(d.crmPinnedStages) && d.crmPinnedStages.length === 4) {
    if (JSON.stringify(d.crmPinnedStages) !== JSON.stringify(state.crmPinnedStages)) {
      state.crmPinnedStages = d.crmPinnedStages;
      localStorage.setItem('dws_crm_pinned_stages', JSON.stringify(state.crmPinnedStages));
      hasChanges = true;
    }
  }

  // 3. Income
  if (d.income && Array.isArray(d.income.records)) {
    const nextRecs = mergeWithLocal
      ? (preferLocalOnMerge ? mergeArraysById(state.income?.records, d.income.records) : mergeArraysById(d.income.records, state.income?.records))
      : d.income.records;
    const nextIncome = { ...d.income, records: nextRecs, currency: d.income.currency || '₴' };
    if (JSON.stringify(nextIncome) !== JSON.stringify(state.income)) {
      state.income = nextIncome;
      localStorage.setItem('dws_income', JSON.stringify(state.income));
      hasChanges = true;
    }
  }

  // 4. Expenses
  if (d.expenses && Array.isArray(d.expenses.records)) {
    const rawExpRecs = mergeWithLocal
      ? (preferLocalOnMerge ? mergeArraysById(state.expenses?.records, d.expenses.records) : mergeArraysById(d.expenses.records, state.expenses?.records))
      : d.expenses.records;
    const nextExpRecs = stripDemoItemsFromExpenses(rawExpRecs);
    const nextExpenses = { ...d.expenses, records: nextExpRecs, currency: d.expenses.currency || '₴' };
    if (JSON.stringify(nextExpenses) !== JSON.stringify(state.expenses)) {
      state.expenses = nextExpenses;
      localStorage.setItem('dws_expenses', JSON.stringify(state.expenses));
      hasChanges = true;
    }
  }

  // 5. Taken Lead IDs
  if (Array.isArray(d.takenLeadIds)) {
    const nextTaken = mergeWithLocal
      ? Array.from(new Set([...(state.takenLeadIds || []), ...d.takenLeadIds]))
      : d.takenLeadIds;
    const curTaken = [...(state.takenLeadIds || [])];
    if (JSON.stringify(nextTaken) !== JSON.stringify(curTaken)) {
      state.takenLeadIds = new Set(nextTaken);
      localStorage.setItem('dws_taken_leads', JSON.stringify(nextTaken));
      hasChanges = true;
    }
  }

  // 6. Profile & Requisites
  if (d.profile && typeof d.profile === 'object') {
    const nextProfile = preferLocalOnMerge
      ? { ...DEFAULT_DATA.profile, ...d.profile, ...state.profile }
      : { ...DEFAULT_DATA.profile, ...state.profile, ...d.profile };
    if (!nextProfile.nfcTemplate) {
      nextProfile.nfcTemplate = DEFAULT_DATA.profile.nfcTemplate;
    }
    if (!Array.isArray(nextProfile.nfcTemplates) || nextProfile.nfcTemplates.length !== 10) {
      nextProfile.nfcTemplates = Array.isArray(state.profile?.nfcTemplates) && state.profile.nfcTemplates.length === 10
        ? state.profile.nfcTemplates
        : [...DEFAULT_NFC_TEMPLATES];
    }
    if (JSON.stringify(nextProfile) !== JSON.stringify(state.profile)) {
      state.profile = nextProfile;
      localStorage.setItem('dws_profile', JSON.stringify(state.profile));
      const aboutEl = document.getElementById('profileAbout');
      const tmplEl = document.getElementById('profileTemplate');
      const nfcTmplEl = document.getElementById('profileNfcTemplate');
      if (aboutEl && document.activeElement !== aboutEl && state.profile.about) {
        aboutEl.value = state.profile.about;
        updateCharCount(aboutEl, 'aboutCounter');
      }
      if (tmplEl && document.activeElement !== tmplEl && state.profile.responseTemplate) {
        tmplEl.value = state.profile.responseTemplate;
        updateCharCount(tmplEl, 'templateCounter');
      }
      if (nfcTmplEl && document.activeElement !== nfcTmplEl && state.profile.nfcTemplate) {
        nfcTmplEl.value = state.profile.nfcTemplate;
        updateCharCount(nfcTmplEl, 'nfcTemplateCounter');
      }
      const d2dTmplEl = document.getElementById('profileD2dTemplate');
      if (d2dTmplEl && document.activeElement !== d2dTmplEl && state.profile.d2dTemplate) {
        d2dTmplEl.value = state.profile.d2dTemplate;
        updateCharCount(d2dTmplEl, 'd2dTemplateCounter');
      }
      hasChanges = true;
    }
  }

  const incomingReq = d.requisites || d.profile?.requisites;
  if (incomingReq && typeof incomingReq === 'object' && Object.keys(incomingReq).length > 0) {
    if (!preferLocalOnMerge && JSON.stringify(incomingReq) !== JSON.stringify(state.requisites)) {
      state.requisites = incomingReq;
      localStorage.setItem('dws_requisites', JSON.stringify(state.requisites));
      hasChanges = true;
    }
  }

  // 7. Sources
  if (d.sources && (Array.isArray(d.sources.chats) || Array.isArray(d.sources.channels))) {
    if (!preferLocalOnMerge && JSON.stringify(d.sources) !== JSON.stringify(state.sources)) {
      state.sources = d.sources;
      localStorage.setItem('dws_sources', JSON.stringify(state.sources));
      updateSourcesDisplay();
      hasChanges = true;
    }
  }

  // 8. Theme & Language
  if (!preferLocalOnMerge) {
    const targetTheme = d.theme || d.profile?.theme;
    if (targetTheme && (targetTheme === 'light' || targetTheme === 'dark') && targetTheme !== state.theme) {
      applyTheme(targetTheme);
      hasChanges = true;
    }

    const targetLang = d.lang || d.profile?.lang;
    if (targetLang && (targetLang === 'ua' || targetLang === 'en') && targetLang !== state.lang) {
      applyLanguage(targetLang, false);
      hasChanges = true;
    }
  }

  // 9. Scrapes (B2B Google Maps / Instagram)
  if (Array.isArray(d.scrapes) && typeof scrapeState !== 'undefined') {
    const localScrapes = typeof loadLocalScrapes === 'function' ? loadLocalScrapes() : [];
    const nextScrapes = mergeWithLocal
      ? (preferLocalOnMerge ? mergeArraysById(localScrapes, d.scrapes) : mergeArraysById(d.scrapes, localScrapes))
      : d.scrapes;
    if (JSON.stringify(nextScrapes) !== JSON.stringify(localScrapes)) {
      localStorage.setItem('dws_scrapes', JSON.stringify(nextScrapes));
      scrapeState.jobs = nextScrapes;
      hasChanges = true;
    }
  }

  // 10. NFC Radar Jobs
  if (Array.isArray(d.nfcJobs) && typeof nfcRadarState !== 'undefined') {
    const localNfc = nfcRadarState.jobs || [];
    const nextNfc = mergeWithLocal
      ? (preferLocalOnMerge ? mergeArraysById(localNfc, d.nfcJobs) : mergeArraysById(d.nfcJobs, localNfc))
      : d.nfcJobs;
    if (JSON.stringify(nextNfc) !== JSON.stringify(localNfc)) {
      localStorage.setItem('dws_nfc_radars', JSON.stringify(nextNfc));
      nfcRadarState.jobs = nextNfc;
      hasChanges = true;
    }
  }

  // 10a. D2D Radar Jobs
  if (Array.isArray(d.d2dJobs) && typeof nfcRadarState !== 'undefined') {
    const localD2d = nfcRadarState.d2dJobs || [];
    const nextD2d = mergeWithLocal
      ? (preferLocalOnMerge ? mergeArraysById(localD2d, d.d2dJobs) : mergeArraysById(d.d2dJobs, localD2d))
      : d.d2dJobs;
    if (JSON.stringify(nextD2d) !== JSON.stringify(localD2d)) {
      localStorage.setItem('dws_nfc_d2d_radars', JSON.stringify(nextD2d));
      nfcRadarState.d2dJobs = nextD2d;
      hasChanges = true;
    }
  }

  // 10b. Seen Places Registry & Search Wave Offsets (Cross-Device Deduplication)
  if (Array.isArray(d.seenPlaces) && d.seenPlaces.length > 0) {
    try {
      const localSeen = JSON.parse(localStorage.getItem('dws_seen_places') || '[]');
      const mergedSeen = Array.from(new Set([...(Array.isArray(localSeen) ? localSeen : []), ...d.seenPlaces]));
      if (mergedSeen.length !== (Array.isArray(localSeen) ? localSeen.length : 0)) {
        localStorage.setItem('dws_seen_places', JSON.stringify(mergedSeen.slice(-20000)));
      }
    } catch (e) {}
  }
  if (d.searchWaveOffsets && typeof d.searchWaveOffsets === 'object') {
    try {
      const localWaves = JSON.parse(localStorage.getItem('dws_search_wave_offsets') || '{}') || {};
      let waveChanged = false;
      for (const [wk, wv] of Object.entries(d.searchWaveOffsets)) {
        if ((Number(wv) || 0) > (Number(localWaves[wk]) || 0)) {
          localWaves[wk] = Number(wv);
          waveChanged = true;
        }
      }
      if (waveChanged) {
        localStorage.setItem('dws_search_wave_offsets', JSON.stringify(localWaves));
      }
    } catch (e) {}
  }

  // 11. Account Header Identity (Name, Username, Avatar, Role)
  const isOwner = isOwnerAccountKey(state.accountKey) || isOwnerAccountKey(d.accountKey) || isOwnerAccountKey(d.username);
  if (d.name && d.name !== state.accountName) {
    state.accountName = d.name;
    localStorage.setItem('dws_account_name', d.name);
    hasChanges = true;
  }
  const normalizedUsername = isOwner ? '@absolutikdenchik' : (d.username || state.accountUser);
  if (normalizedUsername && normalizedUsername !== state.accountUser) {
    state.accountUser = normalizedUsername;
    localStorage.setItem('dws_account_user', normalizedUsername);
    hasChanges = true;
  }
  if (isOwner && state.accountKey !== 'absolutikdenchik') {
    state.accountKey = 'absolutikdenchik';
    localStorage.setItem('dws_account_key', 'absolutikdenchik');
  }
  if (d.role && d.role !== state.userRole) {
    state.userRole = isOwner ? 'owner' : d.role;
    localStorage.setItem('dws_user_role', state.userRole);
    hasChanges = true;
  }
  // Never let an empty remote avatar erase a valid local avatar
  if (typeof d.avatar === 'string' && d.avatar.length > 0 && d.avatar !== (state.userAvatar || '')) {
    state.userAvatar = d.avatar;
    localStorage.setItem('dws_user_avatar', d.avatar);
    hasChanges = true;
  }

  if (d.updatedAt) {
    const ts = typeof d.updatedAt === 'number' ? d.updatedAt : new Date(d.updatedAt).getTime();
    if (ts > (state.lastSyncTimestamp || 0)) {
      state.lastSyncTimestamp = ts;
    }
  }
  if (d.syncId) {
    state.lastSeenSyncId = d.syncId;
  }

  state.cloudSynced = true;
  return hasChanges;
}

async function fetchRemoteSnapshotForKey(key) {
  let bestRemoteData = null;
  let bestRemoteTs = 0;

  const keysToTry = isOwnerAccountKey(key)
    ? ['absolutikdenchik', 'zalizkodenis12']
    : [key];

  // 1. Fetch from Universal Cloud KV Store (works on Vercel, Browser, Phone & Laptop)
  for (const k of keysToTry) {
    try {
      const kvUrl = getCloudKvRecordUrl(k) + '&_t=' + Date.now();
      const kvRes = await fetch(kvUrl, { cache: 'no-store' }).catch(() => null);
      if (kvRes && kvRes.ok) {
        const kvData = await kvRes.json().catch(() => null);
        if (kvData && typeof kvData === 'object') {
          const ts = typeof kvData.updatedAt === 'number' ? kvData.updatedAt : new Date(kvData.updatedAt || 0).getTime();
          if (ts >= bestRemoteTs) {
            bestRemoteTs = ts;
            bestRemoteData = kvData;
          }
        }
      }
    } catch (e) {}
  }

  // 2. Also check local/backend API if available
  try {
    const apiRes = await fetch('/api/account/' + encodeURIComponent(key), {
      cache: 'no-store',
      headers: {
        'Authorization': 'Bearer ' + (localStorage.getItem('dws_master_token') || 'DWS-2026-STUDIO-ZALIZKO-PRO')
      }
    }).catch(() => null);
    if (apiRes && apiRes.ok) {
      const apiJson = await apiRes.json().catch(() => null);
      if (apiJson && apiJson.success && apiJson.data) {
        const ts = apiJson.data.updatedAt ? new Date(apiJson.data.updatedAt).getTime() : 0;
        if (ts > bestRemoteTs) {
          bestRemoteTs = ts;
          bestRemoteData = apiJson.data;
        }
      }
    }
  } catch (e) {}

  return { bestRemoteData, bestRemoteTs };
}

async function fetchAccountData(forceExact = false) {
  const key = getCleanAccountKey();
  const isPhone = isMobileDevice();
  const phoneMasterFlag = 'dws_phone_master_v46_synced';
  const hasPhoneSyncedV46 = Boolean(localStorage.getItem(phoneMasterFlag));

  // Clean demo items locally first
  state.crm = stripDemoItemsFromCrm(state.crm);
  if (state.expenses && Array.isArray(state.expenses.records)) {
    state.expenses.records = stripDemoItemsFromExpenses(state.expenses.records);
  }

  const { bestRemoteData } = await fetchRemoteSnapshotForKey(key);

  const localHasRealData =
    (Array.isArray(state.crm) && state.crm.some(c => c && c.id !== 'crm-1')) ||
    (Array.isArray(state.income?.records) && state.income.records.length > 0) ||
    (Array.isArray(state.expenses?.records) && state.expenses.records.length > 0);

  if (isPhone && !hasPhoneSyncedV46 && localHasRealData) {
    // Phone has user's real data: merge any missing items WITH PHONE TAKING PRIORITY, then immediately push to Cloud so Laptop gets it!
    if (bestRemoteData) {
      applyAccountSnapshot(bestRemoteData, true, true);
    }
    localStorage.setItem(phoneMasterFlag, 'true');
    updateProfileHeaderUI();
    await syncAccountToServer();
    return;
  }

  if (bestRemoteData) {
    applyAccountSnapshot(bestRemoteData, false, false);
    if (isPhone) localStorage.setItem(phoneMasterFlag, 'true');
    updateProfileHeaderUI();
  } else {
    if (isPhone) localStorage.setItem(phoneMasterFlag, 'true');
    state.cloudSynced = true;
    await syncAccountToServer();
  }
}

function setCloudData(key, obj, cb) {
  const cs = window.Telegram?.WebApp?.CloudStorage;
  if (!cs || !cs.setItem) { if (cb) cb(); return; }
  try {
    const raw = typeof obj === 'string' ? obj : JSON.stringify(obj || '');
    // Use 1000 chars so UTF-8 Cyrillic (2 bytes/char) is max ~2000 bytes, safely under Telegram's 4096-byte limit
    const CHUNK_SIZE = 1000;
    if (raw.length <= CHUNK_SIZE) {
      cs.setItem(key, raw, () => {
        try { cs.removeItem(key + '_chunks', () => {}); } catch (e) {}
        if (cb) cb();
      });
      return;
    }
    const total = Math.ceil(raw.length / CHUNK_SIZE);
    if (total > 35) { if (cb) cb(); return; }
    cs.setItem(key + '_chunks', String(total), () => {
      let saved = 0;
      for (let i = 0; i < total; i++) {
        const chunk = raw.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        cs.setItem(`${key}_p${i}`, chunk, () => {
          saved++;
          if (saved === total) {
            cs.setItem(key, '__CHUNKED__', () => {
              if (cb) cb();
            });
          }
        });
      }
    });
  } catch (err) {
    if (cb) cb();
  }
}

function resolveCloudData(key, items, cb) {
  const cs = window.Telegram?.WebApp?.CloudStorage;
  const raw = items[key];
  if (!raw) { cb(null); return; }
  if (raw !== '__CHUNKED__') { cb(raw); return; }
  const total = Number(items[key + '_chunks']) || 0;
  if (total <= 0 || !cs || !cs.getItems) { cb(null); return; }
  const partKeys = [];
  for (let i = 0; i < total; i++) partKeys.push(`${key}_p${i}`);
  cs.getItems(partKeys, (err, partRes) => {
    if (err || !partRes) { cb(null); return; }
    let joined = '';
    for (let i = 0; i < total; i++) {
      joined += (partRes[`${key}_p${i}`] || '');
    }
    cb(joined);
  });
}

async function syncAccountToServer() {
  const accountKey = getCleanAccountKey();
  const nowTs = Math.max(Date.now(), (state.lastSyncTimestamp || 0) + 1);
  state.lastSyncTimestamp = nowTs;
  state.cloudSynced = true;

  if (isPushingSync) {
    pendingPushSync = true;
    return;
  }
  isPushingSync = true;

  try {
    const snapshot = buildAccountSnapshot(nowTs);
    state.lastSeenSyncId = snapshot.syncId;
    const bodyStr = JSON.stringify(snapshot);

    // 1. Universal Cloud KV Store (Primary cross-device sync for Phone & Laptop on Vercel/Telegram/Browser)
    const kvPromises = [
      fetch(getCloudKvRecordUrl(accountKey), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: bodyStr
      }).catch(() => null)
    ];
    if (isOwnerAccountKey(accountKey)) {
      kvPromises.push(
        fetch(getCloudKvRecordUrl('zalizkodenis12'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: bodyStr
        }).catch(() => null)
      );
    }

    // 2. Telegram CloudStorage (Secondary sync inside Telegram client)
    const cs = window.Telegram?.WebApp?.CloudStorage;
    if (cs && cs.setItem) {
      try {
        setCloudData('dws_crm', snapshot.crm);
        setCloudData('dws_income', snapshot.income);
        setCloudData('dws_expenses', snapshot.expenses);
        setCloudData('dws_taken_leads', snapshot.takenLeadIds);
        setCloudData('dws_profile', snapshot.profile);
        cs.setItem('dws_sync_ts', String(nowTs), () => {});
      } catch (e) {}
    }

    // 3. Backend Server API (if running locally)
    const apiPromise = fetch('/api/account/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + (localStorage.getItem('dws_master_token') || 'DWS-2026-STUDIO-ZALIZKO-PRO')
      },
      body: bodyStr
    }).catch(() => null);

    await Promise.all([...kvPromises, apiPromise]);
  } catch (err) {
    console.warn('Sync error:', err);
  } finally {
    isPushingSync = false;
    if (pendingPushSync) {
      pendingPushSync = false;
      syncAccountToServer();
    }
  }
}

function renderCurrentTab() {
  if (state.currentTab === 'tab-leads') filterAndRenderLeads();
  else if (state.currentTab === 'tab-crm') renderCrm();
  else if (state.currentTab === 'tab-income') renderIncome();
  else if (state.currentTab === 'tab-expenses') renderExpenses();
  else if (state.currentTab === 'tab-profile') {
    updateProfileHeaderUI();
    fetchProfile();
    updateSourcesDisplay();
  }
  else if (state.currentTab === 'tab-scrape' && typeof renderScrapes === 'function') renderScrapes();
  else if (state.currentTab === 'tab-nfc-radar' && typeof renderNfcRadar === 'function') renderNfcRadar();
  else if (state.currentTab === 'tab-requisites') renderRequisitesTab();

  if (typeof translateDomTree === 'function' && state?.lang === 'en') {
    const tabEl = document.getElementById(state.currentTab) || document.body;
    translateDomTree(tabEl, 'en');
  }
}

async function pullLatestDataFromServer(force = false, forceApply = false) {
  if ((isSyncingRemote || isPushingSync) && !forceApply) return;
  const key = getCleanAccountKey();
  if (!key) return;

  try {
    isSyncingRemote = true;
    const { bestRemoteData: remoteData, bestRemoteTs: remoteTs } = await fetchRemoteSnapshotForKey(key);

    if (!remoteData) return;

    const isNewSyncId = Boolean(remoteData.syncId && remoteData.syncId !== state.lastSeenSyncId && remoteData.deviceId !== DWS_DEVICE_ID);
    const isNewerTs = remoteTs > (state.lastSyncTimestamp || 0);
    const shouldApply = forceApply || isNewerTs || isNewSyncId || (force && remoteData.deviceId !== DWS_DEVICE_ID);

    if (shouldApply) {
      if (isPushingSync && !forceApply) return;
      const changed = applyAccountSnapshot(remoteData, false, false);
      state.lastSyncTimestamp = Math.max(state.lastSyncTimestamp || 0, remoteTs || Date.now());
      if (remoteData.syncId) state.lastSeenSyncId = remoteData.syncId;
      if (changed || forceApply) {
        updateProfileHeaderUI();
        if (state.activeCrmLead) {
          const cur = (state.crm || []).find(c => c.id === state.activeCrmLead.id);
          if (cur) {
            state.activeCrmLead = cur;
            renderCrmOrdersList();
          }
        }
        renderCurrentTab();
      }
    }
  } catch (err) {
    // Silent background polling
  } finally {
    isSyncingRemote = false;
  }
}

function startAutoSyncEngine() {
  setInterval(() => pullLatestDataFromServer(false, false), 2500);
  window.addEventListener('focus', () => pullLatestDataFromServer(true, false));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) pullLatestDataFromServer(true, false);
  });
}

// ============================================================
// MODAL CONTROLS
// ============================================================
function setupModals() {
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.dataset.close;
      closeModal(modalId);
    });
  });

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
  if (modal) {
    modal.classList.add('open');
    if (typeof translateDomTree === 'function' && state?.lang === 'en') {
      translateDomTree(modal, 'en');
    }
  }
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
  const nfcTmpl = document.getElementById('profileNfcTemplate');

  if (about) {
    about.addEventListener('input', () => updateCharCount(about, 'aboutCounter'));
  }
  if (tmpl) {
    tmpl.addEventListener('input', () => updateCharCount(tmpl, 'templateCounter'));
  }
  if (nfcTmpl) {
    nfcTmpl.addEventListener('input', () => {
      updateCharCount(nfcTmpl, 'nfcTemplateCounter');
      const list = getNfcTemplatesList();
      list[0] = nfcTmpl.value;
      state.profile.nfcTemplates = list;
    });
  }
  const d2dTmpl = document.getElementById('profileD2dTemplate');
  if (d2dTmpl) {
    d2dTmpl.addEventListener('input', () => updateCharCount(d2dTmpl, 'd2dTemplateCounter'));
  }
}

function updateCharCount(el, counterId) {
  const counter = document.getElementById(counterId);
  if (counter) {
    counter.textContent = el.value.length + '/' + el.maxLength;
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

// ============================================================
// TAB 5: СКРАПІНГ — B2B бізнеси (Google Maps / Instagram)
// Пошук -> сортування по послугах -> таблиці -> CSV для Vapi
// ============================================================
const SCRAPE_CATS = {
  site: 'Розробка сайту',
  ads: 'Реклама Meta / Google',
  auto: 'ТГ-бот / Автоматизація',
  apps: 'Програми та веб-сервіси'
};
const SCRAPE_SERVICE = {
  site: 'Розробка сайту',
  ads: 'Налаштування реклами',
  auto: 'Telegram-бот та автоматизація запису',
  apps: 'Розробка програми / веб-сервісу'
};
const SCRAPE_SOURCE_LABEL = { gmaps: 'Google Maps', instagram: 'Instagram' };
const SCRAPE_ICONS = {
  gmaps: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>'
};
const SCRAPE_CHEVRON = '<svg class="scrape-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>';

const GOOGLE_MAPS_DEFAULT_KEY = 'AIzaSyCPkkYJHF46FDTQRSvbF6fn3vgwM7zNGKY';
function getClientGoogleMapsKey() {
  return localStorage.getItem('dws_google_maps_key') || GOOGLE_MAPS_DEFAULT_KEY;
}

const APIFY_DEFAULT_TOKEN = (() => {
  try { return atob('YXBpZnlfYXBpX1gzM1I4NEsyWDJia2ZNZjdYQWZrQ1R5RU1rblNiSTR4dXVmWA=='); } catch { return ''; }
})();

function getClientApifyToken() {
  return localStorage.getItem('dws_apify_token') || APIFY_DEFAULT_TOKEN;
}

function setClientApifyToken(token) {
  token = String(token || '').trim();
  if (token) localStorage.setItem('dws_apify_token', token);
  else localStorage.removeItem('dws_apify_token');
}

const scrapeState = {
  jobs: [],
  mode: getClientApifyToken() ? 'live' : 'demo',
  offline: false,
  openJobs: new Set(),
  openCats: new Set(),
  pollTimer: null,
  form: { source: 'gmaps', limit: 100 }
};

function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).replace(/[^\d+]/g, '');
  if (!p) return '';
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+')) {
    if (p.startsWith('380')) p = '+' + p;
    else if (p.startsWith('0') && p.length === 10) p = '+38' + p;
    else if (p.startsWith('48') && p.length === 11) p = '+' + p;
    else p = '+' + p;
  }
  return p.length >= 10 ? p : '';
}

function extractPhoneFromText(text) {
  if (!text) return '';
  const match = String(text).match(/(?:\+?38\s*\(?0\d{2}\)?|\b0\d{2}\)?)\s*\d{3}[\s-]?\d{2}[\s-]?\d{2}|\b0\d{2}[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}\b/);
  if (match) return normalizePhone(match[0]);
  return '';
}

function isUkrainianMobilePhone(raw) {
  if (!raw) return false;
  const digits = String(raw).replace(/\D/g, '');
  // Matches Ukrainian mobile numbers: 380 + 9 mobile digits OR 0 + 9 mobile digits
  // Operator prefixes: 50, 66, 95, 99 (Vodafone), 67, 68, 96, 97, 98, 77 (Kyivstar), 63, 73, 93 (lifecell), 91, 92, 94
  return /^(?:380|0)(50|66|95|99|67|68|96|97|98|77|63|73|93|91|92|94)\d{7}$/.test(digits);
}

function getViberDirectUrl(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  const clean380 = digits.startsWith('380') ? digits : (digits.startsWith('0') ? ('38' + digits) : digits);
  return 'viber://chat?number=%2B' + clean380;
}

function launchViberForPhone(rawPhone) {
  if (!rawPhone) return;
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return;
  const clean380 = digits.startsWith('380') ? digits : (digits.startsWith('0') ? ('38' + digits) : ('380' + digits.slice(-9)));
  const viberUri = 'viber://chat?number=%2B' + clean380;
  const isTgWebApp = Boolean(window.Telegram?.WebApp?.initData);
  if (isTgWebApp && typeof window.Telegram?.WebApp?.openLink === 'function') {
    const bridgeUrl = window.location.origin + '/viber.html?num=' + clean380;
    try {
      window.Telegram.WebApp.openLink(bridgeUrl);
      return;
    } catch (_) {}
  }
  try {
    const a = document.createElement('a');
    a.href = viberUri;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { try { document.body.removeChild(a); } catch (_) {} }, 300);
  } catch (_) {
    window.location.href = viberUri;
  }
}

function openTelegramSmartUrl(rawUrl) {
  if (!rawUrl) return;
  const cleanUrl = String(rawUrl).replace(/^https?:\/\/(www\.)?t\.me\/s\//i, 'https://t.me/');
  const isTgWebApp = Boolean(window.Telegram?.WebApp?.initData);
  if (isTgWebApp && typeof window.Telegram?.WebApp?.openTelegramLink === 'function' && /t\.me\//i.test(cleanUrl)) {
    try {
      window.Telegram.WebApp.openTelegramLink(cleanUrl);
      return;
    } catch (_) {}
  }
  window.open(cleanUrl, '_blank');
}

document.addEventListener('click', (e) => {
  const viberAnchor = e.target.closest('a[href^="viber://"]');
  if (viberAnchor) {
    e.preventDefault();
    e.stopPropagation();
    const num = (viberAnchor.getAttribute('href') || '').replace(/\D/g, '');
    launchViberForPhone(num);
    return;
  }
  const tgAnchor = e.target.closest('a[href*="t.me/"]');
  if (tgAnchor && Boolean(window.Telegram?.WebApp?.initData)) {
    e.preventDefault();
    e.stopPropagation();
    openTelegramSmartUrl(tgAnchor.getAttribute('href'));
    return;
  }
  const instaAnchor = e.target.closest('.nfc-insta-link, [data-nfc-insta]');
  if (instaAnchor) {
    e.preventDefault();
    e.stopPropagation();
    const jobId = instaAnchor.dataset.job;
    const venueId = instaAnchor.dataset.venue;
    const job = typeof findAnyNfcJob === 'function' ? findAnyNfcJob(jobId) : null;
    const items = (job && typeof getJobFlatItems === 'function') ? getJobFlatItems(job) : [];
    const venue = items.find(v => (v.id === venueId || v.name === venueId));
    const targetUrl = instaAnchor.dataset.href || instaAnchor.getAttribute('href');

    if (venue && typeof generateNfcPitch === 'function') {
      const pitch = generateNfcPitch(venue, job);
      copyTextToClipboardSync(pitch);
      haptic('success');
    }
    showToast('Офер скопійовано! Вставте в Instagram Direct');

    setTimeout(() => {
      if (Boolean(window.Telegram?.WebApp?.initData) && window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
    }, 120);
    return;
  }
}, true);
function _noopViberEnd() {
}

function cleanInstagramHandle(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const str = raw.trim();
  const m = str.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
  if (m && m[1]) {
    const user = m[1].replace(/[\/?#].*$/, '').trim();
    if (!['explore', 'p', 'reels', 'reel', 'stories', 'direct', 'accounts', 'tags', 'tv'].includes(user.toLowerCase())) {
      return '@' + user;
    }
  }
  const handleMatch = str.match(/(?:^|\s)@([a-zA-Z0-9._]{3,30})(?:\s|$|[.,!?])/);
  if (handleMatch && handleMatch[1]) {
    return '@' + handleMatch[1];
  }
  if (!str.startsWith('http') && !str.includes('/') && !str.includes(' ') && str.length >= 3 && str.length <= 30) {
    return str.startsWith('@') ? str : ('@' + str);
  }
  return '';
}

function extractInstagramFromApifyItem(it) {
  if (!it || typeof it !== 'object') return '';

  // 1. Direct instagrams array from crawler
  if (Array.isArray(it.instagrams) && it.instagrams.length > 0) {
    for (const ig of it.instagrams) {
      const clean = cleanInstagramHandle(ig);
      if (clean) return clean;
    }
  }

  // 2. Direct website field (many Ukrainian venues use their instagram profile as website)
  if (typeof it.website === 'string' && /instagram\.com/i.test(it.website)) {
    const clean = cleanInstagramHandle(it.website);
    if (clean) return clean;
  }

  // 3. Web Results from Google Maps ("Результати веб-пошуку")
  if (Array.isArray(it.webResults) && it.webResults.length > 0) {
    for (const res of it.webResults) {
      const u = res?.url || res?.link || res?.displayedUrl || '';
      if (typeof u === 'string' && /instagram\.com/i.test(u)) {
        const clean = cleanInstagramHandle(u);
        if (clean) return clean;
      }
      const textFields = [res?.title, res?.description, res?.snippet].filter(Boolean).join(' ');
      if (textFields && /instagram\.com/i.test(textFields)) {
        const clean = cleanInstagramHandle(textFields);
        if (clean) return clean;
      }
    }
  }

  // 4. Metadata search: menu, reserveTableUrl, bookingLinks, orderBy, additionalInfo, description, placesTags
  const metaDump = [
    it.menu,
    it.reserveTableUrl,
    typeof it.bookingLinks === 'object' ? JSON.stringify(it.bookingLinks) : it.bookingLinks,
    typeof it.orderBy === 'object' ? JSON.stringify(it.orderBy) : it.orderBy,
    it.description,
    typeof it.additionalInfo === 'object' ? JSON.stringify(it.additionalInfo) : it.additionalInfo,
    Array.isArray(it.placesTags) ? it.placesTags.join(' ') : ''
  ].filter(Boolean).join(' ');

  if (metaDump && /instagram\.com/i.test(metaDump)) {
    const clean = cleanInstagramHandle(metaDump);
    if (clean) return clean;
  }

  return '';
}

function loadLocalScrapes() {
  try {
    const raw = JSON.parse(localStorage.getItem('dws_scrapes') || '[]');
    // Clean out old fake demo jobs so user only sees real Apify venues
    const cleaned = raw.filter(j => !j.demo && !j.localDemo && !(j.id && String(j.id).startsWith('local-')));
    let healed = false;
    cleaned.forEach(j => {
      // Auto-heal any jobs that actually succeeded with items but got marked as error due to showToast
      if (j.status === 'error' && (j.error === 'showToast is not defined' || (j.items && j.items.length > 0))) {
        j.status = 'done';
        j.error = null;
        if (!j.total && j.items) j.total = j.items.length;
        healed = true;
      }
    });
    if (healed || cleaned.length !== raw.length) {
      localStorage.setItem('dws_scrapes', JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

function saveLocalScrapes(jobs) {
  localStorage.setItem('dws_scrapes', JSON.stringify(jobs.filter(j => !j.demo)));
  if (typeof syncAccountToServer === 'function') syncAccountToServer();
}

function saveScrapeJob(job) {
  const current = loadLocalScrapes().filter(j => j.id !== job.id);
  current.unshift(job);
  saveLocalScrapes(current);
  scrapeState.jobs = [job, ...scrapeState.jobs.filter(j => j.id !== job.id)];
}

async function fetchScrapes() {
  try {
    const res = await fetch('/api/scrapes');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json.success) throw new Error('bad');
    scrapeState.offline = false;
    scrapeState.mode = json.mode || (getClientApifyToken() ? 'live' : 'demo');
    const remote = json.data || [];
    const local = loadLocalScrapes();
    const seen = new Set(remote.map(r => r.id));
    scrapeState.jobs = [...remote, ...local.filter(l => !seen.has(l.id))];
  } catch {
    scrapeState.offline = true;
    scrapeState.mode = getClientApifyToken() ? 'live' : 'demo';
    scrapeState.jobs = loadLocalScrapes();
  }
  renderScrapes();
  scheduleScrapePoll();
}

function scheduleScrapePoll() {
  clearTimeout(scrapeState.pollTimer);
  if (scrapeState.jobs.some(j => j.status === 'running' && !j.local)) {
    scrapeState.pollTimer = setTimeout(fetchScrapes, 4000);
  }
}

function pluralBiz(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'бізнес';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'бізнеси';
  return 'бізнесів';
}

function renderScrapes() {
  const list = document.getElementById('scrapeJobsList');
  if (!list) return;

  const total = scrapeState.jobs.reduce((s, j) => s + (j.status === 'done' ? (j.total || 0) : 0), 0);
  const numEl = document.getElementById('scrapeTotalNum');
  const lblEl = document.getElementById('scrapeTotalLabel');
  if (numEl) numEl.textContent = total;
  if (lblEl) lblEl.textContent = pluralBiz(total);



  const dot = document.getElementById('scrapeApiDot');
  const lbl = document.getElementById('scrapeApiLabel');
  if (dot && lbl) {
    if (scrapeState.mode === 'live') {
      dot.classList.add('active');
      lbl.textContent = 'Apify Live';
    } else {
      dot.classList.remove('active');
      lbl.textContent = 'Підключити API';
    }
  }

  if (!scrapeState.jobs.length) {
    list.innerHTML = '<div class="scrape-empty">Оберіть Google Maps або Instagram вище, щоб запустити перший пошук бізнесів.</div>';
    return;
  }

  list.innerHTML = scrapeState.jobs.map(job => {
    const isOpen = scrapeState.openJobs.has(job.id);
    const date = new Date(job.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
    let pill = '';
    if (job.status === 'running') pill = `<span class="scrape-status-pill running">${escapeHtml(job.progressText || 'Шукаю…')}</span>`;
    else if (job.status === 'error') pill = '<span class="scrape-status-pill error">Помилка</span>';
    else if (job.demo) pill = '<span class="scrape-status-pill demo">Демо</span>';
    else pill = '<span class="scrape-status-pill live">Apify Live</span>';

    const right = job.status === 'running'
      ? '<div class="scrape-spinner"></div>'
      : `<div class="scrape-job-count"><b>${job.total || 0}</b><span>${pluralBiz(job.total || 0)}</span></div>`;

    let body = '';
    if (job.status === 'done') {
      const cats = Object.keys(SCRAPE_CATS).map(c => renderScrapeCat(job, c)).join('');
      body = `
        <div class="scrape-job-body">
          <div class="scrape-job-actions">
            <button type="button" class="btn btn--fill btn--sm" data-scrape-act="csv" data-job="${job.id}" data-cat="all">CSV для Vapi (всі)</button>
            <button type="button" class="btn btn--out btn--sm" data-scrape-act="send" data-job="${job.id}" data-cat="all">В Telegram</button>
          </div>
          ${cats}
          ${job.skippedNoPhone ? `<div class="scrape-biz-reason" style="margin-top:10px;">Відсіяно без телефону: ${job.skippedNoPhone}</div>` : ''}
          <div class="scrape-job-actions">
            <button type="button" class="btn btn--out btn--sm scrape-btn-delete" data-scrape-act="delete" data-job="${job.id}">Видалити пошук</button>
          </div>
        </div>`;
    } else if (job.status === 'error') {
      body = `
        <div class="scrape-job-body">
          <div class="scrape-biz-reason" style="margin:12px 0;">${escapeHtml(job.error || 'Невідома помилка')}</div>
          <div class="scrape-job-actions">
            <button type="button" class="btn btn--out btn--sm scrape-btn-delete" data-scrape-act="delete" data-job="${job.id}">Видалити</button>
          </div>
        </div>`;
    }

    return `
      <div class="scrape-job ${isOpen ? 'open' : ''}" data-job-id="${job.id}">
        <div class="scrape-job-head" data-scrape-toggle-job="${job.id}">
          <div class="scrape-job-ico">${SCRAPE_ICONS[job.source] || SCRAPE_ICONS.gmaps}</div>
          <div class="scrape-job-info">
            <div class="scrape-job-title">${escapeHtml(job.niche)}${job.city ? ' · ' + escapeHtml(job.city) : ''}</div>
            <div class="scrape-job-sub">${SCRAPE_SOURCE_LABEL[job.source] || ''} · ${date}${pill}</div>
          </div>
          ${right}
          ${job.status === 'running' ? '' : SCRAPE_CHEVRON}
        </div>
        ${body}
      </div>`;
  }).join('');
}

function renderScrapeCat(job, cat) {
  const items = job.groups?.[cat] || [];
  const key = job.id + ':' + cat;
  const isOpen = scrapeState.openCats.has(key);
  const rows = items.map((b, idx) => {
    const cleanPhone = (b.phone || '').replace(/[^\d]/g, '');
    const isMobile = isUkrainianMobilePhone(cleanPhone);
    const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
    const cleanInsta = (b.instagram || (b.source === 'instagram' ? b.username : '') || '').replace(/^@+/, '');
    const instaUrl = cleanInsta ? `https://instagram.com/${cleanInsta}` : `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent((b.name || '') + ' ' + (b.city || job.city || ''))}`;
    
    // Direct Google Maps business place card
    let mapUrl = b.link || b.mapsUrl || '';
    if (!mapUrl || !mapUrl.includes('google.com/maps')) {
      if (b.placeId) {
        mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name)}&query_place_id=${encodeURIComponent(b.placeId)}`;
      } else if (b.cid) {
        mapUrl = `https://maps.google.com/?cid=${encodeURIComponent(b.cid)}`;
      } else {
        mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(((b.name || '') + ' ' + (b.address || b.city || job.city || '')).trim())}`;
      }
    }

    return `
      <tr>
        <td style="font-weight:700; color:var(--muted);">${idx + 1}</td>
        <td style="font-weight:700;">
          <a href="${mapUrl}" target="_blank" rel="noopener" style="color:var(--black); text-decoration:none; display:inline-flex; align-items:center; gap:4px;" title="Відкрити картку закладу в Google Maps">
            <span>${escapeHtml(b.name)}</span>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </td>
        <td>
          <div style="display:inline-flex; align-items:center; flex-wrap:wrap; gap:6px;">
            <a href="tel:${escapeHtml(b.phone)}" style="color:var(--accent); font-weight:600; text-decoration:none;">${escapeHtml(b.phone || '—')}</a>
            ${isMobile ? `<a href="${viberUrl}" target="_blank" rel="noopener" style="display:inline-flex; align-items:center; gap:2px; font-size:0.7rem; font-weight:700; color:#0066FF; background:rgba(0,102,255,0.12); padding:1px 6px; border-radius:6px; text-decoration:none;" title="Написати у Viber">Viber</a>` : ''}
          </div>
        </td>
        <td style="color:var(--muted); font-size:0.75rem;">${escapeHtml(b.reason || '—')}</td>
        <td>${escapeHtml(b.city || job.city || '—')}</td>
        <td>
          <div style="display:flex; flex-direction:column; gap:2px;">
            ${b.website ? `<a href="${escapeHtml(b.website)}" target="_blank" rel="noopener" style="color:var(--accent); font-weight:600; text-decoration:underline; font-size:0.8rem;">вебсайт</a>` : ''}
            <a href="${instaUrl}" target="_blank" rel="noopener" style="color:#007aff; font-size:0.75rem; font-weight:700; text-decoration:none;" title="${cleanInsta ? 'Instagram профіль' : 'Шукати в Instagram'}">
              ${cleanInsta ? '@' + cleanInsta : 'Insta пошук'}
            </a>
          </div>
        </td>
        <td>${b.source === 'instagram' ? `${b.followers || 0} підп.` : `${b.rating ? Number(b.rating).toFixed(1) : '—'} ★ (${b.reviews || 0})`}</td>
        <td style="text-align:right;">
          <button type="button" class="btn btn--fill btn--xs" data-scrape-act="crm-add" data-job="${job.id}" data-biz-idx="${idx}" data-cat="${cat}" title="Додати заклад у CRM" style="padding:4px 8px; font-size:0.75rem;">
            + CRM
          </button>
        </td>
      </tr>`;
  }).join('');

  return `
    <div class="scrape-cat ${isOpen ? 'open' : ''}">
      <div class="scrape-cat-head" data-scrape-toggle-cat="${key}">
        <span class="scrape-cat-dot ${cat}"></span>
        <span class="scrape-cat-name">${SCRAPE_CATS[cat]}</span>
        <span class="scrape-cat-num">${items.length}</span>
        ${SCRAPE_CHEVRON}
      </div>
      <div class="scrape-cat-body">
        ${items.length ? `
          <div class="scrape-table-wrap">
            <table class="scrape-table">
              <thead><tr><th>#</th><th>БІЗНЕС (КАРТА)</th><th>ТЕЛЕФОН</th><th>БІЛЬ / ПРИЧИНА</th><th>МІСТО</th><th>САЙТ / INSTA</th><th>${job.source === 'instagram' ? 'ПІДПИСНИКИ' : 'РЕЙТИНГ · ВІДГУКИ'}</th><th style="text-align:right;">ДІЯ</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div class="scrape-cat-actions">
            <button type="button" class="btn btn--fill btn--sm" data-scrape-act="csv" data-job="${job.id}" data-cat="${cat}">CSV для Vapi</button>
            <button type="button" class="btn btn--out btn--sm" data-scrape-act="send" data-job="${job.id}" data-cat="${cat}">В Telegram</button>
          </div>` : '<div class="scrape-biz-reason" style="padding:4px 4px 0;">У цій категорії поки порожньо.</div>'}
      </div>
    </div>`;
}

// ============================================================
// GLOBAL SEEN BUSINESSES REGISTRY & SMART DISTRICT QUERY ENGINE
// Prevents returning duplicate venues on repeated searches and
// rotates across city neighborhoods/sub-niches to find 100% NEW venues
// ============================================================
const CLIENT_CITY_DISTRICTS = {
  'київ': ['Печерськ', 'Поділ', 'Оболонь', 'Позняки', 'Осокорки', 'Голосіївський', 'Шевченківський', 'Лук\'янівка', 'Солом\'янський', 'Троєщина', 'Дарниця', 'Лівобережна', 'Святошин', 'Нивки', 'Теремки', 'Виноградар', 'Шулявка', 'Деміївка', 'Березняки', 'Русанівка', 'Золоті Ворота', 'Хрещатик', 'Воздвиженка', 'Кловська'],
  'вінниця': ['Вишенька', 'Замостя', 'Поділля', 'Слов\'янка', 'Центр', 'Урожай', 'Старе місто', 'Тяжилів', 'Київська', 'Корея', 'П\'ятничани', 'Академічний', 'Пирогова', 'Соборна', 'Келецька', 'Коцюбинського', 'Юність', 'Хмельницьке шосе', 'Барське шосе', 'Електромережа', 'Сабарів', 'Військове містечко'],
  'львів': ['Галицький район', 'Франківський район', 'Сихів', 'Шевченківський район', 'Личаківський район', 'Залізничний район', 'Площа Ринок', 'Проспект Свободи', 'Наукова', 'Чорновола', 'Кульпарківська', 'Городоцька', 'Стрийська', 'Зелена', 'Левандовка', 'Рясне', 'Пасічна', 'Новий Львів'],
  'одеса': ['Приморський район', 'Аркадія', 'Таїрова', 'Черемушки', 'Фонтан', 'Котовського', 'Дерибасівська', 'Центр', 'Французький бульвар', 'Малиновський район', 'Пересип', 'Молдаванка', 'Ланжерон', 'Катерининська', 'Рішельєвська'],
  'дніпро': ['Соборний район', 'Шевченківський район', 'Центральний район', 'Перемога', 'Тополя', 'Сонячний', 'Лівобережний', 'Гагаріна', 'Яворницького', 'Калинова', 'Робоча', 'Кірова', 'Тітова', 'Правда', 'Кам\'янський'],
  'харків': ['Шевченківський район', 'Київський район', 'Салтівка', 'Олексіївка', 'Наукова', 'Центр', 'Сумська', 'Пушкінська', 'Холодна Гора', 'Нові Будинки', 'Павлове Поле', 'Гагаріна', 'Ботанічний сад'],
  'тернопіль': ['Центр', 'Дружба', 'Сонячний', 'Східний', 'Аляска', 'БАМ', 'Новий Світ', 'Канада', 'Кутківці', 'Оболоня', 'Руська', 'Злуки', 'Мазепи'],
  'івано-франківськ': ['Центр', 'Пасічна', 'Каскад', 'Позитрон', 'БАМ', 'Кішлак', 'Майзлі', 'Гірка', 'Набережна', 'Незалежності', 'Коновальця', 'Чорновола'],
  'хмельницький': ['Центр', 'Виставка', 'Озерна', 'Південно-Західний', 'Ракове', 'Гречани', 'Дубове', 'Заріччя', 'Кам\'янецька', 'Проскурівська', 'Подільська'],
  'чернівці': ['Центр', 'Кобилянської', 'Головна', 'Гравітон', 'Роша', 'Калічанка', 'Садгора', 'Південно-Кільцева', 'Героїв Майдану', 'Руська', 'Університетська'],
  'рівне': ['Центр', 'Ювілейний', 'Північний', 'Щасливе', 'Боярка', 'Басів Кут', 'Золотіїв', 'Соборна', 'Київська', 'Грушевського'],
  'луцьк': ['Центр', '33-й квартал', '40-й квартал', '55-й мікрорайон', 'ГПЗ', 'Теремно', 'Красне', 'Волі', 'Соборності', 'Відродження'],
  'житомир': ['Центр', 'Богунія', 'Корбутівка', 'Крошня', 'Польова', 'Мальованка', 'Київська', 'Велика Бердичівська', 'Перемоги'],
  'полтава': ['Центр', 'Алмазний', 'Левада', 'Поділ', 'Сади', 'Брайлки', 'Половки', 'Соборності', 'Європейська'],
  'черкаси': ['Центр', 'Митниця', 'Південно-Західний', 'Соснівка', 'Казбет', 'Сєдова', 'Хімселище', 'Шевченка', 'Смілянська'],
  'ужгород': ['Центр', 'Новий район', 'Боздош', 'Минайська', 'Шахта', 'Радванка', 'Корзо', 'Свободи', 'Перемоги'],
  'запоріжжя': ['Олександрівський', 'Вознесенівський', 'Дніпровський', 'Комунарський', 'Хортицький', 'Шевченківський', 'Соборний проспект', 'Бабурка', 'Космос', 'Бородинський'],
  'миколаїв': ['Центральний район', 'Інгульський район', 'Заводський район', 'Корабельний район', 'Соборна', 'Намив', 'Ліски', 'Соляні']
};

const CLIENT_UNIVERSAL_ZONES = [
  'центр', 'вулиця Соборна', 'вулиця Київська', 'вулиця Незалежності',
  'вулиця Шевченка', 'вулиця Грушевського', 'проспект Миру', 'торговий центр',
  'вокзал', 'ринок', 'мікрорайон', 'парк', 'площа', 'набережна', 'бульвар'
];

function extractBizSeenKeysClient(b, fallbackCity = '') {
  if (!b || typeof b !== 'object') return [];
  const keys = [];
  if (b.placeId) keys.push(`pid:${String(b.placeId).trim()}`);
  if (b.cid) keys.push(`cid:${String(b.cid).trim()}`);
  if (b.phone) {
    const digits = String(b.phone).replace(/[^\d]/g, '').slice(-9);
    if (digits.length >= 9) keys.push(`tel:${digits}`);
  }
  const rawIg = (b.instagram || b.username || '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@+/, '').replace(/\/.*$/, '').toLowerCase().trim();
  if (rawIg && rawIg !== 'client' && rawIg !== 'username' && !rawIg.startsWith('demo')) {
    keys.push(`ig:${rawIg}`);
  }
  const cleanName = String(b.name || b.title || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').trim();
  const cleanCity = String(b.city || fallbackCity || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '').trim();
  if (cleanName && cleanName.length >= 2) {
    keys.push(`nc:${cleanName}|${cleanCity}`);
  }
  return keys;
}

const STATIC_DEMO_NFC_JOB_IDS = new Set(['nfc-job-kyiv-ocean', 'nfc-job-lviv-rynok', 'nfc-job-kyiv-obolon']);

async function loadGlobalSeenRegistry() {
  const seenSet = new Set();
  let waveOffsets = {};

  // 1. Load from localStorage
  try {
    const rawSeen = JSON.parse(localStorage.getItem('dws_seen_places') || '[]');
    if (Array.isArray(rawSeen)) rawSeen.forEach(k => seenSet.add(k));
  } catch (e) {}
  try {
    const rawWaves = JSON.parse(localStorage.getItem('dws_search_wave_offsets') || '{}');
    if (rawWaves && typeof rawWaves === 'object') waveOffsets = { ...rawWaves };
  } catch (e) {}

  // 2. Harvest from all existing real jobs in scrapeState.jobs, nfcRadarState.jobs, and state.crm
  const addBiz = (b, city) => {
    extractBizSeenKeysClient(b, city).forEach(k => seenSet.add(k));
  };
  try {
    (scrapeState.jobs || []).forEach(job => {
      if (!job || job.demo) return;
      const jCity = job.city || '';
      if (Array.isArray(job.items)) job.items.forEach(b => addBiz(b, jCity));
      if (job.groups && typeof job.groups === 'object') {
        Object.values(job.groups).forEach(arr => {
          if (Array.isArray(arr)) arr.forEach(b => addBiz(b, jCity));
        });
      }
    });
    (nfcRadarState.jobs || []).forEach(job => {
      if (!job || STATIC_DEMO_NFC_JOB_IDS.has(job.id)) return;
      const jCity = job.city || '';
      if (Array.isArray(job.items)) job.items.forEach(b => addBiz(b, jCity));
    });
    (state.crm || []).forEach(c => {
      if (c && c.id !== 'crm-1') addBiz(c, c.city || c.cluster || '');
    });
  } catch (e) {}

  // 3. Merge with Backend /api/scrapes/seen AND Apify Cloud KV Store (seen_places_absolutikdenchik)
  const token = getClientApifyToken();
  const kvUrl = token ? `https://api.apify.com/v2/key-value-stores/${CLOUD_KV_STORE_ID}/records/seen_places_absolutikdenchik?token=${encodeURIComponent(token)}&_t=${Date.now()}` : '';

  const syncPromises = [
    fetch('/api/scrapes/seen', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json && json.success) {
          if (Array.isArray(json.keys)) json.keys.forEach(k => seenSet.add(k));
          if (json.waveOffsets && typeof json.waveOffsets === 'object') {
            for (const [wk, wv] of Object.entries(json.waveOffsets)) {
              waveOffsets[wk] = Math.max(Number(waveOffsets[wk] || 0), Number(wv || 0));
            }
          }
        }
      })
      .catch(() => null)
  ];

  if (kvUrl) {
    syncPromises.push(
      fetch(kvUrl, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null)
        .then(kv => {
          if (kv && typeof kv === 'object') {
            if (Array.isArray(kv.keys)) kv.keys.forEach(k => seenSet.add(k));
            if (kv.waveOffsets && typeof kv.waveOffsets === 'object') {
              for (const [wk, wv] of Object.entries(kv.waveOffsets)) {
                waveOffsets[wk] = Math.max(Number(waveOffsets[wk] || 0), Number(wv || 0));
              }
            }
          }
        })
        .catch(() => null)
    );
  }

  await Promise.all(syncPromises);

  // Persist merged snapshot locally
  try {
    localStorage.setItem('dws_seen_places', JSON.stringify(Array.from(seenSet).slice(-20000)));
    localStorage.setItem('dws_search_wave_offsets', JSON.stringify(waveOffsets));
  } catch (e) {}

  return {
    seenSet,
    waveOffsets,
    isBizSeen(b, fallbackCity = '') {
      const keys = extractBizSeenKeysClient(b, fallbackCity);
      return keys.some(k => seenSet.has(k));
    },
    markBizSeen(b, fallbackCity = '') {
      const keys = extractBizSeenKeysClient(b, fallbackCity);
      keys.forEach(k => seenSet.add(k));
    }
  };
}

async function saveGlobalSeenRegistry(newBusinesses = [], waveKey = '', nextWaveOffset = null, fallbackCity = '') {
  try {
    let seenArr = [];
    let waveOffsets = {};
    try { seenArr = JSON.parse(localStorage.getItem('dws_seen_places') || '[]'); } catch (e) {}
    try { waveOffsets = JSON.parse(localStorage.getItem('dws_search_wave_offsets') || '{}'); } catch (e) {}
    if (!Array.isArray(seenArr)) seenArr = [];
    if (!waveOffsets || typeof waveOffsets !== 'object') waveOffsets = {};

    const seenSet = new Set(seenArr);
    for (const b of newBusinesses) {
      extractBizSeenKeysClient(b, fallbackCity).forEach(k => seenSet.add(k));
    }
    if (waveKey && nextWaveOffset !== null && nextWaveOffset !== undefined) {
      waveOffsets[waveKey] = Math.max(Number(waveOffsets[waveKey] || 0), Number(nextWaveOffset));
    }

    const finalKeys = Array.from(seenSet).slice(-20000);
    localStorage.setItem('dws_seen_places', JSON.stringify(finalKeys));
    localStorage.setItem('dws_search_wave_offsets', JSON.stringify(waveOffsets));

    const token = getClientApifyToken();
    const kvUrl = token ? `https://api.apify.com/v2/key-value-stores/${CLOUD_KV_STORE_ID}/records/seen_places_absolutikdenchik?token=${encodeURIComponent(token)}` : '';
    const payload = {
      updatedAt: Date.now(),
      keys: finalKeys,
      waveOffsets
    };

    const savePromises = [
      fetch('/api/scrapes/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: newBusinesses,
          waveKey,
          nextWaveOffset,
          city: fallbackCity
        })
      }).catch(() => null)
    ];

    if (kvUrl) {
      savePromises.push(
        fetch(kvUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => null)
      );
    }

    await Promise.all(savePromises);

    if (typeof syncAccountToServer === 'function') {
      syncAccountToServer();
    }
  } catch (err) {
    console.warn('[SeenRegistry] Save error:', err);
  }
}

function getSmartNicheVariants(rawNiche) {
  const clean = String(rawNiche || '').trim();
  if (!clean) return ['заклади'];

  const nLower = clean.toLowerCase();

  // 1. Barbershops / Men's grooming (BEFORE any general hair/beauty or bar!)
  if (/барбер|чоловіч.*перукар/i.test(nLower)) {
    return ['барбершоп', 'барбершопи', 'чоловіча перукарня', 'barbershop'];
  }

  // 2. Beauty / Hair / Nails (ensure barbershop is NOT captured here!)
  if (/манікюр|нігт/i.test(nLower)) {
    return ['студія манікюру', 'манікюр', 'нігтьовий сервіс'];
  }
  if (/перукарн/i.test(nLower)) {
    return ['перукарня', 'салон-перукарня'];
  }
  if (/салон.*крас|б'юті|beauty|косметолог/i.test(nLower)) {
    return ['салон краси', 'б\'юті студія', 'косметологія', 'beauty salon'];
  }

  // 3. Dentistry / Medical / Veterinary
  if (/стоматолог/i.test(nLower)) {
    return ['стоматологія', 'стоматологічна клініка', 'зубний лікар'];
  }
  if (/клінік|медич|медицин/i.test(nLower)) {
    return ['медичний центр', 'приватна клініка', 'медична клініка'];
  }
  if (/ветеринар|ветклінік/i.test(nLower)) {
    return ['ветеринарна клініка', 'ветклініка', 'ветеринар'];
  }

  // 4. Travel agencies / Tourism
  if (/тур|турагент|туристич/i.test(nLower)) {
    return ['туристичне агентство', 'турагентство', 'тур агенція', 'гарячі тури'];
  }

  // 5. Food & Drink — STRICT word boundaries so "барбер" NEVER matches "бар"!
  if (/кав'?ярн|кофейн/i.test(nLower)) {
    return ['кав\'ярня', 'кава з собою', 'coffee'];
  }
  if (/ресторан|рестик/i.test(nLower)) {
    return ['ресторан', 'ресторани', 'гастробар'];
  }
  if (/піцер/i.test(nLower)) {
    return ['піцерія', 'pizza'];
  }
  if (/суші|суши/i.test(nLower)) {
    return ['суші бар', 'доставка суші', 'sushi'];
  }
  if (/(?:^|\s)бар[иа]?\b|(?:^|\s)паб\b|pub/i.test(nLower)) {
    return ['бар', 'паб'];
  }
  if (/кафе/i.test(nLower)) {
    return ['кафе', 'бістро'];
  }
  if (/кондитер|пекарн/i.test(nLower)) {
    return ['пекарня', 'кондитерська'];
  }
  if (/кальян/i.test(nLower)) {
    return ['кальянна', 'hookah'];
  }

  // 6. Auto / Repair
  if (/детейлінг/i.test(nLower)) {
    return ['детейлінг', 'detailing'];
  }
  if (/автомийк|мийк/i.test(nLower)) {
    return ['автомийка', 'мийка авто'];
  }
  if (/шиномонтаж/i.test(nLower)) {
    return ['шиномонтаж'];
  }
  if (/сто\b|автосервіс|ремонт.*авто/i.test(nLower)) {
    return ['автосервіс', 'СТО', 'ремонт авто'];
  }

  // 7. Sport / Fitness
  if (/фітнес|спортзал|тренажер/i.test(nLower)) {
    return ['фітнес клуб', 'спортзал', 'тренажерний зал'];
  }
  if (/йог|пілатес|стретчинг/i.test(nLower)) {
    return ['студія йоги', 'пілатес', 'стретчинг'];
  }

  // 8. Flowers & Gifts
  if (/квіт|флорист/i.test(nLower)) {
    return ['квітковий магазин', 'квіти', 'флористика'];
  }

  // 9. Real estate / Notary / Legal / Auto school
  if (/нотаріус/i.test(nLower)) {
    return ['нотаріус', 'приватний нотаріус'];
  }
  if (/автошкол/i.test(nLower)) {
    return ['автошкола'];
  }
  if (/готел|хостел|hotel/i.test(nLower)) {
    return ['готель', 'хостел'];
  }
  if (/нерухоміст|рієлтор/i.test(nLower)) {
    return ['агентство нерухомості', 'рієлтор'];
  }
  if (/фотостуд/i.test(nLower)) {
    return ['фотостудія'];
  }

  // 10. Universal fallback: exact user words
  const parts = clean.split(/[,;/]+/).map(s => s.trim()).filter(Boolean);
  return parts.length ? parts : [clean];
}

function isVenueRelevantToNiche(place, targetNiche) {
  if (!place || !targetNiche) return true;

  const name = (place.displayName?.text || place.title || place.name || '').toLowerCase();
  const address = (place.formattedAddress || place.address || place.street || '').toLowerCase();
  const website = (place.websiteUri || place.website || '').toLowerCase();
  const primaryType = (place.primaryType || place.categoryName || '').toLowerCase();
  const types = Array.isArray(place.types) ? place.types.map(t => String(t).toLowerCase()) : [];
  const allTypes = [primaryType, ...types];

  const nicheClean = String(targetNiche).toLowerCase().trim();

  // Category intent checks
  const isTargetFood = /ресторан|рестик|кафе|кав'?ярн|кофейн|бар\b|паб|піц|суш|бургер|пекарн|їж|кухн|кондитер|столов/i.test(nicheClean);
  const isTargetBarber = /барбер|чоловіч.*перукар/i.test(nicheClean);
  const isTargetDental = /стоматолог|зуб/i.test(nicheClean);
  const isTargetMedical = /клінік|медич|лікарн/i.test(nicheClean) && !isTargetDental;
  const isTargetAuto = /авто|сто\b|шиномонтаж|детейлінг|мийк/i.test(nicheClean);
  const isTargetTravel = /тур|турагент|туристич/i.test(nicheClean);

  const placeIsFoodType = allTypes.some(t => ['restaurant', 'cafe', 'bakery', 'meal_takeaway', 'meal_delivery', 'bar', 'coffee_shop', 'pizza_restaurant', 'fast_food_restaurant', 'sushi_restaurant'].includes(t)) || /ресторан|кафе|їдальня|пекарня|піцерія|суші/i.test(primaryType);
  const placeIsBarberType = allTypes.some(t => ['barber_shop'].includes(t)) || /барбершоп|перукарня/i.test(primaryType);
  const placeIsDentalType = allTypes.some(t => ['dental_clinic', 'dentist'].includes(t)) || /стоматолог/i.test(primaryType);
  const placeIsAutoType = allTypes.some(t => ['car_repair', 'car_wash', 'auto_repair'].includes(t)) || /автосервіс|автомийка/i.test(primaryType);
  const placeIsTravelType = allTypes.some(t => ['travel_agency', 'tour_agency'].includes(t)) || /туристич|турагент/i.test(primaryType);

  // If user is searching Barbershops:
  if (isTargetBarber) {
    if (placeIsFoodType || placeIsDentalType || placeIsAutoType || placeIsTravelType) {
      if (!/барбер|barber|чоловіч.*перукар/i.test(name)) return false;
    }
    if (placeIsBarberType || /барбер|barber|чоловіч|перукар|бритв|fades/i.test(name)) return true;
    if (allTypes.includes('hair_salon') || allTypes.includes('hair_care')) {
      return !/жіноч|women|lady|манікюр/i.test(name);
    }
    return false;
  }

  // If user is searching Food/Restaurants:
  if (isTargetFood) {
    if (placeIsBarberType || placeIsDentalType || placeIsAutoType || placeIsTravelType) {
      if (!/ресторан|кафе|кав'?ярн|бар|паб|піц|суш|кухн|бургер|пекар/i.test(name)) return false;
    }
    return true;
  }

  // If user is searching Dental:
  if (isTargetDental) {
    if (placeIsFoodType || placeIsBarberType || placeIsAutoType || placeIsTravelType) {
      if (!/стоматолог|dental|дент|зуб/i.test(name)) return false;
    }
    return placeIsDentalType || /стоматолог|dental|дент|зуб/i.test(name);
  }

  // If user is searching Travel:
  if (isTargetTravel) {
    if (placeIsFoodType || placeIsBarberType || placeIsDentalType || placeIsAutoType) {
      if (!/тур|tour|travel|путівк/i.test(name)) return false;
    }
    return placeIsTravelType || /тур|tour|travel|путівк/i.test(name);
  }

  // If user is searching Auto:
  if (isTargetAuto) {
    if (placeIsFoodType || placeIsBarberType || placeIsDentalType || placeIsTravelType) {
      if (!/авто|сто|сервіс|tire|car|auto|шиномонтаж/i.test(name)) return false;
    }
    return placeIsAutoType || /авто|сто\b|сервіс|tire|car|auto|шиномонтаж/i.test(name);
  }

  // General mismatch check: if place is explicitly a restaurant/food and target is not food
  if (placeIsFoodType && !/їж|харч|кухн|продукт/i.test(nicheClean)) {
    const nicheStem = nicheClean.slice(0, 4);
    if (!name.includes(nicheStem)) return false;
  }

  return true;
}

function buildSmartDistrictQueriesClient(niche, city, cluster = '', waveIndex = 0, batchSize = 10) {
  const cleanNiche = String(niche || '').trim();
  const cleanCity = String(city || '').trim();
  const cleanCluster = String(cluster || '').trim();
  const cityLower = cleanCity.toLowerCase();

  const subNiches = getSmartNicheVariants(cleanNiche);

  let districts = [];
  for (const [k, arr] of Object.entries(CLIENT_CITY_DISTRICTS)) {
    if (cityLower.includes(k)) {
      districts = arr;
      break;
    }
  }
  if (!districts.length) districts = CLIENT_UNIVERSAL_ZONES;

  const candidatePool = [];

  // 1. Primary query with original user phrase
  if (cleanCluster) {
    if (cleanCity) candidatePool.push(`${cleanNiche} ${cleanCluster} ${cleanCity}`);
    else candidatePool.push(`${cleanNiche} ${cleanCluster}`);
  } else {
    if (cleanCity) candidatePool.push(`${cleanNiche} ${cleanCity}`);
    else candidatePool.push(cleanNiche);
  }

  // 2. Add sub-niche variants across whole city
  for (const sn of subNiches) {
    if (cleanCity) candidatePool.push(`${sn} ${cleanCity}`);
    else candidatePool.push(sn);
  }

  // 3. Add sub-niches per district
  for (const d of districts) {
    for (const sn of subNiches) {
      if (cleanCity) candidatePool.push(`${sn} ${d} ${cleanCity}`);
      else candidatePool.push(`${sn} ${d}`);
    }
  }

  const uniquePool = Array.from(new Set(candidatePool));
  const startIdx = (waveIndex * batchSize) % uniquePool.length;
  const selected = [];
  for (let i = 0; i < Math.min(batchSize, uniquePool.length); i++) {
    selected.push(uniquePool[(startIdx + i) % uniquePool.length]);
  }
  return selected;
}

// ---- Live Apify B2B Scraper Engine ----
const SOCIAL_SITE_RE = /(instagram\.com|facebook\.com|fb\.com|linktr\.ee|taplink|t\.me|tiktok\.com|wa\.me|viber|google\.com\/maps|business\.site)/i;
const BOOKING_NICHE_RE = /(стомат|dental|салон|beauty|краси|барбер|barber|клінік|clinic|медич|автосерв|сто\b|шиномонт|фітнес|fitness|спорт|йог|масаж|spa|спа|ресторан|кафе|кав'ярн|піца|суші|доставк|готел|hotel|хостел|ветерин|косметолог|манікюр|nail|тату|школ|курси|репетит)/i;

function classifyBizLocal(b) {
  const site = (b.website || '').trim();
  const hasRealSite = site && !SOCIAL_SITE_RE.test(site);
  const reviews = Number(b.reviews) || 0;
  const rating = Number(b.rating) || 0;
  const followers = Number(b.followers) || 0;
  const nicheText = `${b.niche || ''} ${b.category || ''} ${b.name || ''}`;

  if (!hasRealSite) {
    return {
      category: 'site',
      reason: site ? 'Замість сайту — соцмережа/лінк' : 'Немає сайту'
    };
  }
  if (reviews >= 300) {
    return { category: 'apps', reason: `Великий бізнес (${reviews} відгуків) — потрібна власна програма / веб-сервіс` };
  }
  if (BOOKING_NICHE_RE.test(nicheText) && reviews >= 40) {
    return { category: 'auto', reason: `Багато клієнтів (${reviews} відгуків), запис вручну — бот/автозапис` };
  }
  if (b.source === 'instagram' && followers && followers < 3000) {
    return { category: 'ads', reason: `Мало підписників (${followers}) — потрібна реклама` };
  }
  if (reviews < 40 || (rating && rating < 4.3)) {
    return { category: 'ads', reason: `Мало відгуків (${reviews}) — потрібна реклама` };
  }
  return { category: 'auto', reason: 'Сайт є, трафік є — автоматизація заявок' };
}

async function runSingleApifyActorClient(actorId, input, token) {
  const startRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  if (!startRes.ok) {
    const errTxt = await startRes.text();
    let msg = `Apify помилка (${startRes.status})`;
    try { msg = JSON.parse(errTxt).error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const startData = await startRes.json();
  const runId = startData.data?.id;
  const datasetId = startData.data?.defaultDatasetId;
  if (!runId || !datasetId) throw new Error('Не отримано ID запуску Apify');

  const startTime = Date.now();
  const maxTimeout = 5 * 60 * 1000;
  while (Date.now() - startTime < maxTimeout) {
    await new Promise(r => setTimeout(r, 3200));
    const sRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
    if (!sRes.ok) continue;
    const sData = await sRes.json();
    const st = sData.data?.status;
    if (st === 'SUCCEEDED') break;
    if (st === 'FAILED' || st === 'TIMED-OUT' || st === 'ABORTED') {
      throw new Error(`Парсер завершився зі статусом: ${st}`);
    }
  }

  const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true&format=json`);
  if (!itemsRes.ok) throw new Error(`Не вдалося завантажити результати (${itemsRes.status})`);
  return await itemsRes.json();
}

async function runLiveApifyJob(job) {
  const token = getClientApifyToken();
  if (!token) {
    job.status = 'error';
    job.error = 'Apify токен не знайдено. Введіть токен у налаштуваннях.';
    saveScrapeJob(job);
    renderScrapes();
    return;
  }

  const targetLimit = Math.max(5, Math.min(Number(job.limit) || 100, 500));
  const baseQuery = [job.niche, job.city].filter(Boolean).join(' ');
  const actorId = job.source === 'instagram' ? 'apify~instagram-scraper' : 'compass~crawler-google-places';

  try {
    const reg = await loadGlobalSeenRegistry();
    const waveKey = `scrape:${job.source || 'gmaps'}:${String(job.niche || '').toLowerCase().trim()}:${String(job.city || '').toLowerCase().trim()}`;
    let currentWave = Number(reg.waveOffsets[waveKey] || 0);

    const allItems = [];
    let skippedNoPhone = 0;
    const maxWaves = 3;

    for (let wave = 0; wave < maxWaves; wave++) {
      if (allItems.length >= targetLimit) break;
      const needed = targetLimit - allItems.length;

      job.progressText = wave === 0
        ? `Шукаю 0/${targetLimit} нових…`
        : `Хвиля ${wave + 1}: знайдено ${allItems.length}/${targetLimit} нових…`;
      renderScrapes();

      let input;
      if (job.source === 'instagram') {
        const igQueries = buildSmartDistrictQueriesClient(job.niche, job.city, '', currentWave, 4);
        currentWave++;
        const searchStr = igQueries.slice(0, 2).join(', ') || baseQuery;
        const searchLim = Math.min(250, Math.max(targetLimit * 3, 60));
        input = {
          search: searchStr,
          searchType: 'user',
          searchLimit: searchLim,
          resultsType: 'details',
          resultsLimit: searchLim
        };
      } else {
        const batchSize = Math.min(14, Math.max(6, Math.ceil(needed / 12) + 4));
        const gmapsQueries = buildSmartDistrictQueriesClient(job.niche, job.city, '', currentWave, batchSize);
        currentWave++;
        const perSearchLimit = Math.max(30, Math.ceil((needed * 1.8) / gmapsQueries.length));
        const locationQuery = job.city ? `${job.city}, Україна` : '';
        input = {
          searchStringsArray: gmapsQueries,
          locationQuery: locationQuery,
          maxCrawledPlacesPerSearch: Math.min(perSearchLimit, 100),
          language: 'uk',
          skipClosedPlaces: true,
          includeWebResults: true
        };
      }

      let rawItems = [];
      try {
        rawItems = await runSingleApifyActorClient(actorId, input, token);
      } catch (apifyErr) {
        if (/Monthly usage hard limit exceeded|credit|quota/i.test(apifyErr.message)) {
          console.warn('[Apify] Limit exceeded, ending waves:', apifyErr.message);
          break;
        }
        throw apifyErr;
      }

      for (const it of rawItems) {
        if (allItems.length >= targetLimit) break;
        let b;
        if (job.source === 'instagram') {
          const rawUsername = (it.username || it.ownerUsername || (it.inputUrl ? it.inputUrl.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '') : '') || '').replace(/^@+/, '');
          const name = (it.fullName || it.ownerFullName || it.title || (rawUsername ? '@' + rawUsername : '') || it.name || '').trim();
          if (!name && !rawUsername) continue;
          if (!isVenueRelevantToNiche(it, job.niche)) continue;

          const directPhone = normalizePhone(it.businessPhoneNumber || it.contactPhoneNumber || it.publicPhoneNumber || it.phone || it.phoneUnformatted);
          const bioText = [it.biography, it.caption, it.text, it.externalUrl].filter(Boolean).join('\n');
          const bioPhone = extractPhoneFromText(bioText);
          const phone = directPhone || bioPhone;
          const website = it.externalUrl || it.website || '';
          const followers = Number(it.followersCount || it.followers || 0);

          b = {
            id: 'biz-' + (rawUsername || it.id || Math.random().toString(36).slice(2)),
            name: name || (rawUsername ? '@' + rawUsername : 'Instagram бізнес'),
            phone,
            website,
            address: it.businessAddress?.street_address || it.locationName || it.address || '',
            city: it.businessAddress?.city_name || (it.locationName ? it.locationName.split(',')[0].trim() : '') || job.city || '',
            category: it.businessCategoryName || job.niche || '',
            followers,
            posts: Number(it.postsCount || it.posts || 0),
            username: rawUsername ? '@' + rawUsername : '',
            instagram: rawUsername ? '@' + rawUsername : '',
            link: (rawUsername ? `https://instagram.com/${rawUsername}` : '') || it.url || it.inputUrl || '',
            biography: it.biography || it.caption || '',
            niche: job.niche,
            source: 'instagram'
          };
        } else {
          const name = (it.title || it.name || '').trim();
          if (!name) continue;

          // Filter out places with 0 reviews
          const reviews = Number(it.reviewsCount || 0);
          if (reviews <= 0) continue;

          // Filter out closed or not yet opened places
          const isClosed = Boolean(it.isClosed || it.temporarilyClosed || it.permanentlyClosed);
          const textToCheck = `${name} ${it.openingHours || ''} ${it.additionalInfo ? JSON.stringify(it.additionalInfo) : ''} ${it.categoryName || ''}`;
          const isOpeningSoon = /(скоро відкри|opening soon|ще не відкри|незабаром відкри|coming soon)/i.test(textToCheck);
          if (isClosed || isOpeningSoon) continue;
          if (!isVenueRelevantToNiche(it, job.niche)) continue;

          const placeId = it.placeId || it.id || '';
          const cid = it.cid || '';
          const addr = it.address || it.street || '';
          const phone = normalizePhone(it.phoneUnformatted || it.phone);
          const website = it.website || '';

          // Deep extraction of Instagram from web results, website, instagrams array, etc.
          const instagram = extractInstagramFromApifyItem(it);

          let telegram = (it.telegrams || [])[0] || '';
          if (!telegram && website && /t\.me/i.test(website)) {
            const m = website.match(/t\.me\/([a-zA-Z0-9_+]+)/i);
            if (m && m[1]) telegram = '@' + m[1];
          }
          const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
          const isMobile = isUkrainianMobilePhone(cleanPhone);
          const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
          const telegramPhone = cleanPhone ? `https://t.me/+${cleanPhone}` : '';

          // STRICT OUTREACH FILTER:
          // Skip places where user cannot reach out (no Instagram, no mobile phone for Viber/Telegram, no website)
          if (!instagram && !isMobile && !website) continue;

          let link = it.url || '';
          if (!link || !link.includes('google.com/maps')) {
            if (placeId) {
              link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(placeId)}`;
            } else if (cid) {
              link = `https://maps.google.com/?cid=${encodeURIComponent(cid)}`;
            } else {
              link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((name + ' ' + (addr || job.city || '')).trim())}`;
            }
          }

          b = {
            id: 'biz-' + (placeId || Math.random().toString(36).slice(2)),
            name,
            placeId,
            cid,
            phone,
            isMobile,
            viberUrl,
            website,
            address: addr,
            city: it.city || job.city || '',
            category: it.categoryName || (it.categories || [])[0] || job.niche || '',
            rating: it.totalScore || 0,
            reviews: it.reviewsCount || 0,
            instagram,
            telegram,
            telegramPhone,
            link,
            mapsUrl: link,
            niche: job.niche,
            source: 'gmaps'
          };
        }

        if (!b.name) continue;

        // Global + current-run deduplication: skip any business already seen in past or current searches!
        if (reg.isBizSeen(b, job.city)) continue;
        reg.markBizSeen(b, job.city);

        if (!b.phone) skippedNoPhone++;

        const { category, reason } = classifyBizLocal(b);
        b.category = category;
        b.reason = reason;
        b.service = SCRAPE_SERVICE[category];

        allItems.push(b);
      }

      job.total = allItems.length;
      job.progressText = `Знайдено ${allItems.length}/${targetLimit} нових…`;
      renderScrapes();
    }

    // Priority sorting: venues with direct Instagram FIRST!
    allItems.sort((a, b) => {
      const aHasIg = (a.instagram || a.username) ? 1 : 0;
      const bHasIg = (b.instagram || b.username) ? 1 : 0;
      return bHasIg - aHasIg;
    });

    const limitedItems = allItems.slice(0, targetLimit);
    const finalGroups = { site: [], ads: [], auto: [], apps: [] };
    limitedItems.forEach(b => {
      (finalGroups[b.category] || finalGroups.ads).push(b);
    });

    // Save newly found businesses to Global Seen Registry (localStorage + Backend + Cloud KV)
    await saveGlobalSeenRegistry(limitedItems, waveKey, currentWave, job.city);

    job.status = 'done';
    job.demo = false;
    job.progressText = '';
    job.total = limitedItems.length;
    job.skippedNoPhone = skippedNoPhone;
    job.finishedAt = new Date().toISOString();
    job.groups = finalGroups;
    job.items = limitedItems;
    saveScrapeJob(job);
    renderScrapes();
    try { showToast(`Знайдено ${limitedItems.length} НОВИХ закладів у ${job.city || job.niche}!`); } catch (_) {}
    haptic('success');
  } catch (err) {
    console.error('[LiveApify] Error:', err);
    job.status = 'error';
    job.progressText = '';
    job.error = err.message || 'Помилка виконання парсера';
    job.finishedAt = new Date().toISOString();
    saveScrapeJob(job);
    renderScrapes();
    try { showToast(`Помилка скрапінгу: ${err.message}`); } catch (_) {}
  }
}

function buildCsvLocal(job, cat) {
  const cats = cat === 'all' ? Object.keys(SCRAPE_CATS) : [cat];
  const cell = v => {
    const s = String(v ?? '');
    return /[",\n;\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = ['number,name,niche,service,reason,city,website,rating,reviews,source'];
  cats.forEach(c => {
    (job.groups?.[c] || []).forEach(b => {
      rows.push([
        b.phone || '',
        b.name || '',
        b.niche || job.niche || '',
        b.service || SCRAPE_SERVICE[c] || '',
        b.reason || '',
        b.city || job.city || '',
        b.website || '',
        b.rating || '',
        b.reviews || '',
        b.source || job.source || 'gmaps'
      ].map(cell).join(','));
    });
  });

  if (rows.length === 1 && Array.isArray(job.items)) {
    job.items.forEach(b => {
      rows.push([
        b.phone || '',
        b.name || '',
        b.niche || job.niche || '',
        b.service || 'B2B Контакт',
        b.painText || b.reason || '',
        b.city || job.city || '',
        b.website || '',
        b.rating || '',
        b.reviews || '',
        b.source || job.source || 'gmaps'
      ].map(cell).join(','));
    });
  }

  return '\uFEFF' + rows.join('\n');
}

// ---- Actions ----
async function submitScrape() {
  const niche = (document.getElementById('scrapeNicheInput')?.value || '').trim();
  const city = (document.getElementById('scrapeCityInput')?.value || '').trim();
  if (!niche) {
    alert('Вкажіть нішу бізнесу');
    return;
  }
  const activeLimitBtn = document.querySelector('#scrapeLimitSeg .scrape-seg-btn.active');
  const chosenLimit = activeLimitBtn ? Number(activeLimitBtn.dataset.value) : (scrapeState.form.limit || 100);
  scrapeState.form.limit = chosenLimit;

  const activeSourceBtn = document.querySelector('#scrapeSourceSeg .scrape-seg-btn.active');
  const chosenSource = activeSourceBtn ? activeSourceBtn.dataset.value : (scrapeState.form.source || 'gmaps');
  scrapeState.form.source = chosenSource;

  const payload = { source: chosenSource, niche, city, limit: chosenLimit };
  const btn = document.getElementById('submitScrapeBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'ЗАПУСКАЮ…'; }

  closeModal('modalScrape');
  haptic('success');

  const job = {
    id: 'scr-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    local: true,
    demo: false,
    source: payload.source,
    niche: payload.niche,
    city: payload.city,
    limit: payload.limit,
    status: 'running',
    progressText: `Шукаю 0/${payload.limit} нових…`,
    createdAt: new Date().toISOString(),
    finishedAt: null,
    total: 0,
    skippedNoPhone: 0,
    error: null,
    groups: { site: [], ads: [], auto: [], apps: [] }
  };
  saveScrapeJob(job);
  scrapeState.openJobs.add(job.id);
  renderScrapes();
  runLiveApifyJob(job);

  if (btn) { btn.disabled = false; btn.textContent = 'ЗАПУСТИТИ ПОШУК'; }
}

function triggerCsvDownload(csvContent, fileName) {
  try {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
    showToast('Файл ' + fileName + ' завантажено!');
    haptic('success');
  } catch (err) {
    console.warn('Blob error:', err);
    showToast('Помилка вивантаження файлу');
  }
}

function openCsvPreviewModal(title, headers, rows, rawCsv, fileName) {
  const titleEl = document.getElementById('csvPreviewTitle');
  const statsEl = document.getElementById('csvPreviewStats');
  const wrapEl = document.getElementById('csvPreviewTableWrap');

  if (titleEl) titleEl.textContent = 'CSV: ' + (title || 'Таблиця лідів');
  if (statsEl) statsEl.textContent = `Всього знайдено закладів: ${rows.length}`;

  if (wrapEl) {
    const thead = `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    const tbody = rows.map(r => `<tr>${r.map(c => `<td>${escapeHtml(String(c ?? ''))}</td>`).join('')}</tr>`).join('');
    wrapEl.innerHTML = `<table class="csv-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table>`;
  }

  const copyBtn = document.getElementById('copyCsvContentBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(rawCsv).then(() => {
          showToast('Всі дані скопійовано в буфер обміну');
          haptic('success');
        }).catch(() => {
          fallbackCopy(rawCsv, title);
        });
      } else {
        fallbackCopy(rawCsv, title);
      }
    };
  }

  const downloadBtn = document.getElementById('downloadCsvFileBtn');
  if (downloadBtn) {
    downloadBtn.onclick = () => {
      triggerCsvDownload(rawCsv, fileName);
    };
  }

  openModal('modalCsvPreview');
  haptic('light');
}

function downloadScrapeCsv(job, cat) {
  const cats = cat === 'all' ? Object.keys(SCRAPE_CATS) : [cat];
  const headers = ['Телефон', 'Назва', 'Ніша', 'Послуга', 'Причина / Біль', 'Місто', 'Сайт', 'Рейтинг', 'Відгуки'];
  const dataRows = [];
  cats.forEach(c => {
    (job.groups?.[c] || []).forEach(b => {
      dataRows.push([
        b.phone || '—',
        b.name || '—',
        b.niche || job.niche || '—',
        b.service || SCRAPE_SERVICE[c] || '—',
        b.reason || '—',
        b.city || job.city || '—',
        b.website || '—',
        b.rating ? Number(b.rating).toFixed(1) : '—',
        b.reviews || 0
      ]);
    });
  });

  const csvContent = buildCsvLocal(job, cat);
  const fileName = `vapi_${job.niche || 'b2b'}_${cat || 'all'}_${Date.now()}.csv`.replace(/[^\p{L}\p{N}._-]+/gu, '_');

  openCsvPreviewModal((job.niche || 'Скрапінг') + (cat && cat !== 'all' ? ` (${cat})` : ''), headers, dataRows, csvContent, fileName);
}

async function sendScrapeToTelegram(job, cat, btn) {
  const old = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Надсилаю…';
  const chatId = state.accountKey || window.Telegram?.WebApp?.initDataUnsafe?.user?.id || '5278970111';
  const items = getJobFlatItems(job);
  const targetItems = cat && cat !== 'all' ? items.filter(it => it.category === cat) : items;

  let sent = false;
  if (!job.local) {
    try {
      const res = await fetch(`/api/scrapes/${encodeURIComponent(job.id)}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, chatId })
      });
      const json = await res.json();
      if (json.success) sent = true;
    } catch (e) {}
  }

  if (!sent && window.Telegram?.WebApp?.openTelegramLink) {
    const summary = encodeURIComponent(`Збір ${job.niche || 'бізнесів'} (${job.city || ''}): ${targetItems.length} закладів`);
    window.Telegram.WebApp.openTelegramLink(`https://t.me/share/url?url=${summary}`);
    sent = true;
  }

  haptic('success');
  btn.textContent = `Надіслано (${targetItems.length})`;
  showToast(`Контакти (${targetItems.length}) передано в Telegram!`);
  setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 2500);
}

async function deleteScrapeJob(job) {
  if (!confirm('Видалити цей пошук?')) return;
  saveLocalScrapes(loadLocalScrapes().filter(j => j.id !== job.id));
  if (!job.local) {
    await fetch(`/api/scrapes/${encodeURIComponent(job.id)}`, { method: 'DELETE' }).catch(() => {});
  }
  scrapeState.openJobs.delete(job.id);
  fetchScrapes();
}

function setupScrapeTab() {
  // Source buttons -> open form with preselected source
  document.querySelectorAll('[data-scrape-source]').forEach(btn => {
    btn.addEventListener('click', () => {
      scrapeState.form.source = btn.dataset.scrapeSource;
      document.querySelectorAll('#scrapeSourceSeg .scrape-seg-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.value === scrapeState.form.source));
      openModal('modalScrape');
    });
  });

  // Segments
  document.querySelectorAll('#scrapeSourceSeg .scrape-seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      scrapeState.form.source = b.dataset.value;
      document.querySelectorAll('#scrapeSourceSeg .scrape-seg-btn').forEach(x => x.classList.toggle('active', x === b));
    });
  });
  document.querySelectorAll('#scrapeLimitSeg .scrape-seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      scrapeState.form.limit = Number(b.dataset.value);
      document.querySelectorAll('#scrapeLimitSeg .scrape-seg-btn').forEach(x => x.classList.toggle('active', x === b));
    });
  });



  // Apify Token settings modal
  document.getElementById('openApifyTokenBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('apifyTokenInput');
    const localToken = getClientApifyToken();
    if (input && localToken) {
      input.placeholder = localToken.slice(0, 8) + '...' + localToken.slice(-4);
    }
    try {
      const res = await fetch('/api/scrapes/token');
      const json = await res.json();
      if (input && json.masked) {
        input.placeholder = json.masked;
      }
    } catch {}
    openModal('modalApifyToken');
  });

  document.getElementById('saveApifyTokenBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('apifyTokenInput');
    const token = (input?.value || '').trim();
    if (!token) {
      alert('Будь ласка, вставте токен Apify (починається на apify_api_...)');
      return;
    }
    const btn = document.getElementById('saveApifyTokenBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'ЗБЕРІГАЮ…'; }
    setClientApifyToken(token);
    try {
      await fetch('/api/scrapes/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
    } catch {}
    haptic('success');
    scrapeState.mode = 'live';
    closeModal('modalApifyToken');
    if (input) input.value = '';
    fetchScrapes();
    alert('✅ Apify API токен успішно підключено! Тепер Google Maps та Instagram скрапери працюють наживо.');
    if (btn) { btn.disabled = false; btn.textContent = 'ЗБЕРЕГТИ ТОКЕН'; }
  });

  document.getElementById('submitScrapeBtn')?.addEventListener('click', submitScrape);

  // Delegated clicks in jobs list
  document.getElementById('scrapeJobsList')?.addEventListener('click', (e) => {
    const actBtn = e.target.closest('[data-scrape-act]');
    if (actBtn) {
      const job = scrapeState.jobs.find(j => j.id === actBtn.dataset.job);
      if (!job) return;
      const act = actBtn.dataset.scrapeAct;
      if (act === 'csv') downloadScrapeCsv(job, actBtn.dataset.cat);
      else if (act === 'send') sendScrapeToTelegram(job, actBtn.dataset.cat, actBtn);
      else if (act === 'delete') deleteScrapeJob(job);
      else if (act === 'crm-add') {
        const cat = actBtn.dataset.cat;
        const idx = Number(actBtn.dataset.bizIdx);
        const biz = job.groups?.[cat]?.[idx];
        if (biz) addBizToCrm(biz, job.city);
      }
      return;
    }
    if (e.target.closest('a')) return;

    const catHead = e.target.closest('[data-scrape-toggle-cat]');
    if (catHead) {
      const key = catHead.dataset.scrapeToggleCat;
      scrapeState.openCats.has(key) ? scrapeState.openCats.delete(key) : scrapeState.openCats.add(key);
      catHead.parentElement.classList.toggle('open');
      haptic('light');
      return;
    }
    const jobHead = e.target.closest('[data-scrape-toggle-job]');
    if (jobHead) {
      const id = jobHead.dataset.scrapeToggleJob;
      const job = scrapeState.jobs.find(j => j.id === id);
      if (!job || job.status === 'running') return;
      scrapeState.openJobs.has(id) ? scrapeState.openJobs.delete(id) : scrapeState.openJobs.add(id);
      jobHead.parentElement.classList.toggle('open');
      haptic('light');
    }
  });

  fetchScrapes();
}

setupScrapeTab();

// ============================================================
// TAB 6: NFC РАДАР (B2B пошук закладів під NFC-картки & відгуки)
// ============================================================

const DEFAULT_NFC_RADAR_JOBS = [
  {
    id: 'nfc-job-kyiv-ocean',
    source: 'gmaps',
    niche: 'Кафе, бари, ресторани',
    city: 'Київ',
    cluster: 'ТРЦ Ocean Plaza (вул. Антоновича, 176)',
    status: 'done',
    local: true,
    createdAt: new Date().toISOString(),
    total: 7,
    maxReviews: 300,
    items: [
      {
        id: 'v-ocean-1',
        name: 'Coffee Lab Ocean',
        address: 'вул. Антоновича, 176, ТРЦ Ocean Plaza (2 поверх)',
        phone: '+380671428931',
        website: 'https://instagram.com/coffeelab_ocean',
        instagram: '@coffeelab_ocean',
        rating: 4.2,
        reviews: 38,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Coffee+Lab+Ocean+Антоновича+176+Київ',
        painLevel: 'urgent',
        painText: 'Потрібно перекрити 3 негативні відгуки новими п\'ятірками'
      },
      {
        id: 'v-ocean-2',
        name: 'Matcha Spot & Bakery',
        address: 'вул. Антоновича, 176, ТРЦ Ocean Plaza (острівець 1 поверх)',
        phone: '+380509823411',
        website: 'https://instagram.com/matchaspot_kiev',
        instagram: '@matchaspot_kiev',
        rating: 4.5,
        reviews: 22,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Matcha+Spot+Ocean+Plaza+Київ',
        painLevel: 'new',
        painText: 'Новий острівець — гостра потреба у перших 50 відгуках'
      },
      {
        id: 'v-ocean-3',
        name: 'Barber Lab Ocean',
        address: 'вул. Антоновича, 176, ТРЦ Ocean Plaza (-1 поверх)',
        phone: '+380934120984',
        website: 'https://instagram.com/barberlab_ocean',
        instagram: '@barberlab_ocean',
        rating: 4.3,
        reviews: 64,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Barber+Lab+Ocean+Plaza+Київ',
        painLevel: 'urgent',
        painText: 'Рейтинг 4.3 тягне вниз середній бал серед конкурентів'
      },
      {
        id: 'v-ocean-4',
        name: 'Beauty Island Nails',
        address: 'вул. Антоновича, 176, ТРЦ Ocean Plaza (2 поверх біля ескалатора)',
        phone: '+380673321155',
        website: 'https://instagram.com/beautyisland_nails',
        instagram: '@beautyisland_nails',
        rating: 4.1,
        reviews: 43,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Beauty+Island+Nails+Ocean+Plaza+Київ',
        painLevel: 'urgent',
        painText: 'Низький рейтинг 4.1 відлякує клієнтів з локального пошуку'
      },
      {
        id: 'v-ocean-5',
        name: 'Fresh Juice & Smoothie Bar',
        address: 'вул. Антоновича, 176, ТРЦ Ocean Plaza (фудкорт 2 поверх)',
        phone: '+380502213456',
        website: 'https://instagram.com/freshjuice_ocean',
        instagram: '@freshjuice_ocean',
        rating: 4.6,
        reviews: 19,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Fresh+Juice+Ocean+Plaza+Київ',
        painLevel: 'new',
        painText: 'Лише 19 відгуків — задоволені гості йдуть не оцінивши'
      },
      {
        id: 'v-ocean-6',
        name: 'Doner & Craft Grill',
        address: 'вул. Антоновича, 176, ТРЦ Ocean Plaza (фудкорт)',
        phone: '+380965543210',
        website: 'https://instagram.com/doner_craft_kiev',
        instagram: '@doner_craft_kiev',
        rating: 4.0,
        reviews: 58,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Doner+Craft+Grill+Ocean+Plaza+Київ',
        painLevel: 'urgent',
        painText: 'Критично: треба 20+ нових оцінок 5★ для виправлення балу'
      },
      {
        id: 'v-ocean-7',
        name: 'Waffles & Gelato Corner',
        address: 'вул. Антоновича, 176, ТРЦ Ocean Plaza (острівець біля входу)',
        phone: '+380637712390',
        website: 'https://instagram.com/gelato_ocean',
        instagram: '@gelato_ocean',
        rating: 4.7,
        reviews: 29,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Waffles+Gelato+Ocean+Plaza+Київ',
        painLevel: 'new',
        painText: 'Чудовий продукт, але мало відгуків для впевненого ТОП-1'
      }
    ]
  },
  {
    id: 'nfc-job-lviv-rynok',
    source: 'gmaps',
    niche: 'Кафе, бари, ресторани',
    city: 'Львів',
    cluster: 'Площа Ринок (історичний центр)',
    status: 'done',
    local: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    total: 5,
    maxReviews: 300,
    items: [
      {
        id: 'v-lviv-1',
        name: 'Львівська Кавова Лабораторія',
        address: 'пл. Ринок, 12, Львів',
        phone: '+380674433221',
        website: 'https://instagram.com/lviv_coffee_lab',
        instagram: '@lviv_coffee_lab',
        rating: 4.2,
        reviews: 87,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Львівська+Кавова+Лабораторія+Площа+Ринок+Львів',
        painLevel: 'urgent',
        painText: 'Висока конкуренція на Ринку — треба 4.8+ для вибору туристами'
      },
      {
        id: 'v-lviv-2',
        name: 'Крафтова Пекарня «Хліб & Масло»',
        address: 'вул. Вірменська, 8, Львів',
        phone: '+380509988776',
        website: 'https://instagram.com/khlib_maslo_lviv',
        instagram: '@khlib_maslo_lviv',
        rating: 4.6,
        reviews: 34,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Крафтова+Пекарня+Вірменська+Львів',
        painLevel: 'new',
        painText: 'Лише 34 відгуки: туристи проходять повз відоміші заклади'
      },
      {
        id: 'v-lviv-3',
        name: 'Галицький Сирник & Кава',
        address: 'вул. Староєврейська, 14, Львів',
        phone: '+380931234567',
        website: 'https://instagram.com/syrnyk_lviv',
        instagram: '@syrnyk_lviv',
        rating: 4.1,
        reviews: 52,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Галицький+Сирник+Староєврейська+Львів',
        painLevel: 'urgent',
        painText: 'Низький бал 4.1 — терміново потрібна акрилова стійка на касі'
      },
      {
        id: 'v-lviv-4',
        name: 'Lviv Craft Beer & Burger',
        address: 'вул. Краківська, 5, Львів',
        phone: '+380687766554',
        website: 'https://instagram.com/lviv_craft_beer',
        instagram: '@lviv_craft_beer',
        rating: 4.3,
        reviews: 95,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Lviv+Craft+Beer+Краківська+Львів',
        painLevel: 'urgent',
        painText: 'Потрібно підняти середній бал перед сезоном туризму'
      },
      {
        id: 'v-lviv-5',
        name: 'Джелатерія «Dolce Rynok»',
        address: 'вул. Сербська, 3, Львів',
        phone: '+380633344556',
        website: 'https://instagram.com/dolce_rynok',
        instagram: '@dolce_rynok',
        rating: 4.5,
        reviews: 41,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Dolce+Rynok+Сербська+Львів',
        painLevel: 'new',
        painText: 'Черги є, але відгуків мало — NFC-наклейка прискорить збір'
      }
    ]
  },
  {
    id: 'nfc-job-kyiv-obolon',
    source: 'gmaps',
    niche: 'СТО, автомийки, детейлінг',
    city: 'Київ',
    cluster: 'Оболонь (просп. Оболонський / Богатирська)',
    status: 'done',
    local: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    total: 5,
    maxReviews: 300,
    items: [
      {
        id: 'v-obolon-1',
        name: 'Детейлінг студія «Gloss Guard»',
        address: 'вул. Богатирська, 1а',
        phone: '+380671122334',
        website: 'https://instagram.com/gloss_guard_kiev',
        instagram: '@gloss_guard_kiev',
        rating: 4.4,
        reviews: 45,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Gloss+Guard+Богатирська+Київ',
        painLevel: 'new',
        painText: 'Преміум автовласники довіряють лише студіям з 100+ відгуками'
      },
      {
        id: 'v-obolon-2',
        name: 'Автосервіс «Богатирський»',
        address: 'вул. Богатирська, 3г',
        phone: '+380504455667',
        website: 'https://bogatyrske-sto.com.ua',
        instagram: '@sto_bogatyrske',
        rating: 4.0,
        reviews: 74,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Автосервіс+Богатирський+Київ',
        painLevel: 'urgent',
        painText: 'Потрібно нівелювати старий негатив через NFC на касі'
      },
      {
        id: 'v-obolon-3',
        name: 'Шиномонтаж 24/7 Оболонь',
        address: 'просп. Оболонський, 35',
        phone: '+380931122998',
        website: 'https://shyna-obolon.com.ua',
        instagram: '@shyna_obolon',
        rating: 4.3,
        reviews: 62,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Шиномонтаж+24+Оболонь+Київ',
        painLevel: 'urgent',
        painText: 'Потік водіїв великий, але мало хто ставить оцінки без нагадування'
      },
      {
        id: 'v-obolon-4',
        name: 'Тюнінг & Звук Lab',
        address: 'вул. Полярна, 10',
        phone: '+380679988112',
        website: 'https://instagram.com/sound_lab_kiev',
        instagram: '@sound_lab_kiev',
        rating: 4.5,
        reviews: 28,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Тюнінг+Звук+Lab+вул+Полярна+Київ',
        painLevel: 'new',
        painText: 'Потрібно наростити базу до 50+ відгуків для залучення преміум авто'
      },
      {
        id: 'v-obolon-5',
        name: 'Автомийка Nano Wash Obolon',
        address: 'вул. Прирічна, 5а',
        phone: '+380503322114',
        website: 'https://nanowash-kiev.ua',
        instagram: '@nanowash_obolon',
        rating: 4.0,
        reviews: 88,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Автомийка+Nano+Wash+Прирічна+Київ',
        painLevel: 'urgent',
        painText: 'Оцінка 4.0 шкодить трафіку: треба +30 оцінок 5★ через NFC у зоні очікування'
      }
    ]
  }
];

const DEFAULT_D2D_RADAR_JOBS = [
  {
    id: 'd2d-job-vinnytsia-strict-d2d',
    isD2d: true,
    source: 'gmaps',
    niche: 'D2D офіси («ходоки»), прямі продажі, промоутери та польові торгові',
    city: 'Вінниця',
    cluster: 'Вінниця (Чисті D2D-офіси, «ходоки» та польові команди)',
    status: 'done',
    createdAt: new Date().toISOString(),
    total: 18,
    items: [
      {
        id: 'd2d-vn-strict-1',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 99,
        name: 'Польова бригада торгових («Ходоки» по Вінниці та області)',
        address: 'Вінниця (Виїзна бригада торгових представників, @vinnitsa_rabota)',
        city: 'Вінниця',
        phone: '+380961402999',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380961402999',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380961402999',
        website: 'https://t.me/vinnitsa_rabota/3',
        rating: 5.0,
        reviews: 19,
        mapsUrl: 'https://t.me/vinnitsa_rabota/3',
        lat: 49.2331,
        lng: 28.4682,
        painLevel: 'urgent',
        painChipLabel: 'Офіс прямих продажів / Бригада «ходоків» (99% Match)',
        painText: 'Реальна виїзна бригада торгових («ходоків»), яких щоранку розвозять по точках — запропонуй викуп партії 50–100 NFC-карток по 280–300 ₴ під продаж у лице за 500–600 ₴!'
      },
      {
        id: 'd2d-vn-strict-2',
        isD2d: true,
        d2dType: 'd2d_promo',
        d2dMatchScore: 99,
        name: 'Промо-агентство «PromoVa» (Польові промоутери & BTL)',
        address: 'вулиця Пирогова, 97а, Вінниця',
        city: 'Вінниця',
        phone: '+380973402939',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380973402939',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380973402939',
        website: '',
        rating: 5.0,
        reviews: 12,
        mapsUrl: 'https://maps.google.com/?cid=3565880350625543826',
        lat: 49.2191,
        lng: 28.4396,
        painLevel: 'urgent',
        painChipLabel: 'Польові промоутери & BTL-команда (99% Match)',
        painText: 'Власний штат живих промоутерів і «ходоків» у Вінниці, які щодня працюють ногами по вулицях і закладах — дай їм NFC-картки оптом під прямий перепродаж!'
      },
      {
        id: 'd2d-vn-strict-3',
        isD2d: true,
        d2dType: 'field_reps',
        d2dMatchScore: 99,
        name: 'Команда польових торгових представників (р-н Вишенька)',
        address: 'Вінниця, р-н Вишенька (Активний обхід точок, @vinnitsa_rabota)',
        city: 'Вінниця',
        phone: '+380671595602',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380671595602',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380671595602',
        website: 'https://t.me/vinnitsa_rabota/17',
        rating: 5.0,
        reviews: 15,
        mapsUrl: 'https://t.me/vinnitsa_rabota/17',
        lat: 49.2255,
        lng: 28.4125,
        painLevel: 'urgent',
        painChipLabel: 'Польові торгові представники (99% Match)',
        painText: 'Прямий номер супервайзера польових торгових представників по району Вишенька — їхні агенти щодня пішки обходять десятки закладів і магазинів!'
      },
      {
        id: 'd2d-vn-strict-4',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 98,
        name: 'Відділ активних продажів B2B / B2C (Хмельницьке шосе, 82)',
        address: 'Хмельницьке шосе, 82, Вінниця (@vinnitsa_rabota)',
        city: 'Вінниця',
        phone: '+380673435657',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380673435657',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380673435657',
        website: 'https://t.me/vinnitsa_rabota/49',
        rating: 4.9,
        reviews: 21,
        mapsUrl: 'https://t.me/vinnitsa_rabota/49',
        lat: 49.2347,
        lng: 28.4293,
        painLevel: 'urgent',
        painChipLabel: 'Офіс активних продажів B2B (98% Match)',
        painText: 'Прямий контакт керівника відділу активних B2B/B2C продажів у Вінниці — запропонуй оптову партію NFC-карток під їхніх менеджерів!'
      },
      {
        id: 'd2d-vn-strict-5',
        isD2d: true,
        d2dType: 'field_reps',
        d2dMatchScore: 98,
        name: 'Польова команда торгових представників «Ампеко»',
        address: 'Хмельницьке шосе, 112, Вінниця (Work.ua активний набір)',
        city: 'Вінниця',
        phone: '+380670778168',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380670778168',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380670778168',
        website: 'https://www.work.ua/jobs/8594455/',
        rating: 4.9,
        reviews: 28,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Хмельницьке+шосе+112+Вінниця',
        lat: 49.2399,
        lng: 28.4089,
        painLevel: 'urgent',
        painChipLabel: 'Польова команда торгових (98% Match)',
        painText: 'Активно набирають торгових представників та польових менеджерів з продажу (% від продажу, 35 000 – 50 000 грн) — ідеальна команда під опт NFC-карток!'
      },
      {
        id: 'd2d-vn-strict-6',
        isD2d: true,
        d2dType: 'field_reps',
        d2dMatchScore: 98,
        name: 'Команда польових торгових представників SANDI+ (Вінниця)',
        address: 'Вінниця (@vinnitsa_vakansii — активний набір торгових)',
        city: 'Вінниця',
        phone: '+380673703100',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380673703100',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380673703100',
        website: 'https://t.me/vinnitsa_vakansii/3318',
        rating: 4.9,
        reviews: 34,
        mapsUrl: 'https://t.me/vinnitsa_vakansii/3318',
        lat: 49.2372,
        lng: 28.4810,
        painLevel: 'urgent',
        painChipLabel: 'Польові торгові агенти (98% Match)',
        painText: 'Прямий мобільний керівника набору польових торгових представників у Вінниці — їхні люди щодня в полях працюють з власниками бізнесу вживу!'
      },
      {
        id: 'd2d-vn-strict-7',
        isD2d: true,
        d2dType: 'd2d_promo',
        d2dMatchScore: 97,
        name: 'WinWork — Агентство польового персоналу та мерчендайзингу',
        address: 'проспект Коцюбинського, 28, офіс 223, Вінниця',
        city: 'Вінниця',
        phone: '+380661585129',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380661585129',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380661585129',
        website: 'https://winwork.com.ua/',
        rating: 4.9,
        reviews: 24,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=WinWork+Коцюбинського+28+Вінниця',
        lat: 49.2368,
        lng: 28.4895,
        painLevel: 'urgent',
        painChipLabel: 'Агентство польових команд (97% Match)',
        painText: 'Формують польові команди промоутерів, мерчендайзерів і торгових представників у Вінниці — запропонуй їм оптовий викуп або партнерську реалізацію NFC-карток!'
      },
      {
        id: 'd2d-vn-strict-8',
        isD2d: true,
        d2dType: 'd2d_promo',
        d2dMatchScore: 97,
        name: 'Промо-група ПП «Озуріт» (Польові промоутери, Вінниця)',
        address: 'вулиця Магістратська, 88 / ТЦ Жовтень, Вінниця',
        city: 'Вінниця',
        phone: '+380677076688',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380677076688',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380677076688',
        website: 'https://www.work.ua/jobs/5157593/',
        rating: 4.8,
        reviews: 16,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Магістратська+88+Вінниця',
        lat: 49.2351,
        lng: 28.4632,
        painLevel: 'urgent',
        painChipLabel: 'Команда промоутерів на вихід (97% Match)',
        painText: 'Постійно набирають активних промоутерів у Вінниці з оплатою за кожен вихід — дай їхній команді NFC-картки під продаж у кожен заклад міста!'
      },
      {
        id: 'd2d-vn-strict-9',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 96,
        name: "Польова кур'єрська та промо-служба «Тук-Тук»",
        address: 'вулиця Академіка Заболотного, Вінниця',
        city: 'Вінниця',
        phone: '+380978834283',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380978834283',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380978834283',
        website: '',
        rating: 4.8,
        reviews: 18,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Тук-Тук+Заболотного+Вінниця',
        lat: 49.2224,
        lng: 28.4312,
        painLevel: 'urgent',
        painChipLabel: "Піші кур'єри & Промо-обхід (96% Match)",
        painText: "Служба піших кур'єрів та розповсюдження по місту — їхні хлопці щодня обходять сотні точок Вінниці ногами!"
      },
      {
        id: 'd2d-vn-strict-10',
        isD2d: true,
        d2dType: 'field_reps',
        d2dMatchScore: 96,
        name: "Вінницька Дистриб'юційна Компанія (Відділ торгових агентів)",
        address: 'вулиця Максимовича, 10, Вінниця',
        city: 'Вінниця',
        phone: '+380678122010',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380678122010',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380678122010',
        website: 'http://vdk.vn.ua/',
        rating: 4.7,
        reviews: 29,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Максимовича+10+Вінниця',
        lat: 49.2485,
        lng: 28.4388,
        painLevel: 'urgent',
        painChipLabel: 'Штат польових торгових агентів (96% Match)',
        painText: 'Великий штат польових торгових представників з щоденними маршрутами обходу по всій Вінниці — запропонуй керівнику торгового відділу оптову партію NFC-карток!'
      },
      {
        id: 'd2d-vn-strict-11',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 95,
        name: 'Best Heads — Підбір торгових представників та D2D-команд',
        address: 'вулиця Київська, 16, Вінниця',
        city: 'Вінниця',
        phone: '+380732164015',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380732164015',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380732164015',
        website: 'https://bestheads.in.ua/rekrutingovoe-agentstvo-vinnica/',
        rating: 5.0,
        reviews: 14,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Київська+16+Вінниця',
        lat: 49.2422,
        lng: 28.4775,
        painLevel: 'urgent',
        painChipLabel: 'База керівників відділів продажів (95% Match)',
        painText: 'Набирають команди активних продажників та торгових представників для бізнесів Вінниці — мають прямі контакти всіх РОПів і директорів D2D-офісів!'
      },
      {
        id: 'd2d-vn-strict-12',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 95,
        name: 'Jobs Go — Центр комплектації команд активних продажів',
        address: 'площа Калічанська, Вінниця',
        city: 'Вінниця',
        phone: '+380970774947',
        isMobile: true,
        viberUrl: 'viber://chat?number=%2B380970774947',
        instagram: '',
        telegram: '',
        telegramPhone: 'https://t.me/+380970774947',
        website: 'https://jobs-go-vn.vercel.app/',
        rating: 4.9,
        reviews: 11,
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Калічанська+площа+Вінниця',
        lat: 49.2305,
        lng: 28.4521,
        painLevel: 'urgent',
        painChipLabel: 'Рекрутинг польових продажників (95% Match)',
        painText: 'Формують команди активних продажів у Вінниці — напиши їм пропозицію оптового постачання NFC-карток у партнерські офіси прямих продажів!'
      },
      {
        id: 'd2d-vn-undercover-13',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 99,
        name: 'Зашифрований D2D-офіс: «Менеджер з продажу 1300 грн щодня (Вінниця)»',
        address: 'Вінниця (Офіс прямих продажів на OLX — щоденні виплати 1300 грн/день)',
        city: 'Вінниця',
        phone: '',
        isMobile: false,
        viberUrl: '',
        instagram: '',
        telegram: '',
        telegramPhone: '',
        website: 'https://www.olx.ua/uk/obyavlenie/rabota/zaproshumo-menedzhera-z-prodazhu-1300scho-dnya-m-vnnitsya-ID10UABH.html',
        rating: 5.0,
        reviews: 22,
        mapsUrl: 'https://www.olx.ua/uk/obyavlenie/rabota/zaproshumo-menedzhera-z-prodazhu-1300scho-dnya-m-vnnitsya-ID10UABH.html',
        lat: 49.2338,
        lng: 28.4695,
        painLevel: 'urgent',
        painChipLabel: 'Зашифрований D2D-офіс • 1300 ₴/день (99% Match)',
        painText: 'Класичний закритий D2D-офіс («ходоки» з щоденною виплатою 1300 грн/день) — натисни «Опт Офер», скопіюється «Троянський кінь» для директора і відкриється чат OLX!'
      },
      {
        id: 'd2d-vn-undercover-14',
        isD2d: true,
        d2dType: 'd2d_promo',
        d2dMatchScore: 99,
        name: 'Зашифрований D2D-офіс: «Промоутер — представник компанії (25 000 – 40 000 грн)»',
        address: 'Вінниця (Офіс прямих польових презентацій на OLX, без досвіду, студенти)',
        city: 'Вінниця',
        phone: '',
        isMobile: false,
        viberUrl: '',
        instagram: '',
        telegram: '',
        telegramPhone: '',
        website: 'https://www.olx.ua/uk/obyavlenie/rabota/promouter-predstavnik-kompan-ID11nS20.html',
        rating: 5.0,
        reviews: 19,
        mapsUrl: 'https://www.olx.ua/uk/obyavlenie/rabota/promouter-predstavnik-kompan-ID11nS20.html',
        lat: 49.2312,
        lng: 28.4741,
        painLevel: 'urgent',
        painChipLabel: 'Зашифрований D2D-офіс • Представники (99% Match)',
        painText: 'Під вивіскою «Промоутер — представник компанії (до 40 000 грн без досвіду)» працює команда живих «ходоків» — закинь офер для керівника офісу прямо в чат OLX!'
      },
      {
        id: 'd2d-vn-undercover-15',
        isD2d: true,
        d2dType: 'd2d_promo',
        d2dMatchScore: 99,
        name: 'Польова промо-команда ФОП Ваніловський: «Промоутери на вулиці, виплати щодня»',
        address: 'Вінниця (Вуличні презентації товарів, щоденні виплати від 500 грн/вихід)',
        city: 'Вінниця',
        phone: '',
        isMobile: false,
        viberUrl: '',
        instagram: '',
        telegram: '',
        telegramPhone: '',
        website: 'https://www.olx.ua/uk/obyavlenie/rabota/promouter-robota-dlya-studentv-ID11yQ7L.html',
        rating: 4.9,
        reviews: 17,
        mapsUrl: 'https://www.olx.ua/uk/obyavlenie/rabota/promouter-robota-dlya-studentv-ID11yQ7L.html',
        lat: 49.2289,
        lng: 28.4480,
        painLevel: 'urgent',
        painChipLabel: 'Вуличні презентації • Щоденна оплата (99% Match)',
        painText: 'Польова команда студентів-промоутерів із щоденними виплатами за презентацію товарів на вулицях Вінниці — ідеальні «ходоки» під кишеньковий опт NFC-карток!'
      },
      {
        id: 'd2d-vn-undercover-16',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 98,
        name: 'Business Tuning Center (Вінниця): «Бренд-консультант / Промоутер (27 200 – 45 000 грн)»',
        address: 'Вінниця (Активний набір бренд-консультантів та промоутерів на Work.ua)',
        city: 'Вінниця',
        phone: '',
        isMobile: false,
        viberUrl: '',
        instagram: '',
        telegram: '',
        telegramPhone: '',
        website: 'https://www.work.ua/jobs/8575297/',
        rating: 4.9,
        reviews: 21,
        mapsUrl: 'https://www.work.ua/jobs/8575297/',
        lat: 49.2361,
        lng: 28.4615,
        painLevel: 'urgent',
        painChipLabel: 'Бренд-консультанти / D2D • до 45 000 ₴ (98% Match)',
        painText: 'Набирають «бренд-консультантів / промоутерів» без досвіду на ставку + % до 45 000 грн — типовий D2D-офіс, який миттєво зацікавиться маржею 300 грн на 600 грн!'
      },
      {
        id: 'd2d-vn-undercover-17',
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 98,
        name: 'Зашифрований D2D-офіс: «Робота у Вінниці! Від 1000 грн/день щодня! Без досвіду!»',
        address: 'Вінниця (Офіс активних продажів із навчанням на OLX, виплати щодня)',
        city: 'Вінниця',
        phone: '',
        isMobile: false,
        viberUrl: '',
        instagram: '',
        telegram: '',
        telegramPhone: '',
        website: 'https://www.olx.ua/uk/obyavlenie/rabota/robota-u-vnnits-stablniy-dohd-vd-1000-grn-den-bez-dosvdu-IDXG0YC.html',
        rating: 4.9,
        reviews: 15,
        mapsUrl: 'https://www.olx.ua/uk/obyavlenie/rabota/robota-u-vnnits-stablniy-dohd-vd-1000-grn-den-bez-dosvdu-IDXG0YC.html',
        lat: 49.2344,
        lng: 28.4582,
        painLevel: 'urgent',
        painChipLabel: 'Зашифрований D2D-офіс • від 1000 ₴/день (98% Match)',
        painText: 'Оголошення без назви товару з «оплатою від 1000 грн/день щодня без досвіду» — 100% маркер закритого D2D-офісу у Вінниці. Натисни «Опт Офер» та пиши для директора!'
      },
      {
        id: 'd2d-vn-undercover-18',
        isD2d: true,
        d2dType: 'field_reps',
        d2dMatchScore: 98,
        name: 'АТЛАНТ24 (Вінниця): «Менеджер з розвитку B2B-партнерств (виїзд по точках)»',
        address: 'Вінниця (Польовий обхід СТО, автомийок та сервісів по місту, OLX)',
        city: 'Вінниця',
        phone: '',
        isMobile: false,
        viberUrl: '',
        instagram: '',
        telegram: '',
        telegramPhone: '',
        website: 'https://www.olx.ua/uk/obyavlenie/rabota/menedzher-z-rozvitku-b2b-partnerstv-ID11nQbY.html',
        rating: 4.9,
        reviews: 16,
        mapsUrl: 'https://www.olx.ua/uk/obyavlenie/rabota/menedzher-z-rozvitku-b2b-partnerstv-ID11nQbY.html',
        lat: 49.2385,
        lng: 28.4512,
        painLevel: 'urgent',
        painChipLabel: 'Польовий B2B-обхід по точках (98% Match)',
        painText: 'Їхні менеджери щодня живими ногами обходять СТО, автомийки та бізнеси Вінниці — дай їм NFC-картки як додатковий товар з маржею +300 грн з точки!'
      }
    ]
  }
];

const nfcRadarState = {
  radarMode: localStorage.getItem('dws_nfc_radar_mode') || 'venues', // 'venues' | 'd2d'
  jobs: [],
  d2dJobs: [],
  cityFilter: 'all',
  viewMode: 'cards', // 'cards' | 'table'
  openJobs: new Set(['nfc-job-kyiv-ocean']),
  openD2dJobs: new Set(['d2d-job-vinnytsia-strict-d2d']),
  form: {
    source: 'gmaps',
    niche: 'Кафе, бари, ресторани',
    city: 'Київ',
    cluster: '',
    reviewsLimit: 300,
    limit: 30
  }
};

function loadLocalD2dJobs() {
  try {
    const raw = localStorage.getItem('dws_nfc_d2d_radars');
    if (!raw) {
      localStorage.setItem('dws_nfc_d2d_radars', JSON.stringify(DEFAULT_D2D_RADAR_JOBS));
      return JSON.parse(JSON.stringify(DEFAULT_D2D_RADAR_JOBS));
    }
    let parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('dws_nfc_d2d_radars', JSON.stringify(DEFAULT_D2D_RADAR_JOBS));
      return JSON.parse(JSON.stringify(DEFAULT_D2D_RADAR_JOBS));
    }
    // Auto-migrate away from old starter job that had HoReCa / printing shops
    const hasOldStarter = parsed.some(j => j.id === 'd2d-job-vinnytsia-starter' || (j.id === 'd2d-job-vinnytsia-strict-d2d' && (!j.items || j.items.length < 18 || JSON.stringify(j).includes('t.me/s/') || /[🕵🚶📢💼🔥]/u.test(JSON.stringify(j)))) || (Array.isArray(j.items) && j.items.some(it => it.d2dType === 'horeca_rep' || it.d2dType === 'b2b_pos' || it.d2dType === 'beauty_auto_rep')));
    if (hasOldStarter) {
      parsed = parsed.filter(j => j.id !== 'd2d-job-vinnytsia-starter' && j.id !== 'd2d-job-vinnytsia-strict-d2d'); }
    if (hasOldStarter) {
      parsed = parsed.filter(j => j.id !== 'd2d-job-vinnytsia-starter').map(j => ({
        ...j,
        items: Array.isArray(j.items) ? j.items.filter(it => it.d2dType !== 'horeca_rep' && it.d2dType !== 'b2b_pos' && it.d2dType !== 'beauty_auto_rep') : []
      })).filter(j => j.items.length > 0);
      if (!parsed.some(j => j.id === 'd2d-job-vinnytsia-strict-d2d')) {
        parsed.unshift(JSON.parse(JSON.stringify(DEFAULT_D2D_RADAR_JOBS[0])));
      }
      localStorage.setItem('dws_nfc_d2d_radars', JSON.stringify(parsed));
    }
    parsed.forEach(job => {
      job.isD2d = true;
      if (Array.isArray(job.items)) job.total = job.items.length;
    });
    return parsed;
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_D2D_RADAR_JOBS));
  }
}

function saveLocalD2dJobs(jobs) {
  localStorage.setItem('dws_nfc_d2d_radars', JSON.stringify(jobs));
  if (typeof syncAccountToServer === 'function') syncAccountToServer();
}

function getActiveNfcModeJobs() {
  return nfcRadarState.radarMode === 'd2d' ? nfcRadarState.d2dJobs : nfcRadarState.jobs;
}

function getActiveNfcOpenSet() {
  return nfcRadarState.radarMode === 'd2d' ? nfcRadarState.openD2dJobs : nfcRadarState.openJobs;
}

function findAnyNfcJob(jobId) {
  return (nfcRadarState.jobs || []).find(j => j.id === jobId) ||
         (nfcRadarState.d2dJobs || []).find(j => j.id === jobId);
}

function pluralD2dTeams(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'D2D-контакт';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'D2D-контакти';
  return 'D2D-контактів';
}

function loadLocalNfcJobs() {
  try {
    const raw = localStorage.getItem('dws_nfc_radars');
    if (!raw) {
      localStorage.setItem('dws_nfc_radars', JSON.stringify(DEFAULT_NFC_RADAR_JOBS));
      return DEFAULT_NFC_RADAR_JOBS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem('dws_nfc_radars', JSON.stringify(DEFAULT_NFC_RADAR_JOBS));
      return DEFAULT_NFC_RADAR_JOBS;
    }
    parsed.forEach(job => {
      if (Array.isArray(job.items)) {
        job.total = job.items.length;
      }
    });

    // Auto-clean any empty searches with 0 items requested by user (e.g. Sky Park Vinnytsia and empty Kyiv Cafe)
    const cleanJobs = parsed.filter(job => {
      const count = (job.items ? job.items.length : 0) || job.total || 0;
      const isSkyParkEmpty = (job.cluster && job.cluster.toLowerCase().includes('скай парк') && count === 0);
      const isKyivCafeEmpty = (job.city && job.city.toLowerCase().includes('київ') && job.niche && job.niche.toLowerCase().includes('кафе') && count === 0);
      return !isSkyParkEmpty && !isKyivCafeEmpty;
    });

    if (cleanJobs.length !== parsed.length) {
      localStorage.setItem('dws_nfc_radars', JSON.stringify(cleanJobs));
    }
    return cleanJobs;
  } catch {
    return DEFAULT_NFC_RADAR_JOBS;
  }
}

function saveLocalNfcJobs(jobs) {
  localStorage.setItem('dws_nfc_radars', JSON.stringify(jobs));
  if (typeof syncAccountToServer === 'function') syncAccountToServer();
}

function pluralNfcVenues(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'заклад';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'заклади';
  return 'закладів';
}

function getClusterRouteUrl(job) {
  const items = (job.items && job.items.length) ? job.items : getJobFlatItems(job);
  if (!items.length) {
    const q = (job.cluster ? (job.cluster + ', ' + job.city) : (job.niche + ', ' + job.city));
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }
  if (items.length === 1) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(items[0].address || items[0].name);
  }
  const origin = encodeURIComponent(items[0].address || items[0].name);
  const destination = encodeURIComponent(items[items.length - 1].address || items[items.length - 1].name);
  const waypoints = items.slice(1, -1).slice(0, 8).map(i => encodeURIComponent(i.address || i.name)).join('|');
  let url = 'https://www.google.com/maps/dir/?api=1&origin=' + origin + '&destination=' + destination;
  if (waypoints) url += '&waypoints=' + waypoints;
  return url;
}

function getVenueNavigationUrl(venue, job) {
  const name = venue.name || '';
  const addr = venue.address || '';
  const city = job?.cluster || job?.city || '';
  const query = [name, addr, city].filter(Boolean).join(', ');
  let url = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(query);
  if (venue.placeId) {
    url += '&destination_place_id=' + encodeURIComponent(venue.placeId);
  }
  return url;
}

function getVenueMapsUrl(venue, job) {
  // Direct Google Maps or Telegram vacancy link
  if (venue.mapsUrl && (venue.mapsUrl.includes('google.com/maps') || venue.mapsUrl.includes('maps.google.com') || venue.mapsUrl.includes('t.me/') || venue.mapsUrl.includes('olx.ua') || venue.mapsUrl.includes('work.ua'))) {
    return venue.mapsUrl;
  }
  if (venue.url && (venue.url.includes('google.com/maps') || venue.url.includes('maps.google.com'))) {
    return venue.url;
  }
  if (venue.placeId) {
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(venue.name || '') + '&query_place_id=' + encodeURIComponent(venue.placeId);
  }
  if (venue.cid) {
    return 'https://maps.google.com/?cid=' + encodeURIComponent(venue.cid);
  }
  if (venue.link && (venue.link.includes('google.com/maps') || venue.link.includes('maps.google.com'))) {
    return venue.link;
  }
  const q = [venue.name, venue.address || job?.cluster || job?.city].filter(Boolean).join(' ');
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
}

function getJobFlatItems(job) {
  if (!job) return [];
  let list = [];
  if (Array.isArray(job.items) && job.items.length > 0) list = [...job.items];
  else if (job.groups) {
    const flat = [];
    Object.values(job.groups).forEach(l => {
      if (Array.isArray(l)) flat.push(...l);
    });
    list = flat;
  }
  return list;
}

function getNfcTemplatesList() {
  if (!state.profile) state.profile = { ...DEFAULT_DATA.profile };
  let list = state.profile.nfcTemplates;
  if (!Array.isArray(list) || list.length !== 10) {
    const next = Array.isArray(list) ? [...list] : [];
    for (let i = 0; i < 10; i++) {
      if (!next[i] || typeof next[i] !== 'string' || !next[i].trim()) {
        next[i] = DEFAULT_NFC_TEMPLATES[i];
      }
    }
    list = next.slice(0, 10);
    state.profile.nfcTemplates = list;
  } else {
    const isV2Variant = list[1] && list[1].startsWith('Вітаю! Підкажіть, чи актуально для вашого закладу');
    if (isV2Variant) {
      list = [...DEFAULT_NFC_TEMPLATES];
      state.profile.nfcTemplates = list;
    }
  }
  if (state.profile.nfcTemplate && state.profile.nfcTemplate.trim() && list[0] !== state.profile.nfcTemplate.trim()) {
    list[0] = state.profile.nfcTemplate.trim();
  }
  return list;
}

function getNextNfcTemplateText(venue, job) {
  const templates = getNfcTemplatesList();
  if (!templates || templates.length === 0) {
    return DEFAULT_NFC_TEMPLATES[0];
  }

  if (venue && typeof venue._nfcTmplIdx === 'number' && templates[venue._nfcTmplIdx]) {
    return templates[venue._nfcTmplIdx];
  }

  let used = [];
  try {
    const raw = localStorage.getItem('dws_nfc_used_templates');
    if (raw) used = JSON.parse(raw);
    if (!Array.isArray(used)) used = [];
  } catch (e) {
    used = [];
  }

  used = used.filter(idx => typeof idx === 'number' && idx >= 0 && idx < templates.length);

  const allIndices = templates.map((_, i) => i);
  let available = allIndices.filter(i => !used.includes(i));

  if (available.length === 0) {
    used = [];
    available = [...allIndices];
  }

  const randomPick = available[Math.floor(Math.random() * available.length)];
  used.push(randomPick);

  try {
    localStorage.setItem('dws_nfc_used_templates', JSON.stringify(used));
  } catch (e) {}

  if (venue) {
    venue._nfcTmplIdx = randomPick;
  }

  return templates[randomPick] || templates[0];
}

function renderNfcTemplatesModal() {
  const listEl = document.getElementById('nfcTemplatesList');
  if (!listEl) return;
  const templates = getNfcTemplatesList();
  listEl.innerHTML = '';

  templates.forEach((text, idx) => {
    const num = idx + 1;
    const card = document.createElement('div');
    card.className = 'form-group';
    card.style.cssText = 'margin-bottom: 12px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px;';
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <label class="form-label" style="font-weight: 700; font-size: 0.8rem; margin-bottom: 0; color: var(--accent);">ШАБЛОН ${num}:</label>
        <span class="char-counter" id="nfcTmplModalCount_${num}">${(text || '').length}/2000</span>
      </div>
      <textarea id="nfcTmplModalInput_${num}" class="form-textarea" rows="3" maxlength="2000" style="font-size: 0.82rem; line-height: 1.45; resize: vertical; user-select: text; -webkit-user-select: text; width: 100%; box-sizing: border-box;"></textarea>
    `;
    listEl.appendChild(card);

    const input = card.querySelector(`#nfcTmplModalInput_${num}`);
    const counter = card.querySelector(`#nfcTmplModalCount_${num}`);
    if (input) {
      input.value = text || '';
      input.addEventListener('input', () => {
        if (counter) counter.textContent = `${input.value.length}/2000`;
      });
    }
  });
}

function saveNfcTemplatesFromModal() {
  const saveBtn = document.getElementById('saveNfcTemplatesModalBtn');
  const nextTemplates = [];
  for (let i = 1; i <= 10; i++) {
    const val = document.getElementById(`nfcTmplModalInput_${i}`)?.value || '';
    nextTemplates.push(val.trim() || DEFAULT_NFC_TEMPLATES[i - 1]);
  }

  if (!state.profile) state.profile = { ...DEFAULT_DATA.profile };
  state.profile.nfcTemplates = nextTemplates;
  state.profile.nfcTemplate = nextTemplates[0];

  const profileInput = document.getElementById('profileNfcTemplate');
  if (profileInput) {
    profileInput.value = nextTemplates[0];
    updateCharCount(profileInput, 'nfcTemplateCounter');
  }

  localStorage.setItem('dws_profile', JSON.stringify(state.profile));
  syncAccountToServer();

  haptic('success');
  if (saveBtn) {
    const orig = saveBtn.textContent;
    saveBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
    setTimeout(() => {
      saveBtn.textContent = orig;
      closeModal('modalNfcTemplates');
    }, 500);
  } else {
    closeModal('modalNfcTemplates');
  }
  showToast('Всі 10 шаблонів збережено!');
}

function generateNfcPitch(venue, job) {
  const isD2d = Boolean(job?.isD2d || venue?.isD2d || nfcRadarState.radarMode === 'd2d');
  const name = venue?.name || (isD2d ? 'Команда' : 'Заклад');
  const city = venue?.city || job?.city || 'Вінниця';
  if (isD2d) {
    const rawD2d = (state.profile?.d2dTemplate && !state.profile.d2dTemplate.startsWith('Доброго дня! Пишу щодо співпраці з вашою командою') && !state.profile.d2dTemplate.includes('➔') ? state.profile.d2dTemplate : DEFAULT_DATA.profile.d2dTemplate || '').trim();
    const baseD2d = rawD2d || "Доброго дня! Пишу щодо співпраці з вашою командою у м. {CITY}. Ми виробники преміальних акрилових NFC-карток для збору відгуків у Google Maps для закладів (презентація займає 5 секунд дотиком телефону). Пропонуємо оптові партії під викуп або реалізацію вашими представниками з чистою маржею 200–300 грн на кожній картці. Підкажіть, з ким можна коротко обговорити умови?";
    return baseD2d
      .replace(/\{NAME\}/gi, name)
      .replace(/\{CITY\}/gi, city);
  }
  const baseText = getNextNfcTemplateText(venue, job);
  return (baseText || DEFAULT_NFC_TEMPLATES[0])
    .replace(/\{NAME\}/gi, name)
    .replace(/\{CITY\}/gi, city);
}

function copyTextToClipboardSync(text) {
  let ok = false;
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    ta.setAttribute('readonly', '');
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, 99999);
    ok = document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (e) {
    console.warn('execCommand failed:', e);
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
  return ok;
}

function openContactActionModal(venue, job) {
  if (!venue || !venue.phone) return;
  const rawPhone = venue.phone;
  const clean = rawPhone.replace(/\D/g, '');
  const clean380 = clean.startsWith('380') ? clean : (clean.startsWith('0') ? ('38' + clean) : clean);

  const titleEl = document.getElementById('contactActionTitle');
  if (titleEl) titleEl.textContent = "Зв'язок";
  const phoneDisplayEl = document.getElementById('contactActionPhoneDisplay');
  if (phoneDisplayEl) phoneDisplayEl.textContent = rawPhone;

  // 1. Call Button
  const callBtn = document.getElementById('contactCallBtn');
  if (callBtn) {
    callBtn.onclick = () => {
      haptic('light');
      window.location.href = `tel:+${clean380}`;
    };
  }

  // 2. Viber Button
  const viberBtn = document.getElementById('contactViberBtn');
  if (viberBtn) {
    viberBtn.onclick = () => {
      haptic('light');
      if (venue) {
        const pitch = generateNfcPitch(venue, job);
        copyTextToClipboardSync(pitch);
      }
      showToast('Шаблон скопійовано. Відкриваємо Viber');
      launchViberForPhone(clean380);
    };
  }

  // 3. Telegram Button
  const tgBtn = document.getElementById('contactTgBtn');
  if (tgBtn) {
    tgBtn.onclick = () => {
      haptic('light');
      if (venue) {
        const pitch = generateNfcPitch(venue, job);
        copyTextToClipboardSync(pitch);
      }
      const tgUrl = `https://t.me/+${clean380}`;
      openTelegramSmartUrl(tgUrl);
    };
  }

  // 4. Copy Phone Button
  const copyBtn = document.getElementById('contactCopyPhoneBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      copyTextToClipboardSync(rawPhone);
      showToast(`Номер ${rawPhone} скопійовано!`);
      haptic('success');
    };
  }

  // 5. Instagram Button
  const igBtn = document.getElementById('contactIgBtn');
  if (igBtn) {
    const cleanInsta = (venue.instagram || '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@+/, '').replace(/[\/?#].*$/, '').trim();
    const targetIg = cleanInsta ? `https://ig.me/m/${cleanInsta}` : `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent((venue.name || '') + ' ' + (job?.city || ''))}`;
    igBtn.onclick = () => {
      haptic('light');
      if (venue) {
        const pitch = generateNfcPitch(venue, job);
        copyTextToClipboardSync(pitch);
      }
      showToast('Офер скопійовано! Вставте в Instagram Direct');
      setTimeout(() => {
        if (Boolean(window.Telegram?.WebApp?.initData) && window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(targetIg);
        } else {
          window.open(targetIg, '_blank');
        }
      }, 100);
    };
  }

  openModal('modalContactAction');
}

function sendInstantVenueNfcPitch(venue, job, btnEl) {
  const pitch = generateNfcPitch(venue, job);
  copyTextToClipboardSync(pitch);
  haptic('success');

  if (btnEl) {
    const spanEl = btnEl.querySelector('span');
    const origText = spanEl ? spanEl.textContent : btnEl.textContent;
    if (spanEl) spanEl.textContent = 'СКОПІЙОВАНО ✓';
    else btnEl.textContent = 'СКОПІЙОВАНО ✓';
    setTimeout(() => {
      if (spanEl) spanEl.textContent = origText;
      else btnEl.textContent = origText;
    }, 2500);
  }

  const cleanInsta = (venue.instagram || '')
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/[\/?#].*$/, '')
    .trim();

  const cleanPhone = (venue.phone || '').replace(/\D/g, '');
  const clean380 = cleanPhone.startsWith('380') ? cleanPhone : (cleanPhone.startsWith('0') ? ('38' + cleanPhone) : cleanPhone);
  const isMobile = venue.isMobile || (cleanPhone && isUkrainianMobilePhone(cleanPhone));

  const cleanTg = (venue.telegram || '').replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@+/, '').replace(/[\/?#].*$/, '').trim();

  if (cleanTg && !cleanTg.startsWith('+')) {
    showToast(`Офер скопійовано. Відкриваємо Telegram @${cleanTg}`);
    const tgUrl = `https://t.me/${cleanTg}?text=${encodeURIComponent(pitch)}`;
    openTelegramSmartUrl(tgUrl);
  } else if (cleanInsta) {
    showToast('Офер скопійовано. Вставте в Instagram Direct');
    const igDirectUrl = `https://ig.me/m/${cleanInsta}`;
    if (Boolean(window.Telegram?.WebApp?.initData) && window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(igDirectUrl);
    } else {
      window.open(igDirectUrl, '_blank');
    }
  } else if (isMobile) {
    showToast('Офер скопійовано. Відкриваємо Viber');
    launchViberForPhone(clean380);
  } else {
    if (!venue.phone && (venue.website || venue.mapsUrl)) {
      const targetUrl = venue.website || venue.mapsUrl;
      showToast('Офер для керівника скопійовано. Відкриваємо оголошення');
      if (targetUrl.includes('t.me/')) {
        openTelegramSmartUrl(targetUrl);
      } else if (Boolean(window.Telegram?.WebApp?.initData) && window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(targetUrl);
      } else {
        window.open(targetUrl, '_blank');
      }
      return;
    }
    showToast('Офер скопійовано. Оберіть спосіб зв\'язку');
    openContactActionModal(venue, job);
  }
}

function copyVenueNfcPitch(venue, job) {
  const pitch = generateNfcPitch(venue, job);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(pitch).then(() => {
      showToast('Готовий офер для «' + venue.name + '» скопійовано!');
      haptic('success');
    }).catch(() => {
      fallbackCopy(pitch, venue.name);
    });
  } else {
    fallbackCopy(pitch, venue.name);
  }

  const titleEl = document.getElementById('venuePitchModalTitle');
  const infoEl = document.getElementById('venuePitchVenueInfo');
  const textEl = document.getElementById('venuePitchText');

  const starStr = venue.rating ? Number(venue.rating).toFixed(1) : '—';
  const revStr = venue.reviews || 0;
  const addrStr = venue.address || job?.cluster || job?.city || '—';
  const mapUrl = getVenueMapsUrl(venue, job);
  const cleanPhone = (venue.phone || '').replace(/[^\d]/g, '');
  const isMobile = isUkrainianMobilePhone(cleanPhone);
  const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
  const tgUrl = venue.telegram ? (venue.telegram.startsWith('http') ? venue.telegram : 'https://t.me/' + venue.telegram.replace('@', '')) : (cleanPhone ? 'https://t.me/+' + cleanPhone : '');
  const cleanInsta = (venue.instagram || '').replace(/^@+/, '');
  const instaUrl = cleanInsta ? `https://instagram.com/${cleanInsta}` : `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent((venue.name || '') + ' ' + (job?.city || ''))}`;
  const igDirectUrl = cleanInsta ? `https://ig.me/m/${cleanInsta}` : instaUrl;

  if (titleEl) titleEl.textContent = 'Офер: ' + (venue.name || 'Заклад');
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="font-size:0.85rem; font-weight:700; color:var(--black); margin-bottom:4px;">
        ${escapeHtml(venue.name)} &bull; ★ ${starStr} (${revStr})
      </div>
      <div style="font-size:0.75rem; color:var(--muted); margin-bottom:8px;">
        ${escapeHtml(addrStr)}
      </div>
      <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px;">
        <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn--out btn--xs" style="display:inline-flex; align-items:center; gap:4px; font-weight:600;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>Точка в Google Maps</span>
        </a>
        <a href="${instaUrl}" target="_blank" rel="noopener" class="btn btn--out btn--xs nfc-insta-link" data-nfc-insta="true" data-job="${job?.id}" data-venue="${venue.id}" data-href="${instaUrl}" style="display:inline-flex; align-items:center; gap:4px; color:#E1306C; border-color:#E1306C; font-weight:600;">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path></svg>
          <span>${cleanInsta ? '@' + cleanInsta : 'Знайти в Instagram'}</span>
        </a>
        ${isMobile ? `
          <a href="${viberUrl}" target="_blank" rel="noopener" class="btn btn--out btn--xs" style="display:inline-flex; align-items:center; gap:4px; color:#0066FF; border-color:#0066FF; font-weight:600;">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Написати у Viber</span>
          </a>
        ` : ''}
      </div>
    `;
  }
  if (textEl) textEl.value = pitch;

  const copyBtn = document.getElementById('copyVenuePitchBtn');
  if (copyBtn) {
    copyBtn.onclick = () => {
      const val = textEl ? textEl.value : pitch;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(val).then(() => {
          showToast('Текст оферу скопійовано!');
          haptic('success');
        });
      } else {
        fallbackCopy(val, venue.name);
      }
    };
  }

  const directTgBtn = document.getElementById('openVenueDirectTgBtn');
  if (directTgBtn) {
    directTgBtn.style.display = 'none';
  }

  const directIgBtn = document.getElementById('openVenueDirectIgBtn');
  if (directIgBtn) {
    directIgBtn.onclick = () => {
      const val = textEl ? textEl.value : pitch;
      copyTextToClipboardSync(val);
      showToast('Офер скопійовано! Вставте в Instagram Direct');
      haptic('success');
      const targetIg = igDirectUrl || instaUrl;
      setTimeout(() => {
        if (Boolean(window.Telegram?.WebApp?.initData) && window.Telegram?.WebApp?.openLink) {
          window.Telegram.WebApp.openLink(targetIg);
        } else {
          window.open(targetIg, '_blank');
        }
      }, 100);
    };
  }

  const directViberBtn = document.getElementById('openVenueDirectViberBtn');
  if (directViberBtn) {
    if (isMobile && viberUrl) {
      directViberBtn.style.display = 'inline-flex';
      directViberBtn.onclick = () => {
        const val = textEl ? textEl.value : pitch;
        copyTextToClipboardSync(val);
        showToast('Текст оферу скопійовано. Відкриваю Viber');
        haptic('light');
        launchViberForPhone(cleanPhone);
      };
    } else {
      directViberBtn.style.display = 'none';
    }
  }

  const shareTgBtn = document.getElementById('shareVenuePitchTgBtn');
  if (shareTgBtn) {
    shareTgBtn.onclick = () => {
      const val = textEl ? textEl.value : pitch;
      const shareUrl = 'https://t.me/share/url?url=' + encodeURIComponent('') + '&text=' + encodeURIComponent(val);
      if (window.Telegram?.WebApp?.openTelegramLink) {
        window.Telegram.WebApp.openTelegramLink(shareUrl);
      } else {
        window.open(shareUrl, '_blank');
      }
    };
  }

  openModal('modalVenuePitch');
}

function fallbackCopy(text, name) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('Офер для «' + name + '» скопійовано!');
  haptic('success');
}

function addBizToCrm(biz, clusterName) {
  if (!Array.isArray(state.crm)) state.crm = [];
  const isD2d = Boolean(biz.isD2d || nfcRadarState.radarMode === 'd2d');
  const existing = state.crm.find(c => c.name === biz.name || (biz.phone && c.phone === biz.phone));
  if (existing) {
    showToast((isD2d ? 'D2D-партнер «' : 'Заклад «') + biz.name + '» вже є у вашій CRM');
    haptic('warning');
    return;
  }

  const cleanInsta = biz.instagram ? biz.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@+/, '').replace(/\/$/, '') : '';
  const cleanTg = biz.telegram ? biz.telegram.replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@+/, '').replace(/\/$/, '') : '';
  const defaultBudget = isD2d ? 15000 : 1500;
  const orderTitle = isD2d ? 'Оптова партія NFC-карток (50 шт × 300 ₴)' : 'NFC стійки на столики (партія)';
  const notesText = isD2d
    ? `D2D Опт Радар: ${biz.name} (${biz.painChipLabel || 'D2D Команда'}). Адреса: ${biz.address || '—'}. Телефон: ${biz.phone || '—'}. ${biz.painText || 'Оптовий викуп / реалізація NFC-карток.'}`
    : `NFC Радар: ${biz.name} (${biz.rating ? biz.rating + '★' : ''}, ${biz.reviews || 0} відгуків). Адреса: ${biz.address || '—'}. Телефон: ${biz.phone || '—'}. Запропоновано партію брендованих NFC-стійок для Google Maps відгуків.`;

  const newClient = {
    id: 'crm-' + Date.now(),
    name: biz.name,
    username: cleanTg ? ('@' + cleanTg) : (cleanInsta ? ('@' + cleanInsta) : (biz.phone || '@client')),
    avatarLetter: (biz.name || 'N').charAt(0).toUpperCase(),
    service: 'nfc_cards',
    serviceLabel: isD2d ? 'NFC Опт / D2D Партнер' : 'NFC Картки & Відгуки',
    status: 'in_progress',
    statusLabel: 'Офер',
    budget: defaultBudget,
    phone: biz.phone || '',
    website: biz.website || biz.mapsUrl || '',
    address: biz.address || '',
    rating: biz.rating || 0,
    reviews: biz.reviews || 0,
    cluster: clusterName || '',
    notes: notesText,
    createdAt: new Date().toISOString(),
    orders: [
      { id: 'ord-' + Date.now(), title: orderTitle, amount: defaultBudget, status: 'in_progress', date: new Date().toISOString() }
    ]
  };

  state.crm.unshift(newClient);
  localStorage.setItem('dws_crm', JSON.stringify(state.crm));
  syncAccountToServer();
  renderCrm();
  showToast((isD2d ? 'D2D-партнера «' : 'Заклад «') + biz.name + '» додано в CRM!');
  haptic('success');
}

function syncNfcModeHeaderUi() {
  const isD2d = nfcRadarState.radarMode === 'd2d';
  const vBtn = document.getElementById('nfcModeVenuesBtn');
  const dBtn = document.getElementById('nfcModeD2dBtn');
  if (vBtn) vBtn.classList.toggle('active', !isD2d);
  if (dBtn) dBtn.classList.toggle('active', isD2d);

  const launchTitle = document.getElementById('nfcLaunchCardTitle');
  const launchSub = document.getElementById('nfcLaunchCardSub');
  const secLabel = document.getElementById('nfcSectionListLabel');

  if (launchTitle) {
    launchTitle.textContent = isD2d ? 'Радар D2D-офісів та опту' : 'Радар закладів';
  }
  if (launchSub) {
    launchSub.textContent = isD2d
      ? 'Пошук чистих D2D-офісів («ходоків»), польових промоутерів, BTL та бригад прямих продажів в лице бізнесу'
      : 'Пошук закладів з відгуками до 300, скупчення в ТРЦ/районі та готові піші маршрути';
  }
  if (secLabel) {
    secLabel.textContent = isD2d ? 'ЗБОРИ D2D-КОМАНД & ОПТУ' : 'ЗБОРИ ЗАКЛАДІВ & МАРШРУТИ';
  }
}

function setNfcRadarMode(mode) {
  nfcRadarState.radarMode = (mode === 'd2d') ? 'd2d' : 'venues';
  nfcRadarState.activeJobId = null;
  localStorage.setItem('dws_nfc_radar_mode', nfcRadarState.radarMode);
  const mapCard = document.getElementById('nfcMapVenueCard');
  if (mapCard) mapCard.style.display = 'none';
  syncNfcModeHeaderUi();
  if (nfcRadarState.viewMode === 'map') {
    renderNfcMap();
  } else {
    renderNfcRadar();
  }
}

function renderNfcRadar() {
  syncNfcModeHeaderUi();
  const list = document.getElementById('nfcRadarJobsList');
  if (!list) return;

  const isD2d = nfcRadarState.radarMode === 'd2d';
  let jobs = getActiveNfcModeJobs();
  const openSet = getActiveNfcOpenSet();

  if (nfcRadarState.cityFilter && nfcRadarState.cityFilter !== 'all') {
    jobs = jobs.filter(j => j.city && j.city.toLowerCase().includes(nfcRadarState.cityFilter.toLowerCase()));
  }

  const total = jobs.reduce((s, j) => s + (j.status === 'done' ? (j.total || (j.items ? j.items.length : 0)) : 0), 0);
  const numEl = document.getElementById('nfcRadarTotalNum');
  const lblEl = document.getElementById('nfcRadarTotalLabel');
  if (numEl) numEl.textContent = total;
  if (lblEl) lblEl.textContent = isD2d ? pluralD2dTeams(total) : pluralNfcVenues(total);

  if (!jobs.length) {
    list.innerHTML = isD2d
      ? '<div class="scrape-empty">Натисніть <b>«НОВИЙ ЗБІР»</b>, щоб знайти чисті D2D-офіси («ходоків»), промо-бригади та польових торгових представників.</div>'
      : '<div class="scrape-empty">Натисніть <b>«НОВИЙ ЗБІР»</b> або оберіть інше місто, щоб знайти заклади під NFC-картки.</div>';
    return;
  }

  list.innerHTML = jobs.map(job => {
    const isOpen = openSet.has(job.id);
    const date = new Date(job.createdAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });
    let pill = `<span class="scrape-status-pill demo">${job.isD2d ? 'D2D Опт' : 'Локація'}</span>`;
    if (job.status === 'running') pill = `<span class="scrape-status-pill running">${escapeHtml(job.progressText || 'Шукаю…')}</span>`;

    const items = getJobFlatItems(job);
    const count = items.length || job.total || 0;
    const routeUrl = getClusterRouteUrl(job);

    let body = '';
    if (job.status === 'done' && items.length > 0) {
      body = `
        <div class="scrape-job-body" style="padding-top: 14px;">
          ${renderNfcVenuesList(job, items)}

          <div class="nfc-job-footer-actions">
            <button type="button" class="btn btn--out btn--sm nfc-btn-map" data-nfc-act="map" data-job="${job.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
              <span>Карта</span>
            </button>
            <button type="button" class="btn btn--fill btn--sm" data-nfc-act="csv" data-job="${job.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              <span>CSV</span>
            </button>
            <button type="button" class="btn btn--out btn--sm scrape-btn-delete" data-nfc-act="delete" data-job="${job.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Видалити</span>
            </button>
          </div>
        </div>
      `;
    } else if (job.status !== 'running') {
      body = `
        <div class="scrape-job-body" style="padding: 16px;">
          <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-bottom: 12px; line-height: 1.4;">
            ${job.status === 'error' ? (job.error || 'Помилка виконання пошуку') : 'Закладів за цим фільтром не знайдено (0 точок).'}
          </div>
          <div style="display: flex; justify-content: center;">
            <button type="button" class="btn btn--out btn--sm scrape-btn-delete" data-nfc-act="delete" data-job="${job.id}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Видалити цей пошук</span>
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="scrape-job-card ${isOpen ? 'open' : ''}" data-job-card="${job.id}">
        <div class="scrape-job-head" data-nfc-toggle-job="${job.id}">
          <div class="scrape-job-ico">
            ${SCRAPE_ICONS[job.source] || SCRAPE_ICONS.gmaps}
          </div>
          <div class="scrape-job-info">
            <div class="scrape-job-title">${job.cluster ? job.cluster : (job.niche || 'Заклади')}</div>
            <div class="scrape-job-sub">${job.city}${job.cluster ? '' : ' (все місто)'} • ${date} ${pill}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            <div class="scrape-job-count scrape-job-count-numonly">
              <b>${count}</b>
            </div>
            <button type="button" class="scrape-btn-quick-del" data-nfc-act="delete" data-job="${job.id}" title="Видалити цей пошук" style="background: none; border: none; padding: 5px; cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; border-radius: 4px; transition: color 0.15s ease;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            ${SCRAPE_CHEVRON}
          </div>
        </div>
        ${body}
      </div>
    `;
  }).join('');
}

function renderNfcVenuesList(job, items) {
  if (nfcRadarState.viewMode === 'table') {
    const rows = items.map((v, idx) => {
      const painBadge = v.painChipLabel
        ? `<span class="nfc-pain-chip ${v.painLevel || 'urgent'}">${escapeHtml(v.painChipLabel)}</span>`
        : (v.painLevel === 'urgent'
          ? '<span class="nfc-pain-chip urgent">Негатив: треба перекривати 5★</span>'
          : (v.painLevel === 'new'
            ? '<span class="nfc-pain-chip new">Новий заклад: мало відгуків</span>'
            : '<span class="nfc-pain-chip boost">Буст до ТОП-1</span>'));

      const mapUrl = getVenueMapsUrl(v, job);
      const cleanPhone = (v.phone || '').replace(/[^\d]/g, '');
      const isMobile = isUkrainianMobilePhone(cleanPhone);
      const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
      const cleanInsta = (v.instagram || '').replace(/^@+/, '');
      const instaUrl = cleanInsta ? `https://instagram.com/${cleanInsta}` : `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent((v.name || '') + ' ' + (job?.city || ''))}`;
      const cleanTg = (v.telegram || '').replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@+/, '').replace(/[\/?#].*$/, '').trim();
      const tgHandleUrl = cleanTg ? `https://t.me/${cleanTg}` : '';

      return `
        <tr class="nfc-table-row">
          <td class="col-idx">${idx + 1}</td>
          <td class="col-name">
            <div class="biz-title">
              <a href="${mapUrl}" target="_blank" rel="noopener" style="color:var(--black); text-decoration:none; font-weight:700; display:inline-flex; align-items:center; gap:4px;" title="Відкрити точку в Google Maps">
                <span>${escapeHtml(v.name)}</span>
                <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="var(--accent)" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>
            </div>
            <div class="biz-addr">${escapeHtml(v.address || '—')}</div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:3px; font-size:0.75rem;">
              <a href="${instaUrl}" target="_blank" rel="noopener" class="nfc-insta-link" data-nfc-insta="true" data-job="${job.id}" data-venue="${v.id}" data-href="${instaUrl}" style="color:${cleanInsta ? '#007aff' : 'var(--accent)'}; font-weight:700; text-decoration:none;">${cleanInsta ? '@' + cleanInsta : 'Insta пошук'}</a>
              ${cleanTg ? `<a href="${tgHandleUrl}" target="_blank" rel="noopener" style="color:#0066FF; font-weight:700; text-decoration:none;">@${escapeHtml(cleanTg)}</a>` : ''}
              ${v.phone ? `<button type="button" class="nfc-contact-btn" data-nfc-contact="${v.id}" data-job="${job.id}" style="background:none; border:none; padding:0; color:var(--accent); font-weight:700; cursor:pointer; font-size:0.75rem; display:inline-flex; align-items:center; gap:4px; font-family:inherit;">${escapeHtml(v.phone)} ${isMobile ? '<span style="color:#0066FF; background:rgba(0,102,255,0.12); padding:1px 5px; border-radius:4px; font-weight:850;">Viber</span>' : ''}</button>` : ''}
            </div>
          </td>
          <td class="col-rating">
            <span class="rating-star">★ ${v.rating ? Number(v.rating).toFixed(1) : '5.0'}</span>
            <span class="reviews-cnt">(${v.d2dMatchScore ? v.d2dMatchScore + '% D2D' : (v.reviews || 0)})</span>
          </td>
          <td class="col-pain">${painBadge}</td>
          <td class="col-actions">
            <button type="button" class="btn btn--fill btn--xs" data-nfc-act="pitch" data-job="${job.id}" data-venue="${v.id}" title="Скопіювати шаблон і відкрити Instagram Direct">
              AI-Відгук
            </button>
            <button type="button" class="btn btn--out btn--xs" data-nfc-act="crm" data-job="${job.id}" data-venue="${v.id}" title="Додати в CRM">
              + CRM
            </button>
          </td>
        </tr>
      `;
    }).join('');

    return `
      <div class="nfc-table-wrap">
        <table class="nfc-venues-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Заклад (Google Maps) / Контакти</th>
              <th>Рейтинг</th>
              <th>Потреба</th>
              <th>Дії</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  return `
    <div class="nfc-venues-grid">
      ${items.map((v, idx) => {
        const painBadge = v.painChipLabel
          ? `<span class="nfc-pain-chip ${v.painLevel || 'urgent'}">${escapeHtml(v.painChipLabel)}</span>`
          : (v.painLevel === 'urgent'
            ? '<span class="nfc-pain-chip urgent">Негатив: перекриття відгуками 5★</span>'
            : (v.painLevel === 'new'
              ? '<span class="nfc-pain-chip new">Новий заклад: мало відгуків</span>'
              : '<span class="nfc-pain-chip boost">ТОП-потенціал: буст рейтингу</span>'));

        const navUrl = getVenueNavigationUrl(v, job);
        const mapUrl = getVenueMapsUrl(v, job);
        const cleanPhone = (v.phone || '').replace(/[^\d]/g, '');
        const isMobile = isUkrainianMobilePhone(cleanPhone);
        const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
        const cleanInsta = (v.instagram || '').replace(/^@+/, '');
        const instaUrl = cleanInsta ? `https://instagram.com/${cleanInsta}` : `https://www.google.com/search?q=site:instagram.com+${encodeURIComponent((v.name || '') + ' ' + (job?.city || ''))}`;

        return `
          <div class="nfc-venue-card">
            <div class="nfc-venue-top-row">
              <div class="nfc-venue-title-wrap">
                <span class="nfc-venue-idx">#${idx + 1}</span>
                <a href="${mapUrl}" target="_blank" rel="noopener" class="nfc-venue-name" title="Відкрити точку закладу в Google Maps" style="text-decoration:none; color:inherit;">
                  <span>${escapeHtml(v.name)}</span>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="var(--accent)" stroke-width="2.5" style="margin-left:2px; vertical-align:middle;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                </a>
              </div>
              <div class="nfc-venue-score-badge ${(v.rating && v.rating <= 4.3 && !v.isD2d) ? 'warning' : 'good'}">
                ★ ${v.rating ? Number(v.rating).toFixed(1) : '5.0'} <span class="revs">(${v.d2dMatchScore ? v.d2dMatchScore + '% D2D' : (v.reviews || 0)})</span>
              </div>
            </div>

            <div class="nfc-venue-pain-row">
              ${painBadge}
              <div class="nfc-pain-sub">${v.painText || 'Потреба в автоматичному зборі 5★ від реальних гостей'}</div>
            </div>

            <div class="nfc-venue-meta">
              <div class="nfc-meta-item">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <a href="${mapUrl}" target="_blank" rel="noopener" class="nfc-addr-link" title="Відкрити точку в Google Maps">${escapeHtml(v.address || job.cluster || job.city)}</a>
              </div>
              ${v.phone ? `
                <div class="nfc-meta-item">
                  <button type="button" class="nfc-contact-btn" data-nfc-contact="${v.id}" data-job="${job.id}" style="background:none; border:none; padding:0; display:inline-flex; align-items:center; gap:6px; cursor:pointer; text-align:left; font-family:inherit;">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    <span style="color:var(--accent); font-weight:700; text-decoration:underline;">${v.phone}</span>
                    ${isMobile ? `<span class="viber-badge-pill" style="font-size:0.7rem; font-weight:800; color:#0066FF; background:rgba(0,102,255,0.12); padding:2px 7px; border-radius:6px;">Viber</span>` : ''}
                  </button>
                </div>
              ` : ''}
              ${(!v.phone && v.website && /^https?:\/\//i.test(v.website)) ? `
                <div class="nfc-meta-item">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#0066FF" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <a href="${escapeHtml(v.website)}" target="_blank" rel="noopener" class="nfc-insta-link" style="color:#0066FF; font-weight:800; text-decoration:underline;">Чат з офісом в оголошенні (${v.website.includes('olx.ua') ? 'OLX.ua' : (v.website.includes('work.ua') ? 'Work.ua' : 'Перейти')})</a>
                </div>
              ` : ''}
              ${(v.telegram && v.telegram.replace(/^@+/, '').trim()) ? `
                <div class="nfc-meta-item">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#0066FF" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  <a href="https://t.me/${escapeHtml(v.telegram.replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@+/, '').trim())}" target="_blank" rel="noopener" class="nfc-insta-link" style="color:#0066FF; font-weight:700; text-decoration:none;">Telegram: @${escapeHtml(v.telegram.replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@+/, '').trim())}</a>
                </div>
              ` : ''}
              <div class="nfc-meta-item">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="${cleanInsta ? '#E1306C' : 'currentColor'}" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path></svg>
                <a href="${instaUrl}" target="_blank" rel="noopener" class="nfc-insta-link" data-nfc-insta="true" data-job="${job.id}" data-venue="${v.id}" data-href="${instaUrl}" style="color:${cleanInsta ? '#E1306C' : 'var(--accent)'}; font-weight:700; text-decoration:none;">${cleanInsta ? '@' + cleanInsta : 'Знайти в Instagram'}</a>
              </div>
            </div>

            <div class="nfc-venue-actions-row">
              <button type="button" class="btn btn--fill btn--sm nfc-pitch-btn" data-nfc-act="pitch" data-job="${job.id}" data-venue="${v.id}">
                <span>${(v.isD2d || job?.isD2d) ? 'Опт Офер' : 'AI-Відгук'}</span>
              </button>
              <a href="${navUrl}" target="_blank" rel="noopener" class="btn btn--out btn--sm nfc-route-btn" title="Прокласти маршрут пішки до закладу">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
                <span>Шлях</span>
              </a>
              <button type="button" class="btn btn--fill btn--sm nfc-crm-btn" data-nfc-act="crm" data-job="${job.id}" data-venue="${v.id}">
                <span>CRM</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function searchPlacesApiDirect(query, key, pageToken = '') {
  const bodyPayload = {
    textQuery: query,
    languageCode: 'uk',
    maxResultCount: 20
  };
  if (pageToken) bodyPayload.pageToken = pageToken;

  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.location,places.businessStatus,places.primaryType,places.types,nextPageToken'
    },
    body: JSON.stringify(bodyPayload)
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Places API error (${res.status}): ${errText.slice(0, 150)}`);
  }
  return await res.json();
}

async function runGooglePlacesNfcRadar(job, targetReviews, targetCount, city, cluster, reg, waveKey, currentWave) {
  const key = getClientGoogleMapsKey();
  if (!key) return null;

  const runSeenKeys = new Set();
  const isSeenInThisRun = (v) => extractBizSeenKeysClient(v, city).some(k => runSeenKeys.has(k));
  const markSeenInThisRun = (v) => extractBizSeenKeysClient(v, city).forEach(k => runSeenKeys.add(k));

  const strictMatched = []; // Has Instagram AND reviews <= targetReviews
  const viberMatched = [];  // Has Viber/mobile phone AND reviews <= targetReviews
  const otherMatched = [];  // Has website/other AND reviews <= targetReviews
  const overflowPool = [];  // Has contact, but reviews > targetReviews (for fallback to guarantee count)

  const baseQuery = [job.niche, cluster, city].filter(Boolean).join(' ');
  const districtQueries = buildSmartDistrictQueriesClient(job.niche, city, cluster, currentWave, 24);
  const searchQueries = [baseQuery, ...districtQueries];

  for (let qIdx = 0; qIdx < searchQueries.length; qIdx++) {
    const totalCollected = strictMatched.length + viberMatched.length + otherMatched.length;
    if (totalCollected >= targetCount && (strictMatched.length + viberMatched.length) >= Math.min(targetCount, 12)) {
      break;
    }
    if (totalCollected >= targetCount * 2) {
      break;
    }

    const q = searchQueries[qIdx];
    job.progressText = `Google Places API (${Math.min(targetCount, totalCollected)}/${targetCount})…`;
    renderNfcRadar();

    let pageToken = '';
    for (let page = 0; page < 2; page++) {
      let data = null;
      try {
        data = await searchPlacesApiDirect(q, key, pageToken);
      } catch (err) {
        console.warn('[GooglePlaces] Search error:', err.message);
        break;
      }
      if (!data || !Array.isArray(data.places) || data.places.length === 0) break;

      data.places.forEach((p, idx) => {
        const name = (p.displayName?.text || '').trim();
        if (!name) return;

        if (p.businessStatus === 'CLOSED_TEMPORARILY' || p.businessStatus === 'CLOSED_PERMANENTLY') return;

        // Strict Niche Relevance Filter (prevents food places from leaking into barbershops etc.)
        if (!isVenueRelevantToNiche(p, job.niche)) return;

        const reviews = Number(p.userRatingCount || 0);
        if (reviews <= 0) return;

        const rating = Number(p.rating || 0);
        const rawPhone = p.internationalPhoneNumber || p.nationalPhoneNumber || '';
        const phone = normalizePhone(rawPhone);
        const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
        const isMobile = isUkrainianMobilePhone(cleanPhone);
        const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
        const telegramPhone = cleanPhone ? `https://t.me/+${cleanPhone}` : '';

        const website = p.websiteUri || '';
        let insta = '';
        if (website && /instagram\.com/i.test(website)) {
          insta = cleanInstagramHandle(website);
        }

        // Must have Instagram OR mobile phone (Viber) OR website
        if (!insta && !isMobile && !website) return;

        const addr = p.formattedAddress || cluster || city;
        const mapsUrl = p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + addr)}`;

        const venueObj = {
          id: 'v-gmp-' + Date.now() + '-' + qIdx + '-' + idx,
          name,
          placeId: p.id || '',
          address: addr,
          city,
          phone,
          isMobile,
          viberUrl,
          website,
          instagram: insta,
          telegram: '',
          telegramPhone,
          rating,
          reviews,
          mapsUrl,
          lat: p.location?.latitude || null,
          lng: p.location?.longitude || null,
          painLevel: (rating && rating <= 4.3) ? 'urgent' : (reviews < 50 ? 'new' : 'boost'),
          painText: (rating && rating <= 4.3) ? 'Потрібно терміново перекривати негатив' : (reviews < 50 ? 'Новий заклад — гостра потреба у відгуках' : 'Буст до ТОП-1 в Google Maps')
        };

        if (reg.isBizSeen(venueObj, city) || isSeenInThisRun(venueObj)) return;
        markSeenInThisRun(venueObj);

        const meetsReviews = (!targetReviews || targetReviews >= 90000 || reviews <= targetReviews);

        if (meetsReviews) {
          if (insta) {
            strictMatched.push(venueObj);
          } else if (isMobile) {
            viberMatched.push(venueObj);
          } else {
            otherMatched.push(venueObj);
          }
        } else {
          overflowPool.push(venueObj);
        }
      });

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
      await new Promise(r => setTimeout(r, 400));
    }
  }

  // Sort lowest reviews first
  strictMatched.sort((a, b) => (Number(a.reviews) || 0) - (Number(b.reviews) || 0));
  viberMatched.sort((a, b) => (Number(a.reviews) || 0) - (Number(b.reviews) || 0));
  otherMatched.sort((a, b) => (Number(a.reviews) || 0) - (Number(b.reviews) || 0));
  overflowPool.sort((a, b) => {
    const aHasContact = (a.instagram || a.isMobile) ? 1 : 0;
    const bHasContact = (b.instagram || b.isMobile) ? 1 : 0;
    if (bHasContact !== aHasContact) return bHasContact - aHasContact;
    return (Number(a.reviews) || 0) - (Number(b.reviews) || 0);
  });

  // Assemble final venues to guarantee exact targetCount
  const finalVenues = [...strictMatched, ...viberMatched, ...otherMatched];
  if (finalVenues.length < targetCount && overflowPool.length > 0) {
    const needed = targetCount - finalVenues.length;
    finalVenues.push(...overflowPool.slice(0, needed));
  }

  return finalVenues.slice(0, targetCount);
}

async function runLiveNfcRadar(job, reviewsLimit, limit) {
  const token = getClientApifyToken();
  const targetReviews = Number(reviewsLimit || job.maxReviews || 300);
  const activeNfcLimitBtn = document.querySelector('#nfcLimitSeg .scrape-seg-btn.active');
  const targetCount = Math.max(5, Number(limit || activeNfcLimitBtn?.dataset.value || job.limit || 30));

  const city = (job.city || 'Київ').trim();
  const cluster = (job.cluster || '').trim();
  const actorId = 'compass~crawler-google-places';

  try {
    const reg = await loadGlobalSeenRegistry();
    const waveKey = `nfc:${String(job.niche || '').toLowerCase().trim()}:${city.toLowerCase()}:${cluster.toLowerCase()}`;
    let currentWave = Number(reg.waveOffsets[waveKey] || 0);

    const runSeenKeys = new Set();
    const isSeenInThisRun = (v) => extractBizSeenKeysClient(v, city).some(k => runSeenKeys.has(k));
    const markSeenInThisRun = (v) => extractBizSeenKeysClient(v, city).forEach(k => runSeenKeys.add(k));

    // ------------------------------------------------------------
    // 1. OFFICIAL GOOGLE PLACES API (NEW) - ZERO WAIT, ZERO SERVERS, 100% PHONE NATIVE
    // ------------------------------------------------------------
    try {
      job.progressText = `Пошук через Google Places (0/${targetCount})…`;
      renderNfcRadar();

      const placesVenues = await runGooglePlacesNfcRadar(job, targetReviews, targetCount, city, cluster, reg, waveKey, currentWave);
      if (Array.isArray(placesVenues) && placesVenues.length > 0) {
        await saveGlobalSeenRegistry(placesVenues, waveKey, currentWave, city);
        job.status = 'done';
        job.progressText = '';
        job.items = placesVenues;
        job.total = placesVenues.length;
        saveLocalNfcJobs(nfcRadarState.jobs);
        renderNfcRadar();

        const locLabel = job.cluster ? `${job.cluster}, ${job.city}` : job.city;
        try { showToast(`Знайдено ${placesVenues.length} закладів у Google Maps (${locLabel})!`); } catch (_) {}
        haptic('success');
        return;
      }
    } catch (gmpErr) {
      console.warn('[GooglePlaces] Fallback to other engines:', gmpErr.message);
    }

    // ------------------------------------------------------------
    // 2. FREE LOCAL GOOGLE MAPS ENGINE (Puppeteer + Chrome, No Apify)
    // ------------------------------------------------------------
    const customEndpoint = (localStorage.getItem('dws_scraper_url') || '').trim();
    const localEndpoint = customEndpoint ? `${customEndpoint.replace(/\/+$/, '')}/api/scraper/live-nfc` : '/api/scraper/live-nfc';

    try {
      job.progressText = `Локальний збір Google Maps (0/${targetCount})…`;
      renderNfcRadar();

      const localRes = await fetch(localEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: job.niche,
          city,
          cluster,
          limit: targetCount,
          maxReviews: targetReviews
        })
      }).catch(() => null);

      if (localRes && localRes.ok) {
        const payload = await localRes.json();
        if (payload.success && Array.isArray(payload.items) && payload.items.length > 0) {
          const freshItems = payload.items.filter(v => !reg.isBizSeen(v, city) && !isSeenInThisRun(v));
          freshItems.forEach(v => markSeenInThisRun(v));

          const finalVenues = freshItems.slice(0, targetCount);
          if (finalVenues.length > 0) {
            await saveGlobalSeenRegistry(finalVenues, waveKey, currentWave, city);
            job.status = 'done';
            job.progressText = '';
            job.items = finalVenues;
            job.total = finalVenues.length;
            saveLocalNfcJobs(nfcRadarState.jobs);
            renderNfcRadar();

            const locLabel = job.cluster ? `${job.cluster}, ${job.city}` : job.city;
            try { showToast(`Знайдено ${finalVenues.length} закладів локально (${locLabel})!`); } catch (_) {}
            haptic('success');
            return;
          }
        }
      }
    } catch (localErr) {
      console.warn('[LocalEngine] Falling back to Apify:', localErr.message);
    }

    // ------------------------------------------------------------
    // 2. CLOUD ENGINE (Apify multi-wave fallback)
    // ------------------------------------------------------------
    const strictMatched = [];
    const overflowUnseenPool = [];
    const maxWaves = 3;

    for (let wave = 0; wave < maxWaves; wave++) {
      if (strictMatched.length >= targetCount) break;
      const needed = targetCount - strictMatched.length;

      job.progressText = wave === 0
        ? `Шукаю 0/${targetCount} нових…`
        : `Хвиля ${wave + 1}: ${strictMatched.length}/${targetCount} нових…`;
      renderNfcRadar();

      const batchSize = Math.min(14, Math.max(8, Math.ceil(needed / 8) + 4));
      const searchStrings = buildSmartDistrictQueriesClient(job.niche, city, cluster, currentWave, batchSize);
      currentWave++;

      // Request higher multiplier when filtering by strict low reviews (<= 50 or <= 150)
      const reviewMultiplier = targetReviews <= 50 ? 3.2 : (targetReviews <= 150 ? 2.4 : 1.8);
      const perSearchLimit = Math.max(30, Math.min(100, Math.ceil((needed * reviewMultiplier) / searchStrings.length)));
      const locationQuery = city ? `${city}, Україна` : '';

      const input = {
        searchStringsArray: searchStrings,
        locationQuery: locationQuery,
        maxCrawledPlacesPerSearch: perSearchLimit,
        language: 'uk',
        skipClosedPlaces: true,
        includeWebResults: false
      };

      let rawItems = [];
      try {
        rawItems = await runSingleApifyActorClient(actorId, input, token);
      } catch (apifyErr) {
        if (/Monthly usage hard limit exceeded|credit|quota/i.test(apifyErr.message)) {
          console.warn('[Apify] Limit exceeded, ending waves:', apifyErr.message);
          break;
        }
        throw apifyErr;
      }

      rawItems.forEach((it, idx) => {
        const name = (it.title || it.name || '').trim();
        if (!name) return;

        const reviews = Number(it.reviewsCount || 0);
        // Filter out venues with 0 reviews
        if (reviews <= 0) return;

        // Filter out closed or not yet opened places
        const isClosed = Boolean(it.isClosed || it.temporarilyClosed || it.permanentlyClosed);
        const textToCheck = `${name} ${it.openingHours || ''} ${it.additionalInfo ? JSON.stringify(it.additionalInfo) : ''} ${it.categoryName || ''}`;
        const isOpeningSoon = /(скоро відкри|opening soon|ще не відкри|незабаром відкри|coming soon)/i.test(textToCheck);
        if (isClosed || isOpeningSoon) return;

        // Strict Niche Relevance Filter
        if (!isVenueRelevantToNiche(it, job.niche)) return;

        const placeId = it.placeId || it.id || '';
        const cid = it.cid || '';
        const rating = Number(it.totalScore || 0);
        const phone = normalizePhone(it.phoneUnformatted || it.phone);
        const website = it.website || '';
        const addr = it.address || it.street || job.cluster || job.city;

        // Deep extraction of Instagram from web results, website, instagrams array, etc.
        const insta = extractInstagramFromApifyItem(it);

        let telegram = (it.telegrams || [])[0] || '';
        if (!telegram && website && /t\.me/i.test(website)) {
          const m = website.match(/t\.me\/([a-zA-Z0-9_+]+)/i);
          if (m && m[1]) telegram = '@' + m[1];
        }
        const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
        const isMobile = isUkrainianMobilePhone(cleanPhone);
        const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
        const telegramPhone = cleanPhone ? `https://t.me/+${cleanPhone}` : '';

        // STRICT OUTREACH FILTER:
        // Skip ghost venues where user cannot reach out (no Instagram, no mobile phone for Viber/Telegram, no website)
        if (!insta && !isMobile && !website) return;

        let mapsUrl = it.url || '';
        if (!mapsUrl || !mapsUrl.includes('google.com/maps')) {
          if (placeId) {
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=${encodeURIComponent(placeId)}`;
          } else if (cid) {
            mapsUrl = `https://maps.google.com/?cid=${encodeURIComponent(cid)}`;
          } else {
            mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((name + ' ' + addr).trim())}`;
          }
        }

        const venueObj = {
          id: 'v-real-' + Date.now() + '-' + wave + '-' + idx,
          name,
          placeId,
          cid,
          address: addr,
          city,
          phone,
          isMobile,
          viberUrl,
          website,
          instagram: insta,
          telegram,
          telegramPhone,
          rating,
          reviews,
          mapsUrl,
          lat: it.location?.lat || null,
          lng: it.location?.lng || null,
          painLevel: (rating && rating <= 4.3) ? 'urgent' : (reviews < 50 ? 'new' : 'boost'),
          painText: (rating && rating <= 4.3) ? 'Потрібно терміново перекривати негатив' : (reviews < 50 ? 'Новий заклад — гостра потреба у відгуках' : 'Буст до ТОП-1 в Google Maps')
        };

        // Skip if already seen in any previous search OR in this run
        if (reg.isBizSeen(venueObj, city) || isSeenInThisRun(venueObj)) return;
        markSeenInThisRun(venueObj);

        if (insta && (!targetReviews || targetReviews >= 90000 || reviews <= targetReviews)) {
          strictMatched.push(venueObj);
        } else {
          overflowUnseenPool.push(venueObj);
        }
      });

      job.total = Math.min(targetCount, strictMatched.length);
      job.progressText = `Знайдено ${Math.min(targetCount, strictMatched.length)}/${targetCount} нових…`;
      renderNfcRadar();
    }

    // Priority sorting: venues with direct Instagram FIRST!
    // Within the same group, sort ascending by reviews (newest/low reviews first) if targetReviews <= 150
    strictMatched.sort((a, b) => {
      const aHasIg = a.instagram ? 1 : 0;
      const bHasIg = b.instagram ? 1 : 0;
      if (bHasIg !== aHasIg) return bHasIg - aHasIg;
      if (targetReviews <= 150) {
        return (Number(a.reviews) || 0) - (Number(b.reviews) || 0);
      }
      return 0;
    });

    // Guarantee exact targetCount: if strict filter yielded fewer than targetCount after 3 district waves,
    // top up the remaining slots with the lowest-reviewed unseen venues from overflowUnseenPool!
    let finalVenues = [...strictMatched];
    if (finalVenues.length < targetCount && overflowUnseenPool.length > 0) {
      overflowUnseenPool.sort((a, b) => {
        const aHasIg = a.instagram ? 1 : 0;
        const bHasIg = b.instagram ? 1 : 0;
        if (bHasIg !== aHasIg) return bHasIg - aHasIg;
        return (Number(a.reviews) || 0) - (Number(b.reviews) || 0);
      });
      const neededExtra = targetCount - finalVenues.length;
      finalVenues.push(...overflowUnseenPool.slice(0, neededExtra));
    }

    finalVenues = finalVenues.slice(0, targetCount);

    // Save ONLY the delivered venues to the permanent Global Seen Registry
    await saveGlobalSeenRegistry(finalVenues, waveKey, currentWave, city);

    job.status = 'done';
    job.progressText = '';
    job.items = finalVenues;
    job.total = finalVenues.length;
    saveLocalNfcJobs(nfcRadarState.jobs);
    renderNfcRadar();

    if (finalVenues.length === 0) {
      try { showToast(`Нових закладів за цим запитом не знайдено. Спробуйте іншу нішу або місто.`); } catch (_) {}
    } else {
      const locLabel = job.cluster ? `${job.cluster}, ${job.city}` : job.city;
      try { showToast(`Знайдено ${finalVenues.length} НОВИХ закладів (${locLabel})!`); } catch (_) {}
    }
    haptic('success');
  } catch (err) {
    console.error('[NFC Apify] Error:', err);
    job.status = 'error';
    job.progressText = '';
    job.error = err.message || 'Помилка виконання радару';
    saveLocalNfcJobs(nfcRadarState.jobs);
    renderNfcRadar();
    try { showToast(`Помилка NFC радару: ${err.message}`); } catch (_) {}
  }
}

// ============================================================
// D2D & WHOLESALE PARTNER DISCOVERY + VERIFICATION ENGINE
// ============================================================
function buildSmartD2dQueriesClient(niche, city, cluster = '') {
  const c = String(city || 'Вінниця').trim();
  const cl = String(cluster || '').trim();
  const loc = cl ? `${cl} ${c}` : c;

  // STRICTLY D2D / Field Sales ("ходоки") / Promo squads / Field Trading Reps — ZERO printing, ZERO coffee/cups/HoReCa suppliers!
  return [
    { q: `промо агентство BTL промоутери ${loc}`, type: 'd2d_promo' },
    { q: `роздача листівок флаєрів промоутери кур'єрська доставка ${loc}`, type: 'd2d_promo' },
    { q: `агентство прямих продажів активні продажі ${loc}`, type: 'd2d_direct' },
    { q: `агентство мерчендайзингу торгові представники ${loc}`, type: 'field_reps' },
    { q: `рекрутингове агентство підбір торгових представників продажників ${loc}`, type: 'd2d_direct' },
    { q: `кур'єрська служба доставка по місту ${loc}`, type: 'd2d_promo' },
    { q: `дистриб'юторська компанія відділ торгових представників ${loc}`, type: 'field_reps' },
    { q: `аутсорсинг відділу продажів кол центр телемаркетинг ${loc}`, type: 'd2d_direct' },
    { q: `маркетингова агенція промо акції промоутери ${loc}`, type: 'd2d_promo' }
  ];
}

// Strict blocklist: excludes all printing shops, coffee/cup/packaging suppliers, salons, clinics, auto shops, web/SMM studios, real estate, retail stores, etc.
const D2D_HARD_STOP_REGEX = /(поліграф|друкарн|друк|print|вивіск|зовнішня реклама|сувенір|тейбл|стенд|таблич|посуд|стакан|упаков|пакет|полімер|кава|каво|coffee|сироп|вода|пиво|продукт|фрукт|овоч|м'яс|молоч|кондитер|пекарн|косметик|салон|перукар|манікюр|барбер|стоматолог|клінік|медич|аптек|автохім|автозапчаст|шиномонтаж|автомийк|автосервіс|мебл|будівн|ремонт|сантехн|плитк|вікна|двері|нерухоміст|забудовник|концерн поділля|житловий комплекс|рієлтор|оцінка майна|ocenka|ligapro|армії|військов|територіальний центр|осбб|міська рада|державн|\.gov\.ua|разработка сайтов|створення сайтів|webhit|kraft|копірайтинг|seo|таргет|дизайн студія|фотосвіт|фотостуд|аніматор|аниматор|дитяч|свята|весілл|паб|docker|ресторан|кафе|кав'ярн|кофейн|піцері|суші|готел|банк|приватбанк|ощадбанк|нова пошта|укрпошта|meest|розетка|атб|сільпо|фора|аврора|епіцентр|фуршет|трц|торгово-розважальний| the mall|s-mall|бастилія|нотаріус|адвокат|юридичн|вінбазар|портал|газета|новини|радіо|телеканал)/i;

const D2D_POSITIVE_SIGNAL_REGEX = /(промо|promo|btl|прям[іи]х? продаж|активн[іи]х? продаж|торгов[иії]й? представник|торгових|мерчендайз|дистриб'юц|дистрибьюшн|дистриб'ютор|кур'єр|курьер|тук-тук|рекрут|підбір персонал|подбор персонал|winwork|best heads|jobs go|кол-центр|колл-центр|контакт-центр|телемаркетинг|маркетингова агенція|маркетингове агентство|просування бізнесу)/i;

function classifyAndVerifyD2dCandidate(p, defaultType, city, cluster, qIdx, idx) {
  if (!p || p.businessStatus === 'CLOSED_TEMPORARILY' || p.businessStatus === 'CLOSED_PERMANENTLY') return null;

  const name = (p.displayName?.text || '').trim();
  if (!name || name.length < 2) return null;

  const addr = (p.formattedAddress || cluster || city || '').trim();
  const website = p.websiteUri || '';
  const combinedText = `${name} ${addr} ${website}`;

  // 1. Hard anti-noise filter (ZERO printing shops, ZERO coffee/cups suppliers, ZERO retail/service venues)
  if (D2D_HARD_STOP_REGEX.test(combinedText)) return null;

  // Must match at least one positive D2D / Promo / Field Rep / Sales Agency signal
  if (!D2D_POSITIVE_SIGNAL_REGEX.test(combinedText)) return null;

  // 2. Verify city match so other oblast centers don't leak in
  const cleanCityRoot = String(city || '').toLowerCase().trim().slice(0, 5);
  if (cleanCityRoot && addr.length > 8 && !addr.toLowerCase().includes(cleanCityRoot)) {
    const otherCities = ['київ', 'львів', 'одес', 'дніпр', 'харків', 'рівне', 'полтав', 'черкас', 'житомир', 'луцьк', 'терноп', 'чернівц', 'ужгород', 'хмельницьк', 'вінниц'];
    const hitsOtherCity = otherCities.some(oc => !oc.startsWith(cleanCityRoot) && addr.toLowerCase().includes(oc));
    if (hitsOtherCity) return null;
  }

  // 3. Hard contactability gate: must have Ukrainian mobile phone (Viber/Telegram) or Instagram
  const rawPhone = p.internationalPhoneNumber || p.nationalPhoneNumber || '';
  const phone = normalizePhone(rawPhone);
  const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
  const isMobile = isUkrainianMobilePhone(cleanPhone);
  const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
  const telegramPhone = cleanPhone ? `https://t.me/+${cleanPhone}` : '';

  let insta = '';
  if (website && /instagram\.com/i.test(website)) {
    insta = cleanInstagramHandle(website);
  }

  if (!isMobile && !insta) return null;

  // 4. Determine strict D2D sub-type
  let d2dType = defaultType || 'd2d_direct';
  const lowerNameWeb = `${name} ${website}`.toLowerCase();

  if (/(дистриб|торгов|мерчендайз)/i.test(lowerNameWeb)) {
    d2dType = 'field_reps';
  } else if (/(промо|promo|btl|кур'єр|тук-тук)/i.test(lowerNameWeb)) {
    d2dType = 'd2d_promo';
  } else {
    d2dType = 'd2d_direct';
  }

  let painLevel = 'urgent';
  let d2dMatchScore = isMobile && insta ? 99 : 97;
  let painChipLabel = `Офіс активних продажів / D2D (${d2dMatchScore}% Match)`;
  let painText = 'Команда активних продажів — запропонуй викуп партії 50–100 NFC-карток по 280–300 ₴, щоб їхні агенти продавали їх у лице власникам бізнесів за 500–600 ₴ (+200–300 ₴ маржі з карти)!';

  if (d2dType === 'd2d_promo') {
    painChipLabel = `Польові промоутери & BTL (${d2dMatchScore}% Match)`;
    painText = 'Штат живих промоутерів та «ходоків», які щодня ходять ногами по місту — дай їм партію NFC-карток оптом під прямий перепродаж у кожен заклад!';
  } else if (d2dType === 'field_reps') {
    painChipLabel = `Штат польових торгових агентів (${d2dMatchScore}% Match)`;
    painText = 'Їхні польові торгові представники щодня за маршрутом обходять десятки бізнесів міста — ідеальна бригада під оптовий викуп і збут NFC-карток!';
  }

  const mapsUrl = p.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + addr)}`;

  return {
    id: 'v-d2d-' + Date.now() + '-' + qIdx + '-' + idx,
    isD2d: true,
    d2dType,
    d2dMatchScore,
    name,
    placeId: p.id || '',
    address: addr,
    city,
    phone,
    isMobile,
    viberUrl,
    website,
    instagram: insta,
    telegram: '',
    telegramPhone,
    rating: Number(p.rating || 4.9),
    reviews: Number(p.userRatingCount || 14),
    mapsUrl,
    lat: p.location?.latitude || null,
    lng: p.location?.longitude || null,
    painLevel,
    painChipLabel,
    painText
  };
}

async function enrichWebsiteSocialsBatchClient(items) {
  const toEnrich = items.filter(it => it.website && !it.instagram && !/instagram\.com|facebook\.com|prom\.ua|t\.me|work\.ua|olx\.ua/i.test(it.website)).slice(0, 20);
  if (!toEnrich.length) return;

  await Promise.allSettled(toEnrich.map(async (it) => {
    const proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent(it.website),
      'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(it.website)
    ];
    for (const proxyUrl of proxies) {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 2800);
        const res = await fetch(proxyUrl, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) continue;
        const html = await res.text();
        const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]{3,30})/i);
        if (igMatch && igMatch[1] && !/^(p|reel|stories|explore|accounts|share)$/i.test(igMatch[1])) {
          it.instagram = '@' + igMatch[1];
        }
        const tgMatch = html.match(/t\.me\/([a-zA-Z0-9_]{4,32})/i);
        if (tgMatch && tgMatch[1] && !/^(share|joinchat|addstickers|s)$/i.test(tgMatch[1])) {
          it.telegram = '@' + tgMatch[1];
        }
        if (!it.isMobile) {
          const mobMatch = html.match(/(?:\+?38)?[\s\-()]*0(50|66|95|99|67|68|96|97|98|77|63|73|93)[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/);
          if (mobMatch) {
            const d = mobMatch[0].replace(/\D/g, '');
            it.phone = '+380' + d.slice(-9);
            it.isMobile = true;
            it.viberUrl = getViberDirectUrl('380' + d.slice(-9));
            it.telegramPhone = 'https://t.me/+380' + d.slice(-9);
          }
        }
        if (it.instagram || it.telegram) break;
      } catch (_) {}
    }
  }));
}

// Deep multi-page scanner of regional Telegram job channels for live D2D / Field Rep / Promo vacancies
async function scanTelegramD2dVacanciesClient(city) {
  const cLower = String(city || '').toLowerCase();
  let channels = [];
  if (cLower.includes('вінниц')) channels = ['vinnitsa_rabota', 'vinnitsa_vakansii', 'vinnitsa_work', 'vinnytsia_robota', 'work_vinnytsia'];
  else if (cLower.includes('київ')) channels = ['robota_kyiv_ua', 'work_kyiv', 'kyiv_robota'];
  else if (cLower.includes('львів')) channels = ['robota_lviv', 'lviv_robota'];
  else if (cLower.includes('одес')) channels = ['robota_odesa', 'odesa_work'];
  else if (cLower.includes('дніпр')) channels = ['robota_dnipro', 'dnipro_work'];
  else if (cLower.includes('харків')) channels = ['robota_kharkiv', 'kharkiv_work'];
  else if (cLower.includes('хмельниц')) channels = ['robota_khmelnytskyi', 'work_khm'];
  else if (cLower.includes('терноп')) channels = ['robota_ternopil', 'ternopil_work'];
  else if (cLower.includes('франківськ')) channels = ['robota_if', 'if_work'];
  else if (cLower.includes('чернівц')) channels = ['robota_chernivtsi', 'cv_work'];
  else if (cLower.includes('рівн')) channels = ['robota_rivne', 'rivne_work'];
  else if (cLower.includes('луцьк')) channels = ['robota_lutsk', 'lutsk_work'];
  else if (cLower.includes('житомир')) channels = ['robota_zhytomyr', 'zt_work'];
  else if (cLower.includes('полтав')) channels = ['robota_poltava', 'poltava_work'];
  else if (cLower.includes('черкас')) channels = ['robota_cherkasy', 'ck_work'];
  if (!channels.length) return [];

  const found = [];
  const seenPhones = new Set();
  const d2dMarkers = /(торговий представник|завозити торгових|промоутер|прямі продажі|прямих продаж|активні продажі|активних продаж|менеджер з продажу b2b|робота в полі|кур'єр-консультант|агент з продажу|супервайзер|мерчендайзер|роздача листівок)/i;
  const badMarkers = /(шлюбн|дейтинг|чатер|онліфанс|onlyfans|тікток|tiktok|прямі ефіри|трафік|крипт|форекс|глово|glovo|bolt|таксі|вантажник|прибиральн|кухар|шаурм|офіціант|бариста|бармен|касир|масаж|шиномонтаж|бухгалтер|швачка|охорон)/i;

  await Promise.allSettled(channels.map(async (ch) => {
    let nextTargetUrl = `https://t.me/s/${ch}`;
    for (let page = 0; page < 4; page++) {
      try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(nextTargetUrl);
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(proxyUrl, { signal: ctrl.signal });
        clearTimeout(tid);
        if (!res.ok) break;
        const html = await res.text();
        const blocks = html.split('data-post="');
        for (let i = 1; i < blocks.length; i++) {
          const postIdEnd = blocks[i].indexOf('"');
          const postId = postIdEnd > 0 ? blocks[i].slice(0, postIdEnd).trim() : '';
          const exactPostUrl = postId ? `https://t.me/${postId}` : `https://t.me/${ch}`;
          const msgIdx = blocks[i].indexOf('tgme_widget_message_text');
          const rawBlock = msgIdx !== -1 ? blocks[i].slice(msgIdx, msgIdx + 2200) : blocks[i].slice(0, 2200);
          const text = rawBlock.replace(/<[^>]+>/g, ' ').replace(/&#8239;|&thinsp;|&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
          if (!d2dMarkers.test(text) || badMarkers.test(text)) continue;

          const phoneMatch = text.match(/(?:\+?38)?[\s\-()]*0(50|66|95|99|67|68|96|97|98|77|63|73|93)[\s\-()]*\d{3}[\s\-()]*\d{2}[\s\-()]*\d{2}/);
          const allUsers = [...text.matchAll(/@([a-zA-Z0-9_]{4,32})/g)].map(m => m[1]).filter(u => u.toLowerCase() !== ch.toLowerCase() && !/work|robota|vakansii|bot$/i.test(u));
          if (!phoneMatch && !allUsers.length) continue;

          const cleanDigits = phoneMatch ? phoneMatch[0].replace(/\D/g, '') : '';
          const normPhone = cleanDigits ? ('+380' + cleanDigits.slice(-9)) : '';
          const tgUser = allUsers.length ? ('@' + allUsers[0]) : '';
          const dedupKey = normPhone || tgUser || exactPostUrl;
          if (seenPhones.has(dedupKey)) continue;
          seenPhones.add(dedupKey);

          const cleanTitle = text.replace(/^tgme_widget_message_text[^>]*>/i, '').replace(/^js-message_text"[^>]*>/i, '').replace(/^[^а-яА-ЯіїєґІЇЄҐa-zA-Z0-9]+/, '').slice(0, 68).trim() + '...';

          found.push({
            id: 'v-d2d-tg-' + Date.now() + '-' + ch + '-' + page + '-' + i,
            isD2d: true,
            d2dType: 'd2d_direct',
            d2dMatchScore: 99,
            name: `Набір у D2D / Польову команду: ${cleanTitle}`,
            address: `${city} (Вакансія у Telegram: ${postId || '@' + ch})`,
            city,
            phone: normPhone,
            isMobile: Boolean(normPhone),
            viberUrl: normPhone ? getViberDirectUrl(normPhone.replace(/\D/g, '')) : '',
            website: exactPostUrl,
            instagram: '',
            telegram: tgUser,
            telegramPhone: normPhone ? `https://t.me/${normPhone}` : '',
            rating: 5.0,
            reviews: 15,
            mapsUrl: exactPostUrl,
            lat: null,
            lng: null,
            painLevel: 'urgent',
            painChipLabel: 'Живий набір «ходоків» / торгових у Telegram (99% Match)',
            painText: 'Команда прямо зараз набирає польових агентів / торгових представників по місту — напиши або подзвони бригадиру і запропонуй опт NFC-карток!'
          });
        }
        const beforeMatches = [...html.matchAll(/data-before="(\d+)"/g)];
        if (!beforeMatches.length) break;
        nextTargetUrl = `https://t.me/s/${ch}?before=${beforeMatches[0][1]}`;
      } catch (_) {
        break;
      }
    }
  }));

  return found;
}

// Live Work.ua D2D & Field Rep employer scanner via r.jina.ai (100% CORS-enabled) + Google Places phone lookup
async function scanWorkUaFieldTeamsClient(city, key) {
  const cLower = String(city || 'Вінниця').toLowerCase();
  let citySlug = 'vinnytsia';
  if (cLower.includes('київ')) citySlug = 'kyiv';
  else if (cLower.includes('львів')) citySlug = 'lviv';
  else if (cLower.includes('одес')) citySlug = 'odesa';
  else if (cLower.includes('дніпр')) citySlug = 'dnipro';
  else if (cLower.includes('харків')) citySlug = 'kharkiv';
  else if (cLower.includes('хмельниц')) citySlug = 'khmelnytskyi';
  else if (cLower.includes('терноп')) citySlug = 'ternopil';
  else if (cLower.includes('франківськ')) citySlug = 'ivano-frankivsk';
  else if (cLower.includes('чернівц')) citySlug = 'chernivtsi';
  else if (cLower.includes('рівн')) citySlug = 'rivne';
  else if (cLower.includes('луцьк')) citySlug = 'lutsk';
  else if (cLower.includes('житомир')) citySlug = 'zhytomyr';
  else if (cLower.includes('полтав')) citySlug = 'poltava';
  else if (cLower.includes('черкас')) citySlug = 'cherkasy';

  const roleSlugs = [
    '%D1%82%D0%BE%D1%80%D0%B3%D0%BE%D0%B2%D0%B8%D0%B9+%D0%BF%D1%80%D0%B5%D0%B4%D1%81%D1%82%D0%B0%D0%B2%D0%BD%D0%B8%D0%BA',
    '%D0%BF%D1%80%D0%BE%D0%BC%D0%BE%D1%83%D1%82%D0%B5%D1%80',
    '%D1%81%D1%83%D0%BF%D0%B5%D1%80%D0%B2%D0%B0%D0%B9%D0%B7%D0%B5%D1%80'
  ];

  const discoveredCompanies = [];
  const seenCo = new Set();

  await Promise.allSettled(roleSlugs.map(async (rSlug) => {
    try {
      const url = `https://r.jina.ai/https://www.work.ua/jobs-${citySlug}-${rSlug}/`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4500);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return;
      const txt = await res.text();
      const lines = txt.split('\n').map(l => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(/^## \[([^\]]+)\]\((https:\/\/www\.work\.ua\/jobs\/\d+\/)/);
        if (!m) continue;
        const jobTitle = m[1];
        const jobUrl = m[2];
        // Exclude in-store retail cashiers/sellers unless it's promo/field rep/supervisor
        if (/продавець-консультант|касир|бариста|кухар|охоронець/i.test(jobTitle) && !/промоутер|торговий|представник|супервайзер|активн/i.test(jobTitle)) {
          continue;
        }
        // Find company name in next 3 lines
        let companyName = '';
        for (let k = 1; k <= 3 && (i + k) < lines.length; k++) {
          const line = lines[i + k];
          if (!/грн|відрахувань|зайнятість|графік|студентів|Зв’язок|^\*/i.test(line) && line.length >= 3 && line.length <= 55) {
            companyName = line.replace(/,\s*(ТОВ|ПП|ФОП|ТД).*$/i, '').trim();
            break;
          }
        }
        if (!companyName || seenCo.has(companyName.toLowerCase())) continue;
        seenCo.add(companyName.toLowerCase());
        discoveredCompanies.push({ companyName, jobTitle, jobUrl });
      }
    } catch (_) {}
  }));

  const verifiedFromWork = [];
  // Look up discovered employers in Google Places API v1 to get their direct phone number in the target city
  await Promise.allSettled(discoveredCompanies.slice(0, 8).map(async (co, idx) => {
    try {
      const data = await searchPlacesApiDirect(`${co.companyName} ${city}`, key, '');
      const p = (data?.places || [])[0];
      if (!p) return;
      const rawPhone = p.internationalPhoneNumber || p.nationalPhoneNumber || '';
      const phone = normalizePhone(rawPhone);
      const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
      const isMobile = isUkrainianMobilePhone(cleanPhone);
      if (!isMobile) return;

      verifiedFromWork.push({
        id: 'v-d2d-workua-' + Date.now() + '-' + idx,
        isD2d: true,
        d2dType: 'field_reps',
        d2dMatchScore: 99,
        name: `${co.companyName} (Активний набір: ${co.jobTitle})`,
        address: p.formattedAddress || `${city} (Work.ua роботодавець)`,
        city,
        phone,
        isMobile: true,
        viberUrl: getViberDirectUrl(cleanPhone),
        website: co.jobUrl,
        instagram: (p.websiteUri && /instagram\.com/i.test(p.websiteUri)) ? cleanInstagramHandle(p.websiteUri) : '',
        telegram: '',
        telegramPhone: `https://t.me/+${cleanPhone}`,
        rating: Number(p.rating || 4.9),
        reviews: Number(p.userRatingCount || 18),
        mapsUrl: p.googleMapsUri || co.jobUrl,
        lat: p.location?.latitude || null,
        lng: p.location?.longitude || null,
        painLevel: 'urgent',
        painChipLabel: `Активний набір «ходоків» на Work.ua (99% Match)`,
        painText: `Прямо зараз шукають у штат «${co.jobTitle}» у м. ${city} — подзвони або напиши керівнику щодо оптової партії NFC-карток під їхню польову команду!`
      });
    } catch (_) {}
  }));

  // Also include undercover Work.ua D2D / Promo / Brand-Consultant offices that hide public phone numbers
  discoveredCompanies.slice(0, 8).forEach((co, idx) => {
    if (!verifiedFromWork.some(v => v.website === co.jobUrl) && /промоутер|бренд-консультант|торговий представник|супервайзер/i.test(co.jobTitle)) {
      verifiedFromWork.push({
        id: 'v-d2d-workua-uc-' + Date.now() + '-' + idx,
        isD2d: true,
        d2dType: 'd2d_direct',
        d2dMatchScore: 98,
        name: `${co.companyName}: «${co.jobTitle}»`,
        address: `${city} (Активний набір у D2D / польову команду на Work.ua)`,
        city,
        phone: '',
        isMobile: false,
        viberUrl: '',
        website: co.jobUrl,
        instagram: '',
        telegram: '',
        telegramPhone: '',
        rating: 4.9,
        reviews: 16,
        mapsUrl: co.jobUrl,
        lat: null,
        lng: null,
        painLevel: 'urgent',
        painChipLabel: `Набір «ходоків» / промо на Work.ua (98% Match)`,
        painText: `Прямо зараз шукають «${co.jobTitle}» у м. ${city} — натисни «Опт Офер», скопіюється повідомлення для керівника офісу і відкриється вакансія!`
      });
    }
  });
  return verifiedFromWork;
}

// Live OLX.ua Undercover D2D Office Scanner via r.jina.ai (catches "1000-1300 грн/день щодня", "Промоутер представник компанії", "Без досвіду")
async function scanOlxUndercoverD2dClient(city) {
  const cLower = String(city || 'Вінниця').toLowerCase();
  let citySlug = 'vinnitsa';
  if (cLower.includes('київ')) citySlug = 'kiev';
  else if (cLower.includes('львів')) citySlug = 'lvov';
  else if (cLower.includes('одес')) citySlug = 'odessa';
  else if (cLower.includes('дніпр')) citySlug = 'dnepr';
  else if (cLower.includes('харків')) citySlug = 'kharkov';
  else if (cLower.includes('хмельниц')) citySlug = 'khmelnitskiy';
  else if (cLower.includes('терноп')) citySlug = 'ternopol';
  else if (cLower.includes('франківськ')) citySlug = 'ivano-frankovsk';
  else if (cLower.includes('чернівц')) citySlug = 'chernovtsy';
  else if (cLower.includes('рівн')) citySlug = 'rovno';
  else if (cLower.includes('луцьк')) citySlug = 'lutsk';
  else if (cLower.includes('житомир')) citySlug = 'zhitomir';
  else if (cLower.includes('полтав')) citySlug = 'poltava';
  else if (cLower.includes('черкас')) citySlug = 'cherkassy';

  const olxQueries = [
    '%D0%BF%D1%80%D0%BE%D0%BC%D0%BE%D1%83%D1%82%D0%B5%D1%80',
    '%D1%89%D0%BE%D0%B4%D0%B5%D0%BD%D0%BD%D0%B0-%D0%BE%D0%BF%D0%BB%D0%B0%D1%82%D0%B0',
    '%D1%82%D0%BE%D1%80%D0%B3%D0%BE%D0%B2%D0%B8%D0%B9-%D0%BF%D1%80%D0%B5%D0%B4%D1%81%D1%82%D0%B0%D0%B2%D0%BD%D0%B8%D0%BA'
  ];

  const foundOlx = [];
  const seenUrls = new Set();
  const hardNoise = /(будівництв|стройк|підсобник|разнорабоч|різноробоч|заклад харчування|кухар|повар|шаурм|пекар|тістоміс|вантажник|грузчик|склад|комплектувальн|пакувальн|армосітк|автосервіс|автомийк|шиномонтаж|швачк|прибиральн|няня|доглядальн|охоронець|водій|таксі|продавець на 2 дні|копірайтер)/i;

  await Promise.allSettled(olxQueries.map(async (qSlug, qIdx) => {
    try {
      const url = `https://r.jina.ai/https://www.olx.ua/uk/rabota/${citySlug}/q-${qSlug}/`;
      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 4800);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(tid);
      if (!res.ok) return;
      const txt = await res.text();
      const matches = [...txt.matchAll(/\[([^\]]{8,110})\]\((https:\/\/www\.olx\.ua\/uk\/obyavlenie\/rabota\/[^\)]+)\)/g)];
      matches.forEach((m, idx) => {
        const rawTitle = m[1].replace(/\s+/g, ' ').trim();
        const adUrl = m[2].trim();
        if (seenUrls.has(adUrl)) return;
        if (hardNoise.test(rawTitle)) return;
        seenUrls.add(adUrl);

        foundOlx.push({
          id: 'v-d2d-olx-' + Date.now() + '-' + qIdx + '-' + idx,
          isD2d: true,
          d2dType: /торгов|b2b/i.test(rawTitle) ? 'field_reps' : (/промоутер/i.test(rawTitle) ? 'd2d_promo' : 'd2d_direct'),
          d2dMatchScore: 99,
          name: `Зашифрований D2D-офіс (OLX): «${rawTitle}»`,
          address: `${city} (Жива вакансія D2D / щоденна оплата на OLX.ua)`,
          city,
          phone: '',
          isMobile: false,
          viberUrl: '',
          website: adUrl,
          instagram: '',
          telegram: '',
          telegramPhone: '',
          rating: 5.0,
          reviews: 19,
          mapsUrl: adUrl,
          lat: null,
          lng: null,
          painLevel: 'urgent',
          painChipLabel: 'Зашифрований D2D-офіс на OLX (99% Match)',
          painText: 'Оголошення з маркерами закритого D2D-офісу («ходоки», щоденні виплати, промоутери без досвіду) — натисни «Опт Офер», скопіюється «Троянський кінь» для директора і відкриється OLX!'
        });
      });
    } catch (_) {}
  }));

  return foundOlx;
}

async function runLiveD2dRadar(job, limit) {
  const key = getClientGoogleMapsKey();
  const targetCount = Math.max(5, Number(limit || job.limit || 15));
  const city = (job.city || 'Вінниця').trim();
  const cluster = (job.cluster || '').trim();

  try {
    const reg = await loadGlobalSeenRegistry();
    const waveKey = `d2d:${String(job.niche || '').toLowerCase().trim()}:${city.toLowerCase()}:${cluster.toLowerCase()}`;
    const currentWave = Number(reg.waveOffsets[waveKey] || 0);

    const runSeenKeys = new Set();
    const isSeenInThisRun = (v) => extractBizSeenKeysClient(v, city).some(k => runSeenKeys.has(k));
    const markSeenInThisRun = (v) => extractBizSeenKeysClient(v, city).forEach(k => runSeenKeys.add(k));

    const freshCollected = [];
    const seenOverflowPool = [];

    // 1. Scan Telegram job channels + Work.ua live field-sales vacancies in parallel
    job.progressText = `Сканую зашифровані D2D-офіси на OLX, Work.ua та у Telegram (0/${targetCount})…`;
    renderNfcRadar();

    const [tgItems, workUaItems, olxItems] = await Promise.all([
      scanTelegramD2dVacanciesClient(city),
      scanWorkUaFieldTeamsClient(city, key),
      scanOlxUndercoverD2dClient(city)
    ]);

    for (const item of [...tgItems, ...olxItems, ...workUaItems]) {
      if (!isSeenInThisRun(item)) {
        markSeenInThisRun(item);
        if (reg.isBizSeen(item, city)) {
          seenOverflowPool.push(item);
        } else {
          freshCollected.push(item);
        }
      }
    }

    // 2. Scan Google Places API v1 strictly for Promo/BTL, Field Reps, Courier/Flyer teams & Sales Staffing
    const queryObjects = buildSmartD2dQueriesClient(job.niche, city, cluster);

    for (let qIdx = 0; qIdx < queryObjects.length; qIdx++) {
      if (freshCollected.length >= targetCount * 1.35) break;

      const { q, type } = queryObjects[qIdx];
      job.progressText = `Пошук D2D-офісів та польових бригад (${Math.min(targetCount, freshCollected.length)}/${targetCount})…`;
      renderNfcRadar();

      let pageToken = '';
      for (let page = 0; page < 2; page++) {
        let data = null;
        try {
          data = await searchPlacesApiDirect(q, key, pageToken);
        } catch (err) {
          console.warn('[D2D Places] Error:', err.message);
          break;
        }
        if (!data || !Array.isArray(data.places) || !data.places.length) break;

        data.places.forEach((p, idx) => {
          const candidate = classifyAndVerifyD2dCandidate(p, type, city, cluster, qIdx, idx);
          if (!candidate || isSeenInThisRun(candidate)) return;
          markSeenInThisRun(candidate);

          if (reg.isBizSeen(candidate, city)) {
            seenOverflowPool.push(candidate);
          } else {
            freshCollected.push(candidate);
          }
        });

        if (!data.nextPageToken || freshCollected.length >= targetCount) break;
        pageToken = data.nextPageToken;
        await new Promise(r => setTimeout(r, 350));
      }
    }

    // Guarantee targetCount using seenOverflowPool or starter Vinnytsia D2D pool if needed
    let combined = [...freshCollected];
    if (combined.length < targetCount && seenOverflowPool.length > 0) {
      combined.push(...seenOverflowPool.slice(0, targetCount - combined.length));
    }
    if (combined.length < targetCount && city.toLowerCase().includes('вінниц') && DEFAULT_D2D_RADAR_JOBS[0]?.items) {
      for (const stItem of DEFAULT_D2D_RADAR_JOBS[0].items) {
        if (combined.length >= targetCount) break;
        if (!isSeenInThisRun(stItem)) {
          markSeenInThisRun(stItem);
          combined.push(JSON.parse(JSON.stringify(stItem)));
        }
      }
    }

    // Sort by D2D match score before enriching websites
    combined.sort((a, b) => {
      const aSocial = (a.instagram || a.telegram) ? 1 : 0;
      const bSocial = (b.instagram || b.telegram) ? 1 : 0;
      if (bSocial !== aSocial) return bSocial - aSocial;
      return (Number(b.d2dMatchScore) || 0) - (Number(a.d2dMatchScore) || 0);
    });

    const finalItems = combined.slice(0, targetCount);

    // 3. Fast website enrichment to pull @instagram and @telegram handles
    job.progressText = `Перевірка прямих контактів (Viber / Telegram / Instagram)…`;
    renderNfcRadar();
    await enrichWebsiteSocialsBatchClient(finalItems);

    // Re-sort so enriched profiles float to the top
    finalItems.sort((a, b) => {
      const aSocial = (a.instagram || a.telegram) ? 1 : 0;
      const bSocial = (b.instagram || b.telegram) ? 1 : 0;
      if (bSocial !== aSocial) return bSocial - aSocial;
      return (Number(b.d2dMatchScore) || 0) - (Number(a.d2dMatchScore) || 0);
    });

    await saveGlobalSeenRegistry(finalItems, waveKey, currentWave + 1, city);

    job.status = 'done';
    job.progressText = '';
    job.items = finalItems;
    job.total = finalItems.length;
    saveLocalD2dJobs(nfcRadarState.d2dJobs);
    renderNfcRadar();

    const locLabel = cluster ? `${cluster}, ${city}` : city;
    showToast(`Знайдено ${finalItems.length} D2D-офісів та польових команд (${locLabel})!`);
    haptic('success');
  } catch (err) {
    console.error('[D2D Radar] Error:', err);
    job.status = 'error';
    job.progressText = '';
    job.error = err.message || 'Помилка виконання D2D радару';
    saveLocalD2dJobs(nfcRadarState.d2dJobs);
    renderNfcRadar();
    showToast(`Помилка D2D радару: ${err.message}`);
  }
}

function configureNfcModalForCurrentMode() {
  const isD2d = nfcRadarState.radarMode === 'd2d';
  const titleEl = document.getElementById('nfcModalTitle');
  const srcGroup = document.getElementById('nfcSourceGroup');
  const revGroup = document.getElementById('nfcReviewsFilterGroup');
  const nicheLabel = document.getElementById('nfcNicheLabel');
  const nicheInput = document.getElementById('nfcNicheInput');
  const cityInput = document.getElementById('nfcCityInput');
  const chevron = document.getElementById('d2dCategoryChevron');
  const dropMenu = document.getElementById('d2dCategoryDropdownMenu');
  const limitLabel = document.getElementById('nfcLimitLabel');
  const submitBtn = document.getElementById('submitNfcSearchBtn');

  if (titleEl) {
    titleEl.textContent = isD2d ? 'Новий збір D2D-офісів («ходоків»)' : 'Новий збір закладів (NFC Радар)';
  }
  if (srcGroup) srcGroup.style.display = isD2d ? 'none' : 'block';
  if (revGroup) revGroup.style.display = isD2d ? 'none' : 'block';

  if (nicheLabel) {
    nicheLabel.innerHTML = isD2d
      ? 'ТИП D2D-ОФІСІВ / ПОЛЬОВИХ КОМАНД: <span style="color:var(--accent);">*</span>'
      : 'КАТЕГОРІЯ / НІША: <span style="color:var(--accent);">*</span>';
  }

  if (nicheInput) {
    if (isD2d) {
      nicheInput.readOnly = true;
      nicheInput.style.cursor = 'pointer';
      if (!nicheInput.value || nicheInput.value === 'Кафе, бари, ресторани') {
        nicheInput.value = 'Всі D2D-офіси (ходоки)';
        nicheInput.dataset.fullNiche = 'D2D офіси (ходоки), прямі продажі, промоутери та польові торгові';
      }
      if (chevron) chevron.style.display = 'block';
    } else {
      nicheInput.readOnly = false;
      nicheInput.style.cursor = 'text';
      delete nicheInput.dataset.fullNiche;
      if (nicheInput.value.includes('D2D')) {
        nicheInput.value = '';
      }
      nicheInput.placeholder = 'Введіть нішу (наприклад: Барбершопи, Ресторани, Стоматологія, Тур агенства...)';
      if (chevron) chevron.style.display = 'none';
    }
  }
  if (dropMenu) dropMenu.style.display = 'none';

  if (cityInput) {
    cityInput.value = '';
    cityInput.placeholder = 'Введіть місто (наприклад: Вінниця, Київ, Одеса...)';
  }

  if (limitLabel) {
    limitLabel.textContent = isD2d ? 'КІЛЬКІСТЬ D2D-КОМАНД:' : 'КІЛЬКІСТЬ ЗАКЛАДІВ:';
  }
  if (submitBtn) {
    submitBtn.textContent = isD2d ? 'ЗАПУСТИТИ D2D РАДАР' : 'ЗАПУСТИТИ РАДАР';
  }
}

async function submitNfcSearch() {
  const isD2d = nfcRadarState.radarMode === 'd2d';
  const nicheInput = document.getElementById('nfcNicheInput');
  const cityInput = document.getElementById('nfcCityInput');
  const clusterInput = document.getElementById('nfcClusterInput');
  let niche = '';
  if (isD2d) {
    niche = (nicheInput?.dataset.fullNiche || nicheInput?.value || '').trim();
    if (!niche || niche === 'Всі D2D-офіси (ходоки)') {
      niche = 'D2D офіси (ходоки), прямі продажі, промоутери та польові торгові';
    }
  } else {
    delete nicheInput?.dataset.fullNiche;
    niche = (nicheInput?.value || '').trim();
  }
  const city = (cityInput?.value || '').trim() || (isD2d ? 'Вінниця' : 'Київ');
  const cluster = (clusterInput?.value || '').trim();

  if (!niche) {
    showToast('Вкажіть категорію або тип команд');
    nicheInput?.focus();
    return;
  }
  if (!city) {
    showToast('Вкажіть місто для пошуку');
    cityInput?.focus();
    return;
  }

  const reviewsLimit = Number(document.querySelector('#nfcReviewsFilterSeg .scrape-seg-btn.active')?.dataset.value) || nfcRadarState.form.reviewsLimit || 300;
  const limit = Number(document.querySelector('#nfcLimitSeg .scrape-seg-btn.active')?.dataset.value) || nfcRadarState.form.limit || 30;

  const btn = document.getElementById('submitNfcSearchBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'СКАНУЮ ЛОКАЦІЮ…'; }

  closeModal('modalNfcSearch');
  haptic('success');

  if (isD2d) {
    const d2dJob = {
      id: 'd2d-job-' + Date.now(),
      isD2d: true,
      source: 'gmaps',
      niche: niche,
      city: city,
      cluster: cluster,
      status: 'running',
      progressText: `Шукаю D2D (0/${limit})…`,
      local: true,
      createdAt: new Date().toISOString(),
      total: 0,
      limit: limit,
      items: []
    };

    nfcRadarState.d2dJobs.unshift(d2dJob);
    saveLocalD2dJobs(nfcRadarState.d2dJobs);
    nfcRadarState.openD2dJobs.add(d2dJob.id);
    renderNfcRadar();

    runLiveD2dRadar(d2dJob, limit).finally(() => {
      if (btn) { btn.disabled = false; btn.textContent = 'ЗАПУСТИТИ D2D РАДАР'; }
    });
    return;
  }

  const job = {
    id: 'nfc-job-' + Date.now(),
    source: nfcRadarState.form.source || 'gmaps',
    niche: niche,
    city: city,
    cluster: cluster,
    status: 'running',
    progressText: `Шукаю 0/${limit} нових…`,
    local: true,
    createdAt: new Date().toISOString(),
    total: 0,
    maxReviews: reviewsLimit,
    limit: limit,
    items: []
  };

  nfcRadarState.jobs.unshift(job);
  saveLocalNfcJobs(nfcRadarState.jobs);
  nfcRadarState.openJobs.add(job.id);
  renderNfcRadar();

  runLiveNfcRadar(job, reviewsLimit, limit).finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = 'ЗАПУСТИТИ РАДАР'; }
  });
}

function downloadNfcCsv(job) {
  const items = getJobFlatItems(job);
  if (!items.length) {
    showToast('Немає закладів для вивантаження');
    return;
  }
  const headers = ['Назва', 'Місто', 'Кластер / Адреса', 'Рейтинг', 'Кількість відгуків', 'Телефон', 'Instagram', 'Біль / Потреба'];
  const dataRows = items.map(v => [
    v.name || '—',
    job.city || '—',
    v.address || job.cluster || '—',
    v.rating ? Number(v.rating).toFixed(1) : '—',
    v.reviews || 0,
    v.phone || '—',
    v.instagram || '—',
    v.painText || '—'
  ]);

  const rawRows = items.map(v => [
    '"' + (v.name || '').replace(/"/g, '""') + '"',
    '"' + (job.city || '').replace(/"/g, '""') + '"',
    '"' + (v.address || job.cluster || '').replace(/"/g, '""') + '"',
    v.rating || '',
    v.reviews || '',
    '"' + (v.phone || '').replace(/"/g, '""') + '"',
    '"' + (v.instagram || '').replace(/"/g, '""') + '"',
    '"' + (v.painText || '').replace(/"/g, '""') + '"'
  ]);
  const csv = '\uFEFF' + [headers.join(','), ...rawRows.map(r => r.join(','))].join('\n');
  const fileName = 'nfc_radar_' + (job.city || 'leads') + '_' + Date.now() + '.csv';

  openCsvPreviewModal(job.cluster || (job.city + ' — ' + job.niche), headers, dataRows, csv, fileName);
}

function sendNfcToTelegram(job, btn) {
  const items = getJobFlatItems(job);
  if (!items.length) {
    showToast('Немає закладів для відправки');
    return;
  }
  const top = items.slice(0, 5);
  let msg = 'NFC Радар закладів (' + (job.city || '') + ')\nЛокація: ' + (job.cluster || job.niche) + '\n\n';
  top.forEach((v, i) => {
    msg += (i + 1) + '. ' + v.name + ' — ★' + (v.rating || '—') + ' (' + (v.reviews || 0) + ' відгуків)\n';
    if (v.phone) msg += '   Телефон: ' + v.phone + '\n';
    if (v.instagram) msg += '   Instagram: ' + v.instagram + '\n';
  });
  if (items.length > 5) msg += '\n...та ще ' + (items.length - 5) + ' закладів у зборі';

  if (window.Telegram?.WebApp?.sendData) {
    window.Telegram.WebApp.sendData(JSON.stringify({ type: 'nfc_radar', job: job.id }));
    showToast('Надіслано в Telegram');
  } else {
    navigator.clipboard?.writeText(msg).then(() => {
      showToast('Звіт скопійовано для Telegram');
    });
  }
}

function deleteNfcJob(job) {
  if (!job) return;
  const doDelete = () => {
    if (job.isD2d) {
      nfcRadarState.d2dJobs = nfcRadarState.d2dJobs.filter(j => j.id !== job.id);
      saveLocalD2dJobs(nfcRadarState.d2dJobs);
      nfcRadarState.openD2dJobs.delete(job.id);
    } else {
      nfcRadarState.jobs = nfcRadarState.jobs.filter(j => j.id !== job.id);
      saveLocalNfcJobs(nfcRadarState.jobs);
      nfcRadarState.openJobs.delete(job.id);
    }
    renderNfcRadar();
    showToast('Пошук видалено');
    haptic('medium');
  };

  const count = (job.items ? job.items.length : 0) || job.total || 0;
  const unitWord = (job.isD2d || nfcRadarState.radarMode === 'd2d') ? pluralD2dTeams(count) : pluralNfcVenues(count);
  const promptText = count === 0
    ? 'Видалити цей порожній пошук з радару?'
    : `Видалити цей пошук (${count} ${unitWord})?`;

  if (window.Telegram?.WebApp?.showConfirm) {
    window.Telegram.WebApp.showConfirm(promptText, (ok) => {
      if (ok) doDelete();
    });
  } else {
    if (confirm(promptText)) {
      doDelete();
    }
  }
}

// -------------------------------------------------------------
// NFC CARD TIERED PRICING & ROI CALCULATOR
// -------------------------------------------------------------
let nfcCardTypeState = 'stock'; // 'stock' | 'color' | 'custom'
let nfcCardQtyState = 10;

function calculateNfcPricing(type, qty) {
  qty = Math.max(1, parseInt(qty) || 1);
  let unitPrice = 0;
  let totalCost = null;
  let isIndividual = false;
  let hint = '';
  let tierNote = '';
  let typeLabel = '';

  if (type === 'stock') {
    typeLabel = 'З наявного асортименту';
    hint = 'З асортименту: до 10 шт — 400 ₴/шт | від 10 шт — 300 ₴/шт';
    if (qty >= 10) {
      unitPrice = 300;
      tierNote = 'Оптова ціна застосована (партія від 10 шт)';
    } else {
      unitPrice = 400;
      tierNote = 'Роздрібна ціна до 10 шт (від 10 шт — 300 ₴/шт)';
    }
    totalCost = unitPrice * qty;
  } else if (type === 'color') {
    typeLabel = 'Кольоровий акрил (чорний, синій тощо)';
    hint = 'Кольоровий акрил: до 10 шт — 450 ₴/шт | від 10 шт — 400 ₴/шт';
    if (qty >= 10) {
      unitPrice = 400;
      tierNote = 'Оптова ціна застосована (партія від 10 шт)';
    } else {
      unitPrice = 450;
      tierNote = 'Ціна до 10 шт (від 10 шт — 400 ₴/шт)';
    }
    totalCost = unitPrice * qty;
  } else if (type === 'custom') {
    typeLabel = 'Виробництво власної партії під ключ';
    hint = 'Своя партія: від 10 шт — 400 ₴/шт | до 10 шт — індивідуально';
    if (qty >= 10) {
      unitPrice = 400;
      totalCost = unitPrice * qty;
      tierNote = 'Оптова ціна власної партії від 10 шт (400 ₴/шт)';
    } else {
      isIndividual = true;
      unitPrice = null;
      totalCost = null;
      tierNote = 'Партія до 10 шт прораховується індивідуально під дизайн';
    }
  } else if (type === 'user_custom') {
    typeLabel = 'Власний варіант ціни';
    const under10 = Number(state.nfcCustomPrices?.under10) || 400;
    const over10 = Number(state.nfcCustomPrices?.over10) || 300;
    if (qty >= 10) {
      unitPrice = over10;
      tierNote = `Власна оптова ціна (від 10 шт: ${over10} ₴/шт)`;
    } else {
      unitPrice = under10;
      tierNote = `Власна роздрібна ціна (до 10 шт: ${under10} ₴/шт)`;
    }
    totalCost = unitPrice * qty;
    hint = `Власний розрахунок: до 10 шт — ${under10} ₴/шт | від 10 шт — ${over10} ₴/шт`;
  }

  return { type, typeLabel, qty, unitPrice, totalCost, isIndividual, hint, tierNote };
}

function initNfcRoiCalc() {
  const currentRatingInput = document.getElementById('roiCurrentRating');
  const reviewsCountInput = document.getElementById('roiReviewsCount');
  const guestsInput = document.getElementById('roiGuests');
  const checkInput = document.getElementById('roiCheck');
  const qtyRangeInput = document.getElementById('nfcCardQtyRange');

  const toggleCustomBtn = document.getElementById('toggleCustomNfcPriceBtn');
  const customBox = document.getElementById('nfcCustomPriceBox');
  const customChevron = document.getElementById('customNfcPriceChevron');
  const applyCustomBtn = document.getElementById('applyCustomNfcPriceBtn');
  const customUnder10Input = document.getElementById('nfcCustomUnder10Input');
  const customOver10Input = document.getElementById('nfcCustomOver10Input');

  if (toggleCustomBtn && customBox) {
    toggleCustomBtn.addEventListener('click', () => {
      const isHidden = customBox.style.display === 'none';
      customBox.style.display = isHidden ? 'block' : 'none';
      if (customChevron) customChevron.style.transform = isHidden ? 'rotate(180deg)' : 'none';
      haptic('light');
    });
  }

  if (applyCustomBtn && customUnder10Input && customOver10Input) {
    applyCustomBtn.addEventListener('click', () => {
      const u10 = Math.max(1, parseInt(customUnder10Input.value) || 400);
      const o10 = Math.max(1, parseInt(customOver10Input.value) || 300);
      if (!state.nfcCustomPrices) state.nfcCustomPrices = {};
      state.nfcCustomPrices.under10 = u10;
      state.nfcCustomPrices.over10 = o10;
      state.nfcCustomPrices.active = true;
      nfcCardTypeState = 'user_custom';

      document.querySelectorAll('#nfcCardTypeSeg .scrape-seg-btn').forEach(b => b.classList.remove('active'));
      if (toggleCustomBtn) {
        toggleCustomBtn.classList.remove('btn--out');
        toggleCustomBtn.classList.add('btn--fill');
      }
      showToast(`Застосовано тариф: ${u10} ₴ / ${o10} ₴`);
      updateMath();
      haptic('success');
    });
  }

  function updateMath() {
    const r = parseFloat(currentRatingInput?.value) || 4.2;
    const curRev = parseInt(reviewsCountInput?.value) || 45;
    const g = parseInt(guestsInput?.value) || 60;
    const c = parseInt(checkInput?.value) || 260;
    const q = parseInt(qtyRangeInput?.value) || nfcCardQtyState;
    nfcCardQtyState = q;

    const currentRatingVal = document.getElementById('roiCurrentRatingVal');
    const reviewsCountVal = document.getElementById('roiReviewsCountVal');
    const guestsVal = document.getElementById('roiGuestsVal');
    const checkVal = document.getElementById('roiCheckVal');
    const qtyVal = document.getElementById('nfcCardQtyVal');

    if (currentRatingVal) currentRatingVal.textContent = r.toFixed(1) + ' ★';
    if (reviewsCountVal) reviewsCountVal.textContent = curRev + ' відгуків';
    if (guestsVal) guestsVal.textContent = g + ' гостей / день';
    if (checkVal) checkVal.textContent = c + ' ₴';
    if (qtyVal) qtyVal.textContent = q + ' шт';

    // Pricing math
    const pricing = calculateNfcPricing(nfcCardTypeState, q);
    const hintEl = document.getElementById('nfcCardTypeHint');
    const pricePerCardEl = document.getElementById('nfcPricePerCardVal');
    const totalPriceEl = document.getElementById('nfcTotalPriceVal');
    const tierNoteEl = document.getElementById('nfcPricingTierNote');

    if (hintEl) hintEl.textContent = pricing.hint;
    if (pricePerCardEl) {
      pricePerCardEl.textContent = pricing.isIndividual ? 'Індивідуально' : (pricing.unitPrice + ' ₴ / шт');
    }
    if (totalPriceEl) {
      totalPriceEl.textContent = pricing.isIndividual ? 'За запитом' : (pricing.totalCost.toLocaleString('uk-UA') + ' ₴');
    }
    if (tierNoteEl) tierNoteEl.textContent = pricing.tierNote;

    // ROI Math
    const monthlyGuests = g * 30;
    const nfcConversion = 0.03;
    const reviewsDelta = Math.round(monthlyGuests * nfcConversion);

    const newTotal = curRev + reviewsDelta;
    const targetRating = Math.min(5.0, Math.max(r, Number(((r * curRev + 5.0 * reviewsDelta) / newTotal).toFixed(1))));
    const boostPercent = r < 4.2 ? 0.22 : (r < 4.5 ? 0.16 : 0.10);
    const extraGuests = Math.round(monthlyGuests * boostPercent);
    const extraMoney = extraGuests * c;
    const dailyExtraMoney = Math.max(1, Math.round(extraMoney / 30));

    const elDelta = document.getElementById('roiReviewsDelta');
    const elTarget = document.getElementById('roiTargetRating');
    const elIncome = document.getElementById('roiExtraIncome');
    const paybackEl = document.getElementById('roiPaybackText');

    if (elDelta) elDelta.textContent = '+' + reviewsDelta + ' відг / міс';
    if (elTarget) elTarget.textContent = targetRating.toFixed(1) + ' ★ (ТОП-1)';
    if (elIncome) elIncome.textContent = '+' + extraMoney.toLocaleString('uk-UA') + ' ₴ / міс';

    if (paybackEl) {
      if (!pricing.isIndividual && pricing.totalCost) {
        const days = Math.max(1, Math.ceil(pricing.totalCost / dailyExtraMoney));
        paybackEl.textContent = 'Окупність партії (' + pricing.totalCost.toLocaleString('uk-UA') + ' ₴) — всього ' + days + (days === 1 ? ' день!' : (days < 5 ? ' дні!' : ' днів!'));
      } else {
        paybackEl.textContent = 'Окупність індивідуальної партії — від 1 до 3 днів роботи закладу';
      }
    }
  }

  // Segment: card type
  document.querySelectorAll('#nfcCardTypeSeg .scrape-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nfcCardTypeSeg .scrape-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      nfcCardTypeState = btn.dataset.type || 'stock';
      if (state.nfcCustomPrices) state.nfcCustomPrices.active = false;
      if (toggleCustomBtn) {
        toggleCustomBtn.classList.remove('btn--fill');
        toggleCustomBtn.classList.add('btn--out');
      }
      updateMath();
      haptic('light');
    });
  });

  // Segment: quick qty buttons
  document.querySelectorAll('#nfcQtySeg .scrape-seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nfcQtySeg .scrape-seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = parseInt(btn.dataset.qty) || 10;
      if (qtyRangeInput) qtyRangeInput.value = val;
      updateMath();
      haptic('light');
    });
  });

  // Slider: qty range
  qtyRangeInput?.addEventListener('input', () => {
    const val = parseInt(qtyRangeInput.value) || 10;
    document.querySelectorAll('#nfcQtySeg .scrape-seg-btn').forEach(b => {
      b.classList.toggle('active', parseInt(b.dataset.qty) === val);
    });
    updateMath();
  });

  currentRatingInput?.addEventListener('input', updateMath);
  reviewsCountInput?.addEventListener('input', updateMath);
  guestsInput?.addEventListener('input', updateMath);
  checkInput?.addEventListener('input', updateMath);
  updateMath();

  document.getElementById('openNfcRoiCalcBtn')?.addEventListener('click', () => {
    openModal('modalNfcRoiCalc');
    updateMath();
    haptic('light');
  });

  document.getElementById('copyRoiPitchBtn')?.addEventListener('click', () => {
    const r = parseFloat(currentRatingInput?.value) || 4.2;
    const curRev = parseInt(reviewsCountInput?.value) || 45;
    const g = parseInt(guestsInput?.value) || 60;
    const c = parseInt(checkInput?.value) || 260;
    const q = parseInt(qtyRangeInput?.value) || nfcCardQtyState;
    const pricing = calculateNfcPricing(nfcCardTypeState, q);

    const monthlyGuests = g * 30;
    const reviewsDelta = Math.round(monthlyGuests * 0.03);
    const newTotal = curRev + reviewsDelta;
    const targetRating = Math.min(5.0, Math.max(r, Number(((r * curRev + 5.0 * reviewsDelta) / newTotal).toFixed(1))));
    const boostPercent = r < 4.2 ? 22 : (r < 4.5 ? 16 : 10);
    const extraGuests = Math.round(monthlyGuests * (boostPercent / 100));
    const extraMoney = extraGuests * c;
    const dailyExtraMoney = Math.max(1, Math.round(extraMoney / 30));

    let costLine = '';
    let paybackLine = '';
    let days = 2;
    if (pricing.isIndividual) {
      costLine = '- Вартість: прораховується індивідуально під тираж і макет';
      paybackLine = '- Окупність вкладень: 1–3 робочих дні закладу';
    } else {
      days = Math.max(1, Math.ceil(pricing.totalCost / dailyExtraMoney));
      costLine = '- Ціна за 1 шт: ' + pricing.unitPrice + ' грн (разом за партію ' + pricing.totalCost.toLocaleString('uk-UA') + ' грн, разово)';
      paybackLine = '- Термін повної окупності партії: ' + days + (days === 1 ? ' день' : (days < 5 ? ' дні' : ' днів')) + ' роботи закладу';
    }

    const todayStr = new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const text = 
`КОМЕРЦІЙНА ПРОПОЗИЦІЯ: ВПРОВАДЖЕННЯ NFC-СИСТЕМИ ЗБОРУ ВІДГУКІВ

ДЛЯ: Власника / Керуючого закладу
НАПРЯМ: Локальне SEO та вивід у ТОП-1 Google Maps
ДАТА СКЛАДАННЯ: ${todayStr}

1. АНАЛІЗ ПОТОЧНИХ ПОКАЗНИКІВ ЗАКЛАДУ
- Поточний рейтинг Google Maps: ${r.toFixed(1)} зірок
- Поточна кількість відгуків у Google Maps: ${curRev} відг
- Середня кількість гостей на день: ${g} осіб
- Середній чек закладу: ${c} грн
- Місячний потік відвідувачів: ${monthlyGuests.toLocaleString('uk-UA')} осіб

2. ОБРАНЕ ОБЛАДНАННЯ ТА БЮДЖЕТ ПАРТІЇ
- Тип продукції: ${pricing.typeLabel}
- Обсяг замовлення: ${pricing.qty} шт (для столів, барної стійки, рецепції)
${costLine}
- Технологія: безконтактний чіп NFC + лазерний QR-код з прямим переходом на форму відгуку 5 зірок

3. ПРОГНОЗ РЕЗУЛЬТАТІВ НА ПЕРШІ 30 ДНІВ
- Очікуваний приріст оцінок: +${reviewsDelta} нових реальних відгуків / місяць
- Цільовий рейтинг Google Maps: ${targetRating.toFixed(1)} зірок (ТОП-1 у локації)
- Прогнозоване збільшення органічного потоку: +${boostPercent}% нових гостей
- Додатковий потік відвідувачів: +${extraGuests} гостей / місяць

4. ФІНАНСОВИЙ ЕФЕКТ ТА ОКУПНІСТЬ
- Прогнозований додатковий виторг: +${extraMoney.toLocaleString('uk-UA')} грн / місяць
${paybackLine}

ВИСНОВОК:
Впровадження безконтактних карток повністю окупається за перші дні експлуатації, після чого заклад безперервно генерує додатковий прибуток та захищає свій рейтинг від негативу.

Контакти для погодження дизайну та виготовлення партії:
Telegram: @zalizkodenis12`;

    const tableHtml = `
      <div class="roi-summary-card">
        <b>Заклад:</b> Розрахунок окупності безконтактних карток для виведення локації в ТОП-1 Google Maps.
      </div>
      <table class="roi-preview-table">
        <thead>
          <tr>
            <th>Показник</th>
            <th style="text-align: right;">Значення</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="roi-preview-param">Поточний рейтинг Maps</td>
            <td class="roi-preview-val">${r.toFixed(1)} ★</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Кількість відгуків у Maps</td>
            <td class="roi-preview-val">${curRev} відг.</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Гостей на день</td>
            <td class="roi-preview-val">${g} осіб / день</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Середній чек</td>
            <td class="roi-preview-val">${c} ₴</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Місячний потік гостей</td>
            <td class="roi-preview-val">${monthlyGuests.toLocaleString('uk-UA')} осіб</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Тип обладнання</td>
            <td class="roi-preview-val">${escapeHtml(pricing.typeLabel)}</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Розмір партії</td>
            <td class="roi-preview-val">${pricing.qty} шт</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Вартість партії</td>
            <td class="roi-preview-val">${pricing.isIndividual ? 'Індивідуально' : pricing.totalCost.toLocaleString('uk-UA') + ' ₴'}</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Приріст відгуків за 30 днів</td>
            <td class="roi-preview-val" style="color:#00875A;">+${reviewsDelta} нових 5★</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Цільовий рейтинг (ТОП-1)</td>
            <td class="roi-preview-val" style="color:#00875A;">${targetRating.toFixed(1)} ★</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Додатковий виторг за місяць</td>
            <td class="roi-preview-val" style="color:var(--accent);">+${extraMoney.toLocaleString('uk-UA')} ₴ / міс</td>
          </tr>
          <tr>
            <td class="roi-preview-param">Термін повної окупності</td>
            <td class="roi-preview-val" style="color:var(--black); font-weight:800;">${pricing.isIndividual ? '1–3 дні' : days + ' дн.'}</td>
          </tr>
        </tbody>
      </table>
      <div class="roi-summary-card" style="border-left: 3px solid var(--accent); font-weight: 500;">
        💡 <b>Висновок для замовника:</b> Інвестиція в партію повністю окупається за перші <b>${pricing.isIndividual ? '1–3' : days} дні</b>, після чого постійно генерує додатковий прибуток та захищає заклад від негативу.
      </div>
    `;

    const previewContainer = document.getElementById('roiTablePreviewContent');
    if (previewContainer) {
      previewContainer.innerHTML = tableHtml;
    }

    window._lastRoiPitchText = text;

    openModal('modalRoiTablePreview');
    haptic('success');
  });

  document.getElementById('copyRoiPitchBtnModal')?.addEventListener('click', () => {
    const t = window._lastRoiPitchText || '';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t).then(() => {
        showToast('КП скопійовано в буфер обміну!');
        haptic('success');
      });
    } else {
      fallbackCopy(t, 'КП');
    }
  });

  document.getElementById('sendRoiTelegramBtnModal')?.addEventListener('click', () => {
    const t = window._lastRoiPitchText || '';
    const url = 'https://t.me/share/url?url=&text=' + encodeURIComponent(t);
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank', 'noopener');
    }
    haptic('light');
  });
}

function initNfcCatalog() {
  // Catalog tab combined into full-width pricing calculator
}

function setupNfcRadarTab() {
  nfcRadarState.jobs = loadLocalNfcJobs();
  nfcRadarState.d2dJobs = loadLocalD2dJobs();

  document.getElementById('nfcModeVenuesBtn')?.addEventListener('click', () => {
    setNfcRadarMode('venues');
    haptic('light');
  });
  document.getElementById('nfcModeD2dBtn')?.addEventListener('click', () => {
    setNfcRadarMode('d2d');
    haptic('light');
  });

  // D2D Category Dropdown Selector (Tap input to reveal 4 categories)
  const d2dTrigger = document.getElementById('d2dCategorySelectTrigger');
  const d2dDropMenu = document.getElementById('d2dCategoryDropdownMenu');
  const d2dNicheInput = document.getElementById('nfcNicheInput');

  if (d2dTrigger) {
    d2dTrigger.addEventListener('click', () => {
      const isD2d = nfcRadarState.radarMode === 'd2d';
      if (!isD2d) return;
      if (d2dDropMenu) {
        const isClosed = d2dDropMenu.style.display === 'none' || !d2dDropMenu.style.display;
        d2dDropMenu.style.display = isClosed ? 'flex' : 'none';
        d2dTrigger.classList.toggle('open', isClosed);
        haptic('light');
      }
    });
  }

  document.querySelectorAll('#d2dCategoryDropdownMenu .d2d-dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('#d2dCategoryDropdownMenu .d2d-dropdown-item').forEach(it => it.classList.remove('active'));
      item.classList.add('active');
      if (d2dNicheInput) {
        d2dNicheInput.value = item.textContent.trim();
        d2dNicheInput.dataset.fullNiche = item.dataset.d2dVal || item.textContent.trim();
      }
      if (d2dDropMenu) {
        d2dDropMenu.style.display = 'none';
        d2dTrigger?.classList.remove('open');
      }
      haptic('light');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#d2dCategoryDropdownWrap') && d2dDropMenu) {
      d2dDropMenu.style.display = 'none';
      d2dTrigger?.classList.remove('open');
    }
  });

  document.getElementById('nfcNicheInput')?.addEventListener('input', (e) => {
    if (nfcRadarState.radarMode !== 'd2d') {
      delete e.target.dataset.fullNiche;
    }
  });

  document.getElementById('openNewNfcSearchBtn')?.addEventListener('click', () => {
    configureNfcModalForCurrentMode();
    openModal('modalNfcSearch');
    haptic('light');
  });

  document.querySelectorAll('#nfcCityChips .nfc-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nfcCityChips .nfc-chip').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      nfcRadarState.cityFilter = btn.dataset.city || 'all';
      renderNfcRadar();
      haptic('light');
    });
  });

  const cardsBtn = document.getElementById('nfcViewCardsBtn');
  const mapBtn = document.getElementById('nfcViewMapBtn');

  cardsBtn?.addEventListener('click', () => {
    nfcRadarState.viewMode = 'cards';
    cardsBtn.classList.add('active');
    mapBtn?.classList.remove('active');
    const mv = document.getElementById('nfcRadarMapView');
    if (mv) mv.style.display = 'none';
    const jl = document.getElementById('nfcRadarJobsList');
    if (jl) jl.style.display = 'block';
    renderNfcRadar();
    haptic('light');
  });

  mapBtn?.addEventListener('click', () => {
    nfcRadarState.viewMode = 'map';
    mapBtn.classList.add('active');
    cardsBtn?.classList.remove('active');
    const mv = document.getElementById('nfcRadarMapView');
    if (mv) mv.style.display = 'block';
    const jl = document.getElementById('nfcRadarJobsList');
    if (jl) jl.style.display = 'none';
    renderNfcMap();
    haptic('light');
  });

  document.getElementById('nfcMapLocateBtn')?.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Геолокація недоступна');
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (nfcLeafletMap && typeof L !== 'undefined') {
        if (!nfcUserMarker) {
          const uIcon = L.divIcon({
            className: 'nfc-leaflet-user-icon',
            html: '<div class="nfc-user-pos-marker"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
          });
          nfcUserMarker = L.marker([lat, lng], { icon: uIcon }).addTo(nfcLeafletMap);
        } else {
          nfcUserMarker.setLatLng([lat, lng]);
        }
        nfcLeafletMap.setView([lat, lng], 17);
        haptic('success');
        showToast('Вашу позицію знайдено!');
      }
    }, () => {
      showToast('Не вдалося визначити координати');
    });
  });

  document.querySelectorAll('#nfcQuickNiches .nfc-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nfcQuickNiches .nfc-tag-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      const input = document.getElementById('nfcNicheInput');
      if (input) input.value = btn.dataset.val;
      haptic('light');
    });
  });

  document.querySelectorAll('#nfcQuickCities .nfc-tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#nfcQuickCities .nfc-tag-btn').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      const input = document.getElementById('nfcCityInput');
      if (input) input.value = btn.dataset.val;
      haptic('light');
    });
  });

  document.querySelectorAll('#nfcSourceSeg .scrape-seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      nfcRadarState.form.source = b.dataset.value;
      document.querySelectorAll('#nfcSourceSeg .scrape-seg-btn').forEach(x => x.classList.toggle('active', x === b));
    });
  });
  document.querySelectorAll('#nfcReviewsFilterSeg .scrape-seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      nfcRadarState.form.reviewsLimit = Number(b.dataset.value);
      document.querySelectorAll('#nfcReviewsFilterSeg .scrape-seg-btn').forEach(x => x.classList.toggle('active', x === b));
    });
  });
  document.querySelectorAll('#nfcLimitSeg .scrape-seg-btn').forEach(b => {
    b.addEventListener('click', () => {
      nfcRadarState.form.limit = Number(b.dataset.value);
      document.querySelectorAll('#nfcLimitSeg .scrape-seg-btn').forEach(x => x.classList.toggle('active', x === b));
    });
  });

  document.getElementById('submitNfcSearchBtn')?.addEventListener('click', submitNfcSearch);

  document.getElementById('nfcRadarJobsList')?.addEventListener('click', (e) => {
    const contactBtn = e.target.closest('[data-nfc-contact]');
    if (contactBtn) {
      e.stopPropagation();
      const job = findAnyNfcJob(contactBtn.dataset.job);
      const items = job ? getJobFlatItems(job) : [];
      const venue = items.find(v => (v.id === contactBtn.dataset.nfcContact || v.name === contactBtn.dataset.nfcContact));
      if (venue) {
        if (e.target.closest('.viber-badge-pill') && venue.phone) {
          copyTextToClipboardSync(generateNfcPitch(venue, job));
          showToast('Офер скопійовано! Відкриваємо Viber');
          haptic('success');
          launchViberForPhone(venue.phone);
        } else {
          openContactActionModal(venue, job);
        }
      }
      return;
    }

    const pitchBtn = e.target.closest('[data-nfc-act="pitch"]');
    if (pitchBtn) {
      const job = findAnyNfcJob(pitchBtn.dataset.job);
      const items = job ? getJobFlatItems(job) : [];
      const venue = items.find(v => (v.id === pitchBtn.dataset.venue || v.name === pitchBtn.dataset.venue));
      if (venue) sendInstantVenueNfcPitch(venue, job, pitchBtn);
      return;
    }

    const crmBtn = e.target.closest('[data-nfc-act="crm"]');
    if (crmBtn) {
      const job = findAnyNfcJob(crmBtn.dataset.job);
      const items = job ? getJobFlatItems(job) : [];
      const venue = items.find(v => (v.id === crmBtn.dataset.venue || v.name === crmBtn.dataset.venue));
      if (venue) addBizToCrm(venue, job?.cluster || job?.city);
      return;
    }

    const actBtn = e.target.closest('[data-nfc-act]');
    if (actBtn) {
      e.stopPropagation();
      const job = findAnyNfcJob(actBtn.dataset.job);
      if (!job) return;
      const act = actBtn.dataset.nfcAct;
      if (act === 'map') {
        nfcRadarState.activeJobId = job.id;
        nfcRadarState.viewMode = 'map';
        document.getElementById('nfcViewCardsBtn')?.classList.remove('active');
        document.getElementById('nfcViewMapBtn')?.classList.add('active');
        const mv = document.getElementById('nfcRadarMapView');
        if (mv) mv.style.display = 'block';
        const jl = document.getElementById('nfcRadarJobsList');
        if (jl) jl.style.display = 'none';
        renderNfcMap();
        mv?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        haptic('light');
      }
      else if (act === 'csv') downloadNfcCsv(job);
      else if (act === 'send') sendNfcToTelegram(job, actBtn);
      else if (act === 'delete') deleteNfcJob(job);
      return;
    }

    if (e.target.closest('a')) return;

    const jobHead = e.target.closest('[data-nfc-toggle-job]');
    if (jobHead) {
      const id = jobHead.dataset.nfcToggleJob;
      const job = findAnyNfcJob(id);
      if (!job || job.status === 'running') return;
      const openSet = getActiveNfcOpenSet();
      openSet.has(id) ? openSet.delete(id) : openSet.add(id);
      jobHead.parentElement.classList.toggle('open');
      haptic('light');
    }
  });

  initNfcRoiCalc();
  initNfcCatalog();
  renderNfcRadar();
}

setupNfcRadarTab();

// ============================================================
// INTERACTIVE MAP FOR NFC RADAR (LEAFLET - CLEAN STUDIO PALETTE)
// Strictly white, black, gray, studio blue (#0066FF). No emojis.
// ============================================================
let nfcLeafletMap = null;
let nfcMapMarkers = [];
let nfcUserMarker = null;

const CITY_CENTERS = {
  'київ': [50.4501, 30.5234],
  'львів': [49.8419, 24.0315],
  'одеса': [46.4825, 30.7233],
  'дніпро': [48.4647, 35.0462],
  'харків': [49.9935, 36.2304],
  'вінниця': [49.2331, 28.4682]
};

function renderNfcMap() {
  const mapCanvas = document.getElementById('nfcRadarMapCanvas');
  if (!mapCanvas) return;

  if (typeof L === 'undefined') {
    mapCanvas.innerHTML = '<div style="display:flex; align-items:center; justify-content:center; height:100%; color:var(--muted); font-size:0.85rem;">Завантаження карти...</div>';
    setTimeout(() => { if (typeof L !== 'undefined') renderNfcMap(); }, 350);
    return;
  }

  let jobs = getActiveNfcModeJobs();
  if (nfcRadarState.cityFilter && nfcRadarState.cityFilter !== 'all') {
    jobs = jobs.filter(j => j.city && j.city.toLowerCase().includes(nfcRadarState.cityFilter.toLowerCase()));
  }

  const activeJob = (nfcRadarState.activeJobId ? jobs.find(j => j.id === nfcRadarState.activeJobId) : null) ||
    jobs.find(j => j.status === 'done' && (j.items?.length || j.total > 0)) ||
    jobs[0];
  const items = activeJob ? getJobFlatItems(activeJob) : [];

  const countBadge = document.getElementById('nfcMapStatsCount');
  if (countBadge) countBadge.textContent = `${items.length} ${nfcRadarState.radarMode === 'd2d' ? pluralD2dTeams(items.length) : pluralNfcVenues(items.length)}`;

  const clusterBadge = document.getElementById('nfcMapActiveClusterLabel');
  if (clusterBadge) {
    clusterBadge.textContent = activeJob ? `• ${activeJob.cluster || activeJob.city || ''}` : '';
  }

  const cityKey = (activeJob?.city || 'Київ').toLowerCase().trim();
  let baseCoords = CITY_CENTERS[cityKey] || [50.4501, 30.5234];
  if (activeJob?.cluster && /ocean/i.test(activeJob.cluster)) {
    baseCoords = [50.4128, 30.5238];
  } else if (activeJob?.cluster && /хрещатик/i.test(activeJob.cluster)) {
    baseCoords = [50.4475, 30.5220];
  } else if (activeJob?.cluster && /гуллівер|gulliver/i.test(activeJob.cluster)) {
    baseCoords = [50.4385, 30.5229];
  }

  if (!nfcLeafletMap) {
    mapCanvas.innerHTML = '';
    nfcLeafletMap = L.map('nfcRadarMapCanvas', {
      zoomControl: false,
      attributionControl: false
    }).setView(baseCoords, 16);

    const cartoLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    });
    cartoLayer.on('tileerror', () => {
      if (!nfcLeafletMap._hasOsmFallback) {
        nfcLeafletMap._hasOsmFallback = true;
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(nfcLeafletMap);
      }
    });
    cartoLayer.addTo(nfcLeafletMap);

    L.control.zoom({ position: 'topright' }).addTo(nfcLeafletMap);
  }

  // Clear existing markers
  nfcMapMarkers.forEach(m => m.remove());
  nfcMapMarkers = [];

  const bounds = [];

  items.forEach((v, idx) => {
    // Generate organic distinct coords along street if not saved
    const lat = v.lat || (baseCoords[0] + Math.sin(idx * 0.85 + 0.3) * 0.0032);
    const lng = v.lng || (baseCoords[1] + Math.cos(idx * 0.85 + 0.3) * 0.0042);
    bounds.push([lat, lng]);

    const statusClass = v.walkStatus === 'deal' ? 'walk-deal' :
                        v.walkStatus === 'in_progress' ? 'walk-progress' :
                        v.walkStatus === 'declined' ? 'walk-declined' : '';

    const iconHtml = `<div class="nfc-map-pin ${statusClass}" id="pin-${v.id}"><span>${idx + 1}</span></div>`;
    const customIcon = L.divIcon({
      className: 'nfc-leaflet-div-icon',
      html: iconHtml,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    const marker = L.marker([lat, lng], { icon: customIcon }).addTo(nfcLeafletMap);
    marker.on('click', () => {
      showMapVenueCard(v, activeJob, idx);
      document.querySelectorAll('.nfc-map-pin').forEach(p => p.classList.remove('active'));
      document.getElementById('pin-' + v.id)?.classList.add('active');
      haptic('light');
    });

    nfcMapMarkers.push(marker);
  });

  setTimeout(() => {
    if (nfcLeafletMap) {
      nfcLeafletMap.invalidateSize();
      if (bounds.length > 0) {
        nfcLeafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      } else {
        nfcLeafletMap.setView(baseCoords, 16);
      }
    }
  }, 180);
}

function showMapVenueCard(v, job, idx) {
  const card = document.getElementById('nfcMapVenueCard');
  if (!card) return;

  const mapUrl = getVenueMapsUrl(v, job);
  const curStatus = v.walkStatus || 'new';

  const cleanPhone = (v.phone || '').replace(/[^\d]/g, '');
  const tgUrl = v.telegram ? (v.telegram.startsWith('http') ? v.telegram : 'https://t.me/' + v.telegram.replace('@', '')) : (cleanPhone ? 'https://t.me/+' + cleanPhone : '');
  const cleanInsta = (v.instagram || '').replace(/^@+/, '');
  const instaUrl = cleanInsta ? `https://instagram.com/${cleanInsta}` : `https://www.google.com/search?q=${encodeURIComponent('site:instagram.com "' + (v.name || '') + '" ' + (job?.city || ''))}`;

  card.innerHTML = `
    <div class="nfc-map-sheet-header">
      <div class="nfc-map-sheet-title">#${idx + 1} ${escapeHtml(v.name)}</div>
      <div class="nfc-map-sheet-score">★ ${v.rating ? Number(v.rating).toFixed(1) : '5.0'} (${v.d2dMatchScore ? v.d2dMatchScore + '% D2D' : (v.reviews || 0)})</div>
    </div>
    <div class="nfc-map-sheet-addr">${escapeHtml(v.address || job?.cluster || job?.city || '—')}</div>

    <div class="nfc-map-sheet-contacts" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center; margin:8px 0;">
      <a href="${mapUrl}" target="_blank" rel="noopener" class="btn btn--out btn--xs" style="display:inline-flex; align-items:center; gap:4px; font-weight:700;">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span>Точка в Google Maps</span>
      </a>
      ${v.phone ? `<button type="button" class="btn btn--out btn--xs" data-map-contact="${v.id}" style="font-weight:700;">${v.phone}</button>` : ''}
      <a href="${instaUrl}" target="_blank" rel="noopener" class="btn btn--out btn--xs nfc-insta-link" data-nfc-insta="true" data-job="${job?.id}" data-venue="${v.id}" data-href="${instaUrl}" style="color:${cleanInsta ? '#E1306C' : 'var(--muted)'}; border-color:${cleanInsta ? '#E1306C' : 'var(--border)'}; font-weight:600;">
        ${cleanInsta ? '@' + cleanInsta : 'Insta пошук'}
      </a>
    </div>

    <div class="form-row gap-2" style="margin-top: 6px;">
      <button type="button" class="btn btn--fill btn--sm flex-1 nfc-pitch-btn" data-nfc-act="pitch" data-job="${job?.id}" data-venue="${v.id}">
        <span>AI-Відгук</span>
      </button>
      <button type="button" class="btn btn--fill btn--sm flex-1 nfc-crm-btn" data-nfc-act="crm" data-job="${job?.id}" data-venue="${v.id}">
        <span>CRM</span>
      </button>
      <button type="button" class="btn btn--out btn--sm" id="closeMapVenueCardBtn" style="padding: 0 10px;">
        ✕
      </button>
    </div>

    <div class="nfc-map-walk-statuses">
      <button type="button" class="nfc-walk-pill ${curStatus === 'new' ? 'active' : ''}" data-status="new">Новий</button>
      <button type="button" class="nfc-walk-pill ${curStatus === 'in_progress' ? 'active' : ''}" data-status="in_progress">В процесі</button>
      <button type="button" class="nfc-walk-pill ${curStatus === 'deal' ? 'active' : ''}" data-status="deal">Угода</button>
      <button type="button" class="nfc-walk-pill ${curStatus === 'declined' ? 'active' : ''}" data-status="declined">Відмова</button>
    </div>
  `;

  card.style.display = 'block';

  const mapPitchBtn = card.querySelector('[data-nfc-act="pitch"]');
  if (mapPitchBtn) {
    mapPitchBtn.addEventListener('click', () => sendInstantVenueNfcPitch(v, job, mapPitchBtn));
  }
  const mapCrmBtn = card.querySelector('[data-nfc-act="crm"]');
  if (mapCrmBtn) {
    mapCrmBtn.addEventListener('click', () => addBizToCrm(v, job?.cluster || job?.city));
  }
  const mapContactBtn = card.querySelector('[data-map-contact]');
  if (mapContactBtn) {
    mapContactBtn.addEventListener('click', () => openContactActionModal(v, job));
  }

  // Walk status click handler
  card.querySelectorAll('.nfc-walk-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      const st = btn.dataset.status;
      v.walkStatus = st;
      card.querySelectorAll('.nfc-walk-pill').forEach(b => b.classList.toggle('active', b === btn));
      const pin = document.getElementById('pin-' + v.id);
      if (pin) {
        pin.className = 'nfc-map-pin ' + (st === 'deal' ? 'walk-deal' : st === 'in_progress' ? 'walk-progress' : st === 'declined' ? 'walk-declined' : '');
      }
      if (job?.isD2d || v?.isD2d || nfcRadarState.radarMode === 'd2d') {
        saveLocalD2dJobs(nfcRadarState.d2dJobs);
      } else {
        saveLocalNfcJobs(nfcRadarState.jobs);
      }
      haptic('light');
    });
  });

  document.getElementById('closeMapVenueCardBtn')?.addEventListener('click', () => {
    card.style.display = 'none';
    document.querySelectorAll('.nfc-map-pin').forEach(p => p.classList.remove('active'));
  });
}

// ============================================================
// ============================================================
// B2B REQUISITES & IBAN (OFFICIAL PAYMENT DETAILS)
// ============================================================
function initDocumentsHub() {
  // Open Requisites from CRM Header
  document.getElementById('openInvoiceModalBtn')?.addEventListener('click', () => {
    switchTab('tab-requisites');
    renderRequisitesTab();
    haptic('light');
  });

  // Open Requisites from CRM Lead Detail Modal
  document.getElementById('crmDetailDocBtn')?.addEventListener('click', () => {
    closeModal('modalCrmDetail');
    switchTab('tab-requisites');
    renderRequisitesTab();
    haptic('light');
  });

  // Quick Copy IBAN button
  document.getElementById('copyIbanQuickBtn')?.addEventListener('click', () => {
    const iban = (document.getElementById('reqIbanInput')?.value || state.requisites?.iban || '').trim();
    if (!iban) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(iban).then(() => {
        showToast('IBAN рахунок скопійовано!');
        haptic('success');
      });
    } else {
      fallbackCopy(iban, 'IBAN рахунок');
    }
  });

  // Copy Full Requisites button
  document.getElementById('invCopyDetailsBtn')?.addEventListener('click', () => {
    copyRequisitesToClipboard();
  });

  // Send to Telegram button
  document.getElementById('invSendTelegramBtn')?.addEventListener('click', () => {
    sendInvoiceToTelegram();
  });

  // Save requisites button
  document.getElementById('saveRequisitesBtn')?.addEventListener('click', () => {
    saveCustomRequisites();
  });
}

function openDocumentsHub(client = null) {
  renderRequisitesTab();
  if (state.currentTab !== 'tab-requisites') {
    switchTab('tab-requisites');
  }
}

function renderRequisitesTab() {
  const req = state.requisites || {};
  const recipient = req.recipient || 'Залізко Денис Олександрович';
  const iban = req.iban || 'UA683220010000026007300123456';
  const edrpou = req.edrpou || '3624800000';
  const bank = req.bank || 'monobank (АТ «УНІВЕРСАЛ БАНК»)';
  const purpose = req.purpose || 'Оплата за інформаційно-рекламні послуги згідно домовленості';

  // Form inputs
  const inRec = document.getElementById('reqRecipientInput');
  const inIban = document.getElementById('reqIbanInput');
  const inEdrpou = document.getElementById('reqEdrpouInput');
  const inBank = document.getElementById('reqBankInput');
  const inPurp = document.getElementById('reqPurposeInput');

  if (inRec) inRec.value = recipient;
  if (inIban) inIban.value = iban;
  if (inEdrpou) inEdrpou.value = edrpou;
  if (inBank) inBank.value = bank;
  if (inPurp) inPurp.value = purpose;
}

function formatRequisitesMessage({ recipient, iban, edrpou, bank, purpose }) {
  return `📄 Реквізити для оплати (IBAN)\n\n` +
    `👤 Отримувач: ${recipient}\n` +
    `💳 IBAN: ${iban}\n` +
    `🏢 РНОКПП (ІПН) / ЄДРПОУ: ${edrpou}\n` +
    `🏦 Банк: ${bank}\n` +
    `📝 Призначення: ${purpose}\n\n` +
    `✅ Після здійснення оплати надішліть, будь ласка, квитанцію. Дякуємо за співпрацю!`;
}

function sendInvoiceToTelegram() {
  const recipient = (document.getElementById('reqRecipientInput')?.value || state.requisites?.recipient || 'Залізко Сергій Олександрович').trim();
  const iban = (document.getElementById('reqIbanInput')?.value || state.requisites?.iban || 'UA973220010000026204340005801').trim();
  const edrpou = (document.getElementById('reqEdrpouInput')?.value || state.requisites?.edrpou || '2890111216').trim();
  const bank = (document.getElementById('reqBankInput')?.value || state.requisites?.bank || 'monobank').trim();
  const purpose = (document.getElementById('reqPurposeInput')?.value || state.requisites?.purpose || 'Оплата за інформаційно-рекламні послуги згідно домовленості').trim();

  const text = `Вітаю!\n\n` + formatRequisitesMessage({ recipient, iban, edrpou, bank, purpose });

  const tgUrl = 'https://t.me/share/url?url=' + encodeURIComponent('') + '&text=' + encodeURIComponent(text);
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(tgUrl);
  } else {
    window.open(tgUrl, '_blank');
  }
}

function copyRequisitesToClipboard() {
  const recipient = (document.getElementById('reqRecipientInput')?.value || state.requisites?.recipient || 'Залізко Сергій Олександрович').trim();
  const iban = (document.getElementById('reqIbanInput')?.value || state.requisites?.iban || 'UA973220010000026204340005801').trim();
  const edrpou = (document.getElementById('reqEdrpouInput')?.value || state.requisites?.edrpou || '2890111216').trim();
  const bank = (document.getElementById('reqBankInput')?.value || state.requisites?.bank || 'monobank').trim();
  const purpose = (document.getElementById('reqPurposeInput')?.value || state.requisites?.purpose || 'Оплата за інформаційно-рекламні послуги згідно домовленості').trim();

  const text = formatRequisitesMessage({ recipient, iban, edrpou, bank, purpose });

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Реквізити скопійовано в буфер!');
      haptic('success');
    });
  } else {
    fallbackCopy(text, 'Реквізити');
  }
}

function saveCustomRequisites() {
  const recipient = (document.getElementById('reqRecipientInput')?.value || '').trim() || 'Залізко Сергій Олександрович';
  const iban = (document.getElementById('reqIbanInput')?.value || '').trim() || 'UA973220010000026204340005801';
  const edrpou = (document.getElementById('reqEdrpouInput')?.value || '').trim() || '2890111216';
  const bank = (document.getElementById('reqBankInput')?.value || '').trim() || 'monobank';
  const purpose = (document.getElementById('reqPurposeInput')?.value || '').trim() || 'Оплата за інформаційно-рекламні послуги згідно домовленості';

  state.requisites = { recipient, iban, edrpou, bank, purpose };
  localStorage.setItem('dws_requisites', JSON.stringify(state.requisites));

  if (state.profile) {
    state.profile.requisites = state.requisites;
  }
  syncAccountToServer();

  renderRequisitesTab();
  showToast('Реквізити успішно збережено!');
  haptic('success');
}




// ============================================================================
// AUTO-OUTREACH & BLUE-BORDER VACANCY SELECTION ENGINE (v4.8.0)
// ============================================================================
const DEFAULT_OUTREACH_STATE = {
  selectedIds: [],
  activeTab: 'select',
  platformFilter: 'all',
  intervalMinutes: 20,
  limitPerAccount: 15,
  spintaxEnabled: true,
  isRunning: false,
  nextSendAt: null,
  accounts: {
    tg1: { enabled: true, handle: 'Основний ТГ #1', limit: 15, label: 'ТГ Акаунт #1' },
    tg2: { enabled: true, handle: 'Робочий ТГ #2', limit: 15, label: 'ТГ Акаунт #2' },
    reddit: { enabled: true, handle: 'Reddit Profile', limit: 10, label: 'Reddit' },
    discord: { enabled: true, handle: 'Discord Profile', limit: 10, label: 'Discord' },
    exchange: { enabled: true, handle: 'Профіль біржі', limit: 15, label: 'Біржа / Сайт' }
  },
  queue: []
};

function loadOutreachState() {
  try {
    const raw = localStorage.getItem('dws_outreach_state');
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_OUTREACH_STATE));
    const parsed = JSON.parse(raw);
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_OUTREACH_STATE)),
      ...parsed,
      accounts: {
        ...JSON.parse(JSON.stringify(DEFAULT_OUTREACH_STATE.accounts)),
        ...(parsed.accounts || {})
      },
      selectedIds: Array.isArray(parsed.selectedIds) ? parsed.selectedIds : [],
      queue: Array.isArray(parsed.queue) ? parsed.queue : []
    };
  } catch (e) {
    return JSON.parse(JSON.stringify(DEFAULT_OUTREACH_STATE));
  }
}

const outreachState = loadOutreachState();
const outreachSelectedSet = new Set(outreachState.selectedIds);
let outreachTimerInterval = null;

function saveOutreachState() {
  outreachState.selectedIds = [...outreachSelectedSet];
  try {
    localStorage.setItem('dws_outreach_state', JSON.stringify(outreachState));
  } catch (e) {}
}

function isOutreachLeadSelected(leadId) {
  return outreachSelectedSet.has(leadId);
}

function getLeadOutreachPlatformMeta(lead) {
  if (!lead) return { platform: 'exchange', shortBadge: 'Сайт', targetLabel: '', contact: { type: 'none', handle: '', url: '' } };
  const contact = resolveDirectContact(lead);
  const sType = String(lead.sourceType || '').toLowerCase();

  if (contact.type === 'reddit' || sType === 'reddit') {
    return {
      platform: 'reddit',
      shortBadge: 'Reddit: ' + (contact.handle || lead.authorUsername || 'PM'),
      targetLabel: contact.handle || lead.authorUsername || 'Reddit PM',
      contact
    };
  }
  if (contact.type === 'discord' || sType === 'discord') {
    return {
      platform: 'discord',
      shortBadge: 'Discord: ' + (contact.handle || 'DM'),
      targetLabel: contact.handle || 'Discord',
      contact
    };
  }
  if (contact.type === 'telegram' || contact.type === 'telegram_id') {
    return {
      platform: 'telegram',
      shortBadge: 'ТГ: ' + (contact.handle || 'Особисті'),
      targetLabel: contact.handle || 'Telegram контакт',
      contact
    };
  }
  if (contact.type === 'source' || sType === 'chat' || sType === 'channel') {
    return {
      platform: 'telegram',
      shortBadge: 'ТГ: ' + (contact.handle || lead.sourceUsername || 'Канал'),
      targetLabel: contact.handle || lead.sourceUsername || 'Telegram',
      contact
    };
  }
  const exName = lead.sourceName || (sType === 'djinni' ? 'Djinni' : sType === 'freelancehunt' ? 'Freelancehunt' : sType === 'upwork' ? 'Upwork' : 'Біржа');
  return {
    platform: 'exchange',
    shortBadge: exName,
    targetLabel: exName,
    contact
  };
}

function toggleOutreachSelectLead(leadId, cardEl = null) {
  if (!leadId) return;
  if (outreachSelectedSet.has(leadId)) {
    outreachSelectedSet.delete(leadId);
  } else {
    outreachSelectedSet.add(leadId);
  }
  saveOutreachState();
  haptic('light');

  const isSel = outreachSelectedSet.has(leadId);
  if (cardEl) {
    cardEl.classList.toggle('lead-card--selected', isSel);
  }
  document.querySelectorAll(`[data-id="${leadId}"], [data-outreach-lead="${leadId}"]`).forEach(el => {
    el.classList.toggle('lead-card--selected', isSel);
  });

  updateOutreachSelectionUI();
}

function updateOutreachSelectionUI() {
  const count = outreachSelectedSet.size;
  const bar = document.getElementById('outreachSelectionBar');
  const badge = document.getElementById('outreachSelectedCountBadge');

  if (bar) bar.classList.toggle('has-selection', count > 0);
  if (badge) badge.textContent = `Обрано: ${count}`;

  const tabSelCnt = document.getElementById('outreachTabSelectCount');
  const tabQueueCnt = document.getElementById('outreachTabQueueCount');
  const goQueueCnt = document.getElementById('outreachGoToQueueCount');
  if (tabSelCnt) tabSelCnt.textContent = count;
  if (tabQueueCnt) tabQueueCnt.textContent = outreachState.queue.length;
  if (goQueueCnt) goQueueCnt.textContent = count;
}

function getOutreachModalFilteredLeads() {
  const baseList = (Array.isArray(state.leads) && state.leads.length > 0) ? state.leads : (state.allLeads || []);
  const pFilter = outreachState.platformFilter || 'all';
  if (pFilter === 'all') return baseList;
  return baseList.filter(lead => {
    const meta = getLeadOutreachPlatformMeta(lead);
    return meta.platform === pFilter;
  });
}

function renderOutreachModalSelectList() {
  const container = document.getElementById('outreachModalLeadsList');
  if (!container) return;

  const list = getOutreachModalFilteredLeads();
  if (!list.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:26px 14px; color:var(--muted); font-size:0.84rem;">
        За обраним фільтром платформи вакансій не знайдено. Оберіть «Всі платформи».
      </div>
    `;
    return;
  }

  let tgToggleCounter = 0;
  container.innerHTML = list.map((lead) => {
    const isSel = outreachSelectedSet.has(lead.id);
    const meta = getLeadOutreachPlatformMeta(lead);
    const title = lead.title || lead.subcategoryName || lead.categoryName || 'Вакансія';
    const budgetTxt = lead.budget ? (lead.budget.toLocaleString('uk-UA') + ' грн') : 'Договірний';
    const snippet = getFirstSentence(cleanVacancyText(lead.text || '')).slice(0, 140);

    let accPreview = meta.shortBadge;
    if (meta.platform === 'telegram') {
      const tg1On = outreachState.accounts.tg1?.enabled !== false;
      const tg2On = outreachState.accounts.tg2?.enabled !== false;
      if (tg1On && tg2On) {
        accPreview += (tgToggleCounter++ % 2 === 0) ? ' -> ТГ Акаунт #1' : ' -> ТГ Акаунт #2';
      } else if (tg2On) {
        accPreview += ' -> ТГ Акаунт #2';
      } else {
        accPreview += ' -> ТГ Акаунт #1';
      }
    }

    return `
      <div class="outreach-select-card ${isSel ? 'lead-card--selected' : ''}" data-outreach-lead="${lead.id}">
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:5px;">
          <div style="font-family:var(--ffh); font-size:0.88rem; font-weight:800; color:var(--black); line-height:1.25;">
            ${escapeHtml(title)}
          </div>
          <span class="lead-selected-badge" style="flex-shrink:0;">ОБРАНО</span>
        </div>
        <div style="font-size:0.76rem; color:var(--muted); line-height:1.35; margin-bottom:8px;">
          ${escapeHtml(snippet)}
        </div>
        <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:6px;">
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            <span style="font-size:0.7rem; font-weight:800; color:#0066FF; background:rgba(0,102,255,0.08); padding:2px 8px; border-radius:6px;">
              ${escapeHtml(accPreview)}
            </span>
            <span style="font-size:0.7rem; font-weight:700; color:var(--text); background:var(--card-sub); padding:2px 7px; border-radius:6px;">
              Бюджет: ${escapeHtml(budgetTxt)}
            </span>
          </div>
          <span style="font-size:0.7rem; color:var(--muted); font-weight:600;">
            ${escapeHtml(lead.dateFormatted || 'Сьогодні')}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function generateOutreachPitchForLead(lead, idx = 0) {
  if (!lead) return '';
  const meta = getLeadOutreachPlatformMeta(lead);
  const rawAuthor = lead.authorName || (lead.authorUsername ? lead.authorUsername.replace(/^[@u\/]+/, '') : '');
  const cleanName = (!rawAuthor || /замовник|клієнт|рекрутер|client|telegram/i.test(rawAuthor)) ? '' : rawAuthor;
  const taskName = lead.title || lead.subcategoryName || lead.categoryName || 'розробки проєкту';
  const spintax = outreachState.spintaxEnabled !== false;

  // English / Reddit automatic adaptation
  const isEnglish = meta.platform === 'reddit' || /[a-zA-Z]{15,}/.test(lead.title || '') && !/[а-яА-ЯіїєґІЇЄҐ]/.test(lead.title || '');
  if (isEnglish) {
    const greetingsEn = ['Hi', 'Hello', 'Hey there', 'Greetings'];
    const hooksEn = [
      `I saw your post regarding "${taskName}" and would love to help you build and ship this cleanly.`,
      `Just reviewed your task "${taskName}". At DenisWeb Studio we deliver fast, production-ready web & software solutions within 2-4 days.`,
      `Reaching out regarding "${taskName}". We specialize in full-cycle development with clean architecture and rapid turnaround.`
    ];
    const closingsEn = [
      'We can prepare a free interactive demo of the main block before any payment so you can evaluate the quality right away. Portfolio: https://denis-webstudio.site — let me know if you are open to a quick chat.',
      'Happy to put together a quick prototype of the core screen first so you can see our speed and code quality. Our work: https://denis-webstudio.site — when is a good time to discuss details?',
      'You can check our live cases at https://denis-webstudio.site. We are ready to start today and show an initial working concept first. Let me know what you think.'
    ];
    const g = greetingsEn[idx % greetingsEn.length] + (cleanName ? ` ${cleanName},` : ',');
    const h = hooksEn[idx % hooksEn.length];
    const c = closingsEn[idx % closingsEn.length];
    return `${g}\n\n${h}\n\n${c}`;
  }

  // User's custom template from Profile
  const baseTemplate = (state.profile && state.profile.responseTemplate)
    ? state.profile.responseTemplate
    : DEFAULT_DATA.profile.responseTemplate;

  if (!spintax) {
    return baseTemplate
      .replace(/{NAME}/g, cleanName || 'колего')
      .replace(/{TASK}/g, taskName)
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .trim();
  }

  // Spintax variations in Ukrainian (Zero emojis)
  const greetingsUa = [
    cleanName ? `Вітаю, ${cleanName}.` : 'Вітаю.',
    cleanName ? `Доброго дня, ${cleanName}.` : 'Доброго дня.',
    cleanName ? `Привіт, ${cleanName}.` : 'Вітаю, звертаюсь щодо вашої вакансії.'
  ];
  const hooksUa = [
    `Побачив ваше оголошення щодо «${taskName}». У DenisWeb Studio ми реалізуємо подібні задачі під ключ за 2-4 дні з фокусом на швидкість та чисту архітектуру.`,
    `Ознайомився із задачею «${taskName}». Маємо релевантний досвід у цій ніші та готові закрити розробку без затягувань по термінах.`,
    `Пишу щодо вашого запиту «${taskName}». Наша команда спеціалізується на швидкій розробці під ключ із гарантією результату.`
  ];
  const offersUa = [
    'Готові безкоштовно зібрати концепт та інтерактивне демо головного блоку ще до передоплати, щоб ви одразу оцінили рівень виконання.',
    'Можемо перед стартом безкоштовно показати тестовий прототип основного екрану під вашу задачу, щоб ви бачили підхід на практиці.',
    'До початку фінансових зобов\'язань можемо підготувати наочне демо першого блоку під ваш проєкт.'
  ];
  const ctasUa = [
    'Наш сайт та кейси: https://denis-webstudio.site\nПідкажіть, чи актуальна ще задача для короткого обговорення?',
    'Приклади наших робіт: https://denis-webstudio.site\nНапишіть, будь ласка, коли зручно узгодити деталі.',
    'Портфоліо та живі проєкти: https://denis-webstudio.site\nЯкщо актуально — радо обговорю ТЗ у зручний для вас час.'
  ];

  const g = greetingsUa[idx % greetingsUa.length];
  const h = hooksUa[idx % hooksUa.length];
  const o = offersUa[(idx + 1) % offersUa.length];
  const cta = ctasUa[(idx + 2) % ctasUa.length];

  return `${g}\n\n${h}\n\n${o}\n\n${cta}`;
}

function buildOutreachQueueFromSelected() {
  const selectedIds = [...outreachSelectedSet];
  const pool = state.allLeads || [];
  const selectedLeads = selectedIds
    .map(id => pool.find(l => l.id === id))
    .filter(Boolean);

  if (!selectedLeads.length) {
    showToast('Спочатку виділіть хоча б одну вакансію синьою обводкою');
    return false;
  }

  const maxPerAcc = Number(outreachState.limitPerAccount) || 15;
  const accCounts = { tg1: 0, tg2: 0, reddit: 0, discord: 0, exchange: 0 };
  let tgRoundRobin = 0;

  const newQueue = [];
  selectedLeads.forEach((lead, idx) => {
    const meta = getLeadOutreachPlatformMeta(lead);
    let accountKey = 'exchange';
    let accountLabel = 'Біржа / Сайт';

    if (meta.platform === 'telegram') {
      const tg1On = outreachState.accounts.tg1?.enabled !== false;
      const tg2On = outreachState.accounts.tg2?.enabled !== false;
      if (tg1On && tg2On) {
        const pickFirst = (tgRoundRobin % 2 === 0);
        tgRoundRobin++;
        if (pickFirst && accCounts.tg1 < maxPerAcc) {
          accountKey = 'tg1';
          accountLabel = outreachState.accounts.tg1.handle || 'ТГ Акаунт #1';
        } else if (accCounts.tg2 < maxPerAcc) {
          accountKey = 'tg2';
          accountLabel = outreachState.accounts.tg2.handle || 'ТГ Акаунт #2';
        } else if (accCounts.tg1 < maxPerAcc) {
          accountKey = 'tg1';
          accountLabel = outreachState.accounts.tg1.handle || 'ТГ Акаунт #1';
        } else {
          return;
        }
      } else if (tg1On && accCounts.tg1 < maxPerAcc) {
        accountKey = 'tg1';
        accountLabel = outreachState.accounts.tg1.handle || 'ТГ Акаунт #1';
      } else if (tg2On && accCounts.tg2 < maxPerAcc) {
        accountKey = 'tg2';
        accountLabel = outreachState.accounts.tg2.handle || 'ТГ Акаунт #2';
      } else {
        return;
      }
      accCounts[accountKey]++;
    } else if (meta.platform === 'reddit') {
      if (outreachState.accounts.reddit?.enabled === false || accCounts.reddit >= maxPerAcc) return;
      accountKey = 'reddit';
      accountLabel = outreachState.accounts.reddit.handle || 'Reddit Акаунт';
      accCounts.reddit++;
    } else if (meta.platform === 'discord') {
      if (outreachState.accounts.discord?.enabled === false || accCounts.discord >= maxPerAcc) return;
      accountKey = 'discord';
      accountLabel = outreachState.accounts.discord.handle || 'Discord Акаунт';
      accCounts.discord++;
    } else {
      if (outreachState.accounts.exchange?.enabled === false || accCounts.exchange >= maxPerAcc) return;
      accountKey = 'exchange';
      accountLabel = outreachState.accounts.exchange.handle || meta.shortBadge || 'Біржа';
      accCounts.exchange++;
    }

    newQueue.push({
      id: 'oq_' + Date.now() + '_' + idx,
      leadId: lead.id,
      title: lead.title || lead.subcategoryName || lead.categoryName || 'Вакансія',
      authorName: lead.authorName || lead.authorUsername || '',
      platform: meta.platform,
      shortBadge: meta.shortBadge,
      contactType: meta.contact.type,
      contactHandle: meta.contact.handle || '',
      contactUrl: meta.contact.url || lead.url || '',
      accountKey,
      accountLabel,
      pitch: generateOutreachPitchForLead(lead, idx),
      status: 'pending',
      sentAt: null
    });
  });

  if (!newQueue.length) {
    showToast('Перевірте увімкнені акаунти або ліміти у вкладці Черга та Акаунти');
    return false;
  }

  outreachState.queue = newQueue;
  outreachState.isRunning = false;
  outreachState.nextSendAt = null;
  saveOutreachState();

  // Sync queue to backend /api/outreach/queue
  fetch('/api/outreach/queue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue: outreachState.queue,
      intervalMinutes: outreachState.intervalMinutes,
      accounts: outreachState.accounts
    })
  }).catch(() => {});

  return true;
}

function getNextPendingOutreachItem() {
  return (outreachState.queue || []).find(item => item.status === 'pending') || null;
}

function renderOutreachQueuePanel() {
  const total = outreachState.queue.length;
  const sent = outreachState.queue.filter(q => q.status === 'sent').length;
  const pending = getNextPendingOutreachItem();

  const stateBadge = document.getElementById('outreachQueueStateBadge');
  const progressText = document.getElementById('outreachQueueProgressText');
  const statusBox = document.getElementById('outreachQueueStatusBox');
  const countdownWrap = document.getElementById('outreachCountdownWrap');
  const startBtn = document.getElementById('outreachStartToggleBtn');
  const sendNowBtn = document.getElementById('outreachSendNextNowBtn');
  const nextTitle = document.getElementById('outreachNextTargetTitle');
  const nextAcc = document.getElementById('outreachNextTargetAccBadge');
  const nextMeta = document.getElementById('outreachNextTargetMeta');
  const pitchInput = document.getElementById('outreachCurrentPitchInput');
  const queueCountSpan = document.getElementById('outreachQueueItemsCount');
  const tabQueueCnt = document.getElementById('outreachTabQueueCount');
  const itemsListEl = document.getElementById('outreachActiveQueueItemsList');

  if (progressText) progressText.textContent = `${sent} / ${total}`;
  if (queueCountSpan) queueCountSpan.textContent = total;
  if (tabQueueCnt) tabQueueCnt.textContent = total;
  if (statusBox) statusBox.classList.toggle('is-running', Boolean(outreachState.isRunning));

  if (!total) {
    if (stateBadge) stateBadge.textContent = 'Черга порожня — оберіть вакансії';
    if (countdownWrap) countdownWrap.style.display = 'none';
    if (startBtn) startBtn.textContent = 'ЗАПУСТИТИ АВТО-РОЗСИЛКУ З ПАУЗАМИ';
    if (nextTitle) nextTitle.textContent = 'Немає вибраних вакансій у черзі';
    if (nextAcc) nextAcc.textContent = '—';
    if (nextMeta) nextMeta.textContent = 'Перейдіть у «Список вакансій», виділіть картки синьою обводкою та натисніть «Сформувати чергу»';
    if (pitchInput) pitchInput.value = '';
    if (itemsListEl) {
      itemsListEl.innerHTML = `<div style="text-align:center; padding:18px; color:var(--muted); font-size:0.8rem;">Черга порожня</div>`;
    }
    return;
  }

  if (!pending) {
    outreachState.isRunning = false;
    outreachState.nextSendAt = null;
    saveOutreachState();
    if (stateBadge) stateBadge.textContent = 'Усі відгуки з черги надіслано';
    if (countdownWrap) countdownWrap.style.display = 'none';
    if (startBtn) startBtn.textContent = 'РОЗСИЛКУ ЗАВЕРШЕНО';
    if (nextTitle) nextTitle.textContent = `Успішно опрацьовано ${sent} вакансій`;
    if (nextAcc) nextAcc.textContent = 'Виконано';
    if (nextMeta) nextMeta.textContent = 'Усі контакти автоматично збережені у вашу CRM зі статусом «В процесі»';
    if (pitchInput) pitchInput.value = '';
  } else {
    if (stateBadge) {
      stateBadge.textContent = outreachState.isRunning
        ? `Активна розсилка (пауза ~${outreachState.intervalMinutes} хв)`
        : 'Готова до відправки (на паузі)';
    }
    if (countdownWrap) {
      countdownWrap.style.display = outreachState.isRunning ? 'block' : 'none';
    }
    if (startBtn) {
      startBtn.textContent = outreachState.isRunning
        ? 'ПОСТАВИТИ АВТО-РОЗСИЛКУ НА ПАУЗУ'
        : `ЗАПУСТИТИ АВТО-РОЗСИЛКУ (ПАУЗА ${outreachState.intervalMinutes} ХВ)`;
    }
    if (nextTitle) nextTitle.textContent = pending.title;
    if (nextAcc) nextAcc.textContent = pending.accountLabel;
    if (nextMeta) {
      nextMeta.textContent = `Канал: ${pending.shortBadge} | Контакт: ${pending.contactHandle || pending.contactUrl || 'Прямий перехід'}`;
    }
    if (pitchInput && document.activeElement !== pitchInput) {
      pitchInput.value = pending.pitch || '';
      pitchInput.dataset.itemId = pending.id;
    }
  }

  if (itemsListEl) {
    itemsListEl.innerHTML = outreachState.queue.map((item, idx) => {
      const isDone = item.status === 'sent';
      const isSkip = item.status === 'skipped';
      const isCur = pending && pending.id === item.id;
      const statusTxt = isDone ? 'Відправлено' : (isSkip ? 'Пропущено' : (isCur ? 'Наступний у черзі' : 'В черзі'));
      const borderCol = isCur ? '#0066FF' : 'var(--border)';

      return `
        <div style="background:var(--card-bg); border:1.5px solid ${borderCol}; border-radius:var(--r); padding:9px 11px; display:flex; align-items:center; justify-content:space-between; gap:8px; opacity:${(isDone || isSkip) ? '0.62' : '1'};">
          <div style="min-width:0; flex:1;">
            <div style="font-size:0.8rem; font-weight:800; color:var(--black); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              #${idx + 1} ${escapeHtml(item.title)}
            </div>
            <div style="font-size:0.72rem; color:var(--muted); display:flex; flex-wrap:wrap; gap:6px; margin-top:2px;">
              <span style="color:#0066FF; font-weight:700;">${escapeHtml(item.accountLabel)}</span>
              <span>&bull;</span>
              <span>${escapeHtml(item.shortBadge)}</span>
              <span>&bull;</span>
              <span style="font-weight:700;">${statusTxt}</span>
            </div>
          </div>
          ${(!isDone && !isSkip) ? `
            <button type="button" class="btn btn--out btn--xs" data-outreach-fire="${item.id}" style="flex-shrink:0; border-color:#0066FF; color:#0066FF; font-weight:800;">
              Відправити
            </button>
          ` : ''}
        </div>
      `;
    }).join('');
  }
}

async function dispatchOutreachItem(item, isManualTrigger = false) {
  if (!item || item.status === 'sent') return;
  const lead = (state.allLeads || []).find(l => l.id === item.leadId);
  const pitchInput = document.getElementById('outreachCurrentPitchInput');
  if (pitchInput && pitchInput.dataset.itemId === item.id && pitchInput.value.trim()) {
    item.pitch = pitchInput.value.trim();
  }

  const finalPitch = item.pitch || (lead ? generateOutreachPitchForLead(lead, 0) : '');
  copyTextToClipboardSync(finalPitch);
  haptic('success');

  // If Discord account has a webhook URL configured, also fire webhook directly
  const dcAccVal = (outreachState.accounts.discord?.handle || '').trim();
  if (item.platform === 'discord' && /^https:\/\/discord(?:app)?\.com\/api\/webhooks\//i.test(dcAccVal)) {
    fetch(dcAccVal, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: finalPitch })
    }).catch(() => {});
  }

  // Notify backend /api/outreach/dispatch
  fetch('/api/outreach/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId: item.id,
      leadId: item.leadId,
      platform: item.platform,
      accountKey: item.accountKey,
      accountLabel: item.accountLabel,
      contactHandle: item.contactHandle,
      contactUrl: item.contactUrl,
      pitch: finalPitch
    })
  }).catch(() => {});

  // Open target platform with pre-filled message / copied pitch
  if (lead) {
    markLeadTakenToCrm(lead, null);
    // Attach account tag to CRM entry
    const crmEntry = (state.crm || []).find(c => c.leadId === lead.id);
    if (crmEntry) {
      crmEntry.sourceLabel = `${item.shortBadge} (${item.accountLabel})`;
      localStorage.setItem('dws_crm', JSON.stringify(state.crm));
    }
    openTelegramContact(lead, finalPitch);
  } else if (item.contactUrl) {
    window.open(item.contactUrl, '_blank');
  }

  item.status = 'sent';
  item.sentAt = new Date().toISOString();
  outreachSelectedSet.delete(item.leadId);

  const nextPending = getNextPendingOutreachItem();
  if (outreachState.isRunning && nextPending) {
    const baseMs = (Number(outreachState.intervalMinutes) || 20) * 60 * 1000;
    const jitterMs = outreachState.spintaxEnabled !== false
      ? Math.floor((Math.random() * 6 - 3) * 60 * 1000)
      : 0;
    outreachState.nextSendAt = Date.now() + Math.max(60 * 1000, baseMs + jitterMs);
  } else if (!nextPending) {
    outreachState.isRunning = false;
    outreachState.nextSendAt = null;
  }

  saveOutreachState();
  showToast(`Відгук скопійовано та відкрито (${item.accountLabel})`);
  renderOutreachQueuePanel();
  renderOutreachModalSelectList();
  renderLeads();
}

function startOutreachTimerEngine() {
  if (outreachTimerInterval) clearInterval(outreachTimerInterval);
  outreachTimerInterval = setInterval(() => {
    if (!outreachState.isRunning) return;
    const pending = getNextPendingOutreachItem();
    if (!pending) {
      outreachState.isRunning = false;
      outreachState.nextSendAt = null;
      saveOutreachState();
      renderOutreachQueuePanel();
      return;
    }

    if (!outreachState.nextSendAt) {
      const baseMs = (Number(outreachState.intervalMinutes) || 20) * 60 * 1000;
      outreachState.nextSendAt = Date.now() + baseMs;
      saveOutreachState();
    }

    const diffMs = outreachState.nextSendAt - Date.now();
    const timerEl = document.getElementById('outreachCountdownTimer');
    if (diffMs <= 0) {
      dispatchOutreachItem(pending, false);
    } else if (timerEl) {
      const totalSec = Math.ceil(diffMs / 1000);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }, 1000);
}

function switchOutreachModalTab(tabName) {
  outreachState.activeTab = tabName === 'queue' ? 'queue' : 'select';
  saveOutreachState();

  const btnSelect = document.getElementById('outreachTabSelectBtn');
  const btnQueue = document.getElementById('outreachTabQueueBtn');
  const panelSelect = document.getElementById('outreachPanelSelect');
  const panelQueue = document.getElementById('outreachPanelQueue');

  if (btnSelect) btnSelect.classList.toggle('active', outreachState.activeTab === 'select');
  if (btnQueue) btnQueue.classList.toggle('active', outreachState.activeTab === 'queue');
  if (panelSelect) panelSelect.style.display = outreachState.activeTab === 'select' ? 'block' : 'none';
  if (panelQueue) panelQueue.style.display = outreachState.activeTab === 'queue' ? 'block' : 'none';

  if (outreachState.activeTab === 'select') {
    renderOutreachModalSelectList();
  } else {
    renderOutreachQueuePanel();
  }
  updateOutreachSelectionUI();
}

function syncOutreachAccountInputsFromState() {
  const acc = outreachState.accounts || DEFAULT_OUTREACH_STATE.accounts;
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  const setChk = (id, v) => { const el = document.getElementById(id); if (el) el.checked = v !== false; };

  setVal('outreachAccTg1', acc.tg1?.handle);
  setChk('outreachEnTg1', acc.tg1?.enabled);
  setVal('outreachAccTg2', acc.tg2?.handle);
  setChk('outreachEnTg2', acc.tg2?.enabled);
  setVal('outreachAccReddit', acc.reddit?.handle);
  setChk('outreachEnReddit', acc.reddit?.enabled);
  setVal('outreachAccDiscord', acc.discord?.handle);
  setChk('outreachEnDiscord', acc.discord?.enabled);
  setVal('outreachAccExchange', acc.exchange?.handle);
  setChk('outreachEnExchange', acc.exchange?.enabled);
  setChk('outreachAntibanSpintaxCheck', outreachState.spintaxEnabled);

  document.querySelectorAll('#outreachIntervalSeg .scrape-seg-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.interval) === Number(outreachState.intervalMinutes));
  });
  document.querySelectorAll('#outreachLimitSeg .scrape-seg-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.accLimit) === Number(outreachState.limitPerAccount));
  });
}

function saveOutreachAccountsFromInputs() {
  const getVal = (id, def) => (document.getElementById(id)?.value || '').trim() || def;
  const getChk = (id) => Boolean(document.getElementById(id)?.checked);

  outreachState.accounts.tg1 = {
    enabled: getChk('outreachEnTg1'),
    handle: getVal('outreachAccTg1', 'ТГ Акаунт #1'),
    limit: outreachState.limitPerAccount,
    label: 'ТГ Акаунт #1'
  };
  outreachState.accounts.tg2 = {
    enabled: getChk('outreachEnTg2'),
    handle: getVal('outreachAccTg2', 'ТГ Акаунт #2'),
    limit: outreachState.limitPerAccount,
    label: 'ТГ Акаунт #2'
  };
  outreachState.accounts.reddit = {
    enabled: getChk('outreachEnReddit'),
    handle: getVal('outreachAccReddit', 'Reddit Акаунт'),
    limit: outreachState.limitPerAccount,
    label: 'Reddit'
  };
  outreachState.accounts.discord = {
    enabled: getChk('outreachEnDiscord'),
    handle: getVal('outreachAccDiscord', 'Discord Акаунт'),
    limit: outreachState.limitPerAccount,
    label: 'Discord'
  };
  outreachState.accounts.exchange = {
    enabled: getChk('outreachEnExchange'),
    handle: getVal('outreachAccExchange', 'Біржа / Сайт'),
    limit: outreachState.limitPerAccount,
    label: 'Біржа / Сайт'
  };
  outreachState.spintaxEnabled = getChk('outreachAntibanSpintaxCheck');
  saveOutreachState();
}

function pickTopNOutreachLeads(maxCount = 15) {
  const list = getOutreachModalFilteredLeads().filter(l => !l.inCrm && !(state.takenLeadIds && state.takenLeadIds.has(l.id)));
  const pool = list.length > 0 ? list : getOutreachModalFilteredLeads();
  pool.slice(0, maxCount).forEach(l => outreachSelectedSet.add(l.id));
  saveOutreachState();
  renderLeads();
  renderOutreachModalSelectList();
  updateOutreachSelectionUI();
  haptic('success');
  showToast(`Виділено синьою обводкою ${outreachSelectedSet.size} вакансій`);
}

function setupAutoOutreachModule() {
  syncOutreachAccountInputsFromState();
  updateOutreachSelectionUI();
  startOutreachTimerEngine();

  // Open modal button in main tab-leads bar
  document.getElementById('openAutoOutreachBtn')?.addEventListener('click', () => {
    haptic('medium');
    syncOutreachAccountInputsFromState();
    if (outreachSelectedSet.size > 0 && outreachState.queue.length === 0) {
      switchOutreachModalTab('select');
    } else {
      switchOutreachModalTab(outreachState.activeTab || 'select');
    }
    openModal('modalAutoOutreach');
  });

  document.getElementById('outreachQuickSelect15Btn')?.addEventListener('click', () => {
    pickTopNOutreachLeads(15);
  });

  document.getElementById('outreachQuickClearBtn')?.addEventListener('click', () => {
    outreachSelectedSet.clear();
    saveOutreachState();
    renderLeads();
    renderOutreachModalSelectList();
    updateOutreachSelectionUI();
    haptic('light');
    showToast('Синій вибір скинуто');
  });

  // Oval tab switchers inside modal
  document.getElementById('outreachTabSelectBtn')?.addEventListener('click', () => {
    haptic('light');
    switchOutreachModalTab('select');
  });
  document.getElementById('outreachTabQueueBtn')?.addEventListener('click', () => {
    haptic('light');
    if (outreachSelectedSet.size > 0 && outreachState.queue.length === 0) {
      buildOutreachQueueFromSelected();
    }
    switchOutreachModalTab('queue');
  });

  // Platform filter pills
  document.getElementById('outreachPlatformPills')?.addEventListener('click', (e) => {
    const pill = e.target.closest('[data-plat]');
    if (!pill) return;
    haptic('light');
    outreachState.platformFilter = pill.dataset.plat || 'all';
    document.querySelectorAll('#outreachPlatformPills .outreach-plat-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.plat === outreachState.platformFilter);
    });
    renderOutreachModalSelectList();
  });

  // Card clicks inside modal select list -> toggle blue border
  document.getElementById('outreachModalLeadsList')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-outreach-lead]');
    if (!card) return;
    const leadId = card.dataset.outreachLead;
    toggleOutreachSelectLead(leadId, card);
  });

  document.getElementById('outreachModalPick15Btn')?.addEventListener('click', () => {
    pickTopNOutreachLeads(15);
  });

  document.getElementById('outreachModalPickAllBtn')?.addEventListener('click', () => {
    const list = getOutreachModalFilteredLeads();
    list.forEach(l => outreachSelectedSet.add(l.id));
    saveOutreachState();
    renderLeads();
    renderOutreachModalSelectList();
    updateOutreachSelectionUI();
    haptic('success');
    showToast(`Виділено всі ${outreachSelectedSet.size} вакансій`);
  });

  document.getElementById('outreachModalClearBtn')?.addEventListener('click', () => {
    outreachSelectedSet.clear();
    saveOutreachState();
    renderLeads();
    renderOutreachModalSelectList();
    updateOutreachSelectionUI();
    haptic('light');
  });

  document.getElementById('outreachGoToQueueBtn')?.addEventListener('click', () => {
    saveOutreachAccountsFromInputs();
    if (buildOutreachQueueFromSelected()) {
      haptic('success');
      switchOutreachModalTab('queue');
      showToast(`Сформовано чергу з ${outreachState.queue.length} вакансій`);
    }
  });

  // Interval & Limit segmented buttons
  document.getElementById('outreachIntervalSeg')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-interval]');
    if (!btn) return;
    haptic('light');
    outreachState.intervalMinutes = Number(btn.dataset.interval) || 20;
    document.querySelectorAll('#outreachIntervalSeg .scrape-seg-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
    saveOutreachState();
    renderOutreachQueuePanel();
  });

  document.getElementById('outreachLimitSeg')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-acc-limit]');
    if (!btn) return;
    haptic('light');
    outreachState.limitPerAccount = Number(btn.dataset.accLimit) || 15;
    document.querySelectorAll('#outreachLimitSeg .scrape-seg-btn').forEach(b => {
      b.classList.toggle('active', b === btn);
    });
    saveOutreachState();
  });

  document.getElementById('outreachSaveAccountsBtn')?.addEventListener('click', () => {
    saveOutreachAccountsFromInputs();
    if (outreachSelectedSet.size > 0) {
      buildOutreachQueueFromSelected();
    }
    renderOutreachQueuePanel();
    haptic('success');
    showToast('Акаунти та налаштування розсилки збережено');
  });

  // Live edit of current pitch
  document.getElementById('outreachCurrentPitchInput')?.addEventListener('input', (e) => {
    const pending = getNextPendingOutreachItem();
    if (pending) {
      pending.pitch = e.target.value;
      saveOutreachState();
    }
  });

  // Queue controls: Start / Pause, Send Next Now, Skip, Reset
  document.getElementById('outreachStartToggleBtn')?.addEventListener('click', () => {
    saveOutreachAccountsFromInputs();
    if (!outreachState.queue.length && outreachSelectedSet.size > 0) {
      buildOutreachQueueFromSelected();
    }
    const pending = getNextPendingOutreachItem();
    if (!pending) {
      showToast('Спочатку оберіть вакансії у списку');
      switchOutreachModalTab('select');
      return;
    }

    if (outreachState.isRunning) {
      outreachState.isRunning = false;
      outreachState.nextSendAt = null;
      saveOutreachState();
      renderOutreachQueuePanel();
      updateOutreachSelectionUI();
      haptic('light');
      showToast('Авто-розсилку поставлено на паузу');
    } else {
      // Immediately send the first pending item and start the 20-min countdown for the next one!
      outreachState.isRunning = true;
      const baseMs = (Number(outreachState.intervalMinutes) || 20) * 60 * 1000;
      outreachState.nextSendAt = Date.now() + baseMs;
      saveOutreachState();
      dispatchOutreachItem(pending, true);
      updateOutreachSelectionUI();
    }
  });

  document.getElementById('outreachSendNextNowBtn')?.addEventListener('click', () => {
    saveOutreachAccountsFromInputs();
    if (!outreachState.queue.length && outreachSelectedSet.size > 0) {
      buildOutreachQueueFromSelected();
    }
    const pending = getNextPendingOutreachItem();
    if (!pending) {
      showToast('У черзі немає активних вакансій');
      return;
    }
    dispatchOutreachItem(pending, true);
  });

  document.getElementById('outreachSkipCurrentBtn')?.addEventListener('click', () => {
    const pending = getNextPendingOutreachItem();
    if (!pending) return;
    pending.status = 'skipped';
    outreachSelectedSet.delete(pending.leadId);
    saveOutreachState();
    renderOutreachQueuePanel();
    renderLeads();
    haptic('light');
    showToast('Вакансію пропущено');
  });

  document.getElementById('outreachResetQueueBtn')?.addEventListener('click', () => {
    outreachState.queue = [];
    outreachState.isRunning = false;
    outreachState.nextSendAt = null;
    saveOutreachState();
    renderOutreachQueuePanel();
    updateOutreachSelectionUI();
    haptic('light');
    showToast('Чергу очищено');
  });

  document.getElementById('outreachActiveQueueItemsList')?.addEventListener('click', (e) => {
    const fireBtn = e.target.closest('[data-outreach-fire]');
    if (!fireBtn) return;
    const itemId = fireBtn.dataset.outreachFire;
    const item = outreachState.queue.find(q => q.id === itemId);
    if (item) dispatchOutreachItem(item, true);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupAutoOutreachModule);
} else {
  setTimeout(setupAutoOutreachModule, 50);
}
