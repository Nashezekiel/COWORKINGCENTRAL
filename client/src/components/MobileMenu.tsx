import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive"
      });
    }
  };

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
      
      {/* Drawer */}
      <div className="relative flex flex-col w-full max-w-xs pb-4 bg-white dark:bg-gray-800 h-full">
        <div className="absolute top-0 right-0 pt-2 pr-2">
          <button
            type="button"
            className="inline-flex items-center justify-center w-10 h-10 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={onClose}
          >
            <span className="sr-only">Close menu</span>
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <div className="flex-1 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <span className="text-xl font-bold text-primary-600 dark:text-primary-400">CoworkFlow</span>
          </div>
          
          <div className="mt-5 flex-1 h-0">
            {/* User Profile Summary */}
            {user && (
              <div className="px-4 py-3 mb-6 bg-gray-50 dark:bg-gray-700 rounded-lg mx-3">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-${user.profileImageColor || "primary"}-200 dark:bg-${user.profileImageColor || "primary"}-700 flex items-center justify-center`}>
                    <span className={`text-${user.profileImageColor || "primary"}-700 dark:text-${user.profileImageColor || "primary"}-200 font-medium text-sm`}>
                      {getInitials(user.name)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.role}</p>
                  </div>
                </div>
              </div>
            )}
            
            <nav className="mt-2 px-2 space-y-1">
              <Link href="/">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location === "/" ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`} onClick={onClose}>
                  <i className={`fas fa-home mr-3 ${
                    location === "/" ? "text-primary-500" : "text-gray-400 dark:text-gray-500"
                  }`}></i>
                  Dashboard
                </a>
              </Link>
              
              <Link href="/users">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location === "/users" ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`} onClick={onClose}>
                  <i className={`fas fa-users mr-3 ${
                    location === "/users" ? "text-primary-500" : "text-gray-400 dark:text-gray-500"
                  }`}></i>
                  Users
                </a>
              </Link>
              
              <Link href="/check-in">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location === "/check-in" ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`} onClick={onClose}>
                  <i className={`fas fa-qrcode mr-3 ${
                    location === "/check-in" ? "text-primary-500" : "text-gray-400 dark:text-gray-500"
                  }`}></i>
                  Check-In/Out
                </a>
              </Link>
              
              <Link href="/billing">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location === "/billing" ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`} onClick={onClose}>
                  <i className={`fas fa-credit-card mr-3 ${
                    location === "/billing" ? "text-primary-500" : "text-gray-400 dark:text-gray-500"
                  }`}></i>
                  Billing
                </a>
              </Link>
              
              <Link href="/reports">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location === "/reports" ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`} onClick={onClose}>
                  <i className={`fas fa-chart-line mr-3 ${
                    location === "/reports" ? "text-primary-500" : "text-gray-400 dark:text-gray-500"
                  }`}></i>
                  Reports
                </a>
              </Link>
              
              <Link href="/settings">
                <a className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                  location === "/settings" ? "bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-200" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`} onClick={onClose}>
                  <i className={`fas fa-cog mr-3 ${
                    location === "/settings" ? "text-primary-500" : "text-gray-400 dark:text-gray-500"
                  }`}></i>
                  Settings
                </a>
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 dark:border-gray-700 p-4">
          <button 
            className="flex-shrink-0 group block text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            onClick={handleLogout}
          >
            <div className="flex items-center">
              <i className="fas fa-sign-out-alt mr-2"></i> Logout
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
