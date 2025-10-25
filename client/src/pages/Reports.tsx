import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Info,
  Download,
  FileText,
  FileSpreadsheet,
  FileType,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";

export default function Reports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("schedule");
  const [period, setPeriod] = useState("week");
  const [format, setFormat] = useState("csv");

  const handleDownload = () => {
    toast({
      title: "Report Downloaded",
      description: `Your ${reportType} report for ${period} has been downloaded as ${format.toUpperCase()}.`,
    });
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case "csv":
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "pdf":
        return <FileType className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Downloads</h1>
        <p className="text-muted-foreground mt-2">
          Export your financial data and generate reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select report parameters and download your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={reportType}
            onValueChange={setReportType}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="combined">Combined</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Time Period</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the time range for your schedule report</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="last4weeks">Last 4 Weeks</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Report Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                    <SelectItem value="xlsx">Excel Workbook (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Report will include:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Daily work hours and rates</li>
                  <li>• Total weekly and monthly income</li>
                  <li>• Schedule tags and notes</li>
                  <li>• Income calculations</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Time Period</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the time range for your expense report</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="last4weeks">Last 4 Weeks</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Report Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                    <SelectItem value="xlsx">Excel Workbook (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Report will include:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All expense transactions</li>
                  <li>• Categories and vendors</li>
                  <li>• Total expenses by period</li>
                  <li>• Category breakdown</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="combined" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Time Period</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the time range for your combined report</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="last4weeks">Last 4 Weeks</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Report Format</Label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Excel compatible)</SelectItem>
                    <SelectItem value="xlsx">Excel Workbook (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Report will include:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Complete schedule and income data</li>
                  <li>• All expenses with categories</li>
                  <li>• Net profit calculations</li>
                  <li>• Weekly and monthly summaries</li>
                  <li>• Visual charts and graphs (PDF only)</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleDownload} className="w-full mt-6" size="lg">
            {getFormatIcon(format)}
            <Download className="ml-2 h-5 w-5" />
            Download {reportType.charAt(0).toUpperCase() +
              reportType.slice(1)}{" "}
            Report
          </Button>
        </CardContent>
      </Card>

      {/* Quick Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
          <CardDescription>
            Common report templates for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Weekly Summary</p>
                <p className="text-sm text-muted-foreground">
                  Current week income & expenses
                </p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Monthly Overview</p>
                <p className="text-sm text-muted-foreground">
                  This month's financial summary
                </p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Tax Report</p>
                <p className="text-sm text-muted-foreground">
                  Annual income for tax filing
                </p>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="text-left">
                <p className="font-medium">Expense Analysis</p>
                <p className="text-sm text-muted-foreground">
                  Category breakdown YTD
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
