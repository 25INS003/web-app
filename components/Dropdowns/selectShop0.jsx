'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
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

export default function GlobalSelectShop({ onShopSelect, ShowLabel = true }) {
    const myShops = useShopStore((state) => state.myShops) || [];
    const isLoading = useShopStore((state) => state.isLoading);
    const fetchMyShops = useShopStore((state) => state.fetchMyShops);
    const currentShop = useShopStore((state) => state.currentShop);
    const setCurrentShop = useShopStore((state) => state.setCurrentShop);

    const [isOpen, setIsOpen] = useState(false);
    const hasFetched = useRef(false);

    // Fetch shops on mount
    useEffect(() => {
        if (!hasFetched.current && typeof fetchMyShops === 'function' && !isLoading) {
            hasFetched.current = true;
            fetchMyShops();
        }
    }, [fetchMyShops, isLoading]);

    /**
     * ✅ Selected shop derived safely
     */
    const selectedShop = useMemo(() => {
        if (!currentShop?.id) return null;
        return myShops.find((s) => s?.id === currentShop.id) ?? null;
    }, [myShops, currentShop?.id]);

    const handleSelect = (shop) => {
        if (!shop) return;

        setCurrentShop(shop);
        setIsOpen(false);

        if (typeof onShopSelect === 'function') {
            onShopSelect(shop);
        }
    };

    // Loading state (initial fetch)
    if (isLoading && myShops.length === 0) {
        return (
            <div className="relative w-full max-w-xs">
                <div className="flex items-center justify-center h-10 rounded-md border border-border">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                        Loading shops...
                    </span>
                </div>
            </div>
        );
    }

    const isDisabled = myShops.length === 0;

    return (
        <div className="relative w-full max-w-xs">
            {ShowLabel && (
                <label className="absolute top-0 left-0 -translate-y-full text-sm font-medium mb-1 text-muted-foreground">
                    Select a Shop
                </label>
            )}

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
                                {selectedShop?.name ?? 'Choose a shop...'}
                            </span>
                        </div>
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 transition-transform",
                                isOpen && "rotate-180"
                            )}
                        />
                    </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-full max-w-xs">
                    <DropdownMenuLabel>My Shops</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {myShops.length === 0 ? (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                            No shops available
                        </DropdownMenuItem>
                    ) : (
                        myShops.map((shop) => (
                            <DropdownMenuItem
                                key={shop?.id}
                                onClick={() => handleSelect(shop)}
                                className={cn(
                                    "cursor-pointer",
                                    shop?.id === currentShop?.id &&
                                    "bg-accent text-accent-foreground"
                                )}
                            >
                                <Store className="h-4 w-4 mr-2" />
                                {shop?.name || 'Unnamed shop'}
                            </DropdownMenuItem>
                        ))
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
