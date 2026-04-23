# aa-cli

`aa-cli` 是一个面向人类和 Agent 的 CLI starter 仓库。它把一套可复用的 CLI 约束、Node.js 模板、skill 模板、样例合同，以及发布/更新约定放在一起，方便你从零开始做一个“机器可解析、人也能用”的 CLI。

`aa-cli` is a starter repository for building CLIs that work well for both humans and agents. It packages reusable command contracts, a Node.js template, a companion skill template, example output contracts, and release/update conventions in one place.

## 用途 / What This Repository Is For

如果你想做下面这些事情，这个仓库就是给你的：

- 做一个新的内部 CLI，并且希望 Agent 能稳定调用
- 统一 `--json`、`--describe`、`--dry-run`、结构化错误这些约束
- 从一个现成模板开始，而不是每次重新搭 CLI 骨架
- 给未来维护这个 CLI 的 Agent 一套固定 skill 和交付规范
- 规划 Bun 二进制分发和 CLI 自更新，而不是后补

Use this repository when you want to:

- start a new internal CLI that agents can call reliably
- standardize `--json`, `--describe`, `--dry-run`, and structured errors
- begin from a working starter instead of rebuilding the same CLI foundation
- give future agents a stable skill and delivery checklist for CLI work
- plan binary distribution and self-update behavior from the beginning

## 仓库里有什么 / What’s In This Repo

- [`docs/aa-cli-practice.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/aa-cli-practice.md)  
  CLI 实践说明，包含规则、Bad/Good 对比、Node.js 示例代码。
- [`docs/command-contract.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/command-contract.md)  
  命令契约定义，包括输出格式、错误结构、风险等级和 `--describe` schema。
- [`docs/release-and-update.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/release-and-update.md)  
  Bun 打包、多平台分发、manifest 和自更新约定。
- [`templates/node-cli`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli)  
  零依赖 Node.js CLI starter，已经包含测试、命令路由、结构化输出和 update 骨架。
- [`skills/cli-agent/SKILL.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/skills/cli-agent/SKILL.md)  
  给 Agent 用的 CLI skill，要求 contract-first、同步样例和 release impact。
- [`examples/contracts`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/examples/contracts)  
  成功输出、dry-run、错误输出的结构化样例。

## 快速开始 / Quick Start

### 1. 先看文档 / Read the docs first

建议按这个顺序：

1. [`docs/aa-cli-practice.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/aa-cli-practice.md)
2. [`docs/command-contract.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/command-contract.md)
3. [`docs/release-and-update.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/release-and-update.md)

Recommended reading order:

1. `docs/aa-cli-practice.md`
2. `docs/command-contract.md`
3. `docs/release-and-update.md`

### 2. 运行模板测试 / Run the starter tests

```bash
cd templates/node-cli
node --test tests/*.test.js
```

这会验证模板当前的核心行为：

- `--json`
- `--json-input`
- `--fields` / `--limit`
- `--describe`
- `update check`
- `update apply --dry-run`
- source runtime 下拒绝执行 `update apply`

This validates the starter’s core behaviors:

- `--json`
- `--json-input`
- `--fields` / `--limit`
- `--describe`
- `update check`
- `update apply --dry-run`
- refusing `update apply` in source runtime mode

### 3. 试几个命令 / Try a few commands

```bash
cd templates/node-cli

node bin/aa.js --describe
node bin/aa.js list users --json
node bin/aa.js list users --json --fields=name --limit=1
node bin/aa.js version --json
```

如果想测试 update 流程，可以先准备一个 manifest 文件，然后运行：

```bash
AA_UPDATE_MANIFEST_FILE=/path/to/manifest.json node bin/aa.js update check --json
AA_UPDATE_MANIFEST_FILE=/path/to/manifest.json node bin/aa.js update apply --dry-run --json
```

To try the update flow, point the CLI at a manifest file and run:

```bash
AA_UPDATE_MANIFEST_FILE=/path/to/manifest.json node bin/aa.js update check --json
AA_UPDATE_MANIFEST_FILE=/path/to/manifest.json node bin/aa.js update apply --dry-run --json
```

## 怎么用这套 Starter / How To Use This Starter

最直接的方式：

1. 复制 [`templates/node-cli`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/templates/node-cli)
2. 按 [`docs/command-contract.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/command-contract.md) 扩展命令
3. 保持 `examples/contracts` 和测试一起更新
4. 让 Agent 按 [`skills/cli-agent/SKILL.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/skills/cli-agent/SKILL.md) 工作
5. 发布前按 [`docs/release-and-update.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/release-and-update.md) 准备 Bun 构建和 manifest

The simplest workflow:

1. copy `templates/node-cli`
2. extend commands following `docs/command-contract.md`
3. keep tests and `examples/contracts` updated together
4. have agents follow `skills/cli-agent/SKILL.md`
5. prepare Bun builds and a manifest before release

## 这套 Starter 默认约束 / Default Expectations

这个仓库默认你做的是“Agent-friendly CLI”，所以这些约束是默认项：

- 所有命令支持 `--json`
- 非 TTY 默认输出 JSON
- 高风险命令支持 `--yes`
- 高风险命令支持 `--dry-run`
- 错误必须结构化
- 支持 `--describe`
- 支持 `--json-input`
- 命令按资源域组织

This starter assumes you are building an agent-friendly CLI, so these expectations are built in:

- every command supports `--json`
- non-TTY output defaults to JSON
- high-risk commands support `--yes`
- high-risk commands support `--dry-run`
- errors are structured
- `--describe` is available
- `--json-input` is supported
- commands are organized by domain

## 仓库结构 / Repository Layout

```text
aa-cli/
├─ README.md
├─ docs/
├─ examples/contracts/
├─ skills/cli-agent/
└─ templates/node-cli/
```

重点入口：

- `docs/` 看规则
- `templates/node-cli/` 看实现
- `skills/cli-agent/` 看 Agent 该怎么配合
- `examples/contracts/` 看稳定输出长什么样

Key entry points:

- `docs/` for the rules
- `templates/node-cli/` for the implementation starter
- `skills/cli-agent/` for agent workflow
- `examples/contracts/` for stable output examples

## 下一步读什么 / Where To Go Next

- 想看规则细节：[`docs/aa-cli-practice.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/aa-cli-practice.md)
- 想看命令契约：[`docs/command-contract.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/command-contract.md)
- 想看发布和更新：[`docs/release-and-update.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/docs/release-and-update.md)
- 想让 Agent 接手：[`skills/cli-agent/SKILL.md`](/Users/zhouyishujia/Documents/Code/Study/aa-cli/skills/cli-agent/SKILL.md)

- For the rules: `docs/aa-cli-practice.md`
- For the command contract: `docs/command-contract.md`
- For release/update: `docs/release-and-update.md`
- For agent workflow: `skills/cli-agent/SKILL.md`
