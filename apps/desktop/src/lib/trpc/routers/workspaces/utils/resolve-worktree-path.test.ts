import { beforeEach, describe, expect, mock, test } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";

// Mock localDb before importing the module under test
let mockSettingsRow: Record<string, unknown> | undefined;

mock.module("main/lib/local-db", () => ({
	localDb: {
		select: () => ({
			from: () => ({
				get: () => mockSettingsRow,
			}),
		}),
	},
}));

// Must import after mock.module
const { resolveWorktreePath } = await import("./resolve-worktree-path");

const SUPERSET_DIR = ".superset";
const WORKTREES_DIR = "worktrees";

describe("resolveWorktreePath", () => {
	beforeEach(() => {
		mockSettingsRow = undefined;
	});

	test("includes project name by default (no flat layout)", () => {
		const result = resolveWorktreePath(
			{ name: "fleetyards", worktreeBaseDir: null, flatWorktreeLayout: null },
			"odd-seer",
		);

		expect(result).toBe(
			join(homedir(), SUPERSET_DIR, WORKTREES_DIR, "fleetyards", "odd-seer"),
		);
	});

	test("includes project name with project worktreeBaseDir", () => {
		const result = resolveWorktreePath(
			{
				name: "fleetyards",
				worktreeBaseDir: "/custom/base",
				flatWorktreeLayout: null,
			},
			"odd-seer",
		);

		expect(result).toBe(join("/custom/base", "fleetyards", "odd-seer"));
	});

	test("omits project name when project flatWorktreeLayout is true", () => {
		const result = resolveWorktreePath(
			{ name: "fleetyards", worktreeBaseDir: null, flatWorktreeLayout: true },
			"odd-seer",
		);

		expect(result).toBe(
			join(homedir(), SUPERSET_DIR, WORKTREES_DIR, "odd-seer"),
		);
	});

	test("omits project name with project worktreeBaseDir + flat layout", () => {
		const result = resolveWorktreePath(
			{
				name: "fleetyards",
				worktreeBaseDir: "/custom/base",
				flatWorktreeLayout: true,
			},
			"odd-seer",
		);

		expect(result).toBe(join("/custom/base", "odd-seer"));
	});

	test("respects global flatWorktreeLayout setting when project has no override", () => {
		mockSettingsRow = { flatWorktreeLayout: true };

		const result = resolveWorktreePath(
			{ name: "fleetyards", worktreeBaseDir: null, flatWorktreeLayout: null },
			"odd-seer",
		);

		expect(result).toBe(
			join(homedir(), SUPERSET_DIR, WORKTREES_DIR, "odd-seer"),
		);
	});

	test("project flatWorktreeLayout=false overrides global true", () => {
		mockSettingsRow = { flatWorktreeLayout: true };

		const result = resolveWorktreePath(
			{
				name: "fleetyards",
				worktreeBaseDir: null,
				flatWorktreeLayout: false,
			},
			"odd-seer",
		);

		expect(result).toBe(
			join(homedir(), SUPERSET_DIR, WORKTREES_DIR, "fleetyards", "odd-seer"),
		);
	});

	test("uses global worktreeBaseDir when set", () => {
		mockSettingsRow = { worktreeBaseDir: "/global/worktrees" };

		const result = resolveWorktreePath(
			{ name: "fleetyards", worktreeBaseDir: null, flatWorktreeLayout: null },
			"odd-seer",
		);

		expect(result).toBe(join("/global/worktrees", "fleetyards", "odd-seer"));
	});

	test("uses global worktreeBaseDir with global flat layout", () => {
		mockSettingsRow = {
			worktreeBaseDir: "/global/worktrees",
			flatWorktreeLayout: true,
		};

		const result = resolveWorktreePath(
			{ name: "fleetyards", worktreeBaseDir: null, flatWorktreeLayout: null },
			"odd-seer",
		);

		expect(result).toBe(join("/global/worktrees", "odd-seer"));
	});
});
