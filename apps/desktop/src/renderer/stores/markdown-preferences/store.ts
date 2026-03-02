import { getWindowScopedStorageKey } from "renderer/lib/window-scoped-storage";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type MarkdownStyle = "default" | "tufte";

interface MarkdownPreferencesState {
	style: MarkdownStyle;
	setStyle: (style: MarkdownStyle) => void;
}

export const useMarkdownPreferencesStore = create<MarkdownPreferencesState>()(
	devtools(
		persist(
			(set) => ({
				style: "default",

				setStyle: (style) => {
					set({ style });
				},
			}),
			{
				name: getWindowScopedStorageKey("markdown-preferences"),
			},
		),
		{ name: "MarkdownPreferencesStore" },
	),
);

export const useMarkdownStyle = () =>
	useMarkdownPreferencesStore((state) => state.style);
export const useSetMarkdownStyle = () =>
	useMarkdownPreferencesStore((state) => state.setStyle);
