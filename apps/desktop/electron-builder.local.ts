import type { Configuration } from "electron-builder";
import base from "./electron-builder";

const baseMac = base.mac ?? {};

const config: Configuration = {
	...base,
	mac: {
		...baseMac,
		identity: null,
		hardenedRuntime: false,
		gatekeeperAssess: false,
		notarize: false,
	},
};

export default config;
