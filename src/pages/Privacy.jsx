export default function Privacy() {
  return (
    <div className="space-y-6 max-w-xs mx-auto px-1 pt-6 pb-10">
      <div>
        <h1 className="text-4xl font-heading font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-6"><strong>Effective Date:</strong> April 12, 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">1. Introduction</h2>
            <p>
              HouseMasterPro ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold mt-4 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, and password</li>
              <li><strong>Family Information:</strong> Names and details of family members added to your account</li>
              <li><strong>Home Configuration:</strong> Details about your home (number of bedrooms, bathrooms, rooms)</li>
              <li><strong>Task Data:</strong> Tasks you create, assign, and complete within the app</li>
              <li><strong>Calendar Integration:</strong> If you connect Google Calendar, we access calendar data to sync tasks</li>
            </ul>

            <h3 className="text-lg font-semibold mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, unique identifiers</li>
              <li><strong>Usage Data:</strong> Features used, actions taken, time spent in the app</li>
              <li><strong>Log Data:</strong> IP address, browser type, timestamps</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and maintain the app functionality</li>
              <li>Create and manage your family group and assigned tasks</li>
              <li>Sync tasks with your Google Calendar (if connected)</li>
              <li>Manage gamification features (points, levels, badges)</li>
              <li>Send you service-related notifications</li>
              <li>Improve and optimize the app</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">4. Information Sharing</h2>
            <p>
              We do <strong>not</strong> sell, trade, or rent your personal information. We may share information only in these cases:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Family Members:</strong> Family members within your group can see task assignments and completion data relevant to shared tasks</li>
              <li><strong>Service Providers:</strong> Third parties who assist us (hosting, analytics) under confidentiality agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">5. Google Calendar Integration</h2>
            <p>
              HouseMasterPro uses Google Calendar API to sync your tasks. We only access:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your primary calendar events (read/write)</li>
              <li>Event creation and modification for task syncing</li>
            </ul>
            <p>
              We do not access other Google services or share calendar data with third parties. You can revoke access at any time in your Google Account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">6. Data Security</h2>
            <p>
              We implement appropriate security measures including encryption and secure data storage. However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">7. Data Retention</h2>
            <p>
              We retain your information as long as your account is active or as needed to provide services. You can request deletion of your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              HouseMasterPro is designed for families, which may include children. Parents/guardians are responsible for providing informed consent. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete it immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">9. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent for data processing</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy occasionally. Changes will be effective when posted. Continued use of the app constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-heading font-semibold mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="mt-4">
              <strong>HouseMasterPro Support</strong><br/>
              Email: support@housemasterpro.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}