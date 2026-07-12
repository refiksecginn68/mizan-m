"use client";

import { useState } from "react";
import HeroVideo from "@/components/landing/hero-video";
import HammerScene from "@/components/landing/hammer-scene";
import TrustBar from "@/components/landing/trust-bar";
import FeaturesGrid from "@/components/landing/features-grid";
import HowItWorks from "@/components/landing/how-it-works";
import StatsBand from "@/components/landing/stats-band";
import PricingPreview from "@/components/landing/pricing-preview";
import FaqAccordion from "@/components/landing/faq-accordion";
import CtaBand from "@/components/landing/cta-band";
import KvkkModal from "@/components/landing/kvkk-modal";

// Landing bölümlerini sıralar; Avukat Girişi CTA'ları ortak KVKK modalını tetikler
export default function LandingClient() {
  const [kvkkOpen, setKvkkOpen] = useState(false);

  return (
    <>
      <HeroVideo onAvukatGiris={() => setKvkkOpen(true)} />
      <TrustBar />
      <HammerScene />
      <FeaturesGrid />
      <HowItWorks />
      <StatsBand />
      <PricingPreview />
      <FaqAccordion />
      <CtaBand onAvukatGiris={() => setKvkkOpen(true)} />
      <KvkkModal open={kvkkOpen} onOpenChange={setKvkkOpen} />
    </>
  );
}
