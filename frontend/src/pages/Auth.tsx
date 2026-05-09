import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6">
        <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-semibold">Welcome to Jefplexity</CardTitle>
            <CardDescription>Sign in to start researching with a Perplexity-style assistant.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => login("google")}>
              Continue with Google
            </Button>
            <Button className="w-full" size="lg" variant="secondary" onClick={() => login("github")}>
              Continue with GitHub
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
