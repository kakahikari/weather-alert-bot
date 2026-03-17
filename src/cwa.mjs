const API_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';

/**
 * 呼叫 CWA API 取得天氣預報
 * @param {string} token - CWA API 授權碼
 * @param {string} datasetId - 資料集 ID（如 F-D0047-073）
 * @param {string} locationName - 鄉鎮區名稱（如 北屯區）
 */
export async function fetchForecast(token, datasetId, locationName) {
  const url = new URL(`${API_BASE}/${datasetId}`);
  url.searchParams.set('Authorization', token);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('locationName', locationName);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`CWA API 錯誤: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (!json.success || json.success === 'false') {
    throw new Error(`CWA API 回傳失敗: ${JSON.stringify(json).slice(0, 500)}`);
  }

  return json;
}

// 取 ElementValue 的第一個值（key 不固定，取第一個非空值）
function getFirstValue(elementValue) {
  const obj = elementValue[0];
  for (const val of Object.values(obj)) {
    if (val !== '' && val != null) return val;
  }
  return null;
}

/**
 * 從預報資料中解析明天的天氣
 *
 * API 實際回傳的元素（F-D0047-073，3天預報）:
 *   溫度, 露點溫度, 相對濕度, 體感溫度, 舒適度指數,
 *   風速, 風向, 3小時降雨機率, 天氣現象, 天氣預報綜合描述
 *
 * 注意：無獨立的「最低溫度」「最高溫度」，需從「溫度」的逐時資料推算
 */
export function parseTomorrowWeather(data, tomorrowStr, locationName) {
  const locations = data.records.Locations[0].Location;

  // 找到指定地區，找不到則用第一筆
  const location = locations.find((l) => l.LocationName === locationName) || locations[0];
  console.log(`使用地區: ${location.LocationName}`);

  const elements = location.WeatherElement;
  const findElement = (name) => elements.find((el) => el.ElementName === name);

  // 篩選時間落在明天的資料
  const isTomorrow = (timeStr) => timeStr?.startsWith(tomorrowStr);

  // 溫度 — 逐時資料（DataTime），從中推算 min/max/avg
  const tempEl = findElement('溫度');
  const tempValues = tempEl.Time
    .filter((t) => isTomorrow(t.DataTime))
    .map((t) => parseFloat(getFirstValue(t.ElementValue)));
  const minT = tempValues.length > 0 ? Math.min(...tempValues) : null;
  const maxT = tempValues.length > 0 ? Math.max(...tempValues) : null;
  const avgT = tempValues.length > 0
    ? Math.round((tempValues.reduce((a, b) => a + b, 0) / tempValues.length) * 10) / 10
    : null;

  // 3小時降雨機率 — 區間型（StartTime/EndTime）
  const popEl = findElement('3小時降雨機率');
  const popValues = popEl.Time
    .filter((t) => isTomorrow(t.StartTime))
    .map((t) => parseInt(getFirstValue(t.ElementValue), 10))
    .filter((v) => !isNaN(v));
  const maxRainProb = popValues.length > 0 ? Math.max(...popValues) : 0;

  // 天氣現象 — 區間型
  const wxEl = findElement('天氣現象');
  const wxTomorrow = wxEl.Time.find((t) => isTomorrow(t.StartTime));
  const wxDescription = wxTomorrow ? getFirstValue(wxTomorrow.ElementValue) : '無資料';

  return { minT, maxT, avgT, maxRainProb, wxDescription };
}
