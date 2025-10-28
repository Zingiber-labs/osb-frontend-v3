import { useQuery } from "@tanstack/react-query";

export const usePlayByPlay = () => {
    console.log("HOLAAA?????")
  return useQuery({
    queryKey: ["play-by-play"],
    queryFn: async () => {
      const res = await fetch("https://osb-v0-3.onrender.com/generalist/games/401809958/playbyplay"); // tu endpoint real
      console.log("RESSSSS", res)
      if (!res.ok) throw new Error("Error fetching store items");
      return res.json();
    },
  });
};
