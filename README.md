# dsh-rename

[![test](https://github.com/lmst2/dsh-rename/actions/workflows/test.yml/badge.svg)](https://github.com/lmst2/dsh-rename/actions/workflows/test.yml)
[![license](https://img.shields.io/github/license/lmst2/dsh-rename.svg)](LICENSE)

DeepSeek Harness 的会话重命名插件：给当前对话补上一条 **`/rename` 斜杠命令**。带上名字直接改；不带名字时，让模型读一遍当前对话，自己总结一个标题并重命名。

## 为什么只做命令，不做自动命名

DSH 本身已经内置了自动命名：基础组合层挂载了 `session-title-first-prompt-llm`，在首条 prompt 进入后由 `ctx.sessionTitle` 自动生成会话标题。这个能力不需要重复实现，本插件只补 DSH 缺的那一块——**你随时一键让它重新想个名字**。

## 安装

**前置要求**：已安装 [DeepSeek Harness](https://github.com/deepseek-ai/DeepSeek-Harness)（`dsh` 命令可用）；Node.js `^22.19` 或 `>=24`；pnpm 11。

从 GitHub 安装：

```sh
dsh plugin --profile web add github:lmst2/dsh-rename
```

`dsh plugin` 会把插件装进 `web` profile，并按包内 `dsh.bundle` 声明把它加入组合层。重启 DSH 服务后，`/rename` 会出现在斜杠命令菜单里。

> **重启生效**：安装完成后，重启正在运行的 DeepSeek Harness Web 服务并刷新页面。

安装完可以用 `dsh plugin --profile web list` 确认插件在列表里。

### 其他安装方式

**本地源码开发**（改完 `pnpm build` 即时生效，host 侧改动需重启服务）：

```sh
git clone https://github.com/lmst2/dsh-rename.git
cd dsh-rename
pnpm install
pnpm build
dsh plugin --profile web add "link:$(pwd)"
```

**指定 GitHub 分支**：

```sh
dsh plugin --profile web add github:lmst2/dsh-rename#main
```

## 使用

直接在当前会话输入：

```text
/rename
```

模型会读取当前会话的对话记录（直接用户消息 + 助手回复），发一次 `purpose: session-title` 的辅助模型请求，生成一个简洁标题并重命名当前会话。

带上名字则直接重命名，不走模型：

```text
/rename 重构会话标题服务
```

两种方式都通过 DSH 内置的 `ctx.sessionTitle.rename` 落盘为 `session/title` 事件（`source: user`），因此：

- 标题会实时反映到侧边栏/会话列表；
- 该标题会被 pin 住，后续内置自动命名不会覆盖它；
- 本插件不写任何自定义 session 事件，卸载插件后历史会话仍能被任意 DSH 构建正常读取。

## 配置

插件行在 `cordis.patch.yml` 中不传配置即使用默认值。需要覆盖时，在 profile 的 `cordis.patch.yml` 里定位 `dsh-rename` 行：

```yaml
- id: dsh-rename
  config:
    targetWords: 6
    targetCjkCharacters: 12
    maxInputBytes: 32768
    maxOutputTokens: 64
    maxTitleBytes: 80
    timeoutMs: 60000
    provider: deepseek-official
    model: deepseek-v4-flash
```

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `targetWords` | `6` | 非 CJK 语言标题的目标单词数 |
| `targetCjkCharacters` | `12` | 中/日/韩标题的目标字符数 |
| `maxInputBytes` | `32768` | 喂给标题模型的对话摘要最大 UTF-8 字节数 |
| `maxOutputTokens` | `64` | 辅助生成的最大输出 token 数 |
| `maxTitleBytes` | `80` | 接受标题的最大 UTF-8 字节数 |
| `timeoutMs` | `60000` | 辅助请求的端到端超时（毫秒） |
| `provider` / `model` | 不填 | 可选显式模型路由；不填则使用会话最近一次 `request/header` 记录的路由 |

`provider` 与 `model` 必须成对出现；缺一个会在启动时直接报错（fail loud）。

## 工作原理

1. `/rename` 由 `@deepseek-ai/dsh-commands` 的斜杠命令注册表分发，不进入模型上下文。
2. 显式名字直接调用 `ctx.sessionTitle.rename`。
3. 无名字时，插件从 `session.events` 收集直接用户消息和助手回复（跳过合成上下文、reasoning 和工具结果），按字节预算保留最新内容，然后通过 `ctx.llm.stream` 发一次 `purpose: session-title` 的辅助请求。
4. 模型输出经 `normalizeSessionTitle` 清理、按 `maxTitleBytes` 截断后，同样走 `ctx.sessionTitle.rename` 提交。
5. 命令注册是 effect：插件 fiber 卸载时 `/rename` 一并消失（运行时替换安全）。

## 开发

```sh
pnpm install     # 安装依赖
pnpm typecheck   # 严格类型检查
pnpm test        # vitest 单元测试
pnpm build       # tsc 输出 lib/types
pnpm verify      # typecheck + test + build + 发布冒烟检查
```

提交前请保证 `pnpm verify` 全绿。

## 文档

| 文档 | 内容 |
| --- | --- |
| [docs/usage.md](docs/usage.md) | 配置、命令语义、错误处理与已知限制 |
| [AGENTS.md](AGENTS.md) | 仓库布局与开发约定 |

## License

[MIT](LICENSE) © dsh-rename contributors
