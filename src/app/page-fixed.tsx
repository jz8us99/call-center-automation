'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const initializeAuth = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { supabase } = await import('@/lib/supabase');

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.warn('Supabase auth error:', error.message);
          // Don't throw error, just continue without auth
        } else {
          setUser(user);
        }
      } catch (err) {
        console.warn('Failed to initialize auth:', err);
        setError(
          err instanceof Error ? err.message : 'Auth initialization failed'
        );
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const handleClickOutside = () => {
      if (showUserMenu) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu, mounted]);

  const handleSignOut = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase.auth.signOut();
      setUser(null);
      setShowUserMenu(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const getUserDisplayName = () => {
    return user?.email?.split('@')[0] || 'User';
  };

  // Show loading state during hydration
  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state if there's a critical error
  if (error && error.includes('Environment')) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Configuration Error</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const industries = [
    {
      image: '/api/placeholder/400/300',
      title: 'Home Services',
      subtitle: 'Convert calls into booked jobs, 24/7',
      description:
        'From plumbing to HVAC, we handle customer calls professionally',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Doctor and Wellness Offices',
      subtitle: 'Help clients faster',
      description:
        'Professional AI-powered call handling bookings scheduling and more',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Marketing Agencies',
      subtitle: 'Never miss a lead',
      description: 'Professional call handling for marketing professionals',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Pet Services',
      subtitle: 'Keep pet parents happy',
      description: 'Caring AI call handling for veterinarians and pet care',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Property Management',
      subtitle: '24/7 tenant support',
      description: 'Round-the-clock property management call handling',
    },
    {
      image: '/api/placeholder/400/300',
      title: 'Salons & Spas',
      subtitle: 'Book appointments seamlessly',
      description: 'Professional appointment booking and customer service',
    },
  ];

  const testimonials = [
    {
      avatar: '/api/placeholder/60/60',
      name: 'Smith Cooper',
      company: 'Smith test law',
      rating: 5,
      text: 'The AI receptionist has transformed our practice. We never miss a call and clients love the professional service.',
    },
    {
      avatar: '/api/placeholder/60/60',
      name: 'Jenny Backer',
      company: 'Test user',
      rating: 5,
      text: 'Our booking rate increased by 40% since using the service. The ROI is incredible.',
    },
    {
      avatar: '/api/placeholder/60/60',
      name: 'Amy Brown',
      company: 'Bella test spa',
      rating: 5,
      text: 'Professional, reliable, and cost-effective. Our clients love the consistent, high-quality service.',
    },
  ];

  const integrations = [
    { name: 'Salesforce', logo: '/api/placeholder/120/60' },
    { name: 'Zapier', logo: '/api/placeholder/120/60' },
    { name: 'Calendly', logo: '/api/placeholder/120/60' },
    { name: 'Slack', logo: '/api/placeholder/120/60' },
    { name: 'HubSpot', logo: '/api/placeholder/120/60' },
    { name: 'Google Calendar', logo: '/api/placeholder/120/60' },
  ];

  return (
    <div className="min-h-screen bg-white transition-colors duration-300">
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
              <a
                href="#partners"
                className="text-black hover:text-orange-500 transition-colors"
              >
                Partners
              </a>
              <a
                href="#company"
                className="text-black hover:text-orange-500 transition-colors"
              >
                Company
              </a>
            </nav>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-black">
                      Welcome, {getUserDisplayName()}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setShowUserMenu(!showUserMenu);
                      }}
                      className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-3 py-2 rounded-lg transition-colors border border-gray-300"
                    >
                      <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs font-semibold text-white">
                        {getUserDisplayName().charAt(0).toUpperCase()}
                      </div>
                      <svg
                        className={`h-4 w-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </div>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {getUserDisplayName().charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-black font-medium">
                                {getUserDisplayName()}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            className="flex items-center gap-3 px-4 py-2 text-black hover:text-orange-500 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowUserMenu(false)}
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
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                            Dashboard
                          </Link>

                          <div className="border-t border-gray-200 my-1"></div>

                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 px-4 py-2 text-black hover:text-orange-500 hover:bg-gray-50 transition-colors w-full text-left"
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
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                </>
              )}
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
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"
                  />
                </svg>
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="solutions" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
              We serve a variety of industries
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              Tailored AI solutions for every business type
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 shadow-md border border-gray-200 hover:border-orange-200"
              >
                <div className="bg-white p-6 flex items-center justify-center min-h-[140px]">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-black mb-2 group-hover:text-orange-600 transition-colors">
                      {industry.title}
                    </h3>
                    <p className="text-orange-600 font-semibold text-sm">
                      {industry.subtitle}
                    </p>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-black text-sm leading-relaxed">
                    {industry.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-8">
                Total call coverage, powered by{' '}
                <span className="text-orange-500">advanced AI</span>
              </h2>
              <p className="text-xl text-black mb-8">
                Our intelligent AI system provides professional, efficient call
                handling that ensures every customer receives exceptional
                service.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  95%
                </div>
                <div className="text-black">Customer satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  4.9/5
                </div>
                <div className="text-black">Clutch rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  24/7
                </div>
                <div className="text-black">Availability</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-500 mb-2">
                  4.8/5
                </div>
                <div className="text-black">Trustpilot rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              What our customers say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow-lg border border-gray-200"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-black">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {testimonial.company}
                    </p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-orange-500 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-black italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="partners" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-6">
              Integrates with your favorite tools
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
            {integrations.map((integration, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
              >
                <div className="h-8 flex items-center justify-center">
                  <span className="text-black font-semibold">
                    {integration.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">R</span>
                </div>
                <span className="text-xl font-bold text-black">
                  JSX-ReceptionAI
                </span>
              </div>
              <p className="text-black mb-6">
                Never miss another customer with our professional receptionist
                services.
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Solutions</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    AI Receptionist
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Live Chat
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Appointment Booking
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Industries</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Home Services
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Law Offices
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Healthcare
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Real Estate
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-black mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-black hover:text-orange-500 transition-colors"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 text-sm mb-4 md:mb-0">
                © 2024 JSX-ReceptionAI. All rights reserved.
              </p>
              <div className="flex space-x-6 text-sm">
                <a
                  href="#"
                  className="text-gray-500 hover:text-orange-500 transition-colors"
                >
                  Privacy Policy
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-orange-500 transition-colors"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-gray-500 hover:text-orange-500 transition-colors"
                >
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
