import { Redirect } from "expo-router";
import { useAuthStore } from "../store/authStore";

/**
 * Entry route: bounce to the tabs (signed in) or the onboarding flow.
 * The root layout guard also enforces this, but an explicit Redirect here
 * avoids a flash of the wrong screen on cold start.
 */
export default function Index() {
  const status = useAuthStore((s) => s.status);

  if (status === "authenticated") return <Redirect href="/(tabs)" />;
  return <Redirect href="/onboarding" />;
}
