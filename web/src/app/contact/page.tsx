export default function Contact() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-4xl font-bold mb-4">Contact Us</h2>
        <p className="text-white/60 text-lg max-w-2xl">
          Interested in a custom build or have questions? Get in touch.
        </p>
      </section>
      
      <div className="max-w-xl bg-white/5 p-8 rounded-2xl border border-white/5">
        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/60">Name</label>
            <input type="text" className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/60">Email</label>
            <input type="email" className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-white/60">Message</label>
            <textarea rows={5} className="bg-white/5 border border-white/10 rounded-lg p-3 outline-none focus:border-shelley-amber transition-colors"></textarea>
          </div>
          <button type="submit" className="mt-4 bg-shelley-amber text-shelley-charcoal font-bold py-4 rounded-lg hover:bg-yellow-400 transition-colors">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
