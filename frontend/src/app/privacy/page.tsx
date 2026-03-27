import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg ig-gradient flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-lg">IGCreator</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: March 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Data Collection</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect information you provide when creating an account,
            including your name, email address, and Instagram account details
            when you connect your account via OAuth. We also collect content you
            generate through the platform (images, captions, hashtags) and basic
            usage analytics.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. How We Use Your Data</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data is used to provide the IGCreator service: generating
            content, publishing to Instagram on your behalf, tracking analytics,
            and improving content recommendations. We do not sell your personal
            data to third parties.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Instagram Integration</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you connect your Instagram account, we store an encrypted OAuth
            access token to publish content and retrieve analytics on your
            behalf. You can disconnect your Instagram account at any time from
            the Settings page, which revokes our access.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Data Storage</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data is stored on secure, encrypted servers. Generated images
            are stored temporarily for publishing and may be retained for up to
            30 days. Account data is retained for the duration of your
            subscription and deleted within 30 days of account closure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have the right to access, correct, or delete your personal data
            at any time. You can export your data, disconnect third-party
            integrations, or delete your account from the Settings page. For
            data requests, contact us at the email below.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management.
            We may use analytics cookies to understand how the platform is used.
            You can manage cookie preferences in your browser settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about this privacy policy or your data, contact us at{" "}
            <span className="text-foreground">privacy@igcreator.app</span>.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} IGCreator. All rights reserved.
      </footer>
    </div>
  );
}
