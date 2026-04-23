# Release and Update

`aa-cli` 第一版就把“二进制分发 + 自更新”当正式能力，不把它放到“以后再说”。

## 运行模式

支持两种模式：

- `source`
  直接通过 Node.js 运行模板代码，用于开发和调试
- `packaged-binary`
  用 Bun 打包后的单文件二进制，用于终端用户分发

`aa update apply` 只允许在 `packaged-binary` 模式执行。  
源码运行态应明确返回：

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

## 标准更新命令

- `aa version --json`
- `aa update check --json`
- `aa update apply --yes --json`
- `aa update apply --dry-run --json`

## Manifest 结构

```json
{
  "name": "aa",
  "version": "0.2.0",
  "published_at": "2026-04-23T12:00:00Z",
  "notes_url": "https://github.com/catgrandfa/aa-cli/releases/tag/v0.2.0",
  "platforms": {
    "darwin-arm64": {
      "url": "https://github.com/catgrandfa/aa-cli/releases/download/v0.2.0/aa-darwin-arm64",
      "sha256": "..."
    }
  }
}
```

## `update check`

行为：

1. 识别当前平台
2. 拉取 manifest
3. 找到目标平台资产
4. 比较本地版本与远端版本
5. 输出结构化结果

示例：

```json
{
  "name": "aa",
  "current_version": "0.1.0",
  "latest_version": "0.2.0",
  "update_available": true,
  "platform": "darwin-arm64",
  "notes_url": "https://example.com/releases/v0.2.0"
}
```

## `update apply`

行为：

1. 确认运行在 `packaged-binary`
2. 拉取 manifest
3. 定位平台资产
4. 下载资产
5. 校验 `sha256`
6. 原子替换当前可执行文件
7. 输出结构化成功结果

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

## 平台目标

- `darwin-arm64`
- `darwin-x64`
- `linux-x64`
- `linux-arm64`
- `windows-x64`

## Bun 打包

推荐用 Bun 做单文件分发：

```bash
bun build ./templates/node-cli/bin/aa.js --compile --outfile dist/aa
```

实践建议：

- 产物命名显式带平台，例如 `aa-darwin-arm64`
- 发布到 GitHub Releases 或内部制品源
- manifest 与二进制一起发布
- CI 或发布脚本负责生成 `sha256`

## 发布检查

每次命令契约或二进制行为变更时，检查：

- 是否需要 bump 版本号
- 是否需要更新 manifest 结构
- 是否需要更新 `examples/contracts`
- 是否需要更新 `skills/cli-agent`
- 是否需要补充 `aa update apply --dry-run --json` 示例
