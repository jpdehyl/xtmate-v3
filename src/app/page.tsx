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
    <div className="min-h-screen bg-white dark:bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-background/95 backdrop-blur-sm border-b border-gray-100 dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pd-gold-400 to-pd-gold-600 rounded-xl flex items-center justify-center shadow-lg shadow-pd-gold/20">
                <span className="text-white font-bold text-xl">PD</span>
              </div>
              <div className="hidden sm:block">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    PAUL
                  </span>
                  <span className="text-2xl font-bold text-pd-gold tracking-tight">
                    DAVIS
                  </span>
                </div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-[0.25em] uppercase">
                  XtMate Pro
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pd-gold transition-colors">
                Features
              </Link>
              <Link href="#workflow" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pd-gold transition-colors">
                How It Works
              </Link>
              <Link href="#contact" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-pd-gold transition-colors">
                Contact
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-pd-gold transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 bg-pd-gold hover:bg-pd-gold-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md shadow-pd-gold/25 hover:shadow-lg hover:shadow-pd-gold/30"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-pd-gold-50/30 dark:from-background dark:via-background dark:to-pd-gold-900/10" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-pd-gold-100/50 to-transparent dark:from-pd-gold-900/20 dark:to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-pd-gold-100 dark:bg-pd-gold-900/30 text-pd-gold-700 dark:text-pd-gold-300 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                AI-Powered Restoration Estimating
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] mb-6">
                Estimates Done{" "}
                <span className="relative">
                  <span className="text-pd-gold">Right.</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 10C50 2 150 2 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-pd-gold-300 dark:text-pd-gold-700" />
                  </svg>
                </span>{" "}
                <br />
                Done <span className="text-pd-gold">Fast.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-xl">
                Transform your restoration claims with LiDAR scanning, AI-powered scopes, 
                and seamless Xactimate export. From site visit to approved estimate in record time.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 bg-pd-gold hover:bg-pd-gold-600 text-white px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-pd-gold/30 hover:shadow-2xl hover:shadow-pd-gold/40 hover:-translate-y-0.5"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#workflow"
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-card border-2 border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:border-pd-gold hover:text-pd-gold"
                >
                  Watch Demo
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>Xactimate compatible</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 relative">
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl overflow-hidden aspect-[4/3]">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzMzMyIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                
                <div className="absolute top-6 left-6 right-6">
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                      <span className="ml-2 text-white/60 text-sm">XtMate Dashboard</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">24</div>
                        <div className="text-xs text-white/60">Active</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-pd-gold">98%</div>
                        <div className="text-xs text-white/60">SLA Met</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-400">$2.4M</div>
                        <div className="text-xs text-white/60">This Month</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-pd-gold/90 backdrop-blur-md rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-white">AI generating scope...</div>
                        <div className="text-xs text-white/80">Water damage - Living Room - 245 sq ft</div>
                      </div>
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-pd-gold rounded-2xl rotate-12 opacity-20 blur-xl" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-pd-gold rounded-full opacity-20 blur-xl" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-white mb-2">75%</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Faster Estimates</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-pd-gold mb-2">2 min</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Per Room Scan</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-white mb-2">95%</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">AI Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-black text-pd-gold mb-2">100%</div>
              <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">ESX Compatible</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 lg:py-32 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-pd-gold font-semibold text-sm uppercase tracking-wider">Features</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mt-3 mb-5">
              Everything You Need to Dominate Claims
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Built by restoration pros, for restoration pros. Every feature designed to get estimates out faster and approved quicker.
            </p>
          </div>

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

      <section id="workflow" className="py-24 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')]" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-pd-gold font-semibold text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mt-3 mb-5">
              From Site Visit to Export in Minutes
            </h2>
            <p className="text-lg text-gray-400">
              Four simple steps. One powerful result.
            </p>
          </div>

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

      <section className="py-24 lg:py-32 bg-white dark:bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-pd-gold-500 to-pd-gold-600 rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNmZmYiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-10" />
            
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Transform Your Estimates?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                Join hundreds of restoration professionals saving hours on every claim.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 bg-white text-pd-gold-600 px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
                >
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="#contact"
                  className="inline-flex items-center gap-2 bg-white/10 text-white border-2 border-white/30 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:bg-white/20"
                >
                  <Phone className="w-5 h-5" />
                  Talk to Sales
                </Link>
              </div>
              <p className="mt-6 text-sm text-white/70">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="bg-gray-900 text-white py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pd-gold-400 to-pd-gold-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">PD</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xl font-bold tracking-tight">PAUL</span>
                    <span className="text-xl font-bold text-pd-gold tracking-tight">DAVIS</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 tracking-[0.25em] uppercase">XtMate Pro</span>
                </div>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                AI-powered restoration estimating software built for contractors who demand speed, accuracy, and seamless Xactimate integration.
              </p>
              <div className="flex items-center gap-4">
                <a href="mailto:support@xtmate.com" className="text-pd-gold hover:text-pd-gold-400 transition-colors">
                  support@xtmate.com
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#workflow" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Paul Davis Restoration. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Building2 className="w-4 h-4" />
              <span>Trusted by restoration professionals across North America</span>
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
  highlight = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div className={`relative rounded-2xl p-6 lg:p-8 transition-all hover:-translate-y-1 ${
      highlight 
        ? "bg-gradient-to-br from-pd-gold-500 to-pd-gold-600 text-white shadow-xl shadow-pd-gold/20" 
        : "bg-gray-50 dark:bg-card border border-gray-100 dark:border-border hover:border-pd-gold-200 dark:hover:border-pd-gold-800"
    }`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
        highlight 
          ? "bg-white/20" 
          : "bg-pd-gold-100 dark:bg-pd-gold-900/30 text-pd-gold"
      }`}>
        {icon}
      </div>
      <h3 className={`text-xl font-bold mb-3 ${highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>
        {title}
      </h3>
      <p className={highlight ? "text-white/90" : "text-gray-600 dark:text-gray-400"}>
        {description}
      </p>
    </div>
  );
}

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
    <div className="relative">
      <div className="text-center lg:text-left">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pd-gold rounded-2xl text-white mb-6 shadow-lg shadow-pd-gold/30">
          {icon}
        </div>
        <div className="text-pd-gold-400 text-sm font-bold tracking-wider mb-2">{number}</div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
