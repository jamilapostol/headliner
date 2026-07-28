import { LegalPage, H2, P, Ul } from "@/components/legal-page";

export const metadata = { title: "Terms of Service — HEADLINER" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="July 28, 2026">
      <P>
        These Terms of Service (“Terms”) govern your access to and use of HEADLINER (the “Service”), operated by [Company Legal Name]
        (“HEADLINER,” “we,” “us”). By creating an account or using the Service, you agree to these Terms. If you’re using
        HEADLINER on behalf of a band, label, or management company, you’re agreeing on that organization’s behalf, and you
        confirm you have the authority to do so.
      </P>

      <H2>1. What HEADLINER is</H2>
      <P>
        HEADLINER is a workspace for touring musicians and the people who work with them — booking pipeline, contacts,
        calendar, tour routing, merch inventory, contracts, financial tracking, fan management, and related tools
        (collectively, the “Service”). Some features are described elsewhere on our site and in-app; those descriptions are
        part of these Terms.
      </P>

      <H2>2. Accounts</H2>
      <P>
        You need an account to use HEADLINER. You’re responsible for the accuracy of the information you provide, for
        keeping your login credentials confidential, and for all activity that happens under your account. Tell us right
        away if you suspect unauthorized access.
      </P>
      <P>
        A workspace may have multiple members with different roles (for example, Artist, Manager, Booking Agent). The
        workspace owner is responsible for managing who has access and what they can do, including removing members who
        should no longer have it.
      </P>

      <H2>3. Plans, billing, and cancellation</H2>
      <P>
        HEADLINER offers a free plan and paid subscription plans (currently Pro Artist, Touring Artist, and Management
        Team), billed monthly or annually as selected at checkout. Paid subscriptions are processed by Stripe; we don’t
        store your full payment card details ourselves.
      </P>
      <Ul>
        <li>Subscriptions renew automatically at the end of each billing period until cancelled.</li>
        <li>You can cancel or downgrade at any time from Billing in your account settings; cancellation takes effect at the end of the current billing period.</li>
        <li>Fees are non-refundable except where required by law or stated otherwise at the time of purchase.</li>
        <li>We may change plan pricing or features going forward; we’ll give you reasonable notice before a price change affects your active subscription.</li>
      </Ul>

      <H2>4. Acceptable use</H2>
      <P>You agree not to use HEADLINER to:</P>
      <Ul>
        <li>Violate any law, or the rights of any third party (including venues, promoters, or other artists);</li>
        <li>Upload content you don’t have the right to upload, or that infringes someone else’s intellectual property;</li>
        <li>Attempt to access another workspace’s data without authorization, or interfere with the Service’s normal operation;</li>
        <li>Reverse-engineer, resell, or use the Service to build a competing product;</li>
        <li>Send spam, malware, or otherwise abuse the contact and email-campaign features.</li>
      </Ul>
      <P>We may suspend or terminate accounts that violate this section.</P>

      <H2>5. Your content and data</H2>
      <P>
        You own the data you put into HEADLINER — your bookings, contacts, contracts, financial records, and everything
        else. We don’t claim ownership over it. You grant us a limited license to host, process, and display that data
        solely to operate and improve the Service for you. You can export most of your data at any time using the
        Export CSV feature available on the Contacts, Fans, Finance, and Analytics tabs.
      </P>

      <H2>6. Third-party integrations</H2>
      <P>
        HEADLINER allows you to connect third-party services (for example Gmail, Google Calendar, Stripe, Square, Spotify
        for Artists, or Bandsintown). Connecting a service authorizes HEADLINER to exchange the data necessary for that
        integration to function. Your use of those third-party services is also governed by their own terms — we aren’t
        responsible for how they handle your data once shared. You can disconnect an integration at any time from Settings.
      </P>

      <H2>7. Roadie AI</H2>
      <P>
        Certain features, marketed as “Roadie AI,” generate suggested content — draft follow-up emails, contract
        summaries, and similar — based on the booking, contract, and contact data already in your workspace. AI-generated
        suggestions can be wrong or incomplete. You’re responsible for reviewing anything Roadie AI drafts before you send
        it, sign it, or rely on it — especially contract summaries, which are not a substitute for reading the actual
        agreement or consulting a lawyer.
      </P>

      <H2>8. Intellectual property</H2>
      <P>
        HEADLINER, its logo, and the software behind the Service are owned by us and protected by intellectual property
        law. These Terms don’t grant you any rights to our trademarks or branding beyond what’s needed to use the Service
        normally.
      </P>

      <H2>9. Termination</H2>
      <P>
        You can stop using HEADLINER and delete your account at any time. We may suspend or terminate your access if you
        violate these Terms, if required by law, or if we discontinue the Service — in the latter case, we’ll give you
        reasonable advance notice and a chance to export your data where practical.
      </P>

      <H2>10. Disclaimers</H2>
      <P>
        The Service is provided “as is.” We don’t guarantee it will be uninterrupted, error-free, or that it will meet
        every requirement of your specific tour, venue, or business. HEADLINER is a tool to help you run your business —
        it’s not a substitute for legal, tax, or financial advice, and we’re not responsible for decisions you make based
        on data or AI-generated content in the app.
      </P>

      <H2>11. Limitation of liability</H2>
      <P>
        To the extent permitted by law, HEADLINER and its team aren’t liable for indirect, incidental, or consequential
        damages arising from your use of the Service, including lost bookings, lost revenue, or data loss. Our total
        liability for any claim relating to the Service is limited to the amount you paid us in the twelve months before
        the claim arose.
      </P>

      <H2>12. Changes to these Terms</H2>
      <P>
        We may update these Terms from time to time. If a change is material, we’ll notify you by email or in-app before
        it takes effect. Continuing to use HEADLINER after a change takes effect means you accept the updated Terms.
      </P>

      <H2>13. Governing law</H2>
      <P>These Terms are governed by the laws of [Governing State/Country], without regard to conflict-of-law principles.</P>

      <H2>14. Contact</H2>
      <P>
        Questions about these Terms? Reach us at{" "}
        <a href="mailto:legal@headliner.app" className="text-accent">
          legal@headliner.app
        </a>
        .
      </P>
    </LegalPage>
  );
}
