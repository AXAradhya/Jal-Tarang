import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, ShieldCheck, ArrowRight, AlertCircle, CheckCircle2, Lock, Mail, Building2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';
import { SystemRole } from '../../types';

interface DemoPersona {
  name: string;
  role: SystemRole;
  roleTitle: string;
  department: string;
  email: string;
  description: string;
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    name: 'Aditya Sharma',
    role: 'CHARTERING_MANAGER',
    roleTitle: 'Chartering Manager',
    department: 'Shipping & Vessel Operations',
    email: 'aditya.sharma@sail.in',
    description: 'Fixture negotiations, Baltic indices tracking, Capesize/Panamax charters',
  },
  {
    name: 'Priya Mehta',
    role: 'PROCUREMENT_MANAGER',
    roleTitle: 'Procurement Director',
    department: 'Raw Materials & Coal Supply',
    email: 'priya.mehta@sail.in',
    description: 'Quarterly coal/iron-ore import planning, strategic reserves & supplier allocations',
  },
  {
    name: 'Rajesh Kumar',
    role: 'PORT_MANAGER',
    roleTitle: 'Port Logistics Officer',
    department: 'Paradip, Vizag & Haldia Ports',
    email: 'rajesh.kumar@sail.in',
    description: 'Berth allocation, port turnaround time, draft constraints & demurrage control',
  },
  {
    name: 'Meera Sen',
    role: 'ANALYST',
    roleTitle: 'Market Analyst',
    department: 'Maritime Econometrics & FFA Intelligence',
    email: 'analyst@sail.in',
    description: 'Bi-LSTM freight curves, Baltic FFA forward curves, and macroeconomic sensitivity modeling',
  },
  {
    name: 'Sanjay Verma',
    role: 'SUPER_ADMIN',
    roleTitle: 'Super Administrator',
    department: 'Ministry of Steel / SAIL HQ',
    email: 'admin@sail.in',
    description: 'Full system authorization, audit trails, user RBAC & job monitors',
  },
];

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('aditya.sharma@sail.in');
  const [password, setPassword] = useState('sail2026');
  const [selectedPersona, setSelectedPersona] = useState<DemoPersona>(DEMO_PERSONAS[0]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSelectPersona = (persona: DemoPersona) => {
    setSelectedPersona(persona);
    setEmail(persona.email);
    setPassword('sail2026');
    setErrorMessage('');
  };

  const handleLoginSubmit = async (e?: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    const loginEmail = (customEmail || email).trim();
    const loginPassword = customPassword !== undefined ? customPassword : password;

    if (!loginEmail) {
      setErrorMessage('Please enter an official SAIL email address.');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your security password / PIN.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await authApi.login({
        email: loginEmail,
        password: loginPassword,
      });

      if (response && response.accessToken) {
        setSuccessMessage(`Authenticated as ${response.user.displayName || response.user.firstName}. Initializing session…`);
        login(response.user, response.accessToken, response.refreshToken);
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 500);
      } else {
        throw new Error('No access token received from authentication gateway.');
      }
    } catch (err: any) {
      console.error('[Login Error]', err);
      const apiErr = err.response?.data?.error?.message || err.message || 'Authentication failed. Please verify credentials.';
      setErrorMessage(apiErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-100">
      {/* Top Ministry Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900 dark:text-white">Government of India</span>
          <span>·</span>
          <span>Ministry of Steel</span>
          <span>·</span>
          <span className="text-blue-700 dark:text-sky-400 font-medium">SIH Problem Statement 26006</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Security Gateway Online
          </span>
          <span className="hidden sm:inline text-slate-400">ISO 27001 / CERT-In Aligned</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Side: System Information & Institutional Credibility */}
          <div className="lg:col-span-6 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-full text-blue-700 dark:text-sky-300 text-xs font-semibold">
              <Building2 size={13} />
              <span>Steel Authority of India Limited</span>
            </div>

            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <span>JAL TARANG</span>
                <span className="text-xl sm:text-2xl font-normal text-blue-600 dark:text-sky-400 font-serif">(जल तरंग)</span>
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                Enterprise Logistics Intelligence, Maritime Freight Forecasting & Bulk Cargo Procurement Control Platform.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xl font-bold text-blue-700 dark:text-sky-400">14.2M MT</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Annual Coal & Ore Imports</div>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹84.2 Cr <span className="text-sm font-semibold text-emerald-700/80 dark:text-emerald-300">($8.8M)</span></div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Projected Annual Savings</div>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Real-time Baltic Exchange (BDI, BCI, BPI) & Index Feeds</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Automated Demurrage & Port Congestion Risk Modeling</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                <span>Role-Based Operational Access Control (RBAC)</span>
              </div>
            </div>
          </div>

          {/* Right Side: Login Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-7">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Operations Portal Sign In
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Secure JWT authentication & role-based clearance
                  </p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-sky-400">
                  <ShieldCheck size={20} />
                </div>
              </div>

              {/* Alert Messages */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5 text-emerald-600" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={(e) => handleLoginSubmit(e)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email ID
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="username@sail.in"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Security Password / PIN
                    </label>
                    <span className="text-[11px] text-slate-400">Demo: <code className="text-blue-600 font-mono">sail2026</code></span>
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying with SAIL Gateway…
                    </span>
                  ) : (
                    <>
                      <span>Sign In to Platform</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Persona Selector for Evaluation */}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Operational Personas (1-Click Fill & Sign In)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {DEMO_PERSONAS.map((persona) => {
                    const isSelected = selectedPersona.email === persona.email;
                    return (
                      <button
                        key={persona.email}
                        type="button"
                        onClick={() => {
                          handleSelectPersona(persona);
                          handleLoginSubmit(undefined, persona.email, 'sail2026');
                        }}
                        className={`text-left p-2 rounded-lg border text-xs transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-sky-200 font-medium shadow-xs'
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {persona.roleTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {persona.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          Official Information Technology System · Steel Authority of India Limited · Ministry of Steel, New Delhi.
          Unauthorized access is strictly prohibited under the IT Act 2000.
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
