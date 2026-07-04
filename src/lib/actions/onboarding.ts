"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export async function completeOnboardingAction() {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı" };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/buro");
  return { success: true };
}

export async function saveSpecializationsAction(data: {
  specializations: string[];
  bar_city: string;
}) {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı" };

  const { error } = await supabase
    .from("profiles")
    .update({
      specializations: data.specializations,
      bar_city: data.bar_city || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function addFirstClientAction(data: {
  full_name: string;
  phone: string;
}) {
  const supabase = createClient() as AnyClient;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Oturum bulunamadı" };

  const { error } = await supabase
    .from("clients")
    .insert({
      lawyer_id: user.id,
      full_name: data.full_name,
      phone: data.phone || null,
    });

  if (error) return { error: error.message };
  return { success: true };
}
