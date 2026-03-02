import { appState } from ".";
import { defaultAppState, type TabsState } from "./schemas";

function getWindowKey(windowId: number | null | undefined): string | null {
	return windowId === null || windowId === undefined ? null : String(windowId);
}

function getStatesForMerge(): TabsState[] {
	const states: TabsState[] = [];
	const byWindow = appState.data.tabsStateByWindow;

	for (const state of Object.values(byWindow ?? {})) {
		states.push(state);
	}

	// Keep legacy global state as fallback for old data and single-window boot.
	if (
		(states.length === 0 || appState.data.tabsState.tabs.length > 0) &&
		appState.data.tabsState
	) {
		states.push(appState.data.tabsState);
	}

	return states;
}

export function getTabsStateForWindow(
	windowId: number | null | undefined,
): TabsState {
	const key = getWindowKey(windowId);
	if (key && appState.data.tabsStateByWindow[key]) {
		return appState.data.tabsStateByWindow[key];
	}
	return appState.data.tabsState ?? defaultAppState.tabsState;
}

export function setTabsStateForWindow(
	windowId: number | null | undefined,
	tabsState: TabsState,
): void {
	const key = getWindowKey(windowId);
	if (key) {
		appState.data.tabsStateByWindow = {
			...appState.data.tabsStateByWindow,
			[key]: tabsState,
		};
	}
	// Keep legacy field in sync for fallback/migration.
	appState.data.tabsState = tabsState;
}

export function getMergedTabsState(): TabsState {
	const states = getStatesForMerge();
	if (states.length === 0) {
		return defaultAppState.tabsState;
	}

	const tabsById = new Map<string, TabsState["tabs"][number]>();
	const panes: TabsState["panes"] = {};
	const activeTabIds: TabsState["activeTabIds"] = {};
	const focusedPaneIds: TabsState["focusedPaneIds"] = {};
	const tabHistoryStacks: TabsState["tabHistoryStacks"] = {};

	for (const state of states) {
		for (const tab of state.tabs ?? []) {
			tabsById.set(tab.id, tab);
		}

		Object.assign(panes, state.panes ?? {});
		Object.assign(activeTabIds, state.activeTabIds ?? {});
		Object.assign(focusedPaneIds, state.focusedPaneIds ?? {});
		Object.assign(tabHistoryStacks, state.tabHistoryStacks ?? {});
	}

	return {
		tabs: [...tabsById.values()],
		panes,
		activeTabIds,
		focusedPaneIds,
		tabHistoryStacks,
	};
}

export function resetTabsState(): void {
	appState.data.tabsState = defaultAppState.tabsState;
	appState.data.tabsStateByWindow = {};
}
