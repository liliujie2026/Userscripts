# 牛客网工具箱

[English](./README-en.md) · [项目首页](../../README.md) · [问题反馈](https://github.com/liliujie2026/Userscripts/issues)

用于牛客在线编程练习页的浏览器用户脚本，在题目描述区域添加 Markdown 复制和 Jupyter Notebook 导出按钮。当前包版本为 **1.0.0**。

本脚本由 [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts) 独立维护，源自 [eclipher/Userscripts](https://github.com/eclipher/Userscripts)。本项目的发布、问题反馈和后续维护均以当前仓库为准，原项目保留为来源说明。

## 功能

| 功能          | 行为                                                                              |
| ------------- | --------------------------------------------------------------------------------- |
| 复制描述      | 将当前题目描述转换为 Markdown 并写入剪贴板。                                      |
| 公式转换      | 优先从 KaTeX 的 `annotation` 读取 TeX，处理行内公式、居中块级公式及部分特殊缩进。 |
| 图片处理      | 通过用户脚本管理器请求图片，尝试压缩并内嵌为 Data URL；图片请求失败可能中断导出。 |
| Notebook 导出 | 将标题、来源链接、Markdown 题面和当前代码组织为 `.ipynb` 文件。                   |

Notebook 的代码来自页面工具栏中的 **Download** 链接，语言来自页面 Monaco 元素的属性。这要求相关控件已经加载且可访问。脚本不提供本地语言内核，也不自动执行导出的代码。

## 匹配范围与运行条件

- 匹配 `http://www.nowcoder.com/practice/*` 和 `https://www.nowcoder.com/practice/*`。
- 需要支持用户脚本的浏览器及管理器，例如 [Tampermonkey](https://www.tampermonkey.net/)。
- 按钮挂载在题面区域；课程页、比赛页和其他牛客域名没有配置匹配规则。
- 脚本使用 `GM_xmlhttpRequest` 下载题面图片，构建产物还可能从 CDN 加载依赖。
- 为兼容页面对事件监听的修改，脚本会从临时 iframe 读取原生方法并替换页面的 `EventTarget.prototype.addEventListener`。这一适配会影响页面范围内的事件注册；若遇到页面交互异常，请先停用脚本并刷新后对照检查。

## 安装

### 使用本项目发布的构建产物

1. 安装并启用用户脚本管理器。
2. 打开本项目的 [GitHub Releases](https://github.com/liliujie2026/Userscripts/releases)，查找 `nowcoder-v*` 发布。
3. 如果已有对应发布，下载 Assets 中的 `nowcoder-toolkit.user.js`，将完整内容导入管理器或粘贴到新脚本中保存。
4. 停用重复安装的旧版本，刷新一个牛客练习题页面。

如果当前仓库尚未发布该产物，使用下面的源码构建方式。原作者的 Greasy Fork 条目不是本维护版本的安装或更新入口；本项目独立条目的地址确定后会在本仓库公布。

### 从源码构建

在仓库根目录运行。请先按[根目录开发说明](../../README.md#从源码开始)准备 Node.js 和 pnpm：

```sh
pnpm install --frozen-lockfile
pnpm --filter nowcoder-toolkit build
```

将生成的 `userscripts/nowcoder-toolkit/dist/nowcoder-toolkit.user.js` 完整导入用户脚本管理器。`dist` 是构建产物目录，不需要提交到 Git。

## 使用与验收

1. 打开可访问的牛客练习题页面，等待题目描述和代码编辑器加载完成。
2. 在题面区域点击“复制描述”，粘贴到文本编辑器，核对正文、样例、公式和表格。
3. 点击“保存为 Jupyter Notebook”，在浏览器下载目录中找到 `.ipynb` 文件。
4. 检查其中的标题、来源、题面和代码是否与当前页面一致。
5. 使用支持 Notebook 的客户端打开文件，并单独确认文件兼容性和所需语言内核。

现有 Notebook 构建器写入 `nbformat: 5`、`nbformat_minor: 10`，本说明不承诺该格式已通过 Jupyter 或 VS Code 的兼容验证。如果客户端拒绝读取，请保留错误信息和导出文件并提交问题；Markdown 复制可单独使用。相关实现位于 [`packages/utils/src/jupyter.ts`](../../packages/utils/src/jupyter.ts)。

## 开发

以下命令均在仓库根目录执行：

```sh
# 启动 Vite 开发服务，按终端提示安装开发脚本
pnpm --filter nowcoder-toolkit dev

# 检查 Svelte 与 TypeScript
pnpm --filter nowcoder-toolkit check

# 生成可安装脚本
pnpm --filter nowcoder-toolkit build
```

| 路径                                                                     | 职责                                         |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| [`src/main.ts`](./src/main.ts)                                           | 应用事件监听适配并初始化练习页。             |
| [`src/routes/practice`](./src/routes/practice)                           | 按钮挂载、题面转换、复制与 Notebook 导出。   |
| [`src/lib/correct-event-listner.ts`](./src/lib/correct-event-listner.ts) | 页面事件监听适配。                           |
| [`vite.config.ts`](./vite.config.ts)                                     | 用户脚本元数据、匹配范围和外部依赖。         |
| [`../../packages/utils`](../../packages/utils)                           | Markdown、图片、剪贴板与 Notebook 公共工具。 |

当前包没有单独的自动化测试脚本。`check` 与 `build` 成功只能确认静态检查和构建，页面功能仍需浏览器验收。仓库中的 [NowCoder 发布工作流](../../.github/workflows/nowcoder-toolkit-release.yml) 在推送 `nowcoder-v*` tag 后构建本脚本，并将 `dist` 文件附加到当前仓库的 GitHub Release；不会自动发布至 Greasy Fork。

## 故障排查与限制

| 现象                         | 检查方法                                                               |
| ---------------------------- | ---------------------------------------------------------------------- |
| 看不到按钮                   | 检查管理器权限、页面 URL 是否匹配、题面是否加载；刷新页面后重试。      |
| 切换题目后按钮缺失或内容错误 | 当前挂载依赖页面 DOM，未提供完整的站内路由重挂载机制；刷新目标题目页。 |
| 复制后没有内容               | 实际粘贴核对剪贴板，并查看控制台；页面成功通知不应作为唯一验收依据。   |
| 图片较多时导出慢或失败       | 检查图片地址和网络请求；当前图片预取可能因单张图片失败而中止。         |
| Notebook 缺少代码或一直等待  | 确认编辑器及 Download 控件存在，检查页面下载链接是否可访问。           |
| Notebook 无法打开或执行      | 分别检查文件格式兼容性与本地内核；导出文件不会附带执行环境。           |
| 页面点击出现异常             | 暂时停用脚本并刷新，对照检查事件监听适配是否相关。                     |

提交问题时请提供页面 URL、浏览器及管理器版本、脚本版本、复现步骤和控制台错误。请勿附带登录凭证、Cookie 或其他敏感信息。

## 来源与许可证

- 原始项目：[eclipher/Userscripts](https://github.com/eclipher/Userscripts)。感谢原作者的实现与文档基础。
- 当前维护：[liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts)。本项目独立决定后续改动与发布，不依赖原项目同步。
- 代码使用 [MIT 许可证](../../LICENSE)，保留原始版权和许可声明；第三方依赖遵循各自许可证。
