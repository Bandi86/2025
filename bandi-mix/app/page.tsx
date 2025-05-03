import RenderPosts from '@/components/RenderPosts';

export default function Home() {
  return (
    <main className="text-3xl font-bold text-center mb-8">
      <section className="text-center px-4 py-8 max-w-4xl mx-auto">
        <RenderPosts />
      </section>
    </main>
  );
}
