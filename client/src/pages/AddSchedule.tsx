/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
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
import { Checkbox } from "../components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Info, Plus, Edit, Trash2, Calendar } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import api from "@/api/axios";
import { ISchedule } from "./Home";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

interface ScheduleFormData {
  date: string;
  scheduleType: "hourly" | "monthly";
  hours?: number | string;
  hourlyRate?: number | string;
  monthlySalary?: number | string;
  notes?: string;
  repeatWeekly: boolean;
  repeatWeekdays: string[];
}

const initialFormData: ScheduleFormData = {
  date: "",
  scheduleType: "hourly",
  hours: "",
  hourlyRate: "",
  monthlySalary: "",
  notes: "",
  repeatWeekly: false,
  repeatWeekdays: [],
};

const fetchSchedules = async (includeFuture: boolean): Promise<ISchedule[]> => {
  const response = await api.get(`/schedules?includeFuture=${includeFuture}`);
  if (response.data.success && Array.isArray(response.data.schedules)) {
    return response.data.schedules;
  }
  throw new Error(response.data.error || "Failed to fetch schedules");
};

export default function Schedules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ISchedule | null>(
    null
  );
  const [showFuture, setShowFuture] = useState(false);
  const [formData, setFormData] = useState<ScheduleFormData>(initialFormData);

  const {
    data: schedules = [],
    isLoading: isFetchingInitial,
    isFetching: isRefetching,
    error: fetchError, // Get the error state
  } = useQuery<ISchedule[], Error>({
    queryKey: ["schedules", showFuture],
    queryFn: () => fetchSchedules(showFuture),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    // Removed onError callback
  });

  const addMutation = useMutation({
    mutationFn: (newSchedule: any) => api.post("/schedules", newSchedule),
    onSuccess: (data) => {
      toast({ title: "Schedule Added", description: data.data.message });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setFormData(initialFormData);
      setShowForm(false);
    },
    onError: (error: AxiosError<any>) => {
      toast({
        title: "Failed to Add Schedule",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updatedSchedule,
    }: {
      id: string;
      updatedSchedule: any;
    }) => api.put(`/schedules/${id}`, updatedSchedule),
    onSuccess: () => {
      toast({
        title: "Schedule Updated",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setFormData(initialFormData);
      setShowForm(false);
      setEditingSchedule(null);
    },
    onError: (error: AxiosError<any>) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/schedules/${id}`),
    onSuccess: () => {
      toast({
        title: "Schedule Deleted",
        description: "The entry has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
    onError: (error: AxiosError<any>) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "number" ? (value === "" ? "" : value) : value,
    }));
  };
  const handleTypeChange = (value: "hourly" | "monthly") => {
    setFormData((prev) => ({ ...prev, scheduleType: value }));
  };
  const handleRepeatChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      repeatWeekly: checked,
      repeatWeekdays: checked ? prev.repeatWeekdays : [],
    }));
  };
  const handleDayChange = (day: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      repeatWeekdays: checked
        ? [...prev.repeatWeekdays, day]
        : prev.repeatWeekdays.filter((d) => d !== day),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) {
      toast({
        title: "Missing Date",
        description: "Please select a date.",
        variant: "destructive",
      });
      return;
    }
    if (
      !editingSchedule &&
      formData.repeatWeekly &&
      formData.repeatWeekdays.length === 0
    ) {
      toast({
        title: "No Days Selected",
        description: "Please select days to repeat.",
        variant: "destructive",
      });
      return;
    }

    const payload: Partial<ScheduleFormData> & { tag?: string } = {
      date: formData.date,
      scheduleType: formData.scheduleType,
      hours:
        formData.scheduleType === "hourly"
          ? Number(formData.hours) || undefined
          : undefined,
      hourlyRate:
        formData.scheduleType === "hourly"
          ? Number(formData.hourlyRate) || undefined
          : undefined,
      monthlySalary:
        formData.scheduleType === "monthly"
          ? Number(formData.monthlySalary) || undefined
          : undefined,
      tag: formData.notes,
      notes: formData.notes,
      repeatWeekly: editingSchedule ? undefined : formData.repeatWeekly,
      repeatWeekdays: editingSchedule ? undefined : formData.repeatWeekdays,
    };

    if (editingSchedule) {
      updateMutation.mutate({
        id: editingSchedule._id,
        updatedSchedule: payload,
      });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleEditClick = (schedule: ISchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      date: schedule.date.split("T")[0],
      scheduleType: schedule.scheduleType,
      hours: schedule.hours?.toString() || "",
      hourlyRate: schedule.hourlyRate?.toString() || "",
      monthlySalary: schedule.monthlySalary?.toString() || "",
      notes: schedule.tag || "",
      repeatWeekly: false,
      repeatWeekdays: [],
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    setFormData(initialFormData);
  };

  const handleDeleteClick = (scheduleId: string) => {
    deleteMutation.mutate(scheduleId);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value ?? 0);
  };

  const isMutating =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Schedules</h1>
          <p className="text-muted-foreground mt-2">
            Manage your work schedules and income
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFuture(!showFuture)}
            disabled={isFetchingInitial || isMutating}
          >
            <Calendar className="h-4 w-4 mr-2" />
            {showFuture ? "Hide" : "Show"} Future
          </Button>
          <Button
            onClick={() => {
              setEditingSchedule(null);
              setFormData(initialFormData);
              setShowForm(!showForm);
            }}
            disabled={isMutating}
          >
            <Plus className="mr-2 h-4 w-4" />
            {showForm ? "Cancel" : "Add Schedule"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>
              {editingSchedule ? "Edit Schedule Entry" : "Add New Schedule(s)"}
            </CardTitle>
            <CardDescription>
              {editingSchedule
                ? "Update the details for this entry."
                : 'Enter details. Use "Repeat weekly" to add multiple entries.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Schedule Type</Label>
                <Select
                  value={formData.scheduleType}
                  onValueChange={handleTypeChange}
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly Rate</SelectItem>
                    <SelectItem value="monthly">Monthly Salary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  disabled={addMutation.isPending || updateMutation.isPending}
                />
              </div>
              {formData.scheduleType === "hourly" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours Worked</Label>
                    <Input
                      id="hours"
                      type="number"
                      step="0.5"
                      min="0"
                      placeholder="8"
                      required
                      value={formData.hours}
                      onChange={handleInputChange}
                      disabled={
                        addMutation.isPending || updateMutation.isPending
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="15.00"
                      required
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      disabled={
                        addMutation.isPending || updateMutation.isPending
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="monthlySalary">Monthly Salary ($)</Label>
                  <Input
                    id="monthlySalary"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="3000.00"
                    required
                    value={formData.monthlySalary}
                    onChange={handleInputChange}
                    disabled={addMutation.isPending || updateMutation.isPending}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="notes">Tag / Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Night shift, Client Project"
                  value={formData.notes}
                  onChange={handleInputChange}
                  disabled={addMutation.isPending || updateMutation.isPending}
                />
              </div>
              {!editingSchedule && (
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="repeatWeekly"
                      checked={formData.repeatWeekly}
                      onCheckedChange={(checked) =>
                        handleRepeatChange(checked as boolean)
                      }
                      disabled={addMutation.isPending}
                    />
                    <label
                      htmlFor="repeatWeekly"
                      className="text-sm font-medium leading-none"
                    >
                      Repeat weekly
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Applies this schedule to selected days weekly for
                            the next month
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  {formData.repeatWeekly && (
                    <div className="space-y-2 pl-6">
                      <Label>Select Days to Repeat</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {daysOfWeek.map((day) => (
                          <div
                            key={day}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={day}
                              checked={formData.repeatWeekdays.includes(day)}
                              onCheckedChange={(checked) =>
                                handleDayChange(day, checked as boolean)
                              }
                              disabled={addMutation.isPending}
                            />
                            <label htmlFor={day} className="text-sm">
                              {day}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-4 border-t border-border/50">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  {addMutation.isPending || updateMutation.isPending ? (
                    <LoadingSpinner />
                  ) : editingSchedule ? (
                    "Update Schedule"
                  ) : (
                    "Add Schedule(s)"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelForm}
                  disabled={addMutation.isPending || updateMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Schedule History</CardTitle>
          <CardDescription>
            View and manage your past and future work schedules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <div className="text-center py-12 text-destructive">
              Error loading schedules: {fetchError.message}
            </div>
          )}
          {isFetchingInitial && !fetchError && schedules.length === 0 ? (
            <LoadingSpinner />
          ) : !fetchError && schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No schedules recorded yet. Click "Add Schedule" to start.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto relative">
              {isRefetching && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <LoadingSpinner />
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Total Pay</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody
                  className={
                    isRefetching ? "opacity-50 pointer-events-none" : ""
                  }
                >
                  {schedules.map((schedule: ISchedule) => (
                    <TableRow key={schedule._id}>
                      <TableCell>
                        {new Date(schedule.date).toLocaleDateString("en-US", {
                          timeZone: "UTC",
                        })}
                      </TableCell>
                      <TableCell>
                        {schedule.hours !== undefined
                          ? `${schedule.hours}h`
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {schedule.hourlyRate !== undefined
                          ? `$${schedule.hourlyRate}/hr`
                          : "N/A"}
                      </TableCell>
                      <TableCell className="font-medium text-success">
                        {formatCurrency(schedule.calculatedPay)}
                      </TableCell>
                      <TableCell>
                        {schedule.tag && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary`}
                          >
                            {schedule.tag}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="mr-1"
                          onClick={() => handleEditClick(schedule)}
                          disabled={isMutating}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              disabled={isMutating || deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this schedule
                                entry.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                disabled={deleteMutation.isPending}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteClick(schedule._id)}
                                className="bg-destructive hover:bg-destructive/90"
                                disabled={deleteMutation.isPending}
                              >
                                {deleteMutation.isPending &&
                                deleteMutation.variables === schedule._id ? (
                                  <LoadingSpinner />
                                ) : (
                                  "Delete"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
