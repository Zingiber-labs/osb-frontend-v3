"use client";

import {
  useInfiniteNotifications,
  useMarkAllAsRead,
  useMarkAsRead,
  useUnreadCount,
} from "@/hooks/notifications/useNotifications";
import { AppNotification } from "@/types/notifications";
import {
  Bell,
  BellOff,
  CheckCheck,
  Gift,
  CheckCircle2,
  Star,
  Trophy,
  Info,
  Loader2,
  X,
  Clock,
  Inbox,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ───────────────────────── shared config ─────────────────────── */

type IconComponent = React.FC<{
  size?: number;
  style?: React.CSSProperties;
  className?: string;
}>;

type TypeCfg = {
  icon: IconComponent;
  color: string;
  bg: string;
  border: string;
  label: string;
};

const TYPE_CFG: Record<string, TypeCfg> = {
  EVENT_REWARD_CLAIMED: {
    icon: Gift as IconComponent,
    color: "#c084fc",
    bg: "rgba(168,85,247,0.15)",
    border: "rgba(168,85,247,0.45)",
    label: "Recompensa",
  },
  MISSION_COMPLETED: {
    icon: CheckCircle2 as IconComponent,
    color: "#34d399",
    bg: "rgba(52,211,153,0.15)",
    border: "rgba(52,211,153,0.45)",
    label: "Misión",
  },
  MISSION_REWARD_CLAIMED: {
    icon: Star as IconComponent,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
    border: "rgba(251,191,36,0.45)",
    label: "Premio",
  },
  RANKING_UP: {
    icon: Trophy as IconComponent,
    color: "#fb923c",
    bg: "rgba(251,146,60,0.15)",
    border: "rgba(251,146,60,0.45)",
    label: "Ranking",
  },
  SYSTEM: {
    icon: Info as IconComponent,
    color: "#22d3ee",
    bg: "rgba(34,211,238,0.15)",
    border: "rgba(34,211,238,0.45)",
    label: "Sistema",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "short" }).format(
    new Date(iso)
  );
}

function fullDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

/* ─────────────────────── list item (compact) ─────────────────── */

function ListItem({
  n,
  isSelected,
  onClick,
}: {
  n: AppNotification;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
  const Icon = cfg.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 transition-all duration-150 border-b border-white/[0.05]"
      style={{
        background: isSelected
          ? `linear-gradient(90deg, ${cfg.bg} 0%, rgba(0,0,0,0) 100%)`
          : n.isRead
          ? "transparent"
          : "rgba(255,255,255,0.04)",
        borderLeft: isSelected
          ? `3px solid ${cfg.color}`
          : n.isRead
          ? "3px solid transparent"
          : `3px solid ${cfg.color}55`,
      }}
    >
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {n.imageUrl ? (
          <img
            src={n.imageUrl}
            alt=""
            className="w-7 h-7 rounded-lg object-cover"
          />
        ) : (
          <Icon size={13} style={{ color: cfg.color }} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-xs leading-snug line-clamp-1 ${
            n.isRead
              ? "text-white/40 font-medium"
              : isSelected
              ? "text-white font-bold"
              : "text-white/80 font-semibold"
          }`}
        >
          {n.title}
        </p>
        <p className="text-[10px] text-white/25 font-mono mt-0.5">
          {timeAgo(n.createdAt)}
        </p>
      </div>

      {!n.isRead && (
        <span
          className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }}
        />
      )}
    </button>
  );
}

/* ─────────────────────── skeleton list item ──────────────────── */

function SkeletonItem() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/[0.05] animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-white/[0.08] flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-white/[0.08] rounded w-5/6" />
        <div className="h-2 bg-white/[0.08] rounded w-2/5" />
      </div>
    </div>
  );
}

/* ───────────────────────── detail pane ───────────────────────── */

function DetailPane({ n }: { n: AppNotification }) {
  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
  const Icon = cfg.icon;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,122,47,0.2) transparent",
      }}
    >
      <div className="px-4 py-4 space-y-4">
        {/* badge + time */}
        <div className="flex items-center justify-between">
          <span
            className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase tracking-widest"
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {cfg.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/25 font-mono">
            <Clock size={9} />
            {timeAgo(n.createdAt)}
          </span>
        </div>

        {/* image */}
        {n.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-white/10">
            <img
              src={n.imageUrl}
              alt=""
              className="w-full h-24 object-cover"
            />
          </div>
        )}

        {/* icon + title */}
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              boxShadow: `0 0 12px ${cfg.border}`,
            }}
          >
            <Icon size={17} style={{ color: cfg.color }} />
          </div>
          <h3 className="text-sm font-extrabold text-white leading-snug pt-1.5">
            {n.title}
          </h3>
        </div>

        {/* divider */}
        <div
          className="h-px"
          style={{
            background: `linear-gradient(90deg, ${cfg.border} 0%, transparent 100%)`,
          }}
        />

        {/* body */}
        <p className="text-xs text-white/60 leading-relaxed">{n.body}</p>

        {/* full date */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] text-white/25"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <Clock size={10} />
          {fullDate(n.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── empty detail ───────────────────────── */

function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-4 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(255,107,47,0.07)",
          border: "1px solid rgba(255,122,47,0.15)",
        }}
      >
        <Inbox size={20} color="rgba(255,255,255,0.15)" />
      </div>
      <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-relaxed">
        Selecciona una<br />notificación
      </p>
    </div>
  );
}

/* ══════════════════════ NotificationBell ═══════════════════════ */

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<AppNotification | null>(null);
  const [dropPos, setDropPos] = useState({ top: 0, right: 0 });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadCount();
  const {
    data: pages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteNotifications();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();
  const { mutate: markAsRead } = useMarkAsRead();

  const unreadCount = unreadData?.unreadCount ?? 0;
  const notifications = pages?.pages.flatMap((p) => p.rows) ?? [];

  /* position dropdown below trigger */
  const calcPos = () => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
  };

  const handleOpen = () => {
    calcPos();
    setOpen((v) => !v);
  };

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* reset selection when closed */
  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  /* sync selected with fresh data */
  useEffect(() => {
    if (!selected) return;
    const fresh = notifications.find((n) => n.id === selected.id);
    if (fresh) setSelected(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  /* infinite scroll */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) fetchNextPage();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const handleSelect = (n: AppNotification) => {
    setSelected(n);
    if (!n.isRead) markAsRead(n.id);
  };

  /* ── render ── */
  const dropdown = open ? (
    <div
      ref={panelRef}
      className="fixed z-[9999] flex flex-col"
      style={{
        top: dropPos.top,
        right: dropPos.right,
        width: 560,
        height: 440,
        background:
          "linear-gradient(160deg, #180801 0%, #2a1006 40%, #3a1809 100%)",
        border: "1px solid rgba(255,122,47,0.30)",
        borderRadius: 16,
        boxShadow:
          "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,122,47,0.1), inset 0 0 60px rgba(0,0,0,0.3)",
        overflow: "hidden",
      }}
    >
      {/* top accent */}
      <div
        className="h-[2px] w-full flex-shrink-0"
        style={{
          background:
            "linear-gradient(90deg, #FF6B2F 0%, #7cf8ff 50%, #FF6B2F 100%)",
          opacity: 0.8,
        }}
      />

      {/* header */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 gap-3"
        style={{
          borderBottom: "1px solid rgba(255,122,47,0.18)",
          background:
            "linear-gradient(90deg, rgba(255,107,47,0.08) 0%, transparent 100%)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(255,107,47,0.18)",
              border: "1px solid rgba(255,122,47,0.4)",
              boxShadow: "0 0 12px rgba(255,107,47,0.35)",
            }}
          >
            <Bell size={13} color="#ff7a2f" />
          </div>
          <div>
            <h2
              className="text-xs font-extrabold uppercase tracking-[0.18em] leading-none"
              style={{ color: "#7cf8ff" }}
            >
              NOTIFICACIONES
            </h2>
            <p className="text-[10px] text-white/35 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día ✓"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              disabled={isMarkingAll}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40"
              style={{
                background: "rgba(124,248,255,0.07)",
                border: "1px solid rgba(124,248,255,0.22)",
                color: "#7cf8ff",
              }}
            >
              {isMarkingAll ? (
                <Loader2 size={9} className="animate-spin" />
              ) : (
                <CheckCheck size={9} />
              )}
              Leer todo
            </button>
          )}
          <button
            onClick={() => setOpen(false)}
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* split body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — list */}
        <div
          className="flex flex-col overflow-hidden"
          style={{
            width: 200,
            flexShrink: 0,
            borderRight: "1px solid rgba(255,122,47,0.14)",
          }}
        >
          <div
            className="flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,122,47,0.2) transparent",
            }}
          >
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonItem key={i} />
              ))
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 gap-2">
                <BellOff size={22} color="rgba(255,255,255,0.12)" />
                <p className="text-[10px] text-white/20 uppercase tracking-wider font-bold text-center">
                  Sin notif.
                </p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <ListItem
                    key={n.id}
                    n={n}
                    isSelected={selected?.id === n.id}
                    onClick={() => handleSelect(n)}
                  />
                ))}
                {hasNextPage && (
                  <div ref={sentinelRef} className="py-3 flex justify-center">
                    {isFetchingNextPage && (
                      <Loader2
                        size={13}
                        className="animate-spin"
                        style={{ color: "rgba(255,122,47,0.45)" }}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT — detail */}
        <div
          className="flex-1 overflow-hidden"
          style={{
            minWidth: 0,
            background:
              "linear-gradient(160deg, #1a0902 0%, #2d1107 50%, #381608 100%)",
          }}
        >
          {selected ? <DetailPane n={selected} /> : <EmptyDetail />}
        </div>
      </div>

      {/* bottom bar */}
      <div
        className="flex-shrink-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,107,47,0.6) 0%, rgba(124,248,255,0.35) 50%, rgba(255,107,47,0.6) 100%)",
        }}
      />
    </div>
  ) : null;

  return (
    <>
      {/* ── trigger button ── */}
      <button
        ref={triggerRef}
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200
          hover:scale-105 active:scale-95"
        style={{
          background: open
            ? "rgba(255,107,47,0.25)"
            : "rgba(255,107,47,0.12)",
          border: `1px solid ${open ? "rgba(255,122,47,0.6)" : "rgba(255,122,47,0.3)"}`,
          boxShadow: open
            ? "0 0 20px rgba(255,107,47,0.4), inset 0 0 8px rgba(255,107,47,0.1)"
            : "0 0 12px rgba(255,107,47,0.15)",
        }}
      >
        <Bell
          size={16}
          style={{ color: open ? "#ff7a2f" : "rgba(255,255,255,0.8)" }}
        />

        {/* unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5
              flex items-center justify-center rounded-full
              text-white text-[9px] font-extrabold animate-pulse"
            style={{
              background: "linear-gradient(135deg, #ff3b00 0%, #ff6b2f 100%)",
              boxShadow:
                "0 0 8px rgba(255,60,0,0.7), 0 0 3px rgba(255,60,0,0.5)",
              border: "1.5px solid rgba(255,150,100,0.5)",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── portal dropdown ── */}
      {typeof window !== "undefined" &&
        createPortal(dropdown, document.body)}
    </>
  );
};
