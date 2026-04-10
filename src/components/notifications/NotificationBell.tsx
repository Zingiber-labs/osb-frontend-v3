import { useInfiniteNotifications, useMarkAllAsRead, useUnreadCount } from "@/hooks/notifications/useNotifications";
import { Bell, Check, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NotificationItem } from "./NotificationItem";
import { useEffect, useRef } from "react";

export const NotificationBell = () => {
  const { data: unreadData } = useUnreadCount();
  const { data: notificationsData, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteNotifications();
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const unreadCount = unreadData?.unreadCount || 0;
  
  const notifications = notificationsData?.pages.flatMap((page) => page.rows) || [];
  
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(currentRef);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, fetchNextPage]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors text-white">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 border-gray-800 bg-[var(--background)] shadow-xl" align="end">
        <div className="flex items-center justify-between p-3 border-b border-gray-800">
          <h3 className="font-semibold text-white">Notificaciones</h3>
          {unreadCount > 0 && (
            <button 
              onClick={() => markAllAsRead()}
              disabled={isMarkingAll}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3 h-3" />
              Marcar leídas
            </button>
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="p-4 flex justify-center text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No tienes notificaciones</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} />
              ))}
              
              {hasNextPage && (
                <div ref={loadMoreRef} className="p-4 flex justify-center text-gray-400">
                  {isFetchingNextPage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="text-xs">Cargar más...</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
