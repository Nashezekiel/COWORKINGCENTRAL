import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "wouter";
import { useDarkMode } from "@/hooks/useDarkMode";

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const pinLoginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
});

const Login = () => {
  const { login, pinLogin, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState<string>("password");

  // Password login form
  const passwordForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // PIN login form
  const pinForm = useForm<z.infer<typeof pinLoginSchema>>({
    resolver: zodResolver(pinLoginSchema),
    defaultValues: {
      username: "",
      pin: "",
    },
  });

  const onPasswordSubmit = async (values: z.infer<typeof loginSchema>) => {
    try {
      await login(values);
      setLocation("/");
    } catch (error) {
      // Error handling is done in the AuthProvider
    }
  };

  const onPinSubmit = async (values: z.infer<typeof pinLoginSchema>) => {
    try {
      await pinLogin(values.username, values.pin);
      setLocation("/");
    } catch (error) {
      // Error handling is done in the AuthProvider
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="absolute top-4 right-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleDarkMode}
          className="h-10 w-10 rounded-full"
        >
          <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"} text-gray-600 dark:text-gray-300`}></i>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            CoworkFlow
          </CardTitle>
          <CardDescription>
            Login to access the coworking space management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="pin">PIN Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="password">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="pin">
              <Form {...pinForm}>
                <form onSubmit={pinForm.handleSubmit(onPinSubmit)} className="space-y-4">
                  <FormField
                    control={pinForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={pinForm.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PIN Code</FormLabel>
                        <FormControl>
                          <Input
                            maxLength={4}
                            placeholder="Enter your 4-digit PIN"
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
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Logging in...
                      </>
                    ) : (
                      "Login with PIN"
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center w-full">
            Don't have an account?{" "}
            <Link href="/register">
              <a className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                Register
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
