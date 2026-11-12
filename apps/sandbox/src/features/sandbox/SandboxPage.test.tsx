import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { HULL_MAX } from "@osb/gameplay";
import { SandboxPage } from "./SandboxPage";

const enqueue = vi.fn();
const syncState = vi.fn();

vi.mock("../../../../../packages/gameplay/src/renderer/ScenarioRenderer", () => ({
  ScenarioRenderer: class {
    mount = vi.fn(() => Promise.resolve());
    destroy = vi.fn();
    enqueue = enqueue;
    syncState = syncState;
    whenIdle = () => Promise.resolve();
  },
}));

async function renderSandbox() {
  render(
    <StrictMode>
      <MemoryRouter initialEntries={["/sandbox"]}>
        <SandboxPage />
      </MemoryRouter>
    </StrictMode>,
  );
  await act(async () => {
    await Promise.resolve();
  });
}

describe("SandboxPage", () => {
  beforeEach(() => {
    enqueue.mockClear();
    syncState.mockClear();
  });

  it("enqueues the sample action behind each button", async () => {
    await renderSandbox();
    fireEvent.click(screen.getByRole("button", { name: /fire cruiser charged/i }));
    expect(enqueue).toHaveBeenCalledWith([{ type: "fire", size: "cruiser", charged: true, caption: "COWARD +3" }]);
    expect(screen.queryByRole("button", { name: /pause|resume|step/i })).toBeNull();
  });

  it("syncs hull and shield to the renderer, clamped to the engine ranges", async () => {
    await renderSandbox();
    fireEvent.change(screen.getByLabelText(/hull/i), { target: { value: "20" } });
    expect(syncState).toHaveBeenLastCalledWith(expect.objectContaining({ hull: 20, shield: 0, status: "live" }));
    fireEvent.change(screen.getByLabelText(/shield/i), { target: { value: "9" } });
    expect(syncState).toHaveBeenLastCalledWith(expect.objectContaining({ hull: 20, shield: 3 }));
    fireEvent.change(screen.getByLabelText(/hull/i), { target: { value: "500" } });
    expect(syncState).toHaveBeenLastCalledWith(expect.objectContaining({ hull: HULL_MAX }));
  });

  it("is reachable at /sandbox from the header nav", () => {
    render(
      <MemoryRouter initialEntries={["/sandbox"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /sandbox/i })).toHaveAttribute("href", "/sandbox");
    expect(screen.getByRole("heading", { name: /sandbox/i })).toBeInTheDocument();
  });
});
