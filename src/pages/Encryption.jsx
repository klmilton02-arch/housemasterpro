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
            Secure authentication mechanisms are used to verify your identity. Your password is never stored in plain text and is protected through the use of modern hashing algorithms.
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
            Integration with third party services, third party related data, and third party apps the minimum necessary permissions are requested. OAuth tokens are stored securely and are not shared with third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Regular Security Audits</h2>
          <p className="text-sm text-muted-foreground">
            We regularly review our security practices and infrastructure in order to identify and address potential vulnerabilities.
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
            If you discover or suspect a security vulnerability or breach, please report it to{" "}
            <a href="mailto:support@homeflow.app" className="text-primary underline underline-offset-2">support@homeflow.app</a>.
            {" "}Include any relevant details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">App Store Encryption Declaration</h2>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              HomeFlow complies with Apple's encryption requirements for app distribution on the App Store. Our app uses HTTPS with TLS 1.2+ for all data transmission, which is considered standard encryption exempt from disclosure requirements.
            </p>
            <div className="bg-muted/50 border border-border rounded-lg p-3 space-y-2">
              <h3 className="font-semibold text-foreground text-xs">Info.plist Declaration:</h3>
              <code className="text-xs bg-card p-2 rounded block overflow-x-auto">
                &lt;key&gt;ITSAppUsesNonExemptEncryption&lt;/key&gt;{'\n'}
                &lt;false/&gt;
              </code>
            </div>
            <p>
              This key is set to <code className="bg-muted px-1.5 py-0.5 rounded text-xs">false</code> because HomeFlow only uses standard, exempt encryption methods provided by the operating system (TLS/SSL for HTTPS connections).
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Encryption Standards Used</h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span><strong>TLS 1.2/1.3:</strong> Industry-standard protocol for secure data transmission</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span><strong>HTTPS:</strong> Standard encryption for web communications</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span><strong>At-Rest Encryption:</strong> Server-side encryption using standard algorithms</span>
            </li>
            <li className="flex gap-2">
              <span className="text-primary">✓</span>
              <span><strong>No Proprietary Encryption:</strong> We do not use custom or non-standard encryption algorithms</span>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Encryption Documentation Requirements</h2>
          <p className="text-sm text-muted-foreground">
            Documentation is required if your app contains:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span>•</span>
              <span>Proprietary or non-standard encryption algorithms</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Standard encryption in addition to OS-provided encryption</span>
            </li>
            <li className="flex gap-2">
              <span>•</span>
              <span>Custom key management outside system frameworks</span>
            </li>
          </ul>
          <p className="text-sm text-muted-foreground mt-3">
            HomeFlow does not fall into any of these categories, as we rely exclusively on standard, Apple-approved encryption methods.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">App Store Compliance</h2>
          <p className="text-sm text-muted-foreground">
            All encryption used in HomeFlow is compliant with:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex gap-2">
              <span>✓</span>
              <span>U.S. Export Control Regulations</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>Apple App Store Review Guidelines</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>International standards (IEEE, IETF, ITU)</span>
            </li>
            <li className="flex gap-2">
              <span>✓</span>
              <span>GDPR and privacy regulations</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}