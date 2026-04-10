import { AppNotification } from "@/types/notifications";
import { useMarkAsRead } from "@/hooks/notifications/useNotifications";
import { Star, Gift, Trophy, CheckCircle, Info } from "lucide-react";

interface Props {
  notification: AppNotification;
}

const getIconForType = (type: string) => {
  switch (type) {
    case "EVENT_REWARD_CLAIMED":
      return <Gift className="w-5 h-5 text-purple-500" />;
    case "MISSION_COMPLETED":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "MISSION_REWARD_CLAIMED":
      return <Star className="w-5 h-5 text-yellow-500" />;
    case "RANKING_UP":
      return <Trophy className="w-5 h-5 text-orange-500" />;
    case "SYSTEM":
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

export const NotificationItem = ({ notification }: Props) => {
  const { mutate: markAsRead } = useMarkAsRead();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  };

  const date = new Date(notification.createdAt);
  const formattedDate = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short'}).format(date);

  return (
    <div 
      onClick={handleClick}
      className={`p-3 border-b border-gray-800 cursor-pointer flex gap-3 transition-colors ${notification.isRead ? 'opacity-70 bg-transparent hover:bg-white/5' : 'bg-white/10 hover:bg-white/15'}`}
    >
      <div className="flex-shrink-0 mt-1">
        {notification.imageUrl ? (
          <img src={notification.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
            {getIconForType(notification.type)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className={`text-sm tracking-tight mb-1 ${notification.isRead ? 'font-medium text-gray-300' : 'font-bold text-white'}`}>
          {notification.title}
        </h4>
        <p className="text-xs text-gray-400 line-clamp-2">
          {notification.body}
        </p>
        <div className="text-[10px] text-gray-500 mt-2">
          {formattedDate}
        </div>
      </div>
      {!notification.isRead && (
        <div className="flex-shrink-0 flex items-center justify-center w-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
};
