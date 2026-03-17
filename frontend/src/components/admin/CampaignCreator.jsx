/**
 * M11: Campaign Creator
 * Owner: Frontend Dev 2
 * Dependencies: adsAPI
 *
 * Create new campaigns with type selection (Website, Ads, Voicebot*, Chatbot*),
 * budget, platforms, and target audience configuration.
 * Then trigger AI strategy generation.
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout, Card } from "../shared/Layout";
import { adsAPI } from "../../services/api";
import { Globe, Image, Bot, MessageSquare, Sparkles } from "lucide-react";

const AD_TYPES = [
  { value: "website", label: "Website", icon: Globe, desc: "AI-generated marketing website" },
  { value: "ads", label: "Advertisements", icon: Image, desc: "Display, social, and search ads" },
  { value: "voicebot", label: "Voicebot *", icon: Bot, desc: "Voice-based conversational agent" },
  { value: "chatbot", label: "Chatbot *", icon: MessageSquare, desc: "Text-based conversational agent" },
];

const PLATFORMS = ["Google Ads", "Meta/Instagram", "LinkedIn", "Twitter/X", "YouTube", "TikTok", "Email"];

export default function CampaignCreator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [createdAd, setCreatedAd] = useState(null);

  const [form, setForm] = useState({
    title: "",
    ad_type: "website",
    budget: "",
    platforms: [],
    target_audience: { age_range: "", gender: "", interests: "" },
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const togglePlatform = (p) => {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p) ? prev.platforms.filter((x) => x !== p) : [...prev.platforms, p],
    }));
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const ad = await adsAPI.create({
        title: form.title,
        ad_type: form.ad_type,
        budget: form.budget ? parseFloat(form.budget) : null,
        platforms: form.platforms,
        target_audience: form.target_audience,
      });
      setCreatedAd(ad);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await adsAPI.generateStrategy(createdAd.id);
      await adsAPI.submitForReview(createdAd.id);
      navigate("/admin");
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Create Campaign</h1>
      <p className="text-sm text-gray-500 mb-8">Define your campaign type, budget, and audience. Then let AI generate the strategy.</p>

      {!createdAd ? (
        <div className="space-y-6 max-w-3xl">
          {/* Campaign Type */}
          <Card title="Campaign Type">
            <div className="grid grid-cols-2 gap-3">
              {AD_TYPES.map((t) => {
                const Icon = t.icon;
                const active = form.ad_type === t.value;
                return (
                  <button key={t.value} onClick={() => update("ad_type", t.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition ${
                      active ? "border-indigo-600 bg-indigo-50" : "border-gray-100 hover:border-gray-200"
                    }`}>
                    <Icon size={24} className={active ? "text-indigo-600" : "text-gray-400"} />
                    <div>
                      <p className={`text-sm font-semibold ${active ? "text-indigo-900" : "text-gray-700"}`}>{t.label}</p>
                      <p className="text-xs text-gray-500">{t.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Details */}
          <Card title="Campaign Details">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title</label>
                <input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Q2 Product Launch"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                <input type="number" value={form.budget} onChange={(e) => update("budget", e.target.value)} placeholder="10000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
          </Card>

          {/* Platforms */}
          <Card title="Target Platforms">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => togglePlatform(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    form.platforms.includes(p) ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {p}
                </button>
              ))}
            </div>
          </Card>

          {/* Target Audience */}
          <Card title="Target Audience">
            <div className="grid grid-cols-3 gap-4">
              <input placeholder="Age Range (e.g. 25-45)" value={form.target_audience.age_range}
                onChange={(e) => update("target_audience", { ...form.target_audience, age_range: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input placeholder="Gender" value={form.target_audience.gender}
                onChange={(e) => update("target_audience", { ...form.target_audience, gender: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              <input placeholder="Interests" value={form.target_audience.interests}
                onChange={(e) => update("target_audience", { ...form.target_audience, interests: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </Card>

          <button onClick={handleCreate} disabled={loading || !form.title}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 font-semibold text-sm">
            {loading ? "Creating..." : "Create Campaign"}
          </button>
        </div>
      ) : (
        /* Post-creation: generate strategy */
        <Card title={`Campaign Created: ${createdAd.title}`}>
          <div className="text-center py-8 space-y-4">
            <Sparkles size={48} className="mx-auto text-indigo-600" />
            <p className="text-gray-600">Campaign created. Generate an AI marketing strategy and submit for review?</p>
            <button onClick={handleGenerate} disabled={generating}
              className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 font-medium">
              {generating ? "AI is generating strategy..." : "Generate Strategy & Submit for Review"}
            </button>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
