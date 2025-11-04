// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { analyzePrescriptionImage, findGenericAlternatives } from '../services/geminiService';
import type { AnalyzedMedicine, PriceInfo, BrandedMedicineAnalysis, GenericAlternative } from '../types';
import { Spinner } from './Spinner';
import { Alert } from './Alert';
import { UploadIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon, SearchIcon, ShieldCheckIcon } from './Icons';
import { PriceComparisonChart } from './PriceComparisonChart';
import { WelcomePlaceholder } from './WelcomePlaceholder';
import { DocumentMagnifyingGlassIcon } from './Icons';

enum Status {
  Idle,
  Uploading,
  Analyzing,
  Fetching,
  Success,
  Error,
}

const statusMessages: Record<Status, string> = {
  [Status.Idle]: 'Upload a prescription image to begin.',
  [Status.Uploading]: 'Uploading image...',
  [Status.Analyzing]: 'Analyzing prescription with AI...',
  [Status.Fetching]: 'Finding generic alternatives...',
  [Status.Success]: 'Analysis complete. See results below.',
  [Status.Error]: 'An error occurred.',
};

interface PrescriptionUploaderProps {
  navigateToSearch: (query: string) => void;
  navigateToInteractionChecker: (medicine: string) => void;
}

export const PrescriptionUploader: React.FC<PrescriptionUploaderProps> = ({ navigateToSearch, navigateToInteractionChecker }) => {
  const [status, setStatus] = React.useState<Status>(Status.Idle);
  const [error, setError] = React.useState<string | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [results, setResults] = React.useState<AnalyzedMedicine[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = React.useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).');
      setStatus(Status.Error);
      return;
    }

    setResults([]);
    setError(null);
    setStatus(Status.Uploading);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      setImagePreview(reader.result as string);
      
      try {
        setStatus(Status.Analyzing);
        const medicines = await analyzePrescriptionImage(base64String, file.type);
        if (medicines.length === 0) {
          setError("No medicines could be identified in the prescription. Please try a clearer image.");
          setStatus(Status.Error);
          return;
        }

        setStatus(Status.Fetching);
        const medicineNames = medicines.map(m => m.name);
        const alternativesMap = await findGenericAlternatives(medicineNames);
        
        const finalResults: AnalyzedMedicine[] = medicines.map(med => ({
          brandedMedicine: med,
          analysis: alternativesMap[med.name] || null
        }));

        setResults(finalResults);
        setStatus(Status.Success);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setStatus(Status.Error);
      }
    };
    reader.readAsDataURL(file);
  }, []);
  
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

  const isProcessing = status === Status.Uploading || status === Status.Analyzing || status === Status.Fetching;

  return (
    <div className="space-y-6">
      {!isProcessing && status !== Status.Success && (
        <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            htmlFor="prescription-upload"
            className="relative block w-full rounded-lg border-2 border-dashed border-slate-300 p-8 text-center hover:border-cyan-400 transition-colors cursor-pointer bg-slate-50/50"
        >
            <div className="flex flex-col items-center gap-2 text-slate-500">
                <UploadIcon />
                <span className="font-semibold">Click to upload or drag & drop</span>
                <span className="text-sm">PNG, JPG, or WEBP</span>
            </div>
            <input id="prescription-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
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
            title="Analyze Your Prescription"
            message="Upload a clear photo of your prescription to get a detailed analysis, including affordable generic alternatives and safety information."
        />
      )}

      {results.length > 0 && (
        <div className="space-y-6">
           <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <SparklesIcon /> AI Analysis Results
            </h2>
          {results.map((result, index) => (
            <ResultCard key={index} result={result} navigateToSearch={navigateToSearch} navigateToInteractionChecker={navigateToInteractionChecker}/>
          ))}
        </div>
      )}
    </div>
  );
};

const ResultCard: React.FC<{ result: AnalyzedMedicine, navigateToSearch: (q: string) => void, navigateToInteractionChecker: (m: string) => void }> = ({ result, navigateToSearch, navigateToInteractionChecker }) => (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-xl text-slate-800">{result.brandedMedicine.name}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                {result.brandedMedicine.dosage && <span><strong>Dosage:</strong> {result.brandedMedicine.dosage}</span>}
                {result.brandedMedicine.quantity && <span><strong>Quantity:</strong> {result.brandedMedicine.quantity}</span>}
                {result.analysis?.brandedSaltComposition && <span><strong>Composition:</strong> {result.analysis.brandedSaltComposition}</span>}
            </div>
        </div>

        <div className="p-4 md:p-6 space-y-4">
            {result.analysis && result.analysis.alternatives.length > 0 ? (
                result.analysis.alternatives.map((alt, index) => (
                    <AlternativeDetail key={index} alternative={alt} />
                ))
            ) : (
                <Alert type="info" message="No generic alternatives were found by the AI for this medicine." />
            )}
        </div>
         <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2">
            <button onClick={() => navigateToSearch(result.brandedMedicine.name)} className="flex-1 text-sm bg-blue-500 text-white font-semibold py-2 px-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5">
                <SearchIcon className="w-4 h-4" />
                <span>Search Details</span>
            </button>
            <button onClick={() => navigateToInteractionChecker(result.brandedMedicine.name)} className="flex-1 text-sm bg-green-500 text-white font-semibold py-2 px-3 rounded-md hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4" />
                <span>Check Interactions</span>
            </button>
        </div>
    </div>
);

const AlternativeDetail: React.FC<{ alternative: GenericAlternative }> = ({ alternative }) => (
    <div className="border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white shadow-sm">
        <div className="md:col-span-2 space-y-3">
             <h4 className="font-bold text-lg text-cyan-700">{alternative.genericName}</h4>
             <div className="text-sm text-slate-600 space-y-1">
                 <p><strong>Composition:</strong> {alternative.saltComposition}</p>
                 <p><strong>Strength:</strong> {alternative.strength}</p>
                 <p><strong>Form:</strong> {alternative.form}</p>
             </div>
             <div className="flex flex-wrap gap-2 text-xs">
                 <span className={`font-semibold px-2 py-1 rounded-full ${alternative.cdscoStatus === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                     CDSCO: {alternative.cdscoStatus}
                 </span>
                 <span className="font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-800">
                     {alternative.schedule}
                 </span>
             </div>
             {alternative.recallNotice && <Alert type="warning" message={<><strong className="font-semibold">Recall Notice:</strong> {alternative.recallNotice}</>} />}
             {alternative.safetyNote && <Alert type="info" message={<><strong className="font-semibold">Safety Note:</strong> {alternative.safetyNote}</>} />}
        </div>
        <div className="md:col-span-1">
            <PriceComparisonChart prices={alternative.prices} />
        </div>
    </div>
);