/**
 * M14: Publisher Dashboard
 * Owner: Frontend Dev 2
 * Dependencies: adsAPI, analyticsAPI
 *
 * Publish reviewed strategies, create ads/websites,
 * configure voice/chatbot params, view analytics,
 * and implement optimizer suggestions.
 */

import React, { useState, useEffect } from "react";
import { DashboardLayout, Card, StatCard, StatusBadge } from "../shared/Layout";
import { adsAPI, analyticsAPI } from "../../services/api";
import { Send, Globe, Image, Bot, BarChart3, Play, Pause, Sparkles, CheckCircle } from "lucide-react";

export default function PublisherDashboard() {
  const [ads, setAds] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adsAPI.list().then(setAds).catch(console.error).finally(() => setLoading(false));
  }, []);

  const approved = ads.filter((a) => a.status === "approved");
  const published = ads.filter((a) => a.status === "published");

  const handlePublish = async (adId) => {
    try {
      const updated = await adsAPI.publish(adId);
      setAds((p) => p.map((a) => (a.id === adId ? updated : a)));
    } catch (err) { alert(err.message); }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Publisher Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">Publish campaigns, create outputs, and manage deployments</p>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Ready to Publish" value={approved.length} icon={Send} />
        <StatCard label="Published" value={published.length} icon={Globe} />
        <StatCard label="Total Campaigns" value={ads.length} icon={BarChart3} />
        <StatCard label="Active" value={published.filter((a) => a.status !== "paused").length} icon={Play} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: "overview", label: "Overview", icon: Send },
          { key: "ads", label: "Ad Creator", icon: Image },
          { key: "website", label: "Website Creator", icon: Globe },
          { key: "bots", label: "Bot Config", icon: Bot },
          { key: "analytics", label: "Analytics", icon: BarChart3 },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview: Publish approved campaigns */}
      {tab === "overview" && (
        <div className="space-y-4">
          {approved.length > 0 && (
            <Card title="Ready to Publish" subtitle="Approved campaigns waiting for deployment">
              {approved.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                    <p className="text-xs text-gray-400">{ad.ad_type} · Budget: ${ad.budget || "N/A"}</p>
                  </div>
                  <button onClick={() => handlePublish(ad.id)}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium">
                    <Send size={14} /> Publish
                  </button>
                </div>
              ))}
            </Card>
          )}

          <Card title="Published Campaigns">
            {published.length === 0 ? (
              <p className="text-sm text-gray-400">No published campaigns yet</p>
            ) : (
              published.map((ad) => (
                <div key={ad.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                    <p className="text-xs text-gray-400">{ad.ad_type} · {ad.output_url || "Deployed"}</p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={ad.status} />
                    <button onClick={() => setSelected(ad)}
                      className="text-xs text-indigo-600 hover:underline">Details</button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {/* Ad Creator */}
      {tab === "ads" && (
        <Card title="Advertisement Creator" subtitle="Preview, regenerate, and manage ad platform API keys">
          <div className="space-y-4">
            {ads.filter((a) => a.ad_type === "ads" && a.ad_details).map((ad) => (
              <div key={ad.id} className="border border-gray-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">{ad.title}</p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(ad.ad_details, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition">
                    Preview Ad
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                    Regenerate
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                    API Keys
                  </button>
                </div>
              </div>
            ))}
            {ads.filter((a) => a.ad_type === "ads" && a.ad_details).length === 0 && (
              <p className="text-sm text-gray-400">No ad campaigns with generated details yet</p>
            )}
          </div>
        </Card>
      )}

      {/* Website Creator */}
      {tab === "website" && (
        <Card title="Website Creator" subtitle="Preview, deploy, and redesign marketing websites">
          <div className="space-y-4">
            {ads.filter((a) => a.ad_type === "website" && a.website_reqs).map((ad) => (
              <div key={ad.id} className="border border-gray-100 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-2">{ad.title}</p>
                <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(ad.website_reqs, null, 2)}
                  </pre>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition">
                    Preview Website
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                    Hosting Settings
                  </button>
                  <button className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition">
                    Deploy
                  </button>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition">
                    Redesign UI
                  </button>
                </div>
              </div>
            ))}
            {ads.filter((a) => a.ad_type === "website" && a.website_reqs).length === 0 && (
              <p className="text-sm text-gray-400">No website campaigns with requirements yet</p>
            )}
          </div>
        </Card>
      )}

      {/* Bot Config */}
      {tab === "bots" && <BotConfig ads={ads.filter((a) => ["voicebot", "chatbot"].includes(a.ad_type))} />}

      {/* Analytics */}
      {tab === "analytics" && <PublisherAnalytics ads={published} />}
    </DashboardLayout>
  );
}

// ─── Bot Configuration Sub-component ─────────────────────────────────────────

function BotConfig({ ads }) {
  const [form, setForm] = useState({
    conversation_style: "professional",
    voice: "neutral",
    language: "en",
  });

  const handleSave = async (adId) => {
    try {
      await adsAPI.updateBotConfig(adId, form);
      alert("Bot configuration saved!");
    } catch (err) { alert(err.message); }
  };

  return (
    <Card title="VoiceBot / ChatBot Configuration" subtitle="Set conversation styles, voices, and language">
      {ads.length === 0 ? (
        <p className="text-sm text-gray-400">No voicebot/chatbot campaigns created yet</p>
      ) : (
        ads.map((ad) => (
          <div key={ad.id} className="border border-gray-100 rounded-lg p-4 mb-4">
            <p className="text-sm font-semibold text-gray-900 mb-3">{ad.title} ({ad.ad_type})</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Conversation Style</label>
                <select value={form.conversation_style} onChange={(e) => setForm((p) => ({ ...p, conversation_style: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Voice</label>
                <select value={form.voice} onChange={(e) => setForm((p) => ({ ...p, voice: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="neutral">Neutral</option>
                  <option value="warm">Warm</option>
                  <option value="energetic">Energetic</option>
                  <option value="calm">Calm</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
                <select value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>
            </div>
            <button onClick={() => handleSave(ad.id)}
              className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
              Save Config
            </button>
          </div>
        ))
      )}
    </Card>
  );
}

// ─── Publisher Analytics Sub-component ────────────────────────────────────────

function PublisherAnalytics({ ads }) {
  const [selected, setSelected] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  const handleOptimize = async (adId) => {
    setOptimizing(true);
    try {
      const result = await analyticsAPI.triggerOptimize(adId);
      setSuggestions(result);
    } catch (err) { alert(err.message); }
    finally { setOptimizing(false); }
  };

  const handleDecision = async (adId, decision) => {
    try {
      await analyticsAPI.submitDecision(adId, { decision });
      setSuggestions(null);
      alert(`Decision "${decision}" recorded. Reinforcement learning updated.`);
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="space-y-4">
      <Card title="Published Campaign Analytics" subtitle="View performance and apply optimizer suggestions">
        {ads.map((ad) => (
          <div key={ad.id} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-900">{ad.title}</p>
              <p className="text-xs text-gray-400">{ad.ad_type}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setSelected(ad); handleOptimize(ad.id); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium hover:bg-orange-200 transition">
                <Sparkles size={12} /> Optimize
              </button>
            </div>
          </div>
        ))}
      </Card>

      {suggestions && selected && (
        <Card title={`Optimizer Suggestions: ${selected.title}`}>
          <div className="bg-orange-50 rounded-lg p-4 mb-4 max-h-64 overflow-auto">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(suggestions.suggestions, null, 2)}
            </pre>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleDecision(selected.id, "accepted")}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition text-sm font-medium">
              <CheckCircle size={16} /> Accept & Redeploy
            </button>
            <button onClick={() => handleDecision(selected.id, "partial")}
              className="flex-1 bg-yellow-500 text-white py-2.5 rounded-lg hover:bg-yellow-600 transition text-sm font-medium">
              Partial Accept
            </button>
            <button onClick={() => handleDecision(selected.id, "rejected")}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-lg hover:bg-gray-300 transition text-sm font-medium">
              Reject
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
