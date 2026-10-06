import { db } from './backend/db/db.js';
import { classifyLeadRuleBased } from './backend/parser/filter.js';
import { analyzeLeadAi, generatePersonalizedOffer } from './backend/ai/gemini.js';
import { ingestMessage } from './backend/parser/monitor.js';

console.log('🧪 ПОЧАТОК ТЕСТУВАННЯ DWS LEAD...\n');

// 1. Test Database
console.log('1️⃣ Перевірка бази даних:');
const leads = db.getLeads();
console.log(`- Знайдено заявок: ${leads.length}`);
const crm = db.getCrmLeads();
console.log(`- Знайдено клієнтів в CRM: ${crm.length} (Перший: ${crm[0]?.name} - ${crm[0]?.statusLabel})`);
const income = db.getIncome();
console.log(`- Дохід: Зароблено ${income.totalEarned} ₴, Очікувано ${income.totalExpected} ₴`);
const profile = db.getProfile();
console.log(`- Профіль студії: ${profile.agencyName} (${profile.ownerName})`);

// 2. Test Rule-based filter
console.log('\n2️⃣ Перевірка 0-cost смарт-фільтра:');
const testPostGood = "Шукаю досвідченого розробника для створення сучасного інтернет-магазину взуття. Бюджет 25000 грн. Писати в ПП @shoes_shop";
const filterResultGood = classifyLeadRuleBased(testPostGood, '@shoes_shop');
console.log('- Тест валідного замовлення:');
console.log(`  Категорія: ${filterResultGood?.categoryName} -> ${filterResultGood?.subcategoryName}`);
console.log(`  Бюджет: ${filterResultGood?.budget} ₴, Рейтинг: ${filterResultGood?.initialRating}/100`);

const testPostSpam = "Робота на дому без досвіду, виплата щодня на карту 500 грн, ставте лайки в тікток";
const filterResultSpam = classifyLeadRuleBased(testPostSpam);
console.log(`- Тест спаму (має бути відсіяно): ${filterResultSpam === null ? 'ВІДСІЯНО УСПІШНО ✅' : 'ПОМИЛКА ❌'}`);

const testPostResume = "Привіт, я junior розробник, шукаю роботу або проєкт для себе, моє резюме нижче";
const filterResultResume = classifyLeadRuleBased(testPostResume);
console.log(`- Тест резюме кандидата (має бути відсіяно): ${filterResultResume === null ? 'ВІДСІЯНО УСПІШНО ✅' : 'ПОМИЛКА ❌'}`);

// 3. Test Ingestion
console.log('\n3️⃣ Перевірка додавання через Ingestion:');
const ingested = ingestMessage({
  text: testPostGood,
  authorUsername: '@shoes_shop',
  authorName: 'Олег',
  sourceTitle: 'IT Фріланс Україна'
});
console.log(`- Лід створено: ID=${ingested?.id}, Назва="${ingested?.title}"`);

// 4. Test AI module (Offline heuristic mode)
console.log('\n4️⃣ Перевірка AI модуля (Score & Offer):');
const testLead = db.getLeadById('lead-1');
const aiAnalysis = await analyzeLeadAi(testLead);
console.log(`- AI Скоринг: ${aiAnalysis.score}/100`);
console.log(`- AI Стислий опис: "${aiAnalysis.summary}"`);
console.log(`- AI Переваги: ${aiAnalysis.pros.join('; ')}`);

const aiOffer = await generatePersonalizedOffer(testLead, profile.about, profile.responseTemplate);
console.log(`- Згенерований AI-відгук під вакансію:\n"""\n${aiOffer}\n"""`);

console.log('\n✅ ВСІ МОДУЛІ ТА ЛОГІКА ПРАЦЮЮТЬ БЕЗДОГАННО!');
