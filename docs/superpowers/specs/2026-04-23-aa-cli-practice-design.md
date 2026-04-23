# aa-cli Practice Design

Date: 2026-04-23
Status: Approved for spec review

## Summary

`aa-cli` is a starter repository for building agent-friendly CLIs. It provides:

- A reusable practice guide for CLI contract design
- A zero-dependency Node.js template that enforces stable command behavior
- A companion skill template that forces agents to produce command contracts, examples, and release artifacts alongside implementation
- A first-class self-update design backed by published release metadata and multi-platform binaries

The repository is not a product-specific CLI. It is a reusable base for future CLIs that need to work reliably with both humans and agents.

## Goals

- Make every command safe and predictable for agents to call
- Preserve a reasonable human UX without sacrificing machine-readability
- Standardize command contracts across future CLIs
- Ship a starter Node.js implementation that can be copied and extended
- Require companion skill outputs so agent work stays consistent
- Support Bun-built multi-platform binaries and a real update flow from the first version

## Non-Goals

- Building a feature-rich business CLI in this repository
- Locking future CLIs to Node.js forever
- Implementing a heavy framework or plugin system in v1
- Requiring YAML as the default machine format

## Core Rules

The practice guide and starter template must enforce these rules:

1. Every command supports `--json`
2. Non-TTY stdout defaults to JSON output
3. Interactive prompts are forbidden in non-interactive mode; destructive commands require `--yes`
4. Dangerous commands support `--dry-run` and return structured plans
5. Large outputs support `--fields` and `--limit`
6. Errors are structured, stable, and include retry semantics
7. `--help` stays concise and format-stable; `--describe` returns structured command metadata
8. Commands accept both flat flags and structured JSON input
9. Agent-provided input is treated as untrusted and validated
10. High-risk commands expose `risk_tier`

YAML is allowed as an optional enhancement. JSON remains the required and default machine-readable format.

## Repository Layout

The initial repository layout is:

```text
aa-cli/
├─ README.md
├─ docs/
│  ├─ aa-cli-practice.md
│  ├─ command-contract.md
│  └─ release-and-update.md
├─ docs/superpowers/specs/
│  └─ 2026-04-23-aa-cli-practice-design.md
├─ templates/
│  └─ node-cli/
│     ├─ package.json
│     ├─ bin/aa.js
│     ├─ src/
│     │  ├─ cli.js
│     │  ├─ core/
│     │  │  ├─ describe.js
│     │  │  ├─ errors.js
│     │  │  ├─ input.js
│     │  │  ├─ output.js
│     │  │  ├─ safety.js
│     │  │  └─ update.js
│     │  └─ commands/
│     │     ├─ doctor.js
│     │     ├─ help.js
│     │     ├─ list.js
│     │     ├─ update-check.js
│     │     └─ update-apply.js
│     └─ README.md
├─ skills/
│  └─ cli-agent/
│     ├─ SKILL.md
│     └─ templates/
│        ├─ command-spec.md
│        ├─ error-catalog.md
│        └─ release-checklist.md
└─ examples/
   └─ contracts/
      ├─ deploy-dry-run.json
      ├─ error-image-not-found.json
      ├─ update-check.json
      └─ users-list.json
```

## CLI Contract

### Command Shape

Commands should be grouped by resource domain rather than by action. Example:

- `aa user list`
- `aa user get`
- `aa project deploy`
- `aa project delete`
- `aa image push`

This structure lets humans scan commands quickly and lets agents explore subcommands one level at a time with `--describe`.

### Global Flags

All top-level and nested commands should understand the same shared contract where relevant:

- `--json`
- `--yaml`
- `--yes`
- `--dry-run`
- `--fields`
- `--limit`
- `--json-input`
- `--describe`
- `--help`

Unsupported flags must fail with structured errors rather than being ignored.

For the zero-dependency Node.js starter, `--json` is required in v1. `--yaml` is optional and may be documented as an extension point rather than implemented by default.

### Output Rules

- `stdout` contains only result data
- `stderr` contains only errors or warnings
- If `stdout` is not a TTY, default output mode is JSON
- If `--json` is provided, output must be JSON
- If `--yaml` is provided, output may be YAML
- Human-readable output is allowed only for interactive TTY use

### Help and Describe

`--help` is for humans:

- Short
- Stable order
- No marketing copy
- No decorative output

`--describe` is for agents and must return structured metadata:

- Command path
- Summary
- Parameters
- Supported output modes
- Whether `--dry-run` is supported
- Risk tier
- Whether confirmation is required
- Examples

Agents should be able to explore the CLI tree incrementally:

- `aa --describe`
- `aa project --describe`
- `aa project deploy --describe`

## Error Model

Errors must be stable and parseable.

Required error shape:

```json
{
  "error": {
    "code": "image_not_found",
    "message": "Image 'foo' does not exist in local registry",
    "input": {
      "image": "foo"
    },
    "retryable": false,
    "suggestion": "Run 'aa image list --json' to see available images"
  }
}
```

Exit code policy:

- `0`: success
- `1`: permanent error
- `2`: transient error
- `130`: cancelled or interrupted

Permanent errors include:

- Invalid arguments
- Validation failures
- Missing resources
- Permission failures

Transient errors include:

- Timeouts
- Rate limits
- Temporary network issues
- Temporary lock conflicts

## Input Model

Commands must accept both:

- Human-friendly flat flags
- Structured `--json-input`

`--json-input=-` must read JSON from stdin.

The template should resolve structured input first, then fall back to flat flags.

Input validation rules:

- Reject path traversal
- Reject control characters
- Reject malformed JSON payloads
- Reject unsupported enum values
- Never interpolate raw user input into shell commands

## Dry Run and Risk

Any command with destructive or high-impact behavior must support `--dry-run`.

Dry-run responses must be structured. Example fields:

- `actions`
- `risk_tier`
- `requires_approval`
- `current_version`
- `target_version`

Risk tiers are:

- `low`
- `medium`
- `high`

High-risk commands should require confirmation in interactive mode and `--yes` in non-interactive mode.

## Node.js Template Design

The template is intentionally thin. Business logic should stay in command modules, while shared behavior lives in `src/core`.

### Template Modules

- `bin/aa.js`: executable entrypoint
- `src/cli.js`: parses global flags, resolves command routes, builds execution context
- `src/core/output.js`: result formatting, field selection, list limiting, output mode selection
- `src/core/errors.js`: `CLIError`, error serialization, exit-code handling
- `src/core/input.js`: `--json-input`, stdin parsing, flat-flag fallback
- `src/core/safety.js`: confirmation checks and input validation helpers
- `src/core/describe.js`: generates `--help` and `--describe` from command metadata
- `src/core/update.js`: shared update-check and update-apply helpers
- `src/commands/*`: commands export `meta` and `run(context)`

### Command Authoring Pattern

Each command exports:

- `meta`
- `run(context)`

`meta` contains the command contract. `run` returns data or throws `CLIError`.

This keeps `--help`, `--describe`, and output behavior centralized instead of reimplemented per command.

## Skill Design

The repository includes a CLI-focused skill that turns the practice guide into a mandatory delivery checklist.

The skill must require an agent to:

1. Read `docs/aa-cli-practice.md` and `docs/command-contract.md`
2. Define or update the command contract before code changes
3. Update `--help` and `--describe` along with implementation
4. Add example contract files under `examples/contracts/`
5. Add or update error catalog entries for new command behavior
6. Document release impact when command contracts change
7. Prefer domain-by-domain exploration over dumping the full command tree

The skill should reference template files rather than restating long prose rules.

## Release and Update Design

Auto-update is a first-version requirement, not a future placeholder.

### Supported Commands

The starter CLI must define:

- `aa version --json`
- `aa update check --json`
- `aa update apply --yes --json`

### Update Source

The default update source is GitHub Releases plus a release manifest.

The manifest shape is:

```json
{
  "name": "aa",
  "version": "0.1.1",
  "published_at": "2026-04-23T12:00:00Z",
  "notes_url": "https://github.com/catgrandfa/aa-cli/releases/tag/v0.1.1",
  "platforms": {
    "darwin-arm64": {
      "url": "https://github.com/catgrandfa/aa-cli/releases/download/v0.1.1/aa-darwin-arm64",
      "sha256": "..."
    }
  }
}
```

### Update Check Behavior

`aa update check --json` must:

1. Detect the current platform target
2. Fetch the manifest
3. Compare local and remote versions
4. Return a structured result that includes update availability

### Update Apply Behavior

`aa update apply --yes --json` must:

1. Detect the current platform target
2. Fetch the manifest
3. Select the correct binary asset
4. Download to a temporary file
5. Verify the asset checksum
6. Atomically replace the current executable
7. Return structured success or structured failure

When the CLI is running from source in a Node.js development context rather than from a bundled binary, `update apply` may return a structured permanent error such as `unsupported_runtime_mode` with a suggestion to use a packaged binary build.

### Update Safety

The update flow must:

- Refuse to continue if the target platform asset is missing
- Refuse to replace the executable if checksum validation fails
- Avoid partial replacement on failure
- Return transient errors for temporary network failures
- Return permanent errors for invalid manifests or unsupported platforms

## Packaging Strategy

The repository should support two runtime modes:

- Node.js execution for local development and template iteration
- Bun-built binaries for end-user distribution

The documentation should define target platforms:

- `darwin-arm64`
- `darwin-x64`
- `linux-x64`
- `linux-arm64`
- `windows-x64`

The repository does not need a full CI release pipeline in the first spec, but it must document the release workflow clearly enough to implement next.

## Versioning and Compatibility

The contract should be treated like an API.

Breaking changes include:

- Command path changes
- Success payload shape changes
- Error-code meaning changes
- `--describe` schema changes

Non-breaking changes include:

- Additional optional fields
- New commands
- Small wording changes in `--help` that keep meaning and format stable

Example contract files should be reviewed whenever command output changes.

## Deliverables for Implementation

Implementation that follows this spec should create:

- Top-level repository docs
- A reusable Node.js CLI starter
- A CLI skill template
- Example structured outputs
- A documented release/update approach
- A working starter update implementation suitable for Bun-bundled binaries

## Acceptance Criteria

The first implemented version is acceptable when:

- The repository structure matches this spec
- The practice docs cover the required CLI rules with Bad/Good examples in Node.js
- The Node template supports structured output, non-interactive safety, dry-run behavior, field limiting, structured errors, `--describe`, and `--json-input`
- The Node template documents `--yaml` as optional unless a future template opts into a concrete implementation
- The skill template forces contract-first CLI work
- The starter CLI exposes real update-check and update-apply paths
- The release docs explain Bun multi-platform binary distribution and manifest-based updates
- Example contract files exist for success, dry-run, and error cases
