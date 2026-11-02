import { supabase } from "../lib/supabase";
import { unwrap } from "./errors";

export function signIn() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/home` },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}

export async function getProfile(userId) {
  return unwrap(
    await supabase.from("profiles").select("*").eq("id", userId).single(),
  );
}
