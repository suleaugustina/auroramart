'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import Image from 'next/image';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password required'),
});
type F = z.infer<typeof schema>;

export default function LoginPage() {
  const [show, setShow]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const router            = useRouter();
  const searchParams      = useSearchParams();
  const { setUser }       = useAuthStore();
  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });

  // We call a backend API route for auth (keeps password hashing server-side)
  const onSubmit = async (data: F) => {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? 'Login failed');
      setUser(json.user, json.convexUserId);
      localStorage.setItem('_accessToken', json.accessToken);
      localStorage.setItem('_refreshToken', json.refreshToken);
      toast.success(`Welcome back, ${json.user.firstName}!`);
      router.push(searchParams.get('next') ?? '/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col lg:flex-row">
      {/* Left Side: Image */}
      <div className="hidden lg:block lg:w-1/2 relative bg-ink">
        <Image 
          src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=2000&auto=format&fit=crop" 
          alt="Login" 
          fill 
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <h2 className="font-display text-4xl mb-4">Your premium lifestyle awaits.</h2>
          <p className="text-white/80 max-w-md">Sign in to unlock exclusive deals, manage your orders, and discover new arrivals tailored just for you.</p>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-16 lg:px-12">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <span className="w-6 h-6 bg-orange-500 block rounded-sm" />
              <span className="font-display text-xl text-ink">Aurora<span className="text-orange-500">Mart</span></span>
            </Link>
            <h1 className="font-display text-3xl text-ink">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-2">Sign in to your account to continue</p>
          </div>

          <div className="card p-8 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input {...register('email')} type="email" autoComplete="email"
                  className={`input ${errors.email ? 'input-error' : ''}`} placeholder="you@example.com" />
                {errors.email && <p className="text-danger text-xs mt-1">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="label mb-0">Password</label>
                  <Link href="/auth/forgot-password" className="text-xs text-orange-600 hover:text-orange-700 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input {...register('password')} type={show ? 'text' : 'password'} autoComplete="current-password"
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {show ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                  </button>
                </div>
                {errors.password && <p className="text-danger text-xs mt-1">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={busy} className="btn-primary w-full justify-center py-3 text-sm mt-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
