/**
 * DWS Lead — 0-Cost Smart Rule Engine & Heuristic Classifier
 * Filters out 95%+ spam, job-seekers (resumes), scams without touching AI or spending tokens.
 */

// Stop-words that immediately discard a message
const STOP_WORDS = [
  'шукаю роботу', 'шукаю вакансію', 'резюме', 'моє резюме', 'готовий працювати',
  'шукаю проєкт для себе', 'мій стек:', 'про себе: я джун', 'junior looking for',
  'казино', 'гемблінг', 'крипта', 'airdrop', 'вайтліст', 'сигнали', 'ставки',
  '18+', 'онліфанс', 'onlyfans', 'лайки за гроші', 'підробіток 500 грн',
  'виплата на карту щодня', 'робота вдома без досвіду від 1000$', 'складання ручок'
];

// Triggers indicating a client looking for a specialist/agency
const CLIENT_INTENT_TRIGGERS = [
  'шукаю', 'шукаємо', 'потрібен', 'потрібна', 'потрібні', 'треба',
  'замовлення', 'проєкт', 'проект', 'розробити', 'зробити', 'налаштувати',
  'змонтувати', 'запустити', 'бюджет', 'дедлайн', 'відгукніться', 'хто може',
  'вакансія', 'looking for', 'need a', 'hiring', 'order'
];

// Niche Keywords Dictionary
const NICHES = {
  development: {
    name: 'Веброзробка',
    keywords: [
      'сайт', 'лендінг', 'landing', 'веб', 'розробк', 'frontend', 'верстк',
      'інтернет-магазин', 'магазин', 'каталог', '3d сайт', 'three.js',
      'багатосторінков', 'wordpress', 'webflow', 'react', 'vue', 'html',
      'телеграм-бот', 'тг бот', 'чат-бот', 'техпідтримк', 'підтримка сайту', 'фікс'
    ],
    subcategories: {
      landing: ['лендінг', 'landing', 'односторінков', 'посадочн', 'лендос'],
      ecommerce: ['інтернет-магазин', 'магазин', 'e-commerce', 'ecommerce', 'кошик', 'шоп'],
      catalog: ['каталог', 'сайти-каталоги', 'каталог товарів'],
      '3d_site': ['3d', 'three.js', 'threejs', 'webgl', 'spline'],
      multipages: ['багатосторінков', 'корпоративн', 'сервіс', 'портал'],
      tg_bots: ['телеграм-бот', 'тг бот', 'tg bot', 'чат-бот', 'бот для'],
      maintenance: ['техпідтримк', 'підтримка', 'обслуговування', 'правки', 'баги', 'доробити']
    }
  },
  marketing: {
    name: 'Маркетинг',
    keywords: [
      'маркетинг', 'таргет', 'таргетолог', 'реклам', 'lead', 'лід', 'трафік',
      'meta', 'facebook', 'instagram', 'google ads', 'контекст', 'сео', 'seo',
      'tiktok ads', 'креативи', 'посів', 'просування'
    ],
    subcategories: {
      meta_target: ['таргет', 'meta', 'facebook', 'інстаграм', 'instagram', 'fb ads'],
      google_ads: ['google ads', 'гугл реклама', 'контекст', 'пошукова реклама', 'гугл едс'],
      tiktok_ads: ['tiktok', 'тікток', 'тік ток', 'tiktok ads'],
      telegram_ads: ['посів', 'реклама в тг', 'реклама в телеграм', 'tg ads'],
      seo: ['seo', 'сео', 'просування в гугл', 'пошукова оптимізація']
    }
  },
  montage: {
    name: 'Монтаж',
    keywords: [
      'монтаж', 'відео', 'монтажер', 'відеомонтаж', 'reels', 'рілс', 'shorts',
      'шортс', 'tiktok', 'тікток', 'youtube', 'ютуб', 'моушн', 'motion',
      'анімація', 'after effects', 'premiere pro', 'capcut', 'кольорокорекція'
    ],
    subcategories: {
      reels_tiktok: ['reels', 'рілс', 'shorts', 'шортс', 'тікток', 'вертикальн'],
      youtube: ['youtube', 'ютуб', 'довгий монтаж', 'випуск'],
      ads_creatives: ['креатив', 'рекламне відео', 'промо'],
      motion: ['моушн', 'motion', 'анімація', '2d', '3d анімація']
    }
  }
};

/**
 * Extract budget value in UAH if possible
 */
export function extractBudget(text) {
  if (!text) return { budget: 0, isUrgent: false };
  const lower = text.toLowerCase();

  const isUrgent = lower.includes('терміново') || lower.includes('горить') || lower.includes('asap') || lower.includes('швидко') || lower.includes('дедлайн 1-2') || lower.includes('дедлайн 2');

  // Regex patterns for budget detection:
  // e.g. "15 000 грн", "15000 ₴", "15k", "$400", "400$"
  let budget = 0;

  const uahMatch = text.match(/(\d+[\s\d]*)\s*(грн|₴|uah|гривень|тис|тис\.|k)/i);
  if (uahMatch) {
    let raw = uahMatch[1].replace(/\s+/g, '');
    let val = parseInt(raw, 10);
    if (uahMatch[2].toLowerCase().includes('тис') || uahMatch[2].toLowerCase() === 'k') {
      val = val * 1000;
    }
    if (!isNaN(val) && val > 100 && val < 1000000) {
      budget = val;
    }
  }

  // USD check
  if (!budget) {
    const usdMatch = text.match(/(\$|\b)(\d+[\s\d]*)\s*(\$|usd|дол|доларів)/i);
    if (usdMatch) {
      let raw = (usdMatch[2] || usdMatch[1]).replace(/\s+/g, '');
      let val = parseInt(raw, 10);
      if (!isNaN(val) && val > 10 && val < 20000) {
        budget = val * 41.5; // Convert USD to UAH approx
      }
    }
  }

  return { budget: Math.round(budget), isUrgent };
}

/**
 * Pure Rule-based classifier. Returns null if post should be skipped.
 */
export function classifyLeadRuleBased(text, authorUsername = '') {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();

  // 1. Check Stop-words
  for (const stopWord of STOP_WORDS) {
    if (lower.includes(stopWord)) {
      return null; // Ignore candidate resumes, scam, spam
    }
  }

  // 2. Check Client Intent
  let hasClientIntent = false;
  for (const trigger of CLIENT_INTENT_TRIGGERS) {
    if (lower.includes(trigger)) {
      hasClientIntent = true;
      break;
    }
  }
  if (!hasClientIntent) {
    return null; // Not an order/job vacancy
  }

  // 3. Match Niches & Categories
  let matchedCategory = null;
  let maxScore = 0;

  for (const [catKey, catData] of Object.entries(NICHES)) {
    let score = 0;
    for (const kw of catData.keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > maxScore) {
      maxScore = score;
      matchedCategory = catKey;
    }
  }

  // Need at least 1 strong keyword match
  if (!matchedCategory || maxScore < 1) {
    return null;
  }

  // 4. Match Subcategory
  const catObj = NICHES[matchedCategory];
  let matchedSub = 'general';
  let matchedSubName = catObj.name;

  for (const [subKey, subKeywords] of Object.entries(catObj.subcategories)) {
    for (const skw of subKeywords) {
      if (lower.includes(skw)) {
        matchedSub = subKey;
        // Prettify name
        const names = {
          landing: "Односторінковий сайт",
          ecommerce: "Онлайн-магазин",
          catalog: "Сайти-каталоги",
          '3d_site': "3D сайт",
          multipages: "Багатосторінковий",
          tg_bots: "Телеграм-бот",
          maintenance: "Технічне обслуговування",
          meta_target: "Таргетована реклама",
          google_ads: "Google реклама",
          tiktok_ads: "TikTok реклама",
          telegram_ads: "Telegram реклама",
          seo: "SEO оптимізація",
          reels_tiktok: "Монтаж Reels/TikTok",
          youtube: "YouTube монтаж",
          ads_creatives: "Рекламні креативи",
          motion: "Моушн-дизайн"
        };
        matchedSubName = names[subKey] || subKey;
        break;
      }
    }
    if (matchedSub !== 'general') break;
  }

  // 5. Extract Budget and Urgency
  const { budget, isUrgent } = extractBudget(text);
  const requiresPortfolio = lower.includes('портфоліо') || lower.includes('кейси') || lower.includes('приклади');
  const experienceRequired = lower.includes('досвід') || lower.includes('мідл') || lower.includes('досвідчений');

  // 6. Calculate Fast Heuristic Score (0-100)
  let heuristicScore = 65;
  if (budget > 10000) heuristicScore += 15;
  else if (budget > 5000) heuristicScore += 10;
  if (authorUsername && authorUsername.startsWith('@')) heuristicScore += 10;
  if (isUrgent) heuristicScore += 5;
  if (text.length > 100) heuristicScore += 5;
  if (heuristicScore > 98) heuristicScore = 98;

  // Title generation
  const firstLine = text.trim().split('\n')[0].substring(0, 70);
  const title = firstLine.length > 65 ? `${firstLine}...` : firstLine;

  return {
    category: matchedCategory,
    categoryName: catObj.name,
    subcategory: matchedSub,
    subcategoryName: matchedSubName,
    title,
    budget,
    isUrgent,
    requiresPortfolio,
    experienceRequired,
    initialRating: heuristicScore
  };
}
