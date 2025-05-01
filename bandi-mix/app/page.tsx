import CurrentTipp from '@/components/CurrentTipp';

export default function Home() {
  return (
    <main className='text-3xl font-bold text-center mb-8'>
        <span>Előző napi ingyenes tipp eredménye:</span>
      <section className='text-center px-4 py-8 max-w-4xl mx-auto'>
        <CurrentTipp />
      </section>
    </main>
  );
}
