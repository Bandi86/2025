"use client"

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { UserNav } from "@/components/user-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function MainNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = React.useState(false);
  const { user, isLoading } = useAuth();

  return (
    <header className="supports-backdrop-blur:bg-background/60 sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="text-2xl font-serif font-bold flex items-center">
            Modern<span className="text-primary">Blog</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <Link
              href="/"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/" ? "text-foreground" : "text-muted-foreground"
              )}
            >
              Home
            </Link>
            <Link
              href="/blog"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname?.startsWith("/blog")
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              Blog
            </Link>
            <Link
              href="/about"
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                pathname === "/about"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              About
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>
          {!isLoading && (
            <>
              {user ? (
                <div className="flex items-center gap-4">
                  <Button asChild variant="ghost" size="sm" className="hidden md:flex">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <UserNav user={user} />
                </div>
              ) : (
                <div className="hidden md:flex gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </>
          )}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/"
                  className="text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/blog"
                  className="text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  Blog
                </Link>
                <Link
                  href="/about"
                  className="text-base font-medium transition-colors hover:text-primary"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                {user ? (
                  <Link
                    href="/dashboard"
                    className="text-base font-medium transition-colors hover:text-primary"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-base font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="text-base font-medium transition-colors hover:text-primary"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
                <div className="mt-2">
                  <ThemeToggle />
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}