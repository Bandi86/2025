import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PostCreateButtonProps extends ButtonProps {}

export function PostCreateButton({ className, variant, ...props }: PostCreateButtonProps) {
  return (
    <Button
      variant={variant || "default"}
      className={cn(
        "h-10",
        className
      )}
      asChild
      {...props}
    >
      <Link href="/dashboard/posts/new">
        <Plus className="mr-2 h-4 w-4" />
        New Post
      </Link>
    </Button>
  );
}