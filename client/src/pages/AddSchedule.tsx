/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
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
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/axios";
import { ISchedule } from "./Home";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import { HybridDatePicker } from "@/components/ui/hybrid-date-picker";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const scheduleSchema = z
  .object({
    date: z.string().min(1, { message: "Date is required." }),
    scheduleType: z.enum(["hourly", "monthly"]),
    hours: z.coerce.number().optional(),
    hourlyRate: z.coerce.number().optional(),
    monthlySalary: z.coerce.number().optional(),
    notes: z.string().optional(),
    repeatWeekly: z.boolean().default(false),
    repeatWeekdays: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (
        data.scheduleType === "hourly" &&
        (data.hours === undefined || data.hours <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Hours must be greater than 0 for hourly schedule",
      path: ["hours"],
    }
  )
  .refine(
    (data) => {
      if (
        data.scheduleType === "hourly" &&
        (data.hourlyRate === undefined || data.hourlyRate < 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Rate is required for hourly schedule",
      path: ["hourlyRate"],
    }
  )
  .refine(
    (data) => {
      if (
        data.scheduleType === "monthly" &&
        (data.monthlySalary === undefined || data.monthlySalary <= 0)
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Salary must be greater than 0 for monthly schedule",
      path: ["monthlySalary"],
    }
  );

type ScheduleFormData = z.infer<typeof scheduleSchema>;

const initialFormData: ScheduleFormData = {
  date: "",
  scheduleType: "hourly",
  hours: undefined,
  hourlyRate: undefined,
  monthlySalary: undefined,
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

const ScheduleTableSkeleton = () => (
  <div className="rounded-md border overflow-x-auto relative">
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
      <TableBody>
        {[...Array(5)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-10" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell className="flex gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

export default function Schedules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ISchedule | null>(
    null
  );
  const [showFuture, setShowFuture] = useState(false);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: initialFormData,
  });
  const watchScheduleType = form.watch("scheduleType");
  const watchRepeatWeekly = form.watch("repeatWeekly");

  const {
    data: schedules = [],
    isLoading: isFetchingInitial,
    isFetching: isRefetching,
    error: fetchError,
  } = useQuery<ISchedule[], Error>({
    queryKey: ["schedules", showFuture],
    queryFn: () => fetchSchedules(showFuture),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: (newSchedule: ScheduleFormData) =>
      api.post("/schedules", { ...newSchedule, tag: newSchedule.notes }),
    onSuccess: (data) => {
      toast({ title: "Schedule Added", description: data.data.message });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      form.reset(initialFormData);
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
      updatedSchedule: ScheduleFormData;
    }) =>
      api.put(`/schedules/${id}`, {
        ...updatedSchedule,
        tag: updatedSchedule.notes,
      }),
    onSuccess: () => {
      toast({
        title: "Schedule Updated",
        description: "Your changes have been saved.",
      });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      setEditingSchedule(null);
      form.reset(initialFormData);
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
    onMutate: async (deletedScheduleId: string) => {
      await queryClient.cancelQueries({ queryKey: ["schedules", showFuture] });
      const previousSchedules = queryClient.getQueryData<ISchedule[]>([
        "schedules",
        showFuture,
      ]);
      queryClient.setQueryData<ISchedule[]>(
        ["schedules", showFuture],
        (oldData = []) =>
          oldData.filter((schedule) => schedule._id !== deletedScheduleId)
      );
      return { previousSchedules };
    },
    onError: (error: AxiosError<any>, variables, context) => {
      if (context?.previousSchedules) {
        queryClient.setQueryData(
          ["schedules", showFuture],
          context.previousSchedules
        );
      }
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "An error occurred.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    if (editingSchedule) {
      updateMutation.mutate({ id: editingSchedule._id, updatedSchedule: data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleEditClick = (schedule: ISchedule) => {
    setEditingSchedule(schedule);
    form.reset({
      date: schedule.date.split("T")[0],
      scheduleType: schedule.scheduleType,
      hours: schedule.hours || undefined,
      hourlyRate: schedule.hourlyRate || undefined,
      monthlySalary: schedule.monthlySalary || undefined,
      notes: schedule.tag || "",
      repeatWeekly: false,
      repeatWeekdays: [],
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    form.reset(initialFormData);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Schedules</h1>
          <p className="text-muted-foreground mt-2">
            Manage your work schedules and income
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
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
              form.reset(initialFormData);
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
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="scheduleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isMutating}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hourly">Hourly Rate</SelectItem>
                            <SelectItem value="monthly">
                              Monthly Salary
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <HybridDatePicker
                            id="date"
                            value={field.value}
                            onChange={field.onChange}
                            disabled={isMutating}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watchScheduleType === "hourly" ? (
                  <>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="hours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hours Worked</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="8"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : e.target.valueAsNumber
                                  )
                                }
                                value={field.value ?? ""}
                                disabled={isMutating}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="15.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : e.target.valueAsNumber
                                  )
                                }
                                value={field.value ?? ""}
                                disabled={isMutating}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="monthlySalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Salary ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="3000.00"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : e.target.valueAsNumber
                                )
                              }
                              value={field.value ?? ""}
                              disabled={isMutating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tag / Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Night shift, Client Project"
                            {...field}
                            value={field.value ?? ""}
                            disabled={isMutating}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!editingSchedule && (
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <FormField
                      control={form.control}
                      name="repeatWeekly"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isMutating}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium leading-none">
                            Repeat weekly
                          </FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger type="button" asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  Applies this schedule to selected days for
                                  this week only
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </FormItem>
                      )}
                    />
                    {watchRepeatWeekly && (
                      <div className="space-y-2 pl-6">
                        <Label>Select Days to Repeat</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {daysOfWeek.map((day) => (
                            <FormField
                              key={day}
                              control={form.control}
                              name="repeatWeekdays"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...(field.value || []),
                                              day,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day
                                              )
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {day}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
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
                    disabled={isMutating}
                  >
                    {isMutating ? (
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
                    disabled={isMutating}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
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
            <ScheduleTableSkeleton />
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
                          aria-label={`Edit schedule for ${new Date(
                            schedule.date
                          ).toLocaleDateString()}`}
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
                              aria-label={`Delete schedule for ${new Date(
                                schedule.date
                              ).toLocaleDateString()}`}
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
