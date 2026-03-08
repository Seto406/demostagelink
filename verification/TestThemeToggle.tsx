import { render } from "react-dom";
import { ThemeToggle } from "../src/components/ui/theme-toggle";
import { ThemeProvider } from "next-themes";
import React from "react";
import { createRoot } from "react-dom/client";
import { TooltipProvider } from "@/components/ui/tooltip";

const App = () => (
  <ThemeProvider>
    <TooltipProvider>
      <div className="p-8 w-[400px] bg-background text-foreground">
        <h1 className="text-xl mb-4">Settings</h1>
        <ThemeToggle />
      </div>
    </TooltipProvider>
  </ThemeProvider>
);

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
