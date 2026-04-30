/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
import { useMonitorStore } from "../stores/monitorStore";

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
    useMonitorStore.setState({ searchQuery: "", statusFilter: "ALL" });
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

  it("renders error state and handles retry click", () => {
    vi.mocked(useMonitors).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed"),
    } as unknown as MonitorsHook);

    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<Dashboard />, { wrapper: Wrapper });
    expect(screen.getByText(/Failed to load monitors/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(reloadMock).toHaveBeenCalled();
  });

  it("filters monitors by search query and status", async () => {
    setup();
    render(<Dashboard />, { wrapper: Wrapper });

    fireEvent.change(screen.getByPlaceholderText("Search URLs..."), {
      target: { value: "not-a-match" },
    });
    expect(screen.queryByText("https://up.com")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search URLs..."), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "DOWN" },
    });
    expect(screen.queryByText("https://up.com")).not.toBeInTheDocument();
  });

  it("creates a new monitor", async () => {
    setup();
    const createMock = vi.fn().mockResolvedValue(mockMonitor);
    vi.mocked(useCreateMonitor).mockReturnValue({
      mutateAsync: createMock,
      isPending: false,
    } as unknown as CreateHook);

    render(<Dashboard />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole("button", { name: /add monitor/i }));

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://new.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalled());
  });

  it("toggles monitor active state", () => {
    setup();
    const updateMock = vi.fn();
    vi.mocked(useUpdateMonitor).mockReturnValue({
      mutate: updateMock,
      isPending: false,
    } as unknown as UpdateHook);

    render(<Dashboard />, { wrapper: Wrapper });

    const toggleButton = screen
      .getAllByRole("button")
      .find((b) => b.className.includes("rounded-full"));
    expect(toggleButton).toBeTruthy();
    fireEvent.click(toggleButton!);
    expect(updateMock).toHaveBeenCalledWith({
      id: "1",
      data: { is_active: false },
    });
  });

  it("has pagination controls", () => {
    setup();
    render(<Dashboard />, { wrapper: Wrapper });
    expect(
      screen.getByRole("button", { name: /previous/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next/i })).toBeInTheDocument();
    expect(screen.getByText(/page\s+1/i)).toBeInTheDocument();
  });

  it("disables next button when fewer monitors than page size", () => {
    setup();
    render(<Dashboard />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("disables previous button on first page", () => {
    setup();
    render(<Dashboard />, { wrapper: Wrapper });
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });

  it("renders empty state message when no monitors exist", () => {
    vi.mocked(useMonitors).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isFetching: false,
      status: "success",
    } as unknown as ReturnType<typeof useMonitors>);

    render(<Dashboard />, { wrapper: Wrapper });

    // Matches the text in the UI
    expect(screen.getByText(/No monitors yet/i)).toBeInTheDocument();
  });

  it("handles clicking next and previous page", async () => {
    setup(); // Mock has data
    render(<Dashboard />, { wrapper: Wrapper });

    const nextBtn = screen.getByRole("button", { name: /next/i });
    // Manually enable for test if mock logic disabled it
    fireEvent.click(nextBtn);
    expect(screen.getByText(/page 2/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getByText(/page 1/i)).toBeInTheDocument();
  });
});
