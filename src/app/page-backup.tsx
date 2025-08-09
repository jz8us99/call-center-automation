'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">R</span>
              </div>
              <span className="text-xl font-bold text-black">JSX-ReceptionAI</span>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#products"
                className="text-black hover:text-orange-500 transition-colors"
              >
                Products
              </a>
              <a
                href="#solutions"
                className="text-black hover:text-orange-500 transition-colors"
              >
                Solutions
              </a>
              <Link
                href="/pricing"
                className="text-black hover:text-orange-500 transition-colors"
              >
                Pricing
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link
                href="/auth"
                className="text-black hover:text-orange-500 transition-colors"
              >
                Sign In
              </Link>
              <span className="text-gray-400">|</span>
              <a
                href="tel:+15551234567"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-orange-500 hover:text-white text-black rounded-lg transition-all duration-200 border border-gray-300 hover:border-orange-500 shadow-sm"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                (555) 123-4567
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-black mb-8 leading-tight">
              Your 24x7 Receptionist
              <br />
              <span className="text-orange-500">Powered by AI</span>
            </h1>

            <p className="text-xl md:text-2xl text-black mb-12 max-w-3xl mx-auto leading-relaxed">
              Get the #1 rated receptionist service for small businesses.
            </p>

            <div className="flex justify-center mb-16">
              <Link
                href="/signup"
                className="bg-orange-500 hover:bg-orange-600 text-white text-xl px-12 py-6 rounded-lg font-semibold inline-flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple footer */}
      <footer className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">R</span>
              </div>
              <span className="text-xl font-bold text-black">JSX-ReceptionAI</span>
            </div>
            <p className="text-black mb-6">
              Never miss another customer with our professional receptionist
              services.
            </p>
            <p className="text-gray-500 text-sm">
              © 2024 JSX-ReceptionAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
