"use client";

import { ThreeGameplayCanvas } from "@/components/gameplay/ThreeGameplayCanvas";
import { Suspense } from "react";

const GameplayPage = () => {
  return (
    <Suspense fallback={<div className="p-6 text-white">Loading...</div>}>
      <ThreeGameplayCanvas />
    </Suspense>
  );
};

export default GameplayPage;
