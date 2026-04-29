/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Dashboard from "./Dashboard";
import {
  useMonitors,
  useCreateMonitor,
  useUpdateMonitor,
  useDeleteMonitor,
} from "../hooks/useMonitors";
import type { ReactNode } from "react";

vi.mock("../hooks/useMonitors");

const Wrapper = ({ children }: { children: ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  </MemoryRouter>
);

type MonitorsHook = ReturnType<typeof useMonitors>;
type CreateHook = ReturnType<typeof useCreateMonitor>;
type UpdateHook = ReturnType<typeof useUpdateMonitor>;
type DeleteHook = ReturnType<typeof useDeleteMonitor>;

const mockMonitor = {
  id: "1",
  user_id: "u1",
  url: "https://up.com",
  interval_seconds: 300,
  is_active: true,
  alert_status: "UP" as const,
  last_alerted_at: null,
  next_check_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe("Dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const setup = () => {
    vi.mocked(useMonitors).mockReturnValue({
      data: [mockMonitor],
      isLoading: false,
      error: null,
    } as unknown as MonitorsHook);
    vi.mocked(useCreateMonitor).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as CreateHook);
    vi.mocked(useUpdateMonitor).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as UpdateHook);
    vi.mocked(useDeleteMonitor).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as DeleteHook);
  };

  it("renders monitors and stats", () => {
    setup();
    render(<Dashboard />, { wrapper: Wrapper });
    expect(screen.getByText(/1\s*UP/i)).toBeInTheDocument();
  });

  it("opens add monitor form", () => {
    setup();
    render(<Dashboard />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole("button", { name: /add monitor/i }));
    expect(
      screen.getByRole("heading", { name: /new monitor/i }),
    ).toBeInTheDocument();
  });

  it("renders error state", () => {
    vi.mocked(useMonitors).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed"),
    } as unknown as MonitorsHook);

    render(<Dashboard />, { wrapper: Wrapper });
    expect(screen.getByText(/Failed to load monitors/i)).toBeInTheDocument();
  });

  it("filters monitors by search query and status", async () => {
    setup();
    render(<Dashboard />, { wrapper: Wrapper });

    // Search filter
    fireEvent.change(screen.getByPlaceholderText("Search URLs..."), {
      target: { value: "not-a-match" },
    });
    expect(screen.queryByText("https://up.com")).not.toBeInTheDocument();

    // Status filter
    fireEvent.change(screen.getByPlaceholderText("Search URLs..."), {
      target: { value: "" },
    }); // reset
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "DOWN" },
    });
    expect(screen.queryByText("https://up.com")).not.toBeInTheDocument();
  });
});
