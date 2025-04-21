import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPosts, getCategories } from "@/lib/actions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PostCreateButton } from "@/components/dashboard/post-create-button";
import { PostItem } from "@/components/dashboard/post-item";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BarChart3, BookOpen, FilePlus, PenSquare } from "lucide-react";

export default async function DashboardPage() {
  const { posts } = await getPosts({
    take: 5,
  });
  
  const { categories } = await getCategories();
  
  const publishedCount = posts?.filter(post => post.published).length || 0;
  const draftCount = posts?.filter(post => !post.published).length || 0;
  const categoryCount = categories?.length || 0;

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Dashboard"
        description="Manage your blog content and settings"
      >
        <PostCreateButton />
      </DashboardHeader>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Published Posts
            </CardTitle>
            <BookOpen className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Draft Posts</CardTitle>
            <PenSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Posts</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/posts">View all</Link>
              </Button>
            </div>
            <CardDescription>
              Your most recent blog posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {posts && posts.length > 0 ? (
              <div className="space-y-4">
                {posts.slice(0, 5).map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FilePlus className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  No posts yet. Create your first post to get started.
                </p>
                <PostCreateButton variant="outline" />
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Categories</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/categories">Manage</Link>
              </Button>
            </div>
            <CardDescription>
              Your blog categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            {categories && categories.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {categories.slice(0, 6).map((category) => (
                  <Card key={category.id} className="p-3">
                    <p className="font-medium truncate">{category.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Slug: {category.slug}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No categories yet. Create categories to organize your posts.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}