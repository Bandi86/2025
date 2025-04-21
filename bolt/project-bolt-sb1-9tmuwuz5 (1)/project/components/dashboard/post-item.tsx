import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Post {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  createdAt: Date;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface PostItemProps {
  post: Post;
}

export function PostItem({ post }: PostItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg transition-colors hover:bg-muted/50">
      <div className="grid gap-1">
        <Link
          href={`/dashboard/posts/${post.id}`}
          className="font-medium hover:underline"
        >
          {post.title}
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant={post.published ? "default" : "secondary"}>
            {post.published ? "Published" : "Draft"}
          </Badge>
          {post.category && (
            <Badge variant="outline">{post.category.name}</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDate(post.createdAt)}
          </span>
        </div>
      </div>
      <Link 
        href={post.published ? `/blog/${post.slug}` : `/dashboard/posts/${post.id}`}
        className="text-sm font-medium underline-offset-4 hover:underline"
      >
        {post.published ? "View" : "Edit"}
      </Link>
    </div>
  );
}