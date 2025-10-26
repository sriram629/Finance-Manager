import { useState, useEffect } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
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

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [period, setPeriod] = useState("week");
  const [showFuture, setShowFuture] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [dashboardData, setDashboardData] = useState<IDashboardData | null>(
    null
  );
  const [schedules, setSchedules] = useState<ISchedule[]>([]);

  const PIE_COLORS = ["#8b5cf6", "#ec4899", "#f97316", "#3b82f6", "#10b981"];

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const fetchDashboard = async () => {
      try {
        const res = await api.get(`/reports/dashboard?period=${period}`);
        if (isMounted && res.data.success) {
          setDashboardData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Could not fetch dashboard data.",
            variant: "destructive",
          });
        }
      }
    };

    const fetchSchedulesData = async () => {
      if (!isMounted) return; // Don't fetch if unmounted
      setLoadingSchedules(true); // Start schedule-specific loading
      try {
        const res = await api.get(`/schedules?includeFuture=${showFuture}`);
        if (isMounted && res.data.success) {
          setSchedules(
            Array.isArray(res.data.schedules) ? res.data.schedules : []
          );
        } else if (isMounted) {
          setSchedules([]);
        }
      } catch (error) {
        console.error("Failed to fetch schedules:", error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Could not fetch schedules.",
            variant: "destructive",
          });
          setSchedules([]);
        }
      } finally {
        if (isMounted) {
          setLoadingSchedules(false); // Stop schedule-specific loading
        }
      }
    };

    const loadInitialData = async () => {
      if (!isMounted) return;
      setLoadingInitial(true); // Start initial page loading
      await Promise.all([fetchDashboard(), fetchSchedulesData()]);
      if (isMounted) {
        setLoadingInitial(false); // Stop initial page loading
      }
    };

    if (loadingInitial) {
      loadInitialData(); // Load everything on first mount
    } else {
      // Only refetch what changed (dashboard on period change, schedules on showFuture change)
      if (isMounted) {
        // Ensure component is still mounted before potential refetch triggers
        fetchDashboard(); // Refetch dashboard if period changes
        fetchSchedulesData(); // Refetch schedules if showFuture changes
      }
    }

    return () => {
      isMounted = false; // Cleanup function to set flag on unmount
    };
  }, [period, showFuture, toast, loadingInitial]); // Rerun effect when period or showFuture changes

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value ?? 0);
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
        <Select
          value={period}
          onValueChange={setPeriod}
          disabled={loadingInitial || loadingSchedules}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="custom" disabled>
              Custom Range
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loadingInitial ? (
        <LoadingSpinner />
      ) : !dashboardData ? (
        <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
          <EmptyState
            title="No data to display"
            description="Add a schedule or expense to get started."
            link="/schedules"
            linkText="Add First Schedule"
          />
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
                disabled={loadingInitial || loadingSchedules}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showFuture ? "Hide" : "Show"} Future
              </Button>
            </div>
            <div className="overflow-x-auto relative min-h-[100px]">
              {loadingSchedules && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-md">
                  <LoadingSpinner />
                </div>
              )}
              {schedules?.length > 0 ? (
                <table
                  className={`w-full ${loadingSchedules ? "opacity-50" : ""}`}
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
                    loadingSchedules ? "opacity-50" : ""
                  }`}
                >
                  No schedules found for this period. Add one via the Schedules
                  page!
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
