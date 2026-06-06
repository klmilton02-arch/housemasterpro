import { useState } from "react";
import { Mail, MessageSquare, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !message) return;
    setSending(true);
    await base44.integrations.Core.SendEmail({
      to: "klmilton02@gmail.com",
      subject: `Contact Form: ${name || email}`,
      body: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });
    setSent(true);
    setSending(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-16 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Home className="w-6 h-6 text-primary" />
          <span className="text-sm text-muted-foreground font-medium">HomeLifeFocus</span>
        </div>
        <h1 className="font-heading text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground">We'd love to hear from you — questions, feedback, or just saying hi.</p>
      </div>

      {/* Email */}
      <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-4">
        <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-sm">Email us directly</p>
          <a href="mailto:klmilton02@gmail.com" className="text-primary text-sm hover:underline">
            klmilton02@gmail.com
          </a>
          <p className="text-xs text-muted-foreground mt-1">We typically respond within 1–2 business days.</p>
        </div>
      </div>

      {/* Contact form */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold">Send a message</h2>
        </div>
        {sent ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-2xl">✅</p>
            <p className="font-semibold">Message sent!</p>
            <p className="text-sm text-muted-foreground">Thanks for reaching out. We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input placeholder="Your name (optional)" value={name} onChange={e => setName(e.target.value)} />
            <Input type="email" placeholder="Your email *" value={email} onChange={e => setEmail(e.target.value)} required />
            <textarea
              className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Your message *"
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={sending || !email || !message}>
              {sending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        )}
      </div>

      <div className="text-sm text-muted-foreground flex gap-4">
        <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
        <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
        <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
      </div>
    </div>
  );
}