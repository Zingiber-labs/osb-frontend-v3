import { describe, expect, it } from "vitest";
import { pickQuality } from "./quality";

const desktop = { coarsePointer: false, width: 1440, cores: 8 };

describe("pickQuality", () => {
  it("is high on a desktop", () => {
    expect(pickQuality(desktop)).toBe("high");
  });
  it("is low for coarse pointers, narrow screens, or few cores", () => {
    expect(pickQuality({ ...desktop, coarsePointer: true })).toBe("low");
    expect(pickQuality({ ...desktop, width: 600 })).toBe("low");
    expect(pickQuality({ ...desktop, cores: 2 })).toBe("low");
  });
  it("honors a valid override and ignores an invalid one", () => {
    expect(pickQuality({ ...desktop, override: "low" })).toBe("low");
    expect(pickQuality({ ...desktop, coarsePointer: true, override: "high" })).toBe("high");
    expect(pickQuality({ ...desktop, override: "ultra" })).toBe("high");
  });
});
