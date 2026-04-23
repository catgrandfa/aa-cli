# Command Contract

`aa-cli` 的命令契约是模板真正稳定的部分。无论后续 CLI 用 Node.js、Bun、Go 还是 Rust，这份契约都应该尽量保持不变。

## 命令组织

按资源域组织命令：

- `aa list users`
- `aa doctor`
- `aa version`
- `aa update check`
- `aa update apply`

探索顺序：

- `aa --describe`
- `aa update check --describe`

## 全局 flags

默认共享 flags：

- `--json`
- `--yaml`
- `--yes`
- `--dry-run`
- `--fields`
- `--limit`
- `--json-input`
- `--describe`
- `--help`

`Node.js` 零依赖模板在第一版里保证：

- `--json`
- `--yes`
- `--dry-run`
- `--fields`
- `--limit`
- `--json-input`
- `--describe`
- `--help`

`--yaml` 作为扩展点保留，不是首版默认实现。

## 成功输出

成功结果只走 `stdout`。

列表示例：

```json
[
  { "name": "Alice", "email": "alice@co.com", "role": "admin" },
  { "name": "Bob", "email": "bob@co.com", "role": "member" }
]
```

对象示例：

```json
{
  "name": "aa",
  "version": "0.1.0",
  "runtime": "source",
  "platform": "darwin-arm64"
}
```

dry-run 示例：

```json
{
  "actions": [
    {
      "type": "replace_binary",
      "platform": "darwin-arm64",
      "current_version": "0.1.0",
      "target_version": "0.2.0"
    }
  ],
  "risk_tier": "high",
  "requires_approval": true
}
```

## 错误输出

错误只走 `stderr`。

```json
{
  "error": {
    "code": "unsupported_runtime_mode",
    "message": "update apply only works from a packaged binary runtime",
    "retryable": false,
    "suggestion": "Build or install a packaged binary before running aa update apply"
  }
}
```

退出码：

- `0` success
- `1` permanent error
- `2` transient error
- `130` cancelled

## 风险等级

- `low`: 读操作、describe、doctor
- `medium`: 非破坏性但影响运行状态的操作
- `high`: 资源删除、发布、替换二进制、自更新 apply

高风险命令要求：

- `--describe` 暴露 `risk_tier`
- 非交互模式没有 `--yes` 时拒绝执行
- 必须支持 `--dry-run`

## `--describe` schema

```json
{
  "command": "aa",
  "summary": "Agent-friendly CLI starter template",
  "risk_tier": "low",
  "supports_dry_run": false,
  "options": [],
  "subcommands": [
    {
      "command": "aa update check",
      "summary": "Check the configured release manifest for a newer packaged binary",
      "risk_tier": "low",
      "supports_dry_run": false,
      "options": [],
      "subcommands": []
    }
  ]
}
```

要求：

- 字段顺序稳定
- 字段命名稳定
- 新增字段尽量是向后兼容的可选字段

## 输入模型

优先级：

1. `--json-input`
2. 扁平 flags
3. positionals

建议：

- 对象输入用浅合并
- `--json-input=-` 从 stdin 读
- 所有外部输入都做校验

## 合同快照

命令输出变更时，同步更新：

- `examples/contracts/users-list.json`
- `examples/contracts/deploy-dry-run.json`
- `examples/contracts/error-image-not-found.json`
- `examples/contracts/update-check.json`
