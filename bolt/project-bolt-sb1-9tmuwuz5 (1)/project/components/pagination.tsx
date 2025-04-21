"use client"

import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  MoreHorizontal
} from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    
    router.push(
      `${pathname}?${createQueryString("page", page.toString())}`,
      { scroll: false }
    );
  };

  const renderPageButtons = () => {
    const buttons = [];
    
    // Always include first page
    buttons.push(
      <Button
        key="first"
        variant={currentPage === 1 ? "default" : "outline"}
        size="icon"
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
      >
        1
      </Button>
    );
    
    // Add ellipsis if there are many pages between first and currentPage
    if (currentPage > 3) {
      buttons.push(
        <Button
          key="ellipsis-1"
          variant="outline"
          size="icon"
          disabled
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }
    
    // Pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue; // Skip first and last as they're always included
      
      buttons.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="icon"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      );
    }
    
    // Add ellipsis if there are many pages between currentPage and last
    if (currentPage < totalPages - 2) {
      buttons.push(
        <Button
          key="ellipsis-2"
          variant="outline"
          size="icon"
          disabled
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      );
    }
    
    // Always include last page if there's more than one page
    if (totalPages > 1) {
      buttons.push(
        <Button
          key="last"
          variant={currentPage === totalPages ? "default" : "outline"}
          size="icon"
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          {totalPages}
        </Button>
      );
    }
    
    return buttons;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {renderPageButtons()}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}