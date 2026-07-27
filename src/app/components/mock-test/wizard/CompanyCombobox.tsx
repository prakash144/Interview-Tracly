"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X } from "lucide-react";

interface CompanyComboboxProps {
  value: string;
  companies: string[];
  onChange: (company: string) => void;
}

export default function CompanyCombobox({ value, companies, onChange }: CompanyComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const lower = query.toLowerCase().trim();
    if (!lower) return companies.slice(0, 12);
    return companies.filter((c) => c.toLowerCase().includes(lower)).slice(0, 12);
  }, [query, companies]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (company: string) => {
    onChange(company);
    setQuery(company);
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % filtered.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        } else if (query.trim()) {
          onChange(query.trim());
          setIsOpen(false);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(-1);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Any Company"
          className="w-full rounded-lg border border-border bg-secondary px-3 py-2 pr-16 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-2">
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(""); onChange(""); inputRef.current?.focus(); }}
              className="size-5 flex items-center justify-center rounded hover:bg-accent text-muted-foreground"
            >
              <X className="size-3" />
            </button>
          )}
          <ChevronDown className={`size-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 w-full mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-card p-1 text-sm shadow-lg"
        >
          {filtered.length > 0 ? (
            filtered.map((company, idx) => (
              <li
                key={company}
                role="option"
                aria-selected={highlightIndex === idx}
                onClick={() => handleSelect(company)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
                  idx === highlightIndex ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50"
                } ${company === value ? "bg-primary/5 text-primary font-medium" : ""}`}
              >
                <Search className="size-3.5 text-muted-foreground/50 shrink-0" />
                <span>{company}</span>
              </li>
            ))
          ) : (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground/50">
              {query.trim() ? `Use "${query.trim()}" as custom company` : "No companies found"}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
