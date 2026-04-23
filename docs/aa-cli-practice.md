# aa-cli 实践

`aa-cli` 是一套给“人类 + Agent”一起使用的 CLI 实践。核心原则只有一句话：

> CLI 不是脚本集合，而是一个稳定接口。

默认要求：

- 所有命令必须支持 `--json`
- `stdout` 只输出结果，`stderr` 只输出错误
- 非 TTY 环境默认走 JSON
- 危险命令必须支持 `--dry-run`
- 结构化错误必须稳定可解析
- 命令较多时按资源域分组，不按动作平铺

`YAML` 可以作为可选增强，但不是默认机器协议。对 Agent 来说，JSON 的稳定性优先级高于 token 节省。

## Rule 1: 所有命令必须支持 `--json`

Bad:

```bash
$ aa list users
NAME   EMAIL          ROLE
Alice  alice@co.com   admin
Bob    bob@co.com     member
```

Good:

```bash
$ aa list users --json
[
  { "name": "Alice", "email": "alice@co.com", "role": "admin" },
  { "name": "Bob", "email": "bob@co.com", "role": "member" }
]
```

Node.js:

```js
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    json: { type: "boolean", default: false },
  },
});

const useJson = values.json || !process.stdout.isTTY;

export function output(data) {
  const text = JSON.stringify(data, null, 2);
  process.stdout.write(`${text}\n`);
}
```

## Rule 2: 禁止交互式提示，提供 `--yes`

Bad:

```bash
$ aa update apply
Are you sure? (y/n): _
```

Good:

```bash
$ aa update apply --yes --json
{ "updated": true }
```

Node.js:

```js
export function assertConfirmed({ yes, stdinIsTTY, riskTier }) {
  if (riskTier !== "high") return;

  if (!stdinIsTTY && !yes) {
    throw new Error("--yes required in non-interactive mode");
  }
}
```

## Rule 3: 危险命令支持 `--dry-run`

Bad:

```bash
$ aa update apply --dry-run
Would update the CLI to the latest version.
```

Good:

```bash
$ aa update apply --dry-run --json
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

Node.js:

```js
export function buildUpdatePlan({ currentVersion, manifest, platform }) {
  return {
    actions: [
      {
        type: "replace_binary",
        platform,
        current_version: currentVersion,
        target_version: manifest.version,
      },
    ],
    risk_tier: "high",
    requires_approval: true,
  };
}
```

## Rule 4: 控制输出大小，支持 `--fields` 和 `--limit`

Bad:

```bash
$ aa list users --json
[
  {
    "name": "Alice",
    "email": "alice@co.com",
    "role": "admin",
    "history": ["... very large payload ..."]
  }
]
```

Good:

```bash
$ aa list users --json --fields=name,role --limit=1
[
  { "name": "Alice", "role": "admin" }
]
```

Node.js:

```js
function pickFields(item, fields) {
  if (!fields.length) return item;
  return Object.fromEntries(fields.filter((key) => key in item).map((key) => [key, item[key]]));
}

export function createOutput({ fields, limit }) {
  const keys = fields ? fields.split(",").filter(Boolean) : [];
  const cap = Number.parseInt(limit ?? "100", 10);

  return {
    serialize(data) {
      const normalized = Array.isArray(data)
        ? data.slice(0, cap).map((item) => pickFields(item, keys))
        : pickFields(data, keys);
      return `${JSON.stringify(normalized, null, 2)}\n`;
    },
  };
}
```

## Rule 5: 错误必须结构化

Bad:

```bash
$ aa update check
Error: request failed
```

Good:

```bash
$ aa update check --json
{
  "error": {
    "code": "manifest_fetch_failed",
    "message": "Failed to fetch update manifest: HTTP 503",
    "retryable": true,
    "suggestion": "Retry later or verify the manifest URL"
  }
}
```

Node.js:

```js
export class CLIError extends Error {
  constructor({ code, message, input, retryable, suggestion }) {
    super(message);
    this.code = code;
    this.input = input;
    this.retryable = retryable;
    this.suggestion = suggestion;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        input: this.input,
        retryable: this.retryable,
        suggestion: this.suggestion,
      },
    };
  }
}
```

退出码约定：

- `0` 成功
- `1` 永久错误
- `2` 瞬态错误
- `130` 用户取消或中断

## Rule 6: `--help` 简洁稳定，`--describe` 给 Agent 用

Bad:

```bash
$ aa update --help
Deploy your amazing CLI into the future with this magical command...
```

Good:

```bash
$ aa update --help
Usage: aa update [options]

Check and apply packaged-binary updates.
```

Better:

```bash
$ aa --describe
{
  "command": "aa",
  "summary": "Agent-friendly CLI starter template",
  "subcommands": [
    { "command": "aa list users" },
    { "command": "aa update check" },
    { "command": "aa update apply" }
  ]
}
```

## Rule 7: 同时支持扁平 flags 和 `--json-input`

Bad:

```bash
$ aa list users --role admin
```

只有 flags，没有结构化入口。

Good:

```bash
$ aa list users --json-input='{"role":"admin"}' --json
[
  { "name": "Alice", "email": "alice@co.com", "role": "admin" }
]
```

Node.js:

```js
import { readFileSync } from "node:fs";

export function parseJsonInput(raw, stdinText) {
  if (!raw) return null;
  const text = raw === "-" ? stdinText ?? readFileSync(0, "utf8") : raw;
  return JSON.parse(text);
}
```

实践建议：

- 先解析 `--json-input`
- 再合并扁平 flags
- 对象输入用浅合并即可

## Rule 8: 把 Agent 当不可信输入

Bad:

```js
execSync(`rm -rf ${userInput}`);
```

Good:

```js
import { relative, resolve } from "node:path";

export function validatePath(input, baseDir) {
  const resolved = resolve(baseDir, input);

  if (relative(baseDir, resolved).startsWith("..")) {
    throw new Error(`Path traversal rejected: ${input}`);
  }

  if (/[\x00-\x1f]/.test(input)) {
    throw new Error("Control characters rejected");
  }

  return resolved;
}
```

## 补充实践

### 1. 命令多时按域拆分

推荐：

- `aa user list`
- `aa user get`
- `aa image push`
- `aa update check`

不推荐：

- `aa list-users`
- `aa push-image`

好处：

- 人类更容易扫命令
- Agent 可以一层一层跑 `--describe`
- 更接近 API 资源模型

### 2. YAML 是增强，不是默认协议

建议：

- `--json` 必须
- `--yaml` 可选
- 非 TTY 默认 JSON

YAML 的价值主要是：

- 给人读时更省 token
- 某些长结构比 JSON 更紧凑

但它不应该取代默认 JSON 协议。

### 3. 写 CLI 时必须同步写配套 skill

如果一个 CLI 以后要频繁让 Agent 修改，那么除了代码，还要一起沉淀：

- 命令契约文档
- 错误码目录
- 样例合同
- release/update 检查清单
- Agent skill 模板

### 4. 自动更新要从第一版考虑

标准命令：

- `aa version --json`
- `aa update check --json`
- `aa update apply --yes --json`

高风险命令还要支持：

- `aa update apply --dry-run --json`

### 5. Bun 二进制分发

适用场景：

- 用户不想装 Node.js
- 需要跨平台单文件分发
- 希望把自更新做在 CLI 内部

权衡：

- 二进制更大
- 但交付门槛更低

## Quick Checklist

- 所有命令支持 `--json`
- 非 TTY 默认 JSON
- 高风险命令支持 `--yes`
- 高风险命令支持 `--dry-run`
- 错误结构化且有退出码语义
- `--help` 简洁，`--describe` 稳定
- 支持 `--json-input`
- 校验路径、控制字符和枚举输入
- 命令多时按域拆分
- 发布时同时维护 skill、example contracts 和 update 文档
