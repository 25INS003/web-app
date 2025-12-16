'use client';

import { useEffect, useMemo, useState } from 'react';
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
    const {
        myShops = [],
        isLoading,
        fetchMyShops,
        currentShop,
        setCurrentShop,
    } = useShopStore();

    const [isOpen, setIsOpen] = useState(false);

    // Fetch shops on mount
    useEffect(() => {
        if (typeof fetchMyShops === 'function') {
            fetchMyShops();
        }
    }, [fetchMyShops]);

    /**
     * ✅ Selected shop derived safely
     */
    const selectedShop = useMemo(() => {
        if (!currentShop?._id) return null;
        return myShops.find((s) => s?._id === currentShop._id) ?? null;
    }, [myShops, currentShop?._id]);

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
                <div className="flex items-center justify-center h-10 border rounded-md dark:border-slate-700">
                    <Loader2 className="h-4 w-4 animate-spin mr-2 dark:text-slate-400" />
                    <span className="text-sm text-gray-500 dark:text-slate-400">
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
                <label className="absolute top-0 left-0 -translate-y-full text-sm font-medium mb-1 dark:text-slate-400">
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
                            "dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-100",
                            !selectedShop && "text-muted-foreground dark:text-slate-400"
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

                <DropdownMenuContent
                    align="start"
                    className="w-full max-w-xs dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
                >
                    <DropdownMenuLabel>My Shops</DropdownMenuLabel>
                    <DropdownMenuSeparator className="dark:bg-slate-700" />

                    {myShops.length === 0 ? (
                        <DropdownMenuItem disabled className="text-muted-foreground">
                            No shops available
                        </DropdownMenuItem>
                    ) : (
                        myShops.map((shop) => (
                            <DropdownMenuItem
                                key={shop?._id}
                                onClick={() => handleSelect(shop)}
                                className={cn(
                                    "cursor-pointer",
                                    "dark:hover:bg-slate-700 dark:focus:bg-slate-700",
                                    shop?._id === currentShop?._id &&
                                    "bg-accent dark:bg-slate-700"
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
