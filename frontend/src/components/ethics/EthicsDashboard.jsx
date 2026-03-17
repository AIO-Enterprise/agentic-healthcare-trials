/**
 * M13: Ethics Reviewer Dashboard
 * Owner: Frontend Dev 3
 * Dependencies: adsAPI, documentsAPI
 *
 * Ethical analysis of strategies, request strategy redesign,
 * update ethical reference documents and compliance docs.
 */

import React, { useState, useEffect } from "react";
import { DashboardLayout, Card, StatCard, StatusBadge } from "../shared/Layout";
import { adsAPI, documentsAPI } from "../../services/api";
import { Shield, FileText, AlertTriangle, CheckCircle, RotateCcw } from "lucide-react";

export default function EthicsDashboard() {
  const [ads, setAds] = useState([]);
  const [docs, setDocs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("review"); // "review" | "documents"
  const [reviewForm, setReviewForm] = useState({ comments: "" });

  useEffect(() => {
    adsAPI.list().then(setAds).catch(console.error);
    documentsAPI.list("ethical_guideline").then(setDocs).catch(console.error);
  }, []);

  const pendingEthics = ads.filter((a) => ["under_review", "ethics_review", "approved"].includes(a.status));

  const handleEthicsReview = async (status) => {
    if (!selected) return;
    try {
      await adsAPI.createReview(selected.id, {
        review_type: "ethics",
        status,
        comments: reviewForm.comments,
      });
      setSelected(null);
      setReviewForm({ comments: "" });
      // Refresh
      adsAPI.list().then(setAds);
    } catch (err) { alert(err.message); }
  };

  // Document form
  const [docForm, setDocForm] = useState({ title: "", content: "" });
  const handleAddDoc = async () => {
    try {
      const doc = await documentsAPI.create({ doc_type: "ethical_guideline", title: docForm.title, content: docForm.content });
      setDocs((p) => [...p, doc]);
      setDocForm({ title: "", content: "" });
    } catch (err) { alert(err.message); }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Ethics Reviewer Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Ensure marketing strategies meet ethical and compliance standards</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Campaigns to Review" value={pendingEthics.length} icon={Shield} />
        <StatCard label="Ethical Guidelines" value={docs.length} icon={FileText} />
        <StatCard label="Flags Raised" value={ads.filter((a) => a.status === "ethics_review").length} icon={AlertTriangle} />
      </div>

      {/* Tab navigation */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("review")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === "review" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Ethics Review
        </button>
        <button onClick={() => setTab("documents")}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === "documents" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
          Document Updation
        </button>
      </div>

      {tab === "review" && (
        <div className="grid grid-cols-2 gap-6">
          <Card title="Campaigns" subtitle="Select a campaign for ethical review">
            <div className="space-y-3">
              {pendingEthics.map((ad) => (
                <button key={ad.id} onClick={() => setSelected(ad)}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    selected?.id === ad.id ? "border-purple-500 bg-purple-50" : "border-gray-100 hover:border-gray-200"
                  }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                    <StatusBadge status={ad.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{ad.ad_type}</p>
                </button>
              ))}
            </div>
          </Card>

          {selected ? (
            <Card title={`Ethics Analysis: ${selected.title}`}>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selected.strategy_json, null, 2) || "No strategy"}
                  </pre>
                </div>
                <textarea value={reviewForm.comments} onChange={(e) => setReviewForm({ comments: e.target.value })}
                  rows={4} placeholder="Ethical considerations, compliance issues, concerns..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => handleEthicsReview("approved")}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => handleEthicsReview("rejected")}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition text-sm font-medium">
                    <RotateCcw size={16} /> Redesign Strategy
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-gray-400">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a campaign for ethical analysis</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="space-y-6">
          <Card title="Add Ethical Guideline">
            <div className="space-y-4">
              <input placeholder="Document Title" value={docForm.title} onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              <textarea placeholder="Content — compliance notes, ethical review info, internal goals..." rows={4}
                value={docForm.content} onChange={(e) => setDocForm((p) => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none" />
              <button onClick={handleAddDoc} disabled={!docForm.title}
                className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm font-medium">
                Save Document
              </button>
            </div>
          </Card>

          <Card title={`Existing Guidelines (${docs.length})`}>
            {docs.map((doc) => (
              <div key={doc.id} className="py-3 border-b border-gray-50 last:border-0">
                <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.content}</p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
