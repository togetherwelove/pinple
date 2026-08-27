import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfiguration } from "@/lib/supabase/config";

export function createClient() {
  const { publishableKey, url } = supabaseConfiguration();

  return createBrowserClient(url, publishableKey);
}
