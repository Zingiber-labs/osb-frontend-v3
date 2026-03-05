"use client";

import Image from "next/image";

type Props = {
  name: string;
  result: "success" | "failure";
  points: number;
  date: string;
  image?: string;
};

export default function MissionCard({
  name,
  result,
  points,
  date,
  image = "/images/missions/default.png",
}: Props) {
  const isSuccess = result === "success";

  return (
    <div
      className={[
        "rounded-xl border bg-[#1E2225] p-4",
        "border-secondary-cyan/40 shadow-[0_0_10px_rgba(45,255,254,0.35)]",
        "grid gap-4 items-center",
        "grid-cols-[72px_1fr] sm:grid-cols-[80px_1fr]",
        "lg:grid-cols-[88px_1.6fr_0.8fr_0.8fr_0.8fr]",
      ].join(" ")}
    >
      {/* Image */}
      <div className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] lg:w-[88px] lg:h-[88px] rounded-lg overflow-hidden border border-secondary-cyan/30">
        <Image
          src={image}
          alt={name}
          width={88}
          height={88}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Name + subtitle */}
      <div className="min-w-0">
        <p className="text-white text-base sm:text-lg font-semibold truncate">
          {name}
        </p>

        <p
          className={[
            "mt-1 text-xs sm:text-sm font-semibold",
            isSuccess ? "text-green-400" : "text-red-400",
          ].join(" ")}
        >
          {isSuccess ? "SUCCESS - S RANK" : "FAILURE"}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 lg:hidden">
          <Meta label="Result" value={isSuccess ? "SUCCESS" : "FAILURE"} valueClass={isSuccess ? "text-green-400" : "text-red-400"} />
          <Meta label="Points Earned" value={`+${points} MP`} valueClass="text-green-400" />
          <Meta label="Ship used" value={date} valueClass="text-white" />
        </div>
      </div>

      {/* Desktop columns */}
      <div className="hidden lg:block">
        <p className="text-gray-400 text-sm">Result</p>
        <p className={`font-semibold ${isSuccess ? "text-green-400" : "text-red-400"}`}>
          {isSuccess ? "SUCCESS" : "FAILURE"}
        </p>
      </div>

      <div className="hidden lg:block">
        <p className="text-gray-400 text-sm">Points Earned</p>
        <p className="text-green-400 font-semibold">+{points} MP</p>
      </div>

      <div className="hidden lg:block">
        <p className="text-gray-400 text-sm">Ship used</p>
        <p className="text-white">{date}</p>
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className={`text-sm font-semibold truncate ${valueClass ?? "text-white"}`}>
        {value}
      </p>
    </div>
  );
}