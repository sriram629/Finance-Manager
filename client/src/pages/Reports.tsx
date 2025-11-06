/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { AxiosError } from "axios";
import { saveAs } from "file-saver";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
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
import api from "@/api/axios";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { HybridDatePicker } from "@/components/ui/hybrid-date-picker";

export default function Reports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("schedule");
  const [period, setPeriod] = useState("week");
  const [format, setFormat] = useState("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [quickExportLoading, setQuickExportLoading] = useState<string | null>(
    null
  );

  const handleFileDownload = async (
    apiCall: () => Promise<any>,
    defaultFilename: string
  ) => {
    try {
      const response = await apiCall();

      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });

      let filename = defaultFilename;
      const contentDisposition = response.headers["content-disposition"];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }

      saveAs(blob, filename);

      toast({
        title: "Report Download Started",
        description: `Your ${filename} report is downloading.`,
      });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const errorData = JSON.parse(reader.result as string);
          toast({
            title: "Report Generation Failed",
            description: errorData.error || axiosError.message,
            variant: "destructive",
          });
        } catch (e) {
          toast({
            title: "Report Generation Failed",
            description: axiosError.message || "An unknown error occurred.",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: "Report Generation Failed",
          description: axiosError.message || "An unknown error occurred.",
          variant: "destructive",
        });
      };
      if (axiosError.response?.data instanceof Blob) {
        reader.readAsText(axiosError.response.data);
      } else {
        toast({
          title: "Report Generation Failed",
          description:
            axiosError.response?.data?.error ||
            axiosError.message ||
            "An unknown error occurred.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDownload = async () => {
    if (!reportType || !period || !format) {
      toast({
        title: "Missing Options",
        description: "Please select all options.",
        variant: "destructive",
      });
      return;
    }
    if (period === "custom" && (!startDate || !endDate)) {
      toast({
        title: "Missing Dates",
        description: "Please select start and end dates.",
        variant: "destructive",
      });
      return;
    }
    if (period === "custom" && new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Invalid Date Range",
        description: "Start date cannot be after end date.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    const params = {
      reportType,
      format,
      period,
      ...(period === "custom" && { startDate, endDate }),
    };
    const defaultFilename = `report_${reportType}_${period}.${format}`;
    await handleFileDownload(
      () => api.post("/reports/generate", params, { responseType: "blob" }),
      defaultFilename
    );
    setIsDownloading(false);
  };

  const handleQuickExport = async (
    preset: string,
    format: string,
    reportType: string,
    defaultFilename: string
  ) => {
    setQuickExportLoading(preset);
    const params = { preset, format, reportType };
    await handleFileDownload(
      () => api.get("/reports/quick-export", { params, responseType: "blob" }),
      defaultFilename
    );
    setQuickExportLoading(null);
  };

  const getFormatIcon = (fmt: string) => {
    switch (fmt) {
      case "csv":
      case "xlsx":
        return <FileSpreadsheet className="h-5 w-5 mr-2" />;
      case "pdf":
        return <FileType className="h-5 w-5 mr-2" />;
      default:
        return <FileText className="h-5 w-5 mr-2" />;
    }
  };

  const renderDateInputs = (idPrefix: string) =>
    period === "custom" && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t mt-4">
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-startDate`}>Start Date</Label>
          <HybridDatePicker
            id={`${idPrefix}-startDate`}
            value={startDate}
            onChange={setStartDate}
            disabled={isDownloading}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-endDate`}>End Date</Label>
          <HybridDatePicker
            id={`${idPrefix}-endDate`}
            value={endDate}
            onChange={setEndDate}
            disabled={isDownloading}
            required
          />
        </div>
      </div>
    );

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
              <TabsTrigger value="schedule" disabled={isDownloading}>
                Schedule
              </TabsTrigger>
              <TabsTrigger value="expenses" disabled={isDownloading}>
                Expenses
              </TabsTrigger>
              <TabsTrigger value="combined" disabled={isDownloading}>
                Combined
              </TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Time Period</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the time range</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={period}
                    onValueChange={setPeriod}
                    disabled={isDownloading}
                  >
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
                  <Select
                    value={format}
                    onValueChange={setFormat}
                    disabled={isDownloading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {renderDateInputs("schedule")}
              <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                <p className="text-sm font-medium">Schedule report includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Daily work hours/rates</li>
                  <li>• Total income</li>
                  <li>• Tags/Notes</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="expenses" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Time Period</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the time range</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={period}
                    onValueChange={setPeriod}
                    disabled={isDownloading}
                  >
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
                  <Select
                    value={format}
                    onValueChange={setFormat}
                    disabled={isDownloading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {renderDateInputs("expenses")}
              <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                <p className="text-sm font-medium">Expense report includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• All transactions</li>
                  <li>• Categories/Vendors</li>
                  <li>• Total expenses</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="combined" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>Time Period</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select the time range</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Select
                    value={period}
                    onValueChange={setPeriod}
                    disabled={isDownloading}
                  >
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
                  <Select
                    value={format}
                    onValueChange={setFormat}
                    disabled={isDownloading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {renderDateInputs("combined")}
              <div className="bg-muted p-4 rounded-lg space-y-2 mt-4">
                <p className="text-sm font-medium">Combined report includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Schedule & income data</li>
                  <li>• All expenses</li>
                  <li>• Net calculations</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleDownload}
            className="w-full mt-6"
            size="lg"
            disabled={isDownloading}
          >
            {isDownloading ? <LoadingSpinner /> : getFormatIcon(format)}
            <Download className="ml-2 h-5 w-5" />
            Download {reportType.charAt(0).toUpperCase() +
              reportType.slice(1)}{" "}
            Report
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Export</CardTitle>
          <CardDescription>
            Common report templates for quick access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() =>
                handleQuickExport(
                  "weekly-summary",
                  "xlsx",
                  "combined",
                  "weekly_summary.xlsx"
                )
              }
              disabled={isDownloading || !!quickExportLoading}
            >
              {quickExportLoading === "weekly-summary" ? (
                <LoadingSpinner />
              ) : (
                <div className="text-left">
                  <p className="font-medium">Weekly Summary</p>
                  <p className="text-sm text-muted-foreground">
                    Current week income & expenses
                  </p>
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() =>
                handleQuickExport(
                  "monthly-overview",
                  "xlsx",
                  "combined",
                  "monthly_overview.xlsx"
                )
              }
              disabled={isDownloading || !!quickExportLoading}
            >
              {quickExportLoading === "monthly-overview" ? (
                <LoadingSpinner />
              ) : (
                <div className="text-left">
                  <p className="font-medium">Monthly Overview</p>
                  <p className="text-sm text-muted-foreground">
                    This month's financial summary
                  </p>
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() =>
                handleQuickExport(
                  "expense-analysis",
                  "xlsx",
                  "expenses",
                  "expense_analysis.xlsx"
                )
              }
              disabled={isDownloading || !!quickExportLoading}
            >
              {quickExportLoading === "expense-analysis" ? (
                <LoadingSpinner />
              ) : (
                <div className="text-left">
                  <p className="font-medium">Expense Analysis</p>
                  <p className="text-sm text-muted-foreground">
                    Category breakdown for month
                  </p>
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              disabled
            >
              <div className="text-left">
                <p className="font-medium">Tax Report (WIP)</p>
                <p className="text-sm text-muted-foreground">
                  Annual income for tax filing
                </p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
