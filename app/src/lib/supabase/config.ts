const SUPABASE_CONFIGURATION_ERROR =
  "Supabase public environment variables are required.";

export function supabaseConfiguration() {
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!publishableKey || !url) {
    throw new Error(SUPABASE_CONFIGURATION_ERROR);
  }

  return { publishableKey, url };
}
