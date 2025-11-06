/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
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
import { Info, Plus, Trash2, Upload, Edit } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/api/axios";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
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
import { HybridDatePicker } from "@/components/ui/hybrid-date-picker";

interface Expense {
  _id: string;
  date: string;
  place: string;
  category?: string;
  amount: number;
  receiptUrl?: string;
  notes?: string;
}

const expenseSchema = z.object({
  date: z.string().min(1, { message: "Date is required." }),
  place: z.string().min(1, { message: "Place/Vendor is required." }),
  category: z.string().optional(),
  amount: z.coerce
    .number()
    .min(0.01, { message: "Amount must be greater than 0." }),
  notes: z.string().optional(),
  receipt: z.any().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

const initialFormData: ExpenseFormData = {
  date: "",
  place: "",
  category: "",
  amount: 0,
  notes: "",
  receipt: null,
};

const fetchExpenses = async (): Promise<Expense[]> => {
  const response = await api.get("/expenses");
  if (response.data.success) {
    return response.data.expenses || [];
  }
  throw new Error(response.data.error || "Could not fetch expenses.");
};

const ExpenseTableSkeleton = () => (
  <div className="rounded-md border overflow-x-auto relative">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Place</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(3)].map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-5 w-24" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-28" />
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

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialFormData,
  });

  const {
    data: expenses = [],
    isLoading: isFetchingExpenses,
    isFetching: isRefetching,
    error: fetchError,
  } = useQuery<Expense[], Error>({
    queryKey: ["expenses"],
    queryFn: fetchExpenses,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: (newExpense: FormData) =>
      api.post("/expenses", newExpense, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast({
        title: "Expense Added",
        description: "Expense recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setShowForm(false);
      form.reset(initialFormData);
    },
    onError: (error: AxiosError<any>) => {
      toast({
        title: "Failed to Add Expense",
        description:
          error.response?.data?.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updatedExpense,
    }: {
      id: string;
      updatedExpense: FormData;
    }) =>
      api.put(`/expenses/${id}`, updatedExpense, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast({
        title: "Expense Updated",
        description: "Expense saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditingExpense(null);
      setShowForm(false);
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
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onMutate: async (deletedExpenseId: string) => {
      await queryClient.cancelQueries({ queryKey: ["expenses"] });
      const previousExpenses = queryClient.getQueryData<Expense[]>([
        "expenses",
      ]);
      queryClient.setQueryData<Expense[]>(["expenses"], (oldData = []) =>
        oldData.filter((exp) => exp._id !== deletedExpenseId)
      );
      return { previousExpenses };
    },
    onError: (error: AxiosError<any>, variables, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(["expenses"], context.previousExpenses);
      }
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Could not delete expense.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const onSubmit = (data: ExpenseFormData) => {
    const dataToSubmit = new FormData();
    dataToSubmit.append("date", data.date);
    dataToSubmit.append("place", data.place);
    dataToSubmit.append("amount", String(data.amount));
    if (data.category) dataToSubmit.append("category", data.category);
    if (data.notes) dataToSubmit.append("notes", data.notes);
    if (data.receipt instanceof File) {
      dataToSubmit.append("receipt", data.receipt);
    }

    if (editingExpense) {
      updateMutation.mutate({
        id: editingExpense._id,
        updatedExpense: dataToSubmit,
      });
    } else {
      addMutation.mutate(dataToSubmit);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    form.reset({
      date: expense.date.split("T")[0],
      place: expense.place,
      category: expense.category || "",
      amount: expense.amount,
      notes: expense.notes || "",
      receipt: null,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingExpense(null);
    form.reset(initialFormData);
  };

  const totalExpenses = expenses.reduce((sum, exp) => {
    if (exp && typeof exp.amount === "number") {
      return sum + exp.amount;
    }
    return sum;
  }, 0);

  const isMutating =
    addMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-2">
            Track and manage your daily expenses
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingExpense(null);
            form.reset(initialFormData);
            setShowForm(!showForm);
          }}
          disabled={isMutating}
        >
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Cancel" : "Add Expense"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-destructive">
                ${totalExpenses.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">
                ${(totalExpenses * 0.6).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>
              {editingExpense ? "Edit Expense" : "Add New Expense"}
            </CardTitle>
            <CardDescription>
              {editingExpense
                ? "Update the details."
                : "Record a new transaction."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="place"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Place/Vendor</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Walmart"
                              {...field}
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isMutating}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Food">
                                Food & Dining
                              </SelectItem>
                              <SelectItem value="Transportation">
                                Transportation
                              </SelectItem>
                              <SelectItem value="Healthcare">
                                Healthcare
                              </SelectItem>
                              <SelectItem value="Utilities">
                                Utilities
                              </SelectItem>
                              <SelectItem value="Entertainment">
                                Entertainment
                              </SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
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
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
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
                </div>
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Weekly groceries"
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
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="receipt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Receipt (Optional {editingExpense ? "- Replace" : ""})
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            disabled={isMutating}
                            onChange={(e) =>
                              field.onChange(
                                e.target.files ? e.target.files[0] : null
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {editingExpense?.receiptUrl && !form.getValues("receipt") && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Current:{" "}
                      <a
                        href={editingExpense.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {editingExpense.receiptUrl.split("/").pop()}
                      </a>
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isMutating}>
                    {isMutating ? (
                      <LoadingSpinner />
                    ) : editingExpense ? (
                      "Save Changes"
                    ) : (
                      "Add Expense"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
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
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>View and manage history</CardDescription>
        </CardHeader>
        <CardContent>
          {fetchError && (
            <div className="text-center py-12 text-destructive">
              {" "}
              Error loading expenses: {fetchError.message}{" "}
            </div>
          )}
          {isFetchingExpenses && !fetchError && expenses.length === 0 ? (
            <ExpenseTableSkeleton />
          ) : !fetchError && expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto relative">
              {isRefetching && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <LoadingSpinner />
                </div>
              )}
              <Table
                className={isRefetching ? "opacity-50 pointer-events-none" : ""}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Place</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => {
                    if (!expense || !expense._id) return null;
                    return (
                      <TableRow key={expense._id}>
                        <TableCell>
                          {new Date(expense.date).toLocaleDateString("en-US", {
                            timeZone: "UTC",
                          })}
                        </TableCell>
                        <TableCell>{expense.place}</TableCell>
                        <TableCell>
                          {expense.category && (
                            <Badge variant="outline">{expense.category}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-destructive">
                          ${expense.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="mr-1"
                            onClick={() => handleEdit(expense)}
                            disabled={isMutating}
                            aria-label={`Edit expense on ${new Date(
                              expense.date
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
                                disabled={
                                  isMutating || deleteMutation.isPending
                                }
                                aria-label={`Delete expense on ${new Date(
                                  expense.date
                                ).toLocaleDateString()}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Are you sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this expense.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  disabled={deleteMutation.isPending}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(expense._id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                  disabled={deleteMutation.isPending}
                                >
                                  {deleteMutation.isPending &&
                                  deleteMutation.variables === expense._id ? (
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
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
