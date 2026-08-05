import React from 'react';
import Image from 'next/image';
import { ShieldCheck, Building2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex flex-col lg:flex-row h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Left/Top Branding Panel */}
      <div className="relative flex flex-col justify-between w-full lg:w-[45%] bg-[#1B2140] text-white p-8 lg:p-12 xl:p-16 shrink-0 overflow-hidden">
        {/* Background Decorative Accent Elements */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#FF4E45]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.02] rounded-full border border-white/5 pointer-events-none" />

        {/* Header / Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white p-2 shadow-lg shadow-black/20 shrink-0">
            <Image
              src="/aims-logo.svg"
              alt="CRMC-AIMS Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              CRMC-AIMS
            </h1>
            <p className="text-xs text-white/70 font-medium">
              Property Custodian System
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 my-8 lg:my-0 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium text-white/90 border border-white/15 backdrop-blur-sm">
            <Building2 className="w-3.5 h-3.5 text-[#FF4E45]" />
            <span>Cebu Roosevelt Memorial Colleges</span>
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
              Asset & Inventory Management System
            </h2>
            <p className="text-sm lg:text-base text-white/75 leading-relaxed font-normal">
              Streamlining campus physical asset tracking, equipment borrowing workflows, maintenance logs, and audit reports for the Property Custodian&apos;s Office.
            </p>
          </div>

          {/* Highlights */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF4E45] shrink-0" />
              <span>Institutional Audit Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FF4E45] shrink-0" />
              <span>Real-time Asset Tracking</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-white/50 pt-4 border-t border-white/10 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} CRMC PCO</span>
          <span>v1.0.0</span>
        </div>
      </div>

      {/* Right/Bottom Form Panel */}
      <main className="flex-1 lg:w-[55%] h-full overflow-y-auto bg-background flex flex-col justify-between p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-xl lg:max-w-2xl mx-auto h-full flex flex-col justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
