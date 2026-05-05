import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <UtensilsCrossed className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">
          {process.env.NEXT_PUBLIC_APP_NAME || "FoodKing"}
        </span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
