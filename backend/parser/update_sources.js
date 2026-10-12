import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawInput = [
  "@work_kiev3",
  "@kyiv1work",
  "@uman_rabota",
  "@business_chat_ua",
  "@flschat",
  "@rabota_kieve_chate",
  "@toprobota_kyiv",
  "@rabota_dnepre3",
  "@smmbunker",
  "@smmpeople",
  "@robotka_kyiv",
  "@robotka_kiev",
  "@vakanciiodessa",
  "@toprobotalviv24",
  "@Robota_ternopil24",
  "@dnipro_wopk",
  "@R0botka_ua",
  "@toprobota_odesa",
  "@vakancii_onlineua",
  "@toprobotadnipro24",
  "@rabota_kiev_o",
  "@toprobotapoltava24",
  "@toprobotavinnytsia24",
  "@dnipro_robata",
  "@marketing_network1",
  "@robota_pidrobitok_kyivv",
  "@robota_poltava_top",
  "@vakancii_chernihiv",
  "@robota_kropyvnytskyi24",
  "https://t.me/rabotay_kieve",
  "https://t.me/H_news_R",
  "https://t.me/rabota_odessa7",
  "https://t.me/lutsk_robotka",
  "https://t.me/facebook_25",
  "https://t.me/Odessaa_ua",
  "https://t.me/krivoyq_rog_rabotaq",
  "https://t.me/ArbiDoktor",
  "https://t.me/ring_express_brd",
  "https://t.me/umanwork",
  "https://t.me/in_traff",
  "https://t.me/you_can_know_moreм",
  "https://t.me/joinchat/woxZIzaWi-syNzBi",
  "https://t.me/robota_odesa4",
  "https://t.me/workplaceinukraine",
  "https://t.me/rabota_kiev_bird",
  "https://t.me/Robota_kyiv_new",
  "https://t.me/aplaywork",
  "https://t.me/top_vacansii",
  "https://t.me/kiev_jobs",
  "https://t.me/jb_ua",
  "https://t.me/jobzy",
  "https://t.me/freelance_workua",
  "https://t.me/W0RK_UKRAINE",
  "https://t.me/uaallwork",
  "https://t.me/ua_robota",
  "https://t.me/I13partners",
  "https://t.me/mykolaivrobota_ua",
  "https://t.me/traffic_cpa_hr",
  "https://t.me/traffic_hr_cpa",
  "https://t.me/mediabuers_cpa",
  "https://t.me/uzhgorodrobota_ua",
  "https://t.me/Marketing_chat_UA",
  "https://t.me/smmpeople",
  "@kievy_rabota",
  "https://t.me/work_in_ukraine_golovne",
  "https://t.me/jecontact",
  "https://t.me/adgoodashell",
  "https://t.me/Kiev_rabota_vakansii",
  "https://t.me/rabota_kieve5",
  "https://t.me/Vinnytsia_Job",
  "https://t.me/rabota_zhutomere",
  "https://t.me/Workday_Lviv",
  "https://t.me/chat_robota",
  "https://t.me/RudenkoSMM",
  "https://t.me/Nikolaeve_v_rabota_robotaq",
  "https://t.me/w_o_r_k_Poland",
  "https://t.me/pidr0bitok_Lviv",
  "https://t.me/business_grup_ukraine",
  "https://t.me/robotakiew",
  "https://t.me/Nikolaev_rabota_robota",
  "https://t.me/lviv_ua_group",
  "https://t.me/kyiv_ua_group",
  "https://t.me/lvova_chat",
  "https://t.me/vinnytsia_ua_group",
  "https://t.me/dnipro_ua_group",
  "https://t.me/robitalviv2024",
  "https://t.me/DIPLOMATIA_UA",
  "https://t.me/odesa_ua_group",
  "https://t.me/kharkiv_ua_group",
  "https://t.me/evo_prom",
  "https://t.me/bazarUkrain",
  "https://t.me/rabotay_zhitomire",
  "https://t.me/worktopua",
  "https://t.me/rabota_Odessa_horeca"
];

const chats = [];
const channels = [];
const seen = new Set();

for (let raw of rawInput) {
  let clean = raw.trim();
  clean = clean.replace('https://t.me/', '').replace('@', '');
  if (clean.endsWith('м') && clean === 'you_can_know_moreм') {
    clean = 'you_can_know_more';
  }
  
  if (seen.has(clean.toLowerCase())) continue;
  seen.add(clean.toLowerCase());

  let type = 'channel';
  if (clean.includes('chat') || clean.includes('group') || clean.includes('bazar') || clean.startsWith('joinchat')) {
    type = 'chat';
  }

  // Niches
  let category = 'general';
  const low = clean.toLowerCase();
  if (low.includes('smm') || low.includes('traff') || low.includes('market') || low.includes('cpa') || low.includes('mediabuer') || low.includes('adgood') || low.includes('arbi') || low.includes('facebook')) {
    category = 'marketing';
  } else if (low.includes('fls') || low.includes('freelance') || low.includes('dev') || low.includes('workplace') || low.includes('jobzy')) {
    category = 'development';
  }

  const item = {
    username: clean.startsWith('joinchat') ? clean : '@' + clean,
    title: clean.startsWith('joinchat') ? 'Закритий чат UA (Invite)' : `${clean} UA`,
    category,
    active: true
  };

  if (type === 'chat') {
    chats.push(item);
  } else {
    channels.push(item);
  }
}

const result = {
  description: "База з 100+ Telegram чатів та каналів України, надісланих користувачем для моніторингу замовлень DWS Lead.",
  updatedAt: new Date().toISOString(),
  totalCount: chats.length + channels.length,
  chats,
  channels
};

const targetPath = path.join(__dirname, 'sources.json');
fs.writeFileSync(targetPath, JSON.stringify(result, null, 2), 'utf-8');
console.log(`Saved ${result.totalCount} sources: ${chats.length} chats, ${channels.length} channels.`);
