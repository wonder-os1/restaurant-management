"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/lib/auth";
import { isFeatureEnabled } from "@/lib/features";
import { getInitials } from "@/lib/utils";

export function Header() {
  const { user, isAuthenticated, initialize } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleLogout = () => {
    logout();
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "STAFF";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <UtensilsCrossed className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || "FoodKing"}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/menu"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Menu
          </Link>
          {isFeatureEnabled("tableReservation") && (
            <Link
              href="/reserve"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Reserve a Table
            </Link>
          )}
          <Link
            href="/about"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            Contact
          </Link>

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                )}
                {user.role === "CUSTOMER" && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push("/customer")}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/customer/profile")}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <nav className="flex flex-col space-y-2 p-4">
            <Link
              href="/menu"
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Menu
            </Link>
            {isFeatureEnabled("tableReservation") && (
              <Link
                href="/reserve"
                className="text-sm font-medium py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Reserve a Table
              </Link>
            )}
            <Link
              href="/about"
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-sm font-medium py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                {user?.role === "CUSTOMER" && (
                  <Link
                    href="/customer"
                    className="text-sm font-medium py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium py-2 text-left text-red-600"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Button variant="outline" asChild>
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
