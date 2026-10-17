# 共享浏览器工具

[项目首页](../../README.md) · 简体中文 | [English](README-en.md)

`@userscripts/utils` 提供 DOM 等待、HTML 转 Markdown、图片转换、Notebook 组织、剪贴板和文件下载等浏览器工具。它是本仓库的内部工作区包，与消费它的用户脚本一起构建，不作为独立 npm 包发布。

## 使用方式与运行环境

LeetCode Toolkit 和 NowCoder Toolkit 在各自的 `tsconfig.json` 中将 `$utils/*` 映射到 `packages/utils/src/*`，通过 Vite 直接编译工具源码。本包没有统一的 `index.ts`；按模块导入：

```typescript
import { findElement } from "$utils/elementFinder";
import { htmlToMd } from "$utils/htmlToMd";
import { copyText } from "$utils/copy";

async function copyArticle() {
    const article = await findElement<HTMLElement>("article", {
        timeout: 3000,
    });
    const markdown = await htmlToMd(article, { convertImage: false });
    await copyText(markdown);
}
```

这些别名是工具箱的构建配置，不是公共模块路径。多数工具需要浏览器的 DOM、Blob、剪贴板等 API；图片请求及模拟点击还依赖用户脚本环境，不能直接当作普通 Node.js 工具运行。

## 模块索引

| 模块                                         | 输入与输出                                                                                      | 说明                                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| [`elementFinder.ts`](src/elementFinder.ts)   | `find(finderFn, config)` → `Promise<T>`；`findElement(selector, options?)` → `Promise<Element>` | 先尝试查询，未找到时用 `MutationObserver` 等待；支持 CSS、XPath、父节点和附加条件 |
| [`htmlToMd.ts`](src/htmlToMd.ts)             | `createTurndownService()` → 可扩展的转换器；`htmlToMd(node, options?)` → `Promise<string>`      | 基础代码块、段落、上标、图片和 GFM 表格规则                                       |
| [`data-url.ts`](src/data-url.ts)             | `convertSrcToDataURL(src)` → `Promise<string>`                                                  | 使用 GM 请求下载图片，转换为 Data URL；已有 `data:` 地址直接返回                  |
| [`compress-image.ts`](src/compress-image.ts) | `compressImage(File \| Blob)` → `Promise<File \| Blob>`                                         | 对 CompressorJS 的异步封装                                                        |
| [`jupyter.ts`](src/jupyter.ts)               | `NotebookBuilder` → Notebook 对象或 `.ipynb` 下载                                               | 链式添加标题、章节、Markdown、代码与语言信息                                      |
| [`copy.ts`](src/copy.ts)                     | `copyText(text)` → `Promise<void>`                                                              | 调用 `navigator.clipboard.writeText`，失败时抛出异常                              |
| [`download-file.ts`](src/download-file.ts)   | `downloadFile(blob, filename, extension)` → `void`                                              | 创建临时 Object URL 并触发下载，文件名自动附加扩展名                              |
| [`click.ts`](src/click.ts)                   | `simulateMouseClickReact(element)` → `void`                                                     | 使用 `unsafeWindow` 依次派发 `mousedown`、`mouseup`、`click`                      |
| [`elementIndex.ts`](src/elementIndex.ts)     | `getElementIndex(element)` → `number`                                                           | 返回元素在直接父元素的元素子节点中的零基索引；无父节点时抛错                      |
| [`declaration.d.ts`](src/declaration.d.ts)   | 类型声明                                                                                        | 为 GFM 表格插件提供 TypeScript 声明                                               |

## 转换与权限边界

### DOM 等待

`find` 的默认超时为 5000 毫秒，第二个配置参数需要显式传入，使用默认配置时传 `{}`。`findElement` 默认超时为 500 毫秒；二者的 `timeout: 0` 都表示持续等待。等待超时会拒绝 Promise，调用方应处理失败，避免把不存在的页面区域视为已找到。

默认观察选项只监听子节点变化。对属性变化或文本变化的特殊需求，应通过 `find` 的 `observerOption` 设置；这些工具不负责 SPA 路由生命周期和组件卸载。

### Markdown 与图片

`htmlToMd` 默认启用 `convertImage: true`，预先下载全部 `<img>` 并内嵌为 Data URL；`convertImage: false` 跳过图片下载。传入 `turndownService` 可添加消费项目自己的转换规则。

图片请求通过 `@sec-ant/gm-fetch` 发出，消费脚本需要相应的 GM 请求权限和可连接域名。GIF、SVG 不压缩，其他格式交给 CompressorJS。转换错误会向调用方传播。

当前实现使用模块级图片缓存和 `Promise.all`：单张图片失败会使整次预取失败，异常路径不会清空缓存，也没有针对并发转换的隔离。需要稳定的在线图片导出时，应明确使用 `convertImage: false`；不要把图片故障视为正文转换成功。

基础转换器不理解特定站点的题解数据、公式渲染结构或多语言编辑器。LeetCode 新的题解导出使用工具箱自身的 [`solution-*` 模块](../../userscripts/leetcode-toolkit/src/lib)，牛客公式规则位于 [`scrape-description.ts`](../../userscripts/nowcoder-toolkit/src/routes/practice/scrape-description.ts)。修改这些站点能力时，应先在对应工具箱中定位逻辑。

### Notebook

```typescript
import { NotebookBuilder } from "$utils/jupyter";

const notebook = new NotebookBuilder()
    .addTitle("Example", "https://example.com/problem")
    .addMarkdown("Problem description")
    .addCode("print('Hello')")
    .setLanguage("python");

const content = notebook.build();
// 在浏览器中下载为 example.ipynb：
notebook.download("example");
```

`build()` 只组织 JSON 数据，不执行代码、不安装内核，也不验证导出内容的 Notebook schema。目前实现写入 `nbformat: 5`、`nbformat_minor: 10`；实际读取兼容性需要在目标 Notebook 客户端中检查，不能仅凭 TypeScript 类型判定通过。`setLanguage` 只设置 `language_info.name`，不创建完整的内核配置。

### 剪贴板、下载与模拟点击

`copyText` 没有 GM 剪贴板回退。调用方应 `await` 并捕获异常，再显示成功或失败提示；浏览器权限、安全上下文和用户激活状态可能影响写入。LeetCode 题解导出的 GM 回退由消费脚本自己处理。

`downloadFile` 触发浏览器下载后返回，不能证明文件已保存到磁盘。`simulateMouseClickReact` 派发的是合成事件，不会产生真实用户激活，也不保证网站接受该事件。

## 开发与验证

本包没有独立的构建或测试命令。在仓库根目录安装依赖后，从消费脚本运行相应检查：

```powershell
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit build
pnpm --filter nowcoder-toolkit check
pnpm --filter nowcoder-toolkit build
```

已有测试不等同于对所有共享工具的完整覆盖。修改后应按涉及能力补充消费端验证：检查实际网页 DOM、图片请求失败、剪贴板拒绝、文件内容及目标 Notebook 客户端读取结果。关于环境安装和各脚本命令，参见[项目首页](../../README.md)。

## 维护与来源

本包随 [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts) 独立维护。问题反馈请使用[本项目 Issues](https://github.com/liliujie2026/Userscripts/issues)。

项目源自 [eclipher/Userscripts](https://github.com/eclipher/Userscripts)，保留原作者版权与 [MIT 许可证](../../LICENSE)。使用到的第三方库及其许可仍由各自项目所有。
