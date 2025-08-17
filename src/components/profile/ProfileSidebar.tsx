"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  Facebook,
  Instagram,
  Youtube,
  X as XIcon,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import { CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Payment =
  | { type: "VISA"; last4: string; expiry: string; default?: boolean }
  | { type: "MASTERCARD"; last4: string; expiry: string; default?: boolean }
  | { type: "PayPal"; email: string; name: string; default?: boolean }
  | { type: "Binance"; id: string; email: string; default?: boolean };

const PM_ICONS: Record<string, string> = {
  VISA: "/icons/payments/visa.svg",
  MASTERCARD: "/icons/payments/mastercard.svg",
  PayPal: "/icons/payments/paypal.svg",
  BINANCE: "/icons/payments/binance.svg",
};

export type ProfileSidebarProps = {
  user: {
    name: string;
    username: string;
    status: "online" | "offline";
    memberSince: string;
    email: string;
    socials?: {
      x?: string;
      instagram?: string;
      youtube?: string;
      facebook?: string;
    };
    payments: Payment[];
    avatarUrl?: string;
  };
  onSetDefaultPayment?: (index: number) => void;
  onEditProfile?: () => void;
};

export default function ProfileSidebar({
  user,
  onSetDefaultPayment,
  onEditProfile,
}: ProfileSidebarProps) {
  return (
    <div className="flex flex-col gap-4 w-full">
      <Card
        className="
         w-full h-fit rounded-[16px] border border-primary p-4
          bg-primary/35 text-white flex flex-col gap-4
        "
      >
        <div className="flex items-stretch justify-between gap-4 min-w-0">
          <Avatar className="size-[85px] border-none">
            <AvatarImage src={user.avatarUrl} alt={`${user.name} avatar`} />
            <AvatarFallback className="bg-black/30">
              {user.name?.[0]?.toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex w-14 flex-col items-end justify-between self-stretch pl-2">
            <button
              onClick={onEditProfile}
              aria-label="Edit profile"
              className="
                size-[24px]
                inline-flex items-center justify-center rounded-full
                hover:cursor-pointer hover:text-black
                transition
              "
            >
              <Pencil className="size-[18px] text-secondary" />
            </button>
            <span
              className={`
              text-sm tracking-wide uppercase
              ${
                user.status === "online"
                  ? "text-green-32 font-semibold"
                  : "bg-zinc-600 text-white"
              }
            `}
            >
              {user.status}
            </span>
          </div>
        </div>
        <p className="text-[34px] font-bold">{user.name}</p>
        <p className="text-xl font-bold">{user.username}</p>
        <p className="text-xs font-light">Members since: {user.memberSince}</p>
        <div className="text-sm font-medium flex items-center gap-2">
          <Mail className="inline-block" />
          <span>{user.email}</span>
        </div>
        <div className="flex justify-between items-center text-sm font-medium gap-4">
          {user.socials &&
            Object.entries(user.socials).map(([key, value]) => (
              <span className="inline-flex items-center gap-1" key={key}>
                {key === "facebook" && (
                  <Facebook className="h-4 w-4 text-white/80" />
                )}
                {key === "instagram" && (
                  <Instagram className="h-4 w-4 text-white/80" />
                )}
                {key === "youtube" && (
                  <Youtube className="h-4 w-4 text-white/80" />
                )}
                {key === "x" && <XIcon className="h-4 w-4 text-white/80" />}
                <span className="text-white/80">{value}</span>
              </span>
            ))}
        </div>
      </Card>
      <div className="flex flex-col gap-4 mt-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-secondary">
            My Payment Method
          </h2>
          <button
            aria-label="Edit Payment Method"
            onClick={() => {}}
            className="
                size-[24px]
                inline-flex items-center justify-center rounded-full
                hover:cursor-pointer hover:text-black
                transition
              "
          >
            <Pencil className="size-[18px] text-secondary" />
          </button>
        </div>
        {/* payment methods */}
        <div className="space-y-3">
          {user.payments.map((p, i) => {
            const isDefault = "default" in p && !!(p as any).default;
            const type = (p as any).type as string;
            const iconSrc = PM_ICONS[type];

            return (
              <div
                key={i}
                className="rounded-[16px] border border-primary bg-primary/35 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {iconSrc ? (
                      <Image
                        src={iconSrc}
                        alt={type}
                        width={22}
                        height={22}
                        className="brightness-0 invert"
                      />
                    ) : (
                      <CreditCard className="h-5 w-5 text-white" />
                    )}
                  </div>

                  {isDefault ? (
                    <span className="rounded-full bg-secondary text-black text-xs font-bold uppercase tracking-widest px-3 py-1">
                      Default
                    </span>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => onSetDefaultPayment?.(i)}
                      className="rounded-full bg-primary/35 text-white hover:bg-primary/60 h-7 text-xs uppercase tracking-widest px-3 py-1"
                      variant="secondary"
                      size="sm"
                    >
                      Set as default
                    </Button>
                  )}
                </div>

                <div className="mt-2 text-xs text-white/85 tracking-wide">
                  {"last4" in p && (
                    <>
                      XXXX XXXX XXXX {p.last4} | Expiry {p.expiry}
                    </>
                  )}
                  {"name" in p && <>{p.name} </>}
                  {"email" in p && <>{p.email}</>}
                  {"value" in p && <>ID: {p.value}</>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
