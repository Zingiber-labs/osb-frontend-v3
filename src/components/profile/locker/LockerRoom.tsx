"use client";

import { useLockerRoomProgress } from "@/hooks/locker-room/useLockerRoom";
import { ChevronDown, ChevronUp, Share, Trophy } from "lucide-react";
import { useRef, useState } from "react";
import LockerSeasonGrid from "./LockerSeasonGrid";
import { toPng } from "html-to-image";
import toast from "react-hot-toast";

export default function LockerRoom() {
  const { data: seasons, isLoading, error } = useLockerRoomProgress();
  const [expandedSeason, setExpandedSeason] = useState<string | null>(null);
  const [capturingSeason, setCapturingSeason] = useState<any | null>(null);
  const [captureId, setCaptureId] = useState(0);
  const captureRef = useRef<HTMLDivElement | null>(null);
  
  const getBase64 = async (url: string) => {
    try {
      // Use the Next.js image proxy to avoid CORS when fetching
      const proxiedUrl = `/_next/image?url=${encodeURIComponent(url)}&q=100&w=256`;
      const response = await fetch(proxiedUrl);
      if (!response.ok) throw new Error("Proxy fetch failed");
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Base64 conversion failed for:", url, e);
      return url; // Fallback to original URL
    }
  };

  const handleCapture = async (season: any) => {
    const toastId = toast.loading("Preparing data...");
    setCapturingSeason(null);
    
    try {
      // 1. Deep clone the data
      const clonedSeason = JSON.parse(JSON.stringify(season));
      
      // 2. Pre-fetch and convert all pieces to Base64 (Nuclear Option)
      toast.loading("Fetching images...", { id: toastId });
      const piecePromises = clonedSeason.pieces.map(async (piece: any) => {
        if (piece.unlocked && piece.url) {
          piece.url = await getBase64(piece.url);
        }
        return piece;
      });
      await Promise.all(piecePromises);

      // 3. Set the state and trigger render
      const newId = Date.now();
      setCaptureId(newId);
      setCapturingSeason(clonedSeason);
      
      // 4. Wait for the hidden grid to render
      toast.loading("Rendering capture...", { id: toastId });
      
      setTimeout(async () => {
        const node = captureRef.current;
        if (!node) {
          toast.error("Capture element not found", { id: toastId });
          setCapturingSeason(null);
          return;
        }

        toast.loading("Generating PNG...", { id: toastId });
        try {
          const dataUrl = await toPng(node, {
            cacheBust: true,
            backgroundColor: "#000",
            style: {
              padding: "30px",
              borderRadius: "0",
            }
          });
          const link = document.createElement("a");
          link.download = `locker-room-${season.name.toLowerCase().replace(/\s+/g, "-")}.png`;
          link.href = dataUrl;
          link.click();
          toast.success("Capture downloaded!", { id: toastId });
        } catch (err) {
          console.error("Capture failed:", err);
          if (err instanceof Error) console.error("Error message:", err.message);
          toast.error("Failed to generate capture", { id: toastId });
        } finally {
          setCapturingSeason(null);
        }
      }, 500); // Shorter delay needed since images are already Base64
    } catch (err) {
      console.error("Preparation failed:", err);
      toast.error("Failed to prepare capture data", { id: toastId });
      setCapturingSeason(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 bg-primary/20 rounded-xl border border-primary/30" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-400/10 rounded-xl border border-red-400/20">
        <p className="font-bold">Error loading locker room</p>
        <p className="text-sm opacity-80 mt-1">Please try again later</p>
      </div>
    );
  }

  if (!seasons || seasons.length === 0) {
    return (
      <div className="p-12 text-center text-white/50 border-2 border-dashed border-primary/20 rounded-2xl">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
        <p className="text-xl font-bold">No Active Seasons</p>
        <p className="text-sm mt-2 max-w-xs mx-auto">
          Participate in events to unlock pieces and complete your locker room collections.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-white tracking-widest flex items-center gap-2">
          COLLECTIONS
          <span className="bg-secondary text-black text-[10px] px-2 py-0.5 rounded-full">
            {seasons.length} ACTIVE
          </span>
        </h3>
      </header>

      <div className="flex-1 overflow-y-auto custom-scroll-thin pr-2 h-[calc(100vh-450px)]">
        <div className="flex flex-col gap-4">
          {seasons.map((season) => {
        const isExpanded = expandedSeason === season.seasonId;
        
        return (
          <div 
            key={season.seasonId}
            className={`
              transition-all duration-300 rounded-2xl border-2 overflow-hidden
              ${isExpanded 
                ? "bg-primary/30 border-secondary shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
                : "bg-primary/20 border-primary/40 hover:border-primary/60 hover:bg-primary/25 cursor-pointer"}
            `}
          >
            {/* Season Header */}
            <div 
              className="p-5"
              onClick={() => setExpandedSeason(isExpanded ? null : season.seasonId)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-lg font-black text-white leading-none">
                      {season.name}
                    </h4>
                    {season.isComplete && (
                      <span className="flex items-center gap-1 text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-md border border-secondary/30">
                        <Trophy className="w-3 h-3" />
                        COMPLETED
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 line-clamp-1 mb-4">
                    {season.description}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-secondary transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                        style={{ width: `${season.completionPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {season.unlockedCount}/{season.totalPieces}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center min-w-[60px]">
                  <span className="text-2xl font-black text-white tabular-nums">
                    {season.completionPercent}%
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCapture(season);
                      }}
                      className="
                        flex items-center gap-1.5 px-3 py-1 
                        bg-black/40 hover:bg-secondary/20 
                        border border-white/10 hover:border-secondary/50 
                        rounded-lg transition-all duration-300 group/share
                      "
                      title="Download Capture"
                    >
                      <Share className="w-3.5 h-3.5 text-white/40 group-hover/share:text-secondary group-hover/share:scale-110 transition-transform" />
                      <span className="text-[10px] font-black text-white/40 group-hover/share:text-white uppercase tracking-tighter">
                        SHARE
                      </span>
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-secondary animate-bounce" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/30" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div 
              className={`
                transition-all duration-300 ease-in-out px-5 pb-5
                ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0 pointer-events-none overflow-hidden"}
              `}
            >
              <LockerSeasonGrid season={season} />
            </div>
          </div>
        );
      })}
        </div>
      </div>

      {/* Hidden container for background capturing - technically visible but offscreen for layout engines */}
      <div 
        style={{ 
          position: 'fixed', 
          left: '-5000px', 
          top: '0', 
          visibility: 'visible',
          pointerEvents: 'none',
          zIndex: -1000
        }}
      >
        {capturingSeason && (
          <div ref={captureRef} style={{ width: '600px', backgroundColor: '#000', padding: '20px' }}>
            <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '900', marginBottom: '10px', textAlign: 'center' }}>
              {capturingSeason.name.toUpperCase()}
            </h2>
            <p style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
                COMPLETED: {capturingSeason.completionPercent}%
            </p>
            <LockerSeasonGrid 
              key={`capture-${capturingSeason.seasonId}-${captureId}`} 
              season={capturingSeason} 
              isCapture={true} 
              captureId={captureId}
            />
            <p style={{ color: '#666', fontSize: '10px', marginTop: '20px', textAlign: 'center', letterSpacing: '0.1em' }}>
              OUTER SPORTS BALLER — LOCKER ROOM COLLECTION
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
