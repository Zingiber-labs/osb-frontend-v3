export type NotificationType = 
  | "EVENT_REWARD_CLAIMED"
  | "MISSION_COMPLETED"
  | "MISSION_REWARD_CLAIMED"
  | "RANKING_UP"
  | "SYSTEM";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  imageUrl: string | null;
  metadata: any;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPaginatedResponse {
  total: number;
  rows: AppNotification[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}
