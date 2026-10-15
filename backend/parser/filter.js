/**
 * DWS Lead — 0-Cost Smart Rule Engine & Heuristic Classifier
 * Filters out 98%+ offline jobs (baristas, drivers, loaders), spam, resumes, scams
 * Precision targeting for 3 DenisWeb Studio niches: Web Development, Marketing/SMM, Video Montage.
 */

// Offline non-digital jobs that must be filtered out immediately
const OFFLINE_STOP_WORDS = [
  'бариста', 'баріста', 'кухар', 'офіціант', 'бармен', 'посудомий', 'прибиральн', 'клінінг',
  'водій', 'водитель', 'кур\'єр', 'курьер', 'вантажник', 'грузчик', 'склад', 'фасувальн',
  'пакувальн', 'комірник', 'касир', 'продавець-консультант', 'продавець', 'охоронець', 'сторож',
  'швачка', 'швея', 'прасувальн', 'манікюр', 'педикюр', 'перукар', 'парикмахер', 'колорист',
  'візажист', 'бровіст', 'масажист', 'будівельн', 'плиточник', 'штукатур', 'сантехнік',
  'електрик', 'зварювальник', 'автослюсар', 'автомийник', 'шиномонтаж', 'монтажник вікон',
  'монтажник кондиціонер', 'монтажник сонячн', 'монтаж металопластик', 'няня', 'доглядальниц',
  'покоївка', 'горничная', 'швейцар', 'хостес', 'хостесс', 'піцер', 'сушист', 'пекар',
  'кондитер', 'різноробоч', 'подсобник', 'підсобник', 'робота в польщі', 'праця в європі',
  'візи', 'визы', 'карти побиту', 'сортування посилок', 'збір ягід', 'оператор 1с', 'продавець в магазин'
];

// Spam, scams, illegal, agency sales ads and candidate resume triggers
const RESUME_AND_SPAM_STOP_WORDS = [
  'шукаю роботу', 'шукаю вакансію', 'шукаю посаду', 'в пошуку роботи', 'моє резюме', 'готовий працювати',
  'розгляну пропозиції', 'відкритий до пропозицій', 'відкрита до пропозицій', 'шукаю проєкт для себе',
  'мій стек:', 'про себе: я', 'junior looking for', 'джуніор шукає', 'бажана зп', 'бажана заробітна плата',
  'ловіть свіжі резюме', 'свіжі резюме', 'добірка резюме', 'резюме кандидатів', 'кандидати шукають',
  'продається готовий бізнес', 'продається готова', 'продаж каналу', 'продаж бізнесу', 'продається маркетингова',
  'продається готова маркетингова', 'продається агенція',
  'казино', 'гемблінг', 'крипта', 'airdrop', 'вайтліст', 'сигнали', 'ставки',
  '18+', 'онліфанс', 'onlyfans', 'лайки за гроші', 'підробіток 500 грн',
  'виплата на карту щодня', 'робота вдома без досвіду від 1000$', 'складання ручок',
  'робота для мам в декреті', 'ставити лайки', 'передруковка текстів',
  'огляд платформи', 'огляд фріланс', 'чи варто працювати', 'поради для фрілансерів', 'корисна стаття'
];

// Triggers indicating a real client/employer looking to hire or order
const CLIENT_INTENT_TRIGGERS = [
  'шукаю', 'шукаємо', 'потрібен', 'потрібна', 'потрібні', 'треба', 'замовлення', 'замовлення:',
  'проєкт', 'проект', 'розробити', 'зробити', 'налаштувати', 'змонтувати', 'запустити',
  'бюджет', 'дедлайн', 'відгукніться', 'хто може', 'вакансія', 'looking for', 'need a',
  'hiring', 'order', 'в команду потрібен', 'шукаємо підрядника', 'шукаємо агенцію'
];

// 3 Core Agency Niches & specific digital match patterns
const NICHES = {
  development: {
    name: 'Веброзробка',
    // Strong phrases (if any match, high confidence)
    strongPhrases: [
      'розробка сайту', 'розробити сайт', 'створення сайту', 'створити сайт', 'потрібен сайт',
      'потрібен лендінг', 'зробити лендінг', 'лендінг під ключ', 'landing page', 'інтернет-магазин',
      'інтернет магазин', 'сайт-каталог', '3d сайт', 'three.js', 'багатосторінковий сайт',
      'верстка сайту', 'зверстати сайт', 'веб-розробник', 'web-розробник', 'frontend розробник',
      'wordpress', 'webflow', 'tilda', 'тильда', 'телеграм бот', 'телеграм-бот', 'тг бот', 'tg bot',
      'чат-бот', 'чат бот', 'розробка бота', 'техпідтримка сайту', 'редизайн сайту', 'доробити сайт',
      'поправити сайт', 'баги на сайті', 'верстка figma', 'перенести дизайн'
    ],
    keywords: [
      'лендінг', 'landing', 'верстк', 'frontend', 'інтернет-магазин', 'webflow', 'wordpress',
      'телеграм-бот', 'чат-бот', 'tilda', 'тильда', 'three.js', 'react', 'веб-розроб'
    ],
    subcategories: {
      landing: ['лендінг', 'landing', 'односторінков', 'посадочн', 'лендос', 'taplink'],
      ecommerce: ['інтернет-магазин', 'магазин', 'e-commerce', 'ecommerce', 'кошик', 'шоп'],
      catalog: ['каталог', 'сайти-каталоги', 'каталог товарів'],
      '3d_site': ['3d', 'three.js', 'threejs', 'webgl', 'spline'],
      multipages: ['багатосторінков', 'корпоративн', 'сервіс', 'портал'],
      tg_bots: ['телеграм-бот', 'тг бот', 'tg bot', 'чат-бот', 'бот для'],
      maintenance: ['техпідтримк', 'підтримка', 'обслуговування', 'правки', 'баги', 'доробити', 'редизайн']
    }
  },
  marketing: {
    name: 'Маркетинг',
    strongPhrases: [
      'потрібен таргетолог', 'шукаємо таргетолога', 'таргетована реклама', 'таргет інстаграм',
      'таргет meta', 'facebook ads', 'налаштувати таргет', 'налаштувати рекламу', 'запустити рекламу',
      'google ads', 'гугл реклама', 'контекстна реклама', 'контекстолог', 'tiktok ads', 'реклама в тікток',
      'посів в телеграм', 'реклама в тг', 'медіабаєр', 'media buyer', 'трафік-менеджер', 'трафік менеджер',
      'smm спеціаліст', 'smm-спеціаліст', 'smm менеджер', 'ведення інстаграм', 'seo спеціаліст',
      'пошукова оптимізація', 'лідогенерація', 'арбітраж трафіку'
    ],
    keywords: [
      'таргет', 'таргетолог', 'meta ads', 'facebook ads', 'google ads', 'контекстна реклама',
      'smm', 'трафік', 'медіабаєр', 'buyer', 'лідогенерація', 'seo'
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
    strongPhrases: [
      'потрібен монтажер', 'шукаємо монтажера', 'відеомонтажер', 'відеомонтаж', 'монтаж reels',
      'монтаж рілс', 'монтаж shorts', 'монтаж tiktok', 'монтаж тікток', 'монтаж відео', 'змонтувати відео',
      'монтаж youtube', 'ютуб випуск', 'моушн-дизайнер', 'motion designer', 'моушн дизайн',
      'рекламні креативи', 'відеокреативи', 'креативи для таргету', 'анімація логотипу', 'промо ролик'
    ],
    keywords: [
      'відеомонтаж', 'монтажер', 'reels', 'рілс', 'shorts', 'youtube монтаж', 'premiere pro',
      'after effects', 'capcut', 'моушн', 'motion design', 'відеокреатив'
    ],
    subcategories: {
      reels_tiktok: ['reels', 'рілс', 'shorts', 'шортс', 'тікток', 'вертикальн'],
      youtube: ['youtube', 'ютуб', 'довгий монтаж', 'випуск'],
      ads_creatives: ['креатив', 'рекламне відео', 'промо', 'крео'],
      motion: ['моушн', 'motion', 'анімація', '2d', '3d анімація']
    }
  }
};

/**
 * Extract author username or contact from text if available
 */
export function extractContactFromText(text) {
  if (!text) return '';
  // Match @username (excluding common bot commands)
  const tgMatch = text.match(/@([a-zA-Z0-9_]{4,32})/);
  if (tgMatch && !tgMatch[1].toLowerCase().includes('bot') && !tgMatch[1].toLowerCase().includes('admin')) {
    return '@' + tgMatch[1];
  }
  // Match t.me/username
  const linkMatch = text.match(/t\.me\/([a-zA-Z0-9_]{4,32})/i);
  if (linkMatch && !linkMatch[1].toLowerCase().includes('joinchat')) {
    return '@' + linkMatch[1];
  }
  return '';
}

/**
 * Extract budget value in UAH if possible
 */
export function extractBudget(text) {
  if (!text) return { budget: 0, isUrgent: false };
  const lower = text.toLowerCase();

  const isUrgent = lower.includes('терміново') || lower.includes('горить') || lower.includes('asap') ||
    lower.includes('швидко') || lower.includes('дедлайн 1-2') || lower.includes('дедлайн 2') || lower.includes('сьогодні');

  let budget = 0;

  // UAH matching (e.g. 15000 грн, 15 000 ₴, 25 000–30 000 грн)
  const uahRangeMatch = text.match(/(\d{1,3}(?:[\s.,]\d{3})+|\d{4,6})\s*[–—-]\s*(\d{1,3}(?:[\s.,]\d{3})+|\d{4,6})\s*(грн|₴|uah|гривень)/i);
  const uahSingleMatch = text.match(/(\d{1,3}(?:[\s]\d{3})+|\d{3,6})\s*(грн|₴|uah|гривень|тис\.?\s*грн)/i);
  if (uahRangeMatch) {
    let val = parseInt(uahRangeMatch[2].replace(/[\s.,]+/g, ''), 10);
    if (!isNaN(val) && val >= 500 && val <= 500000) budget = val;
  } else if (uahSingleMatch) {
    let val = parseInt(uahSingleMatch[1].replace(/\s+/g, ''), 10);
    if (uahSingleMatch[2].toLowerCase().includes('тис')) val *= 1000;
    if (!isNaN(val) && val >= 500 && val <= 500000) budget = val;
  }

  // USD matching ($700, $700–1000, 500$, 500 USD)
  if (!budget) {
    const usdPrefix = text.match(/\$\s*(\d{2,5})(?:\s*[–—-]\s*(\d{2,5}))?/i);
    const usdSuffix = text.match(/\b(\d{2,5})(?:\s*[–—-]\s*(\d{2,5}))?\s*(\$|usd|дол|доларів)/i);
    const m = usdPrefix || usdSuffix;
    if (m) {
      let raw = m[2] || m[1];
      let val = parseInt(raw.replace(/\s+/g, ''), 10);
      if (!isNaN(val) && val >= 20 && val <= 10000) {
        budget = Math.round((val * 41.5) / 500) * 500;
      }
    }
  }

  return { budget: Math.round(budget), isUrgent };
}

/**
 * Precision Rule-Based Classifier.
 * Returns null if post should be filtered out.
 */
export function classifyLeadRuleBased(text, authorUsername = '') {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  if (clean.length < 25) return null; // Too short to be a real job specification
  const lower = clean.toLowerCase();

  // 1. Check Spam & Candidate Resumes
  for (const sw of RESUME_AND_SPAM_STOP_WORDS) {
    if (lower.includes(sw)) return null;
  }

  // 2. Check Offline Jobs (Baristas, drivers, cleaners, etc.)
  let hasOfflineJob = false;
  for (const offline of OFFLINE_STOP_WORDS) {
    if (lower.includes(offline)) {
      hasOfflineJob = true;
      break;
    }
  }

  // 3. Match against Strong Digital Phrases first
  let matchedNiche = null;
  let strongMatchFound = false;

  for (const [catKey, catData] of Object.entries(NICHES)) {
    for (const phrase of catData.strongPhrases) {
      if (lower.includes(phrase)) {
        matchedNiche = catKey;
        strongMatchFound = true;
        break;
      }
    }
    if (strongMatchFound) break;
  }

  // If it had an offline job (e.g. barista) and NO strong digital phrase, discard immediately!
  if (hasOfflineJob && !strongMatchFound) {
    return null;
  }

  // 4. If no strong phrase, check keyword density + client intent
  if (!matchedNiche) {
    // Must have client intent
    let hasClientIntent = false;
    for (const trig of CLIENT_INTENT_TRIGGERS) {
      if (lower.includes(trig)) {
        hasClientIntent = true;
        break;
      }
    }
    if (!hasClientIntent) return null;

    let bestScore = 0;
    for (const [catKey, catData] of Object.entries(NICHES)) {
      let count = 0;
      for (const kw of catData.keywords) {
        if (lower.includes(kw)) count++;
      }
      if (count >= 2 && count > bestScore) {
        bestScore = count;
        matchedNiche = catKey;
      }
    }
  }

  // If still not matched, discard
  if (!matchedNiche) return null;

  // 5. Match Subcategory
  const catObj = NICHES[matchedNiche];
  let matchedSub = 'general';
  let matchedSubName = catObj.name;

  for (const [subKey, subKeywords] of Object.entries(catObj.subcategories)) {
    for (const skw of subKeywords) {
      if (lower.includes(skw)) {
        matchedSub = subKey;
        const names = {
          landing: "Односторінковий сайт",
          ecommerce: "Онлайн-магазин",
          catalog: "Сайти-каталоги",
          '3d_site': "3D сайт",
          multipages: "Багатосторінковий сайт",
          tg_bots: "Телеграм-бот",
          maintenance: "Технічне обслуговування",
          meta_target: "Таргетована реклама (Meta)",
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

  // 6. Contact and Budget extraction
  const contact = authorUsername || extractContactFromText(clean);
  const { budget, isUrgent } = extractBudget(clean);
  const requiresPortfolio = lower.includes('портфоліо') || lower.includes('кейси') || lower.includes('приклади');
  const experienceRequired = lower.includes('досвід') || lower.includes('мідл') || lower.includes('досвідчений');

  // Country & Market detection (тільки точна назва країни, без узагальнень як СНД/Global і без прапорців)
  let country = 'Україна';
  if (/(?:сша|usa|америк|штати|штатах|new york|нью-йорк|калифорн|каліфорн|майами|маямі|техас)/i.test(clean)) {
    country = 'США';
  } else if (/(?:zł|pln|польщ|польша|варшав|warszaw|краків|krakow|вроцлав|wroclaw)/i.test(clean)) {
    country = 'Польща';
  } else if (/(?:німеччин|герман|germany|deutschland|берлін|berlin|мюнхен|munich)/i.test(clean)) {
    country = 'Німеччина';
  } else if (/(?:великобритан|британія|британия|england|лондон|london|gbp|£)/i.test(clean)) {
    country = 'Велика Британія';
  } else if (/(?:казахстан|казах|алмати|астана|шимкент|тенге|kzt|₸)/i.test(clean)) {
    country = 'Казахстан';
  } else if (/(?:чехія|чехия|czech|прага|prague|czk)/i.test(clean)) {
    country = 'Чехія';
  } else if (/(?:канада|canada|торонто|cad)/i.test(clean)) {
    country = 'Канада';
  } else if (/(?:іспанія|испания|spain|мадрид|барселона)/i.test(clean)) {
    country = 'Іспанія';
  } else if (/(?:ізраїль|израиль|israel|тель-авів|шекел)/i.test(clean)) {
    country = 'Ізраїль';
  } else if (/(?:₽|руб|rub|спб|москва|мск|рф|россия|тинькофф|сбер|тинькоф|петербург)/i.test(clean)) {
    country = 'РФ';
  } else if (/(?:грн|uah|₴|київ|львів|україна|дніпро|одес|харків|вінниц|запоріжж)/i.test(clean)) {
    country = 'Україна';
  } else if (/(?:\$|usd|english)/i.test(clean) && !/(?:грн|uah|₴|укра)/i.test(clean)) {
    country = 'США';
  } else if (/(?:€|eur)/i.test(clean)) {
    country = 'Німеччина';
  }

  // 7. Calculate honest AI initial heuristic score (42-89)
  let heuristicScore = 50;
  if (budget >= 25000) heuristicScore += 18;
  else if (budget >= 12000) heuristicScore += 12;
  else if (budget > 0) heuristicScore += 4;
  else heuristicScore -= 6;

  if (/повна зайнятість|в офіс|повний день|5\/2|штат/i.test(clean)) heuristicScore -= 7;
  else if (/віддалено|часткова зайнятість|проєкт|під ключ|фріланс|за кожне/i.test(clean)) heuristicScore += 9;

  if (clean.length >= 420) heuristicScore += 10;
  else if (clean.length >= 200) heuristicScore += 5;
  else heuristicScore -= 5;

  if (/тестов/i.test(clean)) heuristicScore -= 8;
  if (requiresPortfolio) heuristicScore += 2;
  heuristicScore = Math.max(42, Math.min(89, Math.round(heuristicScore)));

  // Generate crisp title
  const firstLine = clean.split('\n')[0].substring(0, 75).trim();
  const title = firstLine.length > 70 ? `${firstLine}...` : firstLine;

  return {
    category: matchedNiche,
    categoryName: catObj.name,
    subcategory: matchedSub,
    subcategoryName: matchedSubName,
    title,
    budget,
    contact,
    country,
    isUrgent,
    requiresPortfolio,
    experienceRequired,
    initialRating: heuristicScore
  };
}
