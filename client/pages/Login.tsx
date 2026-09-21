import { ArrowLeft, ArrowRight, BrainCircuit } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Login() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f7fb] px-2 py-2 text-slate-950 dark:bg-[#0d1117] dark:text-white sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-1rem)] max-w-6xl flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_24px_80px_-32px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-slate-950 sm:min-h-[calc(100vh-4rem)] sm:rounded-[28px]">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-slate-100 px-3 py-4 dark:border-slate-800 sm:px-8 sm:py-5">
          <Link to="/" className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-950 dark:hover:text-white sm:gap-2 sm:text-sm"><ArrowLeft className="size-4 shrink-0" /><span className="truncate">Back to assistant</span></Link>
          <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold sm:gap-2 sm:text-sm"><span className="flex size-7 items-center justify-center rounded-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950 sm:size-8 sm:rounded-xl"><BrainCircuit className="size-3.5 sm:size-4" /></span><span>Login</span></div>
        </header>
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 sm:py-12">
          <section className="mx-auto w-full max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600 sm:tracking-[0.18em]">Welcome back</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-4xl">Sign in to continue</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">Access your assistant workspace and keep your next action close.</p>
            <form className="mt-7 space-y-4 sm:mt-8" onSubmit={(event) => event.preventDefault()}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email<input type="email" placeholder="you@example.com" className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900" /></label>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password<input type="password" placeholder="Enter your password" className="mt-2 flex h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900" /></label>
              <Button type="submit" className="h-11 w-full rounded-xl bg-slate-950 text-white hover:bg-blue-700 dark:bg-white dark:text-slate-950">Continue <ArrowRight className="size-4" /></Button>
            </form>
            <p className="mt-4 text-center text-xs text-slate-400">Authentication connects when the identity service is configured.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
