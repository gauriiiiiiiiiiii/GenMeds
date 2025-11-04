// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { identifyPill } from '../services/geminiService';
import type { PillIdentificationResult } from '../types';
import { Spinner } from './Spinner';
import { Alert } from './Alert';
import { UploadIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon, DocumentMagnifyingGlassIcon } from './Icons';
import { WelcomePlaceholder } from './WelcomePlaceholder';

enum Status {
  Idle,
  Uploading,
  Analyzing,
  Success,
  Error,
}

const statusMessages: Record<Status, string> = {
  [Status.Idle]: 'Upload a clear image of a pill to begin.',
  [Status.Uploading]: 'Uploading image...',
  [Status.Analyzing]: 'Identifying pill with AI...',
  [Status.Success]: 'Identification complete. See results below.',
  [Status.Error]: 'An error occurred.',
};

export const PillIdentifier: React.FC = () => {
  const [status, setStatus] = React.useState<Status>(Status.Idle);
  const [error, setError] = React.useState<string | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<PillIdentificationResult | null>(null);

  const processFile = React.useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).');
      setStatus(Status.Error);
      return;
    }

    setResult(null);
    setError(null);
    setStatus(Status.Uploading);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      setImagePreview(reader.result as string);
      
      try {
        setStatus(Status.Analyzing);
        const analysisResult = await identifyPill(base64String, file.type);
        setResult(analysisResult);
        setStatus(Status.Success);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setStatus(Status.Error);
      }
    };
    reader.readAsDataURL(file);
  }, []);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleDrop = React.useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const isProcessing = status === Status.Uploading || status === Status.Analyzing;

  return (
    <div className="space-y-6">
      {!isProcessing && status !== Status.Success && (
        <label
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          htmlFor="pill-upload"
          className="relative block w-full rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-cyan-400 transition-colors cursor-pointer bg-slate-50/50"
        >
          <div className="flex flex-col items-center gap-2 text-slate-500">
              <UploadIcon />
              <span className="font-semibold">Click to upload or drag & drop</span>
              <span className="text-sm">PNG, JPG, or WEBP</span>
          </div>
          <input id="pill-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
        </label>
      )}

      {(isProcessing || status === Status.Error || status === Status.Success) && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-100 border border-slate-200">
          {isProcessing && <Spinner />}
          {status === Status.Success && <CheckCircleIcon className="text-green-500 w-5 h-5" />}
          {status === Status.Error && <ExclamationTriangleIcon className="text-red-500 w-5 h-5" />}
          <div>
            <p className="font-semibold text-slate-700">{statusMessages[status]}</p>
            {status === Status.Error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>
      )}
      
      {status === Status.Idle && (
        <WelcomePlaceholder
            icon={<DocumentMagnifyingGlassIcon />}
            title="Identify Pills with Your Camera"
            message="Upload a clear photo of a pill, and our AI will analyze its shape, color, and imprint to help you identify it."
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {imagePreview && (
          <div className="md:col-span-1">
              <h3 className="text-lg font-semibold mb-2 text-slate-600">Your Image</h3>
              <img src={imagePreview} alt="Pill preview" className="rounded-lg shadow-md w-full" />
          </div>
        )}
        {result && (
          <div className={`md:col-span-${imagePreview ? '2' : '3'}`}>
            <h2 className="text-xl font-bold mb-4 text-slate-700 flex items-center gap-2">
              <SparklesIcon /> AI Identification Result
            </h2>
            <PillResultCard result={result} />
          </div>
        )}
      </div>
      {result && <Alert type="warning" message="Disclaimer: AI-based pill identification may not be 100% accurate. Always verify with a pharmacist or healthcare professional before taking any medication." />}
    </div>
  );
};

const PillResultCard: React.FC<{ result: PillIdentificationResult }> = ({ result }) => (
  <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
    <div className="p-4 bg-slate-50 border-b border-slate-200">
      <h3 className="font-bold text-xl text-slate-800">{result.name}</h3>
      {result.strength && <p className="font-semibold text-slate-600">{result.strength}</p>}
    </div>
    <div className="p-4 space-y-3">
        <InfoRow label="Imprint" value={result.imprint} />
        <InfoRow label="Color" value={result.color} />
        <InfoRow label="Shape" value={result.shape} />
        <InfoRow label="Manufacturer" value={result.manufacturer} />
        <div>
            <h4 className="font-semibold text-slate-600">Common Usage</h4>
            <p className="text-slate-700 text-sm mt-1">{result.usageDescription}</p>
        </div>
    </div>
  </div>
);

const InfoRow: React.FC<{ label: string; value: string | null | undefined }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div>
            <h4 className="font-semibold text-slate-600">{label}</h4>
            <p className="text-slate-700">{value}</p>
        </div>
    );
};