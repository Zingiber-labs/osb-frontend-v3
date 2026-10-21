import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "./router";

describe("AppRoutes", () => {
  it("redirects / to /game-play", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /game play/i })).toBeInTheDocument();
  });

  it("renders the not-found page for unknown paths", () => {
    render(
      <MemoryRouter initialEntries={["/does-not-exist"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: /not found/i })).toBeInTheDocument();
  });
});
