# Error Catalog Template

| Code | Meaning | Retryable | Suggested recovery |
| --- | --- | --- | --- |
| `manifest_source_missing` | No manifest source was configured | `false` | Set `AA_UPDATE_MANIFEST_FILE` or `AA_UPDATE_MANIFEST_URL` |
| `unsupported_runtime_mode` | `update apply` ran from source mode | `false` | Use a packaged binary |
