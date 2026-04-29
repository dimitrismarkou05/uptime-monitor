/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusIndicator from "./StatusIndicator";

describe("StatusIndicator", () => {
  it("renders UP with emerald styling", () => {
    render(<StatusIndicator status="UP" />);
    expect(screen.getByText("UP")).toHaveClass("text-emerald-600");
  });

  it("renders DOWN with red styling", () => {
    render(<StatusIndicator status="DOWN" />);
    expect(screen.getByText("DOWN")).toHaveClass("text-red-600");
  });

  it("shows pulse by default", () => {
    const { container } = render(<StatusIndicator status="UP" />);
    expect(container.querySelector(".animate-ping")).toBeInTheDocument();
  });

  it("hides pulse when disabled", () => {
    const { container } = render(<StatusIndicator status="UP" pulse={false} />);
    expect(container.querySelector(".animate-ping")).not.toBeInTheDocument();
  });
});
