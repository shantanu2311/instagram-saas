import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <nav className="border-b border-border/40 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/kuraite-icon.png" alt="Kuraite" width={32} height={32} className="rounded-lg" />
            <span className="font-semibold text-lg">Kuraite</span>
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
            Last updated: March 29, 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Service Description</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kuraite is a SaaS platform that provides AI-powered Instagram
            content creation, strategy generation, competitor analysis,
            scheduling, and publishing tools. The service includes content
            strategy generation, image and caption creation, hashtag research,
            reel script generation, and automated posting to connected Instagram
            accounts.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Account Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You must be at least 18 years old to use this service. You are
            responsible for maintaining the security of your account credentials
            and for all activities that occur under your account. You must
            provide accurate information when creating your account. One person
            or entity may not maintain more than one account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            3. Instagram & Facebook Integration
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By connecting your Instagram account via Facebook Login, you
            authorize Kuraite to access your Instagram Business Account
            profile and use the Business Discovery API to fetch publicly
            available data about competitor accounts you specify. You represent
            that you have the authority to connect the Instagram Business
            Account and associated Facebook Page. You may disconnect at any
            time from the Settings page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Competitor Analysis</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The competitor analysis feature uses the Instagram Business
            Discovery API to fetch publicly available data from public Business
            and Creator accounts. This data includes follower counts, post
            engagement metrics, and content patterns. You agree to use this
            feature only for legitimate competitive analysis purposes and not
            to harass, stalk, or interfere with any Instagram account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Payment Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Paid plans are billed monthly through Stripe. You may cancel your
            subscription at any time; access continues until the end of the
            current billing period. AI credits do not roll over between billing
            periods. Refunds are available within 7 days of initial
            subscription.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Content Ownership</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You retain ownership of all content generated through the platform.
            By using the service, you grant Kuraite a limited license to
            process, store, and publish content on your behalf to connected
            social media accounts. We do not claim ownership over any content
            you create. AI-generated content is provided as a starting point
            and you are responsible for reviewing and editing before publishing.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Acceptable Use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You agree not to use the service to generate content that violates
            Instagram&apos;s Community Guidelines, infringes on intellectual
            property rights, or contains harmful, misleading, or illegal
            material. You agree not to use the API access to scrape, store, or
            redistribute Instagram data beyond the intended competitor analysis
            use case. We reserve the right to suspend accounts that violate
            these terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Data Deletion</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may request deletion of your data at any time by contacting us
            at{" "}
            <span className="text-foreground">support@suprajanan.com</span> or by
            using the account deletion feature in Settings. Upon receiving a
            deletion request, we will permanently remove all your personal data,
            generated content, and brand information within 30 days. Instagram
            OAuth tokens are deleted immediately upon disconnection.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            9. Limitation of Liability
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kuraite is provided &quot;as is&quot; without warranties of any
            kind. We are not liable for any damages arising from your use of
            the service, including but not limited to lost profits, data loss,
            or Instagram account restrictions resulting from posted content.
            Our total liability is limited to the amount you paid in the 12
            months preceding any claim.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Changes to Terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may modify these terms at any time. We will notify you of
            significant changes via email or a notice on the platform. Continued
            use of the service after changes constitutes acceptance of the
            updated terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kuraite is operated by Suprajanan. For questions about these terms,
            contact us at:
          </p>
          <p className="text-sm text-foreground">
            Email: support@suprajanan.com
          </p>
        </section>
      </main>

      <footer className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Kuraite. All rights reserved.
      </footer>
    </div>
  );
}
