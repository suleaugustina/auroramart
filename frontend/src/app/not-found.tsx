import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <p className="font-mono text-xs text-gray-400 uppercase tracking-widest mb-4">404</p>
        <h1 className="font-display text-4xl text-ink mb-3">Page not found</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">Go Home</Link>
          <Link href="/shop/products" className="btn-outline">Browse Products</Link>
        </div>
      </div>
    </div>
  );
}
