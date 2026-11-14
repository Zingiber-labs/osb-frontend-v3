"use client";

import { XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";

interface DialogErrorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: () => void;
  onBackToStore?: () => void;
  message?: string;
}

const DialogError = ({
  open,
  onOpenChange,
  onRetry,
  onBackToStore,
  message = "We couldn’t complete your purchase. Please try again or go back to the store.",
}: DialogErrorProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Purchase failed</DialogTitle>

      <DialogContent
        className={[
          "max-w-[560px] p-0",
          "rounded-3xl border-2 border-red-500 bg-[rgba(45,20,20,0.96)]",
          "shadow-[0_12px_40px_rgba(0,0,0,0.45)] text-white",
        ].join(" ")}
      >
        <div className="px-8 pb-8 pt-10">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>

          <div className="text-center">
            <p className="text-red-500 text-3xl font-bold">
              Something went wrong
            </p>
            <p className="text-base font-light text-card-bg font-helvetica mt-1">
              {message}
            </p>

            {onRetry && (
              <Button
                onClick={onRetry}
                className="mt-6 w-full rounded-full bg-red-600 hover:bg-red-700 py-5 text-base font-extrabold uppercase tracking-widest cursor-pointer"
              >
                Try Again
              </Button>
            )}

            <Button
              onClick={onBackToStore}
              variant="link"
              className="text-white mt-2"
            >
              Back to store
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DialogError;
