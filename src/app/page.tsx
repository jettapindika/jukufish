"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Fish, ChevronLeft, Warehouse, Crown, Copy, Check, Eye, EyeOff, Clock } from "lucide-react";
import { useFishStore } from "@/lib/store";
import { syncRegisterUser, syncLoginUser, syncCheckEmail, syncSaveInviteCode, syncGetActiveInviteCode } from "@/lib/auth-sync";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/lib/types";

type Screen = "loading" | "setup" | "welcome" | "login" | "register";

function CalHeading({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <h1
      className={className}
      style={{ fontFamily: '"Cal Sans", var(--font-inter)' }}
    >
      {children}
    </h1>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
  helper,
  error,
  suffix,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  inputMode?: "numeric" | "email" | "text";
  maxLength?: number;
  helper?: string;
  error?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      <label className="text-sm font-semibold text-[#0e0f0f]">{label}</label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
          className="w-full rounded-[4px] bg-white px-4 text-sm text-[#0e0f0f] placeholder:text-[#8c8b8b] focus:outline-none"
          style={{
            height: 56,
            fontSize: 14,
            boxShadow: error
              ? "rgba(186,26,26,0.7) 0px 0px 0px 2px"
              : "rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 2px 4px 0px",
          }}
        />
        {suffix && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {suffix}
          </div>
        )}
      </div>
      {helper && !error && (
        <p className="text-xs text-[#8c8b8b]">{helper}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-[#BA1A1A]">{error}</p>
      )}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-[4px] bg-[#242424] text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ height: 56, boxShadow: "var(--shadow-inset), var(--shadow-button)" }}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[4px] bg-white text-sm font-bold text-[#0e0f0f] transition-all active:scale-[0.98]"
      style={{ height: 56, boxShadow: "rgba(19,19,22,0.7) 0px 1px 5px -4px, rgba(34,42,53,0.08) 0px 0px 0px 1px, rgba(34,42,53,0.05) 0px 4px 8px 0px" }}
    >
      {children}
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center text-[#0e0f0f] transition-colors active:bg-[#f0f0f0]"
      style={{ width: 48, height: 48, borderRadius: 8 }}
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  );
}

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

function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <InputField
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={(v) => onChange(v.replace(/\D/g, "").slice(0, 6))}
      placeholder={placeholder}
      inputMode="numeric"
      maxLength={6}
      error={error}
      suffix={
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="flex h-10 w-10 items-center justify-center text-[var(--color-muted)]"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      }
    />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("loading");
  const [hydrated, setHydrated] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPin, setLoginPin] = useState("");
  const [loginError, setLoginError] = useState("");

  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regRole, setRegRole] = useState<UserRole | null>(null);
  const [regInviteCode, setRegInviteCode] = useState("");
  const [regPin, setRegPin] = useState("");
  const [regPinConfirm, setRegPinConfirm] = useState("");
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupPinConfirm, setSetupPinConfirm] = useState("");
  const [setupErrors, setSetupErrors] = useState<Record<string, string>>({});
  const [setupDone, setSetupDone] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    const unsub = useFishStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    if (useFishStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state = useFishStore.getState();
    if (state.currentUser) {
      router.push("/dashboard");
      return;
    }
    setScreen("welcome");
  }, [hydrated, router]);

  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = useCallback(async () => {
    setLoginError("");
    if (!loginEmail || !loginPin) {
      setLoginError("Email dan PIN wajib diisi");
      return;
    }
    setLoginLoading(true);
    try {
      let remoteUser = null;
      try {
        remoteUser = await syncLoginUser(loginEmail, loginPin);
      } catch { /* offline */ }

      if (remoteUser) {
        useFishStore.getState().setCurrentUser(remoteUser);
        router.push("/dashboard");
        return;
      }

      let remoteCheck = null;
      try {
        remoteCheck = await syncCheckEmail(loginEmail);
      } catch { /* offline */ }

      if (remoteCheck) {
        if (remoteCheck.approved === false) {
          setLoginError("Akun Anda menunggu persetujuan dari pemilik usaha");
        } else {
          setLoginError("PIN salah");
        }
        return;
      }

      const localUsers = useFishStore.getState().users;
      const localMatch = localUsers.find(
        (u) => u.email.toLowerCase() === loginEmail.toLowerCase() && u.pin === loginPin
      );
      if (localMatch) {
        if (localMatch.approved === false) {
          setLoginError("Akun Anda menunggu persetujuan dari pemilik usaha");
          return;
        }
        try { await syncRegisterUser(localMatch); } catch { /* offline */ }
        useFishStore.getState().setCurrentUser(localMatch);
        router.push("/dashboard");
        return;
      }

      const localEmailMatch = localUsers.find(
        (u) => u.email.toLowerCase() === loginEmail.toLowerCase()
      );
      if (localEmailMatch) {
        if (localEmailMatch.approved === false) {
          setLoginError("Akun Anda menunggu persetujuan dari pemilik usaha");
        } else {
          setLoginError("PIN salah");
        }
        return;
      }

      setLoginError("Email tidak terdaftar");
    } finally {
      setLoginLoading(false);
    }
  }, [loginEmail, loginPin, router]);

  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);

  const handleRegister = useCallback(async () => {
    const errors: Record<string, string> = {};
    if (!regName.trim()) errors.name = "Nama wajib diisi";
    if (!regEmail.trim()) errors.email = "Email wajib diisi";
    else if (!regEmail.includes("@")) errors.email = "Format email tidak valid";
    else {
      let emailExists = false;
      try {
        const existing = await syncCheckEmail(regEmail);
        emailExists = !!existing;
      } catch {
        emailExists = !!useFishStore.getState().users.find(
          (u) => u.email.toLowerCase() === regEmail.toLowerCase()
        );
      }
      if (emailExists) errors.email = "Email sudah terdaftar";
    }
    if (!regRole) errors.role = "Pilih peran Anda";
    if (regInviteCode.trim()) {
      const inputCode = regInviteCode.trim().toUpperCase();
      let valid = false;

      try {
        const { data } = await supabase
          .from("invite_codes")
          .select("code")
          .eq("active", true);
        if (data && data.length > 0) {
          valid = data.some((row: { code: string }) => row.code.toUpperCase() === inputCode);
        }
      } catch {
        valid = false;
      }

      if (!valid) {
        const localValid = useFishStore.getState().validateInviteCode(inputCode);
        valid = !!localValid;
      }

      if (!valid) {
        errors.inviteCode = "Kode undangan tidak valid";
      }
    }
    if (!regPin) errors.pin = "PIN wajib diisi";
    else if (regPin.length !== 6) errors.pin = "PIN harus 6 angka";
    if (!regPinConfirm) errors.pinConfirm = "Konfirmasi PIN wajib diisi";
    else if (regPin !== regPinConfirm) errors.pinConfirm = "PIN tidak cocok";
    setRegErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setRegLoading(true);
    try {
      const user = useFishStore.getState().registerUser(regName.trim(), regEmail.trim(), regRole!, regPin);
      try { await syncRegisterUser(user); } catch { /* offline */ }

      if (regRole === "admin_gudang") {
        setRegSuccess(true);
      } else {
        const code = useFishStore.getState().generateInviteCode("admin_gudang");
        try { await syncSaveInviteCode(code, user.id); } catch { /* offline */ }
        useFishStore.getState().setCurrentUser(user);
        router.push("/dashboard");
      }
    } finally {
      setRegLoading(false);
    }
  }, [regName, regEmail, regRole, regInviteCode, regPin, regPinConfirm, router]);

  const validateSetup = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!setupName.trim()) errors.name = "Nama wajib diisi";
    if (!setupEmail.trim()) errors.email = "Email wajib diisi";
    else if (!setupEmail.includes("@")) errors.email = "Format email tidak valid";
    if (!setupPin) errors.pin = "PIN wajib diisi";
    else if (setupPin.length !== 4) errors.pin = "PIN harus 4 digit";
    if (!setupPinConfirm) errors.pinConfirm = "Konfirmasi PIN wajib diisi";
    else if (setupPin !== setupPinConfirm) errors.pinConfirm = "PIN tidak cocok";
    setSetupErrors(errors);
    return Object.keys(errors).length === 0;
  }, [setupName, setupEmail, setupPin, setupPinConfirm]);

  const handleSetup = useCallback(async () => {
    if (!validateSetup()) return;
    const user = useFishStore.getState().registerUser(setupName.trim(), setupEmail.trim(), "pemilik", setupPin);
    try { await syncRegisterUser(user); } catch { /* offline */ }
    useFishStore.getState().setCurrentUser(user);
    const code = useFishStore.getState().generateInviteCode("admin_gudang");
    try { await syncSaveInviteCode(code, user.id); } catch { /* offline */ }
    setGeneratedCode(code);
    setSetupDone(true);
  }, [validateSetup, setupName, setupEmail, setupPin]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }, [generatedCode]);

  if (screen === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-primary)]">
            <Fish className="h-6 w-6 text-[var(--color-on-primary)]" />
          </div>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-[var(--color-border)]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--color-primary)]" />
          </div>
        </div>
      </div>
    );
  }

  if (screen === "setup") {
    if (setupDone) {
      return (
        <div className="flex min-h-dvh flex-col bg-[var(--color-background)]">
          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="w-full max-w-sm">
              <div className="mb-8 flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]">
                  <Check className="h-9 w-9 text-[var(--color-on-primary)]" />
                </div>
                <CalHeading className="text-2xl font-semibold text-[var(--color-foreground)]">
                  Akun Dibuat
                </CalHeading>
              </div>
              <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="mb-3 text-sm text-[var(--color-muted)]">
                  Kode undangan untuk admin gudang:
                </p>
                <div className="flex items-center gap-3">
                  <code className="flex-1 rounded-[var(--radius)] bg-[var(--color-foreground)]/5 px-4 py-3 text-center text-xl font-bold tracking-[0.2em] text-[var(--color-foreground)]">
                    {generatedCode}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius)] border border-[var(--color-border)] text-[var(--color-foreground)] transition-colors active:bg-[var(--color-border)]"
                  >
                    {codeCopied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-3 text-xs text-[var(--color-muted)]">
                  Berikan kode ini kepada admin gudang untuk mendaftar
                </p>
              </div>
              <PrimaryButton onClick={() => router.push("/dashboard")}>
                Lanjut ke Dashboard
              </PrimaryButton>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-dvh flex-col bg-[var(--color-background)]">
        <div className="flex flex-1 flex-col px-6 pt-8 pb-12">
          <div className="mb-8 flex flex-col items-center gap-2">
            <Logo />
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4" style={{ boxShadow: "var(--shadow-card)" }}>
              <CalHeading className="mb-1 text-lg font-semibold text-[var(--color-foreground)]">
                Setup Awal
              </CalHeading>
              <p className="text-sm text-[var(--color-muted)]">
                Selamat datang di Juku! Buat akun pemilik usaha pertama.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <InputField
                label="Nama Lengkap"
                value={setupName}
                onChange={setSetupName}
                placeholder="Nama lengkap Anda"
                error={setupErrors.name}
              />
              <InputField
                label="Email"
                type="email"
                value={setupEmail}
                onChange={setSetupEmail}
                placeholder="Email Anda"
                inputMode="email"
                error={setupErrors.email}
              />
              <PasswordInput
                label="PIN"
                value={setupPin}
                onChange={setSetupPin}
                placeholder="Buat PIN 4 digit"
                error={setupErrors.pin}
              />
              <PasswordInput
                label="Konfirmasi PIN"
                value={setupPinConfirm}
                onChange={setSetupPinConfirm}
                placeholder="Ulangi PIN"
                error={setupErrors.pinConfirm}
              />
              <div className="mt-2">
                <PrimaryButton onClick={handleSetup}>
                  Buat Akun Pemilik
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "welcome") {
    return (
      <div className="flex min-h-dvh flex-col justify-between bg-white" style={{ padding: "52px 16px" }}>
        <div className="flex flex-col items-center" style={{ marginBottom: 32 }}>
          <Logo />
        </div>
        <div className="flex w-full flex-col items-center" style={{ gap: 8 }}>
          <div className="w-full" style={{ maxWidth: 358 }}>
            <PrimaryButton onClick={() => setScreen("login")}>
              Masuk
            </PrimaryButton>
          </div>
          <div className="w-full" style={{ maxWidth: 358 }}>
            <GhostButton onClick={() => setScreen("register")}>
              Daftar Baru
            </GhostButton>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "login") {
    return (
      <div className="flex min-h-dvh flex-col bg-[#FDF8F8]">
        <div className="px-3 pt-3">
          <BackButton onClick={() => { setScreen("welcome"); setLoginError(""); setLoginEmail(""); setLoginPin(""); }} />
        </div>
        <div className="flex flex-1 flex-col px-6 pt-4 pb-12">
          <div className="mx-auto w-full max-w-sm">
            <h1
              className="mb-1"
              style={{
                color: "#1C1B1B",
                fontFamily: "Helvetica, sans-serif",
                fontSize: 32,
                fontStyle: "normal",
                fontWeight: 700,
                lineHeight: "38.4px",
                letterSpacing: "-0.8px",
              }}
            >
              Login di Juku
            </h1>
            <p className="mb-8 text-sm text-[var(--color-muted)]">
              Masukkan data diri yang sudah di daftarkan.
            </p>
            <div className="flex flex-col gap-4">
              <InputField
                label="Email"
                type="email"
                value={loginEmail}
                onChange={(v) => { setLoginEmail(v); setLoginError(""); }}
                placeholder="contoh@email.com"
                inputMode="email"
              />
              <PasswordInput
                label="PIN"
                value={loginPin}
                onChange={(v) => { setLoginPin(v); setLoginError(""); }}
                placeholder="••••••"
              />
              {loginError && (
                <p className="text-sm text-[var(--color-critical)]">{loginError}</p>
              )}
              <div className="mt-2">
                <PrimaryButton onClick={handleLogin}>
                  Masuk
                </PrimaryButton>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => { setScreen("register"); setLoginError(""); }}
                className="font-semibold text-[var(--color-foreground)] underline underline-offset-2"
              >
                Daftar
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "register" && regSuccess) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-background)] px-6">
        <div className="mx-auto w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
            <Clock className="h-8 w-8 text-[var(--color-warning)]" />
          </div>
          <CalHeading className="mb-2 text-xl font-semibold text-[var(--color-foreground)]">
            Menunggu Persetujuan
          </CalHeading>
          <p className="text-sm text-[var(--color-muted)] mb-8">
            Akun Anda telah dibuat. Pemilik usaha perlu menyetujui akun Anda sebelum bisa digunakan.
          </p>
          <button
            type="button"
            onClick={() => { setScreen("welcome"); setRegSuccess(false); }}
            className="h-14 w-full rounded-[var(--radius)] bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-on-primary)] active:scale-[0.98] transition-transform"
          >
            Kembali ke Halaman Utama
          </button>
        </div>
      </div>
    );
  }

  if (screen === "register") {
    return (
      <div className="flex min-h-dvh flex-col bg-[#FDF8F8]">
        <div className="px-3 pt-3">
          <BackButton onClick={() => { setScreen("welcome"); setRegErrors({}); }} />
        </div>
        <div className="flex flex-1 flex-col px-6 pt-4 pb-12 overflow-y-auto">
          <div className="mx-auto w-full max-w-sm">
            <h1
              className="mb-1"
              style={{
                color: "#1C1B1B",
                fontFamily: "Helvetica, sans-serif",
                fontSize: 32,
                fontStyle: "normal",
                fontWeight: 700,
                lineHeight: "38.4px",
                letterSpacing: "-0.8px",
              }}
            >
              Daftar di Juku
            </h1>
            <p className="mb-8 text-sm text-[var(--color-muted)]">
              Lengkapi data diri untuk memulai.
            </p>
            <div className="flex flex-col gap-4">
              <InputField
                label="Nama Lengkap"
                value={regName}
                onChange={setRegName}
                placeholder="Masukkan nama lengkap"
                error={regErrors.name}
              />
              <InputField
                label="Email"
                type="email"
                value={regEmail}
                onChange={setRegEmail}
                placeholder="contoh@email.com"
                inputMode="email"
                error={regErrors.email}
              />
              <div className="flex flex-col" style={{ gap: 8 }}>
                <label className="text-sm font-semibold text-[#0e0f0f]">Pilih Peran</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setRegRole("admin_gudang"); setRegErrors((e) => { const { role, ...rest } = e; return rest; }); }}
                    className="relative flex flex-1 flex-col items-center justify-center rounded bg-white transition-all active:scale-[0.98]"
                    style={{
                      height: 100,
                      boxShadow: regRole === "admin_gudang"
                        ? "inset 0 0 0 2px #0e0f0f, 0 4px 8px rgba(0,0,0,0.08)"
                        : "inset 0 0 0 1px #e5e5e5, 0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <svg className="mb-1" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 20C2.45 20 1.97917 19.8042 1.5875 19.4125C1.19583 19.0208 1 18.55 1 18V6.725C0.7 6.54167 0.458333 6.30417 0.275 6.0125C0.0916667 5.72083 0 5.38333 0 5V2C0 1.45 0.195833 0.979167 0.5875 0.5875C0.979167 0.195833 1.45 0 2 0H18C18.55 0 19.0208 0.195833 19.4125 0.5875C19.8042 0.979167 20 1.45 20 2V5C20 5.38333 19.9083 5.72083 19.725 6.0125C19.5417 6.30417 19.3 6.54167 19 6.725V18C19 18.55 18.8042 19.0208 18.4125 19.4125C18.0208 19.8042 17.55 20 17 20H3V20M2 5H18V5V5V2V2V2H2V2V2V5V5V5V5M7 12H13V10H7V12V12" fill="currentColor" />
                    </svg>
                    <p className="text-sm font-semibold text-[#0e0f0f]">Admin Gudang</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setRegRole("pemilik"); setRegErrors((e) => { const { role, inviteCode, ...rest } = e; return rest; }); }}
                    className="relative flex flex-1 flex-col items-center justify-center rounded bg-white transition-all active:scale-[0.98]"
                    style={{
                      height: 100,
                      boxShadow: regRole === "pemilik"
                        ? "inset 0 0 0 2px #0e0f0f, 0 4px 8px rgba(0,0,0,0.08)"
                        : "inset 0 0 0 1px #e5e5e5, 0 1px 2px rgba(0,0,0,0.05)",
                    }}
                  >
                    <svg className="mb-1" width="21" height="18" viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19.0469 8.05V16C19.0469 16.55 18.8511 17.0208 18.4594 17.4125C18.0678 17.8042 17.5969 18 17.0469 18H3.04694C2.49694 18 2.02611 17.8042 1.63444 17.4125C1.24277 17.0208 1.04694 16.55 1.04694 16V8.05C0.663605 7.7 0.367772 7.25 0.159439 6.7C-0.0488946 6.15 -0.0530612 5.55 0.146939 4.9L1.19694 1.5C1.33027 1.06667 1.56777 0.708333 1.90944 0.425C2.25111 0.141667 2.64694 0 3.09694 0H16.9969C17.4469 0 17.8386 0.1375 18.1719 0.4125C18.5053 0.6875 18.7469 1.05 18.8969 1.5L19.9469 4.9C20.1469 5.55 20.1428 6.14167 19.9344 6.675C19.7261 7.20833 19.4303 7.66667 19.0469 8.05V8.05M12.2469 7C12.6969 7 13.0386 6.84583 13.2719 6.5375C13.5053 6.22917 13.5969 5.88333 13.5469 5.5L12.9969 2H11.0469V5.7C11.0469 6.05 11.1636 6.35417 11.3969 6.6125C11.6303 6.87083 11.9136 7 12.2469 7V7M7.74694 7C8.13027 7 8.44277 6.87083 8.68444 6.6125C8.92611 6.35417 9.04694 6.05 9.04694 5.7V2H7.09694L6.54694 5.5C6.48027 5.9 6.56777 6.25 6.80944 6.55C7.05111 6.85 7.36361 7 7.74694 7V7M3.29694 7C3.59694 7 3.85944 6.89167 4.08444 6.675C4.30944 6.45833 4.44694 6.18333 4.49694 5.85L5.04694 2H3.09694V2V2L2.09694 5.35C1.99694 5.68333 2.05111 6.04167 2.25944 6.425C2.46777 6.80833 2.81361 7 3.29694 7V7M16.7969 7C17.2803 7 17.6303 6.80833 17.8469 6.425C18.0636 6.04167 18.1136 5.68333 17.9969 5.35L16.9469 2V2V2H15.0469L15.5969 5.85C15.6469 6.18333 15.7844 6.45833 16.0094 6.675C16.2344 6.89167 16.4969 7 16.7969 7V7M3.04694 16H17.0469V16V16V8.95C16.9636 8.98333 16.9094 9 16.8844 9C16.8594 9 16.8303 9 16.7969 9C16.3469 9 15.9511 8.925 15.6094 8.775C15.2678 8.625 14.9303 8.38333 14.5969 8.05C14.2969 8.35 13.9553 8.58333 13.5719 8.75C13.1886 8.91667 12.7803 9 12.3469 9C11.8969 9 11.4761 8.91667 11.0844 8.75C10.6928 8.58333 10.3469 8.35 10.0469 8.05C9.76361 8.35 9.43444 8.58333 9.05944 8.75C8.68444 8.91667 8.28027 9 7.84694 9C7.36361 9 6.92611 8.91667 6.53444 8.75C6.14277 8.58333 5.79694 8.35 5.49694 8.05C5.14694 8.4 4.80111 8.64583 4.45944 8.7875C4.11777 8.92917 3.73027 9 3.29694 9C3.26361 9 3.22611 9 3.18444 9C3.14277 9 3.09694 8.98333 3.04694 8.95V16V16V16V16M17.0469 16H3.04694V16V16V16C3.09694 16 3.14277 16 3.18444 16C3.22611 16 3.26361 16 3.29694 16C3.73027 16 4.11777 16 4.45944 16C4.80111 16 5.14694 16 5.49694 16C5.64694 16 5.80944 16 5.98444 16C6.15944 16 6.34694 16 6.54694 16C6.74694 16 6.95527 16 7.17194 16C7.38861 16 7.61361 16 7.84694 16C8.06361 16 8.27194 16 8.47194 16C8.67194 16 8.86777 16 9.05944 16C9.25111 16 9.43027 16 9.59694 16C9.76361 16 9.91361 16 10.0469 16C10.3469 16 10.6928 16 11.0844 16C11.4761 16 11.8969 16 12.3469 16C12.5636 16 12.7719 16 12.9719 16C13.1719 16 13.3678 16 13.5594 16C13.7511 16 13.9344 16 14.1094 16C14.2844 16 14.4469 16 14.5969 16C14.9303 16 15.2678 16 15.6094 16C15.9511 16 16.3469 16 16.7969 16C16.8303 16 16.8594 16 16.8844 16C16.9094 16 16.9636 16 17.0469 16V16V16V16V16" fill="currentColor" />
                    </svg>
                    <p className="text-sm font-semibold text-[#0e0f0f]">Pemilik Usaha</p>
                  </button>
                </div>
                {regErrors.role && (
                  <p className="text-xs font-medium text-[#BA1A1A]">{regErrors.role}</p>
                )}
              </div>
              {regRole === "admin_gudang" && (
                <InputField
                  label="Kode Undangan"
                  value={regInviteCode}
                  onChange={(v) => setRegInviteCode(v.toUpperCase())}
                  placeholder="Masukkan kode undangan"
                  error={regErrors.inviteCode}
                />
              )}
              <PasswordInput
                label="Buat PIN (6 Angka)"
                value={regPin}
                onChange={setRegPin}
                placeholder="••••••"
                error={regErrors.pin}
              />
              <PasswordInput
                label="Konfirmasi PIN (6 Angka)"
                value={regPinConfirm}
                onChange={setRegPinConfirm}
                placeholder="••••••"
                error={regErrors.pinConfirm}
              />
              <div className="mt-2">
                <PrimaryButton onClick={handleRegister}>
                  Daftar
                </PrimaryButton>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={() => { setScreen("login"); setRegErrors({}); }}
                className="font-semibold text-[var(--color-foreground)] underline underline-offset-2"
              >
                Masuk
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
