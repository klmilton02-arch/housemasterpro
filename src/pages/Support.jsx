import { Mail, MessageCircle, HelpCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Support() {
  return (
    <div className="space-y-6 max-w-xs mx-auto px-1 pt-2 pb-10 md:pt-6 md:pb-8">
      <div>
        <h1 className="text-4xl font-heading font-bold mb-4">Support Center</h1>
        <p className="text-lg text-muted-foreground mb-12">We're here to help. Get in touch with us.</p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Email Support */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-heading font-semibold">Email Support</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Send us an email with any questions or issues. We typically respond within 24 hours.
            </p>
            <a href="mailto:klmilton02@gmail.com">
              <Button variant="default" className="w-full">
                klmilton02@gmail.com
              </Button>
            </a>
          </div>

          {/* FAQ */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-heading font-semibold">FAQs</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Find answers to common questions about using HouseMasterPro.
            </p>
            <Link to="/faq">
              <Button variant="outline" className="w-full">
                View FAQs
              </Button>
            </Link>
          </div>
        </div>

        {/* Phone Support */}
        <div className="bg-card border border-border rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-heading font-semibold">Phone Support</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Call us directly. We're available to help with your questions.
        </p>
        <a href="tel:6467521304">
          <Button variant="outline" className="w-full">
            646-752-1304
          </Button>
        </a>
        </div>
      </div>
    </div>
  );
}