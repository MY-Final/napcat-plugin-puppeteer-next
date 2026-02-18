# napcat-plugin-puppeteer 架构文档

## 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NapCat 框架                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    NapCatPluginContext                               │   │
│  │  - logger (日志)        - actions (OneBot API)                      │   │
│  │  - configPath (配置)     - router (路由)                             │   │
│  │  - pluginName           - dataPath                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           插件主程序 (src/)                                  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        src/index.ts                                  │   │
│  │  - plugin_init()     - 初始化入口                                     │   │
│  │  - plugin_cleanup()  - 清理函数                                       │   │
│  │  - plugin_get_config() / plugin_set_config()                        │   │
│  │  - plugin_on_config_change() - 配置变更回调                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│         ┌────────────────────────────┼────────────────────────────┐        │
│         ▼                            ▼                            ▼        │
│  ┌─────────────┐            ┌─────────────┐              ┌─────────────┐  │
│  │ core/state  │            │   services/  │              │   config.ts │  │
│  │             │            │              │              │             │  │
│  │ PluginState │            │ puppeteer-   │              │ DEFAULT_    │  │
│  │ - config    │◄──────────►│ service.ts   │              │   CONFIG    │  │
│  │ - logger    │            │              │              │             │  │
│  │ - actions   │            │ initBrowser  │              │ initConfigUI│  │
│  └─────────────┘            └─────────────┘              └─────────────┘  │
│                                       │                                       │
│                                       ▼                                       │
│                           ┌─────────────────────┐                            │
│                           │ services/chrome-   │                            │
│                           │ installer.ts       │                            │
│                           │                    │                            │
│                           │ installChrome()    │                            │
│                           │ findInstalled     │                            │
│                           │   Browsers()      │                            │
│                           └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          API 路由层                                          │
│                                                                             │
│  无认证 API (NoAuth)              │  需认证 API (Auth)                       │
│  ─────────────────               │  ────────────────                        │
│  GET  /info                      │  GET  /config                             │
│  GET  /status                    │  POST /config                             │
│  GET  /browser/status            │  POST /browser/start                     │
│  GET  /screenshot                │  POST /browser/stop                      │
│  POST /screenshot                │  POST /browser/restart                   │
│  POST /render                    │  POST /chrome/install                    │
│  GET  /chrome/status            │  POST /chrome/install-deps                │
│  GET  /chrome/progress           │  POST /chrome/uninstall                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         浏览器层 (Puppeteer)                                  │
│                                                                             │
│   ┌─────────────────┐              ┌─────────────────┐                    │
│   │  本地浏览器模式  │              │  远程浏览器模式   │                    │
│   │                 │              │                  │                    │
│   │ puppeteer.launch│◄───────────►│ puppeteer.connect│                    │
│   │ (启动 Chrome)  │   自动重连    │ (WebSocket)     │                    │
│   └─────────────────┘              └─────────────────┘                    │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │                        页面管理                                    │     │
│   │  - 页面池 (pageQueue)                                            │     │
│   │  - 并发控制 (maxPages)                                           │     │
│   │  - 页面生命周期: acquirePage() → releasePage()                   │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WebUI 前端 (src/webui/)                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  pages/                      │  components/                      │     │
│   │  ├── StatusPage.tsx         │  ├── Header.tsx                   │     │
│   │  ├── TestPage.tsx           │  ├── Sidebar.tsx                  │     │
│   │  ├── ApiPage.tsx            │  ├── ToastContainer.tsx            │     │
│   │  └── SettingsPage.tsx      │                                   │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  hooks/                                                            │     │
│   │  ├── useStatus.ts   - 获取插件/浏览器状态                         │     │
│   │  ├── useTheme.ts    - 主题管理                                    │     │
│   │  └── useToast.ts    - 提示消息                                    │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐     │
│   │  utils/                                                            │     │
│   │  └── api.ts          - API 调用封装                               │     │
│   └─────────────────────────────────────────────────────────────────┘     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 核心模块

### 1. 状态管理 (src/core/state.ts)

`PluginState` 是全局单例，管理整个插件的状态：

```typescript
class PluginState {
    logger: PluginLogger | null      // 日志器
    actions: ActionMap              // OneBot API 调用
    config: PluginConfig            // 当前配置
    configPath: string              // 配置文件路径
    pluginName: string              // 插件名称
    startTime: number              // 启动时间
}
```

**核心方法：**
- `initFromContext(ctx)` - 从 NapCat 上下文初始化
- `loadConfig()` - 从文件加载配置
- `saveConfig()` - 保存配置到文件
- `setConfig()` - 合并更新配置
- `log()` / `logDebug()` - 日志输出

### 2. Puppeteer 服务 (src/services/puppeteer-service.ts)

负责浏览器生命周期管理和截图核心逻辑：

**浏览器管理：**
- `initBrowser()` - 初始化浏览器（本地/远程）
- `closeBrowser()` - 关闭浏览器
- `restartBrowser()` - 重启浏览器
- `getBrowserStatus()` - 获取浏览器状态

**截图功能：**
- `screenshot(options)` - 核心截图函数
- `renderHtml(html, options)` - 渲染 HTML 字符串
- `screenshotUrl(url, options)` - 截图 URL

**内部机制：**
- 页面池实现并发控制
- 远程浏览器自动重连
- 健康检查定时器

### 3. Chrome 安装器 (src/services/chrome-installer.ts)

多平台 Chrome 浏览器安装服务：

- `installChrome()` - 下载安装 Chrome
- `findInstalledBrowsers()` - 查找系统浏览器
- `installLinuxDependencies()` - 安装 Linux 依赖
- `detectLinuxDistro()` - 检测 Linux 发行版
- `getWindowsVersion()` - 检测 Windows 版本

### 4. 配置模块 (src/config.ts)

- `DEFAULT_CONFIG` - 默认配置
- `DEFAULT_BROWSER_CONFIG` - 默认浏览器配置
- `initConfigUI()` - 生成 WebUI 配置 Schema

## 数据流

### 截图请求流程

```
外部调用
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│  HTTP 请求                                                         │
│  GET /screenshot?url=...&type=png                                  │
│  POST /screenshot { file: "...", type: "png", ... }                │
│  POST /render { html: "...", data: {...}, ... }                   │
└────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│  src/index.ts 路由处理                                              │
│  - parseRequestBody() 解析请求体                                    │
│  - 权限检查 (NoAuth / Auth)                                         │
└────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│  puppeteer-service.ts:screenshot()                                 │
│  1. acquirePage() 获取页面 (并发控制)                               │
│  2. 设置视口和 HTTP 头                                              │
│  3. 导航到目标 (URL / HTML / 文件)                                   │
│  4. 等待元素/超时                                                   │
│  5. 执行截图                                                        │
│  6. releasePage() 释放页面                                          │
└────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────────────────────────────────┐
│  返回结果                                                           │
│  { code: 0, data: "base64...", time: 123 }                        │
│  或                                                                 │
│  { code: -1, message: "错误信息" }                                 │
└────────────────────────────────────────────────────────────────────┘
```

### 配置更新流程

```
WebUI 配置表单
    │
    ▼
POST /config { enabled: true, browser: {...} }
    │
    ▼
src/index.ts:plugin_set_config()
    │
    ▼
pluginState.setConfig(ctx, config)
    │
    ├──────────────────┬──────────────────┐
    ▼                  ▼                  ▼
更新内存配置      保存到 config.json    触发回调
pluginState.config                       plugin_on_config_change()
```

### 浏览器重连机制

```
远程浏览器断开
    │
    ▼
browser.disconnected 事件触发
    │
    ▼
检查 isClosing 标志
    │
    ├─ 否 ──► 设置防抖 (2秒)
    │              │
    │              ▼
    │         attemptReconnect()
    │              │
    │              ▼
    │         指数退避重试 (最多5次)
    │         3s → 6s → 12s → 24s → 30s
    │              │
    │              ▼
    │         启动健康检查 (每30秒)
    │              │
    └──────────────┘
```

## API 响应格式

### 成功响应
```typescript
{ code: 0, data: {...}, time: 123 }
// 或直接返回图片
{ code: 0, data: "base64...", time: 123 }
```

### 错误响应
```typescript
{ code: -1, message: "错误描述" }
```

## 类型定义 (src/types.ts)

### ScreenshotOptions - 截图选项
```typescript
interface ScreenshotOptions {
    file: string                    // URL/文件路径/HTML 字符串
    file_type?: 'auto' | 'htmlString'
    data?: Record<string, any>     // 模板数据
    selector?: string              // 截图元素选择器
    type?: 'png' | 'jpeg' | 'webp'
    quality?: number               // 1-100
    encoding?: 'base64' | 'binary'
    fullPage?: boolean             // 全页截图
    omitBackground?: boolean       // 透明背景
    multiPage?: boolean | number   // 分页截图
    setViewport?: ViewportOptions
    pageGotoParams?: PageGotoParams
    headers?: Record<string, string>
    retry?: number
    waitForTimeout?: number
    waitForSelector?: string
}
```

### BrowserConfig - 浏览器配置
```typescript
interface BrowserConfig {
    executablePath?: string         // 浏览器路径
    browserWSEndpoint?: string     // 远程 WebSocket 地址
    headless?: boolean             // 无头模式
    args?: string[]               // 启动参数
    proxy?: BrowserProxyConfig    // 代理配置
    maxPages?: number             // 最大并发页面数
    timeout?: number              // 超时时间
    defaultViewportWidth?: number
    defaultViewportHeight?: number
    deviceScaleFactor?: number
}
```

### PluginConfig - 插件配置
```typescript
interface PluginConfig {
    enabled: boolean               // 全局开关
    browser: BrowserConfig        // 浏览器配置
    debug?: boolean               // 调试模式
}
```

## 配置文件

配置文件位于 `{NapCat数据目录}/napcat-plugin-puppeteer/config.json`：

```json
{
    "enabled": true,
    "debug": false,
    "browser": {
        "executablePath": "",
        "browserWSEndpoint": "",
        "headless": true,
        "args": [...],
        "proxy": {
            "server": "http://127.0.0.1:7890",
            "username": "",
            "password": "",
            "bypassList": ""
        },
        "maxPages": 10,
        "timeout": 30000,
        "defaultViewportWidth": 1280,
        "defaultViewportHeight": 800,
        "deviceScaleFactor": 2
    }
}
```

## 部署结构

```
dist/                          # 构建输出目录
├── index.mjs                   # 插件入口文件
├── package.json                # 依赖配置
└── webui/                     # WebUI 静态资源
    ├── index.html
    ├── dashboard.html
    ├── static/
    └── assets/
```

## 关键技术点

1. **ES Modules** - 项目使用 `"type": "module"`
2. **TypeScript Strict** - 严格模式
3. **Vite** - 构建工具
4. **React 18** - WebUI 框架
5. **Tailwind CSS** - 样式框架
6. **Puppeteer Core** - 浏览器控制（不含 Chromium）
