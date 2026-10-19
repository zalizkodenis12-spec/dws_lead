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

// Bot greetings, welcome captchas, channel join verifications
const BOT_AND_VERIFICATION_STOP_WORDS = [
  'підтвердіть що ви не робот', 'підтвердіть що ви людина', 'вітаємо у чаті', 'вітаємо в чаті',
  'ласкаво просимо', 'для верифікації', 'пройдіть капчу', 'натисніть кнопку нижче', 'натисніть кнопку',
  'правила чату', 'заборонено спам', 'дотримуйтесь правил', 'за реєстрацію', 'верифікація пройшла',
  'вступіть в канал щоб писати', 'підтвердити реєстрацію', 'щоб писати в групі',
  'привет, ', 'привет!', 'добро пожаловать', 'для верификации', 'подтвердите что вы не робот',
  'подтвердите что вы человек', 'нажмите на кнопку', 'пройдите капчу', 'капча', 'защита от спама',
  'правила группы', 'правила чата', 'войти в чат', 'верификация', 'нажмите чтобы подтвердить',
  'нажмите кнопку', 'чтобы писать в группе', 'welcome to', 'verification required', 'shieldy',
  'combot', 'captcha', 'security bot', 'bot protection'
];

// Spam, scams, illegal, candidate resumes, CVs, and freelancer self-promotions
const RESUME_AND_SPAM_STOP_WORDS = [
  // CV / Resume хештеги та маркери
  '#cv', '#resume', '#резюме', '#ищуработу', '#ищу_работу', '#ищузаказы', '#ищу_заказы',
  '#открыт_к_предложениям', '#lookingforjob', '#forhire', 'cv:', 'resume:', 'резюме:',
  'моє резюме', 'моё резюме', 'резюме разработчика', 'резюме дизайнера', 'резюме таргетолога',

  // Українські резюме та пошук роботи
  'шукаю роботу', 'шукаю вакансію', 'шукаю посаду', 'в пошуку роботи', 'готовий працювати',
  'розгляну пропозиції', 'відкритий до пропозицій', 'відкрита до пропозицій', 'шукаю проєкт для себе',
  'мій стек:', 'про себе: я', 'junior looking for', 'джуніор шукає', 'бажана зп', 'бажана заробітна плата',
  'ловіть свіжі резюме', 'свіжі резюме', 'добірка резюме', 'резюме кандидатів', 'кандидати шукають',
  'пропоную послуги', 'надаю послуги', 'можу розробити', 'зверстаю для вас', 'зроблю для вас',
  'мої послуги:', 'мої послуги', 'моє портфоліо', 'прайс-лист', 'прайс:', 'візьму в роботу',
  'візьму кілька проєктів', 'візьму кілька проектів', 'візьму 1-2 проекти', 'візьму 1-2 проєкти',
  'шукаю замовлення', 'шукаю клієнтів', 'візьму на ведення', 'візьму на просування',
  'про себе:', 'про мене:', 'мене звати', 'я веб-дизайнер', 'я вебдизайнер', 'я таргетолог',
  'я маркетолог', 'я дизайнер', 'я розробник', 'я монтажер', 'я відеомонтажер',
  'я створюю сайти', 'я займаюся монтажем', 'пишіть в лс кому потрібен', 'звертайтесь якщо потрібен',
  'звертайтесь якщо треба', 'пишіть кому треба', 'звертайтесь за послугами', 'надаю консультації',

  // Російські резюме, самопрезентації та портфоліо фрілансерів
  'ищу работу', 'ищу вакансию', 'ищу подработку', 'ищу заказы', 'ищу клиентов', 'в поиске работы',
  'готов работать', 'готова работать', 'готов к сотрудничеству', 'готова к сотрудничеству',
  'рассмотрю предложения', 'открыт к предложениям', 'открыта к предложениям', 'ищу проект для себя',
  'мой стек:', 'стек технологий:', 'обо мне:', 'о себе:', 'меня зовут', 'мои навыки:',
  'мое портфолио', 'моё портфолио', 'портфолио:', 'мои кейсы', 'кейсы:', 'ссылка на портфолио',
  'предлагаю услуги', 'оказываю услуги', 'могу разработать', 'сверстаю для вас', 'сделаю для вас',
  'мои услуги:', 'мои услуги', 'прайс-лист:', 'прайс:', 'стоимость услуг:',
  'возьму в работу', 'возьму несколько проектов', 'возьму 1-2 проекта', 'возьму пару проектов',
  'возьму на ведение', 'возьму на продвижение', 'возьму клиентов',
  'я веб-дизайнер', 'я вебдизайнер', 'я таргетолог', 'я маркетолог', 'я дизайнер', 'я разработчик',
  'я программист', 'я верстальщик', 'я монтажер', 'я видеомонтажер', 'я создаю сайты',
  'пишите в лс кому нужен', 'пишите в лс кому нужно', 'обращайтесь если нужен', 'обращайтесь если нужно',
  'обращайтесь за услугами', 'оказываю консультации', 'начинающий специалист', 'junior разработчик',

  // Спам, скам, продаж каналів/бізнесів
  'продається готовий бізнес', 'продається готова', 'продаж каналу', 'продаж бізнесу', 'продається маркетингова',
  'продается готовый бизнес', 'продается готовая', 'продажа канала', 'продажа бизнеса',
  'казино', 'гемблінг', 'крипта', 'airdrop', 'вайтліст', 'сигнали', 'ставки',
  '18+', 'онліфанс', 'onlyfans', 'лайки за гроші', 'підробіток 500 грн', 'подработка 500',
  'виплата на карту щодня', 'выплата на карту ежедневно', 'работа на дому без опыта', 'сборка ручек',
  'робота для мам в декреті', 'работа для мам в декрете', 'ставить лайки', 'перепечатка текстов'
];

// Conferences, meetups, hackathons, seminars, festivals, non-job events
const EVENT_AND_MEETUP_STOP_WORDS = [
  'хакатон', 'митап', 'мітап', 'фестиваль', 'конференция', 'конференція', 'вебинар', 'вебінар',
  'день открытых дверей', 'день відкритих дверей', 'выставка', 'виставка', 'подкаст', 'дайджест новостей',
  'новости дня', 'новини дня', 'новости за неделю', 'новини тижня', 'опрос:', 'опитування',
  'бесплатный интенсив', 'курс с нуля', 'школа бизнеса', 'game jam', 'геймджем', 'гейм джем',
  'питчинг', 'питч', 'meetup', 'hackathon', 'conference', 'стажировка без оплаты', 'волонтерство',
  'нетворкинг', 'нетворкінг', 'подборка новостей', 'обзор сервиса'
];

/// Triggers indicating a real client/employer looking to hire or order
const CLIENT_INTENT_TRIGGERS = [
  'шукаю', 'шукаємо', 'потрібен', 'потрібна', 'потрібні', 'треба', 'замовлення', 'замовлення:',
  'проєкт', 'проект', 'розробити', 'зробити', 'налаштувати', 'змонтувати', 'запустити',
  'бюджет', 'дедлайн', 'відгукніться', 'хто може', 'вакансія', 'вакансії', 'looking for', 'need a',
  'hiring', 'order', 'в команду потрібен', 'шукаємо підрядника', 'шукаємо агенцію',
  'віддалено', 'ремоут', 'full-time', 'part-time', 'ставка', 'зп', 'зарплата',
  'робота на проект', 'робота на проєкт', 'робота віддалено', 'робота в команді', 'пропоную роботу', 'пропонуємо роботу',
  // Російські тригери замовників та роботодавців
  'ищу', 'ищем', 'нужен', 'нужна', 'нужны', 'требуется', 'требуются', 'заказ', 'заказ:',
  'разработать', 'сделать', 'настроить', 'смонтировать', 'запустить', 'откликнитесь',
  'кто может', 'вакансия', 'вакансии', 'в команду нужен', 'ищем подрядчика', 'ищем агентство',
  'техзадание', 'тз', 'удаленно', 'удаленка', 'оплата', 'в штат', 'на проект',
  'работа на проект', 'работа в команду', 'работа удаленно', 'предлагаю работу', 'предлагаем работу',
  'есть заказ', 'есть проект', 'пишите в лс', 'пишіть в пп', 'пишіть в лс'
];

// 3 Core Agency Niches & specific digital match patterns
const NICHES = {
  development: {
    name: 'Веброзробка',
    // Strong phrases (if any match, high confidence immediate match)
    strongPhrases: [
      // Розробка сайтів та лендінгів
      'розробка сайту', 'розробити сайт', 'створення сайту', 'створити сайт', 'потрібен сайт',
      'потрібен лендінг', 'зробити лендінг', 'лендінг під ключ', 'landing page', 'інтернет-магазин',
      'інтернет магазин', 'сайт-каталог', '3d сайт', 'three.js', 'багатосторінковий сайт',
      'верстка сайту', 'зверстати сайт', 'веб-розробник', 'web-розробник', 'веб розробник',
      'frontend розробник', 'backend розробник', 'fullstack розробник', 'програміст', 'шукаємо розробника',
      'потрібен розробник', 'потрібен програміст', 'шукаємо програміста', 'вакансія розробник',
      'вакансія програміст', 'junior розробник', 'middle розробник', 'senior розробник',
      'wordpress', 'webflow', 'tilda', 'тильда', 'телеграм бот', 'телеграм-бот', 'тг бот', 'tg bot',
      'чат-бот', 'чат бот', 'розробка бота', 'техпідтримка сайту', 'редизайн сайту', 'доробити сайт',
      'поправити сайт', 'баги на сайті', 'верстка figma', 'перенести дизайн', 'написати скрипт',
      'написати бота', 'розробити додаток', 'розробка додатку', 'мобільний додаток',
      // Російські фрази
      'разработка сайта', 'разработать сайт', 'создание сайта', 'создать сайт', 'нужен сайт',
      'нужен лендинг', 'сделать лендинг', 'лендинг под ключ', 'верстка сайта', 'сверстать сайт',
      'веб-разработчик', 'веб разработчик', 'разработка бота', 'написать бота', 'создать бота',
      'сделать бота', 'доработать сайт', 'поправить сайт', 'редизайн сайта', 'нужен разработчик',
      'ищем разработчика', 'нужен программист', 'ищем программиста', 'вакансия разработчик',
      'вакансия программист', 'frontend разработчик', 'backend разработчик', 'fullstack разработчик',
      'разработка приложения', 'мобильное приложение', 'написать скрипт', 'написать парсер',
      // English / Tech Vacancy titles & GameDev / Roblox / Desktop
      'frontend developer', 'backend developer', 'fullstack developer', 'full stack developer',
      'web developer', 'python developer', 'react developer', 'node developer', 'wordpress developer',
      'mobile developer', 'software engineer', 'roblox developer', 'roblox scripter', 'luau developer',
      'разработчик roblox', 'розробник roblox', 'скриптер roblox', 'разработка игр', 'розробка ігор',
      'game developer', 'gamedev developer', 'unity developer', 'unreal engine developer',
      'написати програму', 'написать программу', 'розробити програму', 'разработать программу',
      'софт на заказ', 'софт на замовлення', 'desktop developer'
    ],
    keywords: [
      'лендінг', 'лендинг', 'landing', 'верстк', 'frontend', 'фронтенд', 'backend', 'бэкенд', 'бекэнд',
      'fullstack', 'фулстек', 'фуллстек', 'веб-розроб', 'веб-разраб', 'програміст', 'программист',
      'developer', 'розробник', 'разработчик', 'webflow', 'wordpress', 'вордпрес', 'телеграм-бот',
      'чат-бот', 'чат бот', 'tilda', 'тильда', 'three.js', 'react', 'vue', 'angular', 'next.js',
      'nextjs', 'nuxt', 'node', 'nodejs', 'python', 'пайтон', 'django', 'fastapi', 'flask', 'php',
      'laravel', 'ларавел', 'c#', '.net', 'golang', 'flutter', 'react native', 'парсер', 'скрипт',
      'інтернет-магазин', 'интернет-магазин', 'ecommerce', 'shopify', 'opencart', 'bitrix', 'битрикс',
      'roblox', 'роблокс', 'luau', 'gamedev', 'геймдев', 'unity', 'unreal', 'ue5', 'десктоп', 'desktop'
    ],
    subcategories: {
      landing: ['лендінг', 'лендинг', 'landing', 'односторінков', 'одностраничн', 'посадочн', 'лендос', 'taplink'],
      ecommerce: ['інтернет-магазин', 'интернет-магазин', 'магазин', 'e-commerce', 'ecommerce', 'кошик', 'корзина', 'шоп', 'shopify', 'opencart'],
      catalog: ['каталог', 'сайти-каталоги', 'каталог товарів', 'каталог товаров'],
      '3d_site': ['3d', 'three.js', 'threejs', 'webgl', 'spline'],
      multipages: ['багатосторінков', 'многостраничн', 'корпоративн', 'сервіс', 'сервис', 'портал'],
      tg_bots: ['телеграм-бот', 'тг бот', 'tg bot', 'чат-бот', 'бот для', 'бота', 'парсер', 'скрипт', 'парс'],
      maintenance: ['техпідтримк', 'техподдержк', 'підтримка', 'поддержка', 'обслуговування', 'обслуживание', 'правки', 'баги', 'доробити', 'доработать', 'редизайн'],
      frontend: ['frontend', 'фронтенд', 'react', 'реакт', 'vue', 'вью', 'angular', 'next.js', 'nextjs', 'nuxt', 'верстк', 'html', 'css', 'tailwind', 'javascript', 'typescript'],
      backend: ['backend', 'бэкенд', 'бекэнд', 'node', 'nodejs', 'python', 'пайтон', 'django', 'fastapi', 'flask', 'php', 'laravel', 'ларавел', 'golang', 'c#', '.net', 'api', 'rest api', 'sql', 'postgres'],
      fullstack: ['fullstack', 'full-stack', 'фулстек', 'фуллстек'],
      mobile: ['flutter', 'флаттер', 'react native', 'mobile', 'мобільн', 'мобильн', 'ios', 'android', 'swift', 'kotlin'],
      gamedev_roblox: ['roblox', 'роблокс', 'luau', 'gamedev', 'геймдев', 'unity', 'unreal', 'ue5', 'плейс', 'скриптер', 'scripter', 'розробка ігор', 'разработка игр'],
      desktop_software: ['десктоп', 'desktop', 'софт', 'программа', 'програма', 'утиліта', 'утилита', 'автоматизація', 'автоматизация'],
      vacancies_it: ['вакансія', 'вакансия', 'робота в it', 'работа в it', 'middle', 'junior', 'senior', 'lead', 'разработчик в штат', 'розробник в команду']
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
      'пошукова оптимізація', 'лідогенерація', 'арбітраж трафіку',
      // Російські фрази
      'нужен таргетолог', 'ищем таргетолога', 'таргетированная реклама', 'таргет инстаграм',
      'настроить таргет', 'настроить рекламу', 'запустить рекламу', 'контекстная реклама',
      'реклама в тикток', 'реклама в телеграм', 'трафик-менеджер', 'smm специалист', 'smm-специалист',
      'ведение инстаграм', 'seo специалист', 'лидогенерация',
      // English Marketing & Ads phrases
      'media buyer', 'meta ads', 'facebook ads', 'google ads', 'ad specialist', 'ads specialist',
      'ppc specialist', 'ppc manager', 'smm manager', 'social media marketer', 'digital marketer',
      'growth marketer', 'lead generation', 'performance marketer', 'run ads', 'manage ads',
      'tiktok ads', 'ad campaign', 'ad manager'
    ],
    keywords: [
      'таргет', 'таргетолог', 'meta ads', 'facebook ads', 'google ads', 'контекстна реклама', 'контекстная реклама',
      'smm', 'трафік', 'трафик', 'медіабаєр', 'медиабаер', 'buyer', 'лідогенерація', 'лидогенерация', 'seo',
      'ppc', 'performance marketing', 'media buying', 'ad manager', 'ad campaign'
    ],
    subcategories: {
      meta_target: ['таргет', 'meta', 'facebook', 'інстаграм', 'инстаграм', 'instagram', 'fb ads'],
      google_ads: ['google ads', 'гугл реклама', 'контекст', 'пошукова реклама', 'гугл едс'],
      tiktok_ads: ['tiktok', 'тікток', 'тік ток', 'тикток', 'тик ток', 'tiktok ads'],
      telegram_ads: ['посів', 'посев', 'реклама в тг', 'реклама в телеграм', 'tg ads'],
      seo: ['seo', 'сео', 'просування в гугл', 'продвижение в гугл', 'пошукова оптимізація']
    }
  },
  montage: {
    name: 'Монтаж',
    strongPhrases: [
      'потрібен монтажер', 'шукаємо монтажера', 'відеомонтажер', 'відеомонтаж', 'монтаж reels',
      'монтаж рілс', 'монтаж shorts', 'монтаж tiktok', 'монтаж тікток', 'монтаж відео', 'змонтувати відео',
      'монтаж youtube', 'ютуб випуск', 'моушн-дизайнер', 'motion designer', 'моушн дизайн',
      'рекламні креативи', 'відеокреативи', 'креативи для таргету', 'анімація логотипу', 'промо ролик',
      // Російські фрази
      'нужен монтажер', 'ищем монтажера', 'видеомонтажер', 'видеомонтаж', 'монтаж reels',
      'монтаж рилс', 'монтаж видео', 'смонтировать видео', 'монтаж роликов', 'рекламные креативы', 'видеокреативы'
    ],
    keywords: [
      'відеомонтаж', 'видеомонтаж', 'монтажер', 'reels', 'рілс', 'рилс', 'shorts', 'youtube монтаж', 'premiere pro',
      'after effects', 'capcut', 'моушн', 'motion design', 'відеокреатив', 'видеокреатив'
    ],
    subcategories: {
      reels_tiktok: ['reels', 'рілс', 'рилс', 'shorts', 'шортс', 'тікток', 'тикток', 'вертикальн'],
      youtube: ['youtube', 'ютуб', 'довгий монтаж', 'длинный монтаж', 'випуск', 'выпуск'],
      ads_creatives: ['креатив', 'рекламне відео', 'рекламное видео', 'промо', 'крео'],
      motion: ['моушн', 'motion', 'анімація', 'анимация', '2d', '3d анімація', '3d анимация']
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
 * Strict Candidate Resume, Self-Promotion & Chit-Chat Detector
 * Returns true if text is a candidate CV, freelancer pitch, or general discussion.
 */
export function isCandidateResumeOrSelfPromo(text, title = '') {
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

  // 2. Candidate job seeking statements (looking for a job, project for oneself)
  if (/\b(?:шукаю|ищу)\s+(?:роботу|вакансію|вакансию|підробіток|подработку|проєкти|проекти|проекты|заказы|замовлення|клієнтів|клиентов)\b/i.test(lower)) {
    return true;
  }
  if (/\b(?:в\s+пошуку\s+роботи|в\s+поиске\s+работы|відкритий\s+до\s+пропозицій|відкрита\s+до\s+пропозицій|открыт\s+к\s+предложениям|открыта\s+к\s+предложениям|рассмотрю\s+предложения|розгляну\s+пропозиції)\b/i.test(lower)) {
    return true;
  }
  if (/\b(?:готовий|готова|готов)\s+(?:працювати|работать|взятися|взяться)\b/i.test(lower)) {
    return true;
  }

  // 3. Candidate self sections (Обо мне, О себе, Про себе, Про мене, Мой стек, Мій стек, Бажана ЗП)
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

/**
 * Precision Rule-Based Classifier.
 * Returns null if post should be filtered out.
 */
export function classifyLeadRuleBased(text, authorUsername = '') {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();
  if (clean.length < 25) return null; // Too short to be a real job specification
  const lower = clean.toLowerCase();

  // 0. Reject Bot Greetings, Captchas, Verifications, and bot authors
  if (authorUsername && (authorUsername.toLowerCase().endsWith('bot') || authorUsername.toLowerCase().includes('_bot') || authorUsername.toLowerCase() === '@shieldy_bot')) {
    return null;
  }
  for (const botWord of BOT_AND_VERIFICATION_STOP_WORDS) {
    if (lower.includes(botWord)) return null;
  }

  // 1. Unconditionally reject Candidate Resumes & Freelancer Self-Promotions
  if (isCandidateResumeOrSelfPromo(clean)) {
    return null;
  }

  // Reject CV / Resume hashtags immediately
  if (/#cv\b|#resume\b|#резюме\b|#ищуработу|#ищу_работу|#ищузаказы|#ищу_заказы|#forhire/i.test(clean)) {
    return null;
  }

  // 2. Check Spam & Employer Intent
  const isEmployerPosting = /шукаємо|іщем|ищем|требуется|требуются|вакансі[яї]|ваканси[яи]|в команду|в штат|открыта позиция|ищем разработчика|шукаємо розробника|нужен разработчик|потрібен розробник|нужен программист|потрібен програміст|замовлення|заказ\b/i.test(lower);

  // Reject technical questions & chit-chat disguised with tech keywords
  const isQuestion = lower.includes('?') && (
    lower.includes('работает ?') || lower.includes('працює ?') || lower.includes('подскажите') ||
    lower.includes('підкажіть') || lower.includes('кто знает') || lower.includes('хто знає') ||
    lower.includes('посоветуйте') || lower.includes('порадьте') || lower.includes('почему') ||
    lower.includes('чому') || lower.includes('как сделать') || lower.includes('як зробити') ||
    lower.includes('у кого есть') || lower.includes('у кого є')
  );
  if (isQuestion && !isEmployerPosting) {
    return null;
  }

  for (const sw of RESUME_AND_SPAM_STOP_WORDS) {
    // If it's explicitly an employer/recruiter posting, don't drop on mentions of sending resume
    if (isEmployerPosting && (sw.includes('резюме') || sw.includes('портфоліо') || sw.includes('портфолио'))) {
      continue;
    }
    if (lower.includes(sw)) return null;
  }

  // 2. Reject meetups, conferences, hackathons, and news
  for (const ev of EVENT_AND_MEETUP_STOP_WORDS) {
    if (lower.includes(ev)) return null;
  }

  // 3. Reject Offline Jobs (Baristas, drivers, cleaners, etc.)
  for (const offline of OFFLINE_STOP_WORDS) {
    if (lower.includes(offline)) return null;
  }

  // 4. MANDATORY CLIENT / HIRING INTENT (must be an actual job vacancy, order, or contract)
  let hasClientIntent = false;
  for (const trig of CLIENT_INTENT_TRIGGERS) {
    if (lower.includes(trig)) {
      hasClientIntent = true;
      break;
    }
  }
  if (!hasClientIntent) {
    return null; // Reject all general chatting, news, and syntax discussions
  }

  // 5. Match against Strong Digital Phrases & Keywords in 3 Core Niches
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

  // 6. If no strong phrase, check keyword density
  if (!matchedNiche) {
    let bestScore = 0;
    for (const [catKey, catData] of Object.entries(NICHES)) {
      let count = 0;
      for (const kw of catData.keywords) {
        if (lower.includes(kw)) count++;
      }
      if (count >= 1 && count > bestScore) {
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
          tg_bots: "Телеграм-бот та автоматизація",
          maintenance: "Технічне обслуговування",
          frontend: "Frontend розробка",
          backend: "Backend & API розробка",
          fullstack: "Fullstack розробка",
          mobile: "Мобільні додатки",
          vacancies_it: "IT Вакансії / Розробка",
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

  // Country & Market detection (реальна країна клієнта/вакансії)
  let country = 'Україна';
  if (/(?:ринок сша|клієнт зі сша|клієнти зі сша|замовник зі сша|компанія зі сша|us market|us client|usa|new york|нью-йорк|калифорн|каліфорн|майами|маямі|техас|лос-анджелес)/i.test(clean)) {
    country = 'США';
  } else if (/(?:zł|pln|польщ|польша|варшав|warszaw|краків|krakow|вроцлав|wroclaw)/i.test(clean)) {
    country = 'Польща';
  } else if (/(?:німеччин|герман|germany|deutschland|берлін|berlin|мюнхен|munich|гамбург)/i.test(clean)) {
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
  } else if (/(?:грн|uah|₴|київ|львів|україна|дніпро|одес|харків|вінниц|запоріжж|полтав|черкас|тернопіль|ужгород)/i.test(clean) || /[іїєґ]/.test(clean)) {
    country = 'Україна';
  } else if (/(?:upwork|weworkremotely)/i.test(clean)) {
    country = 'США';
  } else if (/^[a-zA-Z0-9\s.,!?'"():;$-]+$/.test(clean.slice(0, 100)) && /(?:\$|usd)/i.test(clean)) {
    country = 'США';
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
