/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
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

interface Expense {
  _id: string;
  date: string;
  place: string;
  category?: string;
  amount: number;
  receiptUrl?: string;
  notes?: string;
}

interface ExpenseFormData {
  date: string;
  place: string;
  category: string;
  amount: string;
  notes?: string;
  receipt?: File | null;
}

const initialFormData: ExpenseFormData = {
  date: "",
  place: "",
  category: "",
  amount: "",
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

export default function Expenses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);

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
    onSuccess: (data) => {
      toast({
        title: "Expense Added",
        description: "Expense recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setFormData(initialFormData);
      setShowForm(false);
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
    onSuccess: (data) => {
      toast({
        title: "Expense Updated",
        description: "Expense saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditingExpense(null);
      setShowForm(false);
      setFormData(initialFormData);
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
    onSuccess: () => {
      toast({
        title: "Expense Deleted",
        description: "The expense has been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: AxiosError<any>) => {
      toast({
        title: "Delete Failed",
        description: error.response?.data?.error || "Could not delete expense.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData((prev) => ({ ...prev, receipt: e.target.files![0] }));
    } else {
      setFormData((prev) => ({ ...prev, receipt: null }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSubmit = new FormData();
    dataToSubmit.append("date", formData.date);
    dataToSubmit.append("place", formData.place);
    dataToSubmit.append("amount", formData.amount);
    if (formData.category) dataToSubmit.append("category", formData.category);
    if (formData.notes) dataToSubmit.append("notes", formData.notes);
    if (formData.receipt) dataToSubmit.append("receipt", formData.receipt);

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
    setFormData({
      date: expense.date.split("T")[0],
      place: expense.place,
      category: expense.category || "",
      amount: expense.amount.toString(),
      notes: expense.notes || "",
      receipt: null,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingExpense(null);
    setFormData(initialFormData);
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
            setFormData(initialFormData);
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="date">Date</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Expense date</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={isMutating}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="place">Place/Vendor</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Where?</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="place"
                    placeholder="e.g., Walmart"
                    required
                    value={formData.place}
                    onChange={handleInputChange}
                    disabled={isMutating}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSelectChange}
                    disabled={isMutating}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Food">Food & Dining</SelectItem>
                      <SelectItem value="Transportation">
                        Transportation
                      </SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Entertainment">
                        Entertainment
                      </SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Amount spent</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    value={formData.amount}
                    onChange={handleInputChange}
                    disabled={isMutating}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">
                  Receipt (Optional {editingExpense ? "- Replace" : ""})
                </Label>
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  disabled={isMutating}
                />
                {editingExpense?.receiptUrl && !formData.receipt && (
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
                {formData.receipt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    New: {formData.receipt.name}
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
              Error loading expenses: {fetchError.message}
            </div>
          )}
          {isFetchingExpenses && !fetchError && expenses.length === 0 ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
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
