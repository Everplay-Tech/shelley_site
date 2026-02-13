export default function About() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">About Shelley Guitars</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Founded on the principles of traditional lutherie and modern innovation.
        </p>
      </section>
      
      <div className="prose prose-invert max-w-none">
        <p>
          Shelley Guitars was born from a desire to create instruments that are not just tools, 
          but extensions of the musician's soul. Our mascot, Po, represents the curious and 
          playful spirit we bring to every build.
        </p>
      </div>
    </div>
  );
}
