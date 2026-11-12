import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import type { BoxScorePayload } from "@/hooks/gameplay/useGameSocket";

const REGULATION_SECONDS = 48 * 60;
const OT_SECONDS = 5 * 60;

const parseElapsedSeconds = (t: unknown): number => {
  if (typeof t === "number" && Number.isFinite(t)) return t;
  if (typeof t === "string") {
    const trimmed = t.trim();
    const num = Number(trimmed);
    if (!Number.isNaN(num)) return num;
    const mmss = trimmed.match(/^(\d+):(\d+)$/);
    if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2]);
  }
  return 0;
};

const totalDuration = (b: BoxScorePayload | null): number => {
  if (!b) return REGULATION_SECONDS;
  const has = (n: number | undefined) => (n ?? 0) > 0;
  let ot = 0;
  if (has(b.home_ot1) || has(b.visitor_ot1)) ot = 1;
  if (has(b.home_ot2) || has(b.visitor_ot2)) ot = 2;
  if (has(b.home_ot3) || has(b.visitor_ot3)) ot = 3;
  return REGULATION_SECONDS + ot * OT_SECONDS;
};

const computeProgress = (
  boxScore: BoxScorePayload | null,
  receivedAt: number | null,
  now: number,
): number => {
  if (!boxScore) return 0;
  const status = String(boxScore.status ?? "").toLowerCase();
  if (status.includes("final")) return 1;
  if (status.includes("scheduled")) return 0;

  const total = totalDuration(boxScore);
  const snapshot = parseElapsedSeconds(boxScore.time);
  const drift = receivedAt != null ? Math.max(0, now - receivedAt) / 1000 : 0;
  const live = Math.min(total, snapshot + drift);
  return total > 0 ? live / total : 0;
};

export const useDiscFollowMatch = ({
  groupCylinders,
  groupTorus,
  boxScore,
  receivedAt,
}: {
  groupCylinders: THREE.Group;
  groupTorus: THREE.Group;
  boxScore: BoxScorePayload | null;
  receivedAt: number | null;
}) => {
  const smoothed = useRef(0);

  useFrame(() => {
    const disc = groupCylinders.children[0] as THREE.Mesh | undefined;
    if (!disc) return;
    if (groupTorus.children.length < 2) return;

    const start = groupTorus.children[0].position;
    const end = groupTorus.children[1].position;

    const target = computeProgress(boxScore, receivedAt, Date.now());
    smoothed.current += (target - smoothed.current) * 0.08;

    disc.position.lerpVectors(start, end, smoothed.current);
    disc.updateMatrix();
  });
};
