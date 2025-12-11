import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-3">
      <button
        onClick={() => setTheme("dark")}
        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
          theme === "dark" 
            ? "bg-secondary/10 border-secondary/50" 
            : "bg-background/50 border-secondary/10 hover:bg-background/80"
        }`}
      >
        <div className="flex items-center gap-3">
          <Moon className={`w-5 h-5 ${theme === "dark" ? "text-secondary" : "text-muted-foreground"}`} />
          <div className="text-left">
            <p className={`font-medium ${theme === "dark" ? "text-secondary" : "text-foreground"}`}>
              Dark Mode
            </p>
            <p className="text-sm text-muted-foreground">Classic theater aesthetic</p>
          </div>
        </div>
        {theme === "dark" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center"
          >
            <svg className="w-3 h-3 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </button>

      <button
        onClick={() => setTheme("light")}
        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
          theme === "light" 
            ? "bg-secondary/10 border-secondary/50" 
            : "bg-background/50 border-secondary/10 hover:bg-background/80"
        }`}
      >
        <div className="flex items-center gap-3">
          <Sun className={`w-5 h-5 ${theme === "light" ? "text-secondary" : "text-muted-foreground"}`} />
          <div className="text-left">
            <p className={`font-medium ${theme === "light" ? "text-secondary" : "text-foreground"}`}>
              Light Mode
            </p>
            <p className="text-sm text-muted-foreground">Bright and elegant look</p>
          </div>
        </div>
        {theme === "light" && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center"
          >
            <svg className="w-3 h-3 text-secondary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}
      </button>
    </div>
  );
};

export default ThemeToggle;
