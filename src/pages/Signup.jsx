import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import AppIcon from "../components/AppIcon";
import { auth } from "../config/firebase";
import { useApp } from "../context/AppContext";
import heroImg from "../assets/hero.png";

export default function Signup() {
  const navigate = useNavigate();
  const { completeRoleSelection } = useApp();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("analyst");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const fullName = formData.get("fullName");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    try {
      setLoading(true);
      setError("");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      await completeRoleSelection(selectedRole);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "analyst", label: "Analyst", icon: "monitoring" },
    { id: "auditor", label: "Auditor", icon: "gavel" },
    { id: "engineer", label: "Engineer", icon: "engineering" },
  ];

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
            Democratizing <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-tertiary">Fairness.</span>
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Join the global standard for AI governance. Establish trust through rigorous, multi-agent bias audits and real-time stress testing.
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
            <h2 className="text-3xl font-bold mb-2">Create Account</h2>
            <p className="text-slate-400 text-sm">Choose your operational role to begin auditing.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" htmlFor="fullName">Full Name</label>
                <input className="w-full px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="fullName" name="fullName" placeholder="John Doe" type="text" required />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" htmlFor="email">Work Email</label>
                <input className="w-full px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="email" name="email" placeholder="name@company.com" type="email" required />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operational Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {roles.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRole(r.id)}
                      className={`flex flex-col items-center gap-2 p-3 border rounded-xl transition-all ${selectedRole === r.id ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}
                    >
                      <AppIcon name={r.icon} className="h-5 w-5" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" htmlFor="password">Password</label>
                  <input className="w-full px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="password" name="password" placeholder="Create password" type="password" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2" htmlFor="confirmPassword">Confirm</label>
                  <input className="w-full px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder:text-slate-500 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" id="confirmPassword" name="confirmPassword" placeholder="Confirm password" type="password" required />
                </div>
              </div>
            </div>

            <button disabled={loading} className="w-full py-4 rounded-xl bg-primary text-on-primary font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5 active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50" type="submit">
              {loading ? "Initializing..." : "Create Identity"}
              {!loading && <ArrowRight className="h-[18px] w-[18px]" strokeWidth={2.25} />}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Already registered?
            <Link className="text-primary font-bold hover:underline ml-2" to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
