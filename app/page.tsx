import { Dashboard } from "@/app/components/dashboard";
import { getAppSnapshot } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snapshot = await getAppSnapshot();

  return (
    <main className="app-shell">
      <Dashboard initialSnapshot={snapshot} />
    </main>
  );
}
