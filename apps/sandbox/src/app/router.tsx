import { Navigate, Route, Routes } from "react-router";
import { RulesPage } from "@/features/rules/RulesPage";
import { SandboxPage } from "@/features/sandbox/SandboxPage";
import { Layout } from "./Layout";
import { NotFoundPage } from "./NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/sandbox" replace />} />
        <Route path="reglas" element={<RulesPage />} />
        <Route path="sandbox" element={<SandboxPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
