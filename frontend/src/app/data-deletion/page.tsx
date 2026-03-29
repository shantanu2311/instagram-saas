import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";

export default function DataDeletionPage() {
  return (
    <div className="flex flex-col min-h-screen">
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

      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 space-y-8">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
          <h1 className="text-2xl font-bold">Data Deletion Request</h1>
        </div>

        <div className="rounded-xl border border-border p-6 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your data deletion request has been received and is being processed.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            All personal data associated with your account will be permanently
            deleted within <strong className="text-foreground">30 days</strong>.
            This includes:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 space-y-1">
            <li>Account information (name, email)</li>
            <li>Brand settings and content pillars</li>
            <li>Generated content (captions, strategies, calendars)</li>
            <li>Instagram connection data and OAuth tokens</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If you have any questions about this process, contact us at{" "}
            <span className="text-foreground">decele573@gmail.com</span>.
          </p>
        </div>
      </main>

      <footer className="border-t border-border/40 py-6 px-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Kuraite. All rights reserved.
      </footer>
    </div>
  );
}
