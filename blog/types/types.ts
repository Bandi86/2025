export default interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number;
  authorId: number;
  content: string;
  description: string;
  published: boolean;
}

export default interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  image: string;
  createdAt: Date;
  updatedAt: Date;
  posts: Post[];
}

export default interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  posts: Post[];
}
