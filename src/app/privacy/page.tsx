import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy policy — wowresume",
  description:
    "What wowresume collects, what it never stores, and the choices you have. Your resume and your answers never leave your device.",
};

const CONTACT = "privacy@wowresume.app";
const UPDATED = "November 28, 2026";

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col bg-[#0a0a0a] px-4 pb-24 text-[#ededed]">
      <header className="mx-auto flex h-16 w-full max-w-2xl items-center">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-[-0.05em]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={28} height={28} />
          wowresume
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl">
        <h1 className="mt-12 text-4xl font-bold tracking-[-0.05em] sm:text-5xl">Privacy policy</h1>
        <p className="mt-3 text-sm text-[#8a8a8a]">Last updated {UPDATED}</p>

        <div className="mt-10 rounded-2xl border border-[#4ade80]/25 bg-[#4ade80]/[0.04] p-6">
          <h2 className="font-semibold">The short version</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-[#cfcfcf]">
            <Point>Your resume is read inside your browser. It is never uploaded to our servers.</Point>
            <Point>
              Your onboarding answers, your plan, and any resume you build stay on your device. We do not
              store them.
            </Point>
            <Point>The only personal information we keep is your email address.</Point>
            <Point>We do not sell your data, show ads, or share anything with employers.</Point>
          </ul>
        </div>

        <Section title="Who we are">
          <p>
            wowresume (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates the website at www.wowresume.app and
            is the controller of the personal data described in this policy. You can reach us at any time
            at <Mail />.
          </p>
        </Section>

        <Section title="What stays on your device">
          <p>
            wowresume is designed so that the most sensitive information you give us never reaches us.
          </p>
          <ul>
            <li>
              <strong>Your resume.</strong> When you upload a PDF or DOCX, or paste your resume, the text is
              extracted and analyzed entirely in your browser. The file and its contents are not sent to
              our servers or to any third party.
            </li>
            <li>
              <strong>Your onboarding answers and your plan.</strong> Your name, goals, experience, skills,
              target companies, location, work authorization, salary expectations, GitHub username, and
              the plan we build from them are saved only in your browser&apos;s local storage, so you can
              pick up where you left off.
            </li>
          </ul>
          <p>
            Because this information lives on your device, we cannot see it, recover it, or delete it for
            you. You can remove it at any time by clearing this site&apos;s data in your browser settings.
          </p>
        </Section>

        <Section title="What we collect">
          <h3>Your account</h3>
          <p>
            When you create an account, we store your email address so you can sign in. If you choose
            &ldquo;Continue with Google&rdquo;, Google shares your name, email address, and profile picture
            with us, and these are stored with your account. We also keep technical records needed to run
            sign-in securely, such as when you last signed in.
          </p>

          <h3>Your email from the free resume check</h3>
          <p>
            If you enter your email to unlock the full results of the resume check, we store that email
            address together with your overall score (a number from 0 to 100). We never store your resume
            or the individual findings. We use your email to tell you when wowresume can rewrite your
            resume for you, and you can unsubscribe at any time.
          </p>

          <h3>Usage analytics</h3>
          <p>
            We use PostHog to understand how people use wowresume so we can improve it. PostHog receives
            information such as the pages you visit, the buttons you press, your browser and device type,
            the site that referred you, and an approximate location derived from your IP address. It stores
            a random identifier in a cookie and in your browser&apos;s local storage to recognize repeat
            visits. The onboarding flow and your resume content are excluded from this tracking, and the
            text you type into forms is never recorded.
          </p>
          <p>
            We also use Vercel Web Analytics, which counts page views in aggregate without cookies and
            without identifying you.
          </p>

          <h3>Technical logs</h3>
          <p>
            Like any website, our hosting provider processes your IP address and browser information to
            deliver pages, keep the service secure, and diagnose errors. These logs are kept for a short
            period and are not used to profile you.
          </p>
        </Section>

        <Section title="How we use your information">
          <ul>
            <li>To create and secure your account and let you sign in.</li>
            <li>To send you the emails you asked for, including product updates you can unsubscribe from.</li>
            <li>To understand how wowresume is used, fix problems, and improve the product.</li>
            <li>To protect wowresume and our users against abuse, and to comply with the law.</li>
          </ul>
          <p>
            We do not sell or rent your personal information, we do not use it for advertising, and we
            never share it with employers or recruiters.
          </p>
        </Section>

        <Section title="Legal bases">
          <p>
            If you are in the European Economic Area, the United Kingdom, or Switzerland, we rely on the
            following legal bases: performance of a contract to provide your account; your consent for the
            emails you sign up to receive, which you can withdraw at any time; and our legitimate interests
            in keeping wowresume secure and improving it, for analytics and technical logs.
          </p>
        </Section>

        <Section title="Service providers">
          <p>
            We share information only with the providers that help us run wowresume, and only as needed
            for them to provide their service to us:
          </p>
          <ul>
            <li>
              <strong>Supabase</strong> for account sign-in and our database.
            </li>
            <li>
              <strong>Vercel</strong> for hosting and aggregate page-view analytics.
            </li>
            <li>
              <strong>PostHog</strong> for product analytics, hosted in the European Union.
            </li>
            <li>
              <strong>Google</strong>, only if you choose to sign in with your Google account.
            </li>
          </ul>
          <p>
            Some of these providers may process data outside your country, including in the United States.
            Where required, these transfers are protected by appropriate safeguards such as the European
            Commission&apos;s Standard Contractual Clauses. We may also disclose information if required by
            law.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            We keep your account information until you delete your account. We keep the email from the
            resume check until you unsubscribe or ask us to remove it. Analytics data is kept only as long
            as it is useful for improving the product and is then deleted.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can ask us to access, correct, export, or delete the personal information we hold about
            you, or object to how we use it. To delete your account or exercise any of these rights, email{" "}
            <Mail />. We will respond within 30 days. If you are in the EEA or the UK, you also have the
            right to lodge a complaint with your local data protection authority.
          </p>
        </Section>

        <Section title="Security">
          <p>
            We protect your information with encryption in transit, restricted access controls, and
            database rules that limit each record to the people who need it. Because your resume and your
            answers never leave your device, they cannot be exposed by a breach of our systems.
          </p>
        </Section>

        <Section title="Children">
          <p>
            wowresume is not intended for anyone under 16, and we do not knowingly collect information from
            children. If you believe a child has given us personal information, contact us and we will
            delete it.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            If we make material changes to this policy, we will update the date above and, where
            appropriate, let you know by email before the changes take effect.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy or your data? Email us at <Mail />.
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold tracking-[-0.03em]">{title}</h2>
      <div className="mt-3 space-y-4 text-[15px] leading-relaxed text-[#b5b5b5] [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-[#ededed] [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-[#ededed] [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

function Point({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#4ade80]" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function Mail() {
  return (
    <a href={`mailto:${CONTACT}`} className="text-[#ededed] underline underline-offset-4 hover:text-[#4ade80]">
      {CONTACT}
    </a>
  );
}
