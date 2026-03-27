export const DESKTOP_DISTRIBUTION = {
	productName: "Localset",
	upstreamName: "Superset",
	isModifiedBuild: true,
	modifiedBuildLabel: "Modified build of Superset desktop",
	modifiedBuildDisclaimer: "Not an official Superset release",
	appId: "com.localset.desktop",
	protocolScheme: "localset",
} as const;

export function getWorkspaceScopedAppName(workspaceName: string): string {
	return `${DESKTOP_DISTRIBUTION.productName} (${workspaceName})`;
}
