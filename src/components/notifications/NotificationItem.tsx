import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  MessageCircle,
  Heart,
  Circle,
  UserPlus,
  Users,
  Award,
  Handshake,
  Check,
  Ticket,
  CreditCard,
  Star
} from "lucide-react";
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
  onMarkAsRead?: (id: string) => void;
}

export function NotificationItem({ notification, onRead, onMarkAsRead }: NotificationItemProps) {
  const Icon = () => {
    switch (notification.type) {
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'like': return <Heart className="w-4 h-4 text-red-500" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'membership_application': return <Users className="w-4 h-4 text-orange-500" />;
      case 'membership': return <Award className="w-4 h-4 text-purple-500" />;
      case 'collab': return <Handshake className="w-4 h-4 text-indigo-500" />;
      case 'show_approved': return <Ticket className="w-4 h-4 text-green-500" />;
      case 'show_rejected': return <Ticket className="w-4 h-4 text-red-500" />;
      case 'payment_approved': return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'payment_rejected': return <CreditCard className="w-4 h-4 text-red-500" />;
      case 'payment_submitted': return <CreditCard className="w-4 h-4 text-yellow-500" />;
      case 'review': return <Star className="w-4 h-4 text-yellow-500" />;
      default: return <Bell className="w-4 h-4 text-secondary" />;
    }
  };

  const handleClick = () => {
    if (onRead && !notification.read) {
      onRead(notification.id);
    }
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const innerContent = (
    <>
      <div className="mt-1 p-2 rounded-full bg-background border border-secondary/20 h-fit shrink-0">
        <Icon />
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className={cn("text-sm font-medium text-foreground truncate pr-2", !notification.read && "font-semibold")}>
            {notification.title}
          </h4>
          {!notification.read && !onMarkAsRead && (
            <Circle className="w-2 h-2 fill-secondary text-secondary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 break-words">
          {notification.message}
        </p>
        <span className="text-xs text-muted-foreground/70 mt-1">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </span>
      </div>
    </>
  );

  const wrapperClasses = cn(
    "flex w-full border-b border-secondary/10 transition-colors hover:bg-secondary/5",
    !notification.read && "bg-secondary/5"
  );

  const contentClasses = "flex-1 flex gap-4 p-4 items-start text-left min-w-0";

  return (
    <div className={wrapperClasses}>
      {notification.link ? (
        <Link
          to={notification.link}
          onClick={handleClick}
          className={contentClasses}
        >
          {innerContent}
        </Link>
      ) : (
        <div
          onClick={handleClick}
          className={cn(contentClasses, "cursor-pointer")}
        >
          {innerContent}
        </div>
      )}

      {!notification.read && onMarkAsRead && (
          <div className="p-4 pl-0 flex items-start">
             <button
               onClick={handleMarkAsRead}
               className="mt-1 p-1.5 hover:bg-secondary/20 rounded-full text-muted-foreground hover:text-secondary transition-colors shrink-0 z-10"
               title="Mark as read"
               type="button"
             >
               <Check className="w-4 h-4" />
             </button>
          </div>
       )}
    </div>
  );
}
