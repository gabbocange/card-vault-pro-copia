// src/routes/login.tsx — FILE COMPLETO (BOTTONE FUNZIONANTE)
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Redirect se già loggato
  useEffect(() => {
    if (user) {
      navigate({ to: "/" });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    const result = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (result.error) {
      setError(result.error);
    } else if (isSignUp) {
      setMessage("Account created! You can now sign in.");
      setIsSignUp(false);
      setPassword("");
    } else {
      navigate({ to: "/" });
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError("");
    setMessage("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-[#080b12] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card-analytics space-y-6">
        <div className="text-center">
          <div className="size-12 rounded-xl bg-violet-500 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">CV</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="text-sm text-white/50 mt-1">
            {isSignUp ? "Start tracking your collection" : "Sign in to your vault"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-medium text-white/70">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="bg-surface border-white/10 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-medium text-white/70">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="bg-surface border-white/10 rounded-xl"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20 text-green-400 text-sm">
              {message}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-violet-500 text-white hover:bg-violet-600 font-medium text-sm rounded-xl h-11">
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="text-center pb-2">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-violet-400 hover:text-violet-300 py-3 px-6 rounded-xl hover:bg-violet-500/10 transition-all"
          >
            {isSignUp ? "Already have an account? Sign in" : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}