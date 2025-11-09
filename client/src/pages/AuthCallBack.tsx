import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import api from "@/api/axios";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Token found! Fetch user details and log them in.
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      api
        .get("/user/profile")
        .then((res) => {
          if (res.data.success) {
            login(res.data.user, token);
            toast({ title: "Successfully logged in!" });
          } else {
            throw new Error("Failed to load user profile");
          }
        })
        .catch((err) => {
          console.error("Social login error:", err);
          toast({
            title: "Login Failed",
            description: "Could not verify social login.",
            variant: "destructive",
          });
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, login, toast]);

  return (
    <div className="h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}
