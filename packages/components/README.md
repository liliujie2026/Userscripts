# 共享界面组件

[项目首页](../../README.md) · 简体中文 | [English](README-en.md)

`@userscripts/components` 为 LeetCode Toolkit 和 NowCoder Toolkit 提供共享的 Svelte 5 按钮组件。它属于本仓库的内部工作区包，随使用它的用户脚本一起编译；无需单独安装，也不作为公共 npm 包发布。

## 组件与入口

| 文件                                               | 职责                                                     |
| -------------------------------------------------- | -------------------------------------------------------- |
| [`src/Button.svelte`](src/Button.svelte)           | 带颜色变体的按钮或链接，可在异步按钮操作期间显示加载图标 |
| [`src/ButtonGroup.svelte`](src/ButtonGroup.svelte) | 使用可换行的 `inline-flex` 布局排列按钮                  |
| [`src/index.ts`](src/index.ts)                     | 导出 `Button` 和 `ButtonGroup`                           |

两个工具箱在各自的 `tsconfig.json` 中把 `$components/*` 映射到本目录的 `src/*`，再由 Vite 加载源码。下面的导入方式依赖这些消费项目的别名配置，不能直接复制到任意独立项目中使用。

```svelte
<script lang="ts">
    import Button from "$components/Button.svelte";
    import ButtonGroup from "$components/ButtonGroup.svelte";

    async function copyExample() {
        try {
            await navigator.clipboard.writeText("Example");
        } catch (error) {
            console.error("Copy failed", error);
            // 在调用方提供错误提示，并让处理函数正常结束。
        }
    }
</script>

<ButtonGroup aria-label="导出操作">
    <Button variant="green" onclick={copyExample}>复制</Button>
    <Button href="https://github.com/liliujie2026/Userscripts">项目主页</Button>
</ButtonGroup>
```

## Button API

| 属性      | 默认值     | 行为                                                |
| --------- | ---------- | --------------------------------------------------- |
| `variant` | `"purple"` | 可选 `"purple"`、`"green"`、`"orange"`              |
| `type`    | `"button"` | 传给按钮元素                                        |
| `href`    | 未设置     | 设置后渲染为链接，默认在新标签页打开                |
| `onclick` | 未设置     | 在按钮模式下调用；返回 Promise 时进入加载状态       |
| `ref`     | `null`     | 通过 `bind:ref` 获取实际按钮或链接元素              |
| 子内容    | 空         | 使用 Svelte 5 的 children snippet 渲染              |
| 其他属性  | —          | 透传到实际元素，例如 `class`、`title`、`aria-label` |

按钮模式与链接模式有不同的事件路径：链接模式不执行组件的 `onclick` 包装逻辑，也不提供异步加载状态。需要执行操作时使用按钮，需要导航时使用 `href`。

异步按钮当前在 Promise **正常完成**后关闭加载状态，尚未用 `finally` 处理被拒绝的 Promise。调用方需要在异步处理函数内部捕获失败并显示适当提示，避免异常导致按钮一直处于加载状态。组件本身不负责复制、下载、通知或重试。

加载图标使用宿主页面的 `animate-spin` CSS 类；缺少该类时图标仍显示，但可能不会旋转。需要独立使用时，应在消费项目中提供相应动画样式。

## ButtonGroup API

`ButtonGroup` 接受子内容和普通 `HTMLDivElement` 属性。它只提供 `inline-flex`、自动换行与间距，不维护选择状态，也不管理子按钮的禁用或加载状态。

## 开发与验证

本包没有独立的 `dev`、`build`、`check` 或 `test` 脚本。在仓库根目录安装依赖后，从实际消费它的工具箱进行验证：

```powershell
pnpm --filter leetcode-toolkit check
pnpm --filter leetcode-toolkit test
pnpm --filter leetcode-toolkit build
pnpm --filter nowcoder-toolkit check
pnpm --filter nowcoder-toolkit build
```

共享组件变更可能影响两个工具箱。类型检查和构建后，还应在浏览器中检查按钮排版、链接打开方式、成功与失败操作后的状态恢复。现有 LeetCode 测试只覆盖其已有测试用例，不能替代全部组件交互验收。

站点路由、正文选择器、题解导出状态和通知策略应保留在 [`userscripts`](../../userscripts) 中，不应加入这两个基础组件。

## 维护与来源

本包随 [liliujie2026/Userscripts](https://github.com/liliujie2026/Userscripts) 独立维护，问题反馈和改动请提交到[本项目 Issues](https://github.com/liliujie2026/Userscripts/issues)。

项目源自 [eclipher/Userscripts](https://github.com/eclipher/Userscripts)，保留原作者版权与 [MIT 许可证](../../LICENSE)。按钮外观参考 [Uiverse 的 blue-dodo-17](https://uiverse.io/krlozCJ/blue-dodo-17)，源码中保留了设计来源注释。
