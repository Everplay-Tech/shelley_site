import GodotEmbed from "@/components/GodotEmbed";

export default function Workshop() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">The Workshop</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Where wood meets steel and passion becomes music. Experience the process of building a Shelley guitar.
        </p>
      </section>
      
      <section className="bg-white/5 rounded-3xl p-8 border border-white/10 min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/40 italic">Workshop Mini-Game Coming Soon</p>
        </div>
      </section>
    </div>
  );
}
