const GIST_API = 'https://api.github.com/gists';
const FILE_NAME = 'weather-data.json';

/**
 * 從 Gist 讀取歷史天氣資料
 * @returns {object|null} { date, minT, maxT, avgT } 或 null
 */
export async function readGist(gistId, token) {
  const res = await fetch(`${GIST_API}/${gistId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    console.warn(`Gist 讀取失敗: ${res.status}`);
    return null;
  }

  const gist = await res.json();
  const file = gist.files?.[FILE_NAME];
  if (!file || !file.content) {
    console.warn('Gist 中無 weather-data.json');
    return null;
  }

  try {
    const data = JSON.parse(file.content);
    // 驗證必要欄位存在，避免空物件或格式錯誤被當作有效資料
    if (!data.date || data.avgT == null) {
      console.warn('Gist 資料格式不完整，視為無歷史資料');
      return null;
    }
    return data;
  } catch {
    console.warn('Gist 資料解析失敗');
    return null;
  }
}

/**
 * 將天氣資料寫入 Gist
 * @param {object} data - { date, minT, maxT, avgT }
 */
export async function writeGist(gistId, token, data) {
  const res = await fetch(`${GIST_API}/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [FILE_NAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!res.ok) {
    console.warn(`Gist 寫入失敗: ${res.status}`);
  } else {
    console.log('Gist 更新成功');
  }
}
