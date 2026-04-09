import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useLogin, LoginRequest } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Bus, Loader2 } from "lucide-react";

export default function Login() {
  const [location, setLocation] = useLocation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useLogin();

  useEffect(() => {
    if (user) {
      setLocation(user.role === "ADMIN" ? "/admin" : "/search");
    }
  }, [user, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    try {
      const response = await loginMutation.mutateAsync({
        data: { username, password }
      });
      
      setUser({
        id: response.user.id,
        username: response.user.username,
        role: response.user.role,
        token: response.token
      });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.username}!`,
      });
      
      setLocation(response.user.role === "ADMIN" ? "/admin" : "/search");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "Invalid credentials",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Bus className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">VoiceBus</CardTitle>
          <CardDescription className="text-base text-gray-500">
            Sign in to book your next journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username" 
                required
                className="h-12"
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                required
                className="h-12"
                data-testid="input-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={loginMutation.isPending}
              data-testid="button-submit-login"
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in...</>
              ) : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6 text-sm text-gray-500">
          Don't have an account?{" "}
          <Link href="/register" className="ml-1 text-primary font-semibold hover:underline" data-testid="link-goto-register">
            Register here
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
