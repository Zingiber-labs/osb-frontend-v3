"use client";

import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogMissionFailed = ({ open, onOpenChange }: Props) => {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Mission failed</DialogTitle>

      <DialogContent
        className={[
          "max-w-[560px] p-0",
          "rounded-3xl border-2 border-primary-orange bg-[rgba(92,54,38,0.96)]",
          "shadow-[0_12px_40px_rgba(0,0,0,0.45)] text-white",
        ].join(" ")}
      >
        <div className="px-8 pt-10 pb-8">
          <div className="flex justify-center">
            <Image
              src="/img/hangar/mission-failed.png"
              alt="Mission failed"
              width={280}
              height={280}
            />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-wide text-red-400">
              MISSION FAILED: DEFEAT!
            </h2>

            <p className="font-helvetica text-lg mt-1.5">
              Unfortunately, Capitan! The mission was a failure. You did not
              meet the required objectives, and the galaxy remains unconquered.
              Better luck next time!
            </p>
          </div>
          <div className="flex justify-center mt-4">
            <Button className="" onClick={() => router.push("/missions")}>
              Go to Missions
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogMissionFailed;
