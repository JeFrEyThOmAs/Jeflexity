import { createClient } from "@/lib/supabase/client";
import { GitBranch } from "lucide-react";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const supabase = createClient();

export default function Auth() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        localStorage.setItem("jefplexity-authenticated", "1");
        navigate("/conversation", { replace: true });
      }
    });
  }, [navigate]);

  async function login(provider: "github" | "google") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/conversation`,
      },
    });

    if (error) {
      alert("Unable to sign in right now. Please try again.");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_35%)] pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10">
        <Link
          to="/"
          className="text-2xl font-semibold tracking-tight"
        >
          Sapien<span className="text-indigo-400">X</span>
        </Link>

        <Link
          to="/"
          className="text-sm text-white/60 hover:text-white transition"
        >
          Back to Home
        </Link>
      </nav>

      {/* Auth Section */}
      <section className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl p-8 shadow-2xl shadow-indigo-500/10">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 border border-white/10 bg-white/5 rounded-full px-4 py-2 text-sm text-white/70 mb-6">
              Continue to SapienX
            </div>

            <h1 className="text-4xl font-semibold tracking-tight">
              Welcome Back
            </h1>

            <p className="mt-4 text-white/60 leading-relaxed">
              Sign in to continue exploring the web with AI-powered search,
              sources, and follow-up conversations.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => login("google")}
              className="w-full rounded-2xl bg-white text-black py-3.5 font-medium transition hover:bg-white/90"
            >
              Continue with Google
            </button>

            <button
              onClick={() => login("github")}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 font-medium text-white transition hover:bg-white/10 flex items-center justify-center gap-2"
            >
              <GitBranch className="size-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-white/40">
            By continuing, you agree to explore smarter 😄
          </div>
        </div>
      </section>
    </main>
  );
}