/**
 * DWS Lead — Reddit Automated Hiring Scraper
 * Monitors high-ticket hiring subreddits:
 * - r/forhire (Web dev, bots, automation, ads, marketing)
 * - r/RobloxDevelopers (Roblox Luau scripts, places, games)
 * - r/freelance_forhire
 * - r/hireaprogrammer
 * 
 * Fetches open Atom/RSS feeds, filters out freelancers [For Hire],
 * extracts direct Reddit user profile (u/...), USD budgets, and ingests into DWS Lead.
 */

import { classifyLeadRuleBased } from './filter.js';
import { db } from '../db/db.js';

const TARGET_SUBREDDITS = [
  'forhire',
  'RobloxDevelopers',
  'freelance_forhire',
  'hireaprogrammer'
];

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function stripHtml(html) {
  if (!html) return '';
  return decodeHtmlEntities(
    html
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s{2,}/g, ' ')
  ).trim();
}

export function parseRedditUsdBudget(text) {
  if (!text) return 0;
  // Look for patterns like: $1000, $50-$100, $50/hr, 50 USD, $1.5k
  const patterns = [
    /\$\s*(\d[\d,.]*)\s*[kK]\b/i,                  // $1.5k or $2k
    /\$\s*(\d[\d,.]*)\s*(?:-\s*\$?\s*(\d[\d,.]*))?/i, // $500 or $500-$1000
    /(\d[\d,.]*)\s*(?:usd|dollars)/i,              // 500 USD
    /\b(\d[\d,.]*)\s*\$\b/                         // 500 $
  ];

  for (const pat of patterns) {
    const match = text.match(pat);
    if (match) {
      if (match[0].toLowerCase().includes('k')) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        return isNaN(val) ? 0 : Math.round(val * 1000);
      }
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(val) && val > 0) {
        return Math.round(val);
      }
    }
  }
  return 0;
}

/**
 * Fetch and parse a single subreddit RSS feed
 */
export async function scrapeSubreddit(subreddit) {
  const leads = [];
  try {
    const url = `https://www.reddit.com/r/${subreddit}/new.rss?limit=25`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(9000)
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`[Reddit Scraper] ⏳ r/${subreddit} Rate limit (429). Skipping for now.`);
      } else {
        console.warn(`[Reddit Scraper] r/${subreddit} HTTP status ${res.status}`);
      }
      return leads;
    }

    const xml = await res.text();
    const entries = xml.split('<entry>');

    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];

      // Extract title
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const rawTitle = titleMatch ? titleMatch[1].trim() : '';
      const cleanTitle = decodeHtmlEntities(rawTitle);

      // STRICT HIRING FILTER: Must be [Hiring] or Hiring or Looking to hire
      // Skip all [For Hire], [Meta], [Discussion]
      const isHiring = /\[hiring\]|hiring\b|looking for developer|looking for scripter|need developer|need scripter|looking to hire/i.test(cleanTitle);
      const isForHire = /\[for hire\]|\[forhire\]|for hire/i.test(cleanTitle);

      if (!isHiring || isForHire) {
        continue;
      }

      // Extract link
      const linkMatch = entry.match(/<link\s+href="([^"]+)"/);
      const link = linkMatch ? linkMatch[1].trim() : '';

      // Extract author
      const authorMatch = entry.match(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>/);
      let rawAuthor = authorMatch ? authorMatch[1].trim() : '';
      // Format clean author username: u/CoolClient
      let authorUsername = rawAuthor.replace(/^\/?u\//i, '').trim();
      if (!authorUsername || authorUsername === '[deleted]' || authorUsername === 'AutoModerator') {
        continue;
      }
      const formattedAuthor = `u/${authorUsername}`;

      // Extract content
      const contentMatch = entry.match(/<content[^>]*>([\s\S]*?)<\/content>/);
      const rawContent = contentMatch ? contentMatch[1] : '';
      const cleanBody = stripHtml(rawContent);

      const fullText = (cleanTitle + '\n\n' + cleanBody).trim();

      // Parse budget
      const budget = parseRedditUsdBudget(cleanTitle) || parseRedditUsdBudget(cleanBody);

      // Classify with rule-based engine
      const classification = classifyLeadRuleBased(fullText, formattedAuthor);
      if (classification) {
        leads.push({
          title: cleanTitle.replace(/^\[hiring\]\s*/i, '').trim(),
          text: fullText,
          authorName: formattedAuthor,
          authorUsername: formattedAuthor,
          sourceName: `Reddit (r/${subreddit})`,
          sourceType: 'reddit',
          sourceUsername: `r/${subreddit}`,
          url: link,
          country: 'Reddit (США/Global)',
          budget: budget || classification.budget || 0,
          classification
        });
      }
    }
  } catch (err) {
    console.error(`[Reddit Scraper] Error scraping r/${subreddit}:`, err.message);
  }
  return leads;
}

/**
 * Scan all target subreddits sequentially with safe delays
 */
export async function scrapeAllReddit() {
  console.log('[Reddit Scraper] 🌐 Сканування сабредітів вакансій: r/forhire, r/RobloxDevelopers, r/freelance_forhire, r/hireaprogrammer...');
  const allLeads = [];

  for (const sub of TARGET_SUBREDDITS) {
    const leads = await scrapeSubreddit(sub);
    allLeads.push(...leads);
    // 8-second safe delay between requests to avoid Reddit rate limiting
    await new Promise(r => setTimeout(r, 8000));
  }

  console.log(`[Reddit Scraper] 📦 Отримано ${allLeads.length} перевірених замовлень [Hiring] з Reddit.`);
  return allLeads;
}
