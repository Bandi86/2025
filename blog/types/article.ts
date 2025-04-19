export default interface Articles {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: string[];
  slug: string;
  description: string;
  image: string;
  published: boolean;
}
