import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PREPARING: "bg-orange-100 text-orange-800",
    READY: "bg-green-100 text-green-800",
    SERVED: "bg-emerald-100 text-emerald-800",
    DELIVERED: "bg-emerald-100 text-emerald-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getTableStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AVAILABLE: "bg-green-100 text-green-800 border-green-300",
    OCCUPIED: "bg-red-100 text-red-800 border-red-300",
    RESERVED: "bg-blue-100 text-blue-800 border-blue-300",
    MAINTENANCE: "bg-gray-100 text-gray-800 border-gray-300",
  };
  return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-purple-100 text-purple-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
