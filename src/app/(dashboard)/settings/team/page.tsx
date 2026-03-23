"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Plus, Trash2, UserPlus } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  color: string | null;
}

export default function TeamPage() {
  const { toast } = useToast();
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "CLEANER",
    color: "#3b82f6",
  });

  const fetchMembers = React.useCallback(async () => {
    const res = await fetch("/api/team");
    if (res.ok) setMembers(await res.json());
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      toast("Team member added");
      setShowForm(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "CLEANER",
        color: "#3b82f6",
      });
      fetchMembers();
    } else {
      const data = await res.json();
      toast(data.error || "Failed to add team member", "error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this team member?")) return;
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Team member removed");
      fetchMembers();
    } else {
      toast("Failed to remove team member", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground">Manage your cleaning team</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Team Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="CLEANER">Cleaner</option>
                  <option value="ADMIN">Admin</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Calendar Color</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  className="h-10 w-20"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <Button type="submit">Add Member</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? [...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-24 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))
          : members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{
                          backgroundColor: member.color || "#6b7280",
                        }}
                      >
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                        {member.phone && (
                          <p className="text-sm text-muted-foreground">
                            {member.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          member.role === "ADMIN" ? "default" : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(member.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {!loading && members.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No team members yet. Add your first team member above.</p>
        </div>
      )}
    </div>
  );
}
