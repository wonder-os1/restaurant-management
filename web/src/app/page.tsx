"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  Clock,
  MapPin,
  Phone,
  Star,
  Truck,
  CalendarDays,
  ChefHat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/header";
import { isFeatureEnabled } from "@/lib/features";
import { formatPrice } from "@/lib/utils";
import api from "@/lib/api";
import { MenuItem } from "@/types";

export default function HomePage() {
  const { data: featuredItems } = useQuery({
    queryKey: ["featured-menu"],
    queryFn: async () => {
      const { data } = await api.get<MenuItem[]>("/menu/featured");
      return data;
    },
  });

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-orange-100 text-orange-800 hover:bg-orange-100">
              Fresh & Delicious
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Experience the Taste of{" "}
              <span className="text-primary">Authentic Cuisine</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
              {process.env.NEXT_PUBLIC_TAGLINE ||
                "Delicious Food, Delivered Fresh"}
              . Savor every bite with our carefully crafted dishes made from the
              finest ingredients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/menu">View Our Menu</Link>
              </Button>
              {isFeatureEnabled("tableReservation") && (
                <Button size="lg" variant="outline" asChild>
                  <Link href="/reserve">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Reserve a Table
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <ChefHat className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Expert Chefs</h3>
                <p className="text-sm text-muted-foreground">
                  Our experienced chefs craft every dish with passion and
                  precision.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Quality Ingredients</h3>
                <p className="text-sm text-muted-foreground">
                  Only the freshest, locally sourced ingredients make it to your
                  plate.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-orange-50">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Fast Delivery</h3>
                <p className="text-sm text-muted-foreground">
                  Get your favorite meals delivered hot and fresh right to your
                  doorstep.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu Items */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Popular Dishes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our most loved dishes, handpicked for their exceptional
              taste and presentation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(featuredItems || []).slice(0, 8).map((item) => (
              <Link key={item.id} href={`/menu/${item.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UtensilsCrossed className="h-12 w-12 text-orange-300" />
                    )}
                    <div className="absolute top-2 right-2">
                      <Badge
                        className={
                          item.isVeg
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {item.isVeg ? "Veg" : "Non-Veg"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {item.description}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(item.price)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link href="/menu">View Full Menu</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                About{" "}
                {process.env.NEXT_PUBLIC_APP_NAME || "FoodKing Restaurant"}
              </h2>
              <p className="text-muted-foreground mb-4">
                Welcome to our restaurant, where every meal is a celebration of
                flavor. We believe in the power of good food to bring people
                together and create lasting memories.
              </p>
              <p className="text-muted-foreground mb-6">
                Our kitchen team combines traditional recipes with modern
                techniques to deliver dishes that delight and inspire. From
                appetizers to desserts, every item on our menu is prepared with
                care and attention to detail.
              </p>
              <Button asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl p-8 flex items-center justify-center min-h-[300px]">
              <UtensilsCrossed className="h-32 w-32 text-orange-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Info Footer */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <UtensilsCrossed className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">
                  {process.env.NEXT_PUBLIC_APP_NAME || "FoodKing"}
                </span>
              </div>
              <p className="text-gray-400">
                {process.env.NEXT_PUBLIC_TAGLINE ||
                  "Delicious Food, Delivered Fresh"}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span>+91 98765 43210</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>123 Food Street, Mumbai 400001</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>11:00 AM - 11:00 PM</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/menu"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Menu
                </Link>
                <Link
                  href="/about"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  About Us
                </Link>
                <Link
                  href="/contact"
                  className="block text-gray-400 hover:text-white transition-colors"
                >
                  Contact
                </Link>
                {isFeatureEnabled("tableReservation") && (
                  <Link
                    href="/reserve"
                    className="block text-gray-400 hover:text-white transition-colors"
                  >
                    Reservations
                  </Link>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()}{" "}
            {process.env.NEXT_PUBLIC_APP_NAME || "FoodKing Restaurant"}. All
            rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}
