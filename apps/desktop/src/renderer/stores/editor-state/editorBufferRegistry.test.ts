import { beforeEach, describe, expect, test } from "bun:test";
import {
	deleteDocumentBuffer,
	discardDocumentCurrentContent,
	getDocumentBaselineContent,
	getDocumentCurrentContent,
	hasInitializedDocumentBuffer,
	markDocumentSavedContent,
	setDocumentCurrentContent,
	setDocumentLoadedContent,
} from "./editorBufferRegistry";

/**
 * Reproduction test for GitHub issue #2830:
 * Unchanged markdown file always gives unsaved changes modal.
 *
 * Root cause: TipTap's `editor.setEditable(editable)` emits an "update"
 * event by default. This fires the `onUpdate` handler in the markdown
 * renderer, which serializes the ProseMirror document back to markdown.
 * The tiptap-markdown serializer normalizes content during the round-trip
 * (e.g., trailing newlines, spacing), producing slightly different markdown
 * than the original raw file content. The `updateDocumentDraft` function
 * then compares this normalized content with the baseline (raw file content)
 * and marks the document as dirty — triggering the unsaved changes modal.
 */

const TEST_KEY = "test-workspace::working::test-file.md";

beforeEach(() => {
	deleteDocumentBuffer(TEST_KEY);
});

describe("editorBufferRegistry", () => {
	test("setDocumentLoadedContent sets both baseline and current", () => {
		const content = "# Hello\n\nWorld\n";
		setDocumentLoadedContent(TEST_KEY, content);

		expect(getDocumentBaselineContent(TEST_KEY)).toBe(content);
		expect(getDocumentCurrentContent(TEST_KEY)).toBe(content);
		expect(hasInitializedDocumentBuffer(TEST_KEY)).toBe(true);
	});

	test("setDocumentCurrentContent updates only current when buffer is initialized", () => {
		const raw = "# Hello\n\nWorld\n";
		setDocumentLoadedContent(TEST_KEY, raw);

		const normalized = "# Hello\n\nWorld";
		setDocumentCurrentContent(TEST_KEY, normalized);

		expect(getDocumentBaselineContent(TEST_KEY)).toBe(raw);
		expect(getDocumentCurrentContent(TEST_KEY)).toBe(normalized);
	});

	test("dirty detection: current !== baseline after normalization", () => {
		const raw = "# Hello\n\nWorld\n";
		setDocumentLoadedContent(TEST_KEY, raw);

		// Simulate TipTap round-trip normalization (e.g., trimmed trailing newline)
		const normalized = "# Hello\n\nWorld";
		setDocumentCurrentContent(TEST_KEY, normalized);

		const isDirty =
			getDocumentCurrentContent(TEST_KEY) !==
			getDocumentBaselineContent(TEST_KEY);
		expect(isDirty).toBe(true);
	});

	test("no false dirty when content is unchanged", () => {
		const raw = "# Hello\n\nWorld\n";
		setDocumentLoadedContent(TEST_KEY, raw);

		// Content is not modified — should not be dirty
		const isDirty =
			getDocumentCurrentContent(TEST_KEY) !==
			getDocumentBaselineContent(TEST_KEY);
		expect(isDirty).toBe(false);
	});

	test("discardDocumentCurrentContent restores baseline", () => {
		const raw = "# Hello\n\nWorld\n";
		setDocumentLoadedContent(TEST_KEY, raw);

		const normalized = "# Hello\n\nWorld";
		setDocumentCurrentContent(TEST_KEY, normalized);

		const restored = discardDocumentCurrentContent(TEST_KEY);
		expect(restored).toBe(raw);
		expect(getDocumentCurrentContent(TEST_KEY)).toBe(raw);
	});

	/**
	 * Reproduction test for GitHub issue #2876:
	 * Cursor and scroll position reset when saving a file in raw mode.
	 *
	 * Root cause: after a successful save, markDocumentSavedContent updates the
	 * baseline to the saved content and sets dirty=false. The query invalidation
	 * then triggers a refetch, but before the refetch completes, the useEffect
	 * in FileViewerPane re-runs (because isDirty changed) and calls
	 * applyLoadedDocumentContent with the stale pre-edit rawFileData. This
	 * unconditionally overwrote both baseline and current content, causing
	 * renderedContent to change and CodeEditor to dispatch a full document
	 * replacement — which resets the cursor to position 0.
	 *
	 * The buffer-level fix ensures that markDocumentSavedContent correctly
	 * updates both baseline and current content so that a subsequent
	 * setDocumentLoadedContent with the same content is a no-op in terms of
	 * observable state (same strings). The primary fix is in FileViewerPane
	 * where a ref guard prevents re-applying stale rawFileData when isDirty
	 * transitions from true to false.
	 */
	test("markDocumentSavedContent updates baseline to saved content (issue #2876)", () => {
		// 1. File loaded from disk
		const original = "line 1\nline 2\nline 3\n";
		setDocumentLoadedContent(TEST_KEY, original);

		// 2. User edits the file
		const edited = "line 1\nline 2 modified\nline 3\n";
		setDocumentCurrentContent(TEST_KEY, edited);

		// 3. User saves — markDocumentSavedContent updates baseline to saved content
		markDocumentSavedContent(TEST_KEY, edited, edited);
		expect(getDocumentBaselineContent(TEST_KEY)).toBe(edited);
		expect(getDocumentCurrentContent(TEST_KEY)).toBe(edited);

		// 4. Post-save refetch with same content should produce identical state
		setDocumentLoadedContent(TEST_KEY, edited);
		expect(getDocumentBaselineContent(TEST_KEY)).toBe(edited);
		expect(getDocumentCurrentContent(TEST_KEY)).toBe(edited);
	});

	test("setDocumentLoadedContent with stale content after save would reset buffer (issue #2876)", () => {
		// This test documents the buffer-level behavior when stale data is applied.
		// The fix in FileViewerPane prevents this from happening by using a ref
		// guard to skip applying stale rawFileData.

		// 1. File loaded from disk with original content
		const original = "original content";
		setDocumentLoadedContent(TEST_KEY, original);

		// 2. User edits
		const edited = "edited content";
		setDocumentCurrentContent(TEST_KEY, edited);

		// 3. Save succeeds — baseline is now the edited content
		markDocumentSavedContent(TEST_KEY, edited, edited);
		expect(getDocumentBaselineContent(TEST_KEY)).toBe(edited);

		// 4. If stale rawFileData (original content) were applied, it WOULD reset
		//    the buffer. The FileViewerPane ref guard prevents this from happening.
		setDocumentLoadedContent(TEST_KEY, original);
		expect(getDocumentBaselineContent(TEST_KEY)).toBe(original);
		expect(getDocumentCurrentContent(TEST_KEY)).toBe(original);
	});
});
