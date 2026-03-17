/**
 * M11: Admin Dashboard
 * Owner: Frontend Dev 2
 * Dependencies: Shared Layout, adsAPI, usersAPI
 *
 * Admin's home view: stats overview, recent campaigns, quick actions.
 */

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout, Card, StatCard, StatusBadge } from "../shared/Layout";
import { adsAPI, usersAPI } from "../../services/api";
import { Megaphone, Users, BarChart3, Clock, Plus } from "lucide-react";

export default function AdminDashboard() {
  const [ads, setAds] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adsAPI.list(), usersAPI.list()])
      .then(([a, u]) => { setAds(a); setUsers(u); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const published = ads.filter((a) => a.status === "published").length;
  const inReview = ads.filter((a) => ["under_review", "ethics_review"].includes(a.status)).length;

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage campaigns, users, and company documents</p>
        </div>
        <Link to="/admin/create"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Campaigns" value={ads.length} icon={Megaphone} />
        <StatCard label="Published" value={published} icon={BarChart3} trend={12} />
        <StatCard label="In Review" value={inReview} icon={Clock} />
        <StatCard label="Team Members" value={users.length} icon={Users} />
      </div>

      {/* Recent Campaigns */}
      <Card title="Recent Campaigns" subtitle="Latest campaign activity"
        actions={<Link to="/admin/analytics" className="text-sm text-indigo-600 hover:underline">View All</Link>}>
        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : ads.length === 0 ? (
          <p className="text-sm text-gray-400">No campaigns yet. Create your first one!</p>
        ) : (
          <div className="space-y-3">
            {ads.slice(0, 5).map((ad) => (
              <div key={ad.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ad.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ad.ad_type} · {new Date(ad.created_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={ad.status} />
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}
