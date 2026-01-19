"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2, XCircle, ChevronRight, FolderTree } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";

import { useCategoryStore } from "@/store/categoryStore";

/**
 * Cascading Category Selector with unlimited nesting depth.
 * Shows breadcrumb of selected path and allows drilling down.
 */
export default function CascadingCategorySelect({
  value, // The final selected category ID
  onCategorySelect, // Callback when a category is selected
  placeholder = "Select Category...",
  isInvalid = false,
  allowSelectParent = true, // Allow selecting non-leaf categories
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedPath, setSelectedPath] = React.useState([]); // Array of selected categories (breadcrumb)
  const [currentLevel, setCurrentLevel] = React.useState([]); // Current level categories to show

  const { 
    categories, 
    fetchCategories, 
    fetchChildCategories,
    fetchCategoryAncestry,
    isLoading, 
    error 
  } = useCategoryStore();

  // Fetch all categories on mount
  React.useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  // Helper to get parent ID from either string or populated object
  const getParentId = React.useCallback((cat) => {
    const parentId = cat?.parent_category_id;
    if (!parentId) return null;
    if (typeof parentId === "object" && parentId._id) {
      return parentId._id;
    }
    return parentId;
  }, []);

  // Get root categories (no parent)
  const rootCategories = React.useMemo(() => {
    return categories.filter(cat => !getParentId(cat));
  }, [categories, getParentId]);

  // Initialize current level with root categories
  React.useEffect(() => {
    if (rootCategories.length > 0 && currentLevel.length === 0) {
      setCurrentLevel(rootCategories);
    }
  }, [rootCategories]);

  // If value is set externally, reconstruct the path
  React.useEffect(() => {
    const reconstructPath = async () => {
      if (value && categories.length > 0) {
        const ancestry = await fetchCategoryAncestry(value);
        if (ancestry && ancestry.length > 0) {
          setSelectedPath(ancestry);
          // Set current level to siblings of the selected category
          const lastCat = ancestry[ancestry.length - 1];
          const lastCatParentId = getParentId(lastCat);
          const siblings = categories.filter(cat => 
            getParentId(cat) === lastCatParentId
          );
          if (siblings.length > 0) {
            setCurrentLevel(siblings);
          }
        }
      }
    };
    reconstructPath();
  }, [value, categories.length, getParentId]);

  // Get children of a category from the flat list
  const getChildren = React.useCallback((parentId) => {
    return categories.filter(cat => getParentId(cat) === parentId);
  }, [categories, getParentId]);

  // Check if a category has children
  const hasChildren = React.useCallback((categoryId) => {
    return categories.some(cat => getParentId(cat) === categoryId);
  }, [categories, getParentId]);

  // Handle category click
  const handleCategoryClick = (category) => {
    const children = getChildren(category._id);
    
    if (children.length > 0) {
      // Has children - drill down
      setSelectedPath(prev => [...prev, category]);
      setCurrentLevel(children);
      
      // If allowSelectParent, also select this category
      if (allowSelectParent) {
        onCategorySelect(category._id);
      }
    } else {
      // Leaf node - select and close
      setSelectedPath(prev => [...prev, category]);
      onCategorySelect(category._id);
      setOpen(false);
    }
  };

  // Handle breadcrumb click (go back to a level)
  const handleBreadcrumbClick = (index) => {
    if (index < 0) {
      // Go to root
      setSelectedPath([]);
      setCurrentLevel(rootCategories);
    } else {
      // Go to specific level
      const newPath = selectedPath.slice(0, index + 1);
      setSelectedPath(newPath);
      const parentId = newPath[newPath.length - 1]._id;
      const children = getChildren(parentId);
      setCurrentLevel(children.length > 0 ? children : rootCategories);
    }
  };

  // Handle final selection (user clicks "Select" on current category)
  const handleSelectCurrent = (category) => {
    onCategorySelect(category._id);
    setOpen(false);
  };

  // Reset to root when popover opens
  const handleOpenChange = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && selectedPath.length === 0) {
      setCurrentLevel(rootCategories);
    }
  };

  // Get display text for button
  const getButtonText = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      );
    }
    if (error) {
      return (
        <span className="text-red-500 flex items-center">
          <XCircle className="mr-2 h-4 w-4" />
          Error loading
        </span>
      );
    }
    if (selectedPath.length > 0) {
      // Show full path
      return (
        <span className="flex items-center gap-1 truncate">
          <FolderTree className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {selectedPath.map(cat => cat.name).join(" › ")}
          </span>
        </span>
      );
    }
    return placeholder;
  };

  // Find selected category
  const selectedCategory = categories.find(cat => cat._id === value);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between dark:bg-slate-900", {
            "border-red-500": isInvalid || error,
            "text-muted-foreground": !selectedCategory && !isLoading && !error,
          })}
          disabled={isLoading || !!error}
        >
          <span className="truncate flex-1 text-left">
            {getButtonText()}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[350px] p-0 dark:bg-slate-900" align="start">
        <Command className="dark:bg-slate-900">
          <CommandInput
            placeholder="Search category..."
            className="dark:bg-slate-900 dark:text-slate-200"
          />
          
          {/* Breadcrumb Navigation */}
          {selectedPath.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-2 border-b dark:border-slate-700 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 dark:text-blue-400"
                onClick={() => handleBreadcrumbClick(-1)}
              >
                Root
              </Button>
              {selectedPath.map((cat, idx) => (
                <React.Fragment key={cat._id}>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 px-2 text-xs",
                      idx === selectedPath.length - 1 
                        ? "font-semibold text-foreground" 
                        : "text-blue-600 dark:text-blue-400"
                    )}
                    onClick={() => handleBreadcrumbClick(idx)}
                  >
                    {cat.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          )}

          <CommandList className="dark:bg-slate-900 max-h-[300px]">
            <CommandEmpty>No categories found.</CommandEmpty>
            <CommandGroup className="dark:text-slate-200">
              {currentLevel.map((category) => {
                const hasChild = hasChildren(category._id);
                const isSelected = value === category._id;
                
                return (
                  <CommandItem
                    key={category._id}
                    value={category.name}
                    onSelect={() => handleCategoryClick(category)}
                    className="hover:dark:bg-slate-800 focus:dark:bg-slate-800 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1">{category.name}</span>
                    {hasChild && (
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          {getChildren(category._id).length}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>

          {/* Selection Actions */}
          {selectedPath.length > 0 && (
            <div className="border-t dark:border-slate-700 p-2 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {hasChildren(selectedPath[selectedPath.length - 1]._id) 
                  ? "Select or drill down" 
                  : "Category selected"}
              </span>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={() => handleSelectCurrent(selectedPath[selectedPath.length - 1])}
              >
                <Check className="mr-1 h-3 w-3" />
                Select "{selectedPath[selectedPath.length - 1].name}"
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
