/**
 * M9: Onboarding UI
 * Owner: Frontend Dev 1
 * Dependencies: onboardingAPI
 *
 * Multi-step wizard:
 * Step 1: Company name, logo, industry
 * Step 2: Admin registration
 * Step 3: Upload company documents (USP, Compliance, Policies, etc.)
 * Step 4: Trigger AI Training → initializes Curator + Reviewer skills
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { onboardingAPI, authAPI } from "../../services/api";
import { Building2, UserPlus, FileUp, Cpu, Check, ChevronRight } from "lucide-react";

const STEPS = [
  { label: "Company Info", icon: Building2 },
  { label: "Admin Account", icon: UserPlus },
  { label: "Upload Documents", icon: FileUp },
  { label: "AI Training", icon: Cpu },
];

const DOC_TYPES = [
  { value: "usp", label: "Unique Selling Proposition" },
  { value: "compliance", label: "Compliance Documents" },
  { value: "policy", label: "Company Policies" },
  { value: "marketing_goal", label: "Marketing Goals" },
  { value: "ethical_guideline", label: "Ethical Guidelines" },
  { value: "input", label: "Input Documents / Briefs" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Step 1 + 2 data
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    logo_url: "",
    admin_email: "",
    admin_password: "",
    admin_name: "",
  });

  // Step 3: uploaded docs
  const [docs, setDocs] = useState([]);
  const [docForm, setDocForm] = useState({ doc_type: "usp", title: "", content: "" });

  // Results
  const [companyId, setCompanyId] = useState(null);
  const [trainingDone, setTrainingDone] = useState(false);

  const updateForm = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // Step 1+2: Register company
  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await onboardingAPI.register(form);
      setCompanyId(res.company_id);

      // Auto-login as admin
      const loginRes = await authAPI.login(form.admin_email, form.admin_password);
      localStorage.setItem("token", loginRes.access_token);

      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Upload a document
  const handleUploadDoc = async () => {
    setLoading(true);
    try {
      const res = await onboardingAPI.uploadDocument(
        docForm.doc_type, docForm.title, docForm.content
      );
      setDocs((p) => [...p, res]);
      setDocForm({ doc_type: "usp", title: "", content: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Trigger training
  const handleTrain = async () => {
    setLoading(true);
    setError("");
    try {
      await onboardingAPI.triggerTraining();
      setTrainingDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  done ? "bg-green-500 text-white" : active ? "bg-indigo-500 text-white" : "bg-gray-700 text-gray-400"
                }`}>
                  {done ? <Check size={14} /> : <Icon size={14} />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <ChevronRight size={16} className="text-gray-600" />}
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>}

          {/* Step 1: Company Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
              <p className="text-sm text-gray-500">Set up your dashboard branding and company profile.</p>
              <input placeholder="Company Name *" value={form.company_name} onChange={(e) => updateForm("company_name", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input placeholder="Industry (e.g. FinTech, Healthcare)" value={form.industry} onChange={(e) => updateForm("industry", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input placeholder="Logo URL (optional)" value={form.logo_url} onChange={(e) => updateForm("logo_url", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button onClick={() => setStep(1)} disabled={!form.company_name}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium">
                Next: Admin Account
              </button>
            </div>
          )}

          {/* Step 2: Admin Account */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Admin Account</h2>
              <p className="text-sm text-gray-500">Register the primary admin user (required).</p>
              <input placeholder="Full Name *" value={form.admin_name} onChange={(e) => updateForm("admin_name", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input placeholder="Email *" type="email" value={form.admin_email} onChange={(e) => updateForm("admin_email", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input placeholder="Password *" type="password" value={form.admin_password} onChange={(e) => updateForm("admin_password", e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium">Back</button>
                <button onClick={handleRegister} disabled={loading || !form.admin_email || !form.admin_password}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium">
                  {loading ? "Registering..." : "Register & Continue"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Upload Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Upload Company Documents</h2>
              <p className="text-sm text-gray-500">Add your USP, compliance docs, policies, marketing goals, and ethical guidelines.</p>

              <select value={docForm.doc_type} onChange={(e) => setDocForm((p) => ({ ...p, doc_type: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input placeholder="Document Title *" value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <textarea placeholder="Document Content (paste text or leave empty for file upload)" rows={4}
                value={docForm.content} onChange={(e) => setDocForm((p) => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />

              <button onClick={handleUploadDoc} disabled={loading || !docForm.title}
                className="w-full bg-gray-800 text-white py-2.5 rounded-lg hover:bg-gray-900 transition disabled:opacity-50 font-medium">
                {loading ? "Uploading..." : "Add Document"}
              </button>

              {docs.length > 0 && (
                <div className="border border-gray-100 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{docs.length} document(s) uploaded:</p>
                  {docs.map((d, i) => (
                    <div key={i} className="text-sm text-gray-600 py-1">{d.title} ({d.doc_type})</div>
                  ))}
                </div>
              )}

              <button onClick={() => setStep(3)}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium">
                Next: Initialize AI Training
              </button>
            </div>
          )}

          {/* Step 4: AI Training */}
          {step === 3 && (
            <div className="space-y-4 text-center">
              <Cpu size={48} className="mx-auto text-indigo-600" />
              <h2 className="text-xl font-bold text-gray-900">AI Skill Initialization</h2>
              <p className="text-sm text-gray-500">
                This will read the Curator and Reviewer skill templates, fill them with your company data,
                and generate customized AI skills for your marketing pipeline.
              </p>

              {!trainingDone ? (
                <button onClick={handleTrain} disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium">
                  {loading ? "Training AI Skills..." : "Start Training"}
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2 justify-center">
                    <Check size={18} /> Curator and Reviewer skills initialized successfully!
                  </div>
                  <button onClick={() => navigate("/admin")}
                    className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 transition font-medium">
                    Go to Dashboard
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
