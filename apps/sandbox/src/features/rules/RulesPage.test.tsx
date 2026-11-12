import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { AppRoutes } from "@/app/router";
import { HULL_DAMAGE_BY_POINTS, SHIELD_MAX } from "@osb/gameplay";
import { RulesPage } from "./RulesPage";

describe("RulesPage", () => {
  it("explains the rules in Spanish with numbers taken from the engine mapping", () => {
    render(<RulesPage />);
    expect(screen.getByRole("heading", { name: /reglas del escenario/i })).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /^canasta de 3 puntos/i });
    expect(row).toHaveTextContent(`-${HULL_DAMAGE_BY_POINTS[3]}`);
    expect(row).toHaveTextContent(/cruiser/i);
    expect(screen.getByText(new RegExp(`máximo ${SHIELD_MAX}`, "i"))).toBeInTheDocument();
  });

  it("is reachable at /reglas from the header nav", () => {
    render(
      <MemoryRouter initialEntries={["/reglas"]}>
        <AppRoutes />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: /reglas/i })).toHaveAttribute("href", "/reglas");
    expect(screen.getByRole("heading", { name: /reglas del escenario/i })).toBeInTheDocument();
  });
});
