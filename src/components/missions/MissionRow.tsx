import { ChevronDown } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import MissionDetailsCard from "./MissionDetailsCard";
import { Mission } from "@/types/mission";

type MissionRowProps = {
  mission: Mission;
  isSelected?: boolean;
  onSelect?: () => void;
};

const MissionRow = ({ mission, isSelected, onSelect }: MissionRowProps) => {
  return (
    <AccordionItem value={String(mission.id)} className="border-none">
      <AccordionTrigger
        onClick={onSelect}
        className={`
          group relative flex w-full items-center justify-between
          rounded-[20px]
          border
          px-6 py-2.5
          text-left text-[12px] sm:text-[13px]
          font-semibold tracking-[0.18em]
          shadow-[0_0_22px_rgba(56,189,248,0.8)]
          hover:no-underline
          data-[state=open]:bg-[#0c3958]
          
          bg-[linear-gradient(180deg,#0f3c5f_0%,#052038_55%,#021021_100%)]
          border-[#39c4ff]
          text-slate-50

          ${
            isSelected
              ? `
            border-cyan-300
            shadow-[0_0_30px_rgba(56,189,248,1)]
            ring-1 ring-cyan-300/70
          `
              : `
            opacity-90 hover:opacity-100
          `
          }
        `}
      >
        <span className="truncate">{mission.name}</span>
      </AccordionTrigger>

      <AccordionContent className="pt-3">
        <MissionDetailsCard
          title={mission.name}
          missionId={String(mission.id)}
          author={mission.author || "Unknown"}
          description={mission.description || "No description available."}
          requirements={mission.requirements || {}}
          rewards={mission.rewards || {}}
        />
      </AccordionContent>
    </AccordionItem>
  );
};

export default MissionRow;
