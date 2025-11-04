import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar, DollarSign, TrendingUp, Receipt, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

const EmptyState = ({
  title,
  description,
  link,
  linkText,
}: {
  title: string;
  description: string;
  link: string;
  linkText: string;
}) => (
  <div className="text-center py-12">
    <h3 className="text-lg font-semibold">{title}</h3>
    <p className="text-muted-foreground mt-2 mb-4">{description}</p>
    <Button asChild>
      <Link to={link}>
        <Plus className="h-4 w-4 mr-2" />
        {linkText}
      </Link>
    </Button>
  </div>
);

interface IKPIs {
  totalIncome: number;
  monthlyIncome: number;
  totalExpenses: number;
  netProfit: number;
}
interface ICharts {
  weeklyIncomeByDay: { day: string; income: number }[];
  expensesByCategory: { name: string; value: number }[];
  monthlyTrend: { week: string; income: number; expenses: number }[];
}
interface IDashboardData {
  kpis: IKPIs;
  charts: ICharts;
}
export interface ISchedule {
  _id: string;
  date: string;
  dayOfWeek: string;
  hours?: number;
  hourlyRate?: number;
  monthlySalary?: number;
  calculatedPay: number;
  tag?: string;
  scheduleType: "hourly" | "monthly";
}

const fetchDashboard = async (
  period: string,
  startDate?: string,
  endDate?: string
): Promise<IDashboardData> => {
  const params = new URLSearchParams({ period });
  if (period === "custom" && startDate && endDate) {
    params.append("startDate", startDate);
    params.append("endDate", endDate);
  }
  const response = await api.get(`/reports/dashboard?${params.toString()}`);
  if (response.data.success) {
    return response.data;
  }
  throw new Error(response.data.error || "Failed to fetch dashboard data");
};

const fetchSchedules = async (
  includeFuture: boolean,
  period: string,
  startDate?: string,
  endDate?: string
): Promise<ISchedule[]> => {
  const params = new URLSearchParams({ includeFuture: String(includeFuture) });
  if (period === "custom" && startDate && endDate) {
    params.append("startDate", startDate);
    params.append("endDate", endDate);
  }

  const response = await api.get(`/schedules?${params.toString()}`);
  if (response.data.success && Array.isArray(response.data.schedules)) {
    return response.data.schedules;
  }
  throw new Error(response.data.error || "Failed to fetch schedules");
};

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState("week");
  const [showFuture, setShowFuture] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isCustomRangeReady = period === "custom" && !!startDate && !!endDate;
  const isQueryEnabled = period !== "custom" || isCustomRangeReady;

  const {
    data: dashboardData,
    isLoading: isLoadingDashboard,
    error: dashboardError,
  } = useQuery<IDashboardData, Error>({
    queryKey: ["dashboard", period, startDate, endDate],
    queryFn: () => fetchDashboard(period, startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isQueryEnabled,
  });

  const {
    data: schedules = [],
    isLoading: isLoadingSchedules,
    isFetching: isRefetchingSchedules,
    error: schedulesError,
  } = useQuery<ISchedule[], Error>({
    queryKey: ["schedules", showFuture, period, startDate, endDate],
    queryFn: () => fetchSchedules(showFuture, period, startDate, endDate),
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: isQueryEnabled,
  });

  const PIE_COLORS = ["#8b5cf6", "#ec4899", "#f97316", "#3b82f6", "#10b981"];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value ?? 0);
  };

  const isLoadingInitial = isLoadingDashboard || isLoadingSchedules;

  useEffect(() => {
    if (dashboardError) {
      toast({
        title: "Error",
        description:
          dashboardError.message || "Could not fetch dashboard data.",
        variant: "destructive",
      });
    }
  }, [dashboardError, toast]);

  useEffect(() => {
    if (schedulesError) {
      toast({
        title: "Error",
        description: schedulesError.message || "Could not fetch schedules.",
        variant: "destructive",
      });
    }
  }, [schedulesError, toast]);

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
    if (value !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {user?.firstName || "User"}!
          </h1>
          <p className="text-muted-foreground">
            Here's your financial and schedule overview.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Select
            value={period}
            onValueChange={handlePeriodChange}
            disabled={
              isLoadingInitial || isLoadingDashboard || isRefetchingSchedules
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {period === "custom" && (
        <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate-dash">Start Date</Label>
              <Input
                id="startDate-dash"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isLoadingDashboard || isRefetchingSchedules}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate-dash">End Date</Label>
              <Input
                id="endDate-dash"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isLoadingDashboard || isRefetchingSchedules}
              />
            </div>
          </div>
          {(!startDate || !endDate) && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Please select a start and end date to load data.
            </p>
          )}
        </Card>
      )}

      {isLoadingInitial ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      ) : !dashboardData || dashboardError ? (
        <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
          {dashboardError ? (
            <div className="text-center py-12 text-destructive">
              Error loading dashboard data. {dashboardError.message}
            </div>
          ) : (
            <EmptyState
              title="No data to display"
              description="Add a schedule or expense."
              link="/schedules"
              linkText="Add Schedule"
            />
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Income ({period})
                  </p>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(dashboardData.kpis.totalIncome)}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <DollarSign className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Total Expenses ({period})
                  </p>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(dashboardData.kpis.totalExpenses)}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-destructive/10">
                  <Receipt className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Net Profit ({period})
                  </p>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(dashboardData.kpis.netProfit)}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-success/10">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Est. Monthly Income
                  </p>
                  <h3 className="text-2xl font-bold">
                    {formatCurrency(dashboardData.kpis.monthlyIncome)}
                  </h3>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6 bg-card/40 backdrop-blur-sm border-border/50">
              <h3 className="text-lg font-semibold mb-4">Weekly Income</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboardData.charts.weeklyIncomeByDay}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="day" />
                  <YAxis tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(val) => formatCurrency(val as number)} />
                  <Bar
                    dataKey="income"
                    fill="hsl(var(--primary))"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
              <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
              {dashboardData.charts.expensesByCategory?.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={dashboardData.charts.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dashboardData.charts.expensesByCategory.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(val) => formatCurrency(val as number)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  No expenses logged.
                </div>
              )}
            </Card>
          </div>
          <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
            <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dashboardData.charts.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="week" />
                <YAxis tickFormatter={(val) => `$${val}`} />
                <Tooltip formatter={(val) => formatCurrency(val as number)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Current Schedule</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFuture(!showFuture)}
                disabled={
                  isLoadingInitial ||
                  isLoadingSchedules ||
                  isRefetchingSchedules
                }
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showFuture ? "Hide" : "Show"} Future
              </Button>
            </div>
            <div className="overflow-x-auto relative min-h-[100px]">
              {isRefetchingSchedules && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
                  <LoadingSpinner />
                </div>
              )}
              {schedulesError ? (
                <div className="text-center py-12 text-destructive">
                  Error loading schedules.
                </div>
              ) : schedules?.length > 0 ? (
                <table
                  className={`w-full ${
                    isRefetchingSchedules
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Date
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Hours
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Rate
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Total
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold">
                        Tag
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules?.map((row) => (
                      <tr
                        key={row._id}
                        className="border-b border-border/50 hover:bg-muted/50"
                      >
                        <td className="py-3 px-4 text-sm">
                          {new Date(row.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            timeZone: "UTC",
                          })}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {row.hours !== undefined ? `${row.hours}h` : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {row.hourlyRate !== undefined
                            ? `$${row.hourlyRate}/hr`
                            : "N/A"}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-success">
                          {formatCurrency(row.calculatedPay)}
                        </td>
                        <td className="py-3 px-4">
                          {row.tag && (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary`}
                            >
                              {row.tag}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div
                  className={`text-center py-12 text-muted-foreground ${
                    isRefetchingSchedules ? "opacity-50" : ""
                  }`}
                >
                  {isLoadingSchedules
                    ? "Loading schedules..."
                    : "No schedules found for this period."}
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
