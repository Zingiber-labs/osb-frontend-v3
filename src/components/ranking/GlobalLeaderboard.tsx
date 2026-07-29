"use client";

import React, { useState } from "react";
import { useGlobalLeaderboard } from "@/hooks/ranking/useGlobalLeaderboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Crown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const RankIcon = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />;
  if (rank === 3) return <Medal className="w-6 h-6 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />;
  return <span className="text-muted-foreground font-bold text-sm w-6 text-center">{rank}</span>;
};

export const GlobalLeaderboard = () => {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useGlobalLeaderboard(page, limit);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading the global leaderboard...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center p-12 bg-destructive/10 rounded-xl border border-destructive/20">
        <p className="text-destructive font-medium">Error loading the leaderboard.</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / limit);

  return (
    <div className="space-y-8 animate-in fade-in duration-1000 max-w-6xl mx-auto px-4 py-12 overflow-x-hidden">
      <div className="relative text-center space-y-4 mb-16">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full -z-10" />
        <div className="flex items-center justify-center gap-4 mb-4">
          <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-yellow-500/50" />
          <Trophy className="w-8 h-8 text-yellow-500 animate-pulse" />
          <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-yellow-500/50" />
        </div>
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-b from-white via-white to-zinc-500 bg-clip-text text-transparent italic tracking-tighter uppercase leading-none">
          Global Leaderboard
        </h1>

      </div>

      <Card className="border border-white/10 bg-black/40 backdrop-blur-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden rounded-3xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.02] border-b border-white/5">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-14 md:w-[100px] text-center font-black uppercase text-[10px] tracking-[0.2em] text-zinc-500 py-6">Rank</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-[0.2em] text-zinc-500 py-6">User</TableHead>
                <TableHead className="hidden md:table-cell font-black uppercase text-[10px] tracking-[0.2em] text-zinc-500 py-6">Level & Rank</TableHead>
                <TableHead className="text-right font-black uppercase text-[10px] tracking-[0.2em] text-zinc-500 py-6 pr-4 md:pr-8">Total XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((user) => (
                <TableRow
                  key={user.username}
                  className={cn(
                    "border-white/[0.03] transition-all duration-500 group",
                    user.rank === 1 && "bg-gradient-to-r from-yellow-500/[0.08] to-transparent hover:from-yellow-500/[0.12]",
                    user.rank === 2 && "bg-gradient-to-r from-slate-400/[0.06] to-transparent hover:from-slate-400/[0.10]",
                    user.rank === 3 && "bg-gradient-to-r from-amber-700/[0.06] to-transparent hover:from-amber-700/[0.10]",
                    "hover:bg-white/[0.02]"
                  )}
                >
                  <TableCell className="text-center py-5">
                    <div className="flex justify-center items-center scale-110 group-hover:scale-125 transition-transform duration-300">
                      <RankIcon rank={user.rank} />
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative">
                        <Avatar className={cn(
                          "h-12 w-12 border-2",
                          user.rank === 1 ? "border-yellow-400 bg-yellow-400/10" :
                            user.rank === 2 ? "border-slate-300 bg-slate-300/10" :
                              user.rank === 3 ? "border-amber-700 bg-amber-700/10" : "border-white/10 bg-white/5"
                        )}>
                          <AvatarFallback className="bg-transparent text-sm font-bold text-zinc-400">
                            {user.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.rank <= 3 && (
                          <div className={cn(
                            "absolute -inset-1 blur-md opacity-20 rounded-full -z-10 animate-pulse",
                            user.rank === 1 ? "bg-yellow-400" :
                              user.rank === 2 ? "bg-slate-300" : "bg-amber-700"
                          )} />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={cn(
                          "font-bold text-lg tracking-tight group-hover:text-white transition-colors truncate",
                          user.rank <= 3 ? "text-white" : "text-zinc-400"
                        )}>
                          {user.username}
                        </span>
                        <div className="md:hidden flex items-center gap-1.5 mt-0.5">
                          {user.level ? (
                            <span className="text-[10px] text-yellow-500/70 font-black uppercase tracking-widest italic">
                              {user.level.name}
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Rookie</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-5">
                    <div className="flex items-center gap-3">
                      {user.level ? (
                        <div className="flex items-center gap-3 bg-white/[0.03] px-3 py-1.5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
                          <div className="w-6 h-6 flex items-center justify-center">
                            <img
                              src={user.level.iconUrl}
                              alt=""
                              className="w-full h-full object-contain drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-[10px] text-zinc-600">✦</span>';
                              }}
                            />
                          </div>
                          <span className="font-bold text-xs text-zinc-300 uppercase italic tracking-wider">
                            {user.level.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-bold text-xs uppercase italic tracking-[0.1em] opacity-50">✦ Rookie</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-5 pr-4 md:pr-8">
                    <div className="flex flex-col items-end">
                      <span className={cn(
                        "font-black text-xl tabular-nums tracking-tighter italic",
                        user.rank === 1 ? "text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]" :
                          user.rank <= 3 ? "text-white" : "text-zinc-400"
                      )}>
                        {user.xp.toLocaleString()}
                        <span className="ml-1 text-[10px] text-zinc-500 non-italic uppercase font-bold tracking-widest">XP</span>
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col md:flex-row items-center justify-between px-8 py-6 bg-white/[0.02] border-t border-white/5 gap-4">
          <div className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.15em]">
            Showing <span className="text-white">{(page - 1) * limit + 1} - {Math.min(page * limit, data.total)}</span> of <span className="text-zinc-300">{data.total} registered</span>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => {
                setPage(p => p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-9 px-4 rounded-xl border-white/10 bg-transparent hover:bg-white/5 hover:text-white transition-all disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-sm italic">{page}</span>
              <span className="text-zinc-600 font-bold text-xs uppercase">/ {totalPages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                setPage(p => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="h-9 px-4 rounded-xl border-white/10 bg-transparent hover:bg-white/5 hover:text-white transition-all disabled:opacity-20"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden p-6 bg-yellow-500/[0.03] border border-yellow-500/20 rounded-3xl group transition-all hover:bg-yellow-500/[0.05]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Crown className="w-16 h-16 text-yellow-500" />
          </div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 rounded-2xl bg-yellow-400/20 text-yellow-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-yellow-500/70 uppercase font-black tracking-widest italic">Current Champion</p>
              <p className="text-xl font-black text-white italic tracking-tighter uppercase">
                {data.data[0]?.username || "..."}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
