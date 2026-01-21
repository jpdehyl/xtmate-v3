import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Smartphone,
  Brain,
  FileSpreadsheet,
  Clock,
  Shield,
  Users,
} from "lucide-react";

// Force dynamic rendering - checks auth state
export const dynamic = "force-dynamic";

export default async function LandingPage() {
  // Only check auth if Clerk is configured
  if (process.env.CLERK_SECRET_KEY) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-background dark:to-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-gray-100 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pd-gold-400 to-pd-gold-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">PD</span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    PAUL
                  </span>
                  <span className="text-xl font-bold text-pd-gold tracking-tight">
                    DAVIS
                  </span>
                </div>
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 tracking-[0.2em] uppercase">
                  XtMate
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-pd-gold hover:bg-pd-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-pd-gold-50 dark:bg-pd-gold-900/20 text-pd-gold-700 dark:text-pd-gold-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Smartphone className="w-4 h-4" />
              iPhone LiDAR + AI-Powered Estimating
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
              Property Claims,{" "}
              <span className="text-pd-gold">Simplified</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Transform restoration claims processing with LiDAR room capture,
              AI-generated scopes, and direct Xactimate export. From site visit
              to approved estimate in record time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-pd-gold hover:bg-pd-gold-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-pd-gold/25 hover:shadow-xl hover:shadow-pd-gold/30"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-8 py-4 text-lg font-medium transition-colors"
              >
                See How It Works
              </Link>
            </div>
          </div>

          {/* Hero Image/Demo */}
          <div className="mt-16 relative">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl overflow-hidden aspect-video max-w-5xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-pd-gold/10 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                    <svg
                      className="w-10 h-10"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">Watch Demo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-card border-y border-gray-100 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                75%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Faster Estimates
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                2 min
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Per Room Capture
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                95%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                AI Accuracy
              </div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                100%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Xactimate Compatible
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need for Faster Claims
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From initial site visit to final export, XtMate streamlines every
              step of the restoration estimating process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="LiDAR Room Capture"
              description="Scan rooms in seconds using your iPhone's LiDAR. Automatically calculate dimensions, square footage, and wall areas."
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6" />}
              title="AI Scope Generation"
              description="Describe the damage, and our AI generates accurate line items based on IICRC standards and your pricing data."
            />
            <FeatureCard
              icon={<FileSpreadsheet className="w-6 h-6" />}
              title="Xactimate Export"
              description="Export directly to ESX format. Your estimates open in Xactimate exactly as you created them."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="SLA Tracking"
              description="Monitor carrier-specific SLAs, track milestones, and never miss a deadline with automated alerts."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="QA Review Queue"
              description="Built-in quality assurance workflow. Review, approve, or send back estimates before export."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Team Management"
              description="Assign PMs, estimators, and field staff. Track performance and manage workloads across your team."
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24 bg-gray-900 text-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              From Site Visit to Export in Minutes
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              See how XtMate transforms your workflow
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <WorkflowStep
              number="1"
              title="Capture"
              description="Scan rooms with LiDAR, snap photos, mark damage areas"
            />
            <WorkflowStep
              number="2"
              title="Generate"
              description="AI creates scope based on damage type and materials"
            />
            <WorkflowStep
              number="3"
              title="Review"
              description="QA team verifies accuracy and pricing"
            />
            <WorkflowStep
              number="4"
              title="Export"
              description="Download ESX file ready for Xactimate"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Ready to Transform Your Estimating Process?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
            Join restoration professionals who are saving hours on every
            estimate with XtMate.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-pd-gold hover:bg-pd-gold-600 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-pd-gold/25 hover:shadow-xl hover:shadow-pd-gold/30"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-card border-t border-gray-100 dark:border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pd-gold-400 to-pd-gold-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PD</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                XtMate by Paul Davis Restoration
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="#"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="#"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-100 dark:border-border shadow-sm hover:shadow-md transition-shadow">
      <div className="w-12 h-12 bg-pd-gold-50 dark:bg-pd-gold-900/20 rounded-lg flex items-center justify-center text-pd-gold mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-pd-gold rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
