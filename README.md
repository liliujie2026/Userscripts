# Userscripts

**简体中文** | [English](./README-en.md)

用于算法练习与开发工具网站的浏览器用户脚本集合：导出 LeetCode 题目与题解、牛客题目，增强代码编辑体验，以及将 npm 网站跳转到 npmx。

本项目由 [liliujie2026](https://github.com/liliujie2026) 独立维护。开发、问题反馈和版本发布均以 [本仓库](https://github.com/liliujie2026/Userscripts) 为准；原始项目的来源与版权说明见文末。

[查看发行版](https://github.com/liliujie2026/Userscripts/releases) · [反馈问题](https://github.com/liliujie2026/Userscripts/issues) · [MIT 许可证](./LICENSE)

## 脚本一览

| 脚本             | 适用页面                                                  | 主要功能                                                                     | 使用与开发说明                                                                                            |
| ---------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| LeetCode Toolkit | `leetcode.cn`、`leetcode.com` 的题目 / 题解，美站探索卡片 | 题目复制与 Notebook 导出、官方和社区题解 Markdown 导出、编辑器增强、难度评分 | [中文](./userscripts/leetcode-toolkit/README.md) / [English](./userscripts/leetcode-toolkit/README-en.md) |
| NowCoder Toolkit | `www.nowcoder.com/practice/*`                             | 题面 Markdown 复制、公式转换、题面和当前代码导出为 Notebook                  | [中文](./userscripts/nowcoder-toolkit/README.md) / [English](./userscripts/nowcoder-toolkit/README-en.md) |
| Redirect to npmx | `npmjs.com`、`www.npmjs.com`                              | 保留路径和查询参数，将当前页面跳转到 `npmx.dev`                              | [中文](./userscripts/redirect-to-npmx/README.md) / [English](./userscripts/redirect-to-npmx/README-en.md) |

各脚本单独安装和启用。具体匹配范围、站点差异与已知限制见对应文档。

## 安装与使用

1. 安装浏览器用户脚本管理器，例如 [Tampermonkey](https://www.tampermonkey.net/)，并允许其在目标网站运行用户脚本。
2. 在 [本项目 Releases](https://github.com/liliujie2026/Userscripts/releases) 中选择对应脚本的版本，下载 Assets 中的 `.user.js` 文件。若尚无对应发行文件，使用下面的源码构建方法。
3. 通过管理器导入 `.user.js`，或新建脚本并粘贴文件的完整内容后保存。更新已有脚本时，确认脚本身份和版本；从原版迁移到本项目时，停用重复运行的旧版本。
4. 刷新目标网站，按脚本文档检查功能是否生效。

安装的是构建后的完整 `.user.js`，不是 `src/main.ts` 或单个 Svelte 组件。本仓库文档中的发行版与后续安装入口代表本项目；原始项目的安装条目仅作为历史来源，不保证包含这里的改进。

## 从源码开始

### 环境要求

- Git。
- Node.js 22.12+（22 系列）或 24 系列；发布工作流使用 Node.js 22。
- pnpm 10。
- 测试浏览器及用户脚本管理器。

如果环境已提供 Corepack，可以用 `corepack pnpm@10.34.7` 替代下文的 `pnpm`，无需依赖全局安装的 pnpm 版本。

### 获取源码并安装依赖

```sh
git clone https://github.com/liliujie2026/Userscripts.git
cd Userscripts
pnpm install --frozen-lockfile
```

依赖安装在仓库根目录执行，由 [pnpm workspace](./pnpm-workspace.yaml) 关联业务脚本与共享包。已有源码副本可直接进入仓库根目录；使用 Git worktree 时，根目录是包含 `pnpm-workspace.yaml` 的工作目录。

### 开发与构建

以 LeetCode Toolkit 为例：

```sh
pnpm --filter leetcode-toolkit dev
pnpm --filter leetcode-toolkit build
```

开发服务器启动后，按 Vite / vite-plugin-monkey 的终端提示在用户脚本管理器中安装开发脚本，再打开目标网站调试。生产构建完成后，从对应脚本的 `dist/` 目录安装正式 `.user.js`。

其他脚本使用相同的过滤方式：

```sh
pnpm --filter nowcoder-toolkit dev
pnpm --filter nowcoder-toolkit build
pnpm --filter redirect-to-npmx dev
pnpm --filter redirect-to-npmx build
```

也可以进入具体脚本目录运行 `pnpm dev` 或 `pnpm build`。`dev` 启动开发服务器，`build` 生成发行文件，两者用途不同。

## 仓库结构

```text
Userscripts/
├── userscripts/
│   ├── leetcode-toolkit/     # LeetCode 页面增强与内容导出
│   ├── nowcoder-toolkit/     # 牛客练习题导出
│   └── redirect-to-npmx/    # npm 网站跳转
├── packages/
│   ├── components/          # 共享 Svelte 按钮组件
│   └── utils/               # DOM、Markdown、图片、下载与 Notebook 工具
├── .github/workflows/       # 按脚本 tag 发布 GitHub Release
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
└── LICENSE
```

这是一个 pnpm monorepo。业务脚本使用 TypeScript、Vite 和 vite-plugin-monkey 构建；LeetCode 与牛客界面使用 Svelte 5。共享包以 workspace 源码形式消费，不是需要另外安装的浏览器脚本，也不作为公共 npm 包发布。

- [共享组件说明](./packages/components/README.md)
- [共享工具说明](./packages/utils/README.md)

所有目录统一使用 `README.md` 作为中文文档，`README-en.md` 作为对应英文文档。

## 验证与质量检查

在仓库根目录执行：

```sh
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit lint
pnpm --filter leetcode-toolkit build
```

LeetCode Toolkit 的自动化测试覆盖内容来源、富文本与 DOM 转换、复制 / 下载协调和工具栏生命周期。默认测试不请求真实网站；公开接口集成测试需要显式开启，见 [LeetCode 开发说明](./userscripts/leetcode-toolkit/README.md#开发与验证)。

牛客提供 `pnpm --filter nowcoder-toolkit check`；npm 跳转脚本在 `build` 中执行 TypeScript 检查。它们目前没有与 LeetCode Toolkit 等量的专用回归测试。

构建、类型检查或模拟 DOM 测试不能代替真实浏览器验收。发布前应安装生产产物，检查目标页面、复制 / 下载结果、页面切换，以及失败后能否恢复操作。

## 发布与版本维护

每个脚本的版本来自其 `package.json`。当前自动发布入口为：

| 脚本             | Git tag 格式            | 发布流程                                                                      |
| ---------------- | ----------------------- | ----------------------------------------------------------------------------- |
| LeetCode Toolkit | `leetcode-v<版本号>`    | [LeetCode Release workflow](./.github/workflows/leetcode-toolkit-release.yml) |
| NowCoder Toolkit | `nowcoder-v<版本号>`    | [NowCoder Release workflow](./.github/workflows/nowcoder-toolkit-release.yml) |
| Redirect to npmx | 尚无专用 tag 发布工作流 | 本地构建；维护者按需发布产物                                                  |

维护者的发布顺序：更新脚本版本与说明 → 完成检查和浏览器验收 → 提交到本仓库 → 推送对应版本 tag → 检查 Actions 与 Release 产物。tag 版本应与包版本一致。

`node_modules/` 和 `dist/` 不纳入源码提交。现有工作流只构建并发布 GitHub Release，不自动更新 Greasy Fork；发布到 Greasy Fork 时，使用同一版本的完整 `.user.js`，并在本项目文档维护安装地址。

## 参与贡献与问题反馈

欢迎向 [本仓库 Issues](https://github.com/liliujie2026/Userscripts/issues) 报告问题，或提交以本仓库 `main` 为目标的 Pull Request。

报告问题时，请提供脚本版本、浏览器与管理器版本、页面地址、复现步骤、预期与实际结果；内容导出问题请指出缺失的段落、代码或公式，并附相关控制台错误。

提交改动前，请运行与修改范围对应的检查，保留其他脚本的功能，并同步更新中文和英文文档。新增脚本应放在 `userscripts/`，可复用的通用能力放在 `packages/`；站点专用的 DOM 和内容适配留在业务脚本内。

## 依赖与第三方数据

独立维护意味着本仓库自行决定功能、版本和发布，不需要通过原始项目获取更新。本项目仍使用 Vite、Svelte、Turndown 等第三方库；部分脚本的构建产物通过 jsDelivr `@require` 加载库。

LeetCode 的难度评分和截图查找还使用以下独立数据项目：

- [LeetCode Problem Rating](https://github.com/zerotrac/leetcode_problem_rating)
- [LeetCode Screenshotter](https://github.com/akhilkammila/leetcode-screenshotter)

这些数据与 CDN 的网络可达性、内容更新和目标网站结构变化会影响相关功能，具体边界见各脚本文档。

## 原始来源与许可证

本仓库最初源自 [eclipher/Userscripts](https://github.com/eclipher/Userscripts)，现由 liliujie2026 独立维护。保留原作者 eclipher 的贡献、版权声明和项目来源；原项目链接用于说明历史与致谢，本项目的问题反馈和发布在当前仓库进行。

本项目沿用 [MIT 许可证](./LICENSE)。分发源码或构建产物时，请保留适用的版权与许可证说明；第三方库和数据项目遵循各自的许可证及使用条件。
