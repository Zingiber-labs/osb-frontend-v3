import { describe, expect, it } from "vitest";
import { formatClock, periodLabel, STAT_LABEL } from "./format";

describe("format", () => {
  it("labels regulation periods and overtime", () => {
    expect(periodLabel(1)).toBe("Q1");
    expect(periodLabel(4)).toBe("Q4");
    expect(periodLabel(5)).toBe("OT1");
    expect(periodLabel(6)).toBe("OT2");
  });

  it("formats the clock as m:ss", () => {
    expect(formatClock(720)).toBe("12:00");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(0)).toBe("0:00");
  });

  it("has a label per mission stat", () => {
    expect(STAT_LABEL).toEqual({ pts: "PTS", blk: "BLK", stl: "STL" });
  });
});
