'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail]   = useState('');
  const [busy, setBusy]     = useState(false);
  const [sent, setSent]     = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="w-6 h-6 bg-orange-500 block rounded-sm" />
            <span className="font-display text-xl text-ink">Aurora<span className="text-orange-500">Mart</span></span>
          </Link>
          <h1 className="font-display text-2xl text-ink">{sent ? 'Check your email' : 'Reset your password'}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {sent ? `We sent a reset link to ${email}` : "We'll send you a reset link"}
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500" strokeWidth={1.5} />
              </div>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Click the link in your email to reset your password. Check your spam folder if you don't see it.
              </p>
              <Link href="/auth/login" className="btn-primary w-full justify-center py-3 text-sm">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required className="input" placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3 text-sm">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>

        {!sent && (
          <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-ink mt-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
            Back to Sign In
          </Link>
        )}
      </motion.div>
    </div>
  );
}
