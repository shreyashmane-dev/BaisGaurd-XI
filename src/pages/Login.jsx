import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import AppIcon from "../components/AppIcon";
import { auth, googleProvider } from "../config/firebase";
import heroImg from "../assets/hero.png";

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      setLoading(true);
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login Error:", err.code, err.message);
      let friendlyMessage = "Failed to log in.";
      if (err.code === "auth/invalid-credential") {
        friendlyMessage = "Invalid email or password. Please try again.";
      } else if (err.code === "auth/user-not-found") {
        friendlyMessage = "No account found with this email.";
      } else if (err.code === "auth/wrong-password") {
        friendlyMessage = "Incorrect password.";
      } else if (err.code === "auth/too-many-requests") {
        friendlyMessage = "Too many failed attempts. Please try again later.";
      } else {
        friendlyMessage = err.message || friendlyMessage;
      }
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      await signInWithPopup(auth, googleProvider);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex antialiased">
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="Background" className="w-full h-full object-cover opacity-30 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/80 to-primary/20" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
            <AppIcon name="security" className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">BiasGuard X</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-6xl font-bold leading-tight mb-6 tracking-tight">
            Calculated <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Clarity.</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Interrogate your AI models with clinical precision. Detect hidden biases and establish an immutable record of algorithmic fairness.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
          <span>EU AI ACT COMPLIANT</span>
          <div className="h-1 w-1 rounded-full bg-white/20" />
          <span>ISO/IEC 42001 READY</span>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative bg-slate-900/50">
        <div className="w-full max-w-md bg-white/5 backdrop-blur-3xl rounded-[2rem] shadow-2xl border border-white/10 p-10 relative z-10">
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm">Sign in to your governance dashboard.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" htmlFor="email">Email</label>
                <div className="relative">
                  <AppIcon name="mail" className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                  <input
                    className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    id="email"
                    name="email"
                    placeholder="name@company.com"
                    type="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest" htmlFor="password">Password</label>
                  <a className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline" href="#">Forgot?</a>
                </div>
                <div className="relative">
                  <AppIcon name="lock" className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                  <input
                    className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    id="password"
                    name="password"
                    placeholder="Enter password"
                    type="password"
                    required
                  />
                </div>
              </div>
            </div>

            <button disabled={loading} className="w-full py-4 rounded-xl bg-primary text-on-primary font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50" type="submit">
              {loading ? "Verifying..." : "Sign In"}
              {!loading && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.25} />}
            </button>
          </form>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">OR</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <button onClick={handleGoogleSignIn} disabled={loading} className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex justify-center items-center gap-3 disabled:opacity-50" type="button">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-8 text-center text-sm text-slate-400">
            New to the platform?
            <Link className="text-primary font-bold hover:underline ml-2" to="/signup">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
