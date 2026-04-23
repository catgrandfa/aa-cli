import { createHash } from "node:crypto";
import { readFile, rename, writeFile, chmod, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CLIError } from "./errors.js";

export function resolveManifestTarget(manifest, platform) {
  const target = manifest.platforms?.[platform];

  if (!target) {
    throw new CLIError({
      code: "platform_asset_missing",
      message: `No update asset is available for platform '${platform}'`,
      input: { platform },
      retryable: false,
    });
  }

  return target;
}

export function assertUpdateRuntimeSupported(runtimeMode) {
  if (runtimeMode !== "packaged-binary") {
    throw new CLIError({
      code: "unsupported_runtime_mode",
      message: "update apply only works from a packaged binary runtime",
      retryable: false,
      suggestion: "Build or install a packaged binary before running aa update apply",
    });
  }
}

export function buildUpdateCheckResult({ currentVersion, manifest, platform }) {
  resolveManifestTarget(manifest, platform);

  return {
    name: manifest.name,
    current_version: currentVersion,
    latest_version: manifest.version,
    update_available: currentVersion !== manifest.version,
    platform,
    notes_url: manifest.notes_url,
  };
}

export function buildUpdatePlan({ currentVersion, manifest, platform }) {
  resolveManifestTarget(manifest, platform);

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

async function loadManifest({ manifestFile, manifestUrl }) {
  if (manifestFile) {
    const text = await readFile(manifestFile, "utf8");
    return JSON.parse(text);
  }

  if (!manifestUrl) {
    throw new CLIError({
      code: "manifest_source_missing",
      message: "No update manifest source is configured",
      retryable: false,
      suggestion: "Set AA_UPDATE_MANIFEST_FILE or AA_UPDATE_MANIFEST_URL",
    });
  }

  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new CLIError({
      code: "manifest_fetch_failed",
      message: `Failed to fetch update manifest: HTTP ${response.status}`,
      retryable: response.status >= 500,
      suggestion: "Retry later or verify the manifest URL",
    });
  }

  return response.json();
}

async function downloadAsset(url) {
  if (url.startsWith("file://")) {
    return readFile(fileURLToPath(url));
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new CLIError({
      code: "asset_download_failed",
      message: `Failed to download update asset: HTTP ${response.status}`,
      retryable: response.status >= 500,
      suggestion: "Retry later or verify the asset URL",
    });
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function verifySha256(buffer, expected) {
  const actual = createHash("sha256").update(buffer).digest("hex");

  if (actual !== expected) {
    throw new CLIError({
      code: "checksum_mismatch",
      message: "Downloaded asset checksum did not match the manifest",
      retryable: false,
      suggestion: "Re-run update check or verify the published release asset",
    });
  }
}

async function replaceExecutable(executablePath, buffer) {
  const tempPath = `${executablePath}.next`;

  try {
    await writeFile(tempPath, buffer);
    await chmod(tempPath, 0o755);
    await rename(tempPath, executablePath);
  } catch (error) {
    try {
      await unlink(tempPath);
    } catch {
      // Ignore cleanup failures after the original replacement error.
    }

    throw new CLIError({
      code: "update_replace_failed",
      message: error instanceof Error ? error.message : "Failed to replace the current executable",
      retryable: true,
      suggestion: "Retry the update with sufficient filesystem permissions",
    });
  }
}

export function createUpdateProvider({
  currentVersion,
  runtimeMode,
  platform,
  executablePath,
  manifestFile,
  manifestUrl,
}) {
  return {
    async fetchManifest() {
      return loadManifest({ manifestFile, manifestUrl });
    },

    buildCheckResult(manifest) {
      return buildUpdateCheckResult({
        currentVersion,
        manifest,
        platform,
      });
    },

    async buildPlan() {
      const manifest = await loadManifest({ manifestFile, manifestUrl });
      return buildUpdatePlan({
        currentVersion,
        manifest,
        platform,
      });
    },

    async applyUpdate() {
      assertUpdateRuntimeSupported(runtimeMode);

      const manifest = await loadManifest({ manifestFile, manifestUrl });
      const target = resolveManifestTarget(manifest, platform);
      const asset = await downloadAsset(target.url);
      verifySha256(asset, target.sha256);
      await replaceExecutable(executablePath, asset);

      return {
        name: manifest.name,
        previous_version: currentVersion,
        updated_version: manifest.version,
        platform,
        updated: true,
      };
    },
  };
}
