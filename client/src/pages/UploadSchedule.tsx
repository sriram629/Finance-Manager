import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import {
  Info,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

export default function UploadSchedule() {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (
        file &&
        (file.name.endsWith(".xlsx") ||
          file.name.endsWith(".csv") ||
          file.name.endsWith(".xls"))
      ) {
        setUploadedFile(file);
        // Mock preview data
        setPreviewData([
          {
            date: "2025-01-20",
            day: "Monday",
            hours: 8,
            rate: 15,
            tag: "Regular",
            status: "valid",
          },
          {
            date: "2025-01-21",
            day: "Tuesday",
            hours: 8,
            rate: 15,
            tag: "Regular",
            status: "valid",
          },
          {
            date: "2025-01-22",
            day: "Wednesday",
            hours: 6,
            rate: 15,
            tag: "Part-time",
            status: "valid",
          },
          {
            date: "2025-01-23",
            day: "Thursday",
            hours: "",
            rate: 15,
            tag: "Regular",
            status: "error",
          },
          {
            date: "2025-01-24",
            day: "Friday",
            hours: 8,
            rate: 15,
            tag: "Regular",
            status: "valid",
          },
        ]);
        toast({
          title: "File Uploaded",
          description: `${file.name} has been uploaded successfully.`,
        });
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a valid Excel (.xlsx, .xls) or CSV file.",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Mock preview data
      setPreviewData([
        {
          date: "2025-01-20",
          day: "Monday",
          hours: 8,
          rate: 15,
          tag: "Regular",
          status: "valid",
        },
        {
          date: "2025-01-21",
          day: "Tuesday",
          hours: 8,
          rate: 15,
          tag: "Regular",
          status: "valid",
        },
        {
          date: "2025-01-22",
          day: "Wednesday",
          hours: 6,
          rate: 15,
          tag: "Part-time",
          status: "valid",
        },
        {
          date: "2025-01-23",
          day: "Thursday",
          hours: "",
          rate: 15,
          tag: "Regular",
          status: "error",
        },
        {
          date: "2025-01-24",
          day: "Friday",
          hours: 8,
          rate: 15,
          tag: "Regular",
          status: "valid",
        },
      ]);
      toast({
        title: "File Uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });
    }
  };

  const handleDownloadTemplate = () => {
    toast({
      title: "Template Downloaded",
      description: "Schedule template has been downloaded to your device.",
    });
  };

  const handleImport = () => {
    const validRows = previewData.filter((row) => row.status === "valid");
    toast({
      title: "Schedule Imported",
      description: `${validRows.length} entries have been imported successfully.`,
    });
    setUploadedFile(null);
    setPreviewData([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Schedule</h1>
        <p className="text-muted-foreground mt-2">
          Upload your work schedule from an Excel or CSV file
        </p>
      </div>

      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Download Template
          </CardTitle>
          <CardDescription>
            Use our template to format your schedule data correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                Required columns:{" "}
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  date, day, hours, hourly_rate
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Optional columns:{" "}
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  tag, notes
                </span>
              </p>
            </div>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Upload File
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Drag and drop your Excel or CSV file, or click to browse
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>Accepted formats: .xlsx, .xls, .csv</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }`}
          >
            <div className="flex flex-col items-center gap-4">
              <Upload
                className={`h-12 w-12 ${
                  isDragging ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <div>
                <p className="text-lg font-medium">Drop your file here</p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {uploadedFile && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Validate</CardTitle>
            <CardDescription>
              Review the first 10 rows. Fix any errors before importing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate ($)</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Income</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={
                        row.status === "error" ? "bg-destructive/10" : ""
                      }
                    >
                      <TableCell>
                        {row.status === "valid" ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.day}</TableCell>
                      <TableCell
                        className={!row.hours ? "text-destructive" : ""}
                      >
                        {row.hours || "Missing"}
                      </TableCell>
                      <TableCell>${row.rate}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.tag}</Badge>
                      </TableCell>
                      <TableCell>
                        {row.hours
                          ? `$${(row.hours * row.rate).toFixed(2)}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                {previewData.filter((r) => r.status === "valid").length} valid
                entries,
                {previewData.filter((r) => r.status === "error").length} errors
              </p>
              <Button onClick={handleImport}>Import Schedule</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
