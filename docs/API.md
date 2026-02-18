# napcat-plugin-puppeteer API 接口文档

## 概述

本文档详细描述 napcat-plugin-puppeteer 插件的所有 HTTP API 接口。

**前置说明**：
- 插件 ID: `napcat-plugin-puppeteer`（实际使用时请替换为你的插件 ID）
- 基础路径: `/plugin/{pluginId}/api/` 或 `/api/Plugin/ext/{pluginId}/`

---

## 通用说明

### 响应格式

所有接口遵循统一响应结构：

```typescript
// 成功
{
    code: 0,
    data: {...},
    time?: number  // 耗时（毫秒）
}

// 失败
{
    code: -1,
    message: "错误描述"
}
```

### HTTP 状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 409 | 冲突（如正在安装 Chrome） |
| 500 | 服务器内部错误 |

### 认证说明

| 类型 | 路径前缀 | 说明 |
|------|----------|------|
| 无认证 | `/plugin/{id}/api/` | 插件间调用，无需登录 |
| 需认证 | `/api/Plugin/ext/{id}/` | WebUI 管理，需携带 NapCat token |

---

## 核心接口

### 1. 获取插件信息

**GET** `/info`

获取插件基本信息。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "data": {
        "pluginName": "napcat-plugin-puppeteer",
        "version": "1.0.0"
    }
}
```

---

### 2. 获取插件状态

**GET** `/status`

获取插件运行状态和浏览器状态。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
 {
        "pluginName": "napcat-plugin-puppeteer",
        "    "data":uptime": 3600000,
        "uptimeFormatted": "1小时0分钟",
        "enabled": true,
        "browser": {
            "connected": true,
            "mode": "local",
            "version": "Chrome/131.0.6778.204",
            "pageCount": 1,
            "totalRenders": 10,
            "failedRenders": 0
        }
    }
}
```

---

### 3. 获取浏览器状态

**GET** `/browser/status`

获取浏览器详细状态。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "data": {
        "connected": true,
        "mode": "local",
        "version": "Chrome/131.0.6778.204",
        "pageCount": 1,
        "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "proxy": { "server": "http://127.0.0.1:7890" },
        "startTime": 1705123456789,
        "totalRenders": 10,
        "failedRenders": 0
    }
}
```

---

### 4. 截图 (GET)

**GET** `/screenshot`

快速 URL 截图接口。

**请求参数** (Query):

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| url | string | 是 | - | 截图目标 URL |
| type | string | 否 | png | 图片格式: png/jpeg/webp |
| encoding | string | 否 | base64 | 编码: base64/binary |
| selector | string | 否 | body | CSS 选择器 |
| fullPage | string | 否 | false | 是否全页截图 (true/false) |
| raw | string | 否 | false | 是否直接返回图片 (true/false) |

**请求示例**:
```
GET /screenshot?url=https://example.com&type=png&encoding=base64
```

**响应示例**:
```json
{
    "code": 0,
    "data": "iVBORw0KGgoAAAANSUhEUgAA...",
    "time": 1234
}
```

---

### 5. 截图 (POST)

**POST** `/screenshot`

完整参数截图接口。

**请求体 (Body)**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| file | string | 是 | - | URL / HTML 字符串 / file:// 路径 |
| file_type | string | 否 | auto | 文件类型: auto / htmlString |
| data | object | 否 | - | 模板变量 `{ key: value }` |
| selector | string | 否 | body | CSS 选择器 |
| type | string | 否 | png | 图片格式: png/jpeg/webp |
| quality | number | 否 | - | 质量 1-100 (仅 jpeg/webp) |
| encoding | string | 否 | base64 | 编码: base64/binary |
| fullPage | boolean | 否 | false | 是否全页截图 |
| omitBackground | boolean | 否 | false | 透明背景 |
| multiPage | boolean \| number | 否 | false | 分页: true=2000px, number=指定高度 |
| setViewport | object | 否 | - | 视口设置 |
| pageGotoParams | object | 否 | - | 页面导航参数 |
| headers | object | 否 | - | HTTP 请求头 |
| retry | number | 否 | 1 | 重试次数 |
| waitForTimeout | number | 否 | - | 截图前等待毫秒数 |
| waitForSelector | string | 否 | - | 等待选择器出现 |

**setViewport 详细**:
```typescript
{
    width?: number,      // 视口宽度
    height?: number,     // 视口高度
    deviceScaleFactor?: number  // 像素比
}
```

**pageGotoParams 详细**:
```typescript
{
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2',
    timeout?: number  // 超时毫秒数
}
```

**请求示例**:
```json
{
    "file": "https://example.com",
    "type": "png",
    "encoding": "base64",
    "fullPage": false,
    "selector": "#content"
}
```

**响应示例**:
```json
{
    "code": 0,
    "data": "iVBORw0KGgoAAAANSUhEUgAA...",
    "time": 1234
}
```

---

### 6. 渲染 HTML

**POST** `/render`

HTML 模板渲染并截图。

**请求体 (Body)**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| html | string | 是* | - | HTML 字符串 (*html 或 file 至少有一个) |
| file | string | 是* | - | URL / 本地文件路径 |
| data | object | 否 | - | 模板变量 |
| selector | string | 否 | body | CSS 选择器 |
| type | string | 否 | png | 图片格式 |
| quality | number | 否 | - | 质量 1-100 |
| encoding | string | 否 | base64 | 编码 |
| fullPage | boolean | 否 | false | 全页截图 |
| omitBackground | boolean | 否 | false | 透明背景 |
| multiPage | boolean \| number | 否 | false | 分页 |
| setViewport | object | 否 | - | 视口 |
| pageGotoParams | object | 否 | - | 导航参数 |
| waitForSelector | string | 否 | - | 等待选择器 |
| waitForTimeout | number | 否 | - | 等待毫秒 |

**请求示例**:
```json
{
    "html": "<div style='padding:20px'><h1>{{title}}</h1><p>{{content}}</p></div>",
    "data": {
        "title": "Hello",
        "content": "World"
    },
    "type": "png",
    "encoding": "base64"
}
```

---

## 管理接口 (需认证)

### 7. 获取配置

**GET** `/config`

获取当前插件配置。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "data": {
        "enabled": true,
        "debug": false,
        "browser": {
            "executablePath": "",
            "browserWSEndpoint": "",
            "headless": true,
            "args": ["--no-sandbox", ...],
            "maxPages": 10,
            "timeout": 30000,
            "defaultViewportWidth": 1280,
            "defaultViewportHeight": 800,
            "deviceScaleFactor": 2
        }
    }
}
```

---

### 8. 保存配置

**POST** `/config`

保存插件配置（合并更新）。

**请求体 (Body)**:

完整配置对象或部分字段。参考上方 GET /config 响应格式。

**请求示例**:
```json
{
    "enabled": true,
    "debug": true,
    "browser": {
        "headless": false,
        "maxPages": 20
    }
}
```

**响应示例**:
```json
{
    "code": 0,
    "message": "ok"
}
```

---

### 9. 启动浏览器

**POST** `/browser/start`

启动浏览器实例。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "message": "浏览器已启动"
}
```

---

### 10. 关闭浏览器

**POST** `/browser/stop`

关闭浏览器实例。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "message": "浏览器已关闭"
}
```

---

### 11. 重启浏览器

**POST** `/browser/restart`

重启浏览器实例。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "message": "浏览器已重启"
}
```

---

## Chrome 安装接口

### 12. 获取 Chrome 状态

**GET** `/chrome/status`

获取 Chrome 安装状态和系统信息。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "data": {
        "installed": true,
        "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "version": "131.0.6778.204",
        "installPath": "C:\\Users\\xxx\\AppData\\Local\\puppeteer",
        "isInstalling": false,
        "progress": { "status": "idle", "progress": 0 },
        "platform": "win32",
        "arch": "x64",
        "linuxDistro": null,
        "windowsVersion": "Windows 11",
        "defaultVersion": "131.0.6778.204",
        "canInstall": true,
        "cannotInstallReason": null,
        "installedBrowsers": [
            {
                "type": "chrome",
                "executablePath": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                "version": "131.0.6778.204",
                "source": "Default Path",
                "channel": "stable"
            }
        ]
    }
}
```

---

### 13. 获取安装进度

**GET** `/chrome/progress`

获取 Chrome 安装进度。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "data": {
        "isInstalling": true,
        "progress": {
            "status": "downloading",
            "progress": 50,
            "message": "正在下载 Chrome...",
            "downloadedBytes": 104857600,
            "totalBytes": 209715200,
            "speed": "10MB/s",
            "eta": "10s"
        }
    }
}
```

---

### 14. 安装 Chrome (需认证)

**POST** `/chrome/install`

安装/更新 Chrome。

**请求体 (Body)**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| version | string | 否 | 131.0.6778.204 | Chrome 版本 |
| installDeps | boolean | 否 | true | 是否安装系统依赖 |
| source | string | 否 | NPMMIRROR | 下载源: NPMMIRROR / GOOGLE |

**请求示例**:
```json
{
    "version": "131.0.6778.204",
    "installDeps": true,
    "source": "NPMMIRROR"
}
```

**响应示例**:
```json
{
    "code": 0,
    "message": "安装任务已启动，请通过 /chrome/progress 查询进度"
}
```

---

### 15. 卸载 Chrome (需认证)

**POST** `/chrome/uninstall`

卸载已安装的 Chrome。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "message": "Chrome 卸载成功"
}
```

---

### 16. 安装系统依赖 (需认证)

**POST** `/chrome/install-deps`

安装 Linux 系统依赖（仅 Linux 有效）。

**请求参数**: 无

**响应示例**:
```json
{
    "code": 0,
    "message": "依赖安装任务已启动"
}
```

---

## 路由总览

### 无认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/info` | 获取插件信息 |
| GET | `/status` | 获取插件状态 |
| GET | `/browser/status` | 获取浏览器状态 |
| GET | `/screenshot` | 快速截图 (URL) |
| POST | `/screenshot` | 完整截图 |
| POST | `/render` | HTML 渲染截图 |
| GET | `/chrome/status` | 获取 Chrome 状态 |
| GET | `/chrome/progress` | 获取安装进度 |

### 需认证 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/config` | 获取配置 |
| POST | `/config` | 保存配置 |
| POST | `/browser/start` | 启动浏览器 |
| POST | `/browser/stop` | 关闭浏览器 |
| POST | `/browser/restart` | 重启浏览器 |
| POST | `/chrome/install` | 安装 Chrome |
| POST | `/chrome/uninstall` | 卸载 Chrome |
| POST | `/chrome/install-deps` | 安装系统依赖 |

---

## 使用示例

### cURL 示例

```bash
# 截图 URL
curl -X POST http://localhost:6099/plugin/napcat-plugin-puppeteer/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"file": "https://example.com", "encoding": "base64"}'

# 渲染 HTML
curl -X POST http://localhost:6099/plugin/napcat-plugin-puppeteer/api/render \
  -H "Content-Type: application/json" \
  -d '{"html": "<h1>Hello</h1>", "type": "png"}'

# 获取状态
curl http://localhost:6099/plugin/napcat-plugin-puppeteer/api/status

# 启动浏览器 (需认证)
curl -X POST http://localhost:6099/api/Plugin/ext/napcat-plugin-puppeteer/browser/start \
  -H "Content-Type: application/json"
```

### JavaScript 示例

```javascript
// 截图
const res = await fetch('http://localhost:6099/plugin/napcat-plugin-puppeteer/api/screenshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        file: '<h1>Hello World</h1>',
        file_type: 'htmlString',
        type: 'png',
        encoding: 'base64'
    })
});

const result = await res.json();
if (result.code === 0) {
    console.log('Screenshot:', result.data);
}
```

### TypeScript 导出调用

```typescript
// 插件内直接调用
import { renderHtml, screenshotUrl } from 'napcat-plugin-puppeteer';

const result = await renderHtml('<h1>{{msg}}</h1>', {
    data: { msg: 'Hello' },
    type: 'png'
});

if (result.status) {
    // result.data 是 base64 字符串
}
```

---

## 注意事项

1. **file 参数**: 支持三种格式：
   - URL: `https://example.com`
   - 本地文件: `file:///path/to/file.html`
   - HTML 字符串: 当 `file_type` 为 `htmlString` 时

2. **模板变量**: 使用 `{{key}}` 占位符，在 `data` 中提供对应值

3. **分页截图**: `multiPage` 为 `true` 时每页 2000px，数字时为指定高度

4. **远程浏览器**: 设置 `browserWSEndpoint` 配置项后自动使用远程模式
