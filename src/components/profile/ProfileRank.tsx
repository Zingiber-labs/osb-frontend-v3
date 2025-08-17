"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";

type RankRow = {
  team: string;
  freeThrows: number;
  twoPointers: number;
  threePointers: number;
};

const DATA: RankRow[] = [
  {
    team: "KAREEM ABDUL-JABBAR",
    freeThrows: 15.5,
    twoPointers: 82.5,
    threePointers: 38.0,
  },
  {
    team: "MICHAEL JORDAN",
    freeThrows: 16.2,
    twoPointers: 83.8,
    threePointers: 39.1,
  },
  {
    team: "LEBRON JAMES",
    freeThrows: 15.8,
    twoPointers: 84.1,
    threePointers: 37.9,
  },
  {
    team: "KOBE BRYANT",
    freeThrows: 15.3,
    twoPointers: 81.2,
    threePointers: 36.5,
  },
  {
    team: "TIM DUNCAN",
    freeThrows: 14.9,
    twoPointers: 79.7,
    threePointers: 35.4,
  },
  {
    team: "SHAQUILLE O'NEAL",
    freeThrows: 14.4,
    twoPointers: 78.0,
    threePointers: 34.2,
  },
  {
    team: "DIRK NOWITZKI",
    freeThrows: 14.7,
    twoPointers: 80.3,
    threePointers: 35.1,
  },
  {
    team: "STEPH CURRY",
    freeThrows: 16.5,
    twoPointers: 85.0,
    threePointers: 40.2,
  },
  {
    team: "KEVIN DURANT",
    freeThrows: 15.9,
    twoPointers: 82.9,
    threePointers: 38.4,
  },
  {
    team: "HAKEEM OLAJUWON",
    freeThrows: 15.2,
    twoPointers: 81.5,
    threePointers: 37.2,
  },
  {
    team: "RUSSELL WESTBROOK",
    freeThrows: 15.0,
    twoPointers: 80.0,
    threePointers: 36.8,
  },
  {
    team: "LARRY BIRD",
    freeThrows: 16.1,
    twoPointers: 83.2,
    threePointers: 39.6,
  },
  {
    team: "MAGIC JOHNSON",
    freeThrows: 15.4,
    twoPointers: 82.1,
    threePointers: 36.0,
  },
  {
    team: "GIANNIS ANTETOKOUNMPO",
    freeThrows: 14.8,
    twoPointers: 81.7,
    threePointers: 34.9,
  },
  {
    team: "KAWHI LEONARD",
    freeThrows: 15.7,
    twoPointers: 82.6,
    threePointers: 38.1,
  },
];

const pct = (n: number) => `${n.toFixed(1)}%`;

export default function ProfileRank() {
  const [q, setQ] = React.useState("");
  const [team, setTeam] = React.useState("All");
  const [pos, setPos] = React.useState("All");
  const [score, setScore] = React.useState("All");

  const rows = React.useMemo(() => {
    // Para filtros
    return DATA.filter((r) => r.team.toLowerCase().includes(q.toLowerCase()));
  }, [q, team, pos, score]);

  return (
    <Card className="rounded-[18px] border border-primary bg-primary/35 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-secondary uppercase tracking-[0.25em] font-extrabold">
          Globla Rank
        </h3>

        <div className="relative w-full max-w-[360px]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type name, position or points"
            className="
              h-9 w-full rounded-full bg-transparent text-white
              border border-white/25 placeholder:text-white/60
              pl-4 pr-9 focus-visible:ring-0 focus-visible:outline-none
            "
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        <Select onValueChange={setTeam}>
          <SelectTrigger
            className="
              h-9 rounded-full px-4 bg-transparent text-cyan-300
              border border-cyan-300/70 text-[12px] uppercase tracking-widest
              focus:ring-0 focus:outline-none
            "
          >
            <SelectValue placeholder={`Team: ${team}`} />
          </SelectTrigger>
          <SelectContent className="bg-black/80 text-white border-white/10">
            {["All", "East", "West"].map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setPos}>
          <SelectTrigger
            className="
              h-9 rounded-full px-4 bg-transparent text-cyan-300
              border border-cyan-300/70 text-[12px] uppercase tracking-widest
              focus:ring-0 focus:outline-none
            "
          >
            <SelectValue placeholder={`Position: ${pos}`} />
          </SelectTrigger>
          <SelectContent className="bg-black/80 text-white border-white/10">
            {["All", "PG", "SG", "SF", "PF", "C"].map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setScore}>
          <SelectTrigger
            className="
              h-9 rounded-full px-4 bg-transparent text-cyan-300
              border border-cyan-300/70 text-[12px] uppercase tracking-widest
              focus:ring-0 focus:outline-none
            "
          >
            <SelectValue placeholder={`Score: ${score}`} />
          </SelectTrigger>
          <SelectContent className="bg-black/80 text-white border-white/10">
            {["All", "Top 10", "Top 25", "Top 50"].map((v) => (
              <SelectItem key={v} value={v}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-5">
        <div className="px-1 text-[11px] uppercase tracking-[0.25em] text-white/70">
          <div className="grid grid-cols-[64px_1fr_repeat(3,160px)]">
            <div>#</div>
            <div>Team</div>
            <div className="text-right pr-2">Free Throws</div>
            <div className="text-right pr-2">2 Pointers</div>
            <div className="text-right pr-1">3 Pointers</div>
          </div>
        </div>

        <ScrollArea className="mt-2 h-[480px] pr-1 custom-scroll-thin">
          <Table>
            <TableHeader className="hidden">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Free Throws</TableHead>
                <TableHead>2 Pointers</TableHead>
                <TableHead>3 Pointers</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((r, i) => {
                const stripe = i % 2 === 0 ? "bg-white/10" : "bg-white/5";
                return (
                  <TableRow
                    key={r.team}
                    className={`${stripe} border-0 hover:bg-white/15`}
                  >
                    <TableCell className="w-[64px]">
                      <span
                        className="
                          inline-flex h-7 w-7 items-center justify-center
                          rounded-full bg-black/35 border border-white/15
                          text-sm font-bold
                        "
                      >
                        {i + 1}
                      </span>
                    </TableCell>

                    <TableCell className="font-semibold tracking-wide">
                      {r.team}
                    </TableCell>

                    <TableCell className="text-right pr-2">
                      {pct(r.freeThrows)}
                    </TableCell>
                    <TableCell className="text-right pr-2">
                      {pct(r.twoPointers)}
                    </TableCell>
                    <TableCell className="text-right pr-1">
                      {pct(r.threePointers)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  );
}
