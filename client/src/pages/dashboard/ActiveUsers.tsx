import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { formatDuration } from "@/lib/formatters";
import { format } from "date-fns";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  username: string;
  profileImageColor: string;
}

interface CheckInRecord {
  id: number;
  userId: number;
  checkInTime: string;
  checkOutTime: string | null;
  duration: number | null;
  planType: string;
  user: UserInfo;
}

const ActiveUsers = () => {
  const { user } = useAuth();
  const isAdminOrManager = user && (user.role === "super_admin" || user.role === "manager");

  const { data: activeUsers, isLoading } = useQuery<CheckInRecord[]>({
    queryKey: ["/api/checkins/active"],
    enabled: isAdminOrManager,
    // If not admin, don't attempt to fetch
    queryFn: isAdminOrManager ? undefined : () => Promise.resolve([])
  });

  // Helper function to get user initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Function to calculate duration from check-in time until now
  const getDuration = (checkInTime: string) => {
    const start = new Date(checkInTime);
    const now = new Date();
    const durationInMinutes = Math.round((now.getTime() - start.getTime()) / (1000 * 60));
    return formatDuration(durationInMinutes);
  };

  if (!isAdminOrManager) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Currently Active</h2>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <i className="fas fa-circle text-green-500 text-xs mr-1"></i> {isLoading ? "..." : activeUsers?.length || 0} Active
        </span>
      </div>
      
      {isLoading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : activeUsers && activeUsers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Check-in</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {activeUsers.map((checkIn) => (
                <tr key={checkIn.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full bg-${checkIn.user.profileImageColor || "primary"}-200 dark:bg-${checkIn.user.profileImageColor || "primary"}-700 flex items-center justify-center`}>
                        <span className={`text-${checkIn.user.profileImageColor || "primary"}-700 dark:text-${checkIn.user.profileImageColor || "primary"}-200 font-medium text-xs`}>
                          {getInitials(checkIn.user.name)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{checkIn.user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{checkIn.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(checkIn.checkInTime), "h:mm a")}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {getDuration(checkIn.checkInTime)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                      ${checkIn.planType === "hourly" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : 
                        checkIn.planType === "daily" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : 
                        checkIn.planType === "weekly" ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
                        "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"}`}>
                      {checkIn.planType.charAt(0).toUpperCase() + checkIn.planType.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button type="button" className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300">
                      <i className="fas fa-ellipsis-v"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          No active users at the moment
        </div>
      )}
      
      {activeUsers && activeUsers.length > 0 && (
        <div className="mt-4 text-right">
          <Link href="/users">
            <a className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              View all active users <i className="fas fa-arrow-right ml-1"></i>
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ActiveUsers;
