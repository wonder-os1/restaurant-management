"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Clock, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const reservationSchema = z.object({
  guestName: z.string().min(2, "Name must be at least 2 characters"),
  guestPhone: z.string().min(10, "Please enter a valid phone number"),
  guestEmail: z.string().email("Please enter a valid email").optional().or(z.literal("")),
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time"),
  partySize: z.number().min(1, "Party size must be at least 1").max(20),
  notes: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationSchema>;

export default function ReservePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      partySize: 2,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await api.post("/reservations", data);
      return response.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Reservation Confirmed",
        description: "Your table has been reserved. We look forward to seeing you!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to make reservation. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ReservationFormData) => {
    mutation.mutate(data);
  };

  const timeSlots = [
    "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30",
  ];

  const today = new Date().toISOString().split("T")[0];

  if (submitted) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center max-w-lg">
          <div className="bg-green-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Reservation Confirmed!</h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your reservation. We have sent a confirmation to your
            contact details. We look forward to welcoming you!
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/")}>Back to Home</Button>
            <Button variant="outline" onClick={() => setSubmitted(false)}>
              Make Another Reservation
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Reserve a Table</h1>
          <p className="text-muted-foreground">
            Book your dining experience with us
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
            <CardDescription>
              Fill in the details below to reserve your table. We will confirm
              your booking shortly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guestName">Full Name *</Label>
                  <Input
                    id="guestName"
                    placeholder="John Doe"
                    {...register("guestName")}
                  />
                  {errors.guestName && (
                    <p className="text-sm text-red-500">
                      {errors.guestName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guestPhone">Phone Number *</Label>
                  <Input
                    id="guestPhone"
                    placeholder="+91 98765 43210"
                    {...register("guestPhone")}
                  />
                  {errors.guestPhone && (
                    <p className="text-sm text-red-500">
                      {errors.guestPhone.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestEmail">Email (Optional)</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  placeholder="john@example.com"
                  {...register("guestEmail")}
                />
                {errors.guestEmail && (
                  <p className="text-sm text-red-500">
                    {errors.guestEmail.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      min={today}
                      className="pl-10"
                      {...register("date")}
                    />
                  </div>
                  {errors.date && (
                    <p className="text-sm text-red-500">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Time *</Label>
                  <Select onValueChange={(val) => setValue("time", val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.time && (
                    <p className="text-sm text-red-500">
                      {errors.time.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Party Size *</Label>
                  <Select
                    defaultValue="2"
                    onValueChange={(val) =>
                      setValue("partySize", parseInt(val))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Guests" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(20)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} {i + 1 === 1 ? "Guest" : "Guests"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.partySize && (
                    <p className="text-sm text-red-500">
                      {errors.partySize.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Requests (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any dietary restrictions, celebrations, or special requests..."
                  {...register("notes")}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Booking..." : "Confirm Reservation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
