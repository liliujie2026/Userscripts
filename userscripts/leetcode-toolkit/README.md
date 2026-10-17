# LeetCode 工具箱

**简体中文** | [English](README-en.md) · [项目首页](../../README.md)

为[力扣中国站](https://leetcode.cn)和 [LeetCode 美国站](https://leetcode.com)提供题目整理、题解 Markdown 导出和代码编辑器增强的浏览器用户脚本，基于 TypeScript、Svelte 和 Vite 构建。

本项目由 [liliujie2026](https://github.com/liliujie2026)独立维护，代码源自 [eclipher/Userscripts](https://github.com/eclipher/Userscripts)，保留原作者署名和 MIT 许可证。更新、发布和问题跟踪以 [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts)为准。

## 功能与站点支持

| 功能                              | 中国站 | 美国站 | 说明                                                       |
| --------------------------------- | ------ | ------ | ---------------------------------------------------------- |
| 复制题目标题、题面 Markdown       | 支持   | 支持   | 在题目描述区域使用新增按钮                                 |
| 题目导出 Jupyter Notebook         | 支持   | 支持   | 包含标题、题面和当前编辑器代码                             |
| 官方题解复制 / 下载 Markdown      | 支持   | 支持   | 打开可访问的完整题解后，使用右下角工具栏                   |
| 社区题解复制 / 下载 Markdown      | 支持   | 支持   | 支持详情页；列表页隐藏工具栏                               |
| 题解站内切换、浏览器前进后退      | 支持   | 支持   | 工具栏随文章地址更新，避免导出旧文章                       |
| 难度评分                          | 支持   | 支持   | 有评分记录时显示；动态更新依赖管理器的 `urlchange` API     |
| `Ctrl + S` 格式化、补全与悬浮提示 | 支持   | 支持   | 调整页面提供的 Monaco 选项；效果取决于网站编辑器和语言服务 |
| 探索卡片文章导出                  | —      | 支持   | 下载当前文章中可读取的内容                                 |
| 查找官方题解截图、打开外部阅读器  | —      | 保留   | 官方题解工具栏的 `More` 中提供，依赖外部项目               |

“支持”表示代码实现的适配范围，不代表每个页面、账号权限和浏览器组合都已完成实站验证。网站改版可能影响页面元素识别。当前题解导出采用统一工具栏；文末截图中的旧版按钮布局仅作功能参考。

## 安装

需要浏览器用户脚本管理器，推荐使用 [Tampermonkey](https://www.tampermonkey.net/)。其他管理器的剪贴板接口和页面切换事件可能存在兼容性差异。

### 安装发布版本

1. 为浏览器安装并启用用户脚本管理器，按管理器提示开启用户脚本运行权限。
2. 打开[本仓库 Releases](https://github.com/liliujie2026/Userscripts/releases)，选择包含 `leetcode-toolkit.user.js` 的版本。LeetCode 发布 tag 使用 `leetcode-v*` 命名。
3. 下载 Assets 中的 `leetcode-toolkit.user.js`，在管理器中导入；也可以新建脚本，粘贴该文件的完整内容并保存。若尚无发布产物，使用下面的本地构建方式。
4. 停用重复的 LeetCode 工具箱脚本，刷新已经打开的力扣页面。

本项目独立维护版的 Greasy Fork 地址尚未在仓库中确认。原版 Greasy Fork 条目属于原项目，不能用来安装本仓库的修改版。安装时请核对脚本主页指向 `liliujie2026/Userscripts`。

### 从源码构建

在仓库根目录使用 Node.js 22.12+（22 系列）或 24 系列，以及 pnpm 10：

```sh
pnpm install --frozen-lockfile
pnpm --filter leetcode-toolkit build
```

安装生成的 `userscripts/leetcode-toolkit/dist/leetcode-toolkit.user.js`。该文件由构建生成，`dist` 不纳入 Git 跟踪。工作区环境和整体开发流程见[根目录 README](../../README.md)。

## 使用

### 题目与编辑器

打开题目描述页，使用新增按钮复制标题、复制题面 Markdown，或导出 `.ipynb`。Notebook 包含题目内容和当前 Monaco 编辑器中的代码；代码来源是页面编辑器，不会自动执行。

Notebook 可交给支持 `.ipynb` 的客户端读取，例如 [VS Code 的 Jupyter 功能](https://code.visualstudio.com/docs/datascience/jupyter-notebooks)。执行代码需要另外配置对应语言的运行环境与内核。不同客户端对生成文件的读取兼容性需要实际验证，题解导出测试不覆盖这一能力。

难度评分来源于 [LeetCode Problem Rating](https://github.com/zerotrac/leetcode_problem_rating)。没有评分记录的题目不会显示评分。若管理器不支持 `urlchange`，站内切题后可刷新页面以更新评分。

### 官方与社区题解

1. 打开一篇你有权限阅读的完整官方或社区题解，等待正文加载完成。
2. 使用右下角的**复制 Markdown** 或**下载 Markdown**。导出文档包含文章标题、`Source` 来源链接及正文。
3. 复制后粘贴到文本编辑器检查内容；下载后打开实际生成的 `.md` 文件。处理中按钮暂时禁用，结束或失败后恢复。
4. 站内打开另一篇题解，或使用浏览器前进 / 后退后，重新导出即可。工具栏在题解列表页隐藏。

中国站支持旧 `/solution/文章/` 和现行 `/solutions/编号/文章/` 地址。中国站官方文章可能使用普通题解详情地址，因此工具栏显示“当前题解”不影响文章导出。导出期间若地址变化，本次输出会取消，请在新文章加载后重试。

美国站官方题解的 `More` 保留两个辅助入口：`Find Screenshot` 查询外部截图索引，`Read Saved Editorial` 打开配置中的[外部阅读器](https://leetcode-editorial-reader.vercel.app)。它们不属于本仓库托管的内容服务，能否访问和是否有对应内容由外部项目决定。

## 导出原理与边界

导出优先读取与当前文章匹配的页面数据。中国站在需要时通过当前站点的只读 GraphQL 查询取得原始 Markdown 或新版 Slate 富文本；美国站官方题解也会尝试原文查询，美国站社区题解使用页面数据或正文。原文不可用时，回退到当前可见文章的 DOM 转换。

- **结构与代码**：转换规则覆盖标题、段落、列表、表格、代码围栏、公式和折叠区块。Slate 源数据可包含未激活的语言代码页签；DOM 回退只能处理页面已经加载且可读取的内容。
- **图片**：保留图片引用，不为题解导出批量下载图片。DOM 转换会将可解析的链接补全为绝对地址；原始 Markdown 保留原文写法，不能保证所有图片地址都已规范化。链接图片通常需要联网查看。
- **公式**：尝试保留原始 TeX。预览效果取决于 Markdown 阅读器是否支持数学公式和相关 HTML。
- **嵌入内容**：DOM 回退读取已加载且同源可访问的 iframe 代码；跨域 iframe 和可识别的视频地址保留为链接。不会下载视频，也不会自动切换语言页签或逐张点击幻灯片。
- **访问条件**：登录、文章权限、站点验证、接口变更或正文未加载可能影响读取；脚本使用当前页面能访问的内容。
- **剪贴板**：优先使用管理器的 `GM_setClipboard`，再回退到浏览器 Clipboard API。失败时可重试或选择文件下载。

题解接口请求发送到当前 LeetCode 站点，不向外部服务上传题解正文。整个工具箱仍会使用第三方依赖 CDN、难度评分和截图索引，以及题目导出中的图片请求；独立维护并不意味着所有运行资源都已离线打包。

## 源码结构

```text
leetcode-toolkit/
├── src/
│   ├── main.ts                    # 按页面类型初始化
│   ├── lib/
│   │   ├── solution-source.ts     # 路由、页面数据、同源查询、正文定位
│   │   ├── solution-slate.ts      # 新版富文本序列化
│   │   ├── solution-markdown.ts   # DOM 到 Markdown
│   │   ├── solution-export.ts     # 文档组装、剪贴板、文件下载
│   │   ├── solution-toolbar.ts    # 工具栏生命周期与页面切换
│   │   ├── SolutionExport.svelte  # 导出按钮、进度、错误提示
│   │   └── editorial-saver.ts     # 探索文章导出适配
│   └── routes/
│       ├── problems/             # 题面、评分、编辑器和官方题解辅助功能
│       └── explore/              # 美国站探索卡片
├── tests/                        # 来源、转换、交互及可选实站检查
├── assets/                       # 原版功能截图
├── vite.config.ts                # 打包与用户脚本元数据
└── package.json
```

部分转换测试位于 `src/lib/*.test.ts`。公共按钮和浏览器工具位于仓库的 [`packages/components`](../../packages/components)与 [`packages/utils`](../../packages/utils)。

## 开发与验证

在仓库根目录安装依赖后运行：

```sh
pnpm --filter leetcode-toolkit dev
```

按终端提示将开发脚本接入用户脚本管理器。提交前可执行：

```sh
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit lint
pnpm --filter leetcode-toolkit build
git diff --check
```

普通测试默认离线，覆盖文章来源识别、Slate / DOM 转换、工具栏切换、剪贴板完成及失败恢复。可选实站测试访问少量公开中国站文章，默认跳过；在 PowerShell 中显式启用：

```powershell
$env:LEETCODE_LIVE = '1'
try {
    pnpm --filter leetcode-toolkit test
} finally {
    Remove-Item Env:LEETCODE_LIVE
}
```

实站测试依赖网络、公开文章和接口状态，通过仅说明该次测试覆盖的文章链路正常。它不等同于 Tampermonkey 中实际点击，也不能证明美站、所有题解格式或所有账号状态均可用。

更新脚本后，浏览器验收至少覆盖：

- 官方与社区题解分别复制和下载，核对标题、来源、正文末尾、代码、公式与表格。
- 连续切换文章并前进 / 后退，确认不串文章、工具栏不重复、列表页隐藏。
- 复制失败后按钮恢复，下载文件内容可读取。
- 若本次修改涉及题面、编辑器、Notebook 或探索卡片，分别验收相应功能。

## 故障排查

| 现象                           | 检查与处理                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 工具栏没有出现                 | 确认脚本已启用且有运行权限；刷新页面；打开正文而非列表或发布页；停用重复脚本                                   |
| 复制失败或长时间无内容         | 等待正文加载，检查登录和站点验证；尝试下载；查看 Console 中的 `[LeetCode Toolkit] Solution export failed` 错误 |
| 标题或正文属于上一篇文章       | 等当前文章加载后重试；记录导航步骤、页面 URL 和导出结果，提交 Issue                                            |
| 公式存在但预览不显示           | 检查 Markdown 源码中的 TeX，确认阅读器支持数学渲染                                                             |
| 图片离线不可见                 | 输出主要保留在线引用；联网核对原文链接是否仍可访问                                                             |
| 某些语言代码、视频或幻灯片缺失 | 检查是否走了 DOM 回退，以及内容是否已加载且可读取；参见导出边界                                                |
| 题目评分未更新                 | 检查管理器的 `urlchange` 支持；尝试刷新；题目也可能没有评分记录                                                |

## 截图

以下五张截图继承自原项目，保留用于说明既有功能。**它们展示的是旧版界面，不能作为当前题解工具栏位置与样式的依据。** 当前题解操作见上面的使用说明。

| 题目整理                                                       | 官方题解辅助功能（旧布局）                           |
| -------------------------------------------------------------- | ---------------------------------------------------- |
| ![复制题目标题、题面与 Notebook 导出](assets/screenshot-1.png) | ![官方题解辅助按钮旧版布局](assets/screenshot-2.png) |

| Notebook 使用示例                                                | 编辑器提示                                              |
| ---------------------------------------------------------------- | ------------------------------------------------------- |
| ![在 VS Code 中查看题目和编辑 Notebook](assets/screenshot-3.png) | ![Monaco 编辑器补全与悬浮提示](assets/screenshot-4.png) |

![探索卡片文章导出按钮](assets/screenshot-5.png)

## 贡献、来源与许可

问题和改进建议请提交到[本仓库 Issues](https://github.com/liliujie2026/Userscripts/issues)；提交 PR 前请阅读[根目录贡献说明](../../README.md#参与贡献与问题反馈)。反馈导出问题时，请包含站点、可复现页面 URL、脚本和管理器版本、操作步骤，以及预期 / 实际内容差异。不要附带 Cookie、令牌或私密文章正文。

本项目基于 [eclipher/Userscripts](https://github.com/eclipher/Userscripts)独立发展，保留原作者贡献；当前维护不依赖上游更新或上游发布。原版还参考了以下项目，继续在此致谢：

- [Leetcode Screenshotter](https://github.com/akhilkammila/leetcode-screenshotter)：官方题解截图索引。
- [LeetCode Problem Rating](https://github.com/zerotrac/leetcode_problem_rating)：题目评分数据。
- [LeetCode Problem to Markdown](https://greasyfork.org/en/scripts/448601)。
- [leetcode enhanced code editor](https://greasyfork.org/en/scripts/502740-leetcode-enhanced-code-editor)。
- [Leetcode: format on save](https://greasyfork.org/en/scripts/481927-leetcode-format-on-save)。
- [leetcode-difficulty-rating-extension](https://github.com/boenshao/leetcode-difficulty-rating-extension)。

项目代码采用 [MIT 许可证](../../LICENSE)，分发时请保留原有版权及许可声明。LeetCode 题面、题解、图片和第三方数据的权利归各自权利人；仓库代码的 MIT 许可不改变这些内容的许可条件。本项目是社区维护的浏览器用户脚本，与 LeetCode 官方无隶属关系。
