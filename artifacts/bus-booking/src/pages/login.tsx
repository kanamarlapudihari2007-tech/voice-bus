import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, Loader2, Mic, MapPin, User, Lock } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLogin();

  useEffect(() => {
    if (user) setLocation(user.role === "ADMIN" ? "/admin" : "/search");
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      const response = await loginMutation.mutateAsync({ data: { username, password } });
      setUser({ id: response.user.id, username: response.user.username, role: response.user.role, token: response.token });
      toast({ title: "Welcome back!", description: `Signed in as ${response.user.username}` });
      setLocation(response.user.role === "ADMIN" ? "/admin" : "/search");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login failed", description: error.message || "Invalid credentials" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — background image */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(8,25,60,0.88) 0%, rgba(5,80,115,0.82) 100%), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -left-20 w-64 h-64 bg-blue-400/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-extrabold tracking-tight">VoiceBus</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight drop-shadow-md">
              Your journey starts<br />with a voice.
            </h2>
            <p className="text-white/60 mt-4 text-base max-w-xs">
              Search routes, book seats, and manage your trips — all hands-free with voice commands.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-xs">
            {[
              { icon: <Mic className="w-4 h-4" />, text: "Voice-powered search" },
              { icon: <MapPin className="w-4 h-4" />, text: "100+ routes available" },
              { icon: <Bus className="w-4 h-4" />, text: "Real-time seat selection" },
            ].map((feat) => (
              <div key={feat.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/30 flex items-center justify-center text-cyan-200 flex-shrink-0">
                  {feat.icon}
                </div>
                <span className="text-white/85 text-sm font-medium">{feat.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/35 text-xs">
          © {new Date().getFullYear()} VoiceBus. All rights reserved.
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900">VoiceBus</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sign in</h1>
            <p className="text-gray-500 mt-2">Welcome back! Enter your credentials to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-semibold text-gray-700 text-sm">Username</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="h-12 pl-10 bg-white border-gray-200 focus:border-primary text-base"
                  data-testid="input-username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold text-gray-700 text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-12 pl-10 bg-white border-gray-200 focus:border-primary text-base"
                  data-testid="input-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-2"
              disabled={loginMutation.isPending}
              data-testid="button-submit-login"
            >
              {loginMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
                : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Demo credentials</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p><span className="font-bold">Admin:</span> admin / admin123</p>
              <p><span className="font-bold">User:</span> john_doe / password123</p>
            </div>
          </div>

          <p className="text-center mt-8 text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-semibold hover:underline" data-testid="link-goto-register">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
