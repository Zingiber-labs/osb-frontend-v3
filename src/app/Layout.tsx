import { NavLink, Outlet } from "react-router";

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="flex items-center gap-4 border-b border-slate-800 px-4 py-2">
        <span className="font-bold tracking-widest">OSB</span>
        <nav className="flex gap-3 text-sm">
          <NavLink
            to="/game-play"
            className={({ isActive }) => (isActive ? "text-cyan-300" : "text-slate-400")}
          >
            Game Play
          </NavLink>
        </nav>
      </header>
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
    </div>
  );
}
