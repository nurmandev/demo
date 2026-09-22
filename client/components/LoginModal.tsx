import { useState } from "react";
import { ArrowRight, BrainCircuit, Eye, EyeOff, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { signIn, signUp } from "@/lib/auth-client";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "login" | "register";
}

export function LoginModal({
  open,
  onClose,
  onSuccess,
  initialMode = "login",
}: LoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError("");
  };

  const switchMode = (newMode: "login" | "register") => {
    resetForm();
    setMode(newMode);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      const msg = "Email is required.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      const msg = "Please enter a valid email address.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (!password) {
      const msg = "Password is required.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (mode === "register") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        const msg = "Name is required.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (password.length < 8) {
        const msg = "Password must be at least 8 characters long.";
        setError(msg);
        toast.error(msg);
        return;
      }
      if (password !== confirmPassword) {
        const msg = "Passwords do not match.";
        setError(msg);
        toast.error(msg);
        return;
      }

      setLoading(true);
      const toastId = toast.loading("Creating account...");
      try {
        const response = await signUp.email({
          name: trimmedName,
          email: trimmedEmail,
          password,
        });

        if (response.error) {
          const errorMsg = response.error.message || "Failed to create account.";
          setError(errorMsg);
          toast.error(errorMsg, { id: toastId });
        } else {
          toast.success("Account created successfully!", { id: toastId });
          handleClose();
          onSuccess?.();
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to register. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
      } finally {
        setLoading(false);
      }
    } else {
      // Login mode
      setLoading(true);
      const toastId = toast.loading("Signing in...");
      try {
        const response = await signIn.email({
          email: trimmedEmail,
          password,
        });

        if (response.error) {
          const errorMsg = response.error.message || "Invalid email or password.";
          setError(errorMsg);
          toast.error(errorMsg, { id: toastId });
        } else {
          toast.success("Welcome back!", { id: toastId });
          handleClose();
          onSuccess?.();
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unable to sign in right now. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg, { id: toastId });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="w-full max-w-sm gap-0 overflow-hidden rounded-3xl border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950"
        aria-describedby={undefined}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <span className="flex size-7 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <BrainCircuit className="size-3.5" />
            </span>
            <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
          </DialogTitle>
          <button
            onClick={handleClose}
            aria-label="Close dialog"
            className="flex size-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          {mode === "register" && (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                Get started
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Register to unlock your assistant workspace.
              </p>
            </>
          )}

          <form className="mt-5 space-y-3.5" onSubmit={handleSubmit} noValidate>
            {mode === "register" && (
              <div>
                <label htmlFor="modal-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  id="modal-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  className="mt-1.5 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            )}

            <div>
              <label htmlFor="modal-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                placeholder="you@example.com"
                autoComplete="email"
                className="mt-1.5 flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
              />
            </div>

            <div>
              <label htmlFor="modal-password" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="modal-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={loading}
                  placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"}
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {mode === "register" && (
              <div>
                <label
                  htmlFor="modal-confirm-password"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="modal-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={loading}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white pl-3 pr-10 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-2 h-10 w-full rounded-xl bg-slate-950 text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-blue-200"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "login" ? "Sign In" : "Register"}
                  <ArrowRight className="ml-1.5 size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-500">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
