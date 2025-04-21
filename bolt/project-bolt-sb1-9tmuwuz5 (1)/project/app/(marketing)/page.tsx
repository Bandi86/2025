import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getPosts } from "@/lib/actions";
import { FeaturedPostCard } from "@/components/featured-post-card";
import { PostGrid } from "@/components/post-grid";

export default async function Home() {
  const { posts, error } = await getPosts({ 
    published: true,
    take: 6 
  });

  const featuredPost = posts && posts.length > 0 ? posts[0] : null;
  const recentPosts = posts && posts.length > 1 ? posts.slice(1) : [];

  return (
    <div className="container px-4 py-16 mx-auto space-y-16">
      <section className="space-y-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold tracking-tight">
          Welcome to Modern Blog
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Discover insightful articles, stories, and perspectives on a wide range of topics.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button asChild size="lg">
            <Link href="/blog">
              Read Articles
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">
              About Us
            </Link>
          </Button>
        </div>
      </section>

      {featuredPost && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-bold tracking-tight">Featured Post</h2>
            <Button asChild variant="ghost">
              <Link href="/blog">
                View All Posts
              </Link>
            </Button>
          </div>
          <FeaturedPostCard post={featuredPost} />
        </section>
      )}

      {recentPosts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-bold tracking-tight">Recent Posts</h2>
            <Button asChild variant="ghost">
              <Link href="/blog">
                View All Posts
              </Link>
            </Button>
          </div>
          <PostGrid posts={recentPosts} />
        </section>
      )}
    </div>
  );
}