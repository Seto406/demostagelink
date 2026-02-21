import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface TagInputProps {
  placeholder?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  suggestions?: string[];
  className?: string;
  id?: string;
}

export const TagInput = ({ placeholder, tags, setTags, suggestions, className, id }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      e.stopPropagation();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const filteredSuggestions = suggestions?.filter(
    s => !tags.includes(s) && s.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap gap-2 mb-1">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="pl-2 pr-1 py-1 h-7 text-sm flex items-center gap-1">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent"
              onClick={() => removeTag(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <Popover open={open && (filteredSuggestions?.length ?? 0) > 0} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
           <Input
            id={id}
            value={inputValue}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
                setInputValue(e.target.value);
                setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="bg-background border-secondary/30"
          />
        </PopoverAnchor>
        <PopoverContent className="p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Command>
            <CommandList>
                <CommandGroup>
                  {filteredSuggestions?.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => {
                        addTag(suggestion);
                        setOpen(false);
                      }}
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
