import { format } from "date-fns";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPostBySlug, getPosts } from "@/lib/actions";
import { formatDate } from "@/lib/utils";
import { PostContent } from "@/components/post-content";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { post, error } = await getPostBySlug(params.slug);
  
  if (error || !post || !post.published) {
    notFound();
  }

  const { posts: relatedPosts } = await getPosts({
    published: true,
    categoryId: post.categoryId || undefined,
    take: 3,
  });
  
  const filteredRelatedPosts = relatedPosts.filter(
    (relatedPost) => relatedPost.id !== post.id
  );

  return (
    <article className="container px-4 py-16 mx-auto">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col space-y-8">
          {post.category && (
            <Link href={`/blog?categoryId=${post.category.id}`}>
              <Badge variant="secondary" className="w-fit">
                {post.category.name}
              </Badge>
            </Link>
          )}

          <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-xl text-muted-foreground">
              {post.excerpt}
            </p>
          )}
          
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={post.author.image || ""} alt={post.author.name || "Author"} />
              <AvatarFallback>{post.author.name?.charAt(0) || "A"}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">{post.author.name}</p>
              <p className="text-sm text-muted-foreground">
                Published on {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          
          {post.featuredImage && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden">
              <Image
                src={post.featuredImage}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          
          <Separator />
          
          <PostContent content={post.content} />
          
          <Separator />
        </div>
        
        {filteredRelatedPosts.length > 0 && (
          <div className="mt-16 space-y-8">
            <h2 className="text-2xl font-serif font-bold tracking-tight">
              Related Posts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredRelatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  href={`/blog/${relatedPost.slug}`}
                  className="group space-y-3"
                >
                  {relatedPost.featuredImage && (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                      <Image
                        src={relatedPost.featuredImage}
                        alt={relatedPost.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h3 className="font-medium group-hover:underline">
                    {relatedPost.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}