# napcat-plugin-puppeteer 开发手册

## 功能清单

### 核心功能

#### 1. 浏览器管理
- [ ] 本地浏览器启动 (`puppeteer.launch`)
- [ ] 远程浏览器连接 (`puppeteer.connect` via WebSocket)
- [ ] 浏览器自动重连机制 (指数退避)
- [ ] 健康检查定时器
- [ ] 浏览器生命周期控制 (启动/停止/重启)

#### 2. 截图渲染
- [ ] URL 截图
- [ ] 本地文件截图 (`file://` 协议)
- [ ] HTML 字符串渲染
- [ ] 模板引擎 (支持 `{{key}}` 占位符)
- [ ] 元素选择器截图
- [ ] 全页面截图
- [ ] 分页截图
- [ ] 多种图片格式 (PNG/JPEG/WebP)
- [ ] 透明背景支持

#### 3. 页面管理
- [ ] 页面池 (pageQueue)
- [ ] 并发控制 (maxPages 信号量)
- [ ] 页面获取/释放机制

#### 4. Chrome 安装器
- [ ] 多平台检测 (Windows/macOS/Linux)
- [ ] Windows 版本检测
- [ ] Linux 发行版检测
- [ ] Chrome 自动下载安装
- [ ] 系统依赖安装 (Debian/Fedora/Arch/SUSE/Alpine)
- [ ] 浏览器路径自动查找

#### 5. 配置管理
- [ ] 配置文件读写 (JSON)
- [ ] 配置 Schema 定义
- [ ] WebUI 配置面板
- [ ] 配置变更回调

#### 6. API 接口
- [ ] 无认证 API (插件间调用)
- [ ] 需认证 API (WebUI 管理)
- [ ] 状态查询
- [ ] 浏览器控制

### WebUI 功能

- [ ] 仪表盘 (状态展示)
- [ ] 截图测试页面
- [ ] API 文档页面
- [ ] 设置配置页面
- [ ] 主题切换 (亮色/暗色)
- [ ] 提示消息 (Toast)

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+
- TypeScript 5+
- NapCat 框架 (用于测试)

### 项目结构

```
napcat-plugin-puppeteer/
├── src/
│   ├── index.ts              # 入口，插件生命周期
│   ├── config.ts             # 默认配置
│   ├── types.ts              # 类型定义
│   ├── core/
│   │   └── state.ts          # 状态管理
│   ├── services/
│   │   ├── puppeteer-service.ts  # 浏览器/截图服务
│   │   └── chrome-installer.ts   # Chrome 安装
│   └── webui/                # 前端
│       ├── package.json
│       ├── vite.config.ts
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── utils/
│       └── public/
├── dist/                     # 构建输出
├── package.json
├── tsconfig.json
├── vite.config.ts
└── AGENTS.md
```

### 开发步骤

#### 1. 初始化项目

```bash
# 创建目录
mkdir my-puppeteer-plugin
cd my-puppeteer-plugin

# 初始化 pnpm
pnpm init

# 安装依赖
pnpm add napcat-types puppeteer-core
pnpm add -D typescript @types/node vite @rollup/plugin-node-resolve express
```

#### 2. 配置 package.json

```json
{
    "name": "my-puppeteer-plugin",
    "type": "module",
    "main": "dist/index.mjs",
    "scripts": {
        "build": "vite build && pnpm run copy",
        "copy": "node -e \"...\""
    }
}
```

#### 3. 实现核心模块

参考 `src/types.ts` 定义类型：

```typescript
// types.ts
export interface ScreenshotOptions {
    file: string;
    file_type?: 'auto' | 'htmlString';
    data?: Record<string, any>;
    selector?: string;
    type?: 'png' | 'jpeg' | 'webp';
    encoding?: 'base64' | 'binary';
    fullPage?: boolean;
    multiPage?: boolean | number;
    // ... 更多选项
}

export interface RenderResult {
    status: boolean;
    data: string | Uint8Array;
    message?: string;
    time?: number;
}
```

#### 4. 实现状态管理

参考 `src/core/state.ts`：

```typescript
// state.ts
class PluginState {
    logger: any = null;
    config: any = {};
    
    log(level: string, msg: string, ...args: any[]) {
        if (this.logger) {
            this.logger[level](`[MyPlugin] ${msg}`, ...args);
        }
    }
    
    loadConfig(configPath: string) {
        // 读取 JSON 配置文件
    }
    
    saveConfig(configPath: string) {
        // 写入 JSON 配置文件
    }
}

export const pluginState = new PluginState();
```

#### 5. 实现 Puppeteer 服务

参考 `src/services/puppeteer-service.ts`：

```typescript
// puppeteer-service.ts
import puppeteer from 'puppeteer-core';
import { pluginState } from '../core/state';

let browser: any = null;

export async function initBrowser() {
    const config = pluginState.config.browser;
    
    if (config.browserWSEndpoint) {
        // 远程模式
        browser = await puppeteer.connect({
            browserWSEndpoint: config.browserWSEndpoint,
        });
    } else {
        // 本地模式
        browser = await puppeteer.launch({
            executablePath: config.executablePath,
            headless: config.headless !== false,
            args: config.args || [],
        });
    }
    
    return true;
}

export async function screenshot(options: ScreenshotOptions): Promise<RenderResult> {
    const page = await browser.newPage();
    
    try {
        // 处理不同输入类型
        if (options.file_type === 'htmlString') {
            await page.setContent(options.file);
        } else if (options.file.startsWith('file://')) {
            const html = fs.readFileSync(options.file.replace('file://', ''), 'utf-8');
            await page.setContent(html);
        } else {
            await page.goto(options.file);
        }
        
        // 截图
        const result = await page.screenshot({
            type: options.type || 'png',
            encoding: options.encoding || 'base64',
            fullPage: options.fullPage || false,
        });
        
        return { status: true, data: result };
    } catch (error) {
        return { 
            status: false, 
            data: '', 
            message: error instanceof Error ? error.message : String(error) 
        };
    } finally {
        await page.close();
    }
}
```

#### 6. 实现插件入口

参考 `src/index.ts`：

```typescript
// index.ts
const plugin_init = async (ctx: any) => {
    // 初始化状态
    pluginState.initFromContext(ctx);
    pluginState.loadConfig(ctx.configPath);
    
    // 启动浏览器
    await initBrowser();
    
    // 注册路由
    ctx.router.getNoAuth('/screenshot', async (req, res) => {
        const options = req.body || req.query;
        const result = await screenshot(options);
        
        if (result.status) {
            res.json({ code: 0, data: result.data, time: result.time });
        } else {
            res.status(500).json({ code: -1, message: result.message });
        }
    });
};

export {
    plugin_init,
    screenshot,
    renderHtml,
};
```

#### 7. 实现 WebUI

创建 React 应用：

```bash
cd src/webui
pnpm create vite . --template react-ts
pnpm add lucide-react tailwindcss postcss autoprefixer
pnpm add -D @vitejs/plugin-react
```

配置 Tailwind：

```javascript
// tailwind.config.js
export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
};
```

创建页面组件：

```tsx
// pages/StatusPage.tsx
export function StatusPage() {
    return <div>状态页面</div>;
}

// pages/TestPage.tsx  
export function TestPage() {
    return <div>测试页面</div>;
}
```

## 关键实现细节

### 1. 并发控制

```typescript
let currentPageCount = 0;
const pageQueue: Array<() => void> = [];

async function acquirePage(maxPages: number): Promise<Page> {
    if (currentPageCount >= maxPages) {
        await new Promise<void>(resolve => pageQueue.push(resolve));
    }
    
    currentPageCount++;
    return browser.newPage();
}

async function releasePage(page: Page) {
    await page.close();
    currentPageCount--;
    
    if (pageQueue.length > 0) {
        const next = pageQueue.shift();
        next?.();
    }
}
```

### 2. 远程重连

```typescript
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

browser.on('disconnected', async () => {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        return;
    }
    
    reconnectAttempts++;
    const delay = 3000 * Math.pow(2, reconnectAttempts - 1);
    
    await new Promise(r => setTimeout(r, delay));
    
    browser = await puppeteer.connect({
        browserWSEndpoint: config.browserWSEndpoint,
    });
});
```

### 3. 模板渲染

```typescript
function renderTemplate(html: string, data?: Record<string, any>): string {
    if (!data) return html;
    
    return html.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] !== undefined ? String(data[key]) : match;
    });
}
```

### 4. 分页截图

```typescript
async function multiPageScreenshot(element: any, pageHeight: number) {
    const box = await element.boundingBox();
    const totalPages = Math.ceil(box.height / pageHeight);
    const results = [];
    
    for (let i = 0; i < totalPages; i++) {
        const y = i * pageHeight;
        const height = Math.min(pageHeight, box.height - y);
        
        const screenshot = await element.screenshot({
            clip: { x: 0, y, width: box.width, height },
        });
        
        results.push(screenshot);
    }
    
    return results;
}
```

## 构建与部署

### 构建命令

```bash
pnpm install
pnpm run build
```

### Vite 配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import nodeResolve from '@rollup/plugin-node-resolve';

export default defineConfig({
    build: {
        target: 'esnext',
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: () => 'index.mjs',
        },
        rollupOptions: {
            external: ['puppeteer-core'],
        },
    },
    plugins: [nodeResolve()],
});
```

### 部署

构建产物：
```
dist/
├── index.mjs       # 插件入口
├── package.json
└── webui/         # 前端资源
```

将 `dist` 目录复制到 NapCat 插件目录即可。

## 测试

### 本地测试截图 API

```bash
# 启动后测试
curl -X POST http://localhost:6099/plugin/your-plugin/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "file": "<h1>Hello World</h1>",
    "file_type": "htmlString",
    "encoding": "base64"
  }'
```

### 调试日志

在配置中设置 `debug: true` 查看详细日志。

## 常见问题

1. **浏览器启动失败** - 检查浏览器路径是否正确
2. **远程连接失败** - 确认 WebSocket 地址格式正确
3. **截图为空白** - 检查是否有 waitForSelector 或 waitForTimeout
4. **中文乱码** - 确保系统安装了中文字体

## 参考资源

- [Puppeteer 文档](https://pptr.dev/)
- [NapCat 插件开发文档](https://napneko.github.io/)
- [Chrome for Testing](https://developer.chrome.com/docs/chromium/new-headless)
