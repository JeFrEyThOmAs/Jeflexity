import "./index.css";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { createClient } from "./lib/supabase/client";

const supabase = createClient();

function ProtectedRoute({ hasSession }: { hasSession: boolean }) {
  return hasSession ? <Outlet /> : <Navigate to="/auth" replace />;
}

function PublicOnlyRoute({ hasSession }: { hasSession: boolean }) {
  return hasSession ? <Navigate to="/conversation" replace /> : <Outlet />;
}



export function App() {
  const [isReady, setIsReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const authed = !!data.session;
      setHasSession(authed);
      if (authed) localStorage.setItem("jefplexity-authenticated", "1");
      else localStorage.removeItem("jefplexity-authenticated");
      setIsReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authed = !!session;
      setHasSession(authed);
      if (authed) localStorage.setItem("jefplexity-authenticated", "1");
      else localStorage.removeItem("jefplexity-authenticated");
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!isReady) return null;

  return (
   <BrowserRouter>
    <Routes>
      <Route element={<PublicOnlyRoute hasSession={hasSession} />}>
        <Route path="/auth" element={<Auth />} />
      </Route>

      <Route element={<ProtectedRoute hasSession={hasSession} />}>
        <Route path="/conversation" element={<Dashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/conversation" replace />} />
    </Routes>
   </BrowserRouter>
   );
}

export default App;
