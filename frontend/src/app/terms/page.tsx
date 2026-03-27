import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: March 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Service Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            IGCreator is a SaaS platform that provides AI-powered Instagram
            content creation, scheduling, and publishing tools. The service
            includes content strategy generation, image and caption creation,
            quality validation, and automated posting to connected Instagram
            accounts.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Account Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You must be at least 18 years old to use this service. You are
            responsible for maintaining the security of your account credentials
            and for all activities that occur under your account. You must
            provide accurate information when creating your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Payment Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paid plans are billed monthly through Stripe. You may cancel your
            subscription at any time; access continues until the end of the
            current billing period. AI credits do not roll over between billing
            periods. Refunds are available within 7 days of initial subscription.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Content Ownership</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You retain ownership of all content generated through the platform.
            By using the service, you grant IGCreator a limited license to
            process, store, and publish content on your behalf to connected
            social media accounts. We do not claim ownership over any content
            you create.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Acceptable Use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree not to use the service to generate content that violates
            Instagram&apos;s Community Guidelines, infringes on intellectual
            property rights, or contains harmful, misleading, or illegal
            material. We reserve the right to suspend accounts that violate
            these terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            6. Limitation of Liability
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            IGCreator is provided &quot;as is&quot; without warranties of any
            kind. We are not liable for any damages arising from your use of the
            service, including but not limited to lost profits, data loss, or
            Instagram account restrictions resulting from posted content. Our
            total liability is limited to the amount you paid in the 12 months
            preceding any claim.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about these terms, contact us at{" "}
            <span className="text-foreground">legal@igcreator.app</span>.
          </p>
        </section>
      </main>

      <footer className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} IGCreator. All rights reserved.
      </footer>
    </div>
  );
}
