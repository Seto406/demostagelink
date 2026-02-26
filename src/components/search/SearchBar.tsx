import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, User, Building2 } from "lucide-react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandDialog } from "@/components/ui/command";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  display_name: string;
  username: string | null;
  role: 'audience' | 'producer' | 'admin';
  avatar_url: string | null;
  niche: string | null;
  group_name: string | null;
}

interface SearchBarProps {
  variant?: 'mobile' | 'desktop';
}

export const SearchBar = ({ variant }: SearchBarProps) => {
  const isMobileScreen = useIsMobile();
  const isMobile = variant === 'mobile' || (variant === undefined && isMobileScreen);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        // Search query targeting username and group_name
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, group_name, avatar_url, role, niche')
          .or(`username.ilike.%${debouncedQuery}%,group_name.ilike.%${debouncedQuery}%`)
          .limit(10);

        if (error) throw error;

        const mappedResults: SearchResult[] = (data || []).map((profile) => ({
          id: profile.id,
          display_name: profile.group_name || profile.username || "User",
          username: profile.username,
          role: profile.role as SearchResult['role'],
          avatar_url: profile.avatar_url,
          niche: profile.niche,
          group_name: profile.group_name
        }));

        setResults(mappedResults);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.role === 'producer') {
      navigate(`/producer/${result.id}`);
    } else {
      navigate(`/profile/${result.id}`);
    }
  };

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className="text-foreground/80 hover:text-foreground"
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput
            placeholder="Search users or theater groups..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </div>
            )}
            {!loading && query && results.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id + result.display_name} // Unique value for cmdk
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 py-3"
                  >
                    <Avatar className="h-8 w-8 border border-secondary/20">
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {result.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{result.display_name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {result.role === 'producer' ? (
                          <>
                            <Building2 className="h-3 w-3" />
                            Theater Group
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3" />
                            @{result.username || 'user'}
                          </>
                        )}
                        {result.niche && ` • ${result.niche}`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  // Desktop Version
  return (
    <div className="relative w-full max-w-sm group">
      <Command
        shouldFilter={false} // We handle filtering server-side
        className="rounded-xl border border-secondary/20 bg-muted/30 focus-within:bg-background focus-within:shadow-lg focus-within:ring-1 focus-within:ring-secondary/30 transition-all overflow-visible z-50"
      >
        <CommandInput
          placeholder="Search..."
          value={query}
          onValueChange={(val) => {
            setQuery(val);
            if (val) setOpen(true);
          }}
          onFocus={() => {
            if (query) setOpen(true);
          }}
          onBlur={() => {
            // Delay closing to allow item click
            setTimeout(() => setOpen(false), 200);
          }}
          className="bg-transparent border-none focus:ring-0"
        />

        {/* Dropdown Results */}
        {open && query && (
          <div className="absolute top-[calc(100%+8px)] left-0 right-0 rounded-xl border border-secondary/20 bg-popover shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
             <CommandList className="max-h-[300px] overflow-y-auto">
                {loading && (
                  <div className="flex items-center justify-center py-6 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </div>
                )}
                {!loading && results.length === 0 && (
                  <CommandEmpty className="py-6 text-muted-foreground text-sm">No results found.</CommandEmpty>
                )}
                {!loading && results.length > 0 && (
                   <CommandGroup>
                      {results.map((result) => (
                        <CommandItem
                          key={result.id}
                          value={result.id + result.display_name}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-3 py-3 cursor-pointer aria-selected:bg-secondary/10"
                        >
                          <Avatar className="h-8 w-8 border border-secondary/20">
                            <AvatarImage src={result.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {result.display_name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{result.display_name}</span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              {result.role === 'producer' ? (
                                <>
                                  <Building2 className="h-3 w-3" />
                                  Theater Group
                                </>
                              ) : (
                                <>
                                  <User className="h-3 w-3" />
                                  @{result.username || 'user'}
                                </>
                              )}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                   </CommandGroup>
                )}
             </CommandList>
          </div>
        )}
      </Command>
    </div>
  );
};
