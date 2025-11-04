// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';

interface WelcomePlaceholderProps {
  icon: React.ReactNode;
  title: string;
  message: string;
}

export const WelcomePlaceholder: React.FC<WelcomePlaceholderProps> = ({ icon, title, message }) => {
  return (
    <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-lg w-full">
      <div className="flex justify-center items-center mb-4 text-cyan-500 opacity-70">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-600 mt-2">{title}</h3>
      <p className="text-slate-500 mt-2 max-w-md mx-auto">
        {message}
      </p>
    </div>
  );
};