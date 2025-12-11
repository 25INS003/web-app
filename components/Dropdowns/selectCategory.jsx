"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useCategoryStore } from "@/store/categoryStore";

/**
 * A null-safe, persistent, and searchable combobox for selecting a Category.
 */
export default function SelectCategory({
  value,
  onCateSelect,
  placeholder = "Select Category...",
  isInvalid = false,
}) {
  const [open, setOpen] = React.useState(false);
  
  // Use the Zustand store
  const { categories, fetchCategories, isLoading, error } = useCategoryStore();

  // Fetch categories on mount if the store is empty
  React.useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  // Find the selected category object
  const selectedCategory = categories.find((category) => category._id === value);
  
  const getButtonText = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading Categories...
        </>
      );
    }
    if (error) {
        return (
            <span className="text-red-500 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                Error: Failed to load
            </span>
        );
    }
    if (selectedCategory) {
      return selectedCategory.name;
    }
    return placeholder;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-[250px] justify-between", {
            "border-red-500": isInvalid || error,
            "text-muted-foreground": !selectedCategory && !isLoading && !error,
          })}
          disabled={isLoading || !!error}
        >
          {getButtonText()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category._id}
                  value={category.name}
                  onSelect={() => {
                    // This logic ensures 'null-proof' selection
                    const newId = category._id === value ? null : category._id;
                    onCateSelect(newId);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category._id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}