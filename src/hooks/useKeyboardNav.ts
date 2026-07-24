"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface KeyboardNavCallbacks {
  onToggleSolved: (index: number) => void;
  onToggleFavorite: (index: number) => void;
}

export function useKeyboardNav(itemCount: number) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const focusedRef = useRef(focusedIndex);
  focusedRef.current = focusedIndex;

  const callbacksRef = useRef<KeyboardNavCallbacks>({
    onToggleSolved: () => {},
    onToggleFavorite: () => {},
  });

  const register = useCallback((callbacks: KeyboardNavCallbacks) => {
    callbacksRef.current = callbacks;
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      const idx = focusedRef.current;

      if (e.key === "j" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setFocusedIndex((prev) => {
          if (prev === null) return 0;
          return Math.min(prev + 1, itemCount - 1);
        });
      } else if (e.key === "k" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setFocusedIndex((prev) => {
          if (prev === null) return 0;
          return Math.max(prev - 1, 0);
        });
      } else if (e.key === "s" && !e.metaKey && !e.ctrlKey && idx !== null) {
        e.preventDefault();
        callbacksRef.current.onToggleSolved(idx);
      } else if (e.key === "f" && !e.metaKey && !e.ctrlKey && idx !== null) {
        e.preventDefault();
        callbacksRef.current.onToggleFavorite(idx);
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [itemCount]);

  return { focusedIndex, setFocusedIndex, register };
}
