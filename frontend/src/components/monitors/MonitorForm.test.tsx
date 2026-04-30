/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import MonitorForm from "./MonitorForm";

describe("MonitorForm", () => {
  it("submits entered data", () => {
    const onSubmit = vi.fn();
    render(<MonitorForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://test.com",
      interval_seconds: 300,
      is_active: true,
    });
  });

  it("calls onCancel", () => {
    const onCancel = vi.fn();
    render(<MonitorForm onSubmit={vi.fn()} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("renders initial data", () => {
    render(
      <MonitorForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          url: "https://init.com",
          interval_seconds: 900,
          is_active: false,
        }}
      />,
    );
    expect(screen.getByDisplayValue("https://init.com")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("900");
  });

  it("does not submit empty url", () => {
    const onSubmit = vi.fn();
    render(<MonitorForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders saving state when isLoading is true", () => {
    render(
      <MonitorForm onSubmit={vi.fn()} onCancel={vi.fn()} isLoading={true} />,
    );
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("toggles active state", () => {
    const onSubmit = vi.fn();
    render(<MonitorForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox); // uncheck
    fireEvent.click(checkbox); // check again

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: true,
      }),
    );
  });

  it("prevents double submission when isLoading is true", () => {
    const onSubmit = vi.fn();
    render(
      <MonitorForm onSubmit={onSubmit} onCancel={vi.fn()} isLoading={true} />,
    );

    const submitBtn = screen.getByRole("button", { name: /saving/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("defaults is_active to true when initialData has no is_active field", () => {
    const onSubmit = vi.fn();
    render(
      <MonitorForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        initialData={{ url: "https://init.com", interval_seconds: 900 }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      url: "https://test.com",
      interval_seconds: 900,
      is_active: true,
    });
  });

  it("uses true is_active from initialData without coalescing", () => {
    render(
      <MonitorForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        initialData={{
          url: "https://init.com",
          interval_seconds: 900,
          is_active: true,
        }}
      />,
    );
    // Just render and verify checkbox is checked — the branch is covered by mounting
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("changes interval selection", () => {
    const onSubmit = vi.fn();
    render(<MonitorForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "900" },
    });
    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ interval_seconds: 900 }),
    );
  });

  it("defaults is_active to true when no initialData provided at all", () => {
    const onSubmit = vi.fn();
    render(<MonitorForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "https://test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true }),
    );
  });

  it("returns early and does not submit if url is completely empty", () => {
    const onSubmit = vi.fn();
    render(<MonitorForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("https://example.com"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save monitor/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
