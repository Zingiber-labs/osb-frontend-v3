"use client";

import AnimatedBall from "../commons/AnimatedBall";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

interface DialogSuccessfullProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoInventory?: () => void;
  onBackToStore?: () => void;
  quantity?: number;
}

const DialogSuccessfull = ({
  open,
  onOpenChange,
  onGoInventory,
  onBackToStore,
}: DialogSuccessfullProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Purchase successful</DialogTitle>

      <DialogContent
        className={[
          "max-w-[560px] p-0",
          "rounded-3xl border-2 border-primary-orange bg-[rgba(92,54,38,0.96)]",
          "shadow-[0_12px_40px_rgba(0,0,0,0.45)] text-white",
        ].join(" ")}
      >
        <div className="px-8 pb-8 pt-10">
          <div className="flex justify-center">
            <AnimatedBall />
          </div>

          <div className="text-center">
            <p className="text-secondary text-3xl font-bold">You Got It!</p>
            <p className="text-base font-light text-card-bg font-helvetica">
              Your purchase is complete: your new items are waiting in your
              inventory.
            </p>

            <Button
              onClick={onGoInventory}
              className="mt-4 w-full rounded-full bg-black hover:bg-black/70 py-5 text-base font-extrabold uppercase tracking-widest cursor-pointer"
            >
              View in my inventory
            </Button>

            <Button
              onClick={onBackToStore}
              variant="link"
              className="text-white"
            >
              Back to store
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogSuccessfull;
