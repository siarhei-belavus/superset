import type { Configuration } from "electron-builder";
import base from "./electron-builder";
import { DESKTOP_DISTRIBUTION } from "./src/shared/desktop-distribution";

const baseMac = base.mac ?? {};
const baseProtocols = Array.isArray(base.protocols)
	? base.protocols
	: base.protocols
		? [base.protocols]
		: [];
const shouldIncludeUpdaterMetadata =
	!!process.env.DESKTOP_UPDATER_GITHUB_OWNER?.trim() &&
	!!process.env.DESKTOP_UPDATER_GITHUB_REPO?.trim();

const config: Configuration = {
	...base,
	appId: `${DESKTOP_DISTRIBUTION.appId}.internal`,
	productName: `${DESKTOP_DISTRIBUTION.productName} Internal`,
	publish: shouldIncludeUpdaterMetadata ? base.publish : null,
	mac: {
		...baseMac,
		identity: null,
		hardenedRuntime: false,
		gatekeeperAssess: false,
		notarize: false,
		extendInfo: {
			...baseMac.extendInfo,
			CFBundleName: `${DESKTOP_DISTRIBUTION.productName} Internal`,
			CFBundleDisplayName: `${DESKTOP_DISTRIBUTION.productName} Internal`,
		},
	},
	protocols: baseProtocols.map((protocol) => ({
		...protocol,
		name: `${DESKTOP_DISTRIBUTION.productName} Internal`,
		schemes: [`${DESKTOP_DISTRIBUTION.protocolScheme}-internal`],
	})),
};

export default config;
