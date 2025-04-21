"use client"

import { useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  categories: Category[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('categoryId')
  );

  const createQueryString = (name: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === null) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    
    // Reset to page 1 when changing category
    params.delete('page');
    
    return params.toString();
  };

  const handleCategoryClick = (categoryId: string) => {
    const newCategoryId = selectedCategory === categoryId ? null : categoryId;
    setSelectedCategory(newCategoryId);
    
    router.push(
      `${pathname}?${createQueryString('categoryId', newCategoryId)}`,
      { scroll: false }
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Categories</h3>
      <ScrollArea className="h-full max-h-[280px] pr-3">
        <div className="space-y-2">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer mr-2 mb-2"
            onClick={() => handleCategoryClick(selectedCategory || "")}
          >
            All
          </Badge>
          
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className="cursor-pointer mr-2 mb-2"
              onClick={() => handleCategoryClick(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}