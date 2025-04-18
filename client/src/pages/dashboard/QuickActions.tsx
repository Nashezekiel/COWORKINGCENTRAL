import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

const QuickActions = () => {
  const { user } = useAuth();
  const isAdmin = user && (user.role === "super_admin" || user.role === "manager");

  return (
    <div className="my-6">
      <h2 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* QR Check-In Card */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-md p-3">
                <i className="fas fa-qrcode text-primary-600 dark:text-primary-400"></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  New QR Check-In
                </dt>
                <dd className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  Scan or generate codes
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-2">
            <div className="text-sm">
              <Link href="/check-in">
                <a className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                  Open scanner
                </a>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Register User Card */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-900 rounded-md p-3">
                  <i className="fas fa-user-plus text-emerald-600 dark:text-emerald-400"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    Register User
                  </dt>
                  <dd className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    Add new members
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-2">
              <div className="text-sm">
                <Link href="/users">
                  <a className="font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300">
                    Create account
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}
        
        {/* Billing Dashboard Card */}
        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900 rounded-md p-3">
                <i className="fas fa-money-bill-wave text-amber-600 dark:text-amber-400"></i>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  Billing Dashboard
                </dt>
                <dd className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  Manage payments
                </dd>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-5 py-2">
            <div className="text-sm">
              <Link href="/billing">
                <a className="font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300">
                  View billing
                </a>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Analytics Card */}
        {isAdmin && (
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-violet-100 dark:bg-violet-900 rounded-md p-3">
                  <i className="fas fa-chart-bar text-violet-600 dark:text-violet-400"></i>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dt className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    Analytics
                  </dt>
                  <dd className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    View usage reports
                  </dd>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 px-5 py-2">
              <div className="text-sm">
                <Link href="/reports">
                  <a className="font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300">
                    View reports
                  </a>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickActions;
