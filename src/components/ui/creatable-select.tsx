import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface CreatableSelectProps {
  options: string[] | readonly string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CreatableSelect({
  options,
  value,
  onChange,
  placeholder = "Select or type...",
  className,
}: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-background border-secondary/30 h-12 rounded-xl font-normal", className)}
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover border-secondary/30 rounded-xl" align="start">
        <Command className="rounded-xl">
          <CommandInput
            placeholder={`Search or type new ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {inputValue && !options.some(opt => opt.toLowerCase() === inputValue.toLowerCase()) && (
                  <CommandItem
                      value={inputValue}
                      onSelect={() => {
                          onChange(inputValue);
                          setOpen(false);
                      }}
                      className="aria-selected:bg-secondary/20 aria-selected:text-secondary font-medium text-primary"
                  >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{inputValue}"
                  </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(currentValue) => {
                    // cmdk lowercases the value, so we need to find the original case
                    const originalValue = options.find((opt) => opt.toLowerCase() === currentValue) || currentValue;
                    onChange(originalValue === value ? "" : originalValue)
                    setOpen(false)
                  }}
                  className="aria-selected:bg-secondary/20 aria-selected:text-secondary"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
