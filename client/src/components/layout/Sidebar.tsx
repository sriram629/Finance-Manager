import {
  Home,
  Calendar,
  Upload,
  Receipt,
  FileDown,
  Settings,
  User,
  CalendarPlus,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  { icon: Home, label: "Dashboard", path: "/home" },
  { icon: CalendarPlus, label: "Add Schedule", path: "/add-schedule" },
  { icon: Upload, label: "Upload Schedule", path: "/upload-schedule" },
  { icon: Receipt, label: "Expenses", path: "/expenses" },
  { icon: FileDown, label: "Reports", path: "/reports" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const summaryData = {
  weekIncome: "$850",
  monthIncome: "$3,400",
  netProfit: "$612",
};

export const Sidebar = ({ isOpen }: SidebarProps) => {
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
                {summaryData.weekIncome}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">This Month</span>
              <span className="text-sm font-semibold text-success">
                {summaryData.monthIncome}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Net Profit</span>
              <span className="text-sm font-semibold text-primary">
                {summaryData.netProfit}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
