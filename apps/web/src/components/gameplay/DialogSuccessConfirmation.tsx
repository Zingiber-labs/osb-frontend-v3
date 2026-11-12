"use client";

import Image from "next/image";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { useRouter } from "next/navigation";

interface DialogConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel?: () => void;
  imageSrc?: string;
  imageAlt?: string;
  isLoading?: boolean;
  preventCloseWhileLoading?: boolean;
}

const DialogSuccessConfirmation = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  imageSrc = "/img/hangar/mission-success.png",
  imageAlt = "Mission success",
  isLoading = false,
  preventCloseWhileLoading = true,
}: DialogConfirmationProps) => {
  const router = useRouter();
  const blockClose = preventCloseWhileLoading && isLoading;

  const close = () => {
    if (blockClose) return;
    onCancel?.();
    onOpenChange(false);
    onConfirm?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && blockClose) return;
        onOpenChange(next);

        if (!next) {
          onCancel?.();
          onConfirm?.();
        }
      }}
    >
      <DialogTitle className="sr-only">Mission success</DialogTitle>

      <DialogContent
        className={[
          "max-w-[560px] p-0",
          "rounded-3xl border-2 border-primary-orange bg-[rgba(92,54,38,0.96)]",
          "shadow-[0_12px_40px_rgba(0,0,0,0.45)] text-white",
        ].join(" ")}
      >
        <div className="px-8 pb-8 pt-10">
          <div className="flex justify-center">
            <Image
              src={imageSrc}
              alt={imageAlt}
              width={280}
              height={280}
              priority
            />
          </div>
          <div className="text-center">
            <p className="text-3xl font-light text-secondary">
              MISSION SUCCESS: WINNER!
            </p>

            <p className="font-helvetica text-lg mt-1.5">
              Congratulations, Captain! You&apos;ve crossed the finish line
              first, conquering the galaxy and securing your place among the
              legends of the cosmos. Well done!
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

export default DialogSuccessConfirmation;
