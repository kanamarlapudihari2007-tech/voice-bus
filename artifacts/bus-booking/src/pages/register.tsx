import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, RegisterRequestRole } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bus, Loader2, User, Lock, Shield, Users } from "lucide-react";

export default function Register() {
  const [, setLocation] = useLocation();
  const { setUser } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterRequestRole>("USER");

  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    try {
      const response = await registerMutation.mutateAsync({ data: { username, password, role } });
      setUser({ id: response.user.id, username: response.user.username, role: response.user.role, token: response.token });
      toast({ title: "Account created!", description: `Welcome to VoiceBus, ${response.user.username}!` });
      setLocation(response.user.role === "ADMIN" ? "/admin" : "/search");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration failed", description: error.message || "Could not register account" });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(30,10,70,0.90) 0%, rgba(70,5,120,0.82) 100%), url('https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=1200&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 right-0 w-80 h-80 bg-violet-400/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -left-10 w-64 h-64 bg-purple-400/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-extrabold tracking-tight">VoiceBus</span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-extrabold text-white leading-tight drop-shadow-md">
              Join thousands of<br />smart travelers.
            </h2>
            <p className="text-white/60 mt-4 text-base max-w-xs">
              Create your account and start booking bus tickets with just your voice in seconds.
            </p>
          </div>

          <div className="space-y-3 max-w-xs">
            {["Free to join — no credit card needed", "Instant booking confirmation", "Cancel anytime"].map((item) => (
              <div key={item} className="flex items-center gap-3 text-white/80 text-sm">
                <div className="w-5 h-5 rounded-full bg-violet-400/40 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-violet-300" />
                </div>
                {item}
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-gray-900">VoiceBus</span>
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create account</h1>
            <p className="text-gray-500 mt-2">Fill in the details below to get started.</p>
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
                  placeholder="Choose a username"
                  required
                  className="h-12 pl-10 bg-white border-gray-200 focus:border-primary text-base"
                  data-testid="input-register-username"
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
                  placeholder="Create a strong password"
                  required
                  className="h-12 pl-10 bg-white border-gray-200 focus:border-primary text-base"
                  data-testid="input-register-password"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-semibold text-gray-700 text-sm">Account Type</Label>
              <RadioGroup
                value={role}
                onValueChange={(val) => setRole(val as RegisterRequestRole)}
                className="grid grid-cols-2 gap-3"
                data-testid="radiogroup-role"
              >
                <label
                  htmlFor="role-user"
                  onClick={() => setRole("USER")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === "USER" ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <RadioGroupItem value="USER" id="role-user" data-testid="radio-role-user" className="sr-only" />
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${role === "USER" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Passenger</div>
                    <div className="text-xs text-gray-400">Book tickets</div>
                  </div>
                </label>

                <label
                  htmlFor="role-admin"
                  onClick={() => setRole("ADMIN")}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${role === "ADMIN" ? "border-primary bg-primary/5" : "border-gray-200 bg-white hover:border-gray-300"}`}
                >
                  <RadioGroupItem value="ADMIN" id="role-admin" data-testid="radio-role-admin" className="sr-only" />
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${role === "ADMIN" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Admin</div>
                    <div className="text-xs text-gray-400">Manage platform</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 mt-2"
              disabled={registerMutation.isPending}
              data-testid="button-submit-register"
            >
              {registerMutation.isPending
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
                : "Create Account"}
            </Button>
          </form>

          <p className="text-center mt-8 text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/" className="text-primary font-semibold hover:underline" data-testid="link-goto-login">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
