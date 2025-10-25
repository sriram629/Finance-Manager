import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { AuthBackground } from "../components/auth/AuthBackground";
import { GlassCard } from "../components/auth/GlassCard";
import { LoadingSpinner } from "../components/auth/LoadingSpinner";
import { OTPInput } from "../components/auth/OTPInput";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useToast } from "../hooks/use-toast";
import api from "@/api/axios";

type Step = "email" | "otp" | "password";

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });

      setLoading(false);
      toast({
        title: "OTP sent! 📧",
        description:
          response.data.message ||
          "Please check your email for the verification code",
      });
      setStep("otp");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Could not send OTP",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOTP = (otpValue: string) => {
    setOtp(otpValue);
    setStep("password");

    toast({
      title: "OTP captured! ✅",
      description: "Please set your new password",
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { newPassword, confirmPassword } = passwordData;
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please enter both password fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const hasMinLength = newPassword.length >= minLength;

    if (!(hasUppercase && hasNumber && hasSymbol && hasMinLength)) {
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
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/reset-password", {
        email: email,
        otp: otp,
        newPassword: newPassword,
      });

      setLoading(false);
      toast({
        title: "Password reset successful! 🎉",
        description:
          response.data.message || "You can now login with your new password",
      });
      navigate("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setLoading(false);
      toast({
        title: "Reset Failed",
        description: err.response?.data?.error || "Invalid OTP or other error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuthBackground />

      <GlassCard>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Back to login"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Forgot Password
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                {step === "email" && "Enter your email to receive an OTP"}
                {step === "otp" && "Enter the OTP sent to your email"}
                {step === "password" && "Set your new password"}
              </p>
            </div>
          </div>

          {step === "email" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-input/50 backdrop-blur-sm border-border/50"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <LoadingSpinner /> : "Send OTP"}
              </Button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === "otp" && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-center block">Enter 6-Digit OTP</Label>
                <OTPInput
                  length={6}
                  onComplete={handleVerifyOTP}
                  disabled={loading}
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    disabled={loading}
                    className="bg-input/50 backdrop-blur-sm border-border/50 pr-10"
                    autoComplete="new-password"
                    autoFocus
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
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    disabled={loading}
                    className="bg-input/50 backdrop-blur-sm border-border/50 pr-10"
                    autoComplete="new-password"
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
                {loading ? <LoadingSpinner /> : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card/40 px-2 text-muted-foreground backdrop-blur-sm">
                Remember password?
              </span>
            </div>
          </div>

          <p className="text-center text-sm">
            <Link to="/" className="text-primary hover:underline font-medium">
              Back to Login
            </Link>
          </p>
        </div>
      </GlassCard>
    </div>
  );
}
