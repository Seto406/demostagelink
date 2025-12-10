import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TypingAnimationProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  cursor?: boolean;
  onComplete?: () => void;
}

export const TypingAnimation = ({
  text,
  className,
  speed = 50,
  delay = 0,
  cursor = true,
  onComplete,
}: TypingAnimationProps) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  
  // Use ref for callback to avoid effect re-runs
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  
  // Track if animation has run
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Prevent re-running
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    
    if (prefersReducedMotion) {
      setDisplayedText(text);
      setIsComplete(true);
      onCompleteRef.current?.();
      return;
    }

    let currentIndex = 0;
    let intervalId: NodeJS.Timeout;
    
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(intervalId);
          setIsComplete(true);
          onCompleteRef.current?.();
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [text, speed, delay, prefersReducedMotion]);

  return (
    <span className={cn("inline", className)}>
      {displayedText}
      {cursor && !isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block w-[3px] h-[1em] bg-secondary ml-1 align-middle"
        />
      )}
    </span>
  );
};

// Multi-line typing animation
interface MultiLineTypingProps {
  lines: { text: string; className?: string }[];
  speed?: number;
  lineDelay?: number;
  onComplete?: () => void;
}

export const MultiLineTyping = ({
  lines,
  speed = 50,
  lineDelay = 200,
  onComplete,
}: MultiLineTypingProps) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [completedLines, setCompletedLines] = useState<string[]>([]);

  const handleLineComplete = () => {
    if (currentLine < lines.length - 1) {
      setCompletedLines((prev) => [...prev, lines[currentLine].text]);
      setTimeout(() => setCurrentLine((prev) => prev + 1), lineDelay);
    } else {
      onComplete?.();
    }
  };

  return (
    <div>
      {completedLines.map((line, index) => (
        <span key={index} className={lines[index].className}>
          {line}
        </span>
      ))}
      {currentLine < lines.length && (
        <TypingAnimation
          text={lines[currentLine].text}
          className={lines[currentLine].className}
          speed={speed}
          cursor={currentLine === lines.length - 1}
          onComplete={handleLineComplete}
        />
      )}
    </div>
  );
};

export default TypingAnimation;
