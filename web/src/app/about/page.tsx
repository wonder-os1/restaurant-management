"use client";

import { UtensilsCrossed, ChefHat, Award, Heart, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/layout/header";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Story</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A passion for food, a commitment to quality, and a dedication to
            making every dining experience memorable.
          </p>
        </div>
      </div>

      {/* Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-orange-100 to-amber-50 rounded-2xl p-8 flex items-center justify-center min-h-[400px]">
              <UtensilsCrossed className="h-32 w-32 text-orange-300" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-6">
                Where Flavor Meets Tradition
              </h2>
              <p className="text-muted-foreground mb-4">
                Founded with a simple vision of bringing people together over
                great food, our restaurant has grown into a beloved destination
                for food lovers. Every dish on our menu reflects our passion for
                culinary excellence and our respect for traditional cooking
                methods.
              </p>
              <p className="text-muted-foreground mb-4">
                Our chefs bring years of expertise and creativity to the
                kitchen, combining time-honored recipes with innovative
                techniques. We source our ingredients from trusted local
                suppliers who share our commitment to quality and
                sustainability.
              </p>
              <p className="text-muted-foreground">
                Whether you are joining us for a casual lunch, a family dinner,
                or a special celebration, we strive to make every visit an
                unforgettable experience. Our warm hospitality and attention to
                detail set us apart from the rest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Sets Us Apart
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Expert Chefs</h3>
                <p className="text-sm text-muted-foreground">
                  Our culinary team brings decades of combined experience and a
                  passion for innovation to every dish.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Made with Love</h3>
                <p className="text-sm text-muted-foreground">
                  Every dish is crafted with care, using only the freshest and
                  highest quality ingredients available.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Award Winning</h3>
                <p className="text-sm text-muted-foreground">
                  Recognized for excellence in both cuisine and hospitality by
                  industry experts and food critics.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-8 pb-6">
                <div className="bg-orange-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Quick Service</h3>
                <p className="text-sm text-muted-foreground">
                  We value your time and ensure prompt service without ever
                  compromising on quality.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary mb-2">10+</p>
              <p className="text-muted-foreground">Years of Experience</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">50+</p>
              <p className="text-muted-foreground">Menu Items</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">100K+</p>
              <p className="text-muted-foreground">Happy Customers</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary mb-2">15+</p>
              <p className="text-muted-foreground">Expert Chefs</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
