# napcat-plugin-puppeteer-next

基于 Puppeteer 的 HTML/模板截图渲染服务插件，为 NapCat 提供强大的网页截图和渲染能力。

## 🎨 功能特性

- 📸 **网页截图** - 支持 URL、HTML 字符串、本地文件截图
- 🖼️ **模板渲染** - 支持 Handlebars 风格模板数据渲染
- 🔄 **多页面并发** - 可配置并发数，支持排队机制
- 🖥️ **浏览器管理** - 本地/远程浏览器模式，自动重连
- 📦 **Chrome 自动安装** - 支持 Windows/macOS/Linux 自动下载安装 Chrome
- 🔧 **完整 WebUI** - 可视化配置、截图调试、API 文档

## 📁 项目结构

```
napcat-plugin-puppeteer-next/
├── src/
│   ├── index.ts                 # 插件入口
│   ├── config.ts                # 配置定义
│   ├── types.ts                 # TypeScript 类型定义
│   ├── core/
│   │   └── state.ts             # 全局状态管理
│   ├── services/
│   │   ├── puppeteer-service.ts # 浏览器管理、截图核心逻辑
│   │   └── chrome-installer.ts  # Chrome 安装器
│   └── webui/                   # React SPA 前端
│       ├── src/
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   ├── StatusPage.tsx    # 仪表盘
│       │   │   ├── TestPage.tsx      # 截图调试
│       │   │   ├── ApiPage.tsx       # API 文档
│       │   │   └── SettingsPage.tsx  # 系统设置
│       │   ├── components/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── ToastContainer.tsx
│       │   └── hooks/
│       │       ├── useStatus.ts
│       │       ├── useTheme.ts
│       │       └── useToast.ts
├── docs/
│   ├── API.md                   # API 接口文档
│   ├── ARCHITECTURE.md          # 架构设计文档
│   └── DEVELOPMENT.md           # 开发手册
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 构建插件

```bash
pnpm run build
```

构建产物在 `dist/` 目录下：
- `index.mjs` - 插件主入口
- `webui/` - WebUI 前端文件
- `package.json` - 插件元信息

### 3. 部署到 NapCat

将 `dist/` 目录复制到 NapCat 的 `plugins/napcat-plugin-puppeteer-next/` 目录下。

### 4. 重启 NapCat

NapCat 会自动加载插件并安装依赖。

## 🔧 配置说明

首次使用需要配置浏览器路径或安装 Chrome：

1. 打开 NapCat WebUI → 插件管理 → napcat-plugin-puppeteer-next → 设置
2. 选择以下方式之一：
   - **方式 A**: 在「系统设置」中安装 Chrome（推荐）
   - **方式 B**: 配置「本地浏览器路径」指向已安装的 Chrome
   - **方式 C**: 配置「远程浏览器地址」连接到远程 Chrome 实例

## 📡 API 接口

### 无认证 API（供其他插件调用）

```
POST /plugin/napcat-plugin-puppeteer-next/api/screenshot
POST /plugin/napcat-plugin-puppeteer-next/api/render
GET  /plugin/napcat-plugin-puppeteer-next/api/screenshot?url=https://example.com
GET  /plugin/napcat-plugin-puppeteer-next/api/browser/status
```

### 需认证 API（WebUI 管理）

```
POST /api/Plugin/ext/napcat-plugin-puppeteer-next/browser/start
POST /api/Plugin/ext/napcat-plugin-puppeteer-next/browser/stop
POST /api/Plugin/ext/napcat-plugin-puppeteer-next/browser/restart
POST /api/Plugin/ext/napcat-plugin-puppeteer-next/chrome/install
GET  /api/Plugin/ext/napcat-plugin-puppeteer-next/chrome/status
```

### 调用示例

```javascript
// 渲染 HTML 模板
const response = await fetch('http://localhost:6099/plugin/napcat-plugin-puppeteer-next/api/render', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        html: '<div style="padding:20px;background:#fff;"><h1>Hello {{name}}</h1></div>',
        data: { name: 'World' },
        encoding: 'base64'
    })
});
const result = await response.json();
// result.data 为 Base64 编码的图片数据
```

## 📖 详细文档

- [API 文档](./docs/API.md) - 完整的 API 接口说明
- [架构设计](./docs/ARCHITECTURE.md) - 系统架构和核心模块说明
- [开发手册](./docs/DEVELOPMENT.md) - 开发指南和实现细节

## 🏗️ 技术栈

- **后端**: TypeScript + Puppeteer + NapCat Plugin API
- **前端**: React + TypeScript + TailwindCSS + Vite
- **构建**: Vite + Rollup

## 🤝 参与贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🔗 相关链接

- [GitHub 仓库](https://github.com/MY-Final/napcat-plugin-puppeteer-next)
- [NapCat 项目](https://github.com/NapNeko/NapCatQQ)
- [参考实现](https://github.com/AQiaoYo/napcat-plugin-puppeteer) - 本项目的参考原型
