<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11ab3I8NqcbTSELx9vvjnGfuUgYjZawFc

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment (GitHub Pages)

此專案已設定 GitHub Actions 自動部署流程。

### 1. 設定 Secrets
為了在生產環境中使用 Gemini API，需要設定 GitHub Repository Secrets：

1. 進入 GitHub Repo 的 **Settings** > **Secrets and variables** > **Actions**
2. 點擊 **New repository secret**
3. Name: `GEMINI_API_KEY`
4. Value: 貼上你的 API Key
5. 點擊 **Add secret**

### 2. 觸發部署
- 只要 `push` 到 `main` 分支，就會自動觸發部署流程。
- 流程會建立 `gh-pages` 分支並將網頁內容放到該分支。

### 3. 設定 GitHub Pages
首次部署後，需要確認 Pages 設定：
1. 進入 **Settings** > **Pages**
2. **Build and deployment** / **Source** 選擇 `Deploy from a branch`
3. **Branch** 選擇 `gh-pages` / `/ (root)`
4. 點擊 **Save**
