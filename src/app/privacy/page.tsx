import { LegalPage, H2, P, Ul } from "@/components/legal-page";

export const metadata = { title: "Privacy Policy — HEADLINE." };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="July 28, 2026">
      <P>
        This Privacy Policy explains what information HEADLINE. collects, how we use it, and the choices you have. It
        applies to everyone who uses the Service — artists, managers, and anyone else on a workspace.
      </P>

      <H2>1. Information we collect</H2>
      <P>Account information you give us directly:</P>
      <Ul>
        <li>Name, email address, and password (handled by our authentication provider, Supabase — we never see your raw password).</li>
        <li>Profile photo and business address, if you add them.</li>
        <li>Workspace and billing details, including your plan and (via Stripe) a reference to your payment method — not your full card number.</li>
      </Ul>
      <P>Data you put into your workspace to run your business:</P>
      <Ul>
        <li>Bookings, venues, guarantees, and settlement details.</li>
        <li>Contacts — promoters, buyers, press, sponsors, and their relationship history.</li>
        <li>Contracts, riders, and related documents you upload.</li>
        <li>Merch inventory, sales, and financial transactions you record.</li>
        <li>Fan records and campaign data, if you use those features.</li>
      </Ul>
      <P>Information collected automatically:</P>
      <Ul>
        <li>Basic usage data (pages visited, actions taken) to help us fix bugs and improve the product.</li>
        <li>Device and browser information, and cookies necessary to keep you logged in and remember your preferences (like light/dark mode).</li>
      </Ul>

      <H2>2. How we use your information</H2>
      <Ul>
        <li>To operate the Service — run your booking pipeline, calendar, financial hub, and every other feature you use.</li>
        <li>To process payments and manage your subscription, via Stripe.</li>
        <li>To power Roadie AI’s suggestions, using the booking, contract, and contact data already in your workspace.</li>
        <li>To communicate with you — invite emails, billing receipts, product updates, and support responses.</li>
        <li>To keep the Service secure and prevent abuse.</li>
      </Ul>
      <P>We don’t sell your personal information, and we don’t use your business data to train models for other customers.</P>

      <H2>3. Who we share it with</H2>
      <P>We share data only where it’s needed to run HEADLINE.:</P>
      <Ul>
        <li><strong>Supabase</strong> — hosts our database, handles authentication, and stores uploaded files (contracts, avatars, merch photos).</li>
        <li><strong>Stripe</strong> — processes subscription payments and merch point-of-sale transactions.</li>
        <li><strong>Third-party integrations you connect</strong> — if you connect Gmail, Google Calendar, Stripe, Square, Spotify for Artists, or Bandsintown, we exchange the data necessary for that specific integration. Nothing is shared with a connected service until you turn it on.</li>
        <li><strong>Other members of your workspace</strong> — data you enter is visible to teammates with access to that workspace, based on their role.</li>
        <li><strong>Law enforcement or legal process</strong> — only when we’re required to by law.</li>
      </Ul>

      <H2>4. Data retention</H2>
      <P>
        We keep your data for as long as your account is active. If you delete your account, we delete your workspace data
        within a reasonable period, except where we’re required to retain records (for example, billing history) for legal
        or tax purposes.
      </P>

      <H2>5. Your choices</H2>
      <Ul>
        <li><strong>Export:</strong> download your contacts, fans, finance, and analytics data at any time as CSV from the respective tab.</li>
        <li><strong>Correct:</strong> update your profile, workspace, and records directly in the app.</li>
        <li><strong>Disconnect:</strong> remove any third-party integration at any time from Settings.</li>
        <li><strong>Delete:</strong> request account and workspace deletion by contacting us.</li>
      </Ul>

      <H2>6. Security</H2>
      <P>
        We use industry-standard practices to protect your data, including encryption in transit and access controls
        scoped to your workspace. No system is perfectly secure, and we can’t guarantee absolute security — but we take it
        seriously and will notify you if we become aware of a breach affecting your data, as required by law.
      </P>

      <H2>7. Children’s privacy</H2>
      <P>HEADLINE. is intended for people running a touring business and isn’t directed at children. We don’t knowingly collect data from anyone under 16.</P>

      <H2>8. International users</H2>
      <P>
        HEADLINE. is operated from [Company Country]. If you use the Service from elsewhere, your data will be transferred
        to and processed in that country, which may have different data protection laws than where you live.
      </P>

      <H2>9. Changes to this policy</H2>
      <P>
        If we make a material change to how we handle your data, we’ll notify you by email or in-app before it takes
        effect.
      </P>

      <H2>10. Contact</H2>
      <P>
        Questions about this policy, or want to exercise any of the choices above? Reach us at{" "}
        <a href="mailto:privacy@headline.world" className="text-accent">
          privacy@headline.world
        </a>
        .
      </P>
    </LegalPage>
  );
}
