"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useState } from "react";

type Row = { team: string; ft: string; two: string; three: string };

const MOCK: Row[] = [
  { team: "KAREEM ABDUL-JABBAR", ft: "15.5%", two: "82.5%", three: "38.0%" },
  { team: "MICHAEL JORDAN", ft: "16.2%", two: "83.8%", three: "39.1%" },
  { team: "LEBRON JAMES", ft: "15.6%", two: "84.1%", three: "37.9%" },
  { team: "KOBE BRYANT", ft: "15.8%", two: "81.2%", three: "36.5%" },
  { team: "TIM DUNCAN", ft: "14.9%", two: "79.7%", three: "35.4%" },
];

export default function ProfileRank() {
  const [q, setQ] = useState("");

  const rows = useMemo(
    () => MOCK.filter((r) => r.team.toLowerCase().includes(q.toLowerCase())),
    [q]
  );

  return (
    <Card className="bg-orange-24 border-2 border-secondary/40 text-white rounded-[1.5rem] p-4"></Card>
  );
}
