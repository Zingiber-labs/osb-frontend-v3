"use client";

import Hangar from "@/components/hangar/Hangar";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function HangarPage() {
  const [showHangar, setShowHangar] = useState(false);

  return (
    <div>
      {!showHangar && (
        <div className="min-h-[calc(100dvh-104px-91.83px)] text-white flex flex-col justify-center items-center">
          <h2 className="text-[34px]">one mission, one match, one destiny</h2>
          <h2 className="text-[34px]">Make your choise!</h2>
          <Button
            variant="secondary"
            className="rounded-full min-w-28"
            onClick={() => setShowHangar(!showHangar)}
          >
            Play
          </Button>
        </div>
      )}
      {showHangar && <Hangar />}
    </div>
  );
}
