"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Fish, Check, X, Download, FileSpreadsheet, Users, Copy, UserCheck, UserX, Key, AlertTriangle, MoreVertical } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { syncApproveUser, syncRejectUser, syncSaveInviteCode, syncGetAllUsers } from "@/lib/auth-sync";
import { DEFAULT_CATEGORIES, DEFAULT_FISH, getAllCategories, getAllFish } from "@/lib/fish-data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { FishType } from "@/lib/types";

const TABS = ["tim", "kategori", "ikan", "shelf"] as const;
type TabKey = (typeof TABS)[number];
const TAB_LABELS: Record<TabKey, string> = { tim: "Tim", kategori: "Kategori", ikan: "Ikan", shelf: "Shelf Life" };

export default function KelolaIkanPage() {
  const router = useRouter();
  const currentRole = useFishStore((s) => s.currentRole);

  useEffect(() => {
    if (currentRole !== "pemilik") {
      router.replace("/dashboard");
    }
  }, [currentRole, router]);

  const [activeTab, setActiveTab] = useState<TabKey>("tim");

  if (currentRole !== "pemilik") return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-128px)]">
      <div className="flex flex-col gap-4 px-4 md:px-0 pt-4">
        <h1
          className="text-[32px] font-bold text-[#0E0F0F] tracking-[-0.64px] leading-[38.4px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Kelola
        </h1>

        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-4 -mx-4 md:mx-0 md:px-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 h-10 px-4 rounded-xl text-sm font-bold tracking-[0.28px] transition-all ${
                activeTab === tab
                  ? "bg-[#0E0F0F] text-white"
                  : "bg-[#F1EDEC] text-[#1C1B1B]"
              }`}
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                boxShadow: activeTab === tab
                  ? "0px 2px 2px rgba(0,0,0,0.1), 0px 8px 8px rgba(0,0,0,0.08), 0px 15px 17.5px rgba(0,0,0,0.05)"
                  : "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)",
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 md:px-0 mt-4 pb-24">
        {activeTab === "tim" && <TimTab />}
        {activeTab === "kategori" && <KategoriTab />}
        {activeTab === "ikan" && <IkanTab />}
        {activeTab === "shelf" && <ShelfLifeTab />}
      </div>
    </div>
  );
}

const IconKey = () => (
  <svg width="22" height="12" viewBox="0 0 22 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 12C5.33333 12 3.91667 11.4167 2.75 10.25C1.58333 9.08333 1 7.66667 1 6C1 4.33333 1.58333 2.91667 2.75 1.75C3.91667 0.583333 5.33333 0 7 0C8.11667 0 9.12917 0.275 10.0375 0.825C10.9458 1.375 11.6667 2.1 12.2 3H22V9H19V12H15V9H12.2C11.6667 9.9 10.9458 10.625 10.0375 11.175C9.12917 11.725 8.11667 12 7 12ZM7 9C7.93333 9 8.74167 8.71667 9.425 8.15C10.1083 7.58333 10.55 6.86667 10.75 6H16V9H17V6H20V5H10.75C10.55 4.13333 10.1083 3.41667 9.425 2.85C8.74167 2.28333 7.93333 2 7 2C5.9 2 4.95833 2.39167 4.175 3.175C3.39167 3.95833 3 4.9 3 6C3 7.1 3.39167 8.04167 4.175 8.825C4.95833 9.60833 5.9 10 7 10V9ZM6 7.5C6.41667 7.5 6.77083 7.35417 7.0625 7.0625C7.35417 6.77083 7.5 6.41667 7.5 6C7.5 5.58333 7.35417 5.22917 7.0625 4.9375C6.77083 4.64583 6.41667 4.5 6 4.5C5.58333 4.5 5.22917 4.64583 4.9375 4.9375C4.64583 5.22917 4.5 5.58333 4.5 6C4.5 6.41667 4.64583 6.77083 4.9375 7.0625C5.22917 7.35417 5.58333 7.5 6 7.5Z" fill="#0E0F0F" />
  </svg>
);

const IconCopy = () => (
  <svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.5 9.5C3.0875 9.5 2.73438 9.35313 2.44063 9.05938C2.14688 8.76563 2 8.4125 2 8V1.5C2 1.0875 2.14688 0.734375 2.44063 0.440625C2.73438 0.146875 3.0875 0 3.5 0H8.5C8.9125 0 9.26563 0.146875 9.55938 0.440625C9.85313 0.734375 10 1.0875 10 1.5V8C10 8.4125 9.85313 8.76563 9.55938 9.05938C9.26563 9.35313 8.9125 9.5 8.5 9.5H3.5ZM3.5 8.5H8.5C8.6375 8.5 8.76042 8.44271 8.86875 8.32813C8.97708 8.21354 9.03125 8.0875 9.03125 7.95V1.55C9.03125 1.4125 8.97396 1.28958 8.85938 1.18125C8.74479 1.07292 8.61875 1.01875 8.48125 1.01875H3.51875C3.38125 1.01875 3.25833 1.07604 3.15 1.19063C3.04167 1.30521 2.9875 1.43125 2.9875 1.56875V7.98125C2.9875 8.11875 3.04479 8.24167 3.15938 8.35C3.27396 8.45833 3.4 8.5125 3.5375 8.5125L3.5 8.5ZM1.5 11.5C1.0875 11.5 0.734375 11.3531 0.440625 11.0594C0.146875 10.7656 0 10.4125 0 10V2.5H1V10C1 10.1375 1.05729 10.2604 1.17188 10.3688C1.28646 10.4771 1.4125 10.5313 1.55 10.5313H7.5V11.5H1.5Z" fill="white" />
  </svg>
);

const IconPersonAdd = () => (
  <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 8V5H15V3H17V0H19V3H21V5H19V8H17ZM8 8C6.9 8 5.95833 7.60833 5.175 6.825C4.39167 6.04167 4 5.1 4 4C4 2.9 4.39167 1.95833 5.175 1.175C5.95833 0.391667 6.9 0 8 0C9.1 0 10.0417 0.391667 10.825 1.175C11.6083 1.95833 12 2.9 12 4C12 5.1 11.6083 6.04167 10.825 6.825C10.0417 7.60833 9.1 8 8 8ZM0 16V13.2C0 12.6333 0.145833 12.1125 0.4375 11.6375C0.729167 11.1625 1.11667 10.8 1.6 10.55C2.63333 10.0333 3.68333 9.64583 4.75 9.3875C5.81667 9.12917 6.9 9 8 9C9.1 9 10.1833 9.12917 11.25 9.3875C12.3167 9.64583 13.3667 10.0333 14.4 10.55C14.8833 10.8 15.2708 11.1625 15.5625 11.6375C15.8542 12.1125 16 12.6333 16 13.2V16H0ZM2 14H14V13.2C14 13.0167 13.9542 12.85 13.8625 12.7C13.7708 12.55 13.65 12.4333 13.5 12.35C12.6 11.9 11.6917 11.5625 10.775 11.3375C9.85833 11.1125 8.93333 11 8 11C7.06667 11 6.14167 11.1125 5.225 11.3375C4.30833 11.5625 3.4 11.9 2.5 12.35C2.35 12.4333 2.22917 12.55 2.1375 12.7C2.04583 12.85 2 13.0167 2 13.2V14ZM8 6C8.55 6 9.02083 5.80417 9.4125 5.4125C9.80417 5.02083 10 4.55 10 4C10 3.45 9.80417 2.97917 9.4125 2.5875C9.02083 2.19583 8.55 2 8 2C7.45 2 6.97917 2.19583 6.5875 2.5875C6.19583 2.97917 6 3.45 6 4C6 4.55 6.19583 5.02083 6.5875 5.4125C6.97917 5.80417 7.45 6 8 6Z" fill="white" />
  </svg>
);

function TimTab() {
  const currentUser = useFishStore((s) => s.currentUser);
  const users = useFishStore((s) => s.users);
  const inviteCodes = useFishStore((s) => s.inviteCodes);
  const approveUser = useFishStore((s) => s.approveUser);
  const rejectUser = useFishStore((s) => s.rejectUser);
  const resetInviteCode = useFishStore((s) => s.resetInviteCode);
  const generateInviteCode = useFishStore((s) => s.generateInviteCode);
  const [copied, setCopied] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    syncGetAllUsers().then((remoteUsers) => {
      if (remoteUsers.length > 0) {
        const localIds = new Set(users.map((u) => u.id));
        const toAdd = remoteUsers.filter((u) => !localIds.has(u.id));
        if (toAdd.length > 0) {
          useFishStore.setState((state) => ({ users: [...state.users, ...toAdd] }));
        }
      }
    });
  }, []);

  const uniqueUsers = useMemo(() => {
    const seen = new Set<string>();
    return users.filter((u) => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });
  }, [users]);
  const pendingUsers = uniqueUsers.filter((u) => u.approved === false);
  const approvedUsers = uniqueUsers.filter((u) => u.approved === true && u.role === "admin_gudang");
  const activeCode = inviteCodes.find((c) => c.active !== false) ?? null;
  const totalMembers = approvedUsers.length + pendingUsers.length + 1;

  async function handleResetCode() {
    const code = resetInviteCode();
    try { await syncSaveInviteCode(code, currentUser?.id ?? "system"); } catch { /* offline */ }
  }

  async function handleCreateFirstCode() {
    const code = generateInviteCode("admin_gudang");
    try { await syncSaveInviteCode(code, currentUser?.id ?? "system"); } catch { /* offline */ }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="flex flex-col gap-4 md:max-w-[600px]">
      <div
        className="flex flex-col gap-2 rounded-lg bg-white p-4"
        style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
      >
        <div className="flex items-center gap-2">
          <IconKey />
          <span
            className="text-xl font-bold text-[#0E0F0F] leading-[26px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            Kode Undangan
          </span>
        </div>
        <p
          className="text-base text-[#444748] leading-6"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Berikan kode ini kepada karyawan baru untuk bergabung dengan tim Gudang Utama.
        </p>

        {!activeCode ? (
          <button
            onClick={handleCreateFirstCode}
            className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0E0F0F] text-sm font-bold text-white active:scale-[0.97] transition-transform"
          >
            <Key className="h-4 w-4" />
            Buat Kode Undangan
          </button>
        ) : (
          <div className="mt-1">
            <div
              className="relative flex items-center justify-between rounded p-2"
              style={{ backgroundColor: "#F7F3F2", boxShadow: "inset 0px 2px 4px rgba(0,0,0,0.05)" }}
            >
              <span
                className="text-xl font-bold text-[#0E0F0F] tracking-[2px] leading-7"
                style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
              >
                {activeCode.code}
              </span>
              <button
                onClick={() => handleCopy(activeCode.code)}
                className="flex h-10 w-10 items-center justify-center bg-[#0E0F0F] active:scale-95 transition-transform"
                style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
              >
                {copied ? <Check className="h-3 w-3 text-white" /> : <IconCopy />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between">
          <h2
            className="text-2xl font-bold text-[#0E0F0F] tracking-[-0.24px] leading-[28.8px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            Anggota Tim
          </h2>
          <span
            className="rounded-xl bg-[#F1EDEC] px-2 py-1 text-sm font-bold text-[#444748] tracking-[0.28px]"
            style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
          >
            {totalMembers} Orang
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {pendingUsers.map((user) => (
            <div
              key={`pending-${user.id}`}
              className="flex items-center justify-between bg-white p-4"
              style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "#E5E2E1", boxShadow: "inset 0px 2px 4px rgba(0,0,0,0.05)" }}
                >
                  <span className="text-xl font-bold text-[#444748] leading-[26px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                    {getInitials(user.name)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-[#0E0F0F] tracking-[0.28px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                    {user.name}
                  </span>
                  <span className="text-xs text-[#444748]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                    Menunggu Konfirmasi
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={async () => { rejectUser(user.id); try { await syncRejectUser(user.id); } catch { /* offline */ } }}
                  className="flex h-10 w-10 items-center justify-center bg-[#BA1A1A] active:scale-95 transition-transform"
                  style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
                >
                  <X className="h-3 w-3 text-white" strokeWidth={3} />
                </button>
                <button
                  onClick={async () => { approveUser(user.id); try { await syncApproveUser(user.id); } catch { /* offline */ } }}
                  className="flex h-10 w-10 items-center justify-center bg-[#0E0F0F] active:scale-95 transition-transform"
                  style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
                >
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </button>
              </div>
            </div>
          ))}

          {currentUser && (
            <div
              className="flex items-center justify-between bg-white p-4"
              style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "#0E0F0F", boxShadow: "inset 0px 2px 4px rgba(0,0,0,0.05)" }}
                >
                  <span className="text-xl font-bold text-white leading-[26px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                    {getInitials(currentUser.name)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-[#0E0F0F] tracking-[0.28px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                      {currentUser.name}
                    </span>
                    <span
                      className="rounded-xl bg-[#262423] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-white leading-[15px]"
                      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                    >
                      PEMILIK
                    </span>
                  </div>
                  <span className="text-xs text-[#444748]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                    Pemilik Gudang
                  </span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center">
                <MoreVertical className="h-4 w-4 text-[#444748]" />
              </div>
            </div>
          )}

          {approvedUsers.map((user) => {
            if (removingId === user.id) {
              return (
                <div
                  key={`approved-${user.id}`}
                  className="rounded-lg border border-[#BA1A1A]/30 bg-[#BA1A1A]/5 p-4"
                >
                  <p className="text-sm font-semibold text-[#0E0F0F]">
                    Hapus <span className="font-extrabold">{user.name}</span> dari tim?
                  </p>
                  <p className="text-xs text-[#444748] mt-1">Pegawai tidak akan bisa login lagi.</p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={async () => { rejectUser(user.id); setRemovingId(null); try { await syncRejectUser(user.id); } catch { /* offline */ } }}
                      className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#BA1A1A] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                    >
                      <UserX className="h-4 w-4" />
                      Hapus
                    </button>
                    <button
                      onClick={() => setRemovingId(null)}
                      className="flex h-11 flex-1 items-center justify-center rounded-lg bg-white border border-[#E5E2E1] text-sm font-bold text-[#444748] active:scale-[0.97] transition-transform"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`approved-${user.id}`}
                className="flex items-center justify-between bg-white p-4"
                style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#E5E2E1", boxShadow: "inset 0px 2px 4px rgba(0,0,0,0.05)" }}
                  >
                    <span className="text-xl font-bold text-[#444748] leading-[26px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                      {getInitials(user.name)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-bold text-[#0E0F0F] tracking-[0.28px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                        {user.name}
                      </span>
                      {user.role === "admin_gudang" && (
                        <span
                          className="rounded-xl bg-[#262423] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] text-white leading-[15px]"
                          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                        >
                          ADMIN
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#444748]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
                      {user.role === "admin_gudang" ? "Staf Inventori" : "Pemilik"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (menuOpenId === user.id) {
                      setMenuOpenId(null);
                    } else {
                      setMenuOpenId(user.id);
                      setRemovingId(user.id);
                    }
                  }}
                  className="flex h-10 w-10 items-center justify-center active:scale-95 transition-transform"
                >
                  <MoreVertical className="h-4 w-4 text-[#444748]" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleCreateFirstCode}
        className="fixed bottom-24 right-4 md:right-10 lg:right-14 z-40 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0E0F0F] active:scale-90 transition-transform"
        style={{ boxShadow: "0px 2px 2px rgba(0,0,0,0.1), 0px 8px 8px rgba(0,0,0,0.08), 0px 15px 17.5px rgba(0,0,0,0.05)" }}
      >
        <IconPersonAdd />
      </button>
    </div>
  );
}

function KategoriTab() {
  const customCategories = useFishStore((s) => s.customCategories);
  const customFish = useFishStore((s) => s.customFish);
  const allFish = useMemo(() => getAllFish(customFish), [customFish]);

  const [showAdd, setShowAdd] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allCategories = useMemo(() => getAllCategories(customCategories), [customCategories]);
  const customIds = useMemo(() => new Set(customCategories.map((c) => c.id)), [customCategories]);

  function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function countFish(categoryId: string) {
    return allFish.filter((f) => f.category === categoryId).length;
  }

  function handleAddSave() {
    const label = addLabel.trim();
    if (!label) return;
    const id = slugify(label);
    if (!id) return;
    useFishStore.getState().addCategory(id, label);
    setAddLabel("");
    setShowAdd(false);
  }

  function handleEditSave(id: string) {
    const label = editLabel.trim();
    if (!label) return;
    const isDefault = id in DEFAULT_CATEGORIES;
    if (isDefault && !customIds.has(id)) {
      useFishStore.getState().addCategory(id, label);
    } else {
      useFishStore.getState().editCategory(id, label);
    }
    setEditingId(null);
    setEditLabel("");
  }

  function handleDelete(id: string) {
    useFishStore.getState().deleteCategory(id);
    setDeletingId(null);
  }

  const isDefault = (id: string) => id in DEFAULT_CATEGORIES;
  const isOverridden = (id: string) => customIds.has(id);

  return (
    <div className="flex flex-col gap-6 relative md:max-w-[600px]">
      <div className="flex flex-col gap-1">
        <h2
          className="text-[24px] font-bold text-[#1C1B1B] leading-[28.8px] tracking-[-0.24px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Kategori Stok
        </h2>
        <p
          className="text-[16px] text-[#444748] leading-[24px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Kelola pengelompokan barang
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {showAdd && (
          <div
            className="rounded-[4px] bg-white border border-[#0E0F0F] p-4"
            style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
          >
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="Nama Kategori Baru"
                className="h-12 w-full rounded-lg border border-[#E5E2E1] bg-[#FDF8F8] px-4 text-base text-[#0E0F0F] placeholder:text-[#747878] focus:outline-none focus:ring-2 focus:ring-[#0E0F0F]"
                autoFocus
              />
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs text-[#444748]">ID:</span>
                <span className="text-xs font-mono text-[#0E0F0F]">
                  {slugify(addLabel) || "—"}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddSave}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0E0F0F] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                >
                  <Check className="h-4 w-4" />
                  Simpan
                </button>
                <button
                  onClick={() => { setShowAdd(false); setAddLabel(""); }}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white border border-[#E5E2E1] text-sm font-bold text-[#444748] active:scale-[0.97] transition-transform"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {Object.entries(allCategories).map(([id, label]) => {
          if (editingId === id) {
            return (
              <div
                key={id}
                className="rounded-[4px] bg-white border border-[#0E0F0F] p-4"
                style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
              >
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="Nama Kategori"
                  className="h-12 w-full rounded-lg border border-[#E5E2E1] bg-[#FDF8F8] px-4 text-base text-[#0E0F0F] placeholder:text-[#747878] focus:outline-none focus:ring-2 focus:ring-[#0E0F0F]"
                  autoFocus
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleEditSave(id)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0E0F0F] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                  >
                    <Check className="h-4 w-4" />
                    Simpan
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditLabel(""); }}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white border border-[#E5E2E1] text-sm font-bold text-[#444748] active:scale-[0.97] transition-transform"
                  >
                    <X className="h-4 w-4" />
                    Batal
                  </button>
                </div>
              </div>
            );
          }

          if (deletingId === id) {
            return (
              <div key={id} className="rounded-[4px] bg-[#BA1A1A]/5 border border-[#BA1A1A]/30 p-4">
                <p className="text-sm font-semibold text-[#0E0F0F]">
                  Hapus kategori <span className="font-extrabold">{label}</span>? Semua ikan custom di kategori ini juga akan dihapus.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDelete(id)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#BA1A1A] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white border border-[#E5E2E1] text-sm font-bold text-[#444748] active:scale-[0.97] transition-transform"
                  >
                    <X className="h-4 w-4" />
                    Batal
                  </button>
                </div>
              </div>
            );
          }

          const defaultItem = isDefault(id);
          const overridden = isOverridden(id);

          return (
            <div
              key={id}
              className="flex items-center justify-between bg-white rounded-[4px] p-4"
              style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
            >
              <div className="flex flex-col gap-1">
                <p
                  className="text-[20px] font-bold text-[#1C1B1B] leading-[26px]"
                  style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                >
                  {label}
                </p>
                {defaultItem && !overridden && (
                  <span
                    className="self-start rounded-[2px] bg-[#E5E2E1] px-2 py-[3.5px] text-[12px] font-bold uppercase tracking-[0.6px] text-[#444748] leading-[14.4px]"
                    style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                  >
                    BAWAAN
                  </span>
                )}
                {overridden && (
                  <span
                    className="self-start rounded-[2px] bg-[#5D5F5F] px-2 py-[3.5px] text-[12px] font-bold uppercase tracking-[0.6px] text-white leading-[14.4px]"
                    style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                  >
                    DIUBAH
                  </span>
                )}
                {!defaultItem && !overridden && (
                  <span
                    className="self-start rounded-[2px] bg-[#5D5F5F] px-2 py-[3.5px] text-[12px] font-bold uppercase tracking-[0.6px] text-white leading-[14.4px]"
                    style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                  >
                    CUSTOM
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingId(id); setEditLabel(label); setDeletingId(null); }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#444748] active:scale-95 transition-transform"
                >
                  <Pencil className="h-[18px] w-[18px]" />
                </button>
                {(!defaultItem || overridden) && (
                  <button
                    onClick={() => { setDeletingId(id); setEditingId(null); }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-[#BA1A1A] active:scale-95 transition-transform"
                  >
                    <Trash2 className="h-[16px] w-[18px]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!showAdd && (
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setDeletingId(null); }}
          className="fixed bottom-24 right-4 md:right-10 lg:right-14 z-40 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0E0F0F] text-white active:scale-90 transition-transform"
          style={{ boxShadow: "0px 2px 2px rgba(0,0,0,0.1), 0px 8px 8px rgba(0,0,0,0.08), 0px 15px 17.5px rgba(0,0,0,0.05)" }}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

function IkanTab() {
  const customCategories = useFishStore((s) => s.customCategories);
  const customFish = useFishStore((s) => s.customFish);
  const allCategories = useMemo(() => getAllCategories(customCategories), [customCategories]);
  const allFish = useMemo(() => getAllFish(customFish), [customFish]);
  const customFishIds = useMemo(() => new Set(customFish.map((f) => f.id)), [customFish]);

  const [filterCategory, setFilterCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formLocalName, setFormLocalName] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formShelfLife, setFormShelfLife] = useState(24);

  const filteredFish = useMemo(() => {
    if (filterCategory === "all") return allFish;
    return allFish.filter((f) => f.category === filterCategory);
  }, [allFish, filterCategory]);

  function slugify(text: string) {
    return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }

  function resetForm() {
    setFormLocalName("");
    setFormName("");
    setFormCategory("");
    setFormShelfLife(24);
  }

  function handleAddSave() {
    const localName = formLocalName.trim();
    const name = formName.trim();
    if (!localName || !name || !formCategory) return;
    const id = slugify(localName);
    if (!id) return;
    useFishStore.getState().addFish({
      id,
      name,
      localName,
      category: formCategory,
      defaultShelfLifeHours: formShelfLife,
      isCustom: true,
    });
    resetForm();
    setShowAdd(false);
  }

  function startEdit(fish: FishType) {
    setEditingId(fish.id);
    setFormLocalName(fish.localName);
    setFormName(fish.name);
    setFormCategory(fish.category);
    setFormShelfLife(fish.defaultShelfLifeHours);
    setDeletingId(null);
    setShowAdd(false);
  }

  function handleEditSave(id: string) {
    const localName = formLocalName.trim();
    const name = formName.trim();
    if (!localName || !name || !formCategory) return;

    const isDefault = DEFAULT_FISH.some((f) => f.id === id);
    if (isDefault && !customFishIds.has(id)) {
      useFishStore.getState().addFish({
        id,
        name,
        localName,
        category: formCategory,
        defaultShelfLifeHours: formShelfLife,
        isCustom: true,
      });
    } else {
      useFishStore.getState().editFish(id, {
        name,
        localName,
        category: formCategory,
        defaultShelfLifeHours: formShelfLife,
      });
    }
    setEditingId(null);
    resetForm();
  }

  function handleDelete(id: string) {
    useFishStore.getState().deleteFish(id);
    setDeletingId(null);
  }

  const isDefaultFish = (id: string) => DEFAULT_FISH.some((f) => f.id === id) && !customFishIds.has(id);

  return (
    <div className="flex flex-col gap-6 relative md:max-w-[600px]">
      <div className="flex flex-col gap-1">
        <h2
          className="text-[24px] font-bold text-[#1C1B1B] leading-[28.8px] tracking-[-0.24px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Daftar Ikan
        </h2>
        <p
          className="text-[16px] text-[#444748] leading-[24px]"
          style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
        >
          Kelola jenis ikan dan spesies
        </p>
      </div>

      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="h-12 rounded-lg">
          <SelectValue placeholder="Semua Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Kategori</SelectItem>
          {Object.entries(allCategories).map(([id, label]) => (
            <SelectItem key={id} value={id}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-col gap-2">
        {showAdd && (
          <FishForm
            localName={formLocalName}
            name={formName}
            category={formCategory}
            shelfLife={formShelfLife}
            categories={allCategories}
            onLocalNameChange={setFormLocalName}
            onNameChange={setFormName}
            onCategoryChange={setFormCategory}
            onShelfLifeChange={setFormShelfLife}
            onSave={handleAddSave}
            onCancel={() => { setShowAdd(false); resetForm(); }}
          />
        )}

        {filteredFish.map((fish) => {
          if (editingId === fish.id) {
            return (
              <FishForm
                key={fish.id}
                localName={formLocalName}
                name={formName}
                category={formCategory}
                shelfLife={formShelfLife}
                categories={allCategories}
                onLocalNameChange={setFormLocalName}
                onNameChange={setFormName}
                onCategoryChange={setFormCategory}
                onShelfLifeChange={setFormShelfLife}
                onSave={() => handleEditSave(fish.id)}
                onCancel={() => { setEditingId(null); resetForm(); }}
              />
            );
          }

          if (deletingId === fish.id) {
            return (
              <div key={fish.id} className="rounded-[4px] bg-[#BA1A1A]/5 border border-[#BA1A1A]/30 p-4">
                <p className="text-sm font-semibold text-[#0E0F0F]">
                  Hapus <span className="font-extrabold">{fish.localName}</span>?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleDelete(fish.id)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#BA1A1A] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                  >
                    <Trash2 className="h-4 w-4" />
                    Hapus
                  </button>
                  <button
                    onClick={() => setDeletingId(null)}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white border border-[#E5E2E1] text-sm font-bold text-[#444748] active:scale-[0.97] transition-transform"
                  >
                    <X className="h-4 w-4" />
                    Batal
                  </button>
                </div>
              </div>
            );
          }

          const isDefault = DEFAULT_FISH.some((f) => f.id === fish.id) && !customFishIds.has(fish.id);
          const isModified = fish.isCustom && DEFAULT_FISH.some((f) => f.id === fish.id);

          return (
            <div
              key={fish.id}
              className="flex items-center justify-between bg-white rounded-[4px] p-4"
              style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
            >
              <div className="flex flex-col gap-1 min-w-0">
                <p
                  className="text-[20px] font-bold text-[#1C1B1B] leading-[26px] truncate"
                  style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                >
                  {fish.localName}
                </p>
                <p className="text-[14px] text-[#444748] leading-[20px] truncate">{fish.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {isDefault && (
                    <span
                      className="self-start rounded-[2px] bg-[#E5E2E1] px-2 py-[3.5px] text-[12px] font-bold uppercase tracking-[0.6px] text-[#444748] leading-[14.4px]"
                      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                    >
                      BAWAAN
                    </span>
                  )}
                  {isModified && (
                    <span
                      className="self-start rounded-[2px] bg-[#5D5F5F] px-2 py-[3.5px] text-[12px] font-bold uppercase tracking-[0.6px] text-white leading-[14.4px]"
                      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                    >
                      DIUBAH
                    </span>
                  )}
                  {!isDefault && !isModified && (
                    <span
                      className="self-start rounded-[2px] bg-[#5D5F5F] px-2 py-[3.5px] text-[12px] font-bold uppercase tracking-[0.6px] text-white leading-[14.4px]"
                      style={{ fontFamily: "Helvetica, Arial, sans-serif" }}
                    >
                      CUSTOM
                    </span>
                  )}
                  <span className="text-[12px] text-[#444748] leading-[14.4px]">
                    {allCategories[fish.category] || fish.category}
                  </span>
                  <span className="h-3 w-px bg-[#E5E2E1]" />
                  <span className="text-[12px] text-[#444748] leading-[14.4px]">{fish.defaultShelfLifeHours}j</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(fish)}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-[#444748] active:scale-95 transition-transform"
                >
                  <Pencil className="h-[18px] w-[18px]" />
                </button>
                {!isDefault && (
                  <button
                    onClick={() => { setDeletingId(fish.id); setEditingId(null); }}
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-[#BA1A1A] active:scale-95 transition-transform"
                  >
                    <Trash2 className="h-[16px] w-[18px]" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredFish.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Fish className="h-8 w-8 text-[#444748]" />
            <p className="text-sm text-[#444748]">Tidak ada ikan di kategori ini</p>
          </div>
        )}
      </div>

      {!showAdd && !editingId && (
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setDeletingId(null); resetForm(); }}
          className="fixed bottom-24 right-4 md:right-10 lg:right-14 z-40 flex h-14 w-14 items-center justify-center rounded-xl bg-[#0E0F0F] text-white active:scale-90 transition-transform"
          style={{ boxShadow: "0px 2px 2px rgba(0,0,0,0.1), 0px 8px 8px rgba(0,0,0,0.08), 0px 15px 17.5px rgba(0,0,0,0.05)" }}
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}

function ShelfLifeTab() {
  const customFish = useFishStore((s) => s.customFish);
  const customCategories = useFishStore((s) => s.customCategories);
  const shelfLifeOverrides = useFishStore((s) => s.shelfLifeOverrides);
  const setShelfLifeOverride = useFishStore((s) => s.setShelfLifeOverride);
  const removeShelfLifeOverride = useFishStore((s) => s.removeShelfLifeOverride);
  const getShelfLifeHours = useFishStore((s) => s.getShelfLifeHours);

  const allCategories = useMemo(() => getAllCategories(customCategories), [customCategories]);
  const allFish = useMemo(() => getAllFish(customFish), [customFish]);
  const overrideMap = useMemo(() => new Map(shelfLifeOverrides.map((o) => [o.fishId, o.hours])), [shelfLifeOverrides]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof allFish> = {};
    for (const fish of allFish) {
      if (!map[fish.category]) map[fish.category] = [];
      map[fish.category].push(fish);
    }
    return Object.entries(map);
  }, [allFish]);

  return (
    <div className="flex flex-col gap-5 md:max-w-[600px]">
      <p className="text-xs text-[#444748]">
        Atur berapa jam ikan bisa disimpan di cold storage sebelum dianggap kritis.
      </p>

      {grouped.map(([catId, fishList]) => (
        <div key={catId}>
          <p className="text-xs font-bold text-[#0E0F0F] uppercase tracking-wide mb-2">
            {allCategories[catId] ?? catId}
          </p>
          <div className="flex flex-col gap-2">
            {fishList.map((fish) => {
              const currentHours = getShelfLifeHours(fish.id, fish.defaultShelfLifeHours);
              const isOverridden = overrideMap.has(fish.id);

              return (
                <div
                  key={fish.id}
                  className="flex items-center justify-between bg-white p-3 rounded-lg"
                  style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
                >
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-bold text-[#0E0F0F] truncate" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>{fish.localName}</p>
                    <p className="text-xs text-[#444748] truncate">{fish.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShelfLifeOverride(fish.id, Math.max(1, currentHours - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDF8F8] border border-[#E5E2E1] text-sm font-bold active:scale-95 transition-transform"
                    >
                      -
                    </button>
                    <span className={`min-w-[40px] text-center text-sm font-extrabold ${isOverridden ? "text-[#0E0F0F]" : "text-[#0E0F0F]"}`}>
                      {currentHours}j
                    </span>
                    <button
                      onClick={() => setShelfLifeOverride(fish.id, currentHours + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FDF8F8] border border-[#E5E2E1] text-sm font-bold active:scale-95 transition-transform"
                    >
                      +
                    </button>
                    {isOverridden && (
                      <button
                        onClick={() => removeShelfLifeOverride(fish.id)}
                        className="flex h-9 items-center px-2 rounded-lg text-xs font-bold text-[#BA1A1A] bg-[#BA1A1A]/10 active:scale-95 transition-transform"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FishForm({
  localName,
  name,
  category,
  shelfLife,
  categories,
  onLocalNameChange,
  onNameChange,
  onCategoryChange,
  onShelfLifeChange,
  onSave,
  onCancel,
}: {
  localName: string;
  name: string;
  category: string;
  shelfLife: number;
  categories: Record<string, string>;
  onLocalNameChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onShelfLifeChange: (v: number) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="rounded-[4px] bg-white border border-[#0E0F0F] p-4"
      style={{ boxShadow: "0px 1px 1px rgba(0,0,0,0.05), 0px 4px 4px rgba(0,0,0,0.05), 0px 10px 10px rgba(0,0,0,0.03)" }}
    >
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-[#444748]">Nama Lokal</label>
          <input
            type="text"
            value={localName}
            onChange={(e) => onLocalNameChange(e.target.value)}
            placeholder="cth. Pari"
            className="h-12 w-full rounded-lg border border-[#E5E2E1] bg-[#FDF8F8] px-4 text-base text-[#0E0F0F] placeholder:text-[#747878] focus:outline-none focus:ring-2 focus:ring-[#0E0F0F]"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[#444748]">Nama Indonesia</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="cth. Ikan Pari"
            className="h-12 w-full rounded-lg border border-[#E5E2E1] bg-[#FDF8F8] px-4 text-base text-[#0E0F0F] placeholder:text-[#747878] focus:outline-none focus:ring-2 focus:ring-[#0E0F0F]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[#444748]">Kategori</label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-12 rounded-lg">
              <SelectValue placeholder="Pilih Kategori" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(categories).map(([id, label]) => (
                <SelectItem key={id} value={id}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[#444748]">Shelf Life (jam)</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onShelfLifeChange(Math.max(1, shelfLife - 1))}
              className="flex h-12 w-14 items-center justify-center rounded-lg bg-[#FDF8F8] border border-[#E5E2E1] text-lg font-bold text-[#0E0F0F] active:scale-95 transition-transform"
            >
              -
            </button>
            <span className="min-w-[48px] text-center text-lg font-extrabold text-[#0E0F0F]">
              {shelfLife}
            </span>
            <button
              onClick={() => onShelfLifeChange(shelfLife + 1)}
              className="flex h-12 w-14 items-center justify-center rounded-lg bg-[#FDF8F8] border border-[#E5E2E1] text-lg font-bold text-[#0E0F0F] active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-[#0E0F0F] text-sm font-bold text-white active:scale-[0.97] transition-transform"
          >
            <Check className="h-4 w-4" />
            Simpan
          </button>
          <button
            onClick={onCancel}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-white border border-[#E5E2E1] text-sm font-bold text-[#444748] active:scale-[0.97] transition-transform"
          >
            <X className="h-4 w-4" />
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
