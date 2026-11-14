import React from "react";

interface StarfieldProps {
  starCount?: number;
  className?: string;
}

const Starfield: React.FC<StarfieldProps> = ({
  starCount = 500,
  className = "absolute inset-0 opacity-30",
}) => {
  return (
    <div className={className}>
      {[...Array(starCount)].map((_, i) => {
        // Use a more sophisticated deterministic pseudo-random generator
        // that creates better coverage with some natural variation
        const seed1 = (i * 1664525 + 1013904223) % 2147483647;
        const seed2 = (seed1 * 1664525 + 1013904223) % 2147483647;
        const seed3 = (seed2 * 1664525 + 1013904223) % 2147483647;

        // Create better coverage by using multiple distribution methods
        // Mix uniform distribution with some clustering for natural look
        const uniformX = (seed1 % 10000) / 100; // 0-100% uniform
        const uniformY = (seed2 % 10000) / 100; // 0-100% uniform

        // Add some subtle clustering variation (smaller effect)
        const clusterOffsetX = Math.sin(seed1 / 500000) * 15; // Smaller clustering
        const clusterOffsetY = Math.cos(seed2 / 500000) * 15;

        // Combine uniform base with subtle clustering and round to prevent hydration mismatches
        const left =
          Math.round(
            Math.max(0, Math.min(100, uniformX + clusterOffsetX)) * 100
          ) / 100;
        const top =
          Math.round(
            Math.max(0, Math.min(100, uniformY + clusterOffsetY)) * 100
          ) / 100;
        const delay = Math.round(((seed3 % 2000) / 1000) * 100) / 100; // 0-2 seconds, rounded

        return (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
};

export default Starfield;
