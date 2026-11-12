"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Player = {
  id: string | number;
  fullName: string;
};

type Props = {
  players?: Player[];
  value: string; // selected player id
  onValueChange: (next: string) => void;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

export default function PlayerAutocomplete({
  players,
  value,
  onValueChange,
  placeholder = "Players",
  triggerClassName,
  contentClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => {
    if (!players?.length) return null;
    return players.find((p) => String(p.id) === String(value)) ?? null;
  }, [players, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "mt-4 w-[280px] justify-between text-left text-white bg-orange-dark cursor-pointer rounded-xl border border-orange-32/90 shadow-[0_10px_30px_rgba(0,0,0,0.55)] hover:bg-orange-dark",
            triggerClassName,
          )}
        >
          <span className="truncate font-helvetica">
            {selected ? selected.fullName : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={cn("w-[280px] p-0", contentClassName)}
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search player..." />
          <CommandList>
            <CommandEmpty>No players found.</CommandEmpty>

            <CommandGroup>
              {(players ?? []).map((player) => {
                const id = String(player.id);
                const isSelected = String(value) === id;

                return (
                  <CommandItem
                    key={id}
                    value={player.fullName}
                    onSelect={() => {
                      onValueChange(id);
                      setOpen(false);
                    }}
                    className="font-helvetica"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="truncate">{player.fullName}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
