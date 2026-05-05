import { EventComplexItem } from "@/types/event";

export interface AvailableEventsProps {
  open: boolean;
  onClose: () => void;
  events: EventComplexItem[];
  isLoading?: boolean;
  title?: string;
  subtitle?: string;
}

export interface EventListItemProps {
  event: EventComplexItem;
  isSelected: boolean;
  onClick: () => void;
}

export interface EventDetailPaneProps {
  event: EventComplexItem;
  isPending: boolean;
  onJoin: (eventId: string) => void;
  onBack: () => void;
}
