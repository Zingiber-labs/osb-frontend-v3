"use client";

import { LockerSeason } from "@/types/locker-room";
import { Lock } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LockerSeasonGridProps {
  season: LockerSeason;
}

export default function LockerSeasonGrid({ season }: LockerSeasonGridProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  return (
    <TooltipProvider>
      <div 
        className="grid gap-2 bg-black/20 p-4 rounded-xl border border-primary/20"
        style={{
          gridTemplateColumns: `repeat(${season.gridSize}, 1fr)`,
        }}
      >
        {season.pieces.sort((a, b) => a.index - b.index).map((piece) => (
          <Tooltip key={piece.pieceId}>
            <TooltipTrigger asChild>
              <div 
                className="relative aspect-square rounded-lg overflow-hidden bg-primary/10 border border-primary/30 flex items-center justify-center transform transition-transform hover:scale-105 duration-200 cursor-help"
              >
                {piece.unlocked && piece.url && !imgErrors[piece.pieceId] ? (
                  <Image
                    src={piece.url}
                    alt={`Piece ${piece.index}`}
                    fill
                    sizes="(max-width: 768px) 33vw, 20vw"
                    className="object-cover"
                    onError={() => setImgErrors(prev => ({ ...prev, [piece.pieceId]: true }))}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-primary/40">
                    <Lock className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-[10px] uppercase font-bold tracking-tighter tabular-nums">
                      {piece.index + 1}
                    </span>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-black border border-primary/40 text-white">
              <div className="flex flex-col gap-1 py-1">
                <p className="font-black text-secondary uppercase tracking-wider text-[10px]">
                  PIECE #{piece.index + 1}
                </p>
                <p className="text-sm font-bold">
                  {piece.unlocked ? "UNLOCKED" : "LOCKED"}
                </p>
                {piece.unlocked && piece.unlockedAt && (
                  <p className="text-[10px] text-white/60 tabular-nums">
                    Collected on: {formatDate(piece.unlockedAt)}
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
