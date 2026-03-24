import { homedir } from "node:os";
import { join } from "node:path";
import { type SelectProject, settings } from "@superset/local-db";
import { localDb } from "main/lib/local-db";
import { SUPERSET_DIR_NAME, WORKTREES_DIR_NAME } from "shared/constants";

/** Resolves base dir: project override > global setting > default (~/.superset/worktrees) */
export function resolveWorktreePath(
	project: Pick<
		SelectProject,
		"name" | "worktreeBaseDir" | "flatWorktreeLayout"
	>,
	branch: string,
): string {
	const row = localDb.select().from(settings).get();

	const flat = project.flatWorktreeLayout ?? row?.flatWorktreeLayout ?? false;

	if (project.worktreeBaseDir) {
		return flat
			? join(project.worktreeBaseDir, branch)
			: join(project.worktreeBaseDir, project.name, branch);
	}

	const baseDir =
		row?.worktreeBaseDir ??
		join(homedir(), SUPERSET_DIR_NAME, WORKTREES_DIR_NAME);

	return flat ? join(baseDir, branch) : join(baseDir, project.name, branch);
}
