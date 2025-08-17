import { Card } from "@/components/ui/card";

export type StatItem = { id: string; label: string; value: string | number };

export default function ProfileStats({ stats }: { stats: StatItem[] }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-4"></div>;
}
