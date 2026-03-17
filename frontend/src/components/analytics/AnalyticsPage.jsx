/**
 * M15: Analytics Component
 * Owner: Frontend Dev 4
 * Dependencies: analyticsAPI, recharts
 *
 * Reusable analytics view used by Admin, Reviewer, and Publisher dashboards.
 * Displays performance charts and optimizer history.
 */

import React, { useState, useEffect } from "react";
import { DashboardLayout, Card, StatCard } from "../shared/Layout";
import { adsAPI, analyticsAPI } from "../../services/api";
import { BarChart3, TrendingUp, Eye, MousePointer } from "lucide-react";

export default function AnalyticsPage() {
  const [ads, setAds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adsAPI.list("published").then((data) => {
      setAds(data);
      if (data.length > 0) selectAd(data[0]);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const selectAd = async (ad) => {
    setSelected(ad);
    try {
      const data = await analyticsAPI.get(ad.id);
      setAnalytics(data);
    } catch { setAnalytics([]); }
  };

  // Compute summary from analytics
  const avgMetric = (key) => {
    const vals = analytics.map((a) => a[key]).filter(Boolean);
    return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) : "—";
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Campaign Analytics</h1>
      <p className="text-sm text-gray-500 mb-8">Performance metrics for published campaigns</p>

      {/* Campaign selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {ads.map((ad) => (
          <button key={ad.id} onClick={() => selectAd(ad)}
            className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition ${
              selected?.id === ad.id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {ad.title}
          </button>
        ))}
      </div>

      {selected ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Click Rate" value={`${avgMetric("click_rate")}%`} icon={MousePointer} />
            <StatCard label="Views" value={avgMetric("views")} icon={Eye} />
            <StatCard label="Conversions" value={avgMetric("conversions")} icon={TrendingUp} />
            <StatCard label="Retention" value={`${avgMetric("user_retention")}%`} icon={BarChart3} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <Card title="Performance Over Time">
              {analytics.length === 0 ? (
                <p className="text-sm text-gray-400">No analytics data recorded yet. Data will appear here once the campaign starts receiving traffic.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.slice(0, 10).map((a, i) => (
                    <div key={a.id} className="flex items-center justify-between py-2 text-sm border-b border-gray-50">
                      <span className="text-gray-500 text-xs">{new Date(a.recorded_at).toLocaleDateString()}</span>
                      <span className="text-gray-700">CTR: {a.click_rate || "—"}%</span>
                      <span className="text-gray-700">Views: {a.views || "—"}</span>
                      <span className="text-gray-700">Conv: {a.conversions || "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card title="Demographics Breakdown">
              {analytics.length === 0 ? (
                <p className="text-sm text-gray-400">No demographics data yet</p>
              ) : (
                <div className="space-y-2">
                  {analytics.filter((a) => a.demographics).slice(0, 5).map((a, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-3">
                      <pre className="text-xs text-gray-700">{JSON.stringify(a.demographics, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <div className="text-center py-12 text-gray-400">
            <BarChart3 size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{loading ? "Loading campaigns..." : "No published campaigns to analyze"}</p>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
