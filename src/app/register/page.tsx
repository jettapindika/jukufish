"use client";

import { useState } from "react";
import { Fish, Eye, EyeOff } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";

function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-[#242424]" style={{ marginBottom: 24 }}>
        <Fish className="h-7 w-7 text-white" />
      </div>
      <h1 className="text-[32px] font-bold text-[#0e0f0f] tracking-tight" style={{ fontFamily: '"Cal Sans", system-ui, sans-serif', marginBottom: 4 }}>
        Juku
      </h1>
      <p className="text-base text-[#8c8b8b]">Inventori Ikan Paotere</p>
    </div>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  showPasswordToggle,
  onTogglePassword,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  showPasswordToggle?: boolean;
  onTogglePassword?: () => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <label className="text-sm font-bold text-[#0e0f0f]">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-14 w-full rounded-[4px] bg-white px-4 text-sm text-[#0e0f0f] placeholder:text-[#8c8b8b] focus:outline-none"
          style={{
            boxShadow: error
              ? "rgba(186,26,26,0.7) 0px 0px 0px 2px"
              : "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 2px 4px 0px",
          }}
        />
        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-4 top-1/2 -translate-y-1/2"
          >
            {type === "password" ? (
              <EyeOff className="h-5 w-5 text-[#8c8b8b]" />
            ) : (
              <Eye className="h-5 w-5 text-[#8c8b8b]" />
            )}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs font-medium text-[#BA1A1A]">{error}</span>
      )}
    </div>
  );
}

function RoleSelector({
  value,
  onChange,
  error,
}: {
  value: UserRole | "";
  onChange: (role: UserRole) => void;
  error?: string;
}) {
  const roles: { value: UserRole; label: string }[] = [
    { value: "admin_gudang", label: "Admin Gudang" },
    { value: "pemilik", label: "Pemilik" },
  ];

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <label className="text-sm font-bold text-[#0e0f0f]">Peran</label>
      <div className="flex" style={{ gap: 8 }}>
        {roles.map((role) => (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className="flex-1 h-14 rounded-[4px] text-sm font-bold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: value === role.value ? "#242424" : "#FFFFFF",
              color: value === role.value ? "#FFFFFF" : "#0e0f0f",
              boxShadow:
                value === role.value
                  ? "var(--shadow-inset), var(--shadow-button)"
                  : error
                  ? "rgba(186,26,26,0.7) 0px 0px 0px 2px"
                  : "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 2px 4px 0px",
            }}
          >
            {role.label}
          </button>
        ))}
      </div>
      {error && (
        <span className="text-xs font-medium text-[#BA1A1A]">{error}</span>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-14 w-full rounded-[4px] bg-[#242424] text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ boxShadow: "var(--shadow-inset), var(--shadow-button)" }}
    >
      {children}
    </button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useFishStore((s) => s.registerUser);
  const validateInviteCode = useFishStore((s) => s.validateInviteCode);
  const useInviteCode = useFishStore((s) => s.useInviteCode);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole | "">("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    role?: string;
    pin?: string;
    confirmPin?: string;
    inviteCode?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!role) {
      newErrors.role = "Pilih peran Anda";
    }

    if (!pin) {
      newErrors.pin = "PIN wajib diisi";
    } else if (pin.length < 4) {
      newErrors.pin = "PIN minimal 4 karakter";
    }

    if (!confirmPin) {
      newErrors.confirmPin = "Konfirmasi PIN wajib diisi";
    } else if (pin !== confirmPin) {
      newErrors.confirmPin = "PIN tidak cocok";
    }

    if (role !== "admin_gudang" && !inviteCode.trim()) {
      newErrors.inviteCode = "Kode undangan wajib untuk Pemilik";
    } else if (role !== "admin_gudang" && inviteCode.trim()) {
      const validCode = validateInviteCode(inviteCode.trim());
      if (!validCode) {
        newErrors.inviteCode = "Kode undangan tidak valid";
      } else if (validCode.role !== role) {
        newErrors.inviteCode = `Kode ini untuk ${validCode.role === "admin_gudang" ? "Admin Gudang" : "Pemilik"}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    try {
      const user = registerUser(name.trim(), email.trim(), role as UserRole, pin);
      
      if (role === "pemilik" && inviteCode.trim()) {
        useInviteCode(inviteCode.trim(), user.id);
      }

      const { syncRegisterUser } = await import("@/lib/auth-sync");
      await syncRegisterUser(user);

      router.push("/");
    } catch (error) {
      setErrors({ email: "Email sudah terdaftar" });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white" style={{ padding: "52px 16px" }}>
      <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
        <Logo />
      </div>

      <div className="flex w-full flex-col items-center" style={{ gap: 16 }}>
        <div className="w-full" style={{ maxWidth: 358 }}>
          <div className="flex flex-col" style={{ gap: 16 }}>
            <InputField
              label="Nama Lengkap"
              value={name}
              onChange={setName}
              placeholder="Masukkan nama lengkap"
              error={errors.name}
            />

            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="nama@email.com"
              error={errors.email}
            />

            <RoleSelector value={role} onChange={setRole} error={errors.role} />

            {role === "pemilik" && (
              <InputField
                label="Kode Undangan"
                value={inviteCode}
                onChange={setInviteCode}
                placeholder="Masukkan kode undangan"
                error={errors.inviteCode}
              />
            )}

            <InputField
              label="PIN"
              type={showPin ? "text" : "password"}
              value={pin}
              onChange={setPin}
              placeholder="Minimal 4 karakter"
              error={errors.pin}
              showPasswordToggle
              onTogglePassword={() => setShowPin(!showPin)}
            />

            <InputField
              label="Konfirmasi PIN"
              type={showConfirmPin ? "text" : "password"}
              value={confirmPin}
              onChange={setConfirmPin}
              placeholder="Masukkan ulang PIN"
              error={errors.confirmPin}
              showPasswordToggle
              onTogglePassword={() => setShowConfirmPin(!showConfirmPin)}
            />

            <div style={{ marginTop: 8 }}>
              <PrimaryButton onClick={handleRegister}>
                Daftar
              </PrimaryButton>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm font-medium text-[#8c8b8b] hover:text-[#0e0f0f]"
              >
                Sudah punya akun? Masuk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
