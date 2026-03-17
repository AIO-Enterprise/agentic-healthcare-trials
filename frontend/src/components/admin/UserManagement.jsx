/**
 * M11: User Management
 * Owner: Frontend Dev 2
 * Dependencies: usersAPI
 *
 * Add/manage users with roles: Admin, Reviewer, Ethics Reviewer, Publisher
 */

import React, { useState, useEffect } from "react";
import { DashboardLayout, Card } from "../shared/Layout";
import { usersAPI } from "../../services/api";
import { UserPlus, Shield, Eye, Send, Settings } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin", icon: Settings },
  { value: "reviewer", label: "Reviewer", icon: Eye },
  { value: "ethics_reviewer", label: "Ethics Reviewer", icon: Shield },
  { value: "publisher", label: "Publisher", icon: Send },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "", role: "reviewer" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { usersAPI.list().then(setUsers).catch(console.error); }, []);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const user = await usersAPI.create(form);
      setUsers((p) => [...p, user]);
      setShowForm(false);
      setForm({ email: "", password: "", full_name: "", role: "reviewer" });
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add and manage team members for your company</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {showForm && (
        <Card title="Add New User" className="mb-6">
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Full Name" value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <button onClick={handleCreate} disabled={loading || !form.email || !form.full_name}
            className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 text-sm font-medium">
            {loading ? "Creating..." : "Create User"}
          </button>
        </Card>
      )}

      <Card title={`Team Members (${users.length})`}>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 transition">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                  {u.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                  {u.role?.replace("_", " ")}
                </span>
                <span className={`w-2 h-2 rounded-full ${u.is_active ? "bg-green-500" : "bg-red-400"}`} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DashboardLayout>
  );
}
