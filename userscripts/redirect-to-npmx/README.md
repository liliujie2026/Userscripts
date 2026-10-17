# 跳转到 npmx

[English](./README-en.md) · [项目首页](../../README.md) · [问题反馈](https://github.com/liliujie2026/Userscripts/issues)

一个只负责页面跳转的浏览器用户脚本：打开 `npmjs.com` 或 `www.npmjs.com` 时，将地址的主机名改为 `npmx.dev`。当前包版本为 **1.0.0**。

本脚本由 [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts) 独立维护，源自 [eclipher/Userscripts](https://github.com/eclipher/Userscripts)。安装、问题反馈与后续发布以当前仓库为准。

## 行为与匹配范围

匹配以下地址：

```text
*://npmjs.com/*
*://www.npmjs.com/*
```

脚本在 `document-start` 阶段尝试停止原页面加载，使用 `URL` 解析当前地址，仅替换 `hostname`，然后调用 `location.replace()` 跳转。协议、端口、路径、查询参数和片段均按原地址保留；当前页面会被替换，不额外增加一条原页面的历史记录。

例如：

```text
https://www.npmjs.com/package/typescript?activeTab=readme#readme
→ https://npmx.dev/package/typescript?activeTab=readme#readme
```

这里展示的是地址转换规则，不表示目标网站支持该地址的全部路径、参数或片段。脚本不会验证目标页面，也没有目标访问失败时的自动回退。它不在其他网站中运行，不预先改写其他页面上的 npm 链接，不改变 npm CLI 的 registry 配置。

## 安装

1. 安装并启用用户脚本管理器，例如 [Tampermonkey](https://www.tampermonkey.net/)。
2. 从源码构建下方的 `.user.js` 文件，将完整内容导入管理器或粘贴到新脚本中保存。
3. 如果本项目的 [GitHub Releases](https://github.com/liliujie2026/Userscripts/releases) 后续提供了对应产物，也可以安装该发布中的完整 `.user.js` 文件。
4. 停用重复的跳转脚本，访问一个 npm 包页面，检查地址是否切换到 `npmx.dev`。

当前仓库没有为本脚本配置自动发布工作流。原作者的 Greasy Fork 条目不是本维护版本的安装或更新入口；本项目独立条目的地址确定后会在本仓库公布。

## 从源码构建与开发

在仓库根目录运行。请先按[根目录开发说明](../../README.md#从源码开始)准备 Node.js 和 pnpm：

```sh
# 安装整个工作区的依赖
pnpm install --frozen-lockfile

# 检查 TypeScript 并构建用户脚本
pnpm --filter redirect-to-npmx build

# 开发时启动 Vite，按终端提示安装开发脚本
pnpm --filter redirect-to-npmx dev
```

生产构建产物为 `userscripts/redirect-to-npmx/dist/redirect-to-npmx.user.js`。当前包的 `build` 命令包含 `tsc && vite build`，没有独立的 `test` 或 `check` 命令。

| 路径                                 | 职责                                 |
| ------------------------------------ | ------------------------------------ |
| [`src/main.ts`](./src/main.ts)       | 停止加载、替换主机名并跳转。         |
| [`vite.config.ts`](./vite.config.ts) | 用户脚本匹配规则、执行时机与元数据。 |
| [`package.json`](./package.json)     | 包版本、依赖与构建命令。             |

`dist` 为构建产物，无需提交到 Git。独立发布使用当前仓库的脚本主页、问题反馈地址与命名空间；请避免同时启用其他来源的旧版跳转脚本。

## 使用与验收

1. 只启用当前脚本，访问 `https://www.npmjs.com/package/typescript`。
2. 确认地址变为 `https://npmx.dev/package/typescript`，并检查目标站点是否正常显示。
3. 使用带查询参数或片段的 npm 地址，核对跳转后的地址保留它们。
4. 在其他网站打开一个包含 npm 链接的页面，确认脚本没有预先改写链接；点击并进入匹配的 npm 地址后才会触发跳转。
5. 如果需要查看原始 npm 网站，停用脚本后重新访问原地址。

构建成功只表示 TypeScript 和打包步骤通过；目标网站是否可访问、路径是否兼容，需要浏览器实际确认。

## 故障排查与限制

| 现象                   | 检查方法                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| 仍停留在 npm 页面      | 检查用户脚本管理器是否启用、权限是否允许、主机名是否属于匹配范围。                          |
| 跳转后是错误页         | 检查 `npmx.dev` 是否可访问，以及目标站点是否支持原 npm 路径；脚本没有路径映射表或回退机制。 |
| 无法访问原 npm 网站    | 暂时停用脚本，再手动打开原地址。                                                            |
| 页面反复跳转或行为冲突 | 停用其他 npm 跳转脚本或相关浏览器扩展后重试。                                               |

## 相关方案

[wolfcreative/npmx-link-router](https://github.com/wolfcreative/npmx-link-router) 是原项目文档引用的另一种方案，侧重在页面中提前改写指向 npm 的链接。本脚本只在进入匹配的 npm 页面后替换地址。两者的触发范围与处理时机不同；本项目不依赖该方案，其当前功能和权限以对方仓库说明为准。

## 来源与许可证

- 原始项目：[eclipher/Userscripts](https://github.com/eclipher/Userscripts)，保留原作者的实现来源声明。
- 当前维护：[liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts)，独立决定后续改动与发布，不依赖原项目同步。
- 使用 [MIT 许可证](../../LICENSE)，保留原始版权和许可声明；第三方依赖遵循各自许可证。
