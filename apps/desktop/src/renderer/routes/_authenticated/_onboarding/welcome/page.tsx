import { Spinner } from "@superset/ui/spinner";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { StartView } from "renderer/screens/main/components/StartView";
import { navigateToWorkspace } from "../../_dashboard/utils/workspace-navigation";

export const Route = createFileRoute("/_authenticated/_onboarding/welcome/")({
	component: WelcomePage,
});

function WelcomePage() {
	const navigate = useNavigate();
	const { data: workspaces, isLoading } =
		electronTrpc.workspaces.getAllGrouped.useQuery();

	const allWorkspaces = workspaces?.flatMap((group) => group.workspaces) ?? [];

	useEffect(() => {
		if (isLoading || allWorkspaces.length === 0) return;

		const lastViewedId = localStorage.getItem("lastViewedWorkspaceId");
		const targetWorkspace =
			allWorkspaces.find((workspace) => workspace.id === lastViewedId) ??
			allWorkspaces[0];

		if (targetWorkspace) {
			void navigateToWorkspace(targetWorkspace.id, navigate, { replace: true });
		}
	}, [allWorkspaces, isLoading, navigate]);

	if (isLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner className="size-5" />
			</div>
		);
	}

	if (allWorkspaces.length > 0) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner className="size-5" />
			</div>
		);
	}

	return <StartView />;
}
