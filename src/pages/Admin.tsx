import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, FileStack, HardDrive, Clock, Plus } from "lucide-react";
import { useState } from "react";

const mockUsers = [
  { id: "1", name: "Alice Smith", email: "alice@example.com", credits: 42, filesProcessed: 128, role: "user" },
  { id: "2", name: "Bob Jones", email: "bob@example.com", credits: 7, filesProcessed: 23, role: "user" },
  { id: "3", name: "Admin User", email: "admin@metaclean.io", credits: 999, filesProcessed: 0, role: "admin" },
];

const stats = [
  { icon: Users, label: "Total Users", value: "1,234" },
  { icon: FileStack, label: "Files Processed", value: "56,789" },
  { icon: HardDrive, label: "Storage Used", value: "12.4 GB" },
  { icon: Clock, label: "Pending Cleanup", value: "47" },
];

const Admin = () => {
  const [search, setSearch] = useState("");
  const filtered = mockUsers.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-3xl font-heading font-bold mb-8">Admin Panel</h1>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <div key={s.label} className="glass rounded-lg p-5">
                <div className="flex items-center gap-3 mb-2">
                  <s.icon className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                </div>
                <div className="text-2xl font-heading font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Users */}
          <div className="glass rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-heading font-semibold">Users</h2>
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Files Processed</TableHead>
                  <TableHead className="w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.credits}</TableCell>
                    <TableCell>{user.filesProcessed}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        <Plus className="h-3 w-3 mr-1" /> Credits
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
