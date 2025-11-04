// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { analyzeSymptoms } from '../services/geminiService';
import type { SymptomAnalysisResult, PossibleCondition, ConditionSeverity, NonMedicinalRemedy } from '../types';
import { Spinner } from './Spinner';
import { Alert } from './Alert';
import { HealthIcon, SparklesIcon, SymptomCheckerIllustration } from './Icons';
import { WelcomePlaceholder } from './WelcomePlaceholder';

type Status = 'idle' | 'loading' | 'success' | 'error';

const severityStyles: Record<ConditionSeverity, { bg: string; text: string; border: string }> = {
    High: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    Medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    Low: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
};

const remedyCategoryStyles: Record<NonMedicinalRemedy['category'], { bg: string; text: string; border: string }> = {
    'Home Remedy': { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
    'Ayurvedic': { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    'Physical Activity': { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' },
    'Lifestyle': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
};

export const SymptomChecker: React.FC = () => {
    const [symptoms, setSymptoms] = React.useState('');
    const [age, setAge] = React.useState('');
    const [gender, setGender] = React.useState('');
    const [medicalHistory, setMedicalHistory] = React.useState('');
    const [status, setStatus] = React.useState<Status>('idle');
    const [result, setResult] = React.useState<SymptomAnalysisResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!symptoms.trim()) {
            setError('Please describe your symptoms before analyzing.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setError(null);
        setResult(null);

        try {
            const personalInfo = {
                age: age || undefined,
                gender: gender || undefined,
                history: medicalHistory.trim() || undefined,
            };
            const analysisResult = await analyzeSymptoms(symptoms, personalInfo);
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
                <h2 className="text-lg font-semibold text-slate-700">Personal Information (Optional)</h2>
                <p className="text-sm text-slate-500">Providing these details helps the AI give a more personalized analysis.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-600">Age</label>
                        <input
                            type="number"
                            id="age"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="e.g., 35"
                            className="w-full p-2 mt-1 rounded-md border border-slate-300 focus:ring-2 focus:ring-cyan-400 outline-none"
                        />
                    </div>
                    <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-slate-600">Gender</label>
                        <select
                            id="gender"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            className="w-full p-2 mt-1 rounded-md border border-slate-300 focus:ring-2 focus:ring-cyan-400 outline-none bg-white"
                        >
                            <option value="">Prefer not to say</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label htmlFor="medical-history" className="block text-sm font-medium text-slate-600">Relevant Medical History</label>
                        <textarea
                            id="medical-history"
                            value={medicalHistory}
                            onChange={(e) => setMedicalHistory(e.target.value)}
                            rows={2}
                            placeholder="e.g., Hypertension, Allergic to penicillin"
                            className="w-full p-2 mt-1 rounded-md border border-slate-300 focus:ring-2 focus:ring-cyan-400 outline-none"
                        />
                    </div>
                </div>
            </div>
            
            <div>
                <h2 className="text-lg font-semibold text-slate-700">Describe Your Symptoms</h2>
                <p className="text-sm text-slate-500">Enter your symptoms in plain language (e.g., "headache and slight fever for 2 days").</p>
                <textarea
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={4}
                    placeholder="Describe your symptoms here..."
                    className="w-full p-2 mt-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-cyan-400 outline-none"
                    aria-label="Symptom Description"
                />
            </div>
            
            <button
                onClick={handleAnalyze}
                disabled={!symptoms.trim() || status === 'loading'}
                className="w-full bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
                {status === 'loading' ? <Spinner /> : <HealthIcon />}
                Analyze Symptoms
            </button>
            
            <div className="mt-6">
                {status === 'idle' && (
                     <WelcomePlaceholder
                        icon={<SymptomCheckerIllustration />}
                        title="Get an AI-Powered Symptom Analysis"
                        message="Enter your symptoms in the text area above and our AI will provide a list of possible conditions and a general recommendation."
                     />
                )}
                {status === 'error' && <Alert type="warning" message={error!} />}
                {status === 'success' && result && (
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-slate-700 flex items-center gap-2"><SparklesIcon /> AI Analysis</h2>
                        
                        <div className="space-y-4">
                            {result.possibleConditions.length > 0 ? (
                                <>
                                    <h3 className="font-semibold text-slate-600">Possible Conditions:</h3>
                                    {result.possibleConditions.map((condition) => (
                                        <ConditionCard key={condition.condition} condition={condition} />
                                    ))}
                                </>
                            ) : (
                                 <Alert type="info" message="The AI could not determine possible conditions based on the symptoms provided. Please try describing them differently." />
                            )}
                        </div>

                        {result.nonMedicinalRemedies && result.nonMedicinalRemedies.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-slate-600">Non-Medicinal Suggestions:</h3>
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {result.nonMedicinalRemedies.map((remedy, index) => (
                                        <RemedyCard key={index} remedy={remedy} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="font-semibold text-slate-600">Recommendation:</h3>
                            <p className="mt-1 text-slate-700">{result.recommendation}</p>
                        </div>
                        
                        <Alert type="warning" message={result.disclaimer || "This AI tool is for informational purposes only. It is not a substitute for professional medical advice. Always consult a qualified healthcare provider."} className="mt-6" />
                    </div>
                )}
            </div>
        </div>
    );
};

const ConditionCard: React.FC<{ condition: PossibleCondition }> = ({ condition }) => {
    const styles = severityStyles[condition.severity] || severityStyles.Low;
    return (
        <div className={`rounded-lg border ${styles.border} ${styles.bg} overflow-hidden`}>
            <div className={`p-3 border-b ${styles.border} flex justify-between items-center flex-wrap gap-2`}>
                <h4 className={`font-bold text-lg ${styles.text}`}>{condition.condition}</h4>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${styles.border} ${styles.text}`}>{condition.severity} Severity</span>
            </div>
            <div className="p-3">
                <p className={`text-sm ${styles.text}`}>{condition.description}</p>
            </div>
        </div>
    );
};

const RemedyCard: React.FC<{ remedy: NonMedicinalRemedy }> = ({ remedy }) => {
    const styles = remedyCategoryStyles[remedy.category] || remedyCategoryStyles['Lifestyle'];
    return (
        <div className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}>
            <div className="flex justify-between items-start">
                 <h4 className={`font-bold text-md ${styles.text} pr-2`}>{remedy.remedy}</h4>
                 <span className={`flex-shrink-0 px-2 py-1 text-xs font-semibold rounded-full border ${styles.border} ${styles.text}`}>{remedy.category}</span>
            </div>
            <p className={`text-sm ${styles.text} mt-2`}>{remedy.description}</p>
        </div>
    );
};