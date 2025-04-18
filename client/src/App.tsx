import { Switch, Route, useLocation } from "wouter";
import { useAuth } from "./hooks/useAuth";
import NotFound from "@/pages/not-found";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Users from "@/pages/users";
import CheckIn from "@/pages/check-in";
import Billing from "@/pages/billing";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    setLocation("/login");
    return null;
  }
  
  return <Component />;
}

function App() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/">
        <MainLayout>
          <ProtectedRoute component={Dashboard} />
        </MainLayout>
      </Route>
      <Route path="/users">
        <MainLayout>
          <ProtectedRoute component={Users} />
        </MainLayout>
      </Route>
      <Route path="/check-in">
        <MainLayout>
          <ProtectedRoute component={CheckIn} />
        </MainLayout>
      </Route>
      <Route path="/billing">
        <MainLayout>
          <ProtectedRoute component={Billing} />
        </MainLayout>
      </Route>
      <Route path="/reports">
        <MainLayout>
          <ProtectedRoute component={Reports} />
        </MainLayout>
      </Route>
      <Route path="/settings">
        <MainLayout>
          <ProtectedRoute component={Settings} />
        </MainLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
