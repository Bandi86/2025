export default function AboutPage() {
  return (
    <div className="container px-4 py-16 mx-auto space-y-8 max-w-3xl">
      <h1 className="text-4xl sm:text-5xl font-serif font-bold tracking-tight">About Us</h1>
      
      <p className="text-xl leading-relaxed">
        Welcome to Modern Blog, a platform dedicated to sharing insightful articles, stories, and perspectives on a wide range of topics.
      </p>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold tracking-tight">Our Mission</h2>
        <p className="leading-relaxed">
          Our mission is to create a space where ideas can flourish, knowledge can be shared, and perspectives can be expanded. 
          We believe in the power of well-crafted content to inform, inspire, and ignite meaningful conversations.
        </p>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold tracking-tight">What We Cover</h2>
        <p className="leading-relaxed">
          From technology and science to arts and culture, our diverse range of topics reflects the multifaceted nature of human interests.
          Each article is carefully crafted to provide value, whether that's in the form of practical insights, theoretical explorations, or compelling narratives.
        </p>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold tracking-tight">Join Our Community</h2>
        <p className="leading-relaxed">
          We invite you to become part of our growing community of readers and contributors. Whether you're here to learn, share, or simply explore, 
          you'll find a welcoming space that values intellectual curiosity and respectful discourse.
        </p>
      </div>
    </div>
  );
}