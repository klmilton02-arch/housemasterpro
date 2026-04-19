import { Mail, MessageCircle, HelpCircle } from "lucide-react";
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
            <a href="mailto:support@housemasterpro.com">
              <Button variant="default" className="w-full">
                support@housemasterpro.com
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

        {/* Feedback */}
        <div className="bg-card border border-border rounded-xl p-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-heading font-semibold">Send Feedback</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Have a suggestion or found a bug? We'd love to hear from you. Your feedback helps us improve HouseMasterPro.
          </p>
          <a href="mailto:feedback@housemasterpro.com">
            <Button variant="outline" className="w-full">
              feedback@housemasterpro.com
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}