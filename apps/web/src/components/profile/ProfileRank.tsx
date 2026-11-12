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

export type Option = { value: string; label: string };

export type RankRow = {
  team: string;
  freeThrows: number;
  twoPointers: number;
  threePointers: number;
  meta?: {
    team?: string;
    position?: string;
    score?: string;
  };
};

type ProfileRankProps = {
  data: RankRow[];
  options?: {
    team?: Option[];
    position?: Option[];
    score?: Option[];
  };
  defaultSelections?: {
    team?: string;
    position?: string;
    score?: string;
  };
};

const pct = (n: number) => `${n.toFixed(1)}%`;

export default function ProfileRank({
  data,
  options,
  defaultSelections,
}: ProfileRankProps) {

  const TEAM_OPTS: Option[] = options?.team ?? [
    { value: "all", label: "All" },
    { value: "east", label: "East" },
    { value: "west", label: "West" },
  ];

  const POS_OPTS: Option[] = options?.position ?? [
    { value: "all", label: "All" },
    { value: "pg", label: "PG" },
    { value: "sg", label: "SG" },
    { value: "sf", label: "SF" },
    { value: "pf", label: "PF" },
    { value: "c", label: "C" },
  ];

  const SCORE_OPTS: Option[] = options?.score ?? [
    { value: "all", label: "All" },
    { value: "top10", label: "Top 10" },
    { value: "top25", label: "Top 25" },
    { value: "top50", label: "Top 50" },
  ];

  const [q, setQ] = React.useState("");

  const [team, setTeam] = React.useState(
    defaultSelections?.team ?? TEAM_OPTS[0]?.value ?? "all"
  );

  const [pos, setPos] = React.useState(
    defaultSelections?.position ?? POS_OPTS[0]?.value ?? "all"
  );

  const [score, setScore] = React.useState(
    defaultSelections?.score ?? SCORE_OPTS[0]?.value ?? "all"
  );

  const teamLabel =
    TEAM_OPTS.find((o) => o.value === team)?.label ??
    TEAM_OPTS[0]?.label ??
    "All";
  
  const posLabel =
    POS_OPTS.find((o) => o.value === pos)?.label ?? POS_OPTS[0]?.label ?? "All";

  const scoreLabel =
    SCORE_OPTS.find((o) => o.value === score)?.label ??
    SCORE_OPTS[0]?.label ??
    "All";

  const rows = React.useMemo(() => {
    return data.filter((r) => {
      const okSearch = r.team.toLowerCase().includes(q.toLowerCase());
      const okTeam =
        team === "all" ||
        r.meta?.team?.toLowerCase() === team.toLowerCase() ||
        r.meta == null;
      const okPos =
        pos === "all" ||
        r.meta?.position?.toLowerCase() === pos.toLowerCase() ||
        r.meta == null;
      const okScore =
        score === "all" ||
        r.meta?.score?.toLowerCase() === score.toLowerCase() ||
        r.meta == null;
      return okSearch && okTeam && okPos && okScore;
    });
  }, [data, q, team, pos, score]);

  return (
    <Card className="rounded-lg border border-primary bg-primary/35 p-4 text-white">

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-secondary text-xl uppercase tracking-[0.25em] font-extrabold">
          Global Rank
        </h3>

        <div className="relative w-full max-w-[360px]">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type name, position or points"
            className="
              h-9 w-full rounded-full text-white
              border-none placeholder:text-white/90
              bg-primary/30
              pl-4 pr-9 focus-visible:ring-0 focus-visible:outline-none
            "
          />
          <Search className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">

        <Select value={team} onValueChange={setTeam}>
          <SelectTrigger className="h-9 rounded-full px-4 border border-secondary text-sm tracking-widest bg-transparent text-white focus:ring-0 focus:outline-none">
            <span className="uppercase">
              Team:{" "}
              <span className="text-secondary font-semibold">{teamLabel}</span>
            </span>
          </SelectTrigger>
          <SelectContent className="bg-black/80 text-white border-white/10">
            {TEAM_OPTS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={pos} onValueChange={setPos}>
          <SelectTrigger className="h-9 rounded-full px-4 border border-secondary text-sm tracking-widest bg-transparent text-white focus:ring-0 focus:outline-none">
            <span className="uppercase">
              Position:{" "}
              <span className="text-secondary font-semibold">{posLabel}</span>
            </span>
          </SelectTrigger>
          <SelectContent className="bg-black/80 text-white border-white/10">
            {POS_OPTS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={score} onValueChange={setScore}>
          <SelectTrigger className="h-9 rounded-full px-4 border border-secondary text-sm tracking-widest bg-transparent text-white focus:ring-0 focus:outline-none">
            <span className="uppercase">
              Score:{" "}
              <span className="text-secondary font-semibold">{scoreLabel}</span>
            </span>
          </SelectTrigger>
          <SelectContent className="bg-black/80 text-white border-white/10">
            {SCORE_OPTS.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
      </div>

      <div className="mt-4 px-1 text-sm uppercase tracking-[0.25em] text-white font-semibold">
        <div className="grid grid-cols-[64px_1fr_repeat(3,160px)]">
          <div>#</div>
          <div>Team</div>
          <div className="text-right pr-2">Free Throws</div>
          <div className="text-right pr-2">2 Pointers</div>
          <div className="text-right pr-1">3 Pointers</div>
        </div>
      </div>

      <ScrollArea className="mt-2 h-[480px] pr-1 custom-scroll-thin rounded-lg">
        <Table className="rounded-lg ">
          <TableHeader className="hidden">
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Free Throws</TableHead>
              <TableHead>2 Pointers</TableHead>
              <TableHead>3 Pointers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="rounded-lg">
            {rows.map((r, i) => {
              const stripe = i % 2 === 0 ? "bg-primary/30" : "bg-orange-32/80";
              return (
                <TableRow
                  key={`${r.team}-${i}`}
                  className={`${stripe} border-0 hover:bg-white/25`}
                >
                  <TableCell className="w-16 text-center">
                    <span className="
                      inline-flex 
                      h-7 w-7 
                      items-center justify-center rounded-md bg-black/15 border border-primary/60 text-xs font-bold">
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
    </Card>
  );
}
