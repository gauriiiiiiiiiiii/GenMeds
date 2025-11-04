// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { LogoIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
      <div className="container mx-auto max-w-7xl p-4 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <LogoIcon />
          <span className="text-2xl font-bold text-cyan-600">GenMeds</span>
        </div>
      </div>
    </header>
  );
};