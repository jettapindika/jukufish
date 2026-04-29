"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, Pencil, Trash2, Fish, Check, X, Download, FileSpreadsheet, Users, Copy, UserCheck, UserX, Key, AlertTriangle } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { syncApproveUser, syncRejectUser, syncSaveInviteCode, syncGetAllUsers } from "@/lib/auth-sync";
import { DEFAULT_CATEGORIES, DEFAULT_FISH, getAllCategories, getAllFish } from "@/lib/fish-data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { FishType } from "@/lib/types";

export default function KelolaIkanPage() {
  const router = useRouter();
  const currentRole = useFishStore((s) => s.currentRole);

  useEffect(() => {
    if (currentRole !== "pemilik") {
      router.replace("/dashboard");
    }
  }, [currentRole, router]);

  const [activeTab, setActiveTab] = useState<"tim" | "kategori" | "ikan" | "shelf" | "export">("tim");

  if (currentRole !== "pemilik") return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-128px)]">
      <div className="flex items-center gap-3 px-4 md:px-0 pt-4">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] active:scale-95 transition-transform"
        >
          <ChevronLeft className="h-5 w-5 text-[var(--color-foreground)]" />
        </button>
        <h1 className="text-lg font-extrabold text-[var(--color-foreground)]">Kelola</h1>
      </div>

      <div className="flex gap-2 px-4 md:px-0 mt-4 overflow-x-auto hide-scrollbar md:max-w-[600px]">
        {(["tim", "kategori", "ikan", "shelf", "export"] as const).map((tab) => {
          const labels = { tim: "Tim", kategori: "Kategori", ikan: "Ikan", shelf: "Shelf Life", export: "Export" };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 shrink-0 h-12 rounded-xl text-xs font-bold transition-colors ${
                activeTab === tab
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : "bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)]"
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div className="flex-1 px-4 md:px-0 mt-4 pb-24">
        {activeTab === "tim" && <TimTab />}
        {activeTab === "kategori" && <KategoriTab />}
        {activeTab === "ikan" && <IkanTab />}
        {activeTab === "shelf" && <ShelfLifeTab />}
        {activeTab === "export" && <ExportTab />}
      </div>
    </div>
  );
}

function TimTab() {
  const currentUser = useFishStore((s) => s.currentUser);
  const users = useFishStore((s) => s.users);
  const inviteCodes = useFishStore((s) => s.inviteCodes);
  const approveUser = useFishStore((s) => s.approveUser);
  const rejectUser = useFishStore((s) => s.rejectUser);
  const resetInviteCode = useFishStore((s) => s.resetInviteCode);
  const generateInviteCode = useFishStore((s) => s.generateInviteCode);
  const [copied, setCopied] = useState(false);

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

  const pendingUsers = users.filter((u) => u.approved === false);
  const approvedAdmins = users.filter((u) => u.approved !== false && u.role === "admin_gudang");
  const activeCode = inviteCodes.find((c) => c.active !== false) ?? null;

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

  return (
    <div className="flex flex-col gap-5 md:max-w-[600px]">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Key className="h-4 w-4 text-[var(--color-primary)]" />
          <p className="text-sm font-bold text-[var(--color-foreground)]">Kode Undangan</p>
        </div>
        <p className="text-xs text-[var(--color-muted)] mb-3">
          Bagikan kode ini ke admin gudang untuk mendaftar. Satu kode bisa dipakai banyak pegawai.
        </p>
        {!activeCode ? (
          <button
            onClick={handleCreateFirstCode}
            className="flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] text-sm font-bold text-[var(--color-on-primary)] active:scale-[0.97] transition-transform"
          >
            <Key className="h-5 w-5" />
            Buat Kode Undangan
          </button>
        ) : (
          <div
            className="rounded-[var(--radius)] bg-[var(--color-surface)] p-4"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xl font-bold text-[var(--color-foreground)] tracking-widest">
                  {activeCode.code}
                </p>
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {approvedAdmins.length} pegawai aktif · {pendingUsers.length} menunggu
                </p>
              </div>
              <button
                onClick={() => handleCopy(activeCode.code)}
                className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--color-background)] text-[var(--color-muted)] active:scale-95 transition-transform"
              >
                {copied ? <Check className="h-4 w-4 text-[var(--color-fresh)]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleResetCode}
              className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-[var(--radius)] border border-[var(--color-border)] text-xs font-semibold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
            >
              <Key className="h-3.5 w-3.5" />
              Reset Kode
            </button>
          </div>
        )}
      </div>

      {pendingUsers.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-[var(--color-warning)]" />
            <p className="text-sm font-bold text-[var(--color-foreground)]">Menunggu Persetujuan</p>
            <span className="ml-auto rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-xs font-bold text-[var(--color-warning)]">
              {pendingUsers.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {pendingUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-[var(--radius)] bg-[var(--color-surface)] p-4"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--color-foreground)]">{user.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{user.email}</p>
                    <p className="text-xs text-[var(--color-muted)] mt-1">
                      {user.role === "admin_gudang" ? "Admin Gudang" : "Pemilik"} · {new Date(user.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={async () => { approveUser(user.id); try { await syncApproveUser(user.id); } catch { /* offline */ } }}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-fresh)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                  >
                    <UserCheck className="h-4 w-4" />
                    Setujui
                  </button>
                  <button
                    onClick={async () => { rejectUser(user.id); try { await syncRejectUser(user.id); } catch { /* offline */ } }}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-critical)]/10 text-sm font-bold text-[var(--color-critical)] active:scale-[0.97] transition-transform"
                  >
                    <UserX className="h-4 w-4" />
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {approvedAdmins.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-[var(--color-fresh)]" />
            <p className="text-sm font-bold text-[var(--color-foreground)]">Pegawai Aktif ({approvedAdmins.length})</p>
          </div>
          <div className="flex flex-col gap-2">
            {approvedAdmins.map((user) => (
              <RemovableAdmin key={user.id} user={user} onRemove={async (id) => {
                rejectUser(id);
                try { await syncRejectUser(id); } catch { /* offline */ }
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RemovableAdmin({ user, onRemove }: { user: { id: string; name: string; email: string; role: string }; onRemove: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div
        className="rounded-[var(--radius)] bg-[var(--color-critical)]/5 border border-[var(--color-critical)]/20 p-4"
      >
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          Hapus <span className="font-extrabold">{user.name}</span> dari tim?
        </p>
        <p className="text-xs text-[var(--color-muted)] mt-1">Pegawai tidak akan bisa login lagi.</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { onRemove(user.id); setConfirming(false); }}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius)] bg-[var(--color-critical)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
          >
            <UserX className="h-4 w-4" />
            Hapus
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex h-11 flex-1 items-center justify-center rounded-[var(--radius)] bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between rounded-[var(--radius)] bg-[var(--color-surface)] p-4"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div>
        <p className="text-sm font-bold text-[var(--color-foreground)]">{user.name}</p>
        <p className="text-xs text-[var(--color-muted)]">{user.email}</p>
      </div>
      <button
        onClick={() => setConfirming(true)}
        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[var(--color-critical)]/10 text-[var(--color-critical)] active:scale-95 transition-transform"
      >
        <UserX className="h-4 w-4" />
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
  const getLabel = (id: string) => allCategories[id] ?? id;

  return (
    <div className="flex flex-col gap-3 relative md:max-w-[600px]">
      {showAdd && (
        <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-primary)] p-4">
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={addLabel}
              onChange={(e) => setAddLabel(e.target.value)}
              placeholder="Nama Kategori Baru"
              className="h-12 w-full rounded-xl border border-gray-300 bg-[var(--color-background)] px-4 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              autoFocus
            />
            <div className="flex items-center gap-2 px-1">
              <span className="text-xs text-[var(--color-muted)]">ID:</span>
              <span className="text-xs font-mono text-[var(--color-foreground)]">
                {slugify(addLabel) || "—"}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddSave}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-sm font-bold text-[var(--color-on-primary)] active:scale-[0.97] transition-transform"
              >
                <Check className="h-4 w-4" />
                Simpan
              </button>
              <button
                onClick={() => { setShowAdd(false); setAddLabel(""); }}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
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
            <div key={id} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-primary)] p-4">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Nama Kategori"
                className="h-12 w-full rounded-xl border border-gray-300 bg-[var(--color-background)] px-4 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoFocus
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleEditSave(id)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-sm font-bold text-[var(--color-on-primary)] active:scale-[0.97] transition-transform"
                >
                  <Check className="h-4 w-4" />
                  Simpan
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditLabel(""); }}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
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
            <div key={id} className="rounded-xl bg-[var(--color-critical)]/5 border border-[var(--color-critical)]/30 p-4">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                Hapus kategori <span className="font-extrabold">{label}</span>? Semua ikan custom di kategori ini juga akan dihapus.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleDelete(id)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-critical)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={id}
            className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-[var(--color-foreground)]">{label}</p>
                {isDefault(id) && !isOverridden(id) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-muted)] font-medium">Bawaan</span>
                )}
                {isOverridden(id) && isDefault(id) && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium">Diubah</span>
                )}
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">{countFish(id)} jenis ikan</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setEditingId(id); setEditLabel(label); setDeletingId(null); }}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-background)] text-[var(--color-primary)] active:scale-95 transition-transform"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {!isDefault(id) && (
                <button
                  onClick={() => { setDeletingId(id); setEditingId(null); }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-critical)]/10 text-[var(--color-critical)] active:scale-95 transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!showAdd && (
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setDeletingId(null); }}
          className="fixed bottom-24 right-5 md:right-10 lg:right-14 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 active:scale-90 transition-transform"
        >
          <Plus className="h-7 w-7" />
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
    <div className="flex flex-col gap-3 relative md:max-w-[600px]">
      <Select value={filterCategory} onValueChange={setFilterCategory}>
        <SelectTrigger className="h-12 rounded-xl">
          <SelectValue placeholder="Semua Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Kategori</SelectItem>
          {Object.entries(allCategories).map(([id, label]) => (
            <SelectItem key={id} value={id}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

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
            <div key={fish.id} className="rounded-xl bg-[var(--color-critical)]/5 border border-[var(--color-critical)]/30 p-4">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                Hapus <span className="font-extrabold">{fish.localName}</span>?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleDelete(fish.id)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-critical)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus
                </button>
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
                >
                  <X className="h-4 w-4" />
                  Batal
                </button>
              </div>
            </div>
          );
        }

        return (
          <div
            key={fish.id}
            className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[var(--color-foreground)] truncate">{fish.localName}</p>
                  {isDefaultFish(fish.id) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-muted)] font-medium shrink-0">Bawaan</span>
                  )}
                  {fish.isCustom && DEFAULT_FISH.some((f) => f.id === fish.id) && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-medium shrink-0">Diubah</span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted)] truncate">{fish.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-[var(--color-muted)]">
                    {allCategories[fish.category] || fish.category}
                  </span>
                  <span className="h-3 w-px bg-[var(--color-border)]" />
                  <span className="text-xs text-[var(--color-muted)]">{fish.defaultShelfLifeHours}j</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => startEdit(fish)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-background)] text-[var(--color-primary)] active:scale-95 transition-transform"
              >
                <Pencil className="h-4 w-4" />
              </button>
              {!isDefaultFish(fish.id) && (
                <button
                  onClick={() => { setDeletingId(fish.id); setEditingId(null); }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-critical)]/10 text-[var(--color-critical)] active:scale-95 transition-transform"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}

      {filteredFish.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8">
          <Fish className="h-8 w-8 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">Tidak ada ikan di kategori ini</p>
        </div>
      )}

      {!showAdd && !editingId && (
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setDeletingId(null); resetForm(); }}
          className="fixed bottom-24 right-5 md:right-10 lg:right-14 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 active:scale-90 transition-transform"
        >
          <Plus className="h-7 w-7" />
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
      <p className="text-xs text-[var(--color-muted)]">
        Atur berapa jam ikan bisa disimpan di cold storage sebelum dianggap kritis.
      </p>

      {grouped.map(([catId, fishList]) => (
        <div key={catId}>
          <p className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wide mb-2">
            {allCategories[catId] ?? catId}
          </p>
          <div className="flex flex-col gap-2">
            {fishList.map((fish) => {
              const currentHours = getShelfLifeHours(fish.id, fish.defaultShelfLifeHours);
              const isOverridden = overrideMap.has(fish.id);

              return (
                <div
                  key={fish.id}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3"
                >
                  <div className="min-w-0 mr-3">
                    <p className="text-sm font-bold text-[var(--color-foreground)] truncate">{fish.localName}</p>
                    <p className="text-xs text-[var(--color-muted)] truncate">{fish.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShelfLifeOverride(fish.id, Math.max(1, currentHours - 1))}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-bold active:scale-95 transition-transform"
                    >
                      -
                    </button>
                    <span className={`min-w-[40px] text-center text-sm font-extrabold ${isOverridden ? "text-[var(--color-primary)]" : "text-[var(--color-foreground)]"}`}>
                      {currentHours}j
                    </span>
                    <button
                      onClick={() => setShelfLifeOverride(fish.id, currentHours + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm font-bold active:scale-95 transition-transform"
                    >
                      +
                    </button>
                    {isOverridden && (
                      <button
                        onClick={() => removeShelfLifeOverride(fish.id)}
                        className="flex h-9 items-center px-2 rounded-lg text-xs font-bold text-[var(--color-critical)] bg-[var(--color-critical)]/10 active:scale-95 transition-transform"
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

function ExportTab() {
  const router = useRouter();
  const entries = useFishStore((s) => s.entries);
  const exits = useFishStore((s) => s.exits);
  const getActiveEntries = useFishStore((s) => s.getActiveEntries);
  const resetAllData = useFishStore((s) => s.resetAllData);
  const customFish = useFishStore((s) => s.customFish);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  function downloadCsv(filename: string, csv: string) {
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportActiveStock() {
    const active = getActiveEntries();
    const { getFishById } = require("@/lib/fish-data");
    const rows = active.map((e: typeof active[0]) => {
      const fish = getFishById(e.fishId, customFish);
      return [
        fish?.localName ?? e.fishId,
        fish?.name ?? "",
        e.weightKg.toFixed(1),
        e.grade,
        new Date(e.enteredAt).toLocaleString("id-ID"),
        e.enteredBy === "admin_gudang" ? "Admin" : "Pemilik",
        e.qrCode,
      ].join(",");
    });
    const header = "Nama Lokal,Nama Indonesia,Berat (kg),Grade,Tanggal Masuk,Dicatat Oleh,QR Code";
    downloadCsv(`stok-aktif-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...rows].join("\n"));
  }

  function exportHistory() {
    const { getFishById } = require("@/lib/fish-data");
    const entryRows = entries.map((e: typeof entries[0]) => {
      const fish = getFishById(e.fishId, customFish);
      return [
        "MASUK",
        fish?.localName ?? e.fishId,
        fish?.name ?? "",
        e.weightKg.toFixed(1),
        e.grade,
        new Date(e.enteredAt).toLocaleString("id-ID"),
        e.enteredBy === "admin_gudang" ? "Admin" : "Pemilik",
      ].join(",");
    });
    const exitRows = exits.map((ex: typeof exits[0]) => {
      const entry = entries.find((e: typeof entries[0]) => e.id === ex.stockEntryId);
      const fish = entry ? getFishById(entry.fishId, customFish) : null;
      return [
        "KELUAR",
        fish?.localName ?? ex.stockEntryId,
        fish?.name ?? "",
        entry?.weightKg.toFixed(1) ?? "",
        entry?.grade ?? "",
        new Date(ex.exitedAt).toLocaleString("id-ID"),
        ex.exitedBy === "admin_gudang" ? "Admin" : "Pemilik",
      ].join(",");
    });
    const header = "Tipe,Nama Lokal,Nama Indonesia,Berat (kg),Grade,Tanggal,Dicatat Oleh";
    downloadCsv(`riwayat-${new Date().toISOString().slice(0, 10)}.csv`, [header, ...entryRows, ...exitRows].join("\n"));
  }

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-2">
      <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-3 mb-3">
          <FileSpreadsheet className="h-6 w-6 text-[var(--color-primary)]" />
          <div>
            <p className="font-bold text-[var(--color-foreground)]">Stok Aktif</p>
            <p className="text-xs text-[var(--color-muted)]">Export semua stok yang ada di cold storage saat ini</p>
          </div>
        </div>
        <button
          onClick={exportActiveStock}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-sm font-bold text-white active:scale-[0.97] transition-transform"
        >
          <Download className="h-5 w-5" />
          Download CSV Stok Aktif
        </button>
      </div>

      <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-3 mb-3">
          <FileSpreadsheet className="h-6 w-6 text-[var(--color-warning)]" />
          <div>
            <p className="font-bold text-[var(--color-foreground)]">Riwayat Lengkap</p>
            <p className="text-xs text-[var(--color-muted)]">Export semua data masuk dan keluar</p>
          </div>
        </div>
        <button
          onClick={exportHistory}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-foreground)] text-sm font-bold text-[var(--color-background)] active:scale-[0.97] transition-transform"
        >
          <Download className="h-5 w-5" />
          Download CSV Riwayat
        </button>
      </div>

      <div className="rounded-xl border border-[#BA1A1A]/30 bg-[#BA1A1A]/5 p-5 md:col-span-2">
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="h-6 w-6 text-[#BA1A1A]" />
          <div>
            <p className="font-bold text-[#BA1A1A]">Reset Semua Data</p>
            <p className="text-xs text-[var(--color-muted)]">Hapus semua stok, riwayat, pengguna, dan kode undangan dari lokal dan server</p>
          </div>
        </div>
        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#BA1A1A] text-sm font-bold text-white active:scale-[0.97] transition-transform"
        >
          <Trash2 className="h-5 w-5" />
          Reset Semua Data
        </button>
      </div>

      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !resetting && setShowResetConfirm(false)}
          />
          <div className="relative mx-4 mb-6 w-full max-w-[398px] rounded-2xl bg-white p-6 shadow-xl animate-[slideUp_0.3s_ease-out]">
            <div className="flex flex-col items-center gap-3 pt-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE2E2]">
                <AlertTriangle size={22} className="text-[#BA1A1A]" />
              </div>
              <h3 className="text-lg font-bold text-[#1C1B1B]">Reset semua data?</h3>
              <p className="text-sm text-[#444748] text-center">
                Semua stok, riwayat, pengguna, dan kode undangan akan dihapus permanen dari perangkat ini dan server. Tindakan ini tidak bisa dibatalkan.
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="flex-1 rounded-xl bg-[#BA1A1A] py-3 text-sm font-bold text-white active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={async () => {
                  setResetting(true);
                  await resetAllData();
                  setShowResetConfirm(false);
                  router.replace("/");
                }}
                disabled={resetting}
                className="flex-1 rounded-xl border border-[#E5E2E1] bg-white py-3 text-sm font-bold text-[#1C1B1B] active:scale-[0.97] transition-transform disabled:opacity-50"
              >
                {resetting ? "Menghapus..." : "Ya, Reset"}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-primary)] p-4">
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--color-muted)]">Nama Lokal</label>
          <input
            type="text"
            value={localName}
            onChange={(e) => onLocalNameChange(e.target.value)}
            placeholder="cth. Pari"
            className="h-12 w-full rounded-xl border border-gray-300 bg-[var(--color-background)] px-4 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--color-muted)]">Nama Indonesia</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="cth. Ikan Pari"
            className="h-12 w-full rounded-xl border border-gray-300 bg-[var(--color-background)] px-4 text-base text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-[var(--color-muted)]">Kategori</label>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="h-12 rounded-xl">
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
          <label className="mb-1 block text-xs font-bold text-[var(--color-muted)]">Shelf Life (jam)</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onShelfLifeChange(Math.max(1, shelfLife - 1))}
              className="flex h-12 w-14 items-center justify-center rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-lg font-bold text-[var(--color-foreground)] active:scale-95 transition-transform"
            >
              -
            </button>
            <span className="min-w-[48px] text-center text-lg font-extrabold text-[var(--color-foreground)]">
              {shelfLife}
            </span>
            <button
              onClick={() => onShelfLifeChange(shelfLife + 1)}
              className="flex h-12 w-14 items-center justify-center rounded-xl bg-[var(--color-background)] border border-[var(--color-border)] text-lg font-bold text-[var(--color-foreground)] active:scale-95 transition-transform"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] text-sm font-bold text-[var(--color-on-primary)] active:scale-[0.97] transition-transform"
          >
            <Check className="h-4 w-4" />
            Simpan
          </button>
          <button
            onClick={onCancel}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold text-[var(--color-muted)] active:scale-[0.97] transition-transform"
          >
            <X className="h-4 w-4" />
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
