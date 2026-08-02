"use client";

import { useEffect, useState, useCallback } from "react";
import { getReports, resolveReport, deleteLinkAdmin } from "@/actions/admin.actions";
import { CheckCircle, Trash2 } from "lucide-react";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = useCallback(async () => {
    const res = await getReports();
    if (res.data) setReports(res.data);
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolve = async (id: string) => {
    await resolveReport(id, "resolved");
    fetchReports();
  };

  const handleDeleteLink = async (linkId: string, reportId: string) => {
    await deleteLinkAdmin(linkId);
    await resolveReport(reportId, "resolved");
    fetchReports();
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">
        Abuse Reports
      </h1>

      <div className="flex flex-col gap-3">
        {reports.length === 0 && (
          <p className="text-slate-400 text-sm">No reports to review.</p>
        )}

        {reports.map((r) => (
          <div key={r.id} className="glass-card rounded-xl2 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-800 dark:text-slate-100">
                /{r.links?.short_code}
              </span>
              <span
                className={`text-[10px] rounded px-2 py-0.5 ${
                  r.status === "pending"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-1">Reason: {r.reason}</p>
            <p className="text-xs text-slate-400 truncate mb-3">{r.links?.original_url}</p>

            {r.status === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve(r.id)}
                  className="flex items-center gap-1 text-sm text-green-600 hover:underline"
                >
                  <CheckCircle size={16} /> Mark Reviewed
                </button>
                <button
                  onClick={() => handleDeleteLink(r.link_id, r.id)}
                  className="flex items-center gap-1 text-sm text-red-500 hover:underline"
                >
                  <Trash2 size={16} /> Delete Link
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
