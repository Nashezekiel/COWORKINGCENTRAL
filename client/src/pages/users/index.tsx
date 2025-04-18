import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: 'user' | 'manager' | 'super_admin';
  planType?: string;
  profileImageColor: string;
  createdAt: string;
}

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
  role: z.enum(["user", "manager", "super_admin"]),
  planType: z.enum(["hourly", "daily", "weekly", "monthly"]).optional(),
});

const Users = () => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Get list of users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: !!currentUser && (currentUser.role === "manager" || currentUser.role === "super_admin"),
  });

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      pin: "",
      role: "user",
      planType: undefined,
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (values: z.infer<typeof registerSchema>) => {
      const response = await apiRequest("POST", "/api/auth/register", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "User created",
        description: "The user has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddUserDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error creating user",
        description: error.message || "There was an error creating the user",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    createUserMutation.mutate(values);
  };

  // Filter users based on search query and role filter
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Check if the current user can add users (only managers and super admins)
  const canAddUsers = currentUser && (currentUser.role === "manager" || currentUser.role === "super_admin");

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!(currentUser.role === "manager" || currentUser.role === "super_admin")) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Users</h1>
          <div className="mt-6 p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <p className="text-gray-600 dark:text-gray-300">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Users</h1>
          {canAddUsers && (
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <i className="fas fa-user-plus mr-2"></i> Add User
            </Button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <Input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-${user.profileImageColor}-200 dark:bg-${user.profileImageColor}-700 flex items-center justify-center`}>
                            <span className={`text-${user.profileImageColor}-700 dark:text-${user.profileImageColor}-200 font-medium text-xs`}>
                              {getInitials(user.name)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === "super_admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : user.role === "manager"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {user.role}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.planType ? (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.planType === "hourly"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                                : user.planType === "daily"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : user.planType === "weekly"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            }`}
                          >
                            {user.planType}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(user.createdAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-edit text-gray-500 dark:text-gray-400"></i>
                        </Button>
                        <Button variant="ghost" size="sm">
                          <i className="fas fa-ellipsis-v text-gray-500 dark:text-gray-400"></i>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No users found
            </div>
          )}
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. Fill in all the required fields.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN (4 digits)</FormLabel>
                      <FormControl>
                        <Input placeholder="1234" maxLength={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          {currentUser.role === "super_admin" && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
