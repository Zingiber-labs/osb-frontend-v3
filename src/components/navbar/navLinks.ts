import { Backpack, LayoutGrid, Rocket, Store, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * Single source of truth for primary navigation. Consumed by both NavMenu
 * (desktop row) and MobileTabBar (bottom bar), so the two can never drift.
 *
 * "Hangar" points at /missions deliberately — it preserves existing team
 * vocabulary. The /hangar route is the post-accept step (pick player, then
 * Play) reached from MissionPanel, not a top-level destination.
 */
export const navLinks: NavLink[] = [
  { label: "Menu", href: "/", icon: LayoutGrid },
  { label: "Hangar", href: "/missions", icon: Rocket },
  { label: "Store", href: "/store", icon: Store },
  { label: "Inventory", href: "/inventory", icon: Backpack },
  { label: "Ranking", href: "/ranking", icon: Trophy },
];
