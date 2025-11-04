import {
  Home,
  Calendar,
  Upload,
  Receipt,
  FileDown,
  Settings,
  CalendarPlus,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/axios";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  { icon: Home, label: "Dashboard", path: "/home" },
  { icon: Calendar, label: "Schedules", path: "/add-schedule" },
  { icon: Upload, label: "Upload Schedule", path: "/upload-schedule" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: FileDown, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface IKPIs {
  totalIncome: number;
  monthlyIncome: number;
  totalExpenses: number;
  netProfit: number;
}
interface IDashboardData {
  kpis: IKPIs;
}

const fetchDashboard = async (period: string): Promise<IDashboardData> => {
  const response = await api.get(`/reports/dashboard?period=${period}`);
  if (response.data.success) {
    return response.data;
  }
  throw new Error(response.data.error || "Failed to fetch dashboard data");
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) {
    return <span className="text-xs text-muted-foreground">...</span>;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const Sidebar = ({ isOpen }: SidebarProps) => {
  const { data: weekData, isLoading: isLoadingWeek } = useQuery<
    IDashboardData,
    Error
  >({
    queryKey: ["dashboard", "week"],
    queryFn: () => fetchDashboard("week"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: monthData, isLoading: isLoadingMonth } = useQuery<
    IDashboardData,
    Error
  >({
    queryKey: ["dashboard", "month"],
    queryFn: () => fetchDashboard("month"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return (
    <aside
      className={cn(
        "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border transition-all duration-300 z-30 overflow-hidden",
        isOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:w-0"
      )}
    >
      <div className="flex flex-col h-full w-64">
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  "group relative overflow-hidden",
                  isActive &&
                    "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary animate-scale-in" />
                  )}
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border space-y-3">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            QUICK SUMMARY
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">This Week</span>
              <span className="text-sm font-semibold text-success">
                {isLoadingWeek
                  ? "..."
                  : formatCurrency(weekData?.kpis.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">This Month</span>
              <span className="text-sm font-semibold text-success">
                {isLoadingMonth
                  ? "..."
                  : formatCurrency(monthData?.kpis.totalIncome)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Month Net</span>
              <span className="text-sm font-semibold text-primary">
                {isLoadingMonth
                  ? "..."
                  : formatCurrency(monthData?.kpis.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
