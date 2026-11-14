"use client";

import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import AnimatedGift from "./AnimatedGift";

interface ModalGiftProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModalGift = ({ open, onOpenChange }: ModalGiftProps) => {
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
          <div className="flex justify-center mb-4">
            <AnimatedGift />
          </div>

          <div className="text-center">
            <p className="text-secondary text-3xl font-bold">Title Text Here</p>
            <p className="text-base font-light text-card-bg font-helvetica">
              Body information text. Body information text. Body information
              text. Body information text.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalGift;
