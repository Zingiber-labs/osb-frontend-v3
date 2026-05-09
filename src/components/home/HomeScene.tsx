"use client";

import { useRouter } from "next/navigation";

export default function HomeScene() {
  const router = useRouter();

  return (
    <svg
      className="scene-svg"
      viewBox="0 0 1440 1440"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <image
        href="/img/menu.png"
        x="0"
        y="0"
        width="1440"
        height="1440"
        preserveAspectRatio="xMidYMid slice"
      />
      <g
        className="screen-hotspot"
        onClick={() => router.push("/missions")}
        role="button"
        tabIndex={0}
      >
        <image
          className="screen-default"
          href="/img/menu/hangar-v2.svg"
          x="700"
          y="660"
          width="385"
          height="225"
          preserveAspectRatio="none"
        />
        <image
          className="screen-active"
          href="/img/menu/hangar-active.png"
          x="694"
          y="654"
          width="397"
          height="237"
          preserveAspectRatio="none"
        />
        <rect
          className="screen-hit"
          x="700"
          y="660"
          width="385"
          height="225"
          fill="transparent"
        />
      </g>
    </svg>
  );
}
