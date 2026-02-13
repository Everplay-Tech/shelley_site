export default function Gallery() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">The Gallery</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          A collection of our finest handcrafted instruments. Each one a unique masterpiece.
        </p>
      </section>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl border border-white/5 flex items-center justify-center">
            <span className="text-white/20">Guitar Image Placeholder {i}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
