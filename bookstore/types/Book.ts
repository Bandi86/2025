export default interface Book {
  id: number;
  title: string;
  author_name: string | null; // Author name might be null if author_id is null
  isbn: string;
  price: number;
  stock: number;
}