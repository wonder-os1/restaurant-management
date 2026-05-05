"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  Armchair,
  CalendarDays,
  ChefHat,
  Package,
  Receipt,
  Users,
  UserCog,
  BarChart3,
  Settings,
  Home,
  ClipboardList,
  User,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";

interface SidebarProps {
  variant: "admin" | "customer";
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  featureFlag?: string;
}

const adminNavItems: NavItem[] = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { title: "Menu", href: "/dashboard/menu", icon: UtensilsCrossed },
  { title: "Tables", href: "/dashboard/tables", icon: Armchair },
  {
    title: "Reservations",
    href: "/dashboard/reservations",
    icon: CalendarDays,
    featureFlag: "tableReservation",
  },
  {
    title: "Kitchen Display",
    href: "/dashboard/kitchen",
    icon: ChefHat,
    featureFlag: "kitchenDisplay",
  },
  {
    title: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
    featureFlag: "inventoryManagement",
  },
  { title: "Billing", href: "/dashboard/billing", icon: Receipt },
  { title: "Customers", href: "/dashboard/customers", icon: Users },
  { title: "Staff", href: "/dashboard/staff", icon: UserCog },
  { title: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

const customerNavItems: NavItem[] = [
  { title: "Overview", href: "/customer", icon: Home },
  { title: "My Orders", href: "/customer/orders", icon: ClipboardList },
  {
    title: "Reservations",
    href: "/customer/reservations",
    icon: CalendarDays,
    featureFlag: "tableReservation",
  },
  { title: "Profile", href: "/customer/profile", icon: User },
];

export function Sidebar({ variant }: SidebarProps) {
  const pathname = usePathname();
  const navItems = variant === "admin" ? adminNavItems : customerNavItems;

  const filteredItems = navItems.filter((item) => {
    if (item.featureFlag) {
      return isFeatureEnabled(item.featureFlag);
    }
    return true;
  });

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-card">
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <UtensilsCrossed className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || "FoodKing"}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {filteredItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                item.href !== "/customer" &&
                pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
