import { useState } from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { signUp } from "@/lib/auth-client";

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await signUp.email({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      if (response.error) {
        const errorMsg = response.error.message || "Failed to create account.";
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to register. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] px-2 py-2 text-slate-950 dark:bg-[#0d1117] dark:text-white sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-6xl flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950 sm:min-h-[calc(100vh-4rem)] sm:rounded-[28px]">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-3 py-4 dark:border-slate-800 sm:px-8 sm:py-5">
          <Link
            to="/"
            className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-950 dark:hover:text-white sm:gap-2 sm:text-sm"
          >
            <ArrowLeft className="size-4 shrink-0" />
            <span className="truncate">Back to assistant</span>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold sm:gap-2 sm:text-sm">
            <span className="flex size-7 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950 sm:size-8 sm:rounded-xl">
              <BrainCircuit className="size-3.5 sm:size-4" />
            </span>
            <span>Register</span>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
          <section className="mx-auto w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 sm:tracking-[0.18em]">
              Get Started
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">Create an account</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Join to access your personalized assistant workspace.
            </p>

            <form className="mt-7 space-y-4 sm:mt-8" onSubmit={handleSubmit} noValidate>
              <div>
                <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="register-confirm-password"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Password
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-slate-950 text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  <>
                    Register <ArrowRight className="ml-1.5 size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-500">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
