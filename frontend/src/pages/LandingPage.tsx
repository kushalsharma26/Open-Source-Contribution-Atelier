import { useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { GitBranch, Moon, Sun, Sparkles, Shield, Zap, Users } from "lucide-react";
import { fetchApi } from "../lib/api";
import { useAuth } from "../features/auth/AuthContext";
import { useTheme } from "../hooks/useTheme";
import OrganizationsGrid from "../components/OrganizationsGrid";

const getEnvVar = (key: string): string => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return "";
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

const features = [
  { icon: Zap, title: "Learn by Doing", desc: "Real open source contributions with guided mentorship" },
  { icon: Shield, title: "Verified Projects", desc: "Curated issues from trusted open source organizations" },
  { icon: Users, title: "Community Driven", desc: "Join thousands of developers building real software" },
];

export function LandingPage() {
  let login: (tokens: { access: string; refresh: string }) => void = () => {};
  try {
    const auth = useAuth();
    login = auth.login;
  } catch {}

  const { theme, toggleTheme } = useTheme();
  const [authRole, setAuthRole] = useState<"student" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authError = new URLSearchParams(window.location.search).get("auth_error");
      if (authError) {
        setError(authError);
        window.history.replaceState({}, "", window.location.pathname);
      }
      const baseGithub =
        getEnvVar("VITE_GITHUB_OAUTH_URL") ||
        `${getEnvVar("VITE_API_BASE_URL") || "http://localhost:8000/api"}/auth/github/`;
      setGithubUrl(baseGithub);
    }
  }, []);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const tokens = await fetchApi("/auth/login/", {
        method: "POST",
        requireAuth: false,
        body: JSON.stringify({ username: email, password }),
      });
      login(tokens);
      if (typeof window !== "undefined") window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Login failed. Check your credentials."));
    }
  };

  const handleGithubSignIn = () => {
    if (typeof window !== "undefined" && githubUrl) window.location.href = githubUrl;
  };

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const tokens = await fetchApi("/auth/google/", {
          method: "POST",
          requireAuth: false,
          body: JSON.stringify({ access_token: tokenResponse.access_token }),
        });
        login(tokens);
        if (typeof window !== "undefined") window.location.href = "/dashboard";
      } catch {
        setError("Google authentication failed. Please try again.");
      }
    },
    onError: () => setError("Google login failed"),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-[#0a0a0f] dark:via-[#0d0d14] dark:to-[#0a0a1a]">
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 rounded-xl bg-white/80 dark:bg-[#1a1a2e]/80 backdrop-blur-sm p-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
      >
        {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
      </button>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent dark:via-blue-500/5 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-6 border border-blue-100 dark:border-blue-500/20">
              <Sparkles size={14} />
              Open Source Contribution Platform
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Start Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Open Source
              </span>{" "}
              Journey
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Make your first contribution with confidence. Find beginner-friendly issues,
              get guided support, and build your open source portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
            <div className="bg-white dark:bg-[#12121a] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8">
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                <button
                  onClick={() => setAuthRole("student")}
                  className={`flex-1 py-2.5 font-bold rounded-lg transition-all text-sm ${
                    authRole === "student"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Contributor
                </button>
                <button
                  onClick={() => setAuthRole("admin")}
                  className={`flex-1 py-2.5 font-bold rounded-lg transition-all text-sm ${
                    authRole === "admin"
                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  Maintainer
                </button>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 text-center">
                {authRole === "student"
                  ? "Welcome Back"
                  : "Maintainer Login"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 text-sm font-medium rounded-xl border border-red-100 dark:border-red-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => googleLoginHandler()}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 py-3.5 flex items-center justify-center gap-3 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>

                <button
                  type="button"
                  onClick={handleGithubSignIn}
                  className="w-full rounded-xl bg-slate-900 dark:bg-white px-4 py-3.5 flex items-center justify-center gap-3 font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm hover:shadow-md active:scale-[0.99]"
                >
                  <GitBranch size={20} />
                  Continue with GitHub
                </button>
              </div>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">or</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              </div>

              <form onSubmit={handleStandardLogin} className="space-y-4">
                <div>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 py-3.5 text-slate-900 dark:text-white font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="Email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 py-3.5 text-slate-900 dark:text-white font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3.5 font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
                >
                  Sign In
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                New here?{" "}
                <a href="/signup" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
                  Create an account
                </a>
              </p>
            </div>

            <div className="flex flex-col justify-center space-y-6">
              {features.map((feature, i) => (
                <div key={i} className="bg-white/80 dark:bg-[#12121a]/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                      <feature.icon size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white mb-1">{feature.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/60 dark:bg-[#12121a]/60 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-8">
              How It Works
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: "01", icon: "🔐", title: "Sign In", desc: "Use your GitHub or Google account" },
                { num: "02", icon: "🔍", title: "Find an Issue", desc: "Browse beginner-friendly issues" },
                { num: "03", icon: "💻", title: "Contribute", desc: "Submit your first pull request" },
                { num: "04", icon: "📈", title: "Learn & Grow", desc: "Get feedback and earn recognition" },
              ].map((step, i) => (
                <div key={i} className="text-center p-6 rounded-xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all">
                  <div className="text-3xl mb-3">{step.icon}</div>
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">{step.num}</div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12">
            <OrganizationsGrid />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
