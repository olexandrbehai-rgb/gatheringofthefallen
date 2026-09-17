// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OwnerAnalytics from "./OwnerAnalytics";

const useUser = vi.hoisted(() => vi.fn());

vi.mock("@clerk/react", () => ({ useUser }));
vi.mock("wouter", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Redirect: () => null,
}));
vi.mock("@/components/GlitchButton", () => ({
  GlitchButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
}));

const stats = {
  rangeDays: 30,
  summary: { page_views: 2, unique_visitors: 1, total_events: 3 },
  events: [],
  daily: [],
  topPages: [],
  recentEvents: [],
  trustedDevice: {
    registeredAt: "2026-09-17T12:30:00.000Z",
    recentEvents: [
      {
        event_type: "replaced",
        created_at: "2026-09-17T12:30:00.000Z",
      },
      {
        event_type: "registered",
        created_at: "2026-09-16T08:15:00.000Z",
      },
    ],
  },
};

function response(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("OwnerAnalytics trusted-device recovery", () => {
  beforeEach(() => {
    useUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
      user: { primaryEmailAddress: { emailAddress: "owner@example.com" } },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("lets the owner confirm recovery and reloads activity with the replacement cookie", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(403, { error: "Trusted device required" }))
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(200, stats));

    render(<OwnerAnalytics />);

    const startRecovery = await screen.findByRole("button", { name: "Почати відновлення" });
    await userEvent.click(startRecovery);
    await userEvent.click(screen.getByRole("button", { name: "Підтвердити відкликання" }));

    await screen.findByText("Перегляди сторінок");

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("api/owner/device/recover"),
      expect.objectContaining({
        method: "POST",
        credentials: "same-origin",
        body: JSON.stringify({ confirm: true }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("api/owner/activity"),
      { credentials: "same-origin" },
    );
  });

  it("keeps recovery guidance visible after a failed request and lets the owner retry", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(403, { error: "Trusted device required" }))
      .mockResolvedValueOnce(response(500, { error: "Recovery service unavailable" }))
      .mockResolvedValueOnce(response(204))
      .mockResolvedValueOnce(response(200, stats));

    render(<OwnerAnalytics />);

    await userEvent.click(await screen.findByRole("button", { name: "Почати відновлення" }));
    await userEvent.click(screen.getByRole("button", { name: "Підтвердити відкликання" }));

    expect(await screen.findByText("Recovery service unavailable")).toBeTruthy();
    expect(screen.getByText(/Якщо довірений пристрій втрачено/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Підтвердити відкликання" })).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await userEvent.click(screen.getByRole("button", { name: "Підтвердити відкликання" }));

    await screen.findByText("Перегляди сторінок");
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining("api/owner/activity"),
      { credentials: "same-origin" },
    );
  });

  it("never shows recovery controls to a non-owner", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(response(403, { error: "Owner access required" }));

    render(<OwnerAnalytics />);

    await screen.findByText("Owner access required");
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Почати відновлення" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Підтвердити відкликання" })).toBeNull();
    });
  });

  it("shows when the trusted device was registered and explains replacement", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response(200, stats));

    render(<OwnerAnalytics />);

    expect(await screen.findByText(/Зареєстровано або замінено:/)).toBeTruthy();
    expect(screen.getByText(/анулює cookie попереднього пристрою/)).toBeTruthy();
    expect(screen.getByText("Заміна довіреного пристрою")).toBeTruthy();
    expect(screen.getByText("Реєстрація довіреного пристрою")).toBeTruthy();
  });
});