/**
 * M11: My Company
 * Owner: Frontend Dev 2
 * Dependencies: documentsAPI
 *
 * Manage company documents: USP, Compliances, Policies, Marketing Goals
 */

import React, { useState, useEffect } from "react";
import { DashboardLayout, Card } from "../shared/Layout";
import { documentsAPI } from "../../services/api";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";

const DOC_TYPES = [
  { value: "usp", label: "USP" },
  { value: "compliance", label: "Compliance" },
  { value: "policy", label: "Policies" },
  { value: "marketing_goal", label: "Marketing Goals" },
  { value: "ethical_guideline", label: "Ethical Guidelines" },
];

export default function MyCompany() {
  const [docs, setDocs] = useState([]);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doc_type: "usp", title: "", content: "" });
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    documentsAPI.list(filter || undefined).then(setDocs).catch(console.error);
  }, [filter]);

  const handleSave = async () => {
    try {
      if (editing) {
        const updated = await documentsAPI.update(editing, { title: form.title, content: form.content });
        setDocs((p) => p.map((d) => (d.id === editing ? updated : d)));
      } else {
        const created = await documentsAPI.create(form);
        setDocs((p) => [...p, created]);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ doc_type: "usp", title: "", content: "" });
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    await documentsAPI.delete(id);
    setDocs((p) => p.filter((d) => d.id !== id));
  };

  const startEdit = (doc) => {
    setEditing(doc.id);
    setForm({ doc_type: doc.doc_type, title: doc.title, content: doc.content || "" });
    setShowForm(true);
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Company</h1>
          <p className="text-sm text-gray-500 mt-1">Manage company documents and policies</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ doc_type: "usp", title: "", content: "" }); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
          <Plus size={16} /> Add Document
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setFilter("")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!filter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          All
        </button>
        {DOC_TYPES.map((t) => (
          <button key={t.value} onClick={() => setFilter(t.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === t.value ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {showForm && (
        <Card title={editing ? "Edit Document" : "New Document"} className="mb-6">
          <div className="space-y-4">
            <select value={form.doc_type} onChange={(e) => setForm((p) => ({ ...p, doc_type: e.target.value }))}
              disabled={!!editing}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input placeholder="Document Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            <textarea placeholder="Document Content" rows={6} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium">Cancel</button>
              <button onClick={handleSave}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium">
                {editing ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {docs.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between">
            <div className="flex gap-4">
              <FileText size={20} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{doc.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 capitalize">{doc.doc_type?.replace("_", " ")} · v{doc.version}</p>
                {doc.content && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.content}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => startEdit(doc)} className="p-2 hover:bg-gray-100 rounded-lg transition"><Pencil size={16} className="text-gray-400" /></button>
              <button onClick={() => handleDelete(doc.id)} className="p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} className="text-red-400" /></button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
