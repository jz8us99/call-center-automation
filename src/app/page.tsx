'use client';

import { HelpButton } from '@/components/modals/HelpDialog';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/common/HeroSection';
import IndustriesSection from '@/components/common/IndustriesSection';
import ValueProposition from '@/components/common/ValueProposition';
import TestimonialsSection from '@/components/common/TestimonialsSection';
import IntegrationsSection from '@/components/common/IntegrationsSection';

export default function HomePage() {
  return (
    <div
      className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300"
      suppressHydrationWarning
    >
      <Header />

      <HeroSection />
      <IndustriesSection />
      <ValueProposition />
      <TestimonialsSection />
      <IntegrationsSection />

      <Footer />

      <HelpButton currentPage="home" />
    </div>
  );
}
