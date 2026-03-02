const WINDOW_SCOPE_ID_KEY = "__superset_window_scope_id";

function createScopeId(): string {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getWindowScopeId(): string | null {
	if (typeof window === "undefined") return null;

	try {
		const existing = window.sessionStorage.getItem(WINDOW_SCOPE_ID_KEY);
		if (existing) return existing;

		const created = createScopeId();
		window.sessionStorage.setItem(WINDOW_SCOPE_ID_KEY, created);
		return created;
	} catch {
		return null;
	}
}

export function getWindowScopedStorageKey(baseKey: string): string {
	const scopeId = getWindowScopeId();
	return scopeId ? `${baseKey}:${scopeId}` : baseKey;
}
