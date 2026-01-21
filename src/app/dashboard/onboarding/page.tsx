import { OnboardingContent } from './onboarding-content';

// Force dynamic rendering to prevent static generation error with usePermissions
export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  return <OnboardingContent />;
}
