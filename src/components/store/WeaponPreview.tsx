"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useBuyStoreItem } from "@/hooks/store-page/useStoreItems";
import { StoreItem } from "@/types/store-items";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";
import DialogConfirmation from "./DialogConfirmation";
import DialogError from "./DialogError";
import DialogSuccessfull from "./DialogSuccessfull";

function getApiErrorMessage(error: unknown) {
  const errorAny = error as any;
  const messageFromResponse = errorAny?.response?.data?.message;
  return messageFromResponse || "Something went wrong.";
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

const DEFAULT_QUANTITY = 1;

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
  const { mutate: buyStoreItem, isPending: isBuying } = useBuyStoreItem();

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Reset image error state whenever a different weapon is selected
  React.useEffect(() => {
    setImgError(false);
  }, [weapon.id]);
  const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [showQuantityValidationError, setShowQuantityValidationError] =
    useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [quantityInputValue, setQuantityInputValue] = useState<string>(
    String(quantity)
  );

  const setQuantityInputFromNumber = (nextQuantity: number) => {
    setQuantityInputValue(String(nextQuantity));
  };

  const resetQuantityUI = () => {
    setQuantityInputValue(String(DEFAULT_QUANTITY));
    onQuantityChange(DEFAULT_QUANTITY);
    setShowQuantityValidationError(false);
  };

  const openConfirmDialog = () => {
    if (quantity < 1) {
      setShowQuantityValidationError(true);
      toast.error("Quantity must be at least 1 item.");
      return;
    }

    setShowQuantityValidationError(false);
    setIsConfirmDialogOpen(true);
  };

  const closeAllDialogsAndModal = () => {
    resetQuantityUI();

    setIsConfirmDialogOpen(false);
    setIsSuccessDialogOpen(false);
    setIsErrorDialogOpen(false);

    setErrorMessage("");
    onOpenChange(false);
  };

  const handleConfirmPurchase = () => {
    buyStoreItem(
      { itemId: weapon.id, quantity },
      {
        onSuccess: () => {
          setIsConfirmDialogOpen(false);
          setIsSuccessDialogOpen(true);
        },
        onError: (error) => {
          const errorText = getApiErrorMessage(error);
          setErrorMessage(errorText);

          setIsConfirmDialogOpen(false);
          setIsErrorDialogOpen(true);
        },
      }
    );
  };

  const handleIncreaseQuantity = () => {
    setShowQuantityValidationError(false);
    onIncrease();
    setQuantityInputFromNumber(quantity + 1);
  };

  const handleDecreaseQuantity = () => {
    setShowQuantityValidationError(false);
    onDecrease();
    setQuantityInputFromNumber(Math.max(0, quantity - 1));
  };

  const handleQuantityInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = e.target.value;

    // Allow empty while typing
    if (inputValue === "") {
      setQuantityInputValue("");
      setShowQuantityValidationError(false);
      onQuantityChange(0);
      return;
    }

    // Only numbers
    if (!/^\d+$/.test(inputValue)) return;

    const parsedQuantity = parseInt(inputValue, 10);

    setQuantityInputValue(String(parsedQuantity));
    setShowQuantityValidationError(false);
    onQuantityChange(parsedQuantity);
  };

  const normalizeQuantityOnBlur = () => {
    const parsed = parseInt(quantityInputValue, 10);
    const normalizedQuantity = Number.isFinite(parsed) ? parsed : 0;

    if (normalizedQuantity < 1) {
      setShowQuantityValidationError(true);
      setQuantityInputFromNumber(DEFAULT_QUANTITY);
      onQuantityChange(DEFAULT_QUANTITY);
      return;
    }

    setQuantityInputFromNumber(normalizedQuantity);
    onQuantityChange(normalizedQuantity);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          onOpenChange(isOpen);

          if (!isOpen) {
            resetQuantityUI();
          } else {
            setQuantityInputValue(String(quantity));
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
              <div className="relative w-full h-[220px]">
                <Image
                  src={imgError ? "/img/gun.svg" : (weapon.iconUrl || "/img/gun.svg")}
                  alt={weapon.name}
                  fill
                  sizes="500px"
                  className="object-contain"
                  onError={() => setImgError(true)}
                  priority
                />
              </div>
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
                  onClick={handleDecreaseQuantity}
                >
                  <Minus className="w-4 h-4 stroke-[3]" />
                </button>

                <Input
                  inputMode="numeric"
                  value={quantityInputValue}
                  onChange={handleQuantityInputChange}
                  onBlur={normalizeQuantityOnBlur}
                  aria-label="Quantity"
                  className="w-16 h-9 text-center text-sm bg-black/30 border-white/30 text-white
                             focus-visible:ring-0 focus-visible:ring-offset-0"
                />

                <button
                  aria-label="Increase quantity"
                  onClick={handleIncreaseQuantity}
                  className="grid place-items-center w-8 h-8 rounded-full border-2 border-white/90 text-white
                             hover:bg-white hover:text-black transition-colors"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            </div>
            {showQuantityValidationError && (
              <p className="text-sm text-red-400 text-center mt-2">
                You must select at least 1 item.
              </p>
            )}

            <Button
              onClick={openConfirmDialog}
              className="w-full bg-secondary hover:bg-secondary-500 text-black rounded-full px-6 py-2"
            >
              Buy Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DialogConfirmation
        open={isConfirmDialogOpen}
        quantity={quantity}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmPurchase}
        onCancel={() => setIsConfirmDialogOpen(false)}
        isLoading={isBuying}
      />

      <DialogSuccessfull
        open={isSuccessDialogOpen}
        quantity={quantity}
        onOpenChange={(isOpen) => {
          setIsSuccessDialogOpen(isOpen);
          if (!isOpen) closeAllDialogsAndModal();
        }}
        onGoInventory={() => {
          closeAllDialogsAndModal();
          router.push("/inventory");
        }}
        onBackToStore={closeAllDialogsAndModal}
      />

      <DialogError
        open={isErrorDialogOpen}
        message={errorMessage}
        onOpenChange={(isOpen) => {
          setIsErrorDialogOpen(isOpen);
          if (!isOpen) closeAllDialogsAndModal();
        }}
        onRetry={() => {
          setIsErrorDialogOpen(false);
          openConfirmDialog();
        }}
        onBackToStore={closeAllDialogsAndModal}
      />
    </>
  );
}
