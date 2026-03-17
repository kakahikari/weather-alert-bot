/**
 * 檢查警報條件
 * @param {object} tomorrow - { minT, maxT, avgT, maxRainProb }
 * @param {object|null} yesterday - { minT, maxT, avgT } 或 null
 * @returns {string[]} 觸發的警報訊息陣列
 */
export function checkAlerts(tomorrow, yesterday) {
  const alerts = [];

  // 條件 a: 明天有雨 > 60%
  if (tomorrow.maxRainProb > 60) {
    alerts.push(`⚠️ 明日有雨：降雨機率 ${tomorrow.maxRainProb}%`);
  }

  // 條件 b: 昨日與明日溫差 >= 5°C
  if (yesterday) {
    const diff = Math.abs(tomorrow.avgT - yesterday.avgT);
    if (diff >= 5) {
      const direction = tomorrow.avgT < yesterday.avgT ? '降溫' : '升溫';
      alerts.push(
        `⚠️ ${direction}注意：與昨日差 ${diff.toFixed(1)}°C` +
        ` (明 ${tomorrow.avgT}°C / 昨 ${yesterday.avgT}°C)`
      );
    }
  }

  // 條件 c: 明日日夜溫差 >= 7°C
  const dayNightDiff = tomorrow.maxT - tomorrow.minT;
  if (dayNightDiff >= 7) {
    alerts.push(
      `⚠️ 日夜溫差大：差 ${dayNightDiff.toFixed(1)}°C` +
      ` (高 ${tomorrow.maxT}°C / 低 ${tomorrow.minT}°C)`
    );
  }

  return alerts;
}
