import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_35%)] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sapien<span className="text-indigo-400">X</span>
        </h1>

        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="px-4 py-2 text-sm text-white/80 hover:text-white transition"
          >
            Login
          </Link>

          <Link
            to="/auth"
            className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition"
          >
            Start for Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-24 md:pt-32">
        <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 text-sm text-white/70 mb-8">
          AI-powered search engine
        </div>

        <h1 className="text-5xl md:text-7xl font-semibold max-w-5xl leading-tight tracking-tight">
          Search Smarter with{" "}
          <span className="text-indigo-400">SapienX</span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/60 leading-relaxed">
          AI-powered search with sources, follow-up exploration, and smart
          autocomplete built for faster thinking.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link
            to="/auth"
            className="px-7 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 transition font-medium"
          >
            Start for Free
          </Link>

          <Link
            to="/auth"
            className="px-7 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition font-medium"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Preview Card */}
      <section className="relative z-10 px-6 mt-24 flex justify-center">
        <div className="w-full max-w-5xl rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl shadow-indigo-500/10">
          <div className="rounded-2xl bg-black/40 border border-white/10 p-4 text-white/70 mb-6">
            What are the best ways to learn Gen AI in 2026?
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-white">
                AI Response
              </h3>

              <p className="text-white/65 leading-relaxed">
                The fastest way to learn Gen AI today is by combining LLM
                fundamentals, RAG systems, LangChain workflows, and hands-on
                projects with real deployment.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70">
                LangChain
              </span>

              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70">
                RAG
              </span>

              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70">
                LLMs
              </span>

              <span className="px-3 py-1 rounded-full bg-white/10 text-white/70">
                Sources Included
              </span>
            </div>

            <div>
              <h4 className="text-white font-medium mb-3">
                Follow-up Questions
              </h4>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
                  How does RAG improve LLM accuracy?
                </div>

                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
                  What projects should beginners build first?
                </div>

                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70">
                  LangChain vs LangGraph differences?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 px-6 py-28 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">
              Smart AI Search
            </h3>

            <p className="text-white/60 leading-relaxed">
              Context-aware answers designed for exploration instead of simple
              keyword matching.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">
              Source-backed Answers
            </h3>

            <p className="text-white/60 leading-relaxed">
              Get AI-generated responses supported with real web sources and
              references.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-3">
              Follow-up Exploration
            </h3>

            <p className="text-white/60 leading-relaxed">
              Continue discovering related ideas through intelligent follow-up
              search prompts.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 px-6 pb-24">
        <div className="max-w-4xl mx-auto text-center border border-white/10 bg-white/5 rounded-3xl p-12 backdrop-blur-sm">
          <h2 className="text-4xl font-semibold tracking-tight">
            Start exploring with SapienX
          </h2>

          <p className="mt-4 text-white/60 max-w-xl mx-auto leading-relaxed">
            Ask better questions, discover deeper insights, and explore the web
            with AI.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/auth"
              className="px-7 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 transition font-medium"
            >
              Start for Free
            </Link>

            <Link
              to="/auth"
              className="px-7 py-3 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 transition font-medium"
            >
              Login
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}