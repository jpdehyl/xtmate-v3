import type { ComponentType } from 'react';
import { FileText, Activity, ShieldCheck, DollarSign } from 'lucide-react';

interface MetricEstimate {
  status: string | null;
  total: number | null;
}

interface DashboardMetricsProps {
  estimates: MetricEstimate[];
  activeCount: number;
}

function metricCard(label: string, value: string, Icon: ComponentType<{ className?: string }>) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm dark:border-ink-800 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">{label}</p>
        <div className="rounded-lg bg-pd-gold/15 p-2">
          <Icon className="h-4 w-4 text-pd-gold" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-ink-950 dark:text-white">{value}</p>
    </div>
  );
}

export function DashboardMetrics({ estimates, activeCount }: DashboardMetricsProps) {
  const totalEstimates = estimates.length;
  const completed = estimates.filter((estimate) => estimate.status === 'completed').length;
  const slaCompliance = totalEstimates > 0 ? Math.round((completed / totalEstimates) * 100) : 0;
  const revenuePipeline = estimates.reduce((sum, estimate) => sum + (estimate.total ?? 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metricCard('Total Estimates', totalEstimates.toString(), FileText)}
      {metricCard('Active Claims', activeCount.toString(), Activity)}
      {metricCard('SLA Compliance', `${slaCompliance}%`, ShieldCheck)}
      {metricCard('Revenue Pipeline', formatCurrency(revenuePipeline), DollarSign)}
    </section>
  );
}
