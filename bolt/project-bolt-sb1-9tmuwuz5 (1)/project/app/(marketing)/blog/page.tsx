import { getPosts, getCategories } from "@/lib/actions";
import { PostGrid } from "@/components/post-grid";
import { CategoryFilter } from "@/components/category-filter";
import { SearchInput } from "@/components/search-input";
import { Pagination } from "@/components/pagination";

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: {
    categoryId?: string;
    search?: string;
    page?: string;
  };
}) {
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const categoryId = searchParams?.categoryId;
  const search = searchParams?.search;
  
  const postsPerPage = 9;
  const skip = (page - 1) * postsPerPage;
  
  const { posts, error } = await getPosts({
    published: true,
    categoryId,
    take: postsPerPage,
    skip,
  });
  
  const { categories } = await getCategories();

  return (
    <div className="container px-4 py-16 mx-auto">
      <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight mb-8">Blog</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="md:col-span-1 space-y-6">
          <SearchInput />
          
          {categories && categories.length > 0 && (
            <CategoryFilter categories={categories} />
          )}
        </div>
        
        <div className="md:col-span-3 space-y-8">
          {posts && posts.length > 0 ? (
            <>
              <PostGrid posts={posts} />
              <Pagination
                currentPage={page}
                totalPages={Math.ceil(posts.length / postsPerPage)}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-xl font-medium mb-2">No posts found</h3>
              <p className="text-muted-foreground">
                Try changing your search criteria or check back later for new content.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}