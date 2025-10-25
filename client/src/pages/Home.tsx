import { useState } from "react";
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
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Clock,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
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

const weeklyData = [
  { day: "Mon", income: 120 },
  { day: "Tue", income: 150 },
  { day: "Wed", income: 100 },
  { day: "Thu", income: 180 },
  { day: "Fri", income: 160 },
  { day: "Sat", income: 0 },
  { day: "Sun", income: 140 },
];

const monthlyTrend = [
  { week: "Week 1", income: 710, expenses: 250 },
  { week: "Week 2", income: 850, expenses: 320 },
  { week: "Week 3", income: 780, expenses: 180 },
  { week: "Week 4", income: 850, expenses: 238 },
];

const expenseBreakdown = [
  { name: "Groceries", value: 350, color: "#8b5cf6" },
  { name: "Transport", value: 180, color: "#ec4899" },
  { name: "Dining", value: 220, color: "#f97316" },
  { name: "Utilities", value: 238, color: "#3b82f6" },
];

const scheduleData = [
  {
    id: 1,
    date: "2025-10-20",
    day: "Mon",
    hours: 8,
    rate: 15,
    total: 120,
    tag: "Part-time",
  },
  {
    id: 2,
    date: "2025-10-21",
    day: "Tue",
    hours: 10,
    rate: 15,
    total: 150,
    tag: "Part-time",
  },
  {
    id: 3,
    date: "2025-10-22",
    day: "Wed",
    hours: 6.5,
    rate: 15,
    total: 97.5,
    tag: "Part-time",
  },
  {
    id: 4,
    date: "2025-10-23",
    day: "Thu",
    hours: 12,
    rate: 15,
    total: 180,
    tag: "Full-time",
  },
  {
    id: 5,
    date: "2025-10-24",
    day: "Fri",
    hours: 10,
    rate: 16,
    total: 160,
    tag: "Part-time",
  },
];

export default function Home() {
  const [period, setPeriod] = useState("week");
  const [showFuture, setShowFuture] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Track your schedule, income, and expenses
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Weekly Income
              </p>
              <h3 className="text-2xl font-bold">$850</h3>
              <p className="text-xs text-success mt-1">+12% vs last week</p>
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
                Monthly Income
              </p>
              <h3 className="text-2xl font-bold">$3,400</h3>
              <p className="text-xs text-success mt-1">+8% vs last month</p>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total Expenses
              </p>
              <h3 className="text-2xl font-bold">$988</h3>
              <p className="text-xs text-destructive mt-1">
                +5% vs last period
              </p>
            </div>
            <div className="p-3 rounded-full bg-destructive/10">
              <Receipt className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Profit</p>
              <h3 className="text-2xl font-bold">$612</h3>
              <p className="text-xs text-success mt-1">72% margin</p>
            </div>
            <div className="p-3 rounded-full bg-success/10">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6 bg-card/40 backdrop-blur-sm border-border/50">
          <h3 className="text-lg font-semibold mb-4">Weekly Income</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
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
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
        <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
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

      {/* Schedule Table */}
      <Card className="p-6 bg-card/40 backdrop-blur-sm border-border/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">This Week's Schedule</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFuture(!showFuture)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showFuture ? "Hide" : "Show"} Future
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold">
                  Day
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
                <th className="text-right py-3 px-4 text-sm font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {scheduleData.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/50 hover:bg-muted/50"
                >
                  <td className="py-3 px-4 text-sm">{row.date}</td>
                  <td className="py-3 px-4 text-sm">{row.day}</td>
                  <td className="py-3 px-4 text-sm">{row.hours}h</td>
                  <td className="py-3 px-4 text-sm">${row.rate}/hr</td>
                  <td className="py-3 px-4 text-sm font-semibold text-success">
                    ${row.total.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.tag === "Full-time"
                          ? "bg-primary/10 text-primary"
                          : "bg-success/10 text-success"
                      }`}
                    >
                      {row.tag}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
