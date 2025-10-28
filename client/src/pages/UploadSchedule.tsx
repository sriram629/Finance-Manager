/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "../components/ui/badge";
import api from "@/api/axios";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { useQueryClient } from "@tanstack/react-query"; // Keep for invalidating cache

interface PreviewRow {
  row: number;
  date: string;
  hours: string | number;
  hourlyRate: string | number;
  tag: string | null;
  notes: string | null;
  isValid: boolean;
  errors: string[];
  day: string;
}

export default function UploadSchedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [tempFileId, setTempFileId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false); // New loading state for upload
  const [isConfirming, setIsConfirming] = useState(false); // New loading state for confirm

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // --- New Async function for file upload ---
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setPreviewData([]);
    setTempFileId(null);
    setSelectedRows([]);
    setUploadedFile(file); // Show filename while uploading

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/schedules/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = response.data;
      setPreviewData(data.preview || []);
      setTempFileId(data.tempFileId);
      const validRowNumbers = (data.preview || [])
        .filter((row: PreviewRow) => row.isValid)
        .map((row: PreviewRow) => row.row);
      setSelectedRows(validRowNumbers);
      toast({
        title: "File Processed",
        description: `Found ${data.valid} valid and ${data.invalid} invalid rows.`,
      });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      setUploadedFile(null); // Clear file on error
      toast({
        title: "Upload Failed",
        description: axiosError.response?.data?.error || axiosError.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const processFile = (file: File | null) => {
    if (
      file &&
      (file.name.endsWith(".xlsx") ||
        file.name.endsWith(".csv") ||
        file.name.endsWith(".xls"))
    ) {
      handleFileUpload(file); // Call the async upload function
    } else if (file) {
      toast({
        title: "Invalid File Type",
        description: "Please upload .xlsx, .xls, or .csv",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    processFile(files[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Removed dependencies as processFile now calls handleFileUpload

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file || null);
    e.target.value = "";
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/schedules/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "schedule_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Template Downloaded",
        description: "Schedule template download started.",
      });
    } catch (error) {
      console.error("Template download error:", error);
      toast({
        title: "Download Failed",
        description: "Could not download the template.",
        variant: "destructive",
      });
    }
  };

  // --- New Async function for confirm import ---
  const handleConfirmImport = async () => {
    if (!tempFileId || selectedRows.length === 0) {
      toast({
        title: "No Rows Selected",
        description: "Please select valid rows.",
        variant: "destructive",
      });
      return;
    }
    setIsConfirming(true);
    try {
      const response = await api.post("/schedules/confirm-upload", {
        tempFileId,
        rowsToImport: selectedRows,
      });
      const data = response.data;
      toast({ title: "Import Successful", description: data.message });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setUploadedFile(null);
      setPreviewData([]);
      setTempFileId(null);
      setSelectedRows([]);
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      toast({
        title: "Import Failed",
        description: axiosError.response?.data?.error || axiosError.message,
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRowSelect = (rowNumber: number, checked: boolean) => {
    setSelectedRows((prev) =>
      checked ? [...prev, rowNumber] : prev.filter((r) => r !== rowNumber)
    );
  };

  const handleSelectAllValid = (checked: boolean) => {
    const validRowNumbers = previewData
      .filter((row) => row.isValid)
      .map((row) => row.row);
    setSelectedRows(checked ? validRowNumbers : []);
  };

  const allValidSelected =
    previewData.length > 0 &&
    selectedRows.length === previewData.filter((r) => r.isValid).length &&
    previewData.filter((r) => r.isValid).length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Schedule</h1>
        <p className="text-muted-foreground mt-2">
          Upload your work schedule from an Excel or CSV file
        </p>
      </div>

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
                Required:{" "}
                <span className="font-mono bg-muted px-2 py-1 rounded">
                  date, hours, hourly_rate
                </span>
              </p>
              <p className="text-sm text-muted-foreground">
                Optional:{" "}
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
                  <p>Drag & drop or click (.xlsx, .xls, .csv)</p>
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
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <LoadingSpinner />
                <p>Processing file...</p>
              </div>
            ) : (
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
                  <Button variant="outline" type="button" asChild>
                    <span>Browse Files</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
          {uploadedFile && !isUploading && (
            <div className="mt-4 text-sm text-center text-muted-foreground">
              Uploaded:{" "}
              <span className="font-medium text-primary">
                {uploadedFile.name}
              </span>
              <Button
                variant="link"
                size="sm"
                className="ml-2 text-destructive"
                onClick={() => {
                  setUploadedFile(null);
                  setPreviewData([]);
                  setTempFileId(null);
                  setSelectedRows([]);
                }}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {previewData.length > 0 && tempFileId && (
        <Card>
          <CardHeader>
            <CardTitle>Preview & Validate</CardTitle>
            <CardDescription>
              Review the data. Select valid rows to import.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={allValidSelected}
                        onCheckedChange={(checked) =>
                          handleSelectAllValid(checked as boolean)
                        }
                        disabled={
                          previewData.filter((r) => r.isValid).length === 0
                        }
                      />
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Row</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate ($)</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Est. Income</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row) => (
                    <TableRow
                      key={row.row}
                      className={!row.isValid ? "bg-destructive/10" : ""}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedRows.includes(row.row)}
                          onCheckedChange={(checked) =>
                            handleRowSelect(row.row, checked as boolean)
                          }
                          disabled={!row.isValid}
                        />
                      </TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.row}
                      </TableCell>
                      <TableCell
                        className={
                          row.errors.some((e) => e.includes("date"))
                            ? "text-destructive font-medium"
                            : ""
                        }
                      >
                        {row.date}
                      </TableCell>
                      <TableCell>{row.day}</TableCell>
                      <TableCell
                        className={
                          row.errors.some((e) => e.includes("hours"))
                            ? "text-destructive font-medium"
                            : ""
                        }
                      >
                        {row.hours}
                      </TableCell>
                      <TableCell
                        className={
                          row.errors.some((e) => e.includes("rate"))
                            ? "text-destructive font-medium"
                            : ""
                        }
                      >
                        {typeof row.hourlyRate === "number"
                          ? row.hourlyRate.toFixed(2)
                          : row.hourlyRate}
                      </TableCell>
                      <TableCell>
                        {row.tag && <Badge variant="outline">{row.tag}</Badge>}
                      </TableCell>
                      <TableCell>
                        {row.isValid &&
                        typeof row.hours === "number" &&
                        typeof row.hourlyRate === "number"
                          ? `$${(row.hours * row.hourlyRate).toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-destructive">
                        {row.errors.join(", ")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center mt-6">
              <p className="text-sm text-muted-foreground">
                Selected {selectedRows.length} valid row(s).
              </p>
              <Button
                onClick={handleConfirmImport}
                disabled={isConfirming || selectedRows.length === 0}
              >
                {isConfirming ? (
                  <LoadingSpinner />
                ) : (
                  `Import ${selectedRows.length} Schedule(s)`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
