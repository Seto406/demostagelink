import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface ShowCredit {
  id: string;
  title: string;
  poster_url: string | null;
  role: string; // The role they had in the show (e.g. "Lead Actor")
}

interface GroupMemberBadgeProps {
  groupId: string;
  groupName: string;
  groupLogoUrl: string | null;
  memberRole: string; // e.g. "Actor", "Member"
  shows: ShowCredit[];
}

export function GroupMemberBadge({
  groupId,
  groupName,
  groupLogoUrl,
  memberRole,
  shows
}: GroupMemberBadgeProps) {
  return (
    <div className="w-full max-w-md">
      {/* Membership Badge */}
      <div className="flex items-center gap-3 p-1.5 pr-4 bg-secondary/5 border border-secondary/20 rounded-full w-fit mb-3 hover:bg-secondary/10 transition-colors">
        <Link to={`/producer/${groupId}`}>
          <Avatar className="w-8 h-8 border border-secondary/30">
            <AvatarImage src={groupLogoUrl || undefined} alt={groupName} className="object-cover" />
            <AvatarFallback className="bg-secondary/20 text-secondary text-xs">
              {groupName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-foreground leading-tight">
            {memberRole}
          </span>
          <Link to={`/producer/${groupId}`} className="text-[10px] text-muted-foreground hover:text-secondary transition-colors leading-tight">
            at {groupName}
          </Link>
        </div>
      </div>

      {/* Shows Credits */}
      {shows.length > 0 && (
        <div className="pl-2 border-l-2 border-secondary/10 ml-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Credits ({shows.length})
            </span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex space-x-2">
              {shows.map((show) => (
                <Link to={`/shows/${show.id}`} key={show.id} className="group relative block shrink-0">
                  <div className="w-16 h-24 rounded-md overflow-hidden bg-muted border border-white/5 relative shadow-sm">
                    {show.poster_url ? (
                      <img
                        src={show.poster_url}
                        alt={show.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary/5 text-[8px] text-center p-1 text-muted-foreground">
                        {show.title}
                      </div>
                    )}
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1 text-center backdrop-blur-[1px]">
                      <span className="text-[9px] text-white font-medium line-clamp-3 leading-tight">
                        {show.role}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
