# 🖼️ 图片去背工具

基于 Cloudflare Workers + Remove.bg API 的图片背景去除工具。

## 特性

- ☁️ 部署在 Cloudflare Workers
- 💾 图片不存盘，全程内存处理
- 🎨 简洁美观的 Web 界面
- 📱 支持拖拽上传

## 部署步骤

### 1. 获取 Remove.bg API Key

1. 访问 https://www.remove.bg/api
2. 注册账号获取免费 API（每月 50 次免费）

### 2. 部署到 Cloudflare

```bash
# 安装依赖
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 设置 API Key（替换 YOUR_API_KEY）
wrangler secret put REMOVE_BG_API_KEY
# 输入你的 Remove.bg API Key

# 部署
wrangler deploy
```

### 3. 访问

部署完成后会返回你的 Worker URL，例如：
`https://bg-remove.your-name.workers.dev`

## 使用

1. 打开网站
2. 上传或拖拽图片
3. 点击"开始处理"
4. 下载去背结果

## Remove.bg 免费额度

- 免费版：每月 50 次 API 调用
- 付费版：$0.017/张 起

## 技术栈

- Cloudflare Workers（后端 + 部署）
- Remove.bg API（去背核心）
- 原生 HTML/CSS/JS（前端）
