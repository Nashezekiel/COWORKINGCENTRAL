import { useAuth } from "@/hooks/useAuth";
import { useDarkMode } from "@/hooks/useDarkMode";

interface MobileNavbarProps {
  onToggleMenu: () => void;
}

const MobileNavbar = ({ onToggleMenu }: MobileNavbarProps) => {
  const { user } = useAuth();
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 flex items-center shadow-sm h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <button 
        type="button" 
        className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-50 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
        onClick={onToggleMenu}
      >
        <span className="sr-only">Open sidebar</span>
        <i className="fas fa-bars h-6 w-6"></i>
      </button>
      <div className="ml-4 text-lg font-bold text-primary-600 dark:text-primary-400">CoworkFlow</div>
      
      <div className="ml-auto flex items-center mr-4">
        <button 
          className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700 rounded-lg text-sm p-2 mr-2"
          onClick={toggleDarkMode}
        >
          <i className={`fas ${isDarkMode ? "fa-sun" : "fa-moon"}`}></i>
        </button>
        {user && (
          <div className={`w-8 h-8 rounded-full bg-${user.profileImageColor || "primary"}-200 dark:bg-${user.profileImageColor || "primary"}-700 flex items-center justify-center`}>
            <span className={`text-${user.profileImageColor || "primary"}-700 dark:text-${user.profileImageColor || "primary"}-200 font-medium text-xs`}>
              {getInitials(user.name)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileNavbar;
