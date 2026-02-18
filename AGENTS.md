# napcat-plugin-puppeteer 开发指南

## 项目概述

这是一个 NapCat 插件，提供基于 Puppeteer 的 HTML/模板截图渲染服务。项目包含：
- **主插件**: `src/` 目录下的 TypeScript 后端 - 负责浏览器管理、截图/渲染 API
- **WebUI**: `src/webui/` 目录下的 React + Vite 前端 - 管理控制台

## 构建命令

### 根目录插件

```bash
# 安装依赖（使用 pnpm）
pnpm install

# 构建完整插件（包含 webui）
pnpm run build

# 仅构建 webui
pnpm run build:webui

# 开发模式监听
pnpm run watch
```

### WebUI

```bash
cd src/webui

# 热重载开发服务器
pnpm run dev

# 生产构建
pnpm run build

# 预览生产构建
pnpm run preview
```

### 单个测试执行

本项目暂无测试文件。如需添加测试，典型命令如下：
```bash
pnpm run test           # 运行所有测试
pnpm run test -- <file> # 运行单个测试文件
```

## 代码风格指南

### 通用规范

- 使用 **ES modules** (`import`/`export`) - 项目使用 `"type": "module"`
- 所有新代码使用 **TypeScript** - 启用 strict 模式
- 使用 4 空格缩进（不使用 Tab）
- TypeScript/JS 中使用 **单引号**
- JSX 中使用 **双引号**
- 文件末尾换行
- 最大行长度：120 字符

### TypeScript

```typescript
// 接口 - 使用 PascalCase，不带 I 前缀
interface BrowserConfig {
    executablePath?: string;
    headless?: boolean;
}

// 类型 - 使用 PascalCase
type Encoding = 'base64' | 'binary';

// 枚举 - 使用 PascalCase
enum Status {
    Active = 'active',
    Inactive = 'inactive',
}

// 函数 - 使用 camelCase
function getBrowserStatus(): BrowserStatus {}

// 常量 - 使用 UPPER_SNAKE_CASE
const MAX_RECONNECT_ATTEMPTS = 5;
```

### 导入顺序

导入顺序如下：
1. 外部库（如 `puppeteer-core`、`react`）
2. 内部模块（相对路径）
3. 类型导入

```typescript
// 外部库
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import type { Browser, Page } from 'puppeteer-core';

// 内部模块
import { pluginState } from '../core/state';
import { DEFAULT_BROWSER_CONFIG } from '../config';

// 类型（可与导入合并）
import type { ScreenshotOptions, RenderResult } from '../types';
```

### React/WebUI 规范

- 使用 **函数组件** 和 hooks
- 组件使用 **.tsx**，工具函数使用 **.ts**
- 组件应有 props 接口
- 使用 **Tailwind CSS** 进行样式化（已配置）

```typescript
// 组件示例
interface Props {
    title: string;
    onClick: () => void;
}

function MyComponent({ title, onClick }: Props) {
    return <button onClick={onClick}>{title}</button>;
}
```

### 错误处理

- 异步操作使用 try-catch 块
- 返回带状态标志的错误结果，而不是抛出异常
- 使用适当的日志级别记录错误

```typescript
// 正确 - 返回错误结果
async function screenshot(options: ScreenshotOptions): Promise<RenderResult> {
    try {
        // ... 实现
        return { status: true, data: result };
    } catch (error) {
        return { 
            status: false, 
            data: '' as any, 
            message: error instanceof Error ? error.message : String(error) 
        };
    }
}
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件 | kebab-case | `puppeteer-service.ts` |
| 接口/类型 | PascalCase | `BrowserConfig` |
| 函数 | camelCase | `initBrowser()` |
| 变量 | camelCase | `currentPageCount` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RECONNECT_ATTEMPTS` |
| 枚举 | PascalCase | `Status.Active` |
| React 组件 | PascalCase | `StatusPage.tsx` |

### API 响应格式

遵循现有的 API 响应模式：

```typescript
// 成功
res.json({ code: 0, data: {...} });

// 错误
res.status(500).json({ code: -1, message: '错误描述' });
```

### 日志

通过 `pluginState` 使用插件日志系统：

```typescript
// 不同日志级别
pluginState.log('info', '信息');
pluginState.log('warn', '警告');
pluginState.log('error', '错误');
pluginState.logDebug('调试信息'); // 仅在调试模式启用时记录
```

### 配置 Schema

添加新配置选项时，使用 NapCat 配置构建器：

```typescript
ctx.NapCatConfig.boolean('key', '标签', defaultValue, '描述');
ctx.NapCatConfig.string('key', '标签', defaultValue, '描述');
ctx.NapCatConfig.select('key', '标签', options, defaultValue, '描述');
```

## 架构说明

- **入口点**: `src/index.ts` - 插件初始化、路由注册
- **服务层**: `src/services/` - 浏览器管理、Chrome 安装
- **核心**: `src/core/state.ts` - 插件状态管理
- **类型**: `src/types.ts` - 所有 TypeScript 接口和类型
- **WebUI**: `src/webui/` - React 应用，包含 pages、components、hooks

## 提交规范

- **Commit Message**: 采用 Conventional Commits 规范（例如 feat:, fix:, docs:, refactor:）