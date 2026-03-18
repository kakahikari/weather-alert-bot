import { fetchForecast, parseTomorrowWeather } from './cwa.mjs';
import { readGist, writeGist } from './gist.mjs';
import { checkAlerts } from './alert.mjs';
import { sendMessage } from './telegram.mjs';

// 取得台灣時間的日期（YYYY-MM-DD 格式）
function getTaiwanDate(offsetDays = 0) {
  const now = new Date();
  // 86400000 = 24小時的毫秒數
  const target = new Date(now.getTime() + offsetDays * 86400000);
  // en-CA 的日期格式為 YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(target);
}

// 根據天氣描述回傳對應 emoji（參照 CWA 天氣描述代碼表，代碼 1~32）
function getWeatherEmoji(description) {
  if (/雷/.test(description)) return '⛈️';
  if (/雪/.test(description)) return '❄️';
  if (/雨/.test(description)) return '🌧️';
  if (/霧/.test(description)) return '🌫️';
  if (/陰/.test(description)) return '☁️';
  if (/多雲/.test(description)) return '⛅';
  if (/晴/.test(description)) return '☀️';
  return '';
}

// 格式化日期為 MM/DD
function formatMMDD(dateStr) {
  return dateStr.slice(5).replace('-', '/');
}

async function main() {
  const {
    CWA_API_TOKEN,
    CWA_DATASET_ID,
    CWA_LOCATION,
    TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID,
    GIST_ID,
    GH_TOKEN,
  } = process.env;

  // 驗證必要環境變數
  const required = { CWA_API_TOKEN, CWA_DATASET_ID, CWA_LOCATION, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GIST_ID, GH_TOKEN };
  for (const [key, val] of Object.entries(required)) {
    if (!val) {
      console.error(`[⚠️ 錯誤] 缺少環境變數: ${key}`);
      process.exit(1);
    }
  }

  const today = getTaiwanDate(0);
  const tomorrow = getTaiwanDate(1);
  console.log(`今天: ${today}, 明天: ${tomorrow}`);

  // 1. 呼叫 CWA API 取得明天天氣
  console.log('正在取得天氣預報...');
  const forecastData = await fetchForecast(CWA_API_TOKEN, CWA_DATASET_ID, CWA_LOCATION);
  const tomorrowWeather = parseTomorrowWeather(forecastData, tomorrow, CWA_LOCATION);
  console.log('明日天氣:', tomorrowWeather);

  // 防呆: 確保取得的溫度資料有效，避免後續邏輯出錯且保護 Gist 歷史資料
  if (
    typeof tomorrowWeather.minT !== 'number' ||
    typeof tomorrowWeather.maxT !== 'number' ||
    typeof tomorrowWeather.avgT !== 'number'
  ) {
    console.error('[⚠️ 錯誤] 明日天氣資料缺少必要的溫度資訊');
    process.exit(1);
  }

  // 2. 讀取 Gist 中的昨天資料
  console.log('正在讀取歷史資料...');
  const yesterdayData = await readGist(GIST_ID, GH_TOKEN);
  if (yesterdayData) {
    console.log('昨日資料:', yesterdayData);
  } else {
    console.log('無昨日資料，跳過昨日溫差比較');
  }

  // 3. 判斷警報條件
  const alerts = checkAlerts(tomorrowWeather, yesterdayData);

  // 4. 將今天的預報存入 Gist（供明天使用）
  await writeGist(GIST_ID, GH_TOKEN, {
    date: today,
    minT: tomorrowWeather.minT,
    maxT: tomorrowWeather.maxT,
    avgT: tomorrowWeather.avgT,
  });

  // 5. 有觸發條件才發送 Telegram
  if (alerts.length === 0) {
    console.log('無警報條件觸發，不發送通知');
    return;
  }

  const message = [
    `<b>${CWA_LOCATION}明日天氣</b> (${formatMMDD(tomorrow)})`,
    ``,
    `${getWeatherEmoji(tomorrowWeather.wxDescription)} 天氣預報: ${tomorrowWeather.wxDescription} ${tomorrowWeather.minT}~${tomorrowWeather.maxT}°C`,
    ...alerts,
  ].join('\n');

  console.log('發送通知:\n' + message);
  await sendMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, message);
}

main().catch((err) => {
  console.error('[⚠️ 錯誤] 執行失敗:', err);
  process.exit(1);
});
