import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@/types/database";

export interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  user_type: UserType;
  phone?: string;
  bar_number?: string;
  bar_city?: string;
}

export interface AuthError {
  message: string;
}

export async function register(data: RegisterData): Promise<{ error: AuthError | null }> {
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.full_name,
        user_type: data.user_type,
        phone: data.phone ?? null,
        bar_number: data.bar_number ?? null,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    return { error: { message: translateAuthError(error.message) } };
  }

  return { error: null };
}

export async function login(
  email: string,
  password: string
): Promise<{ error: AuthError | null; userType?: UserType }> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: { message: translateAuthError(error.message) } };
  }

  // Kullanıcı tipini çek
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type")
    .eq("id", data.user.id)
    .single() as { data: { user_type: UserType } | null };

  return { error: null, userType: profile?.user_type };
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

function translateAuthError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (msg.includes("Email not confirmed")) return "E-postanızı doğrulamanız gerekiyor.";
  if (msg.includes("User already registered")) return "Bu e-posta adresi zaten kayıtlı.";
  if (msg.includes("Password should be at least")) return "Şifre en az 6 karakter olmalıdır.";
  if (msg.includes("rate limit")) return "Çok fazla deneme. Lütfen biraz bekleyin.";
  return "Bir hata oluştu. Lütfen tekrar deneyin.";
}
