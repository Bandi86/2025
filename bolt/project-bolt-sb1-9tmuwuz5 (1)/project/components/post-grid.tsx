import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  createdAt: Date;
  category?: {
    id: string;
    name: string;
  } | null;
  author: {
    id: string;
    name: string | null;
  };
}

interface PostGridProps {
  posts: Post[];
}

export function PostGrid({ posts }: PostGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          className="group block"
        >
          <article className="flex flex-col h-full overflow-hidden rounded-lg border bg-card transition-colors hover:bg-muted/50">
            {post.featuredImage ? (
              <div className="relative aspect-video w-full overflow-hidden">
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="aspect-video w-full bg-muted" />
            )}
            <div className="flex flex-col flex-1 p-4 space-y-3">
              <div className="space-y-1">
                {post.category && (
                  <Badge variant="secondary" className="mb-2">
                    {post.category.name}
                  </Badge>
                )}
                <h3 className="text-lg font-medium transition-colors group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
              </div>
              <div className="mt-auto flex items-center pt-3 text-sm text-muted-foreground">
                <span className="text-xs">
                  {formatDate(post.createdAt)}
                </span>
                <span className="mx-2">•</span>
                <span className="text-xs">{post.author.name}</span>
              </div>
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}