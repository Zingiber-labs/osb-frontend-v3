import { Navigate, Route, Routes } from "react-router";
import { GamePlayPage } from "@/features/gameplay/components/GamePlayPage";
import { Layout } from "./Layout";
import { NotFoundPage } from "./NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/game-play" replace />} />
        <Route path="game-play" element={<GamePlayPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
