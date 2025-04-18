import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { useDarkMode } from "@/hooks/useDarkMode";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  pin: z.string().length(4, "PIN must be exactly 4 digits").regex(/^\d+$/, "PIN must contain only digits"),
});

const Register = () => {
  const { register, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      pin: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof registerSchema>) => {
    try {
      await register(values);
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
            Create a new account to access the coworking space
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <FormLabel>PIN Code (4 digits)</FormLabel>
                    <FormControl>
                      <Input
                        maxLength={4}
                        placeholder="1234"
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
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center w-full">
            Already have an account?{" "}
            <Link href="/login">
              <a className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium">
                Login
              </a>
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
