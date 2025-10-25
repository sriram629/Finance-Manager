import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AuthBackground } from "../components/auth/AuthBackground";
import { GlassCard } from "../components/auth/GlassCard";
import { OTPInput } from "../components/auth/OTPInput";
import { LoadingSpinner } from "../components/auth/LoadingSpinner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import api from "@/api/axios";

export default function Register() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [otpError, setOtpError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.password
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
    const hasMinLength = formData.password.length >= minLength;

    if (hasUppercase && hasNumber && hasSymbol && hasMinLength) {
      // All checks passed, continue to the API call
    } else {
      const errors = [];
      if (!hasMinLength) {
        errors.push(`be at least ${minLength} characters`);
      }
      if (!hasUppercase) {
        errors.push("contain an uppercase letter");
      }
      if (!hasNumber) {
        errors.push("contain a number");
      }
      if (!hasSymbol) {
        errors.push("contain a special character");
      }
      toast({
        title: "Weak Password",
        description: `Password must: ${errors.join(", ")}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { firstName, lastName, email, password } = formData;
      const response = await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        password,
      });
      setLoading(false);
      setStep("otp");
      toast({
        title: "Check your email",
        description:
          response.data.message ||
          "We've sent a 6-digit verification code to your email",
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Registration Failed",
        description:
          err.response?.data?.error || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setOtpError("");

    try {
      const response = await api.post("/auth/verify-otp", {
        email: formData.email,
        otp: otp,
      });

      setLoading(false);
      toast({
        title: "Registration Successful! 🎉",
        description: response.data.message || "Redirecting to login...",
      });

      setTimeout(() => {
        navigate("/login");
      }, 2000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setLoading(false);
      const errorMsg =
        err.response?.data?.error || "An unexpected error occurred";
      setOtpError(errorMsg);
      toast({
        title: "Verification Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthBackground />

      <GlassCard>
        {step === "form" ? (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Join us to manage your finances
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    disabled={loading}
                    className="bg-input/50 backdrop-blur-sm border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    disabled={loading}
                    className="bg-input/50 backdrop-blur-sm border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  disabled={loading}
                  className="bg-input/50 backdrop-blur-sm border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    disabled={loading}
                    className="bg-input/50 backdrop-blur-sm border-border/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    disabled={loading}
                    className="bg-input/50 backdrop-blur-sm border-border/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <LoadingSpinner /> : "Create Account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Verify Email
              </h1>
              <p className="text-muted-foreground">
                Enter the 6-digit code sent to
                <br />
                <span className="font-medium text-foreground">
                  {formData.email}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <OTPInput onComplete={handleOTPComplete} disabled={loading} />

              {otpError && (
                <p className="text-sm text-destructive text-center">
                  {otpError}
                </p>
              )}

              {loading && (
                <div className="flex justify-center">
                  <LoadingSpinner />
                </div>
              )}
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  toast({
                    title: "Code resent",
                    description: "Check your email for a new code",
                  });
                }}
                className="text-sm text-primary hover:underline"
              >
                Didn't receive code? Resend
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
