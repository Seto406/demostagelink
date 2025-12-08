import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import { useNavigate } from "react-router-dom";
import stageLinkLogo from "@/assets/stagelink-logo.png";

type UserType = "audience" | "producer" | null;

const Login = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userType === "producer") {
      // Store mock session
      localStorage.setItem("userType", "producer");
      navigate("/dashboard");
    } else {
      localStorage.setItem("userType", "audience");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md mx-auto"
          >
            {!userType ? (
              <div className="text-center">
                <img 
                  src={stageLinkLogo} 
                  alt="StageLink" 
                  className="h-20 w-auto mx-auto mb-8"
                />
                <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
                  Welcome to StageLink
                </h1>
                <p className="text-muted-foreground mb-8">
                  Choose how you'd like to continue
                </p>

                <div className="space-y-4">
                  <button
                    onClick={() => setUserType("audience")}
                    className="w-full p-6 border border-secondary/30 bg-card hover:border-secondary hover:shadow-[0_0_30px_hsl(43_72%_52%/0.2)] transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎟️</span>
                      <div>
                        <h3 className="font-serif text-lg text-foreground group-hover:text-secondary transition-colors">
                          I'm an Audience Member
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Discover shows and follow theater groups
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType("producer")}
                    className="w-full p-6 border border-secondary/30 bg-card hover:border-primary hover:shadow-[0_0_30px_hsl(0_100%_25%/0.3)] transition-all duration-300 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">🎭</span>
                      <div>
                        <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors">
                          I'm a Theater Group
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Submit shows and manage your group profile
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-secondary/20 p-8">
                <button
                  onClick={() => setUserType(null)}
                  className="text-secondary text-sm mb-6 hover:underline"
                >
                  ← Back
                </button>

                <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                  {userType === "producer" ? "Theater Group Login" : "Audience Login"}
                </h1>
                <p className="text-muted-foreground text-sm mb-8">
                  Enter your credentials to continue
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background border-secondary/30 focus:border-secondary"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background border-secondary/30 focus:border-secondary"
                      required
                    />
                  </div>

                  <Button type="submit" variant="hero" className="w-full">
                    {userType === "producer" ? "Access Dashboard" : "Continue"}
                  </Button>
                </form>

                <p className="text-center text-muted-foreground text-sm mt-6">
                  Don't have an account?{" "}
                  <span className="text-secondary cursor-pointer hover:underline">
                    Sign up
                  </span>
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Login;
