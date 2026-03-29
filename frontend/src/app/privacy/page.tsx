import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: March 29, 2026
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Introduction</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Kuraite (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is operated
            by Suprajanan, a registered business based in Jaipur, Rajasthan,
            India. We provide the Kuraite platform at{" "}
            <span className="text-foreground">
              kuraite.co.in
            </span>
            . This Privacy Policy explains what data we collect, how we use it,
            and your rights regarding your personal information. By using our
            service, you agree to this policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Data We Collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect the following categories of information:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Account Information:</strong>{" "}
              Name, email address, and password (hashed) when you create an
              account.
            </li>
            <li>
              <strong className="text-foreground">Brand Information:</strong>{" "}
              Business niche, brand colors, fonts, voice style, and content
              pillars you provide during onboarding.
            </li>
            <li>
              <strong className="text-foreground">Generated Content:</strong>{" "}
              Captions, hashtags, strategy documents, calendar plans, and reel
              scripts created through the platform.
            </li>
            <li>
              <strong className="text-foreground">
                Instagram Data (via Facebook OAuth):
              </strong>{" "}
              When you connect your Instagram account, we access your Instagram
              Business Account profile (username, name, biography, follower
              count, media count, profile picture) through the Facebook Graph
              API.
            </li>
            <li>
              <strong className="text-foreground">
                Competitor Analysis Data:
              </strong>{" "}
              When you enter competitor Instagram handles during strategy
              creation, we use the Instagram Business Discovery API to fetch
              publicly available data about those accounts, including follower
              count, media count, biography, and recent post engagement metrics
              (likes, comments, captions, timestamps, media types). This data is
              only available for public Business and Creator accounts.
            </li>
            <li>
              <strong className="text-foreground">Usage Data:</strong> Basic
              analytics about how you use the platform (pages visited, features
              used) to improve the service.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. How We Use Your Data</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use your data for the following purposes:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">
                Content Generation:
              </strong>{" "}
              Your brand information, voice samples, and strategy data are sent
              to OpenAI (gpt-4o-mini) to generate personalized content. We do
              not store data on OpenAI&apos;s servers beyond the API call.
            </li>
            <li>
              <strong className="text-foreground">
                Competitor Analysis:
              </strong>{" "}
              Competitor Instagram data is fetched in real-time via the Instagram
              Business Discovery API and used to generate competitive analysis
              and content strategy recommendations. This data is processed
              temporarily and not permanently stored.
            </li>
            <li>
              <strong className="text-foreground">Service Improvement:</strong>{" "}
              Usage analytics help us understand which features are most valuable
              and where to improve the platform.
            </li>
            <li>
              <strong className="text-foreground">Account Management:</strong>{" "}
              Email is used for authentication, password resets, and important
              service notifications.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell, rent, or share your personal data with third parties
            for marketing purposes.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">
            4. Instagram & Facebook Integration
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            When you connect your Instagram account via Facebook Login, we
            request the following permissions:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">instagram_basic:</strong>{" "}
              Allows us to read your Instagram Business Account profile and use
              the Business Discovery endpoint to fetch public data about
              competitor accounts you specify.
            </li>
            <li>
              <strong className="text-foreground">
                pages_read_engagement:
              </strong>{" "}
              Required to access the Facebook Page linked to your Instagram
              Business Account, which is necessary for the API authentication
              flow.
            </li>
            <li>
              <strong className="text-foreground">pages_show_list:</strong>{" "}
              Required to retrieve the list of Facebook Pages you manage, so we
              can identify which Page is linked to your Instagram Business
              Account.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your Facebook/Instagram access token is stored in an encrypted
            HTTP-only cookie in your browser. It is not stored on our servers.
            The token expires after 60 days, after which you will need to
            reconnect. You can disconnect your Instagram account at any time
            from the Settings page, which immediately deletes the stored token.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Data Storage & Retention</h2>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Account data</strong> (name,
              email, brand settings) is stored in our PostgreSQL database hosted
              on Neon (cloud PostgreSQL) and retained for the duration of your
              account.
            </li>
            <li>
              <strong className="text-foreground">Generated content</strong>{" "}
              (captions, strategies, calendars) is stored in the database and
              retained until you delete it or close your account.
            </li>
            <li>
              <strong className="text-foreground">
                Competitor analysis data
              </strong>{" "}
              is fetched in real-time and processed temporarily during strategy
              generation. It is not permanently stored in our database.
            </li>
            <li>
              <strong className="text-foreground">
                Instagram OAuth tokens
              </strong>{" "}
              are stored only in your browser cookie (encrypted, HTTP-only) and
              automatically expire after 55 days.
            </li>
            <li>
              Upon account deletion, all your data is permanently removed from
              our database within 30 days.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Data Sharing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We share data only with the following service providers, solely to
            operate the platform:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">OpenAI:</strong> Brand
              information and content prompts are sent to OpenAI&apos;s API for
              AI content generation. OpenAI does not use API inputs for training.
            </li>
            <li>
              <strong className="text-foreground">Meta (Facebook/Instagram):</strong>{" "}
              Your OAuth token is used to authenticate API requests to the
              Instagram Graph API and Business Discovery endpoints.
            </li>
            <li>
              <strong className="text-foreground">Vercel:</strong> Our
              application is hosted on Vercel&apos;s infrastructure.
            </li>
            <li>
              <strong className="text-foreground">Neon:</strong> Our PostgreSQL
              database is hosted on Neon&apos;s cloud infrastructure.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You have the following rights regarding your data:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">Access:</strong> Request a
              copy of all personal data we hold about you.
            </li>
            <li>
              <strong className="text-foreground">Correction:</strong> Update
              or correct inaccurate personal data via the Settings page.
            </li>
            <li>
              <strong className="text-foreground">Deletion:</strong> Request
              deletion of your account and all associated data. You can also
              delete individual content items from the platform.
            </li>
            <li>
              <strong className="text-foreground">Disconnect:</strong> Revoke
              Instagram access at any time from the Settings page.
            </li>
            <li>
              <strong className="text-foreground">Data Portability:</strong>{" "}
              Request an export of your data in a machine-readable format.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To exercise any of these rights, contact us at the email address
            below or use the relevant features in the Settings page.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We use the following cookies:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-2">
            <li>
              <strong className="text-foreground">
                Authentication cookies:
              </strong>{" "}
              Session cookies for login state (essential, cannot be disabled).
            </li>
            <li>
              <strong className="text-foreground">
                Instagram credentials cookie:
              </strong>{" "}
              Encrypted HTTP-only cookie storing your Instagram OAuth token (55-day
              expiry).
            </li>
            <li>
              <strong className="text-foreground">CSRF protection cookie:</strong>{" "}
              Temporary cookie used during the OAuth flow (10-minute expiry).
            </li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not use third-party tracking cookies or advertising cookies.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We implement industry-standard security measures including: HTTPS
            encryption for all data in transit, bcrypt password hashing, HTTP-only
            secure cookies, CSRF protection, rate limiting on all API endpoints,
            input sanitization, and Content Security Policy headers. Access tokens
            are never exposed to client-side JavaScript.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Changes to This Policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify
            you of significant changes via email or a notice on the platform.
            Continued use of the service after changes constitutes acceptance of
            the updated policy. Previous versions of this policy are retained
            and available upon request.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">11. Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about this privacy policy, data requests, or to
            exercise your rights, contact us at:
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
