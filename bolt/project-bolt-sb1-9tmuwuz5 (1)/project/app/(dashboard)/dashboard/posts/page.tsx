import { getPosts } from "@/lib/actions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PostCreateButton } from "@/components/dashboard/post-create-button";
import { PostsTable } from "@/components/dashboard/posts-table";
import { EmptyPlaceholder } from "@/components/dashboard/empty-placeholder";

export default async function PostsPage() {
  const { posts, error } = await getPosts();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Posts"
        description="Create and manage your blog posts"
      >
        <PostCreateButton />
      </DashboardHeader>
      
      {posts?.length ? (
        <PostsTable posts={posts} />
      ) : (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="post" />
          <EmptyPlaceholder.Title>No posts created</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            You haven't created any posts yet. Start creating content.
          </EmptyPlaceholder.Description>
          <PostCreateButton variant="outline" />
        </EmptyPlaceholder>
      )}
    </DashboardShell>
  );
}