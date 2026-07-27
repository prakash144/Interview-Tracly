"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useState, useCallback, useEffect } from "react";
import type { User } from "firebase/auth";
import {
  BarChart3, CalendarDays, Crosshair, LayoutDashboard,
  ListChecks, Menu, Moon, Search, Sun, Layers, Kanban, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

import { Logo } from "@/components/ui/logo";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";

import UserMenu from "./UserMenu";
import CommandCenter from "./CommandCenter";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

interface TopNavProps {
  user?: User | null;
  authLoading?: boolean;
  isAuthConfigured?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Problems", href: "/problems", icon: ListChecks },
  { label: "Sprints", href: "/sprints", icon: Kanban },
  { label: "Tracks", href: "/tracks", icon: Layers },
  { label: "Progress", href: "/progress", icon: BarChart3 },
  { label: "Activity", href: "/activity", icon: CalendarDays },
  { label: "Readiness", href: "/readiness", icon: Crosshair },
  { label: "Mock Interview", href: "/mock-test", icon: Timer },
] as const;

const NavLink = memo(function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-all",
        isActive
          ? "text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {isActive && (
        <span className="absolute inset-0 rounded-md border border-border/70 bg-card/95 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:bg-secondary/80" />
      )}
      <Icon className="relative z-10 size-4" />
      <span className="relative z-10 whitespace-nowrap">{label}</span>
    </Link>
  );
});

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-8 text-muted-foreground hover:text-foreground"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}

function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden h-8 w-40 items-center gap-2 rounded-md border border-border/70 bg-card/75 px-2.5 text-xs text-muted-foreground/70 shadow-sm transition-all hover:border-foreground/20 hover:bg-card hover:text-foreground sm:inline-flex lg:w-48"
      aria-label="Search all resources"
    >
      <Search className="size-3.5" />
      <span className="flex-1 text-left">Search...</span>
      <kbd className="hidden h-4 items-center rounded border border-border/80 bg-background px-1 font-mono text-[10px] text-muted-foreground/50 lg:inline-flex">⌘K</kbd>
    </button>
  );
}

function MobileNavItem({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-accent/70 text-foreground"
            : "text-muted-foreground hover:bg-accent/30 hover:text-foreground"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="size-4" />
        {label}
      </Link>
    </SheetClose>
  );
}

const TopNav = ({
  user,
  authLoading = false,
  isAuthConfigured = false,
  onLogin,
  onLogout,
}: TopNavProps) => {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchOpen = useCallback(() => setSearchOpen(true), []);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/88 shadow-[0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/74">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <Logo showTagline={false} />

        {/* Center: Desktop Nav */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-0.5"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>

        {/* Right: Utilities */}
        <div className="flex items-center gap-1">
          <SearchTrigger onClick={handleSearchOpen} />
          <CommandCenter uid={user?.uid} open={searchOpen} onOpenChange={setSearchOpen} />

          <ThemeToggle />

          <NotificationCenter />

          <UserMenu
            user={user}
            loading={authLoading}
            isConfigured={isAuthConfigured}
            onLogin={onLogin}
            onLogout={onLogout}
          />

          {/* Mobile: Hamburger + Sheet drawer */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden size-8 text-muted-foreground hover:text-foreground"
                aria-label="Open navigation menu"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-4">
              <div className="flex flex-col gap-6 pt-8">
                <Logo compact />
                <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <MobileNavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    />
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
