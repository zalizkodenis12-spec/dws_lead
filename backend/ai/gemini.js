/**
 * DWS Lead — AI Intelligence Module
 * Supports Google Gemini API (Free tier from Google AI Studio / Google One / AI Plus),
 * with robust offline heuristic fallback when no API key is provided.
 */

import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

/**
 * On-demand AI scoring and summary.
 * Only called when user specifically requests it (0 tokens wasted in background!).
 */
export async function analyzeLeadAi(lead) {
  if (!lead) return null;

  // If Gemini API Key is configured, make real call
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
    try {
      const prompt = `Ти — експертний бізнес-аналітик діджитал-агентства DenisWeb Studio (веброзробка, маркетинг, монтаж).
Проаналізуй замовлення/вакансію з українського Telegram:
ТЕКСТ ЗАМОВЛЕННЯ:
"""
${lead.text}
"""
Автор: ${lead.authorUsername || lead.authorName || 'Клієнт'}
Орієнтовний бюджет: ${lead.budget || 'не вказано'} грн.

Поверни виключно валідний JSON у такому форматі без зайвого тексту і без markdown лапок:
{
  "score": 85,
  "summary": "Короткий стислий опис суті замовлення в одне чітке речення",
  "pros": [
    "Плюс 1",
    "Плюс 2",
    "Плюс 3"
  ],
  "cons": [
    "Мінус або нюанс 1"
  ]
}`;

      let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      });

      // If user-specified model returns 404 (not found), auto-retry with standard flash
      if (res.status === 404 && GEMINI_MODEL !== 'gemini-1.5-flash') {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: "application/json"
            }
          })
        });
      }

      if (res.ok) {
        const json = await res.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          return {
            score: Math.min(100, Math.max(10, parsed.score || 80)),
            summary: parsed.summary || lead.title,
            pros: parsed.pros || ["Релевантна ніша", "Чіткі вимоги"],
            cons: parsed.cons || []
          };
        }
      } else {
        console.warn('Gemini API returned status:', res.status, await res.text());
      }
    } catch (err) {
      console.error('Error invoking Gemini API for scoring:', err);
    }
  }

  // --- SMART HEURISTIC FALLBACK (Offline / Free Mode) ---
  const text = (lead.text || '').toLowerCase();
  let score = 75;
  const pros = [];
  const cons = [];

  if (lead.budget > 15000) {
    score += 15;
    pros.push(`Високий адекватний бюджет (${lead.budget.toLocaleString('uk-UA')} ₴)`);
  } else if (lead.budget > 5000) {
    score += 8;
    pros.push(`Чітко вказаний бюджет (${lead.budget.toLocaleString('uk-UA')} ₴)`);
  } else {
    cons.push('Бюджет не вказаний або вимагає уточнення на першому дзвінку');
  }

  if (lead.isUrgent) {
    pros.push('Гаряче замовлення — потрібен швидкий старт (висока ймовірність закриття)');
  }

  if (lead.authorUsername && lead.authorUsername.startsWith('@')) {
    pros.push(`Прямий контакт замовника (${lead.authorUsername})`);
  } else {
    cons.push('Не вказано прямий юзернейм — контакт через переписку в чаті');
  }

  if (text.length > 120) {
    pros.push('Деталізоване технічне завдання від замовника');
  }

  score = Math.min(96, Math.max(60, score));

  // Generate 1-line smart summary
  let summary = lead.title;
  if (lead.subcategoryName) {
    summary = `${lead.isUrgent ? 'Термінова розробка' : 'Замовлення'}: ${lead.subcategoryName.toLowerCase()}${lead.budget ? ` з бюджетом ${lead.budget} ₴` : ''}.`;
  }

  return {
    score,
    summary,
    pros,
    cons: cons.length > 0 ? cons : ["Конкуренція серед фрілансерів у каналі"]
  };
}

/**
 * On-demand AI Offer generator based on user's profile and customized for the lead.
 */
export async function generatePersonalizedOffer(lead, userAbout, userTemplate) {
  if (!lead) return '';

  const clientName = lead.authorName && lead.authorName !== 'Клієнт' ? lead.authorName : 'Вітаю';
  const taskSnippet = lead.subcategoryName || lead.title || 'ваш проєкт';

  // If Gemini API Key is configured:
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 10) {
    try {
      const prompt = `Ти — помічник Дениса Залізка з агентства DenisWeb Studio.
Твоє завдання — мінімально адаптувати фірмовий шаблон відгуку Дениса під конкретну вакансію/замовлення клієнта.

ІНФОРМАЦІЯ ПРО АГЕНТСТВО (ПРО СЕБЕ):
${userAbout || "DenisWeb Studio — сучасна розробка під ключ, швидкі сайти, PageSpeed 90+, безкоштовне інтерактивне демо до авансу."}

ФІРМОВИЙ ШАБЛОН ВІДГУКУ:
${userTemplate || "Вітаю! Побачив ваше замовлення. У DenisWeb Studio ми готові зробити безкоштовне демо до оплати. Портфоліо: https://denis-webstudio.site"}

ЗАМОВЛЕННЯ КЛІЄНТА:
Автор: ${clientName} (@${lead.authorUsername || ''})
Текст замовлення:
"""
${lead.text}
"""

ПРАВИЛА:
1. Збережи стиль та тон фірмового шаблону Дениса.
2. МІНІМАЛЬНО та влучно видозміни текст так, щоб з перших рядків було видно, що ми уважно прочитали саме його задачу (${taskSnippet}).
3. Не пиши зайвої води. Повідомлення має бути коротким, впевненим, конверсійним і українською мовою.
4. Поверни ТІЛЬКИ готовий текст повідомлення для надсилання клієнту в Telegram.`;

      let endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 }
        })
      });

      if (res.status === 404 && GEMINI_MODEL !== 'gemini-1.5-flash') {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 }
          })
        });
      }

      if (res.ok) {
        const json = await res.json();
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 20) {
          return text.trim();
        }
      }
    } catch (err) {
      console.error('Error in Gemini personalized offer:', err);
    }
  }

  // --- SMART LOCAL ADAPTATION FALLBACK ---
  let baseTemplate = userTemplate;
  if (!baseTemplate || baseTemplate.trim().length < 10) {
    baseTemplate = "Вітаю, {NAME}! Побачив ваше замовлення щодо {TASK}. У DenisWeb Studio ми реалізуємо подібні проєкти під ключ за 2-4 дні з гарантією швидкості та чистого коду.\n\nГотові безкоштовно розробити концепт та інтерактивне демо головного блоку ще до початку оплати, щоб ви наочно побачили результат.\n\nНаш сайт та кейси: https://denis-webstudio.site\nКоли вам зручно коротко обговорити деталі?";
  }

  const nameVal = clientName === 'Вітаю' ? '' : clientName;
  let customized = baseTemplate
    .replace('{NAME}', nameVal)
    .replace('{TASK}', taskSnippet.toLowerCase())
    .replace(/Вітаю,\s*!/, 'Вітаю!')
    .trim();

  // If template didn't have placeholders, prefix appropriately
  if (!baseTemplate.includes('{NAME}') && !baseTemplate.includes('{TASK}')) {
    customized = `Вітаю${nameVal ? ', ' + nameVal : ''}! Щодо вашого завдання «${taskSnippet}»:\n\n${baseTemplate}`;
  }

  return customized;
}
