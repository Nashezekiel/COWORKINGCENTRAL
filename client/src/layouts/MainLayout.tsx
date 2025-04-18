import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavbar from "@/components/MobileNavbar";
import MobileMenu from "@/components/MobileMenu";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar />
      
      {/* Mobile Menu Overlay */}
      <MobileMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile Top Header */}
        <MobileNavbar onToggleMenu={toggleMobileMenu} />
        
        {/* Main Content Area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
