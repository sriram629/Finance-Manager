import api from "@/api/axios";

export async function startSocialLogin(provider: "google" | "github") {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, "0")).join("");
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  const challenge = Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, "0")).join("");
  sessionStorage.setItem("oauthVerifier", verifier);
  window.location.assign(`${api.defaults.baseURL}/auth/${provider}?challenge=${challenge}`);
}
