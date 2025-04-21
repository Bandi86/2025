import { getCategories } from "@/lib/actions";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CategoriesTable } from "@/components/dashboard/categories-table";
import { EmptyPlaceholder } from "@/components/dashboard/empty-placeholder";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function CategoriesPage() {
  const { categories, error } = await getCategories();

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Categories"
        description="Manage your blog categories"
      >
        <Button asChild>
          <Link href="/dashboard/categories/new">New Category</Link>
        </Button>
      </DashboardHeader>
      
      {categories?.length ? (
        <CategoriesTable categories={categories} />
      ) : (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="category" />
          <EmptyPlaceholder.Title>No categories created</EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            You haven't created any categories yet. Categories help organize your content.
          </EmptyPlaceholder.Description>
          <Button asChild variant="outline">
            <Link href="/dashboard/categories/new">New Category</Link>
          </Button>
        </EmptyPlaceholder>
      )}
    </DashboardShell>
  );
}