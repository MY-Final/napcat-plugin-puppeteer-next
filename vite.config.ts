import { resolve, dirname } from 'path';
import { defineConfig } from 'vite';
import nodeResolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
import { napcatHmrPlugin } from 'napcat-plugin-debug-cli/vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nodeModules = [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
].flat();

// 依赖排除：bufferutil 和 utf-8-validate 是原生模块，需要排除
// 但 puppeteer-core 和 ws 需要打包进去，这样它们会正确使用内置的 WebSocket
const external: string[] = ['bufferutil', 'utf-8-validate'];

/**
 * 递归复制目录
 */
function copyDirRecursive(src: string, dest: string) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = resolve(src, entry.name);
        const destPath = resolve(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * 构建后自动复制资源的 Vite 插件
 */
function copyAssetsPlugin() {
    return {
        name: 'copy-assets',
        writeBundle() {
            try {
                const distDir = resolve(__dirname, 'dist');

                // 1. 构建 WebUI 前端
                const webuiRoot = resolve(__dirname, 'src/webui');
                try {
                    if (!fs.existsSync(resolve(webuiRoot, 'node_modules'))) {
                        console.log('[copy-assets] (o\'v\'o) 正在安装 WebUI 依赖...');
                        execSync('pnpm install', {
                            cwd: webuiRoot,
                            stdio: 'pipe',
                        });
                        console.log('[copy-assets] (o\'v\'o) WebUI 依赖安装完成');
                    }

                    console.log('[copy-assets] (o\'v\'o) 正在构建 WebUI...');
                    const webuiEnv = { ...process.env };
                    delete webuiEnv.NODE_ENV;
                    execSync('pnpm run build', {
                        cwd: webuiRoot,
                        stdio: 'pipe',
                        env: webuiEnv,
                    });
                    console.log('[copy-assets] (o\'v\'o) WebUI 构建完成');
                } catch (e: any) {
                    console.error('[copy-assets] (;_;) WebUI 构建失败:', e.stdout?.toString().slice(-300) || e.message);
                }

                // 2. 复制 webui 构建产物
                const webuiDist = resolve(__dirname, 'src/webui/dist');
                const webuiDest = resolve(distDir, 'webui');
                if (fs.existsSync(webuiDist)) {
                    copyDirRecursive(webuiDist, webuiDest);
                    console.log('[copy-assets] (o\'v\'o) 已复制 webui 构建产物');
                }

                // 3. 生成精简的 package.json
                const pkgPath = resolve(__dirname, 'package.json');
                if (fs.existsSync(pkgPath)) {
                    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
                    const distPkg: Record<string, unknown> = {
                        name: pkg.name,
                        plugin: pkg.plugin,
                        version: pkg.version,
                        type: pkg.type,
                        main: pkg.main,
                        description: pkg.description,
                        author: pkg.author,
                        dependencies: pkg.dependencies,
                    };
                    if (pkg.napcat) {
                        distPkg.napcat = pkg.napcat;
                    }
                    fs.writeFileSync(
                        resolve(distDir, 'package.json'),
                        JSON.stringify(distPkg, null, 2)
                    );
                    console.log('[copy-assets] (o\'v\'o) 已生成精简 package.json');
                }

                // 4. 复制 templates 目录（如果存在）
                const templatesSrc = resolve(__dirname, 'templates');
                if (fs.existsSync(templatesSrc)) {
                    copyDirRecursive(templatesSrc, resolve(distDir, 'templates'));
                    console.log('[copy-assets] (o\'v\'o) 已复制 templates 目录');
                }

                console.log('[copy-assets] (*\'v\'*) 资源复制完成！');
            } catch (error) {
                console.error('[copy-assets] (;_;) 资源复制失败:', error);
            }
        },
    };
}

export default defineConfig({
    resolve: {
        conditions: ['node', 'default'],
    },
    build: {
        sourcemap: false,
        target: 'esnext',
        minify: false,
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'index.mjs',
        },
        rollupOptions: {
            external: [...nodeModules, ...external],
            output: {
                inlineDynamicImports: true,
            },
        },
        outDir: 'dist',
        // 处理 CommonJS 模块
        commonjsOptions: {
            include: [/node_modules/],
            transformMixedEsModules: true,
            defaultIsModuleExports: true,
        },
    },
    plugins: [
        replace({
            preventAssignment: true,
            values: {
                // 禁用 ws 的原生模块加载
                'process.env.WS_NO_BUFFER_UTIL': '"true"',
                'process.env.WS_NO_UTF_8_VALIDATE': '"true"',
            }
        }),
        nodeResolve(),
        copyAssetsPlugin(),
        napcatHmrPlugin({
            webui: {
                distDir: './src/webui/dist',
                targetDir: 'webui',
            },
        }),
    ],
});
