/**
 * Electron Builder Configuration - Canary Build
 *
 * Extends the base config with canary-specific overrides for internal testing.
 * Can be installed side-by-side with the stable release.
 *
 * @see https://www.electron.build/configuration/configuration
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Configuration } from "electron-builder";
import baseConfig from "./electron-builder";
import pkg from "./package.json";
import { DESKTOP_DISTRIBUTION } from "./src/shared/desktop-distribution";

const productName = `${DESKTOP_DISTRIBUTION.productName} Canary`;
const canaryMacIconPath = join(pkg.resources, "build/icons/icon-canary.icns");
const canaryLinuxIconPath = join(pkg.resources, "build/icons/icon-canary.png");
const canaryWinIconPath = join(pkg.resources, "build/icons/icon-canary.ico");
const stableUpdateRepoOwner = process.env.DESKTOP_UPDATER_GITHUB_OWNER?.trim();
const stableUpdateRepoName = process.env.DESKTOP_UPDATER_GITHUB_REPO?.trim();
const publishConfig =
	stableUpdateRepoOwner && stableUpdateRepoName
		? {
				provider: "github" as const,
				owner: stableUpdateRepoOwner,
				repo: stableUpdateRepoName,
				releaseType: "prerelease" as const,
			}
		: null;

const config: Configuration = {
	...baseConfig,
	appId: `${DESKTOP_DISTRIBUTION.appId}.canary`,
	productName,

	publish: publishConfig,

	mac: {
		...baseConfig.mac,
		...(existsSync(canaryMacIconPath) ? { icon: canaryMacIconPath } : {}),
		artifactName: `${DESKTOP_DISTRIBUTION.productName}-Canary-\${version}-\${arch}.\${ext}`,
		extendInfo: {
			...baseConfig.mac?.extendInfo,
			CFBundleName: productName,
			CFBundleDisplayName: productName,
		},
	},

	linux: {
		...baseConfig.linux,
		...(existsSync(canaryLinuxIconPath) ? { icon: canaryLinuxIconPath } : {}),
		synopsis: `${pkg.description} (Canary)`,
		artifactName: `${DESKTOP_DISTRIBUTION.productName.toLowerCase()}-canary-\${version}-\${arch}.\${ext}`,
	},

	win: {
		...baseConfig.win,
		...(existsSync(canaryWinIconPath) ? { icon: canaryWinIconPath } : {}),
		artifactName: `${DESKTOP_DISTRIBUTION.productName}-Canary-\${version}-\${arch}.\${ext}`,
	},
};

export default config;
