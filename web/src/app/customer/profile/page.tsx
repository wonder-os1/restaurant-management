"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/auth-store";

export default function CustomerProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      await api.patch("/auth/profile", data);
    },
    onSuccess: () => {
      toast({ title: "Profile updated" });
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
          </div>
          <Button
            onClick={() => updateProfile.mutate({ name, phone })}
            disabled={updateProfile.isPending}
          >
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Role</span>
            <Badge variant="secondary">{user?.role}</Badge>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-sm">Member since</span>
            <span className="text-sm text-muted-foreground">
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "-"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
