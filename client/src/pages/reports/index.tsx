import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { formatCurrency } from "@/lib/formatters";

// Mock data for charts (in a real app, this would come from the API)
const usageData = [
  { name: "Mon", users: 20 },
  { name: "Tue", users: 18 },
  { name: "Wed", users: 25 },
  { name: "Thu", users: 27 },
  { name: "Fri", users: 32 },
  { name: "Sat", users: 15 },
  { name: "Sun", users: 12 },
];

const hourlyData = [
  { hour: "8 AM", users: 5 },
  { hour: "9 AM", users: 10 },
  { hour: "10 AM", users: 15 },
  { hour: "11 AM", users: 18 },
  { hour: "12 PM", users: 20 },
  { hour: "1 PM", users: 22 },
  { hour: "2 PM", users: 25 },
  { hour: "3 PM", users: 28 },
  { hour: "4 PM", users: 24 },
  { hour: "5 PM", users: 20 },
  { hour: "6 PM", users: 15 },
  { hour: "7 PM", users: 10 },
  { hour: "8 PM", users: 5 },
];

const userTypeData = [
  { name: "Hourly", value: 30 },
  { name: "Daily", value: 40 },
  { name: "Weekly", value: 15 },
  { name: "Monthly", value: 15 },
];

const revenueData = [
  { month: "Jan", revenue: 68000 },
  { month: "Feb", revenue: 72000 },
  { month: "Mar", revenue: 85000 },
  { month: "Apr", revenue: 92000 },
  { month: "May", revenue: 88000 },
  { month: "Jun", revenue: 95000 },
];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

const Reports = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState("week");
  const isAdminOrManager = user && (user.role === "super_admin" || user.role === "manager");

  // Fetch analytics data (this is where you'd fetch real data from your API)
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ["/api/analytics", timeRange],
    enabled: isAdminOrManager,
    queryFn: async () => {
      try {
        // In a real implementation, this would fetch actual data
        // const response = await apiRequest("GET", `/api/analytics?timeRange=${timeRange}`);
        // return response.json();
        
        // For demonstration, return the mock data
        return {
          usageData,
          hourlyData,
          userTypeData,
          revenueData
        };
      } catch (error) {
        return null;
      }
    }
  });

  if (!isAdminOrManager) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Reports</h1>
          <div className="mt-6 p-8 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
            <p className="text-gray-600 dark:text-gray-300">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <i className="fas fa-download mr-2"></i> Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Check-ins</div>
              <div className="mt-2 flex items-center">
                <div className="text-3xl font-bold">186</div>
                <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <i className="fas fa-arrow-up mr-1"></i>12%
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs previous period</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Members</div>
              <div className="mt-2 flex items-center">
                <div className="text-3xl font-bold">42</div>
                <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <i className="fas fa-arrow-up mr-1"></i>8%
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs previous period</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Occupancy Rate</div>
              <div className="mt-2 flex items-center">
                <div className="text-3xl font-bold">78%</div>
                <span className="ml-2 text-sm font-medium text-red-600 dark:text-red-400">
                  <i className="fas fa-arrow-down mr-1"></i>3%
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs previous period</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</div>
              <div className="mt-2 flex items-center">
                <div className="text-3xl font-bold">{formatCurrency(425000)}</div>
                <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                  <i className="fas fa-arrow-up mr-1"></i>15%
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">vs previous period</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="usage" className="space-y-4">
          <TabsList>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>
          
          <TabsContent value="usage" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Usage</CardTitle>
                  <CardDescription>Number of users by day of week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={usageData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="users" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Distribution</CardTitle>
                  <CardDescription>Number of users by hour of day</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={hourlyData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#3B82F6" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Member Plan Distribution</CardTitle>
                <CardDescription>Breakdown of member plans</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex justify-center">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie
                        data={userTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {userTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={revenueData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Plan Type</CardTitle>
                  <CardDescription>Revenue breakdown by plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Hourly", value: 80000 },
                            { name: "Daily", value: 120000 },
                            { name: "Weekly", value: 65000 },
                            { name: "Monthly", value: 160000 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {userTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Revenue by payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Card", value: 250000 },
                            { name: "Paystack", value: 135000 },
                            { name: "Stellar", value: 40000 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#3B82F6" />
                          <Cell fill="#10B981" />
                          <Cell fill="#F59E0B" />
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>New Members</CardTitle>
                  <CardDescription>New registrations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: "Jan", members: 12 },
                          { month: "Feb", members: 8 },
                          { month: "Mar", members: 15 },
                          { month: "Apr", members: 10 },
                          { month: "May", members: 18 },
                          { month: "Jun", members: 14 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="members" stroke="#8B5CF6" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Member Retention</CardTitle>
                  <CardDescription>Membership renewal rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { month: "Jan", renewed: 85, churned: 15 },
                          { month: "Feb", renewed: 82, churned: 18 },
                          { month: "Mar", renewed: 88, churned: 12 },
                          { month: "Apr", renewed: 90, churned: 10 },
                          { month: "May", renewed: 87, churned: 13 },
                          { month: "Jun", renewed: 92, churned: 8 },
                        ]}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="renewed" stackId="a" fill="#10B981" />
                        <Bar dataKey="churned" stackId="a" fill="#EF4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Member Engagement</CardTitle>
                <CardDescription>Average hours per member</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { week: "Week 1", hours: 12 },
                        { week: "Week 2", hours: 15 },
                        { week: "Week 3", hours: 14 },
                        { week: "Week 4", hours: 18 },
                        { week: "Week 5", hours: 20 },
                        { week: "Week 6", hours: 17 },
                        { week: "Week 7", hours: 19 },
                        { week: "Week 8", hours: 21 },
                      ]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="hours" stroke="#F59E0B" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
