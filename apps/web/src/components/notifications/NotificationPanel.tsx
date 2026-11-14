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
  ArrowLeft,
  Clock,
  Inbox,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

/* ─────────────────────────── types ─────────────────────────── */

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
    label: "Reward",
  },
  MISSION_COMPLETED: {
    icon: CheckCircle2 as IconComponent,
    color: "#34d399",
    bg: "rgba(52,211,153,0.15)",
    border: "rgba(52,211,153,0.45)",
    label: "Mission",
  },
  MISSION_REWARD_CLAIMED: {
    icon: Star as IconComponent,
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.15)",
    border: "rgba(251,191,36,0.45)",
    label: "Prize",
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
    label: "System",
  },
};

/* ────────────────────────── helpers ──────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "short" }).format(new Date(iso));
}

function fullDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(iso));
}

/* ───────────────────── Left: compact list item ──────────────── */

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
      className="w-full text-left flex items-center gap-2.5 px-3 py-3 transition-all duration-150 border-b border-white/[0.05]"
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
          : `3px solid ${cfg.color}44`,
      }}
    >
      {/* icon */}
      <div
        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        {n.imageUrl ? (
          <img src={n.imageUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
        ) : (
          <Icon size={13} style={{ color: cfg.color }} />
        )}
      </div>

      {/* title */}
      <span
        className={`flex-1 text-xs leading-snug line-clamp-2 ${
          n.isRead
            ? "text-white/45 font-medium"
            : isSelected
            ? "text-white font-bold"
            : "text-white/80 font-semibold"
        }`}
      >
        {n.title}
      </span>

      {/* unread dot */}
      {!n.isRead && (
        <span
          className="flex-shrink-0 w-1.5 h-1.5 rounded-full"
          style={{ background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }}
        />
      )}
    </button>
  );
}

/* ──────────────────── Skeleton list item ────────────────────── */

function SkeletonListItem() {
  return (
    <div className="flex items-center gap-2.5 px-3 py-3 border-b border-white/[0.05] animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-white/[0.08] flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-white/[0.08] rounded w-5/6" />
        <div className="h-2 bg-white/[0.08] rounded w-3/5" />
      </div>
    </div>
  );
}

/* ──────────────────────── Detail panel ───────────────────────── */

function DetailPane({ n, onBack }: { n: AppNotification; onBack: () => void }) {
  const cfg = TYPE_CFG[n.type] ?? TYPE_CFG.SYSTEM;
  const Icon = cfg.icon;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* back button (visible on narrow screens) */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-xs text-white/30 hover:text-white/60 transition-colors sm:hidden"
      >
        <ArrowLeft size={12} /> Back
      </button>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* type badge + timestamp */}
        <div className="flex items-center justify-between">
          <span
            className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-widest"
            style={{
              background: cfg.bg,
              color: cfg.color,
              border: `1px solid ${cfg.border}`,
            }}
          >
            {cfg.label}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-white/25 font-mono">
            <Clock size={10} />
            {timeAgo(n.createdAt)}
          </span>
        </div>

        {/* optional image */}
        {n.imageUrl && (
          <div className="rounded-xl overflow-hidden border border-white/10">
            <img src={n.imageUrl} alt="" className="w-full h-32 object-cover" />
          </div>
        )}

        {/* icon + title */}
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center mt-0.5"
            style={{
              background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              boxShadow: `0 0 16px ${cfg.border}`,
            }}
          >
            <Icon size={20} style={{ color: cfg.color }} />
          </div>
          <h3 className="text-base font-extrabold text-white leading-snug pt-1">
            {n.title}
          </h3>
        </div>

        {/* divider */}
        <div
          className="h-px w-full"
          style={{
            background: `linear-gradient(90deg, ${cfg.border} 0%, transparent 100%)`,
          }}
        />

        {/* body */}
        <p className="text-sm text-white/65 leading-relaxed">{n.body}</p>

        {/* full date */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-white/30"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Clock size={11} />
          {fullDate(n.createdAt)}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Empty detail ──────────────────────── */

function EmptyDetail() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{
          background: "rgba(255,107,47,0.07)",
          border: "1px solid rgba(255,122,47,0.15)",
          boxShadow: "0 0 28px rgba(255,107,47,0.07)",
        }}
      >
        <Inbox size={26} color="rgba(255,255,255,0.15)" />
      </div>
      <p className="text-xs text-white/20 font-semibold uppercase tracking-widest leading-relaxed">
        Select a<br />notification
      </p>
    </div>
  );
}

/* ═══════════════════════ NotificationPanel ══════════════════════ */

export interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
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

  const [selected, setSelected] = useState<AppNotification | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keep selected in sync if data refreshes
  useEffect(() => {
    if (!selected) return;
    const fresh = notifications.find((n) => n.id === selected.id);
    if (fresh) setSelected(fresh);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages]);

  // Close resets selection
  useEffect(() => {
    if (!open) setSelected(null);
  }, [open]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) fetchNextPage(); },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const handleSelect = (n: AppNotification) => {
    setSelected(n);
    if (!n.isRead) markAsRead(n.id);
  };

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-stretch">
      {/* backdrop (click to close) */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />

      {/* panel — full height, full width split layout */}
      <aside
        className="relative z-10 flex flex-col w-full h-full"
        style={{
          background: "linear-gradient(160deg, #180801 0%, #2a1006 45%, #3a1809 100%)",
          borderTop: "1px solid rgba(255,122,47,0.18)",
          boxShadow: "inset 0 0 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* top accent bar */}
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{
            background: "linear-gradient(90deg, #FF6B2F 0%, #7cf8ff 50%, #FF6B2F 100%)",
            opacity: 0.75,
          }}
        />

        {/* ── header ── */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 py-3 gap-3"
          style={{
            borderBottom: "1px solid rgba(255,122,47,0.18)",
            background: "linear-gradient(90deg, rgba(255,107,47,0.07) 0%, transparent 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(255,107,47,0.18)",
                border: "1px solid rgba(255,122,47,0.4)",
                boxShadow: "0 0 14px rgba(255,107,47,0.35)",
              }}
            >
              <Bell size={15} color="#ff7a2f" />
            </div>
            <div>
              <h2
                className="text-sm font-extrabold uppercase tracking-[0.18em] leading-none"
                style={{ color: "#7cf8ff" }}
              >
                NOTIFICATIONS
              </h2>
              <p className="text-[11px] text-white/35 mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up ✓"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                disabled={isMarkingAll}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all
                  disabled:opacity-40 hover:bg-[rgba(124,248,255,0.12)] active:scale-95"
                style={{
                  background: "rgba(124,248,255,0.07)",
                  border: "1px solid rgba(124,248,255,0.22)",
                  color: "#7cf8ff",
                }}
              >
                {isMarkingAll ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <CheckCheck size={11} />
                )}
                Read all
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Cerrar notificaciones"
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors
                hover:bg-white/10 text-white/30 hover:text-white/70 active:scale-90"
            >
              <X size={15} />
            </button>
          </div>
        </header>

        {/* ── split body ── */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── LEFT: list ── */}
          <div
            className="flex flex-col overflow-hidden"
            style={{
              width: "220px",
              flexShrink: 0,
              borderRight: "1px solid rgba(255,122,47,0.14)",
            }}
          >
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,122,47,0.2) transparent" }}
            >
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonListItem key={i} />)
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
                  <BellOff size={24} color="rgba(255,255,255,0.12)" />
                  <p className="text-[11px] text-white/20 uppercase tracking-wider text-center font-bold">
                    No notifications
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
                    <div ref={sentinelRef} className="py-4 flex justify-center">
                      {isFetchingNextPage ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                          style={{ color: "rgba(255,122,47,0.45)" }}
                        />
                      ) : null}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── RIGHT: detail ── */}
          <div
            className="flex-1 overflow-hidden"
            style={{
              minWidth: 0,
              background: "linear-gradient(160deg, #1a0902 0%, #2d1107 50%, #381608 100%)",
              borderLeft: "1px solid rgba(255,122,47,0.14)",
            }}
          >
            {selected ? (
              <DetailPane n={selected} onBack={() => setSelected(null)} />
            ) : (
              <EmptyDetail />
            )}
          </div>
        </div>

        {/* bottom bar */}
        <div
          className="flex-shrink-0 h-[3px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,107,47,0.6) 0%, rgba(124,248,255,0.35) 50%, rgba(255,107,47,0.6) 100%)",
          }}
        />
      </aside>
    </div>
  );
}
