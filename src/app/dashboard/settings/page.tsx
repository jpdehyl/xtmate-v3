import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900">
        <h1 className="text-2xl font-semibold text-ink-950 dark:text-white">Settings</h1>
        <p className="mt-2 text-stone-600 dark:text-stone-300">Configure integrations and account preferences.</p>
        <div className="mt-6">
          <Link href="/dashboard/settings/integrations" className="text-pd-gold hover:underline">Go to Integrations</Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
