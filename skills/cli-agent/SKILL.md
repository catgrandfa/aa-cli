# CLI Agent Skill

处理任何 `aa-cli` 风格的 CLI 需求时，先遵守下面的顺序，不要直接开写。

## 必读文件

先读：

- `docs/aa-cli-practice.md`
- `docs/command-contract.md`
- `docs/release-and-update.md`

## 工作原则

这是一个 **contract-first** 的 CLI skill。  
任何命令改动都必须先想清楚契约，再写实现。

## 必做清单

1. 先定义或更新命令契约
2. 再补 failing tests
3. 再写最小实现让测试转绿
4. 同步更新 `--help` / `--describe`
5. 同步更新 `examples/contracts`
6. 同步更新错误码目录
7. 命令契约变更时记录 release impact

## 输出要求

每次新增或修改命令，至少产出：

- 一个命令规格文档，参考 `skills/cli-agent/templates/command-spec.md`
- 一个错误码条目，参考 `skills/cli-agent/templates/error-catalog.md`
- 一个发布检查更新，参考 `skills/cli-agent/templates/release-checklist.md`
- 至少一个 `examples/contracts/*.json`

## 探索方式

命令较多时，优先按层探索，不要一次性 dump 全树：

- `aa --describe`
- `aa update check --describe`

## 高风险命令

只要命令是高风险的，必须检查：

- 是否支持 `--yes`
- 是否支持 `--dry-run`
- `risk_tier` 是否正确
- `update apply` 是否在 source runtime 下拒绝执行

## release impact

以下变化都要写 release impact：

- 成功输出结构变化
- 错误码语义变化
- 命令路径变化
- `--describe` schema 变化
- 自更新逻辑变化
