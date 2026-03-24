import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import type { Server } from "node:http";
import { BrowserWindow } from "electron";
import { NOTIFICATION_EVENTS } from "shared/constants";
import { notificationsApp, notificationsEmitter } from "./server";

// Add getAllWindows static method to the BrowserWindow mock
const mockWindow = {
	show: mock(() => {}),
	focus: mock(() => {}),
	isMinimized: mock(() => false),
	restore: mock(() => {}),
};
(
	BrowserWindow as unknown as { getAllWindows: () => (typeof mockWindow)[] }
).getAllWindows = mock(() => [mockWindow]);

let server: Server;
let port: number;

beforeAll(async () => {
	await new Promise<void>((resolve) => {
		server = notificationsApp.listen(0, "127.0.0.1", () => {
			const addr = server.address();
			port = typeof addr === "object" && addr ? addr.port : 0;
			resolve();
		});
	});
});

afterAll(() => {
	server?.close();
});

describe("/focus endpoint", () => {
	it("returns 400 when neither tabId nor paneId is provided", async () => {
		const res = await fetch(`http://127.0.0.1:${port}/focus`);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.error).toContain("tabId or paneId is required");
	});

	it("emits FOCUS_TAB event with tabId and paneId", async () => {
		const received: unknown[] = [];
		const handler = (data: unknown) => received.push(data);
		notificationsEmitter.on(NOTIFICATION_EVENTS.FOCUS_TAB, handler);

		const res = await fetch(
			`http://127.0.0.1:${port}/focus?tabId=tab-1&paneId=pane-1`,
		);
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.tabId).toBe("tab-1");
		expect(body.paneId).toBe("pane-1");

		expect(received).toHaveLength(1);
		expect(received[0]).toEqual({
			tabId: "tab-1",
			paneId: "pane-1",
			workspaceId: undefined,
		});

		notificationsEmitter.off(NOTIFICATION_EVENTS.FOCUS_TAB, handler);
	});

	it("emits FOCUS_TAB with only tabId", async () => {
		const received: unknown[] = [];
		const handler = (data: unknown) => received.push(data);
		notificationsEmitter.on(NOTIFICATION_EVENTS.FOCUS_TAB, handler);

		const res = await fetch(`http://127.0.0.1:${port}/focus?tabId=tab-2`);
		expect(res.status).toBe(200);
		expect(received[0]).toEqual({
			tabId: "tab-2",
			paneId: undefined,
			workspaceId: undefined,
		});

		notificationsEmitter.off(NOTIFICATION_EVENTS.FOCUS_TAB, handler);
	});

	it("emits FOCUS_TAB with only paneId", async () => {
		const received: unknown[] = [];
		const handler = (data: unknown) => received.push(data);
		notificationsEmitter.on(NOTIFICATION_EVENTS.FOCUS_TAB, handler);

		const res = await fetch(`http://127.0.0.1:${port}/focus?paneId=pane-3`);
		expect(res.status).toBe(200);
		expect(received[0]).toEqual({
			tabId: undefined,
			paneId: "pane-3",
			workspaceId: undefined,
		});

		notificationsEmitter.off(NOTIFICATION_EVENTS.FOCUS_TAB, handler);
	});

	it("passes workspaceId when provided", async () => {
		const received: unknown[] = [];
		const handler = (data: unknown) => received.push(data);
		notificationsEmitter.on(NOTIFICATION_EVENTS.FOCUS_TAB, handler);

		const res = await fetch(
			`http://127.0.0.1:${port}/focus?tabId=tab-1&paneId=pane-1&workspaceId=ws-1`,
		);
		expect(res.status).toBe(200);
		expect(received[0]).toEqual({
			tabId: "tab-1",
			paneId: "pane-1",
			workspaceId: "ws-1",
		});

		notificationsEmitter.off(NOTIFICATION_EVENTS.FOCUS_TAB, handler);
	});

	it("shows and focuses the main window", async () => {
		mockWindow.show.mockClear();
		mockWindow.focus.mockClear();

		await fetch(`http://127.0.0.1:${port}/focus?tabId=tab-1`);

		expect(mockWindow.show).toHaveBeenCalled();
		expect(mockWindow.focus).toHaveBeenCalled();
	});

	it("restores minimized window before focusing", async () => {
		mockWindow.isMinimized.mockImplementation(() => true);
		mockWindow.restore.mockClear();
		mockWindow.show.mockClear();
		mockWindow.focus.mockClear();

		await fetch(`http://127.0.0.1:${port}/focus?tabId=tab-1`);

		expect(mockWindow.restore).toHaveBeenCalled();
		expect(mockWindow.show).toHaveBeenCalled();
		expect(mockWindow.focus).toHaveBeenCalled();

		// Reset
		mockWindow.isMinimized.mockImplementation(() => false);
	});
});
