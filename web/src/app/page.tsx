import GodotEmbed from "@/components/GodotEmbed";

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="text-center py-20">
        <h2 className="text-6xl font-black mb-6 tracking-tight">
          CRAFTING <span className="text-shelley-amber">SOUND</span>, <br />
          BUILDING <span className="text-shelley-amber">LEGENDS</span>.
        </h2>
        <p className="text-xl text-white/60 max-w-2xl mx-auto">
          Welcome to the Shelley Workshop. Explore our artisan guitars and join Po on a journey through the art of lutherie.
        </p>
      </section>

      <section className="bg-white/5 rounded-3xl p-8 border border-white/10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl font-bold">The Site Navigator</h3>
            <p className="text-white/60">Po is ready to help you explore. Use the game to navigate the site.</p>
          </div>
          <span className="text-xs font-mono text-shelley-amber bg-shelley-amber/10 px-2 py-1 rounded">GODOT 4.3 EMBED</span>
        </div>
        <GodotEmbed gameName="site_navigator" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
          <h4 className="text-lg font-bold mb-4 uppercase">The Workshop</h4>
          <p className="text-white/60 mb-6">Take a look inside the shop where every Shelley guitar is born.</p>
          <a href="/workshop" className="text-shelley-amber font-medium hover:underline">Go to Workshop →</a>
        </div>
        <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
          <h4 className="text-lg font-bold mb-4 uppercase">The Gallery</h4>
          <p className="text-white/60 mb-6">Browse our completed works and custom orders.</p>
          <a href="/gallery" className="text-shelley-amber font-medium hover:underline">View Gallery →</a>
        </div>
        <div className="bg-white/5 p-8 rounded-2xl border border-white/5 hover:border-shelley-amber/30 transition-colors">
          <h4 className="text-lg font-bold mb-4 uppercase">About Us</h4>
          <p className="text-white/60 mb-6">Learn about the philosophy and hands behind the brand.</p>
          <a href="/about" className="text-shelley-amber font-medium hover:underline">Learn More →</a>
        </div>
      </div>
    </div>
  );
}
