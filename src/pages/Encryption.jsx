export default function Encryption() {
  return (
    <div className="space-y-6 max-w-xs md:max-w-2xl mx-auto px-2 sm:px-1 pt-6 pb-8">
      <div>
        <h1 className="font-heading text-3xl sm:text-2xl font-bold">App Encryption & Security</h1>
        <p className="text-base sm:text-sm text-muted-foreground mt-1">How we protect your data</p>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Data Encryption</h2>
          <p className="text-sm text-muted-foreground">
            All data transmitted between your device and our servers is encrypted using HTTPS with TLS 1.2 or higher. This ensures that your task information, family member details, and personal data remain private during transmission.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">At-Rest Encryption</h2>
          <p className="text-sm text-muted-foreground">
            Your data stored on our servers is encrypted at rest using industry-standard encryption protocols. This protects your information even if our storage systems are compromised.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Authentication Security</h2>
          <p className="text-sm text-muted-foreground">
            We use secure authentication mechanisms to verify your identity. Your password is never stored in plain text and is protected using modern hashing algorithms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Data Access Control</h2>
          <p className="text-sm text-muted-foreground">
            Only you and family members you explicitly invite can access your home management data. We implement role-based access controls to ensure data is only visible to authorized users.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Third-Party Integrations</h2>
          <p className="text-sm text-muted-foreground">
            When you integrate with services like Google Calendar, we only request the minimum necessary permissions. Your OAuth tokens are securely stored and never shared with third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Regular Security Audits</h2>
          <p className="text-sm text-muted-foreground">
            We regularly review our security practices and infrastructure to identify and address potential vulnerabilities.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Data Retention</h2>
          <p className="text-sm text-muted-foreground">
            Your data is retained for as long as your account is active. You can request data deletion at any time, and we will securely remove your information from our systems.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Security Concerns</h2>
          <p className="text-sm text-muted-foreground">
            If you discover a security vulnerability, please report it responsibly. Contact us at support@homeflow.app with details of the issue.
          </p>
        </section>
      </div>
    </div>
  );
}