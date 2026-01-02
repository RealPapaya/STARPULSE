# 📦 網站上線懶人包 (Deployment Kit)

這份文件幫您把「有 AI」和「無 AI」兩種網站需要的檔案分開整理。下次開新專案，直接複製對應的區塊即可。

---

## 🛠️ 第一部分：通用基底 (所有網站都要)
無論有沒有 AI，這三個檔案是網站能上線到 GitHub Pages 的基礎。

### 1. 安裝指令 (Terminal)
在您開的新資料夾執行：
```bash
# 建立專案
npm create vite@latest . -- --template react-ts

# 安裝基礎依賴 (包含 Tailwind CSS)
npm install
npm install tailwindcss @tailwindcss/postcss postcss
```

### 2. `vite.config.ts` (設定網址路徑)
**重要**：請將 `RepoName` 改成您的 GitHub Repository 名稱。
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/RepoName/", // <--- 改這裡！(例如: "/My-Portfolio/")
})
```

### 3. `index.css` (Tailwind 啟動)
```css
@import "tailwindcss";
```

---

## 🤖 第二部分：AI 網站專用 (有 AI 才要)
如果您要做像是 STARPULSE 這樣的 AI 應用，請**額外**加入這些。

### 1. 安裝 AI SDK
```bash
npm install @google/generative-ai
```

### 2. `services/geminiService.ts` (AI 核心檔案)
不管是算命、寫詩、聊天，都用這個檔案。只需修改 `systemInstruction`。
```typescript
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

// 定義您的資料格式 (這裡以字串陣列為例，可自行修改)
export interface AIResponse {
  result: string[];
}

export const fetchAIContent = async (userInput: string): Promise<any> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest", // 使用最穩定的通用版本
    systemInstruction: "你是一個專業的助手...(在這裡定義 AI 的角色)", // <--- 改這裡
    generationConfig: {
      responseMimeType: "application/json",
    }
  });

  const result = await model.generateContent(userInput);
  return JSON.parse(result.response.text());
};
```

### 3. 設定 GitHub Secrets
在 GitHub 網站上：`Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`
*   Name: `VITE_GEMINI_API_KEY`
*   Value: (您的 Google AI Key)

---

## 🚀 第三部分：部署劇本 (`deploy.yml`)
請在專案根目錄建立資料夾 `.github/workflows/`，裡面新增檔案 `deploy.yml`。

### 🅰️ 方案 A：純靜態網站 (無 AI)
```yaml
name: Deploy Static Setup
on:
  push:
    branches: ["main"]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 🅱️ 方案 B：AI 網站專用 (包含 API Key 注入)
差別在於 Build 步驟多了一行 `env` 設定。

```yaml
name: Deploy AI App
on:
  push:
    branches: ["main"]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm install
      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}  # <--- 關鍵這行
      - name: Setup Pages
        uses: actions/configure-pages@v4
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v4
        with:
          path: './dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```
