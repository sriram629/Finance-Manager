import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/auth/LoadingSpinner";
import api from "@/api/axios";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const code = new URLSearchParams(window.location.hash.slice(1)).get("code");
    window.history.replaceState(null, "", window.location.pathname);
    const verifier = sessionStorage.getItem("oauthVerifier");
    sessionStorage.removeItem("oauthVerifier");
    if (!code || !verifier) { navigate("/login", { replace: true }); return; }
    api.post("/auth/exchange", { code, verifier }).then(({ data }) => {
      login(data.user, data.token);
      toast({ title: "Successfully logged in!" });
    }).catch(() => {
      toast({ title: "Login expired", description: "Please sign in again.", variant: "destructive" });
      navigate("/login", { replace: true });
    });
  }, [navigate, login, toast]);
  return <div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>;
}
