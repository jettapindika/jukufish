import { supabase } from "./supabase";
import { UserProfile, InviteCode } from "./types";

export async function syncRegisterUser(user: UserProfile): Promise<boolean> {
  const { error } = await supabase.from("users").upsert({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    pin: user.pin,
    approved: user.approved,
    created_at: user.createdAt,
  });
  return !error;
}

export async function syncLoginUser(email: string, pin: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .eq("pin", pin)
    .single();

  if (error || !data) return null;
  if (data.approved === false) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    pin: data.pin,
    approved: data.approved,
    createdAt: data.created_at,
  };
}

export async function syncCheckEmail(email: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    pin: data.pin,
    approved: data.approved,
    createdAt: data.created_at,
  };
}

export async function syncApproveUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .update({ approved: true })
    .eq("id", userId);
  return !error;
}

export async function syncRejectUser(userId: string): Promise<boolean> {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);
  return !error;
}

export async function syncGetAllUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    role: d.role,
    pin: d.pin,
    approved: d.approved,
    createdAt: d.created_at,
  }));
}

export async function syncGetPendingUsers(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("approved", false)
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    role: d.role,
    pin: d.pin,
    approved: d.approved,
    createdAt: d.created_at,
  }));
}

export async function syncSaveInviteCode(code: string, createdBy: string): Promise<boolean> {
  await supabase.from("invite_codes").update({ active: false }).eq("active", true);

  const { error } = await supabase.from("invite_codes").insert({
    code: code.toUpperCase(),
    created_by: createdBy,
    role: "admin_gudang",
    active: true,
  });
  return !error;
}

export async function syncGetActiveInviteCode(): Promise<string | null> {
  const { data, error } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.code;
}

export async function syncValidateInviteCode(code: string): Promise<boolean> {
  const cleaned = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("invite_codes")
    .select("code")
    .eq("active", true);

  if (error || !data || data.length === 0) return false;

  return data.some((row) => row.code.toUpperCase() === cleaned);
}
