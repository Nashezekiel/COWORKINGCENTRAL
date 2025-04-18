import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { formatRelativeTime } from "@/lib/formatters";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  profileImageColor: string;
}

interface ActivityLog {
  id: number;
  userId: number;
  activityType: 'check_in' | 'check_out' | 'payment' | 'registration';
  details: string;
  timestamp: string;
  user: User;
}

const RecentActivity = () => {
  const { user } = useAuth();
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const isAdminOrManager = user && (user.role === "super_admin" || user.role === "manager");

  const { data: activities, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity/recent"],
    enabled: isAdminOrManager
  });

  if (!isAdminOrManager) {
    return null;
  }

  // Get activity icon based on type
  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'check_in':
        return <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
          <i className="fas fa-sign-in-alt text-primary-600 dark:text-primary-400"></i>
        </div>;
      case 'check_out':
        return <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
          <i className="fas fa-sign-out-alt text-red-600 dark:text-red-400"></i>
        </div>;
      case 'payment':
        return <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
          <i className="fas fa-dollar-sign text-green-600 dark:text-green-400"></i>
        </div>;
      case 'registration':
        return <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
          <i className="fas fa-user-plus text-purple-600 dark:text-purple-400"></i>
        </div>;
      default:
        return <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
          <i className="fas fa-info-circle text-gray-600 dark:text-gray-400"></i>
        </div>;
    }
  };

  // Filter activities by type
  const filteredActivities = activities && activityFilter !== "all"
    ? activities.filter(activity => activity.activityType === activityFilter)
    : activities;

  return (
    <div className="my-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200">Recent Activity</h2>
          <div className="relative">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-40 text-sm">
                <SelectValue placeholder="All Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="check_in">Check-ins</SelectItem>
                <SelectItem value="check_out">Check-outs</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="registration">New Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="py-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        ) : filteredActivities && filteredActivities.length > 0 ? (
          <div className="flow-root">
            <ul className="-mb-8">
              {filteredActivities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < filteredActivities.length - 1 && (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        {getActivityIcon(activity.activityType)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <a href="#" className="font-medium text-gray-900 dark:text-gray-100">{activity.user.name}</a>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                          <p>{activity.details}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            No activity data found
          </div>
        )}
        
        {filteredActivities && filteredActivities.length > 0 && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
            >
              {isFetchingNextPage ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-transparent"></div>
                  Loading...
                </>
              ) : hasNextPage ? (
                "Load more activity"
              ) : (
                "No more activity"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
