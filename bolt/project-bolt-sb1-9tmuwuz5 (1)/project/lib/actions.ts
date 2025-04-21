'use server'

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";

// Post schemas
const PostSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(200).optional(),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  categoryId: z.string().optional(),
  published: z.boolean().default(false),
  featuredImage: z.string().optional(),
});

// Category schemas
const CategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(200).optional(),
});

// User schemas
const UserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
});

// Post actions
export async function getPosts(options?: { 
  published?: boolean, 
  categoryId?: string, 
  authorId?: string,
  take?: number,
  skip?: number
}) {
  try {
    const { published, categoryId, authorId, take, skip } = options || {};
    
    const posts = await db.post.findMany({
      where: {
        published: published !== undefined ? published : undefined,
        categoryId: categoryId ? categoryId : undefined,
        authorId: authorId ? authorId : undefined,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: take || undefined,
      skip: skip || undefined,
    });
    
    return { posts };
  } catch (error) {
    return { error: "Failed to fetch posts" };
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const post = await db.post.findUnique({
      where: { slug },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });
    
    if (!post) {
      return { error: "Post not found" };
    }
    
    return { post };
  } catch (error) {
    return { error: "Failed to fetch post" };
  }
}

export async function createPost(formData: FormData, authorId: string) {
  const validatedFields = PostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: formData.get("excerpt"),
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId") || undefined,
    published: formData.get("published") === "true",
    featuredImage: formData.get("featuredImage") || undefined,
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, content, excerpt, slug, categoryId, published, featuredImage } = validatedFields.data;

  try {
    await db.post.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        categoryId,
        published,
        featuredImage,
        authorId,
      },
    });

    revalidatePath("/blog");
    revalidatePath("/dashboard/posts");
    
    return { success: "Post created successfully" };
  } catch (error) {
    if (error.code === "P2002") {
      return { error: "A post with this slug already exists." };
    }
    return { error: "Failed to create post." };
  }
}

export async function updatePost(
  postId: string,
  formData: FormData,
  authorId: string
) {
  const validatedFields = PostSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    excerpt: formData.get("excerpt"),
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId") || undefined,
    published: formData.get("published") === "true",
    featuredImage: formData.get("featuredImage") || undefined,
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { title, content, excerpt, slug, categoryId, published, featuredImage } = validatedFields.data;

  try {
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { error: "Post not found" };
    }

    if (post.authorId !== authorId) {
      return { error: "You don't have permission to update this post" };
    }

    await db.post.update({
      where: { id: postId },
      data: {
        title,
        content,
        excerpt,
        slug,
        categoryId,
        published,
        featuredImage,
      },
    });

    revalidatePath(`/blog/${slug}`);
    revalidatePath("/blog");
    revalidatePath("/dashboard/posts");
    
    return { success: "Post updated successfully" };
  } catch (error) {
    if (error.code === "P2002") {
      return { error: "A post with this slug already exists." };
    }
    return { error: "Failed to update post." };
  }
}

export async function deletePost(postId: string, authorId: string) {
  try {
    const post = await db.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return { error: "Post not found" };
    }

    if (post.authorId !== authorId) {
      return { error: "You don't have permission to delete this post" };
    }

    await db.post.delete({
      where: { id: postId },
    });

    revalidatePath("/blog");
    revalidatePath("/dashboard/posts");
    
    return { success: "Post deleted successfully" };
  } catch (error) {
    return { error: "Failed to delete post." };
  }
}

// Category actions
export async function getCategories() {
  try {
    const categories = await db.category.findMany({
      orderBy: {
        name: 'asc',
      },
    });
    
    return { categories };
  } catch (error) {
    return { error: "Failed to fetch categories" };
  }
}

export async function createCategory(formData: FormData) {
  const validatedFields = CategorySchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, slug, description } = validatedFields.data;

  try {
    await db.category.create({
      data: {
        name,
        slug,
        description,
      },
    });

    revalidatePath("/dashboard/categories");
    
    return { success: "Category created successfully" };
  } catch (error) {
    if (error.code === "P2002") {
      return { error: "A category with this name or slug already exists." };
    }
    return { error: "Failed to create category." };
  }
}

// Authentication actions
export async function registerUser(formData: FormData) {
  const validatedFields = UserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: "USER", // Default role for new registrations
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid fields",
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, role } = validatedFields.data;

  try {
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "A user with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });
    
    return { success: "User registered successfully" };
  } catch (error) {
    return { error: "Failed to register user." };
  }
}