import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import AppIcon from "../components/AppIcon";
import heroImg from "../assets/hero.png";

export default function Landing() {
  // Smooth scroll behavior
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-body-main selection:bg-primary/30 overflow-x-hidden">
      {/* Dynamic Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-tertiary/10 blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#020617]/60 backdrop-blur-2xl border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
              <AppIcon name="security" className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">BiasGuard X</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
            <a href="#features" className="hover:text-primary transition-colors hover:translate-y-[-1px] active:translate-y-0">Features</a>
            <a href="#solutions" className="hover:text-primary transition-colors hover:translate-y-[-1px] active:translate-y-0">Solutions</a>
            <a href="#enterprise" className="hover:text-primary transition-colors hover:translate-y-[-1px] active:translate-y-0">Enterprise</a>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/login" className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors hidden sm:block">Login</Link>
            <Link to="/signup" className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all">
              Initialize Audit
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 lg:pt-52 lg:pb-32 z-10">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v4.2 Interrogation Engine Live
            </div>
            
            <h1 className="text-6xl lg:text-8xl font-display-lg font-bold leading-[1.05] mb-8 tracking-tight">
              Algorithmic <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-container to-tertiary">Neutrality</span> <br />
              at Scale.
            </h1>
            
            <p className="text-xl text-slate-400 mb-12 leading-relaxed max-w-xl font-medium opacity-90">
              Identify, interrogate, and mitigate mathematical bias. 
              BiasGuard X provides the clinical-grade clarity needed to ensure 
              cross-demographic fairness and regulatory safety.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/signup" className="px-10 py-5 bg-primary text-on-primary rounded-2xl font-bold uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/40 hover:shadow-primary/60 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 group">
                Get Started
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" strokeWidth={2.25} />
              </Link>
              <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold uppercase tracking-widest text-[11px] hover:bg-white/10 hover:border-white/20 transition-all backdrop-blur-lg">
                View Documentation
              </button>
            </div>
            
            <div className="mt-16 flex items-center gap-10 border-t border-white/5 pt-10">
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter text-white">12.8k</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mt-1">Models Audited</span>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-tighter text-white">99.9%</span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mt-1">Audit Reliability</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative group perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-tertiary rounded-[3rem] blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>
            <div className="relative bg-slate-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl transform-gpu transition-all duration-700 group-hover:rotate-y-3 group-hover:rotate-x-2">
              <img 
                src={heroImg} 
                alt="BiasGuard Neural Visualization" 
                className="w-full aspect-[4/5] lg:aspect-square object-cover opacity-80" 
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1639322537228-f710d846310a?auto=format&fit=crop&q=80&w=1000";
                  e.target.className = "w-full aspect-square object-cover opacity-40 mix-blend-overlay";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent"></div>
              
              {/* Animated Floating Card */}
              <div className="absolute bottom-10 left-10 right-10 bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-2xl animate-float">
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Active Neural Scan</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Layer 128</span>
                </div>
                <div className="space-y-4">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-[88%] bg-gradient-to-r from-primary to-primary-container shadow-[0_0_15px_rgba(79,55,138,0.6)] animate-pulse"></div>
                  </div>
                  <div className="h-2 w-[65%] bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-tertiary/60"></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-8 flex-1 bg-white/5 rounded-lg border border-white/5" />
                    <div className="h-8 flex-1 bg-white/5 rounded-lg border border-white/5" />
                    <div className="h-8 w-12 bg-primary/20 rounded-lg border border-primary/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center mb-24">
          <h2 className="text-5xl font-display-lg font-bold mb-6 tracking-tight">Engineered for Trust</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg font-medium opacity-80 leading-relaxed">
            Standard evaluations only scratch the surface. BiasGuard X implements a multi-layered interrogation architecture to detect deep systemic flaws.
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-10">
          {[
            { icon: "psychology_alt", title: "Neural Interrogation", desc: "Our AI agents stress-test model decisions using millions of counterfactual permutations." },
            { icon: "account_tree", title: "FairTwin Diagnostics", desc: "Isolate bias by comparing virtual 'twins' across identical financial and professional vectors." },
            { icon: "verified_user", title: "Regulatory Readiness", desc: "Automated compliance reports for EU AI Act, NIST RMF, and global algorithmic governance standards." }
          ].map((f, i) => (
            <div key={i} className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] hover:bg-white/[0.08] hover:border-white/20 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                 <AppIcon name={f.icon} className="h-[100px] w-[100px]" />
              </div>
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <AppIcon name={f.icon} className="h-9 w-9" />
              </div>
              <h3 className="text-2xl font-bold mb-5 tracking-tight">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed font-medium opacity-80">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-[#020617] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <AppIcon name="security" className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold tracking-tighter">BiasGuard X</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">Protecting algorithmic integrity since 2024.</p>
          </div>
          
          <div className="flex flex-col md:items-end gap-6">
            <div className="flex items-center gap-10 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Governance API</a>
            </div>
            <p className="text-[11px] text-slate-600 font-black uppercase tracking-[0.3em]">© 2026 XI TRUSTOPS CORP.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
