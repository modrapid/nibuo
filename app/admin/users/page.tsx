"use client";

import { useEffect, useState, useCallback } from "react";
import { getAllUsers, banUser, deleteUserAdmin } from "@/actions/admin.actions";
import { Search, Ban, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    const res = await getAllUsers(page, pageSize, search);
    if (res.data) {
      setUsers(res.data);
      setCount(res.count ?? 0);
    }
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleBan = async (id: string, banned: boolean) => {
    await banUser(id, !banned);
    fetchUsers();
  };

  const handleDelete = async (id: string) => {
    await deleteUserAdmin(id);
    fetchUsers();
  };

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-6">Users</h1>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by email..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700
                     bg-white/70 dark:bg-slate-800/60 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
      </div>

      <div className="flex flex-col gap-2">
        {users.map((u) => (
          <div
            key={u.id}
            className="glass-card rounded-xl px-4 py-3 flex items-center justify-between text-sm"
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-100">{u.email}</p>
              <p className="text-xs text-slate-400">{u.role} · {u.is_banned ? "Banned" : "Active"}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBan(u.id, u.is_banned)}
                className="text-slate-400 hover:text-amber-500 transition"
                title={u.is_banned ? "Unban" : "Ban"}
              >
                <Ban size={18} />
              </button>
              <button
                onClick={() => handleDelete(u.id)}
                className="text-slate-400 hover:text-red-500 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-slate-500">
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
