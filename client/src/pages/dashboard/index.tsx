import QuickActions from "./QuickActions";
import TodaySummary from "./TodaySummary";
import ActiveUsers from "./ActiveUsers";
import PricingManagement from "./PricingManagement";
import QRCodeManagement from "./QRCodeManagement";
import RecentActivity from "./RecentActivity";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Quick Actions Section */}
        <QuickActions />
        
        {/* Day Summary & Active Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
          <TodaySummary />
          <ActiveUsers />
        </div>
        
        {/* Only show pricing management and QR code management for admins and managers */}
        {user && (user.role === "super_admin" || user.role === "manager") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
            <PricingManagement />
            <QRCodeManagement />
          </div>
        )}
        
        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </div>
  );
};

export default Dashboard;
