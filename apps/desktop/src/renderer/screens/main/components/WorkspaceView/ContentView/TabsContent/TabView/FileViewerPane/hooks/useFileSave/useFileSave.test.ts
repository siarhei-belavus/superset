import { beforeEach, describe, expect, test } from "bun:test";
import {
	deleteDocumentBuffer,
	getDocumentBaselineContent,
	getDocumentCurrentContent,
	markDocumentSavedContent,
	setDocumentCurrentContent,
	setDocumentLoadedContent,
} from "renderer/stores/editor-state/editorBufferRegistry";

/**
 * Reproduction test for GitHub issue #2876:
 * Cursor and scroll position reset when saving a file in raw mode.
 *
 * The save flow involves:
 * 1. File loaded from disk → setDocumentLoadedContent (baseline = current = diskContent)
 * 2. User edits → setDocumentCurrentContent (current diverges from baseline, dirty = true)
 * 3. User saves (Cmd+S) → markDocumentSavedContent (baseline = savedContent, dirty = false)
 * 4. Query invalidation triggers refetch of file from disk
 * 5. useEffect in FileViewerPane fires because isDirty changed from true→false
 *
 * Bug: In step 5, the effect called applyLoadedDocumentContent with STALE rawFileData
 * (from step 1, before edits), resetting the editor buffer to the pre-edit content.
 * This caused CodeEditor to dispatch a full document replacement, resetting cursor to 0.
 *
 * Fix: A ref (lastAppliedRawDataRef) tracks which rawFileData was last applied.
 * The effect only calls applyLoadedDocumentContent when rawFileData actually changed
 * (new reference), not when isDirty merely transitioned from true to false.
 */

const DOC_KEY = "test-workspace::working::test-file.ts";

beforeEach(() => {
	deleteDocumentBuffer(DOC_KEY);
});

describe("save cursor preservation (issue #2876)", () => {
	test("after save, buffer baseline and current match saved content", () => {
		// Step 1: Initial file load
		const original = "const x = 1;\nconsole.log(x);\n";
		setDocumentLoadedContent(DOC_KEY, original);

		// Step 2: User edits
		const edited = "const x = 42;\nconsole.log(x);\n";
		setDocumentCurrentContent(DOC_KEY, edited);
		expect(getDocumentCurrentContent(DOC_KEY)).toBe(edited);
		expect(getDocumentBaselineContent(DOC_KEY)).toBe(original);

		// Step 3: Save — markDocumentSavedContent updates baseline
		markDocumentSavedContent(DOC_KEY, edited, edited);
		expect(getDocumentBaselineContent(DOC_KEY)).toBe(edited);
		expect(getDocumentCurrentContent(DOC_KEY)).toBe(edited);

		// Step 4: Post-save refetch returns saved content — no change needed
		setDocumentLoadedContent(DOC_KEY, edited);
		expect(getDocumentBaselineContent(DOC_KEY)).toBe(edited);
		expect(getDocumentCurrentContent(DOC_KEY)).toBe(edited);
	});

	test("stale rawFileData would revert buffer if applied after save", () => {
		// This demonstrates WHY the ref guard in FileViewerPane is necessary.
		// Without it, stale pre-edit content gets applied after save.

		const original = "const x = 1;\n";
		setDocumentLoadedContent(DOC_KEY, original);

		const edited = "const x = 42;\n";
		setDocumentCurrentContent(DOC_KEY, edited);
		markDocumentSavedContent(DOC_KEY, edited, edited);

		// Without the ref guard, the effect would apply stale original content here.
		// This simulates what happens when isDirty→false triggers the effect with
		// stale rawFileData before the refetch completes.
		setDocumentLoadedContent(DOC_KEY, original);

		// Buffer is reverted — this is what the ref guard prevents!
		expect(getDocumentCurrentContent(DOC_KEY)).toBe(original);
		expect(getDocumentBaselineContent(DOC_KEY)).toBe(original);
	});

	test("ref guard logic: skip apply when rawFileData reference unchanged", () => {
		// Simulates the ref-based guard logic from FileViewerPane's useEffect.
		// This is a unit test of the decision logic, not the React hook.

		// Represents rawFileData objects (identity matters, not just content)
		const rawFileData1 = { ok: true as const, content: "original" };
		const rawFileData2 = { ok: true as const, content: "edited" };

		let lastAppliedRef: typeof rawFileData1 | undefined;
		let applyCount = 0;

		function simulateEffect(
			rawFileData: typeof rawFileData1,
			isDirty: boolean,
		) {
			if (isDirty) return;
			if (rawFileData === lastAppliedRef) return;
			lastAppliedRef = rawFileData;
			applyCount++;
		}

		// Initial load — rawFileData1 applied
		simulateEffect(rawFileData1, false);
		expect(applyCount).toBe(1);

		// User edits — isDirty=true, effect skips
		simulateEffect(rawFileData1, true);
		expect(applyCount).toBe(1);

		// Save completes — isDirty transitions to false.
		// rawFileData is still rawFileData1 (stale, pre-edit content).
		// Ref guard: rawFileData1 === lastAppliedRef → SKIP
		simulateEffect(rawFileData1, false);
		expect(applyCount).toBe(1); // No spurious apply!

		// Refetch completes — rawFileData2 arrives with new content.
		// rawFileData2 !== lastAppliedRef → APPLY
		simulateEffect(rawFileData2, false);
		expect(applyCount).toBe(2);
	});

	test("ref guard allows external changes after discard", () => {
		// External file change while dirty → user discards → external content applied

		const rawFileData1 = { ok: true as const, content: "original" };
		const rawFileData2 = { ok: true as const, content: "external change" };

		let lastAppliedRef: typeof rawFileData1 | undefined;
		let applyCount = 0;
		let lastAppliedContent = "";

		function simulateEffect(
			rawFileData: typeof rawFileData1,
			isDirty: boolean,
		) {
			if (isDirty) return;
			if (rawFileData === lastAppliedRef) return;
			lastAppliedRef = rawFileData;
			applyCount++;
			lastAppliedContent = rawFileData.content;
		}

		// Initial load
		simulateEffect(rawFileData1, false);
		expect(applyCount).toBe(1);

		// User edits — isDirty=true
		simulateEffect(rawFileData1, true);

		// External file change — rawFileData2 arrives, but isDirty=true → skip
		simulateEffect(rawFileData2, true);
		expect(applyCount).toBe(1);

		// User discards — isDirty=false, rawFileData2 !== lastAppliedRef → APPLY
		simulateEffect(rawFileData2, false);
		expect(applyCount).toBe(2);
		expect(lastAppliedContent).toBe("external change");
	});
});
