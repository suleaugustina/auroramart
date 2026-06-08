'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName:  z.string().min(2, 'Last name required'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'Must include an uppercase letter')
    .regex(/[0-9]/, 'Must include a number'),
});
type F = z.infer<typeof schema>;

export default function RegisterPage() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });
  const password = watch('password', '');

  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
  ];

  const onSubmit = async (data: F) => {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Registration failed');
      toast.success('Account created! Please check your email to verify.');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col lg:flex-row-reverse">
      {/* Right Side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-ink">
        <Image 
          src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2000&auto=format&fit=crop" 
          alt="Register" 
          fill 
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white text-right">
          <h2 className="font-display text-4xl mb-4">Elevate your everyday.</h2>
          <p className="text-white/80 max-w-md ml-auto">Join a community of thousands discovering premium goods. Fast delivery, secure payments, and exceptional quality.</p>
        </div>
      </div>

      {/* Left Side: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <span className="w-6 h-6 bg-orange-500 block rounded-sm" />
              <span className="font-display text-xl text-ink">Aurora<span className="text-orange-500">Mart</span></span>
            </Link>
            <h1 className="font-display text-3xl text-ink">Create an account</h1>
            <p className="text-gray-500 text-sm mt-2">Join AuroraMart today</p>
          </div>

          <div className="card p-8 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name</label>
                  <input {...register('firstName')} className={`input ${errors.firstName ? 'input-error' : ''}`} placeholder="Emeka" />
                  {errors.firstName && <p className="text-danger text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="label">Last Name</label>
                  <input {...register('lastName')} className={`input ${errors.lastName ? 'input-error' : ''}`} placeholder="Okonkwo" />
                  {errors.lastName && <p className="text-danger text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" autoComplete="email"
                  className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" />
                {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input {...register('password')} type={show ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex gap-4 mt-2">
                    {checks.map((c) => (
                      <span key={c.label} className={`flex items-center gap-1 text-xs transition-colors ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
                        <Check className={`w-3 h-3 ${c.ok ? 'text-green-500' : 'text-gray-300'}`} strokeWidth={2.5} />
                        {c.label}
                      </span>
                    ))}
                  </div>
                )}
                {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3 text-sm mt-4">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                By creating an account you agree to our{' '}
                <Link href="/legal/terms" className="text-orange-600 hover:underline">Terms</Link>{' '}
                and{' '}
                <Link href="/legal/privacy" className="text-orange-600 hover:underline">Privacy Policy</Link>.
              </p>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-orange-600 hover:text-orange-700 font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
