import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/formatters";

interface TodayStats {
  checkins: number;
  activeUsers: number;
  newUsers: number;
  revenue: number;
}

const TodaySummary = () => {
  const { user } = useAuth();
  const isAdminOrManager = user && (user.role === "super_admin" || user.role === "manager");

  const { data: stats, isLoading } = useQuery<TodayStats>({
    queryKey: ["/api/stats/today"],
    enabled: isAdminOrManager,
    // If not admin, don't attempt to fetch
    queryFn: isAdminOrManager ? undefined : () => Promise.resolve({ checkins: 0, activeUsers: 0, newUsers: 0, revenue: 0 })
  });

  if (!isAdminOrManager) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 lg:col-span-1">
      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Today's Summary</h2>
      {isLoading ? (
        <div className="py-8 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <dl className="grid grid-cols-1 gap-x-4 gap-y-5">
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Check-ins</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{stats?.checkins || 0}</dd>
          </div>
          
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Active users</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{stats?.activeUsers || 0}</dd>
          </div>
          
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">New registrations</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-gray-100">{stats?.newUsers || 0}</dd>
          </div>
          
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 dark:text-gray-400">Revenue</dt>
            <dd className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(stats?.revenue || 0)}</dd>
          </div>
          
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <Link href="/reports">
              <a className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                View detailed report <i className="fas fa-arrow-right ml-1"></i>
              </a>
            </Link>
          </div>
        </dl>
      )}
    </div>
  );
};

export default TodaySummary;
