"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBuyStoreItem } from "@/hooks/store-page/useStoreItems";
import { StoreItem } from "@/types/store-items";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import DialogConfirmation from "./DialogConfirmation";
import DialogError from "./DialogError";
import DialogSuccessfull from "./DialogSuccessfull";

function getApiErrorMessage(err: unknown) {
  const anyErr = err as any;
  const msgFromData = anyErr?.response?.data?.message;
  return msgFromData || "Something went wrong.";
}

interface WeaponPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weapon: StoreItem;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onQuantityChange: (qty: number) => void;
}

export default function WeaponPreview({
  open,
  onOpenChange,
  weapon,
  quantity,
  onIncrease,
  onDecrease,
  onQuantityChange,
}: WeaponPreviewProps) {
  const router = useRouter();
  const { mutate: buyItem, isPending } = useBuyStoreItem();

  const [openConfirm, setOpenConfirm] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [showQtyError, setShowQtyError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [qtyText, setQtyText] = useState<string>(String(quantity));

  const syncQtyText = (nextQty: number) => setQtyText(String(nextQty));

  const openConfirmation = () => {
    if (quantity < 1) {
      setShowQtyError(true);
      toast.error("Quantity must be at least 1 item.");
      return;
    }
    setShowQtyError(false);
    setOpenConfirm(true);
  };

  const closeAll = () => {
    setQtyText("1");
    setOpenConfirm(false);
    setOpenSuccess(false);
    setOpenError(false);
    setErrorMessage("");
    onOpenChange(false);
  };

  const handleConfirm = () => {
    buyItem(
      { itemId: weapon.id, quantity },
      {
        onSuccess: () => {
          setOpenConfirm(false);
          setOpenSuccess(true);
        },
        onError: (err) => {
          const msg = getApiErrorMessage(err);
          setErrorMessage(msg);
          setOpenConfirm(false);
          setOpenError(true);
        },
      }
    );
  };

  const handleIncrease = () => {
    setShowQtyError(false);
    onIncrease();
    syncQtyText(quantity + 1);
  };

  const handleDecrease = () => {
    setShowQtyError(false);
    onDecrease();
    syncQtyText(Math.max(0, quantity - 1));
  };

  const handleQtyInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (raw === "") {
      setQtyText("");
      setShowQtyError(false);
      onQuantityChange(0);
      return;
    }

    // just numbers
    if (!/^\d+$/.test(raw)) return;
    const next = parseInt(raw, 10);

    setQtyText(String(next));
    setShowQtyError(false);
    onQuantityChange(next);
  };

  const handleQtyBlur = () => {
    const parsed = parseInt(qtyText, 10);
    const normalized = Number.isFinite(parsed) ? parsed : 0;

    if (normalized < 1) {
      setShowQtyError(true);
      syncQtyText(1);
      onQuantityChange(1);
      return;
    }

    syncQtyText(normalized);
    onQuantityChange(normalized);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          onOpenChange(isOpen);

          if (!isOpen) {
            setQtyText("1");
            onQuantityChange(1);
            setShowQtyError(false);
          } else {
            setQtyText(String(quantity));
          }
        }}
      >
        <DialogContent
          className="max-w-[500px] rounded-[1.5rem] border-none
                   bg-gradient-to-b from-[#531700] to-black
                   text-white p-0"
        >
          <div className="p-6 space-y-6">
            <div className="flex justify-center">
              <Image
                src={"/img/gun.svg"}
                alt={weapon.name}
                width={300}
                height={200}
                className="object-contain"
              />
            </div>

            <div>
              <h2 className="text-3xl font-bold text-white">{weapon.name}</h2>
              <p className="text-gray-300 text-base mt-2 leading-relaxed">
                {weapon.description}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-2xl font-mono">{`$ ${weapon.price}`}</p>
              <div className="flex items-center gap-3">
                <button
                  aria-label="Decrease quantity"
                  className="grid place-items-center w-8 h-8 rounded-full border-2 border-white/90 text-white
                             hover:bg-white hover:text-black transition-colors"
                  onClick={handleDecrease}
                >
                  <Minus className="w-4 h-4 stroke-[3]" />
                </button>

                <Input
                  inputMode="numeric"
                  value={qtyText}
                  onChange={handleQtyInputChange}
                  onBlur={handleQtyBlur}
                  aria-label="Quantity"
                  className="w-16 h-9 text-center text-sm bg-black/30 border-white/30 text-white
                             focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                <button
                  aria-label="Increase quantity"
                  onClick={handleIncrease}
                  className="grid place-items-center w-8 h-8 rounded-full border-2 border-white/90 text-white
                             hover:bg-white hover:text-black transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
            {showQtyError && (
              <p className="text-sm text-red-400 text-center mt-2">
                You must select at least 1 item.
              </p>
            )}

            <Button
              onClick={openConfirmation}
              className="w-full bg-secondary hover:bg-secondary-500 text-black rounded-full px-6 py-2"
            >
              Buy Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogConfirmation
        open={openConfirm}
        quantity={quantity}
        onOpenChange={(isOpen) => setOpenConfirm(isOpen)}
        onConfirm={handleConfirm}
        onCancel={() => setOpenConfirm(false)}
        isLoading={isPending}
      />

      <DialogSuccessfull
        open={openSuccess}
        quantity={quantity}
        onOpenChange={(isOpen) => {
          setOpenSuccess(isOpen);
          if (!isOpen) closeAll();
        }}
        onGoInventory={() => {
          closeAll();
          router.push("/inventory");
        }}
        onBackToStore={closeAll}
      />

      <DialogError
        open={openError}
        message={errorMessage}
        onOpenChange={(isOpen) => {
          setOpenError(isOpen);
          if (!isOpen) closeAll();
        }}
        onRetry={() => {
          setOpenError(false);
          openConfirmation();
        }}
        onBackToStore={closeAll}
      />
    </>
  );
}
