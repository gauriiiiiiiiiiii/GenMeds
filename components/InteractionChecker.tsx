// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { checkDrugInteractions } from '../services/geminiService';
import type { InteractionAnalysisResult, DrugInteraction, InteractionSeverity } from '../types';
import { Spinner } from './Spinner';
import { Alert } from './Alert';
import { ShieldCheckIcon, PlusIcon, XMarkIcon, InteractionCheckerIllustration } from './Icons';
import { WelcomePlaceholder } from './WelcomePlaceholder';

type Status = 'idle' | 'loading' | 'success' | 'error';

const severityStyles: Record<InteractionSeverity, { bg: string; text: string; border: string }> = {
    Major: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    Moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    Minor: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
    None: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
};

interface InteractionCheckerProps {
    initialMedicines?: string[];
    clearInitialMedicines?: () => void;
}

export const InteractionChecker: React.FC<InteractionCheckerProps> = ({ initialMedicines, clearInitialMedicines }) => {
    const [medicines, setMedicines] = React.useState<string[]>(['Aspirin', 'Ibuprofen']);
    const [inputValue, setInputValue] = React.useState<string>('');
    const [status, setStatus] = React.useState<Status>('idle');
    const [result, setResult] = React.useState<InteractionAnalysisResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (initialMedicines && initialMedicines.length > 0) {
            setMedicines(initialMedicines);
            clearInitialMedicines?.(); // Clear after consuming to prevent re-triggering
        }
    }, [initialMedicines, clearInitialMedicines]);

    const handleAddMedicine = () => {
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !medicines.some(med => med.toLowerCase() === trimmedValue.toLowerCase())) {
            setMedicines([...medicines, trimmedValue]);
            setInputValue('');
        }
    };

    const handleRemoveMedicine = (medToRemove: string) => {
        setMedicines(medicines.filter(med => med !== medToRemove));
    };

    const handleCheckInteractions = async () => {
        if (medicines.length < 2) {
            setError('Please add at least two medicines to check for interactions.');
            setStatus('error');
            return;
        }
        
        setStatus('loading');
        setError(null);
        setResult(null);

        try {
            const analysisResult = await checkDrugInteractions(medicines);
            setResult(analysisResult);
            setStatus('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setStatus('error');
        }
    };
    
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-slate-700">Add Medicines</h2>
                <p className="text-sm text-slate-500">Enter at least two medicine names to check for potential interactions.</p>
                <div className="flex gap-2 mt-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddMedicine()}
                        placeholder="e.g., Paracetamol"
                        className="flex-grow p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-cyan-400 outline-none"
                    />
                    <button onClick={handleAddMedicine} className="bg-cyan-500 text-white font-bold p-2 rounded-md hover:bg-cyan-600 transition-colors flex items-center gap-1">
                        <PlusIcon /> Add
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                {medicines.map(med => (
                    <div key={med} className="flex items-center justify-between bg-slate-100 p-2 rounded-md">
                        <span className="font-medium text-slate-700">{med}</span>
                        <button onClick={() => handleRemoveMedicine(med)} className="text-slate-400 hover:text-red-500">
                            <XMarkIcon />
                        </button>
                    </div>
                ))}
            </div>

            <button
                onClick={handleCheckInteractions}
                disabled={medicines.length < 2 || status === 'loading'}
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? <Spinner /> : <ShieldCheckIcon />}
                Check for Interactions
            </button>
            
            <div className="mt-6">
                 {status === 'idle' && (
                    <WelcomePlaceholder
                        icon={<InteractionCheckerIllustration />}
                        title="Check for Drug Interactions"
                        message="Add two or more medicines to the list above and click the button to analyze potential interactions."
                    />
                 )}
                 {status === 'error' && <Alert type="warning" message={error!} />}
                 {status === 'success' && result && (
                     <div>
                        <h2 className="text-xl font-bold mb-4 text-slate-700">Interaction Analysis</h2>
                        <Alert type="info" message={result.summary} />
                        
                        {result.interactions.length > 0 ? (
                            <div className="space-y-4 mt-4">
                                {result.interactions.map((interaction, index) => (
                                    <InteractionCard key={index} interaction={interaction} />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4 p-4 text-center bg-green-50 border border-green-200 rounded-lg">
                                <p className="font-semibold text-green-700">No significant interactions were found by the AI for the provided medicines.</p>
                            </div>
                        )}
                     </div>
                 )}
            </div>
            {status !== 'idle' && <Alert type="warning" message="This AI-powered tool is for informational purposes only and is not a substitute for professional medical advice. Always consult with a qualified healthcare provider before making any decisions about your medication." />}
        </div>
    );
};

const InteractionCard: React.FC<{ interaction: DrugInteraction }> = ({ interaction }) => {
    const styles = severityStyles[interaction.severity] || severityStyles.Minor;
    return (
        <div className={`rounded-lg border ${styles.border} ${styles.bg} overflow-hidden`}>
            <div className={`p-3 border-b ${styles.border}`}>
                <div className="flex justify-between items-center">
                    <span className={`font-bold text-lg ${styles.text}`}>{interaction.severity} Interaction</span>
                </div>
                <p className={`font-semibold mt-1 ${styles.text}`}>
                    {interaction.medicines[0]} + {interaction.medicines[1]}
                </p>
            </div>
            <div className="p-3">
                <p className={`text-sm ${styles.text}`}>{interaction.description}</p>
            </div>
        </div>
    );
}