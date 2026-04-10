import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(searchParams.get("tab") === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: integrate with Supabase auth
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <div className="glass rounded-lg p-8 w-full max-w-md">
          <div className="flex items-center gap-2 justify-center mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-heading font-bold">MetaClean</span>
          </div>

          <h1 className="text-xl font-heading font-semibold text-center mb-6">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full glow-primary-sm">
              {isSignup ? "Sign up" : "Log in"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground mt-6">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary hover:underline font-medium"
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
