import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useDarkMode } from "@/hooks/useDarkMode";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const pinFormSchema = z.object({
  currentPin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
  newPin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
  confirmPin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
}).refine((data) => data.newPin === data.confirmPin, {
  message: "PINs don't match",
  path: ["confirmPin"],
});

const Settings = () => {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState("profile");
  const [notificationsEnabled, setNotificationsEnabled] = useState({
    email: true,
    sms: false,
    checkIn: true,
    pricing: true,
    billing: true,
  });

  // Profile form
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // PIN form
  const pinForm = useForm<z.infer<typeof pinFormSchema>>({
    resolver: zodResolver(pinFormSchema),
    defaultValues: {
      currentPin: "",
      newPin: "",
      confirmPin: "",
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) => {
      return apiRequest("PUT", `/api/users/${user?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      refetchUser();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating profile",
        description: error.message || "An error occurred while updating your profile",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof passwordFormSchema>) => {
      return apiRequest("PUT", `/api/users/${user?.id}/password`, {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating password",
        description: error.message || "An error occurred while updating your password",
        variant: "destructive",
      });
    },
  });

  // Update PIN mutation
  const updatePinMutation = useMutation({
    mutationFn: async (data: z.infer<typeof pinFormSchema>) => {
      return apiRequest("PUT", `/api/users/${user?.id}/pin`, {
        currentPin: data.currentPin,
        newPin: data.newPin,
      });
    },
    onSuccess: () => {
      toast({
        title: "PIN updated",
        description: "Your PIN has been updated successfully",
      });
      pinForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error updating PIN",
        description: error.message || "An error occurred while updating your PIN",
        variant: "destructive",
      });
    },
  });

  // Update notification settings mutation
  const updateNotificationsMutation = useMutation({
    mutationFn: async (settings: typeof notificationsEnabled) => {
      return apiRequest("PUT", `/api/users/${user?.id}/notifications`, settings);
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating notifications",
        description: error.message || "An error occurred while updating your notification settings",
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (data: z.infer<typeof profileFormSchema>) => {
    updateProfileMutation.mutate(data);
  };

  // Handle password form submission
  const onPasswordSubmit = (data: z.infer<typeof passwordFormSchema>) => {
    updatePasswordMutation.mutate(data);
  };

  // Handle PIN form submission
  const onPinSubmit = (data: z.infer<typeof pinFormSchema>) => {
    updatePinMutation.mutate(data);
  };

  // Handle notification toggle change
  const handleNotificationToggle = (key: keyof typeof notificationsEnabled) => {
    const updatedSettings = {
      ...notificationsEnabled,
      [key]: !notificationsEnabled[key],
    };
    setNotificationsEnabled(updatedSettings);
    updateNotificationsMutation.mutate(updatedSettings);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>

        <div className="mt-6">
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
            </TabsList>
            
            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account profile information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your name" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your public display name.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Your username" {...field} />
                            </FormControl>
                            <FormDescription>
                              This is your unique username.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Your email" {...field} />
                            </FormControl>
                            <FormDescription>
                              This email will be used for notifications and communication.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            Updating...
                          </>
                        ) : (
                          "Update Profile"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>
                      Update your account password
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updatePasswordMutation.isPending}
                        >
                          {updatePasswordMutation.isPending ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Updating...
                            </>
                          ) : (
                            "Change Password"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Change PIN</CardTitle>
                    <CardDescription>
                      Update your backup PIN code for quick access
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...pinForm}>
                      <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-6">
                        <FormField
                          control={pinForm.control}
                          name="currentPin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current PIN</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="••••"
                                  maxLength={4}
                                  {...field}
                                  onChange={(e) => {
                                    // Only allow numbers
                                    const value = e.target.value.replace(/[^0-9]/g, "");
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={pinForm.control}
                          name="newPin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New PIN</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="••••"
                                  maxLength={4}
                                  {...field}
                                  onChange={(e) => {
                                    // Only allow numbers
                                    const value = e.target.value.replace(/[^0-9]/g, "");
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={pinForm.control}
                          name="confirmPin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New PIN</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="••••"
                                  maxLength={4}
                                  {...field}
                                  onChange={(e) => {
                                    // Only allow numbers
                                    const value = e.target.value.replace(/[^0-9]/g, "");
                                    field.onChange(value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          disabled={updatePinMutation.isPending}
                        >
                          {updatePinMutation.isPending ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                              Updating...
                            </>
                          ) : (
                            "Change PIN"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Two-Factor Authentication</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Two-factor authentication is currently disabled.
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Enable 2FA to add an extra layer of security to your account.
                      </p>
                    </div>
                    <Button>Enable 2FA</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Control how you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Notification Channels</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Choose how you'd like to be notified
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive emails for important updates</p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationsEnabled.email}
                          onCheckedChange={() => handleNotificationToggle('email')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="sms-notifications" className="font-medium">SMS Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive text messages for important updates</p>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={notificationsEnabled.sms}
                          onCheckedChange={() => handleNotificationToggle('sms')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium">Notification Types</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Control which types of notifications you receive
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="checkin-notifications" className="font-medium">Check-in/out Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when you check in or out</p>
                        </div>
                        <Switch
                          id="checkin-notifications"
                          checked={notificationsEnabled.checkIn}
                          onCheckedChange={() => handleNotificationToggle('checkIn')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="pricing-notifications" className="font-medium">Pricing Change Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications when pricing changes</p>
                        </div>
                        <Switch
                          id="pricing-notifications"
                          checked={notificationsEnabled.pricing}
                          onCheckedChange={() => handleNotificationToggle('pricing')}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="billing-notifications" className="font-medium">Billing Notifications</Label>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Receive notifications about billing and payments</p>
                        </div>
                        <Switch
                          id="billing-notifications"
                          checked={notificationsEnabled.billing}
                          onCheckedChange={() => handleNotificationToggle('billing')}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance Settings</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Theme</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Choose between light and dark mode
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="theme-toggle" className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
                      </div>
                      <Switch
                        id="theme-toggle"
                        checked={isDarkMode}
                        onCheckedChange={toggleDarkMode}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-lg font-medium">Language</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Choose your preferred language
                    </p>
                    <div className="grid gap-2">
                      <Label htmlFor="language-select">Language</Label>
                      <select 
                        id="language-select" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="en">English</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                        <option value="de">German</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save Changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
