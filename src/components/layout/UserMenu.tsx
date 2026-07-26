"use client";

import Link from "next/link";
import type { User } from "firebase/auth";
import { FolderKanban, LogIn, LogOut, Settings, User as UserIcon, Archive } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  user?: User | null;
  loading?: boolean;
  isConfigured?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

const getFallback = (user?: User | null) =>
  user?.displayName?.charAt(0) || user?.email?.charAt(0) || "U";

const getFirstName = (user?: User | null) => {
  if (!user) return "Account";
  if (user.displayName) return user.displayName.split(" ")[0];
  if (user.email) return user.email.split("@")[0];
  return "Account";
};

const UserMenu = ({
  user,
  loading = false,
  isConfigured = false,
  onLogin,
  onLogout,
}: UserMenuProps) => {
  if (!user) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading || !isConfigured}
        onClick={onLogin}
        className="h-8 border-border bg-card/50 text-card-foreground hover:bg-accent hover:text-foreground text-xs gap-1.5 px-2.5"
        title={!isConfigured ? "Firebase Auth is not configured." : "Sign in with Google"}
        aria-label={!isConfigured ? "Firebase Auth is not configured. Sign in unavailable." : "Sign in with Google"}
      >
        <LogIn className="size-3.5" />
        {loading ? "Checking..." : "Sign in"}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-8 gap-2 px-1.5 text-left text-card-foreground hover:bg-accent/50 hover:text-foreground rounded-md"
          aria-label="Open user menu"
        >
          <Avatar className="size-8 border border-border">
            {user.photoURL && (
              <AvatarImage src={user.photoURL} alt={user.displayName ?? "User"} referrerPolicy="no-referrer" />
            )}
            <AvatarFallback className="bg-secondary text-xs text-foreground">
              {getFallback(user).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-20 truncate text-sm sm:inline">
            {getFirstName(user)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-border bg-card text-foreground shadow-md">
        <DropdownMenuLabel className="px-3 py-2.5">
          <div className="flex items-center gap-3">
            <Avatar className="size-10 border border-border">
              {user.photoURL && (
                <AvatarImage src={user.photoURL} alt={user.displayName ?? "User"} referrerPolicy="no-referrer" />
              )}
              <AvatarFallback className="bg-secondary text-sm text-foreground">
                {getFallback(user).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">
                {user.displayName || "Signed in"}
              </div>
              {user.email && (
                <div className="truncate text-xs font-normal text-muted-foreground">
                  {user.email}
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent">
          <Link href="/settings?tab=profile" className="flex items-center gap-3">
            <UserIcon className="size-4" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent">
          <Link href="/collections" className="flex items-center gap-3">
            <FolderKanban className="size-4" />
            Collections
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent">
          <Link href="/archive" className="flex items-center gap-3">
            <Archive className="size-4" />
            Archive
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer hover:bg-accent">
          <Link href="/settings?tab=preferences" className="flex items-center gap-3">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          disabled={loading}
          onClick={onLogout}
          className="cursor-pointer hover:bg-accent text-muted-foreground"
        >
          <LogOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
