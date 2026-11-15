import {
  getCloudKvOutreachUrl,
  getMtprotoClientForAccount,
  withLockedChromePage,
  extractPhonesFromText,
  extractSocialHandlesFromHtml,
  getCityVariants,
  textMatchesCity,
  hasForeignCityMismatch,
  discoverContactsForVenueItem
} from '../outreach/nfcOutreachEngine.js';
import {
  getSeenData,
  registerSeenBusinesses,
  extractBizSeenKeys
} from './scraper.js';

const GOOGLE_PLACES_FALLBACK_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyCPkkYJHF46FDTQRSvbF6fn3vgwM7zNGKY';
const DEFAULT_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

export const CITY_META_MAP = {
  'вінниц': { workSlug: 'vinnytsia', olxSlug: 'vinnitsa', tgChannels: ['rabota_vakansiivin', 'Vinnytsia_Job', 'toprobotavinnytsia24', 'rabota_vinnitsa7', 'vakansiiq_rabota_vinnitsa'], display: 'Вінниця' },
  'винниц': { workSlug: 'vinnytsia', olxSlug: 'vinnitsa', tgChannels: ['rabota_vakansiivin', 'Vinnytsia_Job', 'toprobotavinnytsia24', 'rabota_vinnitsa7', 'vakansiiq_rabota_vinnitsa'], display: 'Вінниця' },
  'київ': { workSlug: 'kyiv', olxSlug: 'kiev', tgChannels: ['robota_kyiv_ua', 'rabota_kiev_vakansii', 'robotka_kiev', 'toprobota_kyiv', 'rabotay_kieve'], display: 'Київ' },
  'киев': { workSlug: 'kyiv', olxSlug: 'kiev', tgChannels: ['robota_kyiv_ua', 'rabota_kiev_vakansii', 'robotka_kiev', 'toprobota_kyiv', 'rabotay_kieve'], display: 'Київ' },
  'львів': { workSlug: 'lviv', olxSlug: 'lvov', tgChannels: ['lviv_vakansii', 'robota_lviv_ua', 'robota_lviv'], display: 'Львів' },
  'львов': { workSlug: 'lviv', olxSlug: 'lvov', tgChannels: ['lviv_vakansii', 'robota_lviv_ua', 'robota_lviv'], display: 'Львів' },
  'одес': { workSlug: 'odesa', olxSlug: 'odessa', tgChannels: ['rabota_odessa', 'odessa_vakansii', 'robota_odessa_ua'], display: 'Одеса' },
  'дніпр': { workSlug: 'dnipro', olxSlug: 'dnepr', tgChannels: ['dnepr_vakansii', 'robota_dnepr_ua', 'dnipro_work'], display: 'Дніпро' },
  'днепр': { workSlug: 'dnipro', olxSlug: 'dnepr', tgChannels: ['dnepr_vakansii', 'robota_dnepr_ua', 'dnipro_work'], display: 'Дніпро' },
  'харків': { workSlug: 'kharkiv', olxSlug: 'kharkov', tgChannels: ['work_kharkiv', 'kharkov_vakansii', 'rabota_kharkov'], display: 'Харків' },
  'харьков': { workSlug: 'kharkiv', olxSlug: 'kharkov', tgChannels: ['work_kharkiv', 'kharkov_vakansii', 'rabota_kharkov'], display: 'Харків' },
  'запоріж': { workSlug: 'zaporizhzhya', olxSlug: 'zaporozhe', tgChannels: ['rabota_zp', 'zaporozhe_rabota'], display: 'Запоріжжя' },
  'полтав': { workSlug: 'poltava', olxSlug: 'poltava', tgChannels: ['poltava_rabota', 'work_poltava'], display: 'Полтава' },
  'черкас': { workSlug: 'cherkasy', olxSlug: 'cherkassy', tgChannels: ['cherkassy_rabota', 'work_cherkasy'], display: 'Черкаси' },
  'житомир': { workSlug: 'zhytomyr', olxSlug: 'zhitomir', tgChannels: ['zhitomir_rabota', 'work_zhytomyr'], display: 'Житомир' },
  'рівн': { workSlug: 'rivne', olxSlug: 'rovno', tgChannels: ['rivne_robota', 'rovno_rabota'], display: 'Рівне' },
  'ровн': { workSlug: 'rivne', olxSlug: 'rovno', tgChannels: ['rivne_robota', 'rovno_rabota'], display: 'Рівне' },
  'хмельниц': { workSlug: 'khmelnytskyi', olxSlug: 'khmelnitskiy', tgChannels: ['khmelnitskiy_rabota', 'robota_khmelnytskyi'], display: 'Хмельницький' },
  'тернопіл': { workSlug: 'ternopil', olxSlug: 'ternopol', tgChannels: ['ternopil_robota', 'work_ternopil'], display: 'Тернопіль' },
  'тернопол': { workSlug: 'ternopil', olxSlug: 'ternopol', tgChannels: ['ternopil_robota', 'work_ternopil'], display: 'Тернопіль' },
  'франків': { workSlug: 'ivano-frankivsk', olxSlug: 'ivano-frankovsk', tgChannels: ['if_robota', 'frankivsk_rabota'], display: 'Івано-Франківськ' },
  'чернівц': { workSlug: 'chernivtsi', olxSlug: 'chernovtsy', tgChannels: ['chernovtsy_rabota', 'robota_chernivtsi'], display: 'Чернівці' },
  'луцьк': { workSlug: 'lutsk', olxSlug: 'lutsk', tgChannels: ['lutsk_robota', 'work_lutsk'], display: 'Луцьк' },
  'ужгород': { workSlug: 'uzhhorod', olxSlug: 'uzhgorod', tgChannels: ['uzhgorod_rabota'], display: 'Ужгород' },
  'миколаїв': { workSlug: 'mykolaiv', olxSlug: 'nikolaev', tgChannels: ['nikolaev_rabota'], display: 'Миколаїв' },
  'сум': { workSlug: 'sumy', olxSlug: 'sumy', tgChannels: ['sumy_rabota'], display: 'Суми' },
  'черніг': { workSlug: 'chernihiv', olxSlug: 'chernigov', tgChannels: ['chernigov_rabota'], display: 'Чернігів' },
  'кропивниц': { workSlug: 'kropyvnytskyi', olxSlug: 'kropivnitskiy', tgChannels: ['kropivnitskiy_rabota'], display: 'Кропивницький' },
  'крив': { workSlug: 'kryvyi-rih', olxSlug: 'krivoyrog', tgChannels: ['kr_rabota', 'krivoyrog_rabota'], display: 'Кривий Ріг' },
  'кременч': { workSlug: 'kremenchuk', olxSlug: 'kremenchug', tgChannels: ['kremenchug_rabota'], display: 'Кременчук' },
  'біла церк': { workSlug: 'bila-tserkva', olxSlug: 'belayatserkov', tgChannels: ['bc_rabota'], display: 'Біла Церква' }
};

const GENERAL_UA_TG_CHANNELS = [
  'top_vacansii',
  'workplaceinukraine',
  'ua_work',
  'work_in_ukraine_golovne',
  'jobzy'
];

export const GOOGLE_PLACES_REJECT_TYPES = new Set([
  'lodging', 'hotel', 'motel', 'hostel', 'bed_and_breakfast', 'resort_hotel', 'guest_house', 'campground',
  'school', 'primary_school', 'secondary_school', 'high_school', 'university', 'college', 'preschool', 'library',
  'post_office', 'government_office', 'local_government_office', 'city_hall', 'courthouse', 'embassy', 'police', 'fire_station',
  'hospital', 'doctor', 'dentist', 'pharmacy', 'medical_lab', 'veterinary_care',
  'restaurant', 'cafe', 'bar', 'bakery', 'fast_food_restaurant', 'coffee_shop', 'night_club', 'meal_delivery', 'meal_takeaway', 'amusement_center', 'bowling_alley', 'movie_theater',
  'beauty_salon', 'hair_salon', 'barber_shop', 'spa', 'nail_salon', 'gym', 'fitness_center',
  'real_estate_agency', 'bank', 'atm', 'insurance_agency', 'accounting', 'lawyer',
  'church', 'place_of_worship', 'cemetery', 'funeral_home',
  'car_repair', 'car_wash', 'car_dealer', 'gas_station', 'parking',
  'grocery_store', 'supermarket', 'convenience_store', 'clothing_store', 'shoe_store', 'book_store', 'electronics_store', 'furniture_store', 'hardware_store', 'pet_store', 'florist', 'jewelry_store', 'department_store', 'shopping_mall', 'liquor_store'
]);

export const D2D_HARD_STOP_REGEX = /(лазертаг|квест|розважальн|медичн\w*\s*прилад|фізіотерап|естетичн\w*\s*медицин|aesthetics|барбер|салон\s*краси|перукар|нігт|бров|ресниц|манікюр|масаж|косметолог|стоматолог|клінік|лікарн|аптека|фармацевт|медсестр|ветклін|ресторан|кав['’]?ярн|піцер|піцейоло|суші|сушист|рол[иі]|бургер|шаурм|мангаль|шашлич|кондитер|пекарн|пекар\b|кіоск|лар[еьо]к|хлібобулоч|ремонт\s*(?:тел|авто|тех|квартир)|сто\b|шиномонтаж|автомийк|мийк|детейлінг|готел|hotel|hostel|хостел|отел[ьі]|училищ|дптнз|\bвпу\b|коледж|ліцей|гімназ|університет|технікум|школа\b|дитсадок|спецзв.?язок|укрпошт|нова\s*пошта|нотаріус|адвокат|юрист|бухгалтер|страхов|рієлтор|нерухом|realty|недвижим|оренда\s*квартир|автошкол|тур\s*аген|турагент|типограф|поліграф|видавниц|мебл[іе]|будмат|зоомагази|квіт[иі]|канцтовар|канцеляр|\bit[\s-]?(?:компан|аген|аутсорс)|web[\s-]?studio|веб[\s-]?студ|розробка\s*сайт|seo[\s-]?|smm[\s-]?|таргет|програмуван|широкоформат|вивіск|сувенір|rozetka|епіцентр|атб|сільпо|фора|аврора|варус|новус|макдональд|glovo|bolt\s*food|uklon|uber|таксі\b|водій|водія|дальнобій|охоронець|охоронник|склад\s*(?:вантаж|комплект)|вантажник|різноробоч|пакувальник|сортувальник|прибиральн|посудомий|кухар|су-шеф|офіціант|бармен|бариста|касир\b|продавец\w*\s+(?:в|у)\s+(?:кіоск|магазин|маркет)|оператор\s*(?:азс|пк|колл)|колл[\s-]?центр|слюсар|токар|електрик|сантехнік|будівельник|швач|швейн|завод\b|фабрик|цех\b|onlyfans|онліфан|вебкам|webcam|escort|ескорт|шлюбн|брачн|шлюб\s*аген|казино|gambling|ставки\b|крипт|crypto|арбітраж\s*траф|офісник)/i;

export const D2D_POSITIVE_SIGNAL_REGEX = /(d2d|д2д|btl|бтл|промоутер|промо[\s-]*(?:акц|команд|аген|персонал|модел|груп)|роздач\w*\s+(?:листів|флаєр|буклет|візит|газет)|прям\w*\s+продаж|активн\w*\s+продаж|польов\w*\s+(?:команд|агент|менеджер|торгов|продаж|бригад|персонал)|торгов\w*\s+(?:представник|агент)|супервайзер\s*(?:по|торгов|мерченд|btl|промо)?|мерчендайз|дистриб['’]?ют|бренд[\s-]*(?:амбасадор|консультант|промоутер)|консультант\s*(?:у\s*полях|на\s*вулиц|на\s*стенд|на\s*точк)|фандрайзер|агітатор|опитуванн\w*|інтерв['’]?юер|ходок\w*|вуличн\w*\s+продаж|дегустаці|поквартирн)/i;

export const D2D_DAILY_PAY_REGEX = /(щоденн\w*\s+(?:виплат|оплат|дохід)|оплата\s+(?:кожного|що)\s*дня|виплати\s*(?:кожного|що)\s*дня|від\s*\d[\d\s]{2,5}\s*грн\s*\/?\s*(?:день|зміна))/i;
export const D2D_SALES_CONTEXT_REGEX = /(продаж|клієнт|промо|btl|реклам|маркетинг|акці|консульт|представник|агент|команд|без\s*досвід|молод)/i;
export const D2D_PLACES_SIGNAL_REGEX = /(d2d|д2д|btl|бтл|промо|promo|івент|event|мерченд|дистриб|торгов\w*\s+(?:дім|компан|представ)|рекрут|маркетинг\w*\s+аген|реклам\w*\s+аген|рекламн\w*\s+агентств|прям\w*\s+продаж|фандрайз)/i;

function hasD2dPositiveSignal(text, isPlaces = false) {
  if (D2D_POSITIVE_SIGNAL_REGEX.test(text)) return true;
  if (isPlaces && D2D_PLACES_SIGNAL_REGEX.test(text)) return true;
  return D2D_DAILY_PAY_REGEX.test(text) && D2D_SALES_CONTEXT_REGEX.test(text);
}

const SPAM_SCAM_REGEX = /(onlyfans|webcam|вебкам|онліфан|казино|гемблінг|крипто|скам|арбітраж|підпис|канал.*заробіток|легкі\s*гроші\s*онлайн|віддалено\s*на\s*телефоні|ставити\s*лайки|дірект\s*менеджер.*віддалено|чатер|секстинг)/i;

function transliterateUa(str) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ye', ж: 'zh', з: 'z',
    и: 'y', і: 'i', ї: 'yi', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p',
    р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch',
    ь: '', ю: 'yu', я: 'ya', ы: 'y', э: 'e', ё: 'yo', ъ: ''
  };
  return String(str || '').toLowerCase().split('').map(c => (c in map ? map[c] : c)).join('');
}

export function resolveCityMeta(city) {
  const c = String(city || 'Вінниця').trim();
  const low = c.toLowerCase();
  for (const [root, meta] of Object.entries(CITY_META_MAP)) {
    if (low.includes(root)) return { ...meta, inputCity: c };
  }
  const lat = transliterateUa(low).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ukraine';
  return {
    workSlug: lat,
    olxSlug: lat,
    tgChannels: [`rabota_${lat}`, `work_${lat}`, `robota_${lat}`],
    display: c,
    inputCity: c
  };
}

export function detectD2dCategory(niche = '') {
  const s = String(niche || '').toLowerCase();
  if (/промоут|btl|бтл|бренд-консультант/.test(s) && !/прям|польов|всі d2d/i.test(s)) return 'promo';
  if (/прямі продажі|щоденн|ходок|кур'єр-консультант/.test(s) && !/промоут|польов|всі d2d/i.test(s)) return 'direct';
  if (/польові торгові|супервайзер|торгові представник/.test(s) && !/промоут|прямі продажі|всі d2d/i.test(s)) return 'field';
  return 'all';
}

export function buildD2dQueryPlan(niche, city, cluster = '', waveIndex = 0) {
  const cat = detectD2dCategory(niche);
  const loc = [cluster, city].filter(Boolean).join(' ').trim();

  const pools = {
    promo: {
      places: [
        `BTL агентство промоутери ${loc}`,
        `промо агентство рекламна агенція промо ${loc}`,
        `організація промо акцій дегустації івент BTL ${loc}`,
        `агентство роздача листівок флаєрів ${loc}`,
        `маркетингова BTL агенція мерчендайзинг ${loc}`,
        `рекламно-маркетингове агентство польові промоутери ${loc}`
      ],
      workRoles: ['promoter', 'promo', 'merchandiser'],
      olxQueries: ['промоутер', 'роздача листівок', 'флаєрів', 'консультант на вулиці'],
      tgKeywords: ['промоутер', 'листів', 'флаєр', 'btl', 'бренд', 'дегустац']
    },
    direct: {
      places: [
        `агентство прямих продажів активні продажі ${loc}`,
        `офіс активних продажів польовий маркетинг ${loc}`,
        `фандрайзинг представництво прямі продажі ${loc}`,
        `агенція польових продажів D2D ${loc}`,
        `рекрутингове агентство масовий підбір продажів ${loc}`,
        `торгово-сервісна компанія активні продажі ${loc}`
      ],
      workRoles: ['sales-representative', 'promoter', 'merchandiser'],
      olxQueries: ['прямі продажі', 'щоденні виплати', 'активні продажі', 'без досвіду продажі'],
      tgKeywords: ['прямі продаж', 'активні продаж', 'щоденн', 'в день', 'кожного дня', 'фандрайз', 'без досвід']
    },
    field: {
      places: [
        `дистриб'юторська компанія торгові представники ${loc}`,
        `супервайзер мерчендайзер торгова команда ${loc}`,
        `торговий дім польові торгові представники ${loc}`,
        `мерчендайзинг BTL польова агенція ${loc}`,
        `офіційний дистриб'ютор FMCG продажі ${loc}`,
        `логістично-дистрибуційна компанія торгові ${loc}`
      ],
      workRoles: ['sales-representative', 'merchandiser', 'supervisor'],
      olxQueries: ['торговий представник', 'мерчендайзер', 'польовий', 'торговий агент'],
      tgKeywords: ['торгов', 'мерчендайз', 'супервайз', 'польов', 'маршрут', 'точк']
    }
  };

  let places = [];
  let workRoles = [];
  let olxQueries = [];
  let tgKeywords = [];

  if (cat === 'all') {
    places = [
      ...pools.promo.places.slice(0, 3),
      ...pools.direct.places.slice(0, 3),
      ...pools.field.places.slice(0, 3)
    ];
    workRoles = ['promoter', 'sales-representative', 'merchandiser'];
    olxQueries = [
      pools.promo.olxQueries[0],
      pools.direct.olxQueries[1],
      pools.field.olxQueries[0]
    ];
    tgKeywords = [...pools.promo.tgKeywords, ...pools.direct.tgKeywords, ...pools.field.tgKeywords];
  } else {
    places = pools[cat].places;
    workRoles = pools[cat].workRoles;
    olxQueries = pools[cat].olxQueries;
    tgKeywords = pools[cat].tgKeywords;
  }

  // Rotate lists cleanly by waveIndex so re-running searches discovers fresh batches
  const rotate = (arr, offset) => {
    if (!arr.length) return [];
    const n = offset % arr.length;
    return arr.slice(n).concat(arr.slice(0, n));
  };

  const w = Math.max(0, Number(waveIndex || 0));
  return {
    category: cat,
    places: rotate(places, w * 2),
    workRoles: rotate(workRoles, w),
    olxQueries: rotate(olxQueries, w),
    tgKeywords
  };
}

export function normalizeUaPhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = '38' + digits;
  if (digits.length === 9 && /^[56789]/.test(digits)) digits = '380' + digits;
  if (!digits.startsWith('380') || digits.length !== 12) return '';
  return '+' + digits;
}

export function isMobileUaPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  return /^380(50|63|66|67|68|73|75|77|89|91|92|93|94|95|96|97|98|99)\d{7}$/.test(d);
}

function classifyD2dTypeFromText(text, fallbackType = 'd2d_direct') {
  const s = String(text || '').toLowerCase();
  if (/промоут|btl|бтл|листів|флаєр|дегустац|бренд[\s-]*консультант/.test(s)) return 'd2d_promo';
  if (/торгов\w*\s+представ|мерчендайз|супервайз|дистриб|територіальн/.test(s)) return 'field_reps';
  if (/прям\w*\s+продаж|активн\w*\s+продаж|щоденн|ходок|d2d|фандрайз/.test(s)) return 'd2d_direct';
  return fallbackType;
}

function scoreAndFormatD2dItem(raw, targetCity, cluster = '') {
  const name = String(raw.name || '').replace(/\s+/g, ' ').trim();
  if (!name || name.length < 3) return null;

  const fullText = [
    name,
    raw.vacancyTitle || '',
    raw.snippet || '',
    raw.primaryTypeDisplay || '',
    Array.isArray(raw.types) ? raw.types.join(' ') : '',
    raw.address || ''
  ].join(' ').trim();

  // Reject spam/scam & obvious non-D2D businesses
  if (SPAM_SCAM_REGEX.test(fullText) || D2D_HARD_STOP_REGEX.test(fullText)) {
    return null;
  }

  // Reject blacklisted Google Place primaryType / types unless explicit BTL/D2D/promo signal in name
  const hasNamePositive = hasD2dPositiveSignal(name, raw.sourceKind === 'places');
  if (raw.sourceKind === 'places') {
    const pType = String(raw.primaryType || '').toLowerCase();
    const types = Array.isArray(raw.types) ? raw.types.map(t => String(t).toLowerCase()) : [];
    const hitBadType = GOOGLE_PLACES_REJECT_TYPES.has(pType) || types.some(t => GOOGLE_PLACES_REJECT_TYPES.has(t));
    if (hitBadType && !hasNamePositive) {
      return null;
    }
    // Critical gate: require real positive signal on Places candidates!
    if (!hasD2dPositiveSignal(fullText, true)) {
      return null;
    }
  } else {
    // Vacancy sources (TG / Work.ua / OLX) also require at least 1 verified D2D/field/promo/sales signal
    if (!hasD2dPositiveSignal(fullText, false)) {
      return null;
    }
  }

  // Geographic validation: strict title check first (blocks OLX/Work promoted ads for other cities)
  const titleHay = [raw.vacancyTitle || '', name].join(' ');
  if (targetCity && hasForeignCityMismatch(titleHay, targetCity)) {
    return null;
  }
  const addrCityHay = [raw.address || '', raw.city || '', raw.vacancyTitle || '', raw.snippet || ''].join(' ');
  if (targetCity && hasForeignCityMismatch(addrCityHay, targetCity)) {
    return null;
  }

  const cleanPhone = normalizeUaPhone(raw.phone);
  const mobile = isMobileUaPhone(cleanPhone);
  const tgClean = String(raw.telegram || '').replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@+/, '').replace(/[\/?#].*$/, '').trim();
  const igClean = String(raw.instagram || '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@+/, '').replace(/[\/?#].*$/, '').trim();

  // Require at least one actionable outreach/contact vector (phone, IG, TG, or verified vacancy/website URL)
  if (!cleanPhone && !tgClean && !igClean && !raw.website && !raw.vacancyUrl) {
    return null;
  }

  // Real transparent match score (65-99)
  let score = 62;
  if (raw.hasLiveVacancy) score += 16;
  if (D2D_POSITIVE_SIGNAL_REGEX.test(name + ' ' + (raw.vacancyTitle || ''))) score += 10;
  if (/щоденн|в\s*день|кожного\s*дня|без\s*досвід|d2d|btl|промоутер/.test(fullText.toLowerCase())) score += 5;
  if (mobile || tgClean || igClean) score += 6;
  if (textMatchesCity(addrCityHay, targetCity)) score += 3;
  score = Math.min(99, score);

  const d2dType = classifyD2dTypeFromText(fullText, raw.d2dType || 'd2d_direct');
  const sourceLabels = {
    tg_mtproto: 'Telegram (пошук)',
    tg_web: 'Telegram',
    workua: 'Work.ua',
    olx: 'OLX.ua',
    places: 'Google Maps'
  };
  const srcLabel = sourceLabels[raw.sourceKind] || raw.sourceLabel || 'D2D';

  const typeTitles = {
    d2d_promo: 'Промо-команда & BTL',
    field_reps: 'Польові торгові представники',
    d2d_direct: 'Активні / прямі продажі D2D'
  };

  const salaryPart = raw.salary ? ` • ${raw.salary}` : '';
  const painChipLabel = `${typeTitles[d2dType]} • ${srcLabel} (${score}%)`;
  const painText = raw.painText || `${raw.vacancyTitle ? `Вакансія: ${raw.vacancyTitle}${salaryPart}. ` : ''}${cleanPhone || tgClean || igClean ? 'Є живий контакт для пропозиції NFC-карток під польовий продаж або бренд-пакет.' : 'Перевірена профільна команда / вакансія для партнерства з NFC.'}`;

  return {
    id: raw.id || `d2d-${raw.sourceKind || 'live'}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    isD2d: true,
    d2dType,
    d2dSource: raw.sourceKind || 'live',
    d2dSourceLabel: srcLabel,
    d2dMatchScore: score,
    name,
    companyOnly: raw.companyOnly || '',
    address: raw.address || `${targetCity}${cluster ? ', ' + cluster : ''} (${srcLabel})`,
    city: targetCity,
    phone: cleanPhone,
    isMobile: mobile,
    viberUrl: mobile ? `viber://chat?number=%2B${cleanPhone.slice(1)}` : '',
    telegram: tgClean ? `@${tgClean}` : '',
    telegramPhone: mobile ? `https://t.me/+${cleanPhone.slice(1)}` : '',
    instagram: igClean,
    website: raw.website || raw.vacancyUrl || '',
    companyWebsite: raw.companyWebsite || '',
    vacancyUrl: raw.vacancyUrl || '',
    salary: raw.salary || '',
    rating: Number(raw.rating || 0),
    reviews: Number(raw.reviews || 0),
    placeId: raw.placeId || '',
    mapsUrl: raw.mapsUrl || raw.vacancyUrl || raw.website || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + targetCity)}`,
    lat: raw.lat || null,
    lng: raw.lng || null,
    painLevel: score >= 88 ? 'urgent' : 'boost',
    painChipLabel,
    painText
  };
}

function parseTelegramTextSnippet(text, sourceChannel, msgLink, targetCity) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length < 30 || clean.length > 2600) return null;
  if (SPAM_SCAM_REGEX.test(clean) || D2D_HARD_STOP_REGEX.test(clean)) return null;
  if (!hasD2dPositiveSignal(clean, false)) return null;

  // Reject posts clearly from other cities unless it mentions targetCity
  if (targetCity && hasForeignCityMismatch(clean, targetCity)) return null;

  const phones = extractPhonesFromText(clean);
  const mentions = [...clean.matchAll(/@([a-zA-Z0-9_]{4,32})/g)]
    .map(m => m[1])
    .filter(h => !h.toLowerCase().endsWith('bot') && h.toLowerCase() !== String(sourceChannel || '').toLowerCase());
  const tMeLinks = [...clean.matchAll(/(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]{4,32})/gi)]
    .map(m => m[1])
    .filter(h => !h.toLowerCase().endsWith('bot') && !['joinchat', 'addstickers', 's', 'share', 'iv'].includes(h.toLowerCase()) && h.toLowerCase() !== String(sourceChannel || '').toLowerCase());

  const tgHandle = mentions[0] || tMeLinks[0] || '';
  const igMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]{2,30})/i);
  const igHandle = igMatch && !['p', 'reel', 'reels', 'explore', 'stories'].includes(igMatch[1].toLowerCase()) ? igMatch[1] : '';

  // Must have direct contact (phone, @username, or IG) OR link to TG post
  if (!phones[0] && !tgHandle && !igHandle) return null;

  // Extract meaningful title: strip decorative symbols/emojis cleanly
  const rawLines = String(text || '')
    .split(/\n+/)
    .map(l => l.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}‼❗🔥⚡✨🚀💥]/gu, '').replace(/^[#•\-*►▶!.,\s]+/, '').trim())
    .filter(l => l.length >= 5 && !/^(?:терміново|вакансія|робота|увага|набір|запрошуємо)[!.:\s]*$/i.test(l));
  let title = rawLines[0] || clean.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}‼❗]/gu, '').replace(/^[#\s]+/, '').trim().slice(0, 72);
  const companyLine = rawLines.find(l => /^(?:компан|агенц|агентств|бренд|студі|офіс)/i.test(l));
  if (companyLine && companyLine !== title) {
    title = `${companyLine.slice(0, 42)} — ${title.slice(0, 42)}`;
  }
  if (title.length > 82) title = title.slice(0, 80).trim() + '...';

  const salaryMatch = clean.match(/(\d[\d\s]{1,6}(?:\s*[-–—]\s*\d[\d\s]{1,6})?\s*(?:грн|₴|uah)(?:\s*\/\s*(?:день|зміна|год|міс))?)/i);

  return {
    sourceKind: 'tg_mtproto',
    hasLiveVacancy: true,
    name: title,
    vacancyTitle: clean.slice(0, 140),
    snippet: clean.slice(0, 320),
    salary: salaryMatch ? salaryMatch[1].replace(/\s+/g, ' ').trim() : '',
    phone: phones[0] || '',
    telegram: tgHandle ? `@${tgHandle}` : '',
    instagram: igHandle,
    website: msgLink || (sourceChannel ? `https://t.me/${sourceChannel}` : ''),
    vacancyUrl: msgLink || (sourceChannel ? `https://t.me/${sourceChannel}` : ''),
    address: `${targetCity} (Telegram @${sourceChannel || 'vacancy'})`,
    painText: `Жива вакансія з Telegram (@${sourceChannel || 'пошук'}): ${clean.slice(0, 170)}${clean.length > 170 ? '...' : ''}`
  };
}

// 1A. Telegram via `t.me/s/` (works both on PC & Vercel serverless!)
async function scrapeTelegramWebChannels(cityMeta, targetCity, queryPlan) {
  const candidates = [];
  const channels = Array.from(new Set([
    ...(cityMeta.tgChannels || []),
    ...GENERAL_UA_TG_CHANNELS
  ])).slice(0, 9);

  await Promise.allSettled(channels.map(async (ch) => {
    try {
      const res = await fetch(`https://t.me/s/${encodeURIComponent(ch)}`, {
        headers: { 'User-Agent': DEFAULT_UA, 'Accept-Language': 'uk-UA,uk;q=0.9' },
        signal: AbortSignal.timeout(5500)
      });
      if (!res.ok) return;
      const html = await res.text();
      if (!html.includes('tgme_widget_message_wrap')) return;
      const isCityChannel = (cityMeta.tgChannels || []).includes(ch);
      const blocks = html.split('tgme_widget_message_wrap').slice(1);

      for (const blk of blocks) {
        const textMatch = blk.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="[^"]*tgme_widget_message_(?:footer|media|photo|video|poll|document|sticker|reply)|<\/div>\s*<div[^>]*class="[^"]*tgme_widget_message)/i) || blk.match(/<div[^>]*class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (!textMatch) continue;
        const msgText = textMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/gi, ' ')
          .replace(/&amp;/gi, '&')
          .replace(/[ \t]+/g, ' ')
          .trim();

        // General UA channels must explicitly mention targetCity
        if (!isCityChannel && !textMatchesCity(msgText, targetCity)) continue;

        const postMatch = blk.match(/data-post="([^"]+)"/i);
        const postUrl = postMatch ? `https://t.me/${postMatch[1]}` : `https://t.me/${ch}`;
        const parsed = parseTelegramTextSnippet(msgText, ch, postUrl, targetCity);
        if (parsed) {
          parsed.sourceKind = 'tg_web';
          candidates.push(parsed);
        }
      }
    } catch (_) {}
  }));

  return candidates;
}

// 1B. Telegram MTProto (PC daemon only): dynamic channel discovery + history + global message search
async function scrapeTelegramMtproto(cityMeta, targetCity, queryPlan) {
  if (process.env.VERCEL) return [];
  const client = (await getMtprotoClientForAccount('tg1')) || (await getMtprotoClientForAccount('tg2'));
  if (!client || !client.connected) return [];

  const { Api } = await import('telegram');
  const candidates = [];
  const seenMsgKeys = new Set();

  try {
    // Discover active city work channels dynamically via contacts.Search
    const discoveredUsernames = new Set(cityMeta.tgChannels || []);
    const searchQueries = [`робота ${cityMeta.display}`, `вакансії ${cityMeta.display}`];
    for (const q of searchQueries) {
      try {
        const sr = await Promise.race([
          client.invoke(new Api.contacts.Search({ q, limit: 8 })),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5000))
        ]);
        for (const ch of (sr?.chats || [])) {
          if (ch.username && (ch.participantsCount || 0) >= 800 && !hasForeignCityMismatch(ch.title || '', targetCity)) {
            discoveredUsernames.add(ch.username);
          }
        }
      } catch (_) {}
    }

    // Fetch latest 80 messages from top 5 discovered/known city channels
    const targetHandles = Array.from(discoveredUsernames).slice(0, 5);
    for (const handle of targetHandles) {
      try {
        const msgs = await Promise.race([
          client.getMessages(handle, { limit: 80 }),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5500))
        ]);
        for (const m of (msgs || [])) {
          const text = String(m.message || '').trim();
          if (!text) continue;
          const postUrl = `https://t.me/${handle}/${m.id}`;
          if (seenMsgKeys.has(postUrl)) continue;
          seenMsgKeys.add(postUrl);
          const parsed = parseTelegramTextSnippet(text, handle, postUrl, targetCity);
          if (parsed) candidates.push(parsed);
        }
      } catch (_) {}
    }

    // Also run MTProto SearchGlobal for category-specific vacancies across TG
    const globalQueries = (queryPlan.category === 'promo'
      ? [`промоутер ${cityMeta.display}`, `роздача листівок ${cityMeta.display}`, `BTL ${cityMeta.display}`]
      : (queryPlan.category === 'field'
        ? [`торговий представник ${cityMeta.display}`, `мерчендайзер ${cityMeta.display}`]
        : [`промоутер ${cityMeta.display}`, `торговий представник ${cityMeta.display}`, `прямі продажі ${cityMeta.display}`, `щоденні виплати ${cityMeta.display}`])
    ).slice(0, 4);

    for (const gq of globalQueries) {
      try {
        const res = await Promise.race([
          client.invoke(new Api.messages.SearchGlobal({
            q: gq,
            filter: new Api.InputMessagesFilterEmpty(),
            minDate: 0,
            maxDate: 0,
            offsetRate: 0,
            offsetPeer: new Api.InputPeerEmpty(),
            offsetId: 0,
            limit: 25
          })),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 5500))
        ]);
        const chatMap = new Map();
        for (const ch of (res?.chats || [])) {
          if (ch.id) chatMap.set(String(ch.id), ch);
        }
        for (const m of (res?.messages || [])) {
          const text = String(m.message || '').trim();
          if (!text) continue;
          // Require target city in global search result
          if (!textMatchesCity(text, targetCity)) continue;
          const peerChId = m.peerId?.channelId ? String(m.peerId.channelId) : '';
          const chObj = peerChId ? chatMap.get(peerChId) : null;
          const chUser = chObj?.username || '';
          const postUrl = chUser ? `https://t.me/${chUser}/${m.id}` : '';
          const dedupKey = postUrl || text.slice(0, 70);
          if (seenMsgKeys.has(dedupKey)) continue;
          seenMsgKeys.add(dedupKey);
          const parsed = parseTelegramTextSnippet(text, chUser || 'telegram_global', postUrl, targetCity);
          if (parsed) candidates.push(parsed);
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[D2D MTProto] warning:', err.message);
  }

  return candidates;
}

// 2. Work.ua + OLX.ua live Chrome scraper (PC only)
async function scrapeWorkUaAndOlxChrome(cityMeta, targetCity, queryPlan) {
  if (process.env.VERCEL) return [];
  const results = [];

  try {
    await withLockedChromePage(async (page) => {
      // A) Work.ua category-targeted search (1 canonical slug per run to avoid burst throttling)
      const workUrls = (queryPlan.workRoles || []).slice(0, 1).map(role =>
        `https://www.work.ua/jobs-${encodeURIComponent(cityMeta.workSlug)}-${encodeURIComponent(role)}/`
      );

      for (const url of workUrls) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 14000 });
          await new Promise(r => setTimeout(r, 900));
          const pageTitle = await page.title().catch(() => '');
          if (/зачекайте|just a moment|attention required/i.test(pageTitle)) {
            console.warn('[D2D Work.ua] skipped challenge page');
            continue;
          }
          const cards = await page.evaluate(() => {
            return [...document.querySelectorAll('.job-link, div[id^="job_"]')].slice(0, 22).map(el => {
              const aTitle = el.querySelector('h2 a');
              const title = aTitle?.textContent?.trim() || '';
              const href = aTitle?.getAttribute('href') || '';
              const mtXs = el.querySelector('div.mt-xs');
              const byCompLink = el.querySelector('a[href*="/jobs/by-company/"]');
              let company = byCompLink?.textContent?.replace(/\s+/g, ' ').trim() || '';
              if (!company) {
                const imgLogo = el.querySelector('img[alt]');
                const alt = imgLogo?.getAttribute('alt') || '';
                if (alt && !/vip/i.test(alt)) company = alt.replace(/^Робота в компанії\s*/i, '').trim();
              }
              if (!company && mtXs) {
                const spans = [...mtXs.querySelectorAll('span')].map(s => s.textContent.replace(/\s+/g, ' ').trim());
                company = spans.find(s => s.length >= 2 && !/^\d[\d\s\u00A0]*грн/i.test(s) && !/^(vip|відгук|нове|бронювання)/i.test(s)) || '';
              }
              if (/^\d[\d\s\u00A0]*грн/i.test(company)) company = '';
              const salaryEl = [...el.querySelectorAll('span.strong-600, div > span.strong-600')].find(s => /грн|\$|€/i.test(s.textContent || ''));
              const salary = salaryEl?.textContent?.replace(/\s+/g, ' ').trim() || '';
              const rawText = (el.innerText || '').replace(/\s+/g, ' ').trim();
              const headerLine = (mtXs?.innerText || '').replace(/\s+/g, ' ').trim();
              return { title, href, company, salary, headerLine, rawText: rawText.slice(0, 320) };
            }).filter(c => c.title && c.href);
          });

          for (const card of cards) {
            if (hasForeignCityMismatch(card.title, targetCity)) continue;
            const locHay = card.headerLine || card.rawText;
            // Filter out sponsored VIP nationwide listings for other cities (e.g. Дніпро / Львів)
            if (hasForeignCityMismatch(locHay, targetCity)) continue;
            if (locHay && !textMatchesCity(locHay, targetCity)) continue;

            const vacancyUrl = card.href.startsWith('http') ? card.href : `https://www.work.ua${card.href}`;
            const phones = extractPhonesFromText(card.rawText);
            const displayName = card.company ? `${card.company} — ${card.title}` : card.title;
            results.push({
              sourceKind: 'workua',
              hasLiveVacancy: true,
              name: displayName,
              companyOnly: card.company || '',
              vacancyTitle: card.title,
              snippet: card.rawText,
              salary: card.salary,
              phone: phones[0] || '',
              website: vacancyUrl,
              vacancyUrl,
              address: `${targetCity} (Work.ua${card.company ? ' · ' + card.company : ''})`,
              painText: `Активна вакансія Work.ua: «${card.title}»${card.salary ? ` (${card.salary})` : ''}. Компанія активно набирає персонал у ${targetCity}.`
            });
          }
        } catch (e) {
          console.warn('[D2D Work.ua] warn:', e.message);
        }
      }

      // Inspect at most 2 Work.ua pages lacking company name (company contact enrichment uses Places/website in parallel)
      const workInspectTargets = results.filter(r => r.sourceKind === 'workua' && !r.companyOnly).slice(0, 2);
      for (const item of workInspectTargets) {
        try {
          await page.goto(item.vacancyUrl, { waitUntil: 'domcontentloaded', timeout: 11000 });
          await new Promise(r => setTimeout(r, 600));
          const detail = await page.evaluate(() => {
            const compAnchor = document.querySelector('a[href*="/jobs/by-company/"]');
            const compName = compAnchor?.textContent?.replace(/\s+/g, ' ').trim() || '';
            const cardEl = document.querySelector('#job-description') || document.querySelector('.card-indent') || document.querySelector('main');
            const text = (cardEl?.innerText || '').replace(/\s+/g, ' ').trim();
            const cardHtml = cardEl?.innerHTML || '';
            const links = [...document.querySelectorAll('#job-description a[href], .wordwrap a[href], a[rel*="nofollow"][href^="http"]')]
              .map(a => a.href)
              .filter(h => !/work\.ua|facebook\.com|google\.|apps\.apple|play\.google/i.test(h));
            const extWebsite = links.find(h => !/t\.me|telegram\.me|instagram\.com/i.test(h)) || '';
            const tels = [...document.querySelectorAll('a[href^="tel:"]')].map(a => a.href);
            return { compName, text: text.slice(0, 1500), html: cardHtml + ' ' + links.join(' '), extWebsite, tels };
          });
          if (detail.compName && !item.companyOnly) {
            item.companyOnly = detail.compName;
            item.name = `${detail.compName} — ${item.vacancyTitle}`;
          }
          const socials = extractSocialHandlesFromHtml(detail.html + ' ' + detail.text + ' ' + (detail.tels || []).join(' '));
          if (socials.phones?.[0]) item.phone = socials.phones[0];
          const tgValid = (socials.tgHandles || []).filter(h => !/work_?ua/i.test(h));
          const igValid = (socials.igHandles || []).filter(h => !/work_?ua/i.test(h));
          if (tgValid[0]) item.telegram = tgValid[0];
          if (igValid[0]) item.instagram = igValid[0].replace(/^@+/, '');
          if (detail.extWebsite) item.companyWebsite = detail.extWebsite;
        } catch (_) {}
      }

      // B) OLX.ua Undercover D2D Work Search (top 3 queries)
      const olxUrls = (queryPlan.olxQueries || []).slice(0, 3).map(q =>
        `https://www.olx.ua/uk/rabota/${encodeURIComponent(cityMeta.olxSlug)}/q-${encodeURIComponent(q)}/`
      );

      for (const olxUrl of olxUrls) {
        try {
          await page.goto(olxUrl, { waitUntil: 'domcontentloaded', timeout: 14000 });
          await new Promise(r => setTimeout(r, 1200));
          const olxCards = await page.evaluate(() => {
            return [...document.querySelectorAll('[data-cy="l-card"]')].slice(0, 18).map(el => {
              const titleEl = el.querySelector('h6, h4, [data-cy="ad-card-title"]');
              const aEl = el.querySelector('a[href]');
              const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
              return {
                title: titleEl?.textContent?.trim() || '',
                href: aEl?.getAttribute('href') || '',
                text: text.slice(0, 260)
              };
            }).filter(c => c.title && c.href && c.title.length >= 5);
          });

          for (const oc of olxCards) {
            if (hasForeignCityMismatch(oc.title, targetCity)) continue;
            if (hasForeignCityMismatch(oc.text, targetCity)) continue;
            if (!textMatchesCity(oc.text, targetCity)) continue;
            const fullUrl = oc.href.startsWith('http') ? oc.href : `https://www.olx.ua${oc.href}`;
            const salaryMatch = oc.text.match(/(\d[\d\s]{2,12}(?:\s*[-–—]\s*\d[\d\s]{2,12})?\s*грн)/i);
            const fopMatch = oc.text.match(/((?:ФОП|ТОВ|ПП)\s+[А-ЯІЇЄҐA-Za-z0-9."'«»\- ]{3,35})/);
            const name = fopMatch ? `${fopMatch[1].trim()} (${oc.title.slice(0, 42)})` : oc.title;
            results.push({
              sourceKind: 'olx',
              hasLiveVacancy: true,
              name,
              vacancyTitle: oc.title,
              snippet: oc.text,
              salary: salaryMatch ? salaryMatch[1].replace(/\s+/g, ' ').trim() : '',
              phone: extractPhonesFromText(oc.text)[0] || '',
              website: fullUrl,
              vacancyUrl: fullUrl,
              address: `${targetCity} (OLX Робота)`,
              painText: `Оголошення на OLX (${oc.title.slice(0, 90)})${salaryMatch ? ` • ${salaryMatch[1]}` : ''} — активний прямий набір у місті.`
            });
          }
        } catch (e) {
          console.warn('[D2D OLX] warn:', e.message);
        }
      }

      // Open top 3 OLX D2D listings waiting briefly for React hydration to extract recruiter/company + TG/phones
      const olxInspectTargets = results.filter(r => r.sourceKind === 'olx').slice(0, 3);
      for (const item of olxInspectTargets) {
        try {
          await page.goto(item.vacancyUrl, { waitUntil: 'domcontentloaded', timeout: 12000 });
          await page.waitForFunction(() => Boolean(document.querySelector('[data-cy="ad_description"], [data-testid="ad_description"]')) || (document.body?.innerText?.length || 0) > 400, { timeout: 3500 }).catch(() => {});
          const olxDetail = await page.evaluate(() => {
            const body = (document.body?.innerText || '').replace(/\s+/g, ' ');
            const desc = (document.querySelector('[data-cy="ad_description"], [data-testid="ad_description"]')?.innerText || '').replace(/\s+/g, ' ');
            const recMatch = body.match(/РЕКРУТЕР\s+([А-ЯІЇЄҐA-Za-z0-9."'«»\- ]{3,45})\s+на OLX/i);
            return {
              desc: (desc || body).slice(0, 2000),
              recruiter: recMatch ? recMatch[1].trim() : ''
            };
          });
          if (olxDetail.recruiter && !item.companyOnly && !/^olx/i.test(olxDetail.recruiter)) {
            item.companyOnly = olxDetail.recruiter;
            if (!item.name.includes(olxDetail.recruiter)) {
              item.name = `${olxDetail.recruiter} — ${item.vacancyTitle}`;
            }
          }
          const socials = extractSocialHandlesFromHtml(olxDetail.desc);
          if (socials.phones?.[0] && !item.phone) item.phone = socials.phones[0];
          const tgMention = olxDetail.desc.match(/@([a-zA-Z0-9_]{4,32})/);
          if (socials.tgHandles?.[0]) item.telegram = socials.tgHandles[0];
          else if (tgMention && !tgMention[1].toLowerCase().endsWith('bot')) item.telegram = '@' + tgMention[1];
          if (socials.igHandles?.[0]) item.instagram = socials.igHandles[0].replace(/^@+/, '');
        } catch (_) {}
      }
    });
  } catch (err) {
    console.warn('[D2D Chrome] error:', err.message);
  }

  return results;
}

// 3. Google Places API v1 with strict primaryType + types + positive signal gate
async function scrapeGooglePlacesD2d(cityMeta, targetCity, cluster, queryPlan, googleKey) {
  const key = String(googleKey || GOOGLE_PLACES_FALLBACK_KEY || '').trim();
  if (!key) return [];
  const results = [];
  const seenPlaceIds = new Set();

  const queries = (queryPlan.places || []).slice(0, 7);
  await Promise.allSettled(queries.map(async (textQuery) => {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.location,places.businessStatus,places.primaryType,places.primaryTypeDisplayName,places.types,places.editorialSummary'
        },
        body: JSON.stringify({ textQuery, languageCode: 'uk', maxResultCount: 15 }),
        signal: AbortSignal.timeout(7000)
      });
      if (!res.ok) return;
      const data = await res.json();
      for (const p of (data.places || [])) {
        if (p.businessStatus && p.businessStatus !== 'OPERATIONAL') continue;
        const pid = p.id || p.googleMapsUri || '';
        if (pid && seenPlaceIds.has(pid)) continue;
        if (pid) seenPlaceIds.add(pid);

        const name = p.displayName?.text || '';
        const address = p.formattedAddress || '';
        const rawPhone = p.internationalPhoneNumber || p.nationalPhoneNumber || '';
        const primaryType = p.primaryType || '';
        const primaryTypeDisplay = p.primaryTypeDisplayName?.text || '';
        const editorial = p.editorialSummary?.text || '';

        results.push({
          sourceKind: 'places',
          hasLiveVacancy: false,
          placeId: p.id || '',
          name,
          address,
          snippet: [primaryTypeDisplay, editorial].filter(Boolean).join(' | '),
          primaryType,
          primaryTypeDisplay,
          types: p.types || [],
          phone: rawPhone,
          website: p.websiteUri || '',
          mapsUrl: p.googleMapsUri || '',
          rating: Number(p.rating || 0),
          reviews: Number(p.userRatingCount || 0),
          lat: p.location?.latitude || null,
          lng: p.location?.longitude || null
        });
      }
    } catch (_) {}
  }));

  return results;
}

// 4. Parallel website + linktree social contact enrichment (+ fast Places company contact resolution)
async function enrichD2dItemsBatch(items, targetCity, googleKey = GOOGLE_PLACES_FALLBACK_KEY) {
  if (!Array.isArray(items) || items.length === 0) return;

  // Step 4a: Fast parallel Google Places lookup for Work.ua / OLX companies missing phone or website
  const gKey = String(googleKey || GOOGLE_PLACES_FALLBACK_KEY || '').trim();
  if (gKey) {
    const bareCompanies = items.filter(it =>
      (it.d2dSource === 'workua' || it.d2dSource === 'olx') &&
      (!it.phone || !it.companyWebsite) &&
      (it.companyOnly || (it.name && !/^(промоутер|торговий|робота|потрібен|шукаємо|терміново|фандрайзер|бренд|від|активна)/i.test(it.name)))
    ).slice(0, 12);

    await Promise.allSettled(bareCompanies.map(async (v) => {
      const cleanName = (v.companyOnly || v.name).replace(/\s*[—–-]\s*.*$/, '').replace(/\s*\([^)]+\)$/, '').replace(/,?\s*\b(?:тов|пп|прат|пат|фоп|тд|торгова\s*фірма|компанія|група|group)\b\.?/gi, '').replace(/[,\s]+$/g, '').trim();
      if (cleanName.length < 3) return;
      try {
        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': gKey,
            'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.location,places.rating,places.userRatingCount'
          },
          body: JSON.stringify({ textQuery: `${cleanName} ${targetCity}`, languageCode: 'uk', maxResultCount: 3 }),
          signal: AbortSignal.timeout(3500)
        });
        if (!res.ok) return;
        const data = await res.json();
        const match = (data.places || []).find(p => {
          const pName = (p.displayName?.text || '').toLowerCase();
          const cLow = cleanName.toLowerCase();
          const token = cLow.split(/\s+/)[0] || cLow; return token.length >= 3 && (pName.includes(token.slice(0, 6)) || cLow.includes(pName.slice(0, 5)));
        });
        if (!match) return;
        const resolvedPhone = normalizeUaPhone(match.internationalPhoneNumber || match.nationalPhoneNumber || '');
        if (resolvedPhone && !v.phone) {
          v.phone = resolvedPhone;
          v.isMobile = isMobileUaPhone(resolvedPhone);
          v.viberUrl = v.isMobile ? `viber://chat?number=%2B${resolvedPhone.slice(1)}` : '';
          v.telegramPhone = v.isMobile ? `https://t.me/+${resolvedPhone.slice(1)}` : '';
        }
        if (match.websiteUri && !v.companyWebsite) v.companyWebsite = match.websiteUri;
        if (match.googleMapsUri && (!v.mapsUrl || /work\.ua|olx\.ua/i.test(v.mapsUrl))) v.mapsUrl = match.googleMapsUri;
        if (match.location?.latitude && !v.lat) {
          v.lat = match.location.latitude;
          v.lng = match.location.longitude;
        }
        if (match.rating && !v.rating) {
          v.rating = Number(match.rating);
          v.reviews = Number(match.userRatingCount || 0);
        }
      } catch (_) {}
    }));
  }

  // Step 4b: Crawl company websites & linktrees in parallel to extract @instagram, @telegram, and +380 phones
  const targets = items.filter(it => {
    const site = String(it.companyWebsite || it.website || '').trim();
    return site && /^https?:\/\//i.test(site) && !/work\.ua|olx\.ua|t\.me\/|telegram\.me/i.test(site) && (!it.instagram || !it.telegram || !it.phone);
  }).slice(0, 20);

  await Promise.allSettled(targets.map(async (item) => {
    const site = String(item.companyWebsite || item.website).trim();
    const urlsToTry = [site];
    try {
      const u = new URL(site);
      if (u.pathname === '/' || !u.pathname) {
        urlsToTry.push(`${u.origin}/contacts`, `${u.origin}/kontakty`);
      }
    } catch (_) {}

    for (const url of urlsToTry) {
      if (item.instagram && item.telegram && item.phone) break;
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': DEFAULT_UA },
          signal: AbortSignal.timeout(4000)
        });
        if (!res.ok) continue;
        const html = await res.text();
        const socials = extractSocialHandlesFromHtml(html, url);
        if (!item.instagram && socials.igHandles?.[0]) {
          item.instagram = socials.igHandles[0].replace(/^@+/, '');
        }
        if (!item.telegram && socials.tgHandles?.[0]) {
          item.telegram = socials.tgHandles[0];
        }
        if (!item.phone && socials.phones?.[0]) {
          item.phone = socials.phones[0];
          item.isMobile = isMobileUaPhone(item.phone);
          item.viberUrl = item.isMobile ? `viber://chat?number=%2B${item.phone.slice(1)}` : '';
          item.telegramPhone = item.isMobile ? `https://t.me/+${item.phone.slice(1)}` : '';
        }
        if ((!item.instagram || !item.telegram) && socials.linktreeUrls?.length > 0) {
          for (const ltUrl of socials.linktreeUrls.slice(0, 2)) {
            try {
              const ltRes = await fetch(ltUrl, { headers: { 'User-Agent': DEFAULT_UA }, signal: AbortSignal.timeout(3500) });
              if (!ltRes.ok) continue;
              const ltHtml = await ltRes.text();
              const ltSocials = extractSocialHandlesFromHtml(ltHtml, ltUrl);
              if (!item.instagram && ltSocials.igHandles?.[0]) item.instagram = ltSocials.igHandles[0].replace(/^@+/, '');
              if (!item.telegram && ltSocials.tgHandles?.[0]) item.telegram = ltSocials.tgHandles[0];
              if (!item.phone && ltSocials.phones?.[0]) item.phone = ltSocials.phones[0];
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
  }));
}

export async function scrapeD2dRadar(options = {}) {
  const niche = String(options.niche || '').trim();
  const city = String(options.city || 'Вінниця').trim();
  const cluster = String(options.cluster || '').trim();
  const limit = Math.max(5, Math.min(60, Number(options.limit || 30)));
  const googleKey = options.googleKey || GOOGLE_PLACES_FALLBACK_KEY;

  const cityMeta = resolveCityMeta(city);
  const category = detectD2dCategory(niche);
  const waveKey = `d2d_${cityMeta.workSlug}_${category}`;

  let seenSet = new Set();
  let waveIndex = Number(options.waveOffset || 0);
  try {
    const seenData = await getSeenData();
    seenSet = seenData.seenSet || new Set();
    if (!options.waveOffset) {
      waveIndex = Number(seenData.waveOffsets?.[waveKey] || 0);
    }
  } catch (_) {}

  const queryPlan = buildD2dQueryPlan(niche, city, cluster, waveIndex);

  // Run all viable sources in parallel
  const [tgWebRaw, tgMtprotoRaw, chromeJobsRaw, placesRaw] = await Promise.all([
    scrapeTelegramWebChannels(cityMeta, city, queryPlan).catch(() => []),
    scrapeTelegramMtproto(cityMeta, city, queryPlan).catch(() => []),
    scrapeWorkUaAndOlxChrome(cityMeta, city, queryPlan).catch(() => []),
    scrapeGooglePlacesD2d(cityMeta, city, cluster, queryPlan, googleKey).catch(() => [])
  ]);

  const allRaw = [
    ...tgMtprotoRaw,
    ...chromeJobsRaw,
    ...tgWebRaw,
    ...placesRaw
  ];

  // Validate, filter out junk/hotels/schools/foreign cities, and deduplicate
  const unseenItems = [];
  const seenFallbackItems = [];
  const batchSeenKeys = new Set();
  const batchUrls = new Set();

  for (const raw of allRaw) {
    const item = scoreAndFormatD2dItem(raw, city, cluster);
    if (!item) continue;

    // Cross-source duplicate check within this run
    const itemKeys = extractBizSeenKeys(item, city);
    const urlKey = item.vacancyUrl ? item.vacancyUrl.split('?')[0].toLowerCase() : '';
    const isDupInBatch = itemKeys.some(k => batchSeenKeys.has(k)) || (urlKey && batchUrls.has(urlKey));
    if (isDupInBatch) continue;

    itemKeys.forEach(k => batchSeenKeys.add(k));
    if (urlKey) batchUrls.add(urlKey);

    const isPreviouslySeen = itemKeys.some(k => seenSet.has(k));
    if (isPreviouslySeen) {
      seenFallbackItems.push(item);
    } else {
      unseenItems.push(item);
    }
  }

  // Prefer unseen live items first; if unseen < limit, supplement only with real verified previously seen live items (NEVER static demos)
  const sortVerified = (a, b) => {
    const aHasDirect = (a.isMobile ? 2 : 0) + (a.telegram ? 2 : 0) + (a.instagram ? 1 : 0);
    const bHasDirect = (b.isMobile ? 2 : 0) + (b.telegram ? 2 : 0) + (b.instagram ? 1 : 0);
    if (bHasDirect !== aHasDirect) return bHasDirect - aHasDirect;
    return (b.d2dMatchScore || 0) - (a.d2dMatchScore || 0);
  };

  unseenItems.sort(sortVerified);
  seenFallbackItems.sort(sortVerified);

  const selected = unseenItems.slice(0, limit);
  if (selected.length < limit) {
    for (const prev of seenFallbackItems) {
      if (selected.length >= limit) break;
      selected.push(prev);
    }
  }

  await enrichD2dItemsBatch(selected, city, googleKey);
  // Re-sort after contact enrichment so items with newly discovered IG/TG/Phone rise to top
  selected.sort(sortVerified);

  try {
    if (!process.env.VERCEL && selected.length > 0) {
      await registerSeenBusinesses(selected, waveKey, waveIndex + 1, city);
    }
  } catch (_) {}

  const stats = {
    total: selected.length,
    withPhone: selected.filter(x => !!x.phone).length,
    withTelegram: selected.filter(x => !!x.telegram).length,
    withInstagram: selected.filter(x => !!x.instagram).length,
    sources: {
      tgMtproto: selected.filter(x => x.d2dSource === 'tg_mtproto').length,
      tgWeb: selected.filter(x => x.d2dSource === 'tg_web').length,
      workua: selected.filter(x => x.d2dSource === 'workua').length,
      olx: selected.filter(x => x.d2dSource === 'olx').length,
      places: selected.filter(x => x.d2dSource === 'places').length
    },
    rawCounts: {
      tgMtproto: tgMtprotoRaw.length,
      tgWeb: tgWebRaw.length,
      chromeWorkOlx: chromeJobsRaw.length,
      places: placesRaw.length
    },
    waveIndex
  };

  return { items: selected, stats, waveKey, nextWaveOffset: waveIndex + 1 };
}

export async function processD2dCloudQueue() {
  if (process.env.VERCEL) return;
  const baseOutreachKv = getCloudKvOutreachUrl();
  if (!baseOutreachKv) return;
  const kvUrl = baseOutreachKv.replace('nfc_outreach_state', 'd2d_search_queue');

  let data = null;
  try {
    const res = await fetch(kvUrl, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) return;
    data = await res.json().catch(() => null);
  } catch (_) {
    return;
  }

  const reqList = Array.isArray(data?.requests) ? data.requests : [];
  const pending = reqList.find(r => r && r.status === 'pending' && r.city);
  if (!pending) return;

  console.log(`[D2D Queue] Picked up remote D2D request ${pending.id} (${pending.city} | ${pending.niche})`);

  try {
    pending.status = 'running';
    pending.startedAt = Date.now();
    await fetch(kvUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: reqList.slice(-10), updatedAt: Date.now() }),
      signal: AbortSignal.timeout(4500)
    }).catch(() => {});

    const result = await scrapeD2dRadar({
      niche: pending.niche,
      city: pending.city,
      cluster: pending.cluster,
      limit: pending.limit || 30,
      waveOffset: pending.waveOffset
    });

    // Re-read fresh queue so concurrent requests from iPhone are preserved
    let freshList = reqList;
    try {
      const fRes = await fetch(kvUrl, { signal: AbortSignal.timeout(4500) });
      if (fRes.ok) {
        const fJson = await fRes.json().catch(() => null);
        if (Array.isArray(fJson?.requests)) freshList = fJson.requests;
      }
    } catch (_) {}

    const target = freshList.find(r => r && r.id === pending.id);
    if (target) {
      target.status = 'done';
      target.finishedAt = Date.now();
      target.items = result.items;
      target.stats = result.stats;
    }

    await fetch(kvUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: freshList.slice(-8), updatedAt: Date.now() }),
      signal: AbortSignal.timeout(6000)
    }).catch(() => {});
  } catch (err) {
    console.warn('[D2D Queue] error:', err.message);
    pending.status = 'error';
    pending.error = err.message;
    pending.finishedAt = Date.now();
    await fetch(kvUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: reqList.slice(-8), updatedAt: Date.now() }),
      signal: AbortSignal.timeout(4500)
    }).catch(() => {});
  }
}
