/**
 * DWS Lead — 100% Free Local Google Maps Scraper (Puppeteer + Native Chrome)
 * Безкоштовний парсер Google Maps без Apify, без API ключів і без прив'язки карток.
 */

import puppeteer from 'puppeteer-core';
import fs from 'fs';

function findChromePath() {
  const commonPaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ];
  for (const p of commonPaths) {
    if (p && fs.existsSync(p)) return p;
  }
  return null;
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

function normalizePhone(raw) {
  if (!raw) return '';
  let p = String(raw).replace(/[^\d+]/g, '');
  if (!p) return '';
  if (p.startsWith('00')) p = '+' + p.slice(2);
  if (!p.startsWith('+')) {
    if (p.startsWith('380')) p = '+' + p;
    else if (p.startsWith('0') && p.length === 10) p = '+38' + p;
    else p = '+' + p;
  }
  return p.length >= 10 ? p : '';
}

function isUkrainianMobilePhone(raw) {
  if (!raw) return false;
  const digits = String(raw).replace(/\D/g, '');
  return /^(?:380|0)(50|66|95|99|67|68|96|97|98|77|63|73|93|91|92|94)\d{7}$/.test(digits);
}

function getViberDirectUrl(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';
  const clean380 = digits.startsWith('380') ? digits : (digits.startsWith('0') ? ('38' + digits) : digits);
  return 'viber://chat?number=%2B' + clean380;
}

export async function scrapeLocalGmaps(options = {}) {
  const {
    niche = 'кавʼярні',
    city = 'Вінниця',
    cluster = '',
    limit = 20,
    maxReviews = 300
  } = options;

  const targetCount = Math.max(5, Math.min(100, Number(limit) || 20));
  const targetMaxReviews = Number(maxReviews) || 300;

  const chromePath = findChromePath();
  if (!chromePath) {
    throw new Error('Google Chrome не знайдено на компʼютері. Встановіть Google Chrome.');
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-gpu',
      '--lang=uk-UA,uk'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36');

    // Build search query e.g. "кав'ярні Центр Вінниця"
    const queryParts = [niche, cluster, city].filter(Boolean);
    const searchQuery = encodeURIComponent(queryParts.join(' '));
    const searchUrl = `https://www.google.com/maps/search/${searchQuery}?hl=uk`;

    console.log(`[LocalScraper] Navigating to: ${searchUrl}`);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    try {
      await page.waitForSelector('div[role="feed"], a.hfpxzc', { timeout: 12000 });
    } catch {
      console.warn('[LocalScraper] Feed selector wait timeout, proceeding...');
    }

    // Scroll feed to load enough raw cards
    const neededRaw = Math.min(80, targetCount * 3);
    let previousCount = 0;
    for (let scrollStep = 0; scrollStep < 6; scrollStep++) {
      const currentCards = await page.evaluate(() => document.querySelectorAll('a.hfpxzc').length);
      if (currentCards >= neededRaw || (currentCards > 0 && currentCards === previousCount && scrollStep > 2)) {
        break;
      }
      previousCount = currentCards;
      await page.evaluate(async () => {
        const feed = document.querySelector('div[role="feed"]');
        if (feed) {
          feed.scrollBy(0, 1800);
        }
      });
      await new Promise(r => setTimeout(r, 800));
    }

    // Extract basic feed info for candidate cards
    const candidates = await page.evaluate((maxRev, targetNiche) => {
      const cards = document.querySelectorAll('div.Nv2PK');
      const list = [];
      const nLower = String(targetNiche || '').toLowerCase().trim();
      const isTargetBarber = /барбер|чоловіч.*перукар/i.test(nLower);
      const isTargetDental = /стоматолог|зуб/i.test(nLower);
      const isTargetTravel = /тур|турагент|туристич/i.test(nLower);
      const isTargetAuto = /авто|сто\b|шиномонтаж|детейлінг|мийк/i.test(nLower);

      cards.forEach(card => {
        const link = card.querySelector('a.hfpxzc');
        if (!link) return;
        const name = (link.getAttribute('aria-label') || '').trim();
        const url = link.href || '';
        if (!name || !url) return;

        const cardText = card.innerText || '';

        // Exclude closed or opening soon
        if (/(тимчасово закрито|зачинено назавжди|closed|скоро відкри|opening soon)/i.test(cardText)) {
          return;
        }

        const nameLower = name.toLowerCase();
        const snippetLower = cardText.toLowerCase();

        // Niche relevance check
        const textIsFood = /ресторан|кафе|кав'?ярн|пекарн|піцер|суші|бургер|кухня|їдальня/i.test(snippetLower);
        if (isTargetBarber && textIsFood && !/барбер|barber/i.test(nameLower)) return;
        if (isTargetDental && textIsFood && !/стоматолог|dental/i.test(nameLower)) return;
        if (isTargetTravel && textIsFood && !/тур|travel/i.test(nameLower)) return;
        if (isTargetAuto && textIsFood && !/авто|сто/i.test(nameLower)) return;

        let rating = null;
        let reviews = 0;
        const m = cardText.match(/(\d[.,]\d)\s*\(([\d\s\u00A0]+)\)/);
        if (m) {
          rating = parseFloat(m[1].replace(',', '.'));
          reviews = parseInt(m[2].replace(/\D/g, ''), 10);
        }

        // Must have > 0 reviews and reviews <= maxRev
        if (reviews <= 0) return;
        if (maxRev && maxRev < 90000 && reviews > maxRev) return;

        // Coordinates from URL: !3d49.23032!4d28.3979668
        let lat = null;
        let lng = null;
        const coordMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
        }

        list.push({
          name,
          url,
          rating,
          reviews,
          lat,
          lng,
          cardSnippet: cardText.split('\n').filter(Boolean).slice(0, 3).join(' ')
        });
      });

      return list;
    }, targetMaxReviews, niche);

    console.log(`[LocalScraper] Found ${candidates.length} candidate places matching <= ${targetMaxReviews} reviews.`);

    const detailedVenues = [];

    // For candidates, fetch detailed contact info (phone, website, instagram, address)
    for (let i = 0; i < candidates.length && detailedVenues.length < targetCount; i++) {
      const c = candidates[i];
      const placePage = await browser.newPage();
      try {
        await placePage.goto(c.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await placePage.waitForSelector('h1, button[data-item-id*="address"], a[data-item-id*="authority"]', { timeout: 4500 }).catch(() => {});

        const details = await placePage.evaluate(() => {
          const phoneBtn = document.querySelector('button[data-tooltip*="телефон"], button[data-item-id*="phone"]');
          const phone = phoneBtn ? phoneBtn.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() : '';

          const webBtn = document.querySelector('a[data-tooltip*="веб-сайт"], a[data-item-id*="authority"]');
          const website = webBtn ? webBtn.href : '';

          const addrBtn = document.querySelector('button[data-tooltip*="адресу"], button[data-item-id*="address"]');
          const address = addrBtn ? addrBtn.innerText.replace(/[\u200B-\u200D\uFEFF]/g, '').trim() : '';

          return { phone, website, address };
        });

        const phone = normalizePhone(details.phone);
        const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
        const isMobile = isUkrainianMobilePhone(cleanPhone);
        const viberUrl = isMobile ? getViberDirectUrl(cleanPhone) : '';
        const telegramPhone = cleanPhone ? `https://t.me/+${cleanPhone}` : '';

        // Instagram handle from website or url
        let insta = '';
        if (details.website && /instagram\.com/i.test(details.website)) {
          insta = cleanInstagramHandle(details.website);
        }

        // Strict outreach filter: must have Instagram, mobile phone, or website
        if (!insta && !isMobile && !details.website) {
          continue;
        }

        detailedVenues.push({
          id: 'v-loc-' + Date.now() + '-' + i,
          name: c.name,
          address: details.address ? details.address.replace(/^\s*/, '') : (cluster || city),
          city,
          phone,
          isMobile,
          viberUrl,
          website: details.website,
          instagram: insta,
          telegram: '',
          telegramPhone,
          rating: c.rating,
          reviews: c.reviews,
          mapsUrl: c.url,
          lat: c.lat,
          lng: c.lng,
          painLevel: (c.rating && c.rating <= 4.3) ? 'urgent' : (c.reviews < 50 ? 'new' : 'boost'),
          painText: (c.rating && c.rating <= 4.3) ? 'Потрібно терміново перекривати негатив' : (c.reviews < 50 ? 'Новий заклад — гостра потреба у відгуках' : 'Буст до ТОП-1 в Google Maps')
        });

      } catch (err) {
        console.warn(`[LocalScraper] Could not get details for ${c.name}:`, err.message);
      } finally {
        await placePage.close().catch(() => {});
      }
    }

    // Sort: Instagram venues FIRST, then lowest reviews first
    detailedVenues.sort((a, b) => {
      const aIg = a.instagram ? 1 : 0;
      const bIg = b.instagram ? 1 : 0;
      if (bIg !== aIg) return bIg - aIg;
      return (Number(a.reviews) || 0) - (Number(b.reviews) || 0);
    });

    console.log(`[LocalScraper] Successfully parsed ${detailedVenues.length} venues.`);
    return detailedVenues;

  } finally {
    await browser.close().catch(() => {});
  }
}
