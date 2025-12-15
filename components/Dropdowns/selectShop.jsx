'use client';

import { useEffect, useState } from 'react';
import { useShopStore } from '@/store/shopStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Store, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SelectShop({ selectedShop, onShopSelect }) {
  const myShops = useShopStore((state) => state.myShops);
  const isLoading = useShopStore((state) => state.isLoading);
  const fetchMyShops = useShopStore((state) => state.fetchMyShops);
  
  // Internal state for uncontrolled usage (optional fallback)
  const [internalSelected, setInternalSelected] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Derived state: Use the prop if provided, otherwise use internal state
  const displayShop = selectedShop || internalSelected;

  // Fetch data on mount
  useEffect(() => {
    if (typeof fetchMyShops === 'function') {
      fetchMyShops();
    }
  }, [fetchMyShops]);

  const handleSelect = (shop) => {
    setInternalSelected(shop);
    setIsOpen(false);
    
    if (typeof onShopSelect === 'function') {
      onShopSelect(shop);
    }
  };

  // Loading State
  if (isLoading && (!myShops || myShops.length === 0)) {
    return (
      <div className="relative w-full max-w-xs">
        <label className="absolute top-0 left-0 -translate-y-full text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
          Select a Shop
        </label>
        <div className="flex items-center justify-center h-10 w-full border border-gray-200 rounded-md bg-gray-50 dark:bg-slate-800 dark:border-slate-700">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-slate-400" />
          <span className="ml-2 text-sm text-gray-500 dark:text-slate-400">Loading shops...</span>
        </div>
      </div>
    );
  }

  const shops = Array.isArray(myShops) ? myShops : [];
  const isDisabled = shops.length === 0;

  return (
    <div className="relative w-full max-w-xs">
      <label className="absolute top-0 left-0 -translate-y-full text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">
        Select a Shop
      </label>
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isDisabled}
            className={cn(
              "w-full justify-between",
              "dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100",
              !displayShop && "text-muted-foreground dark:text-slate-400"
            )}
          >
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="truncate">
                {displayShop 
                  ? displayShop.name || 'Unnamed shop'
                  : isDisabled 
                    ? 'No shops found' 
                    : 'Choose a shop...'
                }
              </span>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "transform rotate-180"
            )} />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-full max-w-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100" 
          align="start"
        >
          <DropdownMenuLabel className="dark:text-slate-300">My Shops</DropdownMenuLabel>
          <DropdownMenuSeparator className="dark:bg-slate-700" />
          
          {shops.length === 0 ? (
            <DropdownMenuItem 
              disabled 
              className="text-center text-muted-foreground dark:text-slate-400"
            >
              No shops available
            </DropdownMenuItem>
          ) : (
            shops.map((shop) => (
              <DropdownMenuItem
                key={shop?._id}
                onClick={() => shop && handleSelect(shop)}
                className={cn(
                  "cursor-pointer",
                  "dark:focus:bg-slate-700 dark:hover:bg-slate-700",
                  displayShop?._id === shop?._id && "bg-accent dark:bg-slate-700"
                )}
              >
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span className="truncate">{shop?.name || 'Unnamed shop'}</span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}