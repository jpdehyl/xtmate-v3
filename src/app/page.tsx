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
  CheckCircle2,
  Zap,
  Building2,
  Phone,
  Play,
  Star,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  if (process.env.CLERK_SECRET_KEY) {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-ink-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-ink-950/90 backdrop-blur-md border-b border-stone-200/50 dark:border-ink-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-11 h-11 bg-gold-gradient rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:shadow-gold-500/30 transition-shadow duration-300">
                <span className="text-white font-display font-bold text-lg tracking-tight">PD</span>
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-baseline gap-1">
                  <span className="font-display text-xl font-bold text-ink-950 dark:text-white tracking-tight">
                    PAUL
                  </span>
                  <span className="font-display text-xl font-bold text-gold-500 tracking-tight">
                    DAVIS
                  </span>
                </div>
                <span className="text-2xs font-semibold text-stone-500 dark:text-stone-400 tracking-ultra-wide uppercase">
                  XtMate Pro
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="#features">Features</NavLink>
              <NavLink href="#workflow">How It Works</NavLink>
              <NavLink href="#contact">Contact</NavLink>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-stone-50 to-gold-50/50 dark:from-ink-950 dark:via-ink-950 dark:to-gold-950/20" />
        <div className="absolute inset-0 hero-grid opacity-50 dark:opacity-30" />
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-hero-pattern dark:bg-hero-pattern-dark" />

        {/* Decorative elements */}
        <div className="absolute top-32 left-10 w-72 h-72 bg-gold-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold-300/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <div className="order-2 lg:order-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gold-100 dark:bg-gold-900/40 text-gold-700 dark:text-gold-300 px-4 py-2 rounded-full text-sm font-semibold mb-8 animate-fade-in-up fill-both">
                <Zap className="w-4 h-4" />
                <span>AI-Powered Restoration Estimating</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold text-ink-950 dark:text-white leading-[1.05] mb-8 animate-fade-in-up fill-both delay-100">
                Estimates Done{" "}
                <span className="relative inline-block">
                  <span className="text-gold-gradient">Right.</span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 200 8"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6C50 2 150 2 198 6"
                      stroke="url(#underline-gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                        <stop offset="0%" stopColor="#c9b274" />
                        <stop offset="100%" stopColor="#a08347" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <br />
                Done <span className="text-gold-gradient">Fast.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-stone-600 dark:text-stone-400 mb-10 leading-relaxed max-w-xl animate-fade-in-up fill-both delay-200">
                Transform your restoration claims with LiDAR scanning, AI-powered scopes,
                and seamless Xactimate export. From site visit to approved estimate in record time.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-in-up fill-both delay-300">
                <Link
                  href="/sign-up"
                  className="btn-gold inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#workflow"
                  className="inline-flex items-center justify-center gap-3 bg-white dark:bg-ink-900 border-2 border-stone-200 dark:border-ink-700 text-ink-900 dark:text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:border-gold-400 hover:text-gold-600 dark:hover:border-gold-500 dark:hover:text-gold-400"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </Link>
              </div>

              {/* Trust Signals */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-stone-500 dark:text-stone-400 animate-fade-in-up fill-both delay-400">
                <TrustSignal icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} text="No credit card required" />
                <TrustSignal icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} text="14-day free trial" />
                <TrustSignal icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} text="Xactimate compatible" />
              </div>
            </div>

            {/* Right - Hero Visual */}
            <div className="order-1 lg:order-2 relative animate-fade-in fill-both delay-200">
              <div className="relative">
                {/* Main Dashboard Preview */}
                <div className="relative bg-ink-950 rounded-3xl shadow-2xl shadow-ink-950/30 overflow-hidden border border-ink-800/50">
                  {/* Browser Chrome */}
                  <div className="flex items-center gap-2 px-4 py-3 bg-ink-900 border-b border-ink-800">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-ink-800 rounded-lg px-4 py-1 text-xs text-stone-400">
                        app.xtmate.pro
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-6 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <StatCard value="24" label="Active" />
                      <StatCard value="98%" label="SLA Met" highlight />
                      <StatCard value="$2.4M" label="This Month" variant="success" />
                    </div>

                    {/* Chart Placeholder */}
                    <div className="bg-ink-800/50 rounded-xl p-4 h-32">
                      <div className="flex items-end justify-between h-full gap-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-gradient-to-t from-gold-500 to-gold-400 rounded-t"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Banner */}
                  <div className="mx-4 mb-4">
                    <div className="bg-gold-gradient rounded-xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">AI generating scope...</div>
                        <div className="text-xs text-white/80">Water damage - Living Room - 245 sq ft</div>
                      </div>
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gold-400 rounded-2xl rotate-12 opacity-20 blur-2xl" />
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gold-500 rounded-full opacity-15 blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative py-16 bg-ink-950 overflow-hidden">
        <div className="absolute inset-0 hero-dots opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <MetricDisplay value="75%" label="Faster Estimates" />
            <MetricDisplay value="2 min" label="Per Room Scan" highlight />
            <MetricDisplay value="95%" label="AI Accuracy" />
            <MetricDisplay value="100%" label="ESX Compatible" highlight />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28 lg:py-36 bg-white dark:bg-ink-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block text-gold-600 dark:text-gold-400 font-semibold text-sm uppercase tracking-wider mb-4">
              Features
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-ink-950 dark:text-white mb-6">
              Everything You Need to{" "}
              <span className="text-gold-gradient">Dominate Claims</span>
            </h2>
            <p className="text-lg text-stone-600 dark:text-stone-400">
              Built by restoration pros, for restoration pros. Every feature designed to
              get estimates out faster and approved quicker.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard
              icon={<Smartphone className="w-7 h-7" />}
              title="LiDAR Room Capture"
              description="Scan rooms in seconds with iPhone LiDAR. Auto-calculate dimensions, square footage, wall areas, and ceiling heights."
              highlight
            />
            <FeatureCard
              icon={<Brain className="w-7 h-7" />}
              title="AI Scope Generation"
              description="Describe the damage in plain English. Our AI creates accurate IICRC-compliant line items instantly."
            />
            <FeatureCard
              icon={<FileSpreadsheet className="w-7 h-7" />}
              title="Xactimate Export"
              description="One-click ESX export. Your estimates open in Xactimate exactly as you created them. No rework needed."
            />
            <FeatureCard
              icon={<Clock className="w-7 h-7" />}
              title="SLA Tracking"
              description="Carrier-specific SLA monitoring. Track every milestone and never miss a deadline with automated alerts."
            />
            <FeatureCard
              icon={<Shield className="w-7 h-7" />}
              title="QA Review Queue"
              description="Built-in quality control. Review, approve, or send back estimates before they go out the door."
            />
            <FeatureCard
              icon={<Users className="w-7 h-7" />}
              title="Team Management"
              description="Assign PMs, estimators, field techs. Track performance and balance workloads across your entire team."
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-28 lg:py-36 bg-ink-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 hero-dots opacity-10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block text-gold-400 font-semibold text-sm uppercase tracking-wider mb-4">
              How It Works
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
              From Site Visit to Export in{" "}
              <span className="text-gold-gradient">Minutes</span>
            </h2>
            <p className="text-lg text-stone-400">
              Four simple steps. One powerful result.
            </p>
          </div>

          {/* Workflow Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            <WorkflowStep
              number="01"
              title="Capture"
              description="Scan rooms with LiDAR. Snap photos. Mark damage areas with a tap."
              icon={<Smartphone className="w-6 h-6" />}
            />
            <WorkflowStep
              number="02"
              title="Generate"
              description="AI creates your scope based on damage type, materials, and IICRC standards."
              icon={<Brain className="w-6 h-6" />}
            />
            <WorkflowStep
              number="03"
              title="Review"
              description="QA team verifies accuracy. Make adjustments. Lock in pricing."
              icon={<Shield className="w-6 h-6" />}
            />
            <WorkflowStep
              number="04"
              title="Export"
              description="Download your ESX file. Open directly in Xactimate. Submit to carrier."
              icon={<FileSpreadsheet className="w-6 h-6" />}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-28 lg:py-36 bg-stone-50 dark:bg-ink-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-gold-gradient rounded-3xl p-10 sm:p-16 lg:p-20 text-center overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 hero-dots opacity-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-gold-700/20 to-transparent" />

            <div className="relative">
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-white text-white" />
                ))}
              </div>

              <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Estimates?
              </h2>
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
                Join hundreds of restoration professionals saving hours on every claim.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-3 bg-white text-gold-700 px-8 py-4 rounded-2xl text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-0.5"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#contact"
                  className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 hover:bg-white/20"
                >
                  <Phone className="w-5 h-5" />
                  Talk to Sales
                </Link>
              </div>

              <p className="mt-8 text-sm text-white/70">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-ink-950 text-white py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            {/* Brand Column */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gold-gradient rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
                  <span className="text-white font-display font-bold text-xl">PD</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-xl font-bold tracking-tight">PAUL</span>
                    <span className="font-display text-xl font-bold text-gold-400 tracking-tight">DAVIS</span>
                  </div>
                  <span className="text-2xs font-semibold text-stone-500 tracking-ultra-wide uppercase">
                    XtMate Pro
                  </span>
                </div>
              </Link>
              <p className="text-stone-400 max-w-md mb-8">
                AI-powered restoration estimating software built for contractors who demand
                speed, accuracy, and seamless Xactimate integration.
              </p>
              <a
                href="mailto:support@xtmate.com"
                className="text-gold-400 hover:text-gold-300 transition-colors font-medium"
              >
                support@xtmate.com
              </a>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-display font-semibold text-white mb-6">Product</h4>
              <ul className="space-y-4">
                <FooterLink href="#features">Features</FooterLink>
                <FooterLink href="#workflow">How It Works</FooterLink>
                <FooterLink href="#">Pricing</FooterLink>
                <FooterLink href="#">Integrations</FooterLink>
              </ul>
            </div>

            <div>
              <h4 className="font-display font-semibold text-white mb-6">Company</h4>
              <ul className="space-y-4">
                <FooterLink href="#">About</FooterLink>
                <FooterLink href="#">Privacy Policy</FooterLink>
                <FooterLink href="#">Terms of Service</FooterLink>
                <FooterLink href="#">Support</FooterLink>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-ink-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-stone-500 text-sm">
              &copy; {new Date().getFullYear()} Paul Davis Restoration. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-stone-500 text-sm">
              <Building2 className="w-4 h-4" />
              <span>Trusted by restoration professionals across North America</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component: Navigation Link
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-stone-600 dark:text-stone-300 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
    >
      {children}
    </Link>
  );
}

// Component: Trust Signal
function TrustSignal({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{text}</span>
    </div>
  );
}

// Component: Dashboard Stat Card (for hero visual)
function StatCard({
  value,
  label,
  highlight = false,
  variant = "default"
}: {
  value: string;
  label: string;
  highlight?: boolean;
  variant?: "default" | "success";
}) {
  return (
    <div className="bg-ink-800/50 rounded-xl p-3 text-center">
      <div className={`text-xl font-bold ${
        highlight ? "text-gold-400" :
        variant === "success" ? "text-emerald-400" :
        "text-white"
      }`}>
        {value}
      </div>
      <div className="text-xs text-stone-500">{label}</div>
    </div>
  );
}

// Component: Metric Display
function MetricDisplay({ value, label, highlight = false }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className={`text-4xl sm:text-5xl font-display font-extrabold mb-2 ${
        highlight ? "text-gold-400" : "text-white"
      }`}>
        {value}
      </div>
      <div className="text-sm font-medium text-stone-400 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

// Component: Feature Card
function FeatureCard({
  icon,
  title,
  description,
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  if (highlight) {
    return (
      <div className="relative bg-gold-gradient rounded-2xl p-8 text-white shadow-xl shadow-gold-500/20 overflow-hidden group">
        <div className="absolute inset-0 hero-dots opacity-10" />
        <div className="relative">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </div>
          <h3 className="font-display text-xl font-bold mb-3">{title}</h3>
          <p className="text-white/90 leading-relaxed">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-card p-8 group">
      <div className="w-14 h-14 bg-gold-100 dark:bg-gold-900/40 text-gold-600 dark:text-gold-400 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gold-gradient group-hover:text-white transition-all duration-300">
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold text-ink-950 dark:text-white mb-3">{title}</h3>
      <p className="text-stone-600 dark:text-stone-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Component: Workflow Step
function WorkflowStep({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative text-center lg:text-left group">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-gradient text-white rounded-2xl mb-6 shadow-lg shadow-gold-500/30 group-hover:shadow-gold-500/50 transition-shadow duration-300">
        {icon}
      </div>
      <div className="text-gold-400 text-sm font-bold tracking-wider mb-2 font-display">{number}</div>
      <h3 className="font-display text-xl font-bold mb-3">{title}</h3>
      <p className="text-stone-400 leading-relaxed">{description}</p>
    </div>
  );
}

// Component: Footer Link
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-stone-400 hover:text-white transition-colors">
        {children}
      </Link>
    </li>
  );
}
