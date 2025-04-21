import Image from "next/image";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface FeaturedPostCardProps {
  post: Post;
}

export function FeaturedPostCard({ post }: FeaturedPostCardProps) {
  return (
    <article className="relative overflow-hidden rounded-xl border bg-card">
      <div className="flex flex-col md:flex-row">
        <div className="relative md:w-1/2">
          {post.featuredImage ? (
            <div className="relative aspect-video w-full md:aspect-auto md:h-full overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : (
            <div className="aspect-video w-full md:aspect-auto md:h-full bg-muted" />
          )}
        </div>
        <div className="flex flex-col justify-between p-6 md:w-1/2">
          <div className="space-y-4">
            {post.category && (
              <Badge variant="secondary" className="mb-2">
                {post.category.name}
              </Badge>
            )}
            <h3 className="text-2xl md:text-3xl font-serif font-bold tracking-tight">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="text-muted-foreground">
                {post.excerpt}
              </p>
            )}
          </div>
          <div className="flex flex-col space-y-4 pt-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{post.author.name}</span>
              <span>•</span>
              <time dateTime={post.createdAt.toISOString()}>
                {formatDate(post.createdAt)}
              </time>
            </div>
            <Button asChild>
              <Link href={`/blog/${post.slug}`}>
                Read Article
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}