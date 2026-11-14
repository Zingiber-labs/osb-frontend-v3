import React from "react";

interface Stat {
  name: string;
  value: number;
  maxValue: number;
  color: string;
}

interface ExperienceLevelsProps {
  currentLevel?: number;
  nextLevel?: number;
  currentXP?: number;
  maxXP?: number;
  stats?: Stat[];
}

const ExperienceLevels = ({
  currentLevel = 5,
  nextLevel = 6,
  currentXP = 230,
  maxXP = 600,
  stats = [
    { name: "Jump", value: 95, maxValue: 100, color: "bg-blue-500" },
    { name: "Dunk", value: 80, maxValue: 100, color: "bg-cyan-400" },
    { name: "Lightspeed", value: 65, maxValue: 100, color: "bg-lime-400" },
    { name: "Vision", value: 45, maxValue: 100, color: "bg-orange-400" },
    { name: "Shield", value: 25, maxValue: 100, color: "bg-red-500" },
  ],
}: ExperienceLevelsProps) => {
  const xpPercentage = (currentXP / maxXP) * 100;

  const StatBar = ({ stat }: { stat: Stat }) => {
    const percentage = (stat.value / stat.maxValue) * 100;

    return (
      <div className="flex gap-2 mb-3">
        <div className="flex items-center mb-1">
          <span className="text-white font-medium text-sm w-20">
            {stat.name}
          </span>
        </div>
        <div className="relative w-full">
          {/* Background bar with dark segments */}
          <div className="w-full h-3 bg-gray-800 rounded-sm relative overflow-hidden">
            {/* Segmented background pattern */}
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute h-full w-px bg-gray-700"
                  style={{ left: `${(i + 1) * 5}%` }}
                />
              ))}
            </div>

            {/* Colored progress bar with sharp right edge */}
            <div className="relative h-full">
              <div
                className={`h-full transition-all duration-700 ease-out ${stat.color} relative`}
                style={{ width: `${percentage}%` }}
              >
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Level and XP Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm font-medium">
              LVL {currentLevel}
            </span>
            <div className="text-gray-500">▶</div>
            <span className="text-gray-300 text-sm font-medium">
              LVL {nextLevel}
            </span>
          </div>
        </div>
        <div className="text-gray-400 text-sm font-medium">
          {currentXP}/{maxXP} XP
        </div>
      </div>

      {/* XP Progress Bar */}
      <div className="mb-3">
        <div className="w-full h-2 bg-gray-800 rounded-sm relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-1000 ease-out"
            style={{ width: `${xpPercentage}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        {stats.map((stat, index) => (
          <StatBar key={index} stat={stat} />
        ))}
      </div>
    </div>
  );
};

export default ExperienceLevels;
