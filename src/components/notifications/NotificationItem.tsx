import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, MessageCircle, Heart, Info, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  link: string | null;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const Icon = () => {
    switch (notification.type) {
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      default: return <Bell className="w-4 h-4 text-secondary" />;
    }
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (notification.link) {
      return (
        <Link
          to={notification.link}
          className="flex-1"
          onClick={() => onRead && !notification.read && onRead(notification.id)}
        >
          {children}
        </Link>
      );
    }
    return <div className="flex-1">{children}</div>;
  };

  return (
    <div
      className={cn(
        "flex gap-4 p-4 border-b border-secondary/10 transition-colors hover:bg-secondary/5",
        !notification.read && "bg-secondary/5"
      )}
    >
      <div className="mt-1 p-2 rounded-full bg-background border border-secondary/20 h-fit">
        <Icon />
      </div>

      <Wrapper>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start">
            <h4 className={cn("text-sm font-medium text-foreground", !notification.read && "font-semibold")}>
              {notification.title}
            </h4>
            {!notification.read && (
              <Circle className="w-2 h-2 fill-secondary text-secondary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <span className="text-xs text-muted-foreground/70 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </span>
        </div>
      </Wrapper>
    </div>
  );
}
