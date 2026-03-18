# Weather Alert Bot

GitHub Actions 排程天氣警報 Bot，每日抓取中央氣象署預報資料，符合條件時推送 Telegram 通知

## 警報條件

- **下雨**：明日降雨機率 > 60%
- **昨日溫差**：與昨日平均溫度相差 ≥ 5°C
- **日夜溫差**：明日最高與最低溫差 ≥ 7°C

## 設定

### 1. 建立 GitHub Gist

建立一個 Gist，檔名為 `weather-data.json`，內容填 `{}`，記下 Gist ID

### 2. 設定 Repo Secrets

在 GitHub repo 的 **Settings → Secrets and variables → Actions** 中新增：

| Secret | 說明 |
|--------|------|
| `CWA_API_TOKEN` | [CWA 開放資料平台](https://opendata.cwa.gov.tw/)授權碼 |
| `CWA_DATASET_ID` | 資料集 ID |
| `CWA_LOCATION` | 鄉鎮區名稱（如 `中正區`） |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID |
| `GIST_ID` | 上一步建立的 Gist ID |
| `GH_TOKEN` | GitHub Personal Access Token（需有 `gist` scope） |

### 3. 排程

GitHub Actions 每日 **20:00 台灣時間**（UTC 12:00）自動執行

## 本地測試

```bash
# 複製環境變數範本並填入實際值
cp .env.example .env

# 執行
npm run dev
```

## 手動觸發

在 GitHub repo 的 **Actions** 頁面，選擇 **Weather Alert** workflow，點擊 **Run workflow**。

## 資料集對照

常用縣市資料集 ID：

| 縣市 | Dataset ID |
|------|-----------|
| 臺北市 | `F-D0047-061` |
| 新北市 | `F-D0047-069` |
| 臺中市 | `F-D0047-073` |
| 高雄市 | `F-D0047-065` |
| 臺南市 | `F-D0047-077` |

完整列表請參考 [CWA 開放資料平台](https://opendata.cwa.gov.tw/)。

## 參考文件

- [預報 XML 產品預報因子欄位中文說明表（含天氣描述代碼表）](https://opendata.cwa.gov.tw/opendatadoc/MFC/A0012-001.pdf)
- [Opendata API 線上說明文件](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
