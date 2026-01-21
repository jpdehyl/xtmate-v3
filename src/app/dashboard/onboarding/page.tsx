"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  User,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  type Role,
} from "@/lib/auth/client";
import { usePermissions } from "@/hooks/usePermissions";

type OnboardingStep = "organization" | "role" | "complete";

export default function OnboardingPage() {
  const router = useRouter();
  const { refresh } = usePermissions();
  const [step, setStep] = useState<OnboardingStep>("organization");
  const [orgName, setOrgName] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Roles that can be self-selected during onboarding
  const selectableRoles: Role[] = [
    ROLES.ADMIN,
    ROLES.GENERAL_MANAGER,
    ROLES.QA_MANAGER,
    ROLES.ESTIMATOR,
    ROLES.PM,
    ROLES.PROJECT_ADMIN,
  ];

  const handleOrganizationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setStep("role");
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handleComplete = async () => {
    if (!selectedRole || !orgName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: orgName.trim(),
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to complete onboarding");
      }

      // Show completion UI
      setStep("complete");
      setIsSubmitting(false);

      // Refresh the permissions context to get the new auth state
      // This needs to complete before we redirect
      await refresh();

      // Redirect to dashboard after a brief delay to show completion message
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-background dark:to-background p-4">
      <div className="w-full max-w-lg">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <StepIndicator
            step={1}
            label="Organization"
            active={step === "organization"}
            completed={step !== "organization"}
          />
          <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />
          <StepIndicator
            step={2}
            label="Your Role"
            active={step === "role"}
            completed={step === "complete"}
          />
          <div className="w-8 h-px bg-gray-200 dark:bg-gray-700" />
          <StepIndicator
            step={3}
            label="Complete"
            active={step === "complete"}
            completed={false}
          />
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-card rounded-2xl shadow-xl border border-gray-100 dark:border-border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-pd-gold-500 to-pd-gold-600 px-6 py-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {step === "organization" && <Building2 className="w-8 h-8" />}
              {step === "role" && <User className="w-8 h-8" />}
              {step === "complete" && <CheckCircle2 className="w-8 h-8" />}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {step === "organization" && "Welcome to XtMate"}
              {step === "role" && "Select Your Role"}
              {step === "complete" && "You're All Set!"}
            </h1>
            <p className="text-pd-gold-100">
              {step === "organization" && "Let's set up your organization"}
              {step === "role" && "Choose your primary role in the organization"}
              {step === "complete" && "Your account is ready to use"}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === "organization" && (
              <form onSubmit={handleOrganizationSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="orgName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Organization Name
                  </label>
                  <Input
                    id="orgName"
                    type="text"
                    placeholder="e.g., Paul Davis of Austin"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="h-12"
                    autoFocus
                  />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    This is typically your franchise or company name
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 bg-pd-gold hover:bg-pd-gold-600 text-white"
                  disabled={!orgName.trim()}
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}

            {step === "role" && (
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div className="grid gap-3">
                  {selectableRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === role
                          ? "border-pd-gold bg-pd-gold-50 dark:bg-pd-gold-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-pd-gold-200 dark:hover:border-pd-gold-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                            selectedRole === role
                              ? "border-pd-gold bg-pd-gold"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {selectedRole === role && (
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {ROLE_LABELS[role]}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {ROLE_DESCRIPTIONS[role]}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="pt-2">
                  <Button
                    type="button"
                    onClick={handleComplete}
                    className="w-full h-12 bg-pd-gold hover:bg-pd-gold-600 text-white"
                    disabled={!selectedRole || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("organization")}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Back to organization
                </button>
              </div>
            )}

            {step === "complete" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Welcome, {ROLE_LABELS[selectedRole!]}!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your organization <strong>{orgName}</strong> has been created.
                  Redirecting to your dashboard...
                </p>
                <div className="flex items-center justify-center gap-2 text-pd-gold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading dashboard...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Need help?{" "}
          <a href="#" className="text-pd-gold hover:text-pd-gold-600">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

function StepIndicator({
  step,
  label,
  active,
  completed,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          completed
            ? "bg-green-500 text-white"
            : active
              ? "bg-pd-gold text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        }`}
      >
        {completed ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      <span
        className={`text-xs mt-1 ${active ? "text-pd-gold font-medium" : "text-gray-400 dark:text-gray-500"}`}
      >
        {label}
      </span>
    </div>
  );
}
