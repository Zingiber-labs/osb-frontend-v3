import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SegmentBar } from "./SegmentBar";

const filled = (c: HTMLElement) => c.querySelectorAll('[data-filled="true"]').length;
const empty = (c: HTMLElement) => c.querySelectorAll('[data-filled="false"]').length;

describe("SegmentBar", () => {
  it("exposes progressbar semantics and fills proportionally, rounding up", () => {
    const { container } = render(<SegmentBar label="hull" value={62} max={100} segments={20} />);
    const bar = screen.getByRole("progressbar", { name: "hull" });
    expect(bar).toHaveAttribute("aria-valuenow", "62");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(filled(container)).toBe(13);
    expect(empty(container)).toBe(7);
  });

  it("keeps one segment lit at the hull floor and none at zero", () => {
    const a = render(<SegmentBar label="hull" value={1} max={100} segments={20} />);
    expect(filled(a.container)).toBe(1);
    a.unmount();
    const b = render(<SegmentBar label="shield" value={0} max={3} segments={3} />);
    expect(filled(b.container)).toBe(0);
    expect(empty(b.container)).toBe(3);
  });

  it("rounds exactly for integer values (no float overshoot)", () => {
    const { container } = render(<SegmentBar label="hull" value={28} max={100} segments={25} />);
    expect(filled(container)).toBe(7);
  });

  it("marks the low state", () => {
    const { container } = render(<SegmentBar label="hull" value={20} max={100} segments={20} low />);
    expect(container.firstElementChild).toHaveAttribute("data-low", "true");
  });
});
