import type { CardTone, MissionCardData } from "./missionCardRules";

const TONE: Record<CardTone, string> = { mine: "text-hud-mine", gold: "text-hud-gold", neutral: "text-slate-100" };

/** Top-center card. Always mounted (aria-live region); content animates in while a card is set. */
export function MissionCard({ card }: { card: MissionCardData | null }) {
  return (
    <div aria-live="polite" className="flex flex-col items-center text-center font-display">
      {card ? (
        <div key={card.headline} className="flex flex-col items-center gap-1 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500">
          <span className="text-[10px] tracking-[0.4em] text-hud-chrome">{card.eyebrow}</span>
          <span className={`break-words text-balance text-2xl tracking-[0.2em] md:text-3xl xl:text-4xl ${TONE[card.tone]} [text-shadow:0_0_18px_rgba(0,0,0,0.9)]`}>{card.headline}</span>
          {card.subline ? <span className="hidden text-xs tracking-[0.3em] text-slate-300 md:block">{card.subline}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
