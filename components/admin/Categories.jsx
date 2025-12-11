"use client";

import { useEffect, useState } from "react";
import { useCategoryStore } from "@/store/categoryStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SelectCategory() {
  const {
    categories = [], // Default to empty array
    fetchCategories,
    isLoading,
    deleteCategory,
    error, // Assuming your store has an error state
  } = useCategoryStore();

  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [localError, setLocalError] = useState(null);

  // Safely check if categories is valid
  const safeCategories = Array.isArray(categories) ? categories : [];
  const hasCategories = safeCategories.length > 0;

  // Initial fetch on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset local error
        setLocalError(null);
        await fetchCategories?.(); // Optional chaining in case function doesn't exist
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Failed to fetch categories");
      }
    };

    if (!hasCategories) {
      fetchData();
    }
  }, [fetchCategories, hasCategories]);

  const handleDelete = async (id) => {
    if (!id) {
      setLocalError("Invalid category ID");
      return;
    }

    try {
      setDeleteLoadingId(id);
      setLocalError(null);
      
      // Ensure deleteCategory exists and is callable
      if (typeof deleteCategory === "function") {
        await deleteCategory(id);
      } else {
        throw new Error("Delete function not available");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  // Handle loading state
  if (isLoading && !hasCategories) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading categories...</span>
      </div>
    );
  }

  // Show error state if there's an error
  const displayError = error || localError;
  if (displayError && !hasCategories) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {displayError}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Categories ({safeCategories.length})
        </h1>
        <Button
          onClick={() => fetchCategories?.()}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {/* Display any errors that occur during operations */}
      {displayError && hasCategories && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{displayError}</AlertDescription>
        </Alert>
      )}

      {!hasCategories && !isLoading && !displayError ? (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">No categories found.</p>
          <Button
            onClick={() => fetchCategories?.()}
            variant="outline"
            className="mt-2"
          >
            Load Categories
          </Button>
        </div>
      ) : (
        <ul className="space-y-2">
          {safeCategories.map((cat) => {
            // Null check for category object
            if (!cat || typeof cat !== "object") {
              console.warn("Invalid category data:", cat);
              return null; // Skip rendering invalid items
            }

            const categoryId = cat?._id || cat?.id; // Support both _id and id
            const categoryName = cat?.name || "Unnamed Category";

            if (!categoryId) {
              console.warn("Category missing ID:", cat);
              return null;
            }

            return (
              <li
                key={categoryId}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="space-y-1">
                  <span className="font-medium">{categoryName}</span>
                  <p className="text-sm text-muted-foreground">
                    ID: {categoryId}
                  </p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={deleteLoadingId === categoryId}
                    >
                      {deleteLoadingId === categoryId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVertical className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        // Optional: Add edit functionality
                        console.log("Edit:", categoryId);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(categoryId)}
                      className="text-destructive focus:text-destructive"
                      disabled={deleteLoadingId === categoryId}
                    >
                      {deleteLoadingId === categoryId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}