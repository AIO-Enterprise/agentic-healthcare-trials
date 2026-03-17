/**
 * M12: Reviewer Dashboard
 * Owner: Frontend Dev 3
 * Dependencies: adsAPI, analyticsAPI
 *
 * Review marketing strategies, edit plans, adjust budgets,
 * add protocol docs, and send suggestions back to AI.
 */

import React, { useState, useEffect } from "react";
import { DashboardLayout, Card, StatCard, StatusBadge } from "../shared/Layout";
import { adsAPI, analyticsAPI } from "../../services/api";
import { Eye, CheckCircle, XCircle, MessageSquare, BarChart3 } from "lucide-react";

export default function ReviewerDashboard() {
  const [ads, setAds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviewForm, setReviewForm] = useState({ comments: "", status: "approved" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adsAPI.list().then(setAds).catch(console.error).finally(() => setLoading(false));
  }, []);

  const reviewable = ads.filter((a) => ["under_review", "strategy_created"].includes(a.status));
  const reviewed = ads.filter((a) => ["approved", "published"].includes(a.status));

  const handleSubmitReview = async () => {
    if (!selected) return;
    try {
      await adsAPI.createReview(selected.id, {
        review_type: "strategy",
        status: reviewForm.status,
        comments: reviewForm.comments,
      });
      setAds((prev) => prev.map((a) =>
        a.id === selected.id ? { ...a, status: reviewForm.status === "approved" ? "approved" : "under_review" } : a
      ));
      setSelected(null);
      setReviewForm({ comments: "", status: "approved" });
    } catch (err) { alert(err.message); }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reviewer Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Review and approve marketing strategies</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Pending Review" value={reviewable.length} icon={Eye} />
        <StatCard label="Approved" value={reviewed.length} icon={CheckCircle} />
        <StatCard label="Total Campaigns" value={ads.length} icon={BarChart3} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Review Queue */}
        <Card title="Review Queue" subtitle={`${reviewable.length} campaigns awaiting review`}>
          {reviewable.length === 0 ? (
            <p className="text-sm text-gray-400">No campaigns pending review</p>
          ) : (
            <div className="space-y-3">
              {reviewable.map((ad) => (
                <button key={ad.id} onClick={() => setSelected(ad)}
                  className={`w-full text-left p-4 rounded-lg border transition ${
                    selected?.id === ad.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"
                  }`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                    <StatusBadge status={ad.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{ad.ad_type} · Budget: ${ad.budget || "N/A"}</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Review Panel */}
        <div>
          {selected ? (
            <Card title={`Reviewing: ${selected.title}`}>
              <div className="space-y-4">
                {/* Strategy Preview */}
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-auto">
                  <p className="text-xs font-medium text-gray-500 mb-2">AI Generated Strategy</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selected.strategy_json, null, 2) || "No strategy generated yet"}
                  </pre>
                </div>

                {/* Budget & Platforms */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Budget</p>
                    <p className="text-sm font-semibold">${selected.budget || "Not set"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Platforms</p>
                    <p className="text-sm font-semibold">{selected.platforms?.join(", ") || "None"}</p>
                  </div>
                </div>

                {/* Review Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
                  <textarea value={reviewForm.comments} onChange={(e) => setReviewForm((p) => ({ ...p, comments: e.target.value }))}
                    rows={4} placeholder="Comments, suggestions, budget adjustments..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setReviewForm((p) => ({ ...p, status: "approved" })); handleSubmitReview(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium">
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button onClick={() => { setReviewForm((p) => ({ ...p, status: "revision" })); handleSubmitReview(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 text-white py-2.5 rounded-lg hover:bg-yellow-600 transition text-sm font-medium">
                    <MessageSquare size={16} /> Request Revision
                  </button>
                  <button onClick={() => { setReviewForm((p) => ({ ...p, status: "rejected" })); handleSubmitReview(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition text-sm font-medium">
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-gray-400">
                <Eye size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a campaign from the queue to review</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
