"use client"

import * as React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = React.useState(
    searchParams.get("search") || ""
  );

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value) {
      params.set(name, value);
    } else {
      params.delete(name);
    }
    
    // Reset to page 1 when searching
    params.delete('page');
    
    return params.toString();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.push(
      `${pathname}?${createQueryString("search", searchTerm)}`,
      { scroll: false }
    );
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <h3 className="font-medium">Search</h3>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search posts..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button type="submit" size="sm" className="absolute right-1 top-1.5 h-7">
          Search
        </Button>
      </div>
    </form>
  );
}