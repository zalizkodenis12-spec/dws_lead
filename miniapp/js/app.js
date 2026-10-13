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

const DEFAULT_DATA = {
  leads: [
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    "inCrm": false
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
    responseTemplate: "Вітаю, {NAME}! Побачив ваше замовлення щодо {TASK}. У DenisWeb Studio ми реалізуємо подібні проєкти під ключ за 2-4 дні з гарантією швидкості та чистого коду.\n\nГотові безкоштовно розробити концепт та інтерактивне демо головного блоку ще до початку оплати, щоб ви наочно побачили результат.\n\nНаш сайт та кейси: https://denis-webstudio.site\nКоли вам зручно коротко обговорити деталі?"
  }
};

// ============================================================
// APP STATE
// ============================================================
const savedSourcesRaw = JSON.parse(localStorage.getItem('dws_sources') || 'null');
const normalizedSources = (savedSourcesRaw && Array.isArray(savedSourcesRaw.chats) && savedSourcesRaw.chats.length >= 79)
  ? savedSourcesRaw
  : { chats: Array(79).fill({}), channels: Array(14).fill({}) };

const savedTakenIds = JSON.parse(localStorage.getItem('dws_taken_leads') || '[]');

let savedIncomeRaw = null;
try {
  savedIncomeRaw = JSON.parse(localStorage.getItem('dws_income'));
} catch (e) {}
const normalizedIncome = (savedIncomeRaw && Array.isArray(savedIncomeRaw.records))
  ? savedIncomeRaw
  : { records: [], currency: "₴" };

const state = {
  currentTab: 'tab-leads',
  theme: localStorage.getItem('dws_theme') || 'light',
  allLeads: [...DEFAULT_DATA.leads],
  leads: [...DEFAULT_DATA.leads],
  takenLeadIds: new Set(Array.isArray(savedTakenIds) ? savedTakenIds : []),
  justTakenSessionIds: new Set(),
  crm: JSON.parse(localStorage.getItem('dws_crm') || 'null') || [...DEFAULT_DATA.crm],
  income: normalizedIncome,
  incomeFilterPeriod: 'all',
  incomeDateRange: null,
  incomeActiveChartMonthIdx: null,
  profile: JSON.parse(localStorage.getItem('dws_profile') || 'null') || { ...DEFAULT_DATA.profile },
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
  accountKey: localStorage.getItem('dws_account_key') || (tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : 'default'),
  accountUser: localStorage.getItem('dws_account_user') || (tg?.initDataUnsafe?.user?.username ? ('@' + tg.initDataUnsafe.user.username) : ''),
  accountName: localStorage.getItem('dws_account_name') || (tg?.initDataUnsafe?.user?.first_name || 'Денис Залізко')
};

// Helper: Open direct Telegram PM with vacancy owner
function openTelegramContact(lead, prefilledText = '') {
  let username = (lead.authorUsername || '').replace(/^@/, '').trim();
  if (username.includes('https://t.me/')) {
    username = username.replace('https://t.me/', '').split('/')[0].split('?')[0].trim();
  }
  if (username.includes('@')) username = username.split('@')[1];
  if (username.includes('.')) username = username.split('.')[0];

  if (!username && lead.sourceUsername) {
    username = lead.sourceUsername.replace(/^@/, '').trim();
  }

  let tgUrl = 'https://t.me/' + username;
  if (prefilledText) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(prefilledText).catch(() => {});
    }
    tgUrl += '?text=' + encodeURIComponent(prefilledText);
  }

  if (tg?.openTelegramLink) {
    tg.openTelegramLink(tgUrl);
  } else {
    window.open(tgUrl, '_blank');
  }
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNav();
  setupModals();
  setupProfileCounters();
  setupCalendarModal();
  setupCrmFilterModal();
  setupCrmDetailHandlers();
  setupAccountSync();
  setupEventListeners();
  loadAllData();
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

  document.querySelectorAll('.tab-view').forEach(view => {
    view.classList.toggle('active', view.id === tabId);
  });

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelector('.app-main').scrollTop = 0;
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
    fetchProfile(),
    fetchSources()
  ]);
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

    const res = await fetch('/api/leads?' + params.toString());
    const json = await res.json();
    if (json.success && Array.isArray(json.data) && json.data.length > 0) {
      state.allLeads = json.data;
      filterAndRenderLeads();
      return;
    }
  } catch (err) {
    console.warn('Using embedded dataset for leads:', err);
  }

  if (!state.allLeads || state.allLeads.length === 0) {
    state.allLeads = [...DEFAULT_DATA.leads];
  }
  filterAndRenderLeads();
}

function filterAndRenderLeads() {
  let list = [...(state.allLeads || DEFAULT_DATA.leads)];

  // Sync inCrm status from saved takenLeadIds and hide already-taken leads after refresh
  list = list.filter(l => {
    if (state.takenLeadIds.has(l.id)) {
      l.inCrm = true;
    }
    if (l.inCrm && !state.justTakenSessionIds.has(l.id)) {
      return false;
    }
    return true;
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

    return `
      <div class="lead-card" data-id="${lead.id}">
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
          <span class="lead-tag country">${escapeHtml(lead.country || '🇺🇦 Україна')}</span>
        </div>

        <!-- Action button -->
        <div class="lead-actions-row">
          <button class="btn btn--fill btn--block btn--take-crm ${lead.inCrm ? 'btn--out' : ''}" data-action="take-crm" data-id="${lead.id}">
            ${lead.inCrm ? 'В РОБОТІ ✓' : 'ВЗЯТИ В РОБОТУ'}
          </button>
        </div>
      </div>
    `;
  }).join('');
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
      genAiBtn.textContent = '✨ Згенерувати короткий опис від AI';
      genAiBtn.disabled = false;
      genAiBtn.onclick = async () => {
        haptic('light');
        genAiBtn.textContent = '✨ Генеруємо...';
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

  // Direct TG button click handler
  if (directTgBtn) {
    directTgBtn.onclick = () => {
      haptic('light');
      openTelegramContact(lead, '');
    };
  }

  // AI offer button click handler
  if (aiOfferBtn) {
    aiOfferBtn.onclick = () => {
      haptic('success');
      const clientName = lead.authorName || (lead.authorUsername ? lead.authorUsername.replace('@', '') : 'замовнику');
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

  // Automatically add lead to CRM if not yet added
  if (!lead.inCrm) {
    lead.inCrm = true;
    state.takenLeadIds.add(lead.id);
    state.justTakenSessionIds.add(lead.id);
    localStorage.setItem('dws_taken_leads', JSON.stringify([...state.takenLeadIds]));

    if (btn) {
      btn.textContent = 'В РОБОТІ ✓';
      btn.classList.add('btn--out');
      btn.classList.remove('btn--fill');
    }

    // Add to local CRM state as well so it works offline/static
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
        currency: '₴',
        source: 'tg_leads',
        sourceLabel: lead.sourceName || 'DWS Lead',
        notes: cleanVacancyText(lead.text),
        orders: [{ id: 'ord-' + Date.now(), title: lead.title || 'Замовлення', amount: lead.budget || 0, paidStatus: 'unpaid', deadline: '' }]
      });
      localStorage.setItem('dws_crm', JSON.stringify(state.crm));
      renderCrm();
    }

    fetch('/api/leads/' + lead.id + '/take-to-crm', { method: 'POST' })
      .then(res => res.json())
      .then(json => {
        if (json.success) fetchCrm();
      })
      .catch(() => {});
  }

  openModal('modalTakeCrmLead');
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
  try {
    const res = await fetch('/api/crm');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      state.crm = json.data;
      localStorage.setItem('dws_crm', JSON.stringify(state.crm));
    }
  } catch (err) {
    console.warn('Error fetching CRM:', err);
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
  try {
    const res = await fetch('/api/income');
    const json = await res.json();
    if (json.success && json.data) {
      state.income = json.data;
      if (!Array.isArray(state.income.records)) {
        state.income.records = [];
      }
      localStorage.setItem('dws_income', JSON.stringify(state.income));
    }
  } catch (err) {
    console.warn('Error fetching income:', err);
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

// ---- 4. PROFILE ----
async function fetchProfile() {
  try {
    const res = await fetch('/api/profile');
    const json = await res.json();
    if (json.success && json.data) {
      state.profile = { ...state.profile, ...json.data };
    }
  } catch (err) {
    console.warn('Error fetching profile:', err);
  }

  const aboutEl = document.getElementById('profileAbout');
  const tmplEl = document.getElementById('profileTemplate');

  if (aboutEl) {
    aboutEl.value = state.profile.about || DEFAULT_DATA.profile.about;
    updateCharCount(aboutEl, 'aboutCounter');
  }
  if (tmplEl) {
    tmplEl.value = state.profile.responseTemplate || DEFAULT_DATA.profile.responseTemplate;
    updateCharCount(tmplEl, 'templateCounter');
  }
  if (state.profile.theme) {
    applyTheme(state.profile.theme);
  }
}

// ---- 5. SOURCES ----
async function fetchSources() {
  try {
    const res = await fetch('/api/sources');
    const json = await res.json();
    if (json.success && json.data) {
      state.sources = json.data;
      localStorage.setItem('dws_sources', JSON.stringify(state.sources));
    }
  } catch (err) {}

  updateSourcesDisplay();
}

function updateSourcesDisplay() {
  const chatsCount = state.sources?.chats?.length || 79;
  const channelsCount = state.sources?.channels?.length || 14;
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
        // Server might be in static mode or offline, fallback to loadAllData
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

      // 1. "Взяти в роботу" button -> opens modalTakeCrmLead
      const takeBtn = e.target.closest('[data-action="take-crm"]');
      if (takeBtn) {
        openTakeCrmModal(lead, takeBtn);
        return;
      }

      // 2. AI Rating button (right square button) -> 100% reliable trigger
      const ratingBtn = e.target.closest('[data-action="ai-rating"]');
      if (ratingBtn) {
        e.stopPropagation();
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
      const about = document.getElementById('profileAbout')?.value || '';
      const template = document.getElementById('profileTemplate')?.value || '';

      state.profile.about = about;
      state.profile.responseTemplate = template;
      localStorage.setItem('dws_profile', JSON.stringify(state.profile));

      saveProfileBtn.textContent = 'ЗБЕРІГАЄМО...';
      try {
        await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ about, responseTemplate: template, theme: state.theme })
        });
      } catch (err) {}

      haptic('success');
      saveProfileBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
      setTimeout(() => { saveProfileBtn.textContent = 'ЗБЕРЕГТИ НАЛАШТУВАННЯ'; }, 2000);
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

  // 4 Additional Contact fields
  const links = item.links || {};
  const phoneInput = document.getElementById('crmLinkPhone');
  if (phoneInput) phoneInput.value = links.phone || '';

  const instaInput = document.getElementById('crmLinkInsta');
  if (instaInput) instaInput.value = links.instagram || '';

  const tiktokInput = document.getElementById('crmLinkTiktok');
  if (tiktokInput) tiktokInput.value = links.tiktok || '';

  const tgChanInput = document.getElementById('crmLinkTgChannel');
  if (tgChanInput) tgChanInput.value = links.tgChannel || '';

  // Service (full-width)
  const servSelect = document.getElementById('crmDetailService');
  if (servSelect) servSelect.value = item.service || 'development';

  // Niche
  const nicheInput = document.getElementById('crmDetailNiche');
  if (nicheInput) nicheInput.value = item.niche || '';

  // Notes
  const notesText = document.getElementById('crmDetailNotes');
  if (notesText) notesText.value = item.notes || '';

  // Orders initialization
  if (!Array.isArray(item.orders)) {
    item.orders = [];
    if (item.orderTitle || (item.budget && Number(item.budget) > 0)) {
      item.orders.push({
        id: 'ord-' + Date.now(),
        title: item.orderTitle || 'Створення сайту',
        amount: Number(item.budget) || 0,
        dateStart: '',
        dateEnd: item.deadline || '',
        paidStatus: 'unpaid'
      });
    }
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
    list.innerHTML = `<div style="text-align: center; color: var(--muted); font-size: 0.8rem; padding: 12px; background: var(--card-sub); border: 1px dashed var(--border); border-radius: var(--r-sm);">Замовлень ще немає. Натисніть «+ Додати замовлення»</div>`;
    return;
  }

  const statusLabels = { unpaid: '1) Не оплачено', partial: '2) Частково', paid: '3) Оплачено' };

  list.innerHTML = orders.map((ord, idx) => {
    const stText = statusLabels[ord.paidStatus] || '1) Не оплачено';
    const amtText = Number(ord.amount) > 0 ? (Number(ord.amount).toLocaleString('uk-UA') + ' ₴') : '';
    const datesText = (ord.dateStart || ord.dateEnd) ? `${ord.dateStart || '...'} → ${ord.dateEnd || '...'}` : '';

    return `
      <div class="crm-order-item-chip" data-idx="${idx}">
        <div class="crm-order-chip-left">
          <div class="crm-order-chip-title">${escapeHtml(ord.title || 'Створення сайту')} ${amtText ? `• <span style="color:var(--accent); font-weight:800;">${amtText}</span>` : ''}</div>
          <div class="crm-order-chip-meta">${datesText ? `📅 ${datesText}` : ''}</div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="crm-order-chip-status ${ord.paidStatus === 'paid' ? 'paid' : ''}">${stText}</span>
          <button type="button" class="btn-order-edit" data-idx="${idx}" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:0.9rem; padding:2px;" title="Редагувати">✏️</button>
          <button type="button" class="btn-order-del" data-idx="${idx}" style="background:none; border:none; color:var(--muted); cursor:pointer; font-size:1.15rem; line-height:1; padding:2px;" title="Видалити">&times;</button>
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

      const startInput = document.getElementById('crmOrderDateStart');
      if (startInput) startInput.value = ord.dateStart || '';

      const endInput = document.getElementById('crmOrderDateEnd');
      if (endInput) endInput.value = ord.dateEnd || '';

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
      renderCrmOrdersList();
      renderCrm();
      haptic('medium');
    });
  });
}

// Setup handlers for CRM Lead detail modal buttons (pencil, orders, save, delete)
function setupCrmDetailHandlers() {
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
    saveEditNameBtn.addEventListener('click', () => {
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
      document.getElementById('crmOrderServiceInput').value = 'Створення сайту';
      document.getElementById('crmOrderAmountInput').value = '';
      document.getElementById('crmOrderDateStart').value = new Date().toISOString().split('T')[0];
      document.getElementById('crmOrderDateEnd').value = '';

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
        tgChannel: document.getElementById('crmLinkTgChannel')?.value || ''
      };

      const orders = Array.isArray(state.activeCrmLead.orders) ? state.activeCrmLead.orders : [];
      const totalBudget = orders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

      const updates = {
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
        await fetch('/api/crm/' + state.activeCrmLead.id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });

        const idx = state.crm.findIndex(c => c.id === state.activeCrmLead.id);
        if (idx !== -1) {
          state.crm[idx] = { ...state.crm[idx], ...updates };
          localStorage.setItem('dws_crm', JSON.stringify(state.crm));
        }

        haptic('success');
        saveCrmDetailBtn.textContent = 'ЗБЕРЕЖЕНО ✓';
        closeModal('modalCrmDetail');
        renderCrm();
        syncAccountToServer();
      } catch (err) {
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

function setupCalendarModal() {
  const openCalendarBtn = document.getElementById('openCalendarBtn');
  const calPrevMonthBtn = document.getElementById('calPrevMonthBtn');
  const calNextMonthBtn = document.getElementById('calNextMonthBtn');
  const calResetBtn = document.getElementById('calResetBtn');
  const calApplyBtn = document.getElementById('calApplyBtn');

  if (openCalendarBtn) {
    openCalendarBtn.addEventListener('click', () => {
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
      state.incomeDateRange = { start: finalStart, end: finalEnd };
      state.incomeFilterPeriod = null;

      const sParts = finalStart.split('-');
      const eParts = finalEnd.split('-');
      const labelText = `${sParts[2]}.${sParts[1]} – ${eParts[2]}.${eParts[1]}`;

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

      haptic('success');
      closeModal('modalCrmFilter');
    });
  }
}

// ============================================================
// ACCOUNT SYNC & RECOGNITION (MULTI-DEVICE LINKING)
// ============================================================
function setupAccountSync() {
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;

  if (tgUser && tgUser.id) {
    // Automatically recognized via Telegram WebApp
    state.accountKey = String(tgUser.id);
    state.accountUser = tgUser.username ? ('@' + tgUser.username) : '';
    state.accountName = (tgUser.first_name + ' ' + (tgUser.last_name || '')).trim() || 'Денис Залізко';
    localStorage.setItem('dws_account_key', state.accountKey);
    localStorage.setItem('dws_account_user', state.accountUser);
    localStorage.setItem('dws_account_name', state.accountName);
  } else {
    // External browser: check saved accountKey or prompt after short delay
    const savedKey = localStorage.getItem('dws_account_key');
    if (!savedKey) {
      setTimeout(() => {
        openModal('modalAccountLink');
      }, 700);
    }
  }

  const quickDenisBtn = document.getElementById('quickLoginDenisBtn');
  const accountInput = document.getElementById('accountUserInput');
  const submitAccountBtn = document.getElementById('submitAccountBtn');

  if (quickDenisBtn && accountInput) {
    quickDenisBtn.addEventListener('click', () => {
      accountInput.value = '@zalizkodenis12';
      haptic('light');
    });
  }

  if (submitAccountBtn) {
    submitAccountBtn.addEventListener('click', async () => {
      const val = (accountInput?.value || '').trim();
      const cleanKey = val.replace(/^@/, '') || 'zalizkodenis12';

      state.accountKey = cleanKey;
      state.accountUser = val.startsWith('@') ? val : ('@' + cleanKey);
      state.accountName = 'Денис Залізко';

      localStorage.setItem('dws_account_key', state.accountKey);
      localStorage.setItem('dws_account_user', state.accountUser);
      localStorage.setItem('dws_account_name', state.accountName);

      haptic('success');
      closeModal('modalAccountLink');
      await loadAllData();
    });
  }
}

async function fetchAccountData() {
  if (!state.accountKey) return;
  try {
    const res = await fetch('/api/account/' + encodeURIComponent(state.accountKey));
    const json = await res.json();
    if (json.success && json.data) {
      if (Array.isArray(json.data.crm) && json.data.crm.length > 0) {
        state.crm = json.data.crm;
        localStorage.setItem('dws_crm', JSON.stringify(state.crm));
      }
      if (json.data.income && Array.isArray(json.data.income.records) && json.data.income.records.length > 0) {
        state.income = json.data.income;
        localStorage.setItem('dws_income', JSON.stringify(state.income));
      }
      if (Array.isArray(json.data.takenLeadIds) && json.data.takenLeadIds.length > 0) {
        json.data.takenLeadIds.forEach(id => state.takenLeadIds.add(id));
        localStorage.setItem('dws_taken_leads', JSON.stringify([...state.takenLeadIds]));
      }
    }
  } catch (err) {
    console.warn('Account sync error:', err);
  }
}

async function syncAccountToServer() {
  if (!state.accountKey) return;
  try {
    await fetch('/api/account/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountKey: state.accountKey,
        username: state.accountUser,
        name: state.accountName,
        crm: state.crm,
        income: state.income,
        takenLeadIds: [...state.takenLeadIds]
      })
    });
  } catch (err) {
    console.warn('Sync error:', err);
  }
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
