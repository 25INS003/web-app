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

export default function SelectShop({ onShopSelect }) {
  const myShops = useShopStore((state) => state.myShops);
  const isLoading = useShopStore((state) => state.isLoading);
  const fetchMyShops = useShopStore((state) => state.fetchMyShops);
  
  const [selectedShop, setSelectedShop] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    if (typeof fetchMyShops === 'function') {
      fetchMyShops();
    }
  }, [fetchMyShops]);

  const handleSelect = (shop) => {
    setSelectedShop(shop);
    setIsOpen(false);
    
    if (typeof onShopSelect === 'function') {
      onShopSelect(shop);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="w-full max-w-xs">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select a Shop
        </label>
        <div className="flex items-center justify-center h-10 w-full border border-gray-200 rounded-md bg-gray-50">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <span className="ml-2 text-sm text-gray-500">Loading shops...</span>
        </div>
      </div>
    );
  }

  const shops = Array.isArray(myShops) ? myShops : [];
  const isDisabled = shops.length === 0;

  return (
    <div className="w-full max-w-xs">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select a Shop
      </label>
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={isDisabled}
            className={cn(
              "w-full justify-between",
              !selectedShop && "text-muted-foreground"
            )}
          >
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              <span className="truncate">
                {selectedShop 
                  ? selectedShop.name || 'Unnamed shop'
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
        
        <DropdownMenuContent className="w-full max-w-xs" align="start">
          <DropdownMenuLabel>My Shops</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {shops.length === 0 ? (
            <DropdownMenuItem disabled className="text-center text-muted-foreground">
              No shops available
            </DropdownMenuItem>
          ) : (
            shops.map((shop) => (
              <DropdownMenuItem
                key={shop?._id}
                onClick={() => shop && handleSelect(shop)}
                className={cn(
                  "cursor-pointer",
                  selectedShop?._id === shop?._id && "bg-accent"
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