import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister, RegisterRequestRole } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Bus, Loader2 } from "lucide-react";

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
      const response = await registerMutation.mutateAsync({
        data: { username, password, role }
      });
      
      setUser({
        id: response.user.id,
        username: response.user.username,
        role: response.user.role,
        token: response.token
      });
      
      toast({
        title: "Registration successful",
        description: `Welcome to VoiceBus, ${response.user.username}!`,
      });
      
      setLocation(response.user.role === "ADMIN" ? "/admin" : "/search");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.message || "Could not register account",
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
          <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">Create Account</CardTitle>
          <CardDescription className="text-base text-gray-500">
            Join VoiceBus to start booking tickets
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
                placeholder="Choose a username" 
                required
                className="h-12"
                data-testid="input-register-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password" 
                required
                className="h-12"
                data-testid="input-register-password"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Account Type</Label>
              <RadioGroup 
                value={role} 
                onValueChange={(val) => setRole(val as RegisterRequestRole)}
                className="flex flex-row gap-4"
                data-testid="radiogroup-role"
              >
                <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-md border flex-1 cursor-pointer" onClick={() => setRole("USER")}>
                  <RadioGroupItem value="USER" id="role-user" data-testid="radio-role-user" />
                  <Label htmlFor="role-user" className="cursor-pointer font-medium">Passenger</Label>
                </div>
                <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-md border flex-1 cursor-pointer" onClick={() => setRole("ADMIN")}>
                  <RadioGroupItem value="ADMIN" id="role-admin" data-testid="radio-role-admin" />
                  <Label htmlFor="role-admin" className="cursor-pointer font-medium">Admin</Label>
                </div>
              </RadioGroup>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold" 
              disabled={registerMutation.isPending}
              data-testid="button-submit-register"
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
              ) : "Sign Up"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/" className="ml-1 text-primary font-semibold hover:underline" data-testid="link-goto-login">
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
