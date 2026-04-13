export default function Copyright() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div>
          <h1 className="font-heading text-4xl sm:text-3xl font-bold text-foreground">Copyright Information</h1>
          <p className="text-lg text-muted-foreground mt-2">HomeFlow intellectual property and usage rights</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Copyright Notice</h2>
          <p className="text-sm text-muted-foreground">
            © {currentYear} HomeFlow. All rights reserved.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Intellectual Property</h2>
          <p className="text-sm text-muted-foreground">
            HomeFlow and all associated logos, names, designs, and other content are the exclusive property of HomeFlow and its licensors. The HomeFlow platform, including its software, features, functionality, and all original content, are protected by copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">License to Use</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              HomeFlow grants you a limited, non-exclusive, non-transferable license to access and use the platform for personal household management purposes, subject to these terms and our Terms of Service. You may not:
            </p>
            <ul className="space-y-1 ml-4">
              <li>• Reproduce, distribute, or transmit any content without permission</li>
              <li>• Modify, adapt, or create derivative works of the platform</li>
              <li>• Remove or obscure any proprietary notices or labels</li>
              <li>• Use the platform for commercial purposes without authorization</li>
              <li>• Reverse engineer or attempt to discover source code</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">User-Generated Content</h2>
          <p className="text-sm text-muted-foreground">
            By using HomeFlow, you retain ownership of any content you create (tasks, notes, family information). However, you grant HomeFlow a license to use, reproduce, and display this content as necessary to operate the platform and provide our services.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Third-Party Content</h2>
          <p className="text-sm text-muted-foreground">
            HomeFlow may contain third-party content, including fonts, icons, and libraries. These are used under appropriate licenses and remain the property of their respective owners.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Trademarks</h2>
          <p className="text-sm text-muted-foreground">
            HomeFlow, the HomeFlow logo, and other HomeFlow marks are trademarks of HomeFlow. You may not use these marks without prior written consent.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">DMCA Notice</h2>
          <p className="text-sm text-muted-foreground">
            HomeFlow respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA). If you believe your copyright has been infringed, please contact us with details of the infringement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Questions</h2>
          <p className="text-sm text-muted-foreground">
            For copyright inquiries or permissions, contact us at copyright@homeflow.app
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-xl font-semibold">Last Updated</h2>
          <p className="text-sm text-muted-foreground">
            April 2026
          </p>
        </section>
      </div>
    </div>
  );
}