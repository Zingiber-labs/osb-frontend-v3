"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Screen = {
  label: string;
  href: string;
  defaultSrc: string;
  activeSrc: string;

  x: number;
  y: number;
  width: number;
  height: number;
  activeOffsetX?: number;
  activeOffsetY?: number;
  activeExtraW?: number;
  activeExtraH?: number;
};

const SCREENS: Screen[] = [
  {
    label: "HANGAR",
    href: "/missions",
    defaultSrc: "/img/menu/hangar-v2.svg",
    activeSrc: "/img/menu/hangar-active.png",
    x: 700,
    y: 660,
    width: 385,
    height: 225,
  },
  {
    label: "STORE",
    href: "/store",
    defaultSrc: "/img/menu/store-v2.svg",
    activeSrc: "/img/menu/store-active.png",
    x: 595,
    y: 770,
    width: 115,
    height: 130,
  },
  {
    label: "INVENTORY",
    href: "/inventory",
    defaultSrc: "/img/menu/inventory-v2.svg",
    activeSrc: "/img/menu/inventory-active.png",
    x: 615,
    y: 885,
    width: 180,
    height: 95,
  },
];

const DEBUG_COLORS = ["#3df0ff", "#ff7a1a", "#7dff8c", "#ffd23d"];

export default function HomeScene() {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setDebug(sp.get("debug") === "screens");
  }, []);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!debug || !svgRef.current) return;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    setCursor({ x: Math.round(p.x), y: Math.round(p.y) });
  };

  return (
    <svg
      ref={svgRef}
      className="scene-svg"
      viewBox="0 0 1440 1440"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      onMouseMove={handleMove}
      onMouseLeave={() => setCursor(null)}
      style={debug ? { pointerEvents: "auto" } : undefined}
    >
      <image
        href="/img/menu.png"
        x="0"
        y="0"
        width="1440"
        height="1440"
        preserveAspectRatio="xMidYMid slice"
      />

      {SCREENS.map((s, i) => {
        const dx = s.activeOffsetX ?? -6;
        const dy = s.activeOffsetY ?? -6;
        const dw = s.activeExtraW ?? 12;
        const dh = s.activeExtraH ?? 12;
        return (
          <g
            key={s.href}
            className="screen-hotspot"
            onClick={() => router.push(s.href)}
            role="button"
            tabIndex={0}
          >
            <image
              className="screen-default"
              href={s.defaultSrc}
              x={s.x}
              y={s.y}
              width={s.width}
              height={s.height}
              preserveAspectRatio="none"
            />
            <image
              className="screen-active"
              href={s.activeSrc}
              x={s.x + dx}
              y={s.y + dy}
              width={s.width + dw}
              height={s.height + dh}
              preserveAspectRatio="none"
            />
            <rect
              className="screen-hit"
              x={s.x}
              y={s.y}
              width={s.width}
              height={s.height}
              fill="transparent"
            />
            {debug && (
              <>
                <rect
                  x={s.x}
                  y={s.y}
                  width={s.width}
                  height={s.height}
                  fill="none"
                  stroke={DEBUG_COLORS[i % DEBUG_COLORS.length]}
                  strokeWidth={3}
                  strokeDasharray="10 6"
                  pointerEvents="none"
                />
                <text
                  x={s.x + 6}
                  y={s.y + 22}
                  fontSize={20}
                  fontFamily="monospace"
                  fontWeight="bold"
                  fill={DEBUG_COLORS[i % DEBUG_COLORS.length]}
                  pointerEvents="none"
                  style={{ paintOrder: "stroke" }}
                  stroke="#000"
                  strokeWidth={4}
                >
                  {`${s.label}  x:${s.x} y:${s.y} w:${s.width} h:${s.height}`}
                </text>
              </>
            )}
          </g>
        );
      })}

      {debug && cursor && (
        <>
          <line
            x1={cursor.x}
            y1={0}
            x2={cursor.x}
            y2={1440}
            stroke="#fff"
            strokeWidth={1}
            strokeDasharray="4 4"
            pointerEvents="none"
            opacity={0.6}
          />
          <line
            x1={0}
            y1={cursor.y}
            x2={1440}
            y2={cursor.y}
            stroke="#fff"
            strokeWidth={1}
            strokeDasharray="4 4"
            pointerEvents="none"
            opacity={0.6}
          />
          <rect
            x={cursor.x + 12}
            y={cursor.y + 12}
            width={170}
            height={32}
            fill="#000"
            opacity={0.85}
            pointerEvents="none"
          />
          <text
            x={cursor.x + 20}
            y={cursor.y + 34}
            fontSize={20}
            fontFamily="monospace"
            fontWeight="bold"
            fill="#3df0ff"
            pointerEvents="none"
          >
            {`x:${cursor.x}  y:${cursor.y}`}
          </text>
        </>
      )}
    </svg>
  );
}
