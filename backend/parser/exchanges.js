/**
 * DWS Lead — Multi-Exchange Automated Lead Scraper
 * Monitors Freelancehunt, Djinni, Freelance.ua, and Kabanchik
 * All leads are classified and ingested into the primary Leads feed.
 */

import { classifyLeadRuleBased } from './filter.js';
import { db } from '../db/db.js';

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseBudgetFromText(text) {
  if (!text) return 0;
  const match = text.match(/(\d[\d\s.,]*)\s*(?:грн|uah|₴|usd|\$|€|eur)/i);
  if (!match) return 0;
  const num = parseInt(match[1].replace(/[\s.,]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

// 1. FREELANCEHUNT (Україна №1)
export async function scrapeFreelancehunt() {
  const leads = [];
  try {
    const res = await fetch('https://freelancehunt.com/projects.rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) return leads;
    const xml = await res.text();
    const items = xml.split('<item>');

    for (let i = 1; i < items.length; i++) {
      const it = items[i];
      const titleMatch = it.match(/<title>([\s\S]*?)<\/title>/);
      const descMatch = it.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || it.match(/<description>([\s\S]*?)<\/description>/);
      const linkMatch = it.match(/<link>([\s\S]*?)<\/link>/);

      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      const rawDesc = descMatch ? descMatch[1].trim() : '';
      const link = linkMatch ? linkMatch[1].split('?')[0].trim() : '';

      const cleanTitle = decodeHtmlEntities(rawTitle);
      const cleanDesc = decodeHtmlEntities(rawDesc.replace(/<[^>]+>/g, ' '));
      const fullText = (cleanTitle + '\n\n' + cleanDesc).trim();

      const tgMatch = fullText.match(/(?:^|[\s(,:;>«"'])@([a-zA-Z0-9_]{4,32})\b/) || fullText.match(/t\.me\/([a-zA-Z0-9_]{4,32})/);
      const authorUsername = tgMatch ? '@' + tgMatch[1] : '@freelancehunt';

      const classification = classifyLeadRuleBased(fullText, authorUsername);
      if (classification) {
        const budgetFromTitle = parseBudgetFromText(cleanTitle);
        leads.push({
          title: cleanTitle.replace(/\s*-\s*\d+\s*(?:UAH|USD|EUR).*/i, '').trim(),
          text: fullText,
          authorName: 'Замовник на Freelancehunt',
          authorUsername,
          sourceName: 'Freelancehunt',
          sourceType: 'freelancehunt',
          sourceUsername: '@freelancehunt',
          url: link,
          country: 'Freelancehunt',
          budget: budgetFromTitle || classification.budget || 0,
          classification
        });
      }
    }
  } catch (err) {
    console.error('[Exchanges] Freelancehunt error:', err.message);
  }
  return leads;
}

// 2. DJINNI (IT & Digital замовлення)
export async function scrapeDjinni() {
  const leads = [];
  const keywords = ['JavaScript', 'Wordpress', 'Marketing'];

  for (const kw of keywords) {
    try {
      const res = await fetch(`https://djinni.co/jobs/?primary_keyword=${kw}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
        },
        signal: AbortSignal.timeout(9000)
      });
      if (!res.ok) continue;
      const html = await res.text();
      const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (!jsonMatch) continue;

      let jobList = [];
      try {
        jobList = JSON.parse(jsonMatch[1]);
        if (!Array.isArray(jobList)) jobList = [jobList];
      } catch {
        continue;
      }

      for (const job of jobList) {
        if (!job || !job.title) continue;
        const cleanTitle = decodeHtmlEntities(job.title.trim());
        const cleanDesc = decodeHtmlEntities((job.description || '').replace(/<[^>]+>/g, ' ').trim());
        const fullText = (cleanTitle + '\n\n' + cleanDesc).trim();
        const link = job.url || ('https://djinni.co' + (job.identifier || ''));

        const tgMatch = fullText.match(/(?:^|[\s(,:;>«"'])@([a-zA-Z0-9_]{4,32})\b/) || fullText.match(/t\.me\/([a-zA-Z0-9_]{4,32})/);
        const authorUsername = tgMatch ? '@' + tgMatch[1] : '@djinni';

        const classification = classifyLeadRuleBased(fullText, authorUsername);
        if (classification) {
          leads.push({
            title: cleanTitle,
            text: fullText,
            authorName: 'Рекрутер на Djinni',
            authorUsername,
            sourceName: 'Djinni',
            sourceType: 'djinni',
            sourceUsername: '@djinni',
            url: link,
            country: 'Djinni',
            budget: classification.budget || 0,
            classification
          });
        }
      }
    } catch (err) {
      console.error(`[Exchanges] Djinni error (${kw}):`, err.message);
    }
  }
  return leads;
}

// 3. FREELANCE.UA
export async function scrapeFreelanceUa() {
  const leads = [];
  try {
    const res = await fetch('https://freelance.ua/orders/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) return leads;
    const html = await res.text();
    const items = html.split('<li class="j-order');

    for (let i = 1; i < items.length; i++) {
      const it = items[i];
      const titleMatch = it.match(/<header class="l-project-title">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      if (!titleMatch) continue;

      const link = titleMatch[1].trim();
      const rawTitle = titleMatch[2].replace(/<[^>]+>/g, '').trim();
      const cleanTitle = decodeHtmlEntities(rawTitle);

      const priceMatch = it.match(/<span class="l-price">([\s\S]*?)<\/span>/);
      const priceText = priceMatch ? decodeHtmlEntities(priceMatch[1].replace(/<[^>]+>/g, '').trim()) : '';
      const budget = parseBudgetFromText(priceText);

      const descMatch = it.match(/<article[^>]*>([\s\S]*?)<\/article>/) || it.match(/<p[^>]*class="[^"]*desc[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      const cleanDesc = descMatch ? decodeHtmlEntities(descMatch[1].replace(/<[^>]+>/g, ' ').trim()) : cleanTitle;

      const fullText = (cleanTitle + '\n\n' + cleanDesc).trim();
      const tgMatch = fullText.match(/(?:^|[\s(,:;>«"'])@([a-zA-Z0-9_]{4,32})\b/) || fullText.match(/t\.me\/([a-zA-Z0-9_]{4,32})/);
      const authorUsername = tgMatch ? '@' + tgMatch[1] : '@freelance_ua';

      const classification = classifyLeadRuleBased(fullText, authorUsername);
      if (classification) {
        leads.push({
          title: cleanTitle,
          text: fullText,
          authorName: 'Замовник на Freelance.ua',
          authorUsername,
          sourceName: 'Freelance.ua',
          sourceType: 'freelance_ua',
          sourceUsername: '@freelance_ua',
          url: link,
          country: 'Freelance.ua',
          budget: budget || classification.budget || 0,
          classification
        });
      }
    }
  } catch (err) {
    console.error('[Exchanges] Freelance.ua error:', err.message);
  }
  return leads;
}

// 4. KABANCHIK.UA
export async function scrapeKabanchik() {
  const leads = [];
  try {
    const res = await fetch('https://kabanchik.ua/ua/tasks/category/razrabotka-saytov', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'uk-UA,uk;q=0.9,en;q=0.8'
      },
      signal: AbortSignal.timeout(9000)
    });
    if (!res.ok) return leads;
    const html = await res.text();
    const taskLinks = [...html.matchAll(/href="(\/ua\/task\/\d+-[^"]*)"/g)].map(m => 'https://kabanchik.ua' + m[1]);
    const unique = [...new Set(taskLinks)];

    for (const link of unique.slice(0, 5)) {
      const slug = link.split('/task/')[1] || '';
      const titleWords = slug.replace(/^\d+-/, '').split('-').filter(Boolean).join(' ');
      if (!titleWords || titleWords.length < 5) continue;
      const cleanTitle = titleWords.charAt(0).toUpperCase() + titleWords.slice(1);
      const fullText = `Завдання на Кабанчик: ${cleanTitle}.\nДеталі замовлення доступні за прямим посиланням на біржі.`;

      const classification = classifyLeadRuleBased(fullText, '@kabanchik');
      if (classification) {
        leads.push({
          title: cleanTitle,
          text: fullText,
          authorName: 'Замовник на Kabanchik',
          authorUsername: '@kabanchik',
          sourceName: 'Kabanchik',
          sourceType: 'kabanchik',
          sourceUsername: '@kabanchik',
          url: link,
          country: 'Kabanchik',
          budget: classification.budget || 0,
          classification
        });
      }
    }
  } catch (err) {
    console.error('[Exchanges] Kabanchik error:', err.message);
  }
  return leads;
}

/**
 * Scan all freelance exchanges in parallel and save matched leads
 */
export async function scanAllExchanges() {
  console.log('[Exchanges Monitor] 🌐 Збір замовлень з бірж: Freelancehunt, Djinni, Freelance.ua, Kabanchik...');
  const [fh, dj, fua, kb] = await Promise.all([
    scrapeFreelancehunt(),
    scrapeDjinni(),
    scrapeFreelanceUa(),
    scrapeKabanchik()
  ]);

  const allLeads = [...fh, ...dj, ...fua, ...kb];
  console.log(`[Exchanges Monitor] 📦 Знайдено з бірж: Freelancehunt (${fh.length}), Djinni (${dj.length}), Freelance.ua (${fua.length}), Kabanchik (${kb.length}). Разом: ${allLeads.length}`);

  let newCount = 0;
  const now = new Date();
  const timeFormatted = new Intl.DateTimeFormat('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Kyiv'
  }).format(now);

  for (const item of allLeads) {
    const cl = item.classification;
    const newLead = {
      id: `lead-ex-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      category: cl.category,
      categoryName: cl.categoryName,
      subcategory: cl.subcategory,
      subcategoryName: cl.subcategoryName,
      sourceType: item.sourceType,
      sourceName: item.sourceName,
      sourceUsername: item.sourceUsername,
      authorName: item.authorName,
      authorUsername: item.authorUsername,
      title: item.title,
      text: item.text,
      url: item.url,
      date: now.toISOString(),
      dateFormatted: `Сьогодні, ${timeFormatted}`,
      budget: item.budget,
      currency: '₴',
      country: item.country, // Shows exchange name (Freelancehunt, Djinni, etc.) instead of country!
      isUrgent: cl.isUrgent,
      requiresPortfolio: cl.requiresPortfolio,
      experienceRequired: cl.experienceRequired,
      aiRating: cl.initialRating,
      aiSummary: `Замовлення на ${item.sourceName}: ${cl.subcategoryName.toLowerCase()}${item.budget ? ` з бюджетом ${item.budget} ₴` : ''}.`,
      aiAnalysis: null,
      inCrm: false
    };

    const saved = db.addLead(newLead);
    if (saved) {
      newCount++;
    }
  }

  console.log(`[Exchanges Monitor] ✅ Додано ${newCount} нових замовлень з бірж у загальну базу заявок.`);
  return { totalScraped: allLeads.length, newLeads: newCount };
}
