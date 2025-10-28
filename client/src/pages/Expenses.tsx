/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
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

export default function Expenses() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<ExpenseFormData>(initialFormData);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      setFetching(true);
      try {
        const response = await api.get("/expenses");
        if (response.data.success) {
          setExpenses(response.data.expenses || []);
        } else {
          setExpenses([]);
          toast({
            title: "Error",
            description: response.data.error || "Could not fetch expenses.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
        toast({
          title: "Error",
          description: "Could not fetch expenses.",
          variant: "destructive",
        });
        setExpenses([]);
      } finally {
        setFetching(false);
      }
    };
    fetchExpenses();
  }, [toast]);

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
    setLoading(true);

    const dataToSubmit = new FormData();
    dataToSubmit.append("date", formData.date);
    dataToSubmit.append("place", formData.place);
    dataToSubmit.append("amount", formData.amount);
    if (formData.category) dataToSubmit.append("category", formData.category);
    if (formData.notes) dataToSubmit.append("notes", formData.notes);
    if (formData.receipt) dataToSubmit.append("receipt", formData.receipt);

    try {
      let response: AxiosResponse<any>;
      if (editingExpense) {
        response = await api.put(
          `/expenses/${editingExpense._id}`,
          dataToSubmit,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (response.data.success) {
          toast({
            title: "Expense Updated",
            description: "Expense saved successfully.",
          });
          setExpenses((prev) =>
            prev.map((exp) =>
              exp._id === editingExpense._id ? response.data.expense : exp
            )
          );
        }
      } else {
        response = await api.post("/expenses", dataToSubmit, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (response.data.success) {
          toast({
            title: "Expense Added",
            description: "Expense recorded successfully.",
          });
          setExpenses((prev) => [response.data.expense, ...prev]);
        }
      }

      if (response.data.success) {
        setEditingExpense(null);
        setShowForm(false);
        setFormData(initialFormData);
      } else {
        // If API returns success: false, show the error
        const action = editingExpense ? "Update" : "Add";
        toast({
          title: `Failed to ${action} Expense`,
          description: response.data.error || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (err) {
      const error = err as AxiosError<any>; // Type assertion
      const action = editingExpense ? "Update" : "Add";
      toast({
        title: `Failed to ${action} Expense`,
        description:
          error.response?.data?.error || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const originalExpenses = [...expenses];
    setExpenses((prev) => prev.filter((exp) => exp._id !== id));

    try {
      const response = await api.delete(`/expenses/${id}`);
      if (!response.data.success) {
        setExpenses(originalExpenses);
        toast({
          title: "Delete Failed",
          description: response.data.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Expense Deleted",
          description: "The expense has been removed.",
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      setExpenses(originalExpenses);
      toast({
        title: "Delete Failed",
        description:
          axiosError.response?.data?.error || "Could not delete expense.",
        variant: "destructive",
      });
      console.error("Delete error:", error);
    }
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
            setShowForm(!showForm); // Toggle form visibility
          }}
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
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={handleSelectChange}
                    disabled={loading}
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
                    disabled={loading}
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
                  disabled={loading}
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
                <Button type="submit" disabled={loading}>
                  {loading ? (
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
                  disabled={loading}
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
          {fetching ? (
            <LoadingSpinner />
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No expenses recorded yet.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
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
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(expense._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
