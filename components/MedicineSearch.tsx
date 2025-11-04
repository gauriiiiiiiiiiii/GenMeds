// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { SearchIcon, SparklesIcon, MedicineSearchIllustration, LinkIcon, PillIcon, TagIcon, ShieldCheckIcon, InformationCircleIcon } from './Icons';
import { searchMedicine } from '../services/geminiService';
import { Spinner } from './Spinner';
import { Alert } from './Alert';
import { WelcomePlaceholder } from './WelcomePlaceholder';
import { PriceComparisonChart } from './PriceComparisonChart';
import type { PriceInfo } from '../types';


type Status = 'idle' | 'loading' | 'success' | 'error' | 'notFound';

interface SearchResult {
    content: string;
    sources: Array<{ uri: string; title: string }>;
    note?: string;
}

interface MedicineSearchProps {
    initialQuery?: string;
    clearInitialQuery?: () => void;
}

export const MedicineSearch: React.FC<MedicineSearchProps> = ({ initialQuery, clearInitialQuery }) => {
    const [query, setQuery] = React.useState('');
    const [status, setStatus] = React.useState<Status>('idle');
    const [result, setResult] = React.useState<SearchResult | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const performSearch = React.useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) return;

        setStatus('loading');
        setResult(null);
        setError(null);
        try {
            const searchResult = await searchMedicine(searchQuery);
            if (searchResult && searchResult.content) {
                let content = searchResult.content;
                let note: string | undefined = undefined;

                if (content.startsWith('**Note:**')) {
                    const lines = content.split('\n');
                    const noteLine = lines.shift() || '';
                    note = noteLine.replace(/\*\*/g, '').trim();
                    content = lines.join('\n').trim();
                }

                setResult({ content, sources: searchResult.sources, note });
                setStatus('success');
            } else {
                setStatus('notFound');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
            setStatus('error');
        }
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(query);
    };

    React.useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
            performSearch(initialQuery);
            clearInitialQuery?.(); // Clear after consuming
        }
    // performSearch is memoized with useCallback, so it's safe to include.
    }, [initialQuery, clearInitialQuery, performSearch]);

  return (
    <div className="flex flex-col items-center text-center space-y-6">
        <form onSubmit={handleSearch} className="w-full max-w-lg">
            <div className="relative">
                <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter brand name, e.g., 'Calpol 650'"
                className="w-full p-4 pr-12 rounded-full border border-slate-300 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition"
                />
                <button type="submit" className="absolute top-0 right-0 h-full flex items-center pr-4" aria-label="Search">
                    <SearchIcon className="text-slate-400 hover:text-cyan-500 transition-colors" />
                </button>
            </div>
      </form>
      
      <div className="w-full">
        {status === 'loading' && (
            <div className="flex justify-center items-center p-8">
                <Spinner />
            </div>
        )}
        {status === 'idle' && (
            <WelcomePlaceholder
                icon={<MedicineSearchIllustration />}
                title="Find Your Medicine"
                message="Enter the name of a branded medicine to see its details and discover affordable generic alternatives with real-time pricing."
            />
        )}
        {status === 'notFound' && (
            <Alert type="info" message={`No results found for "${query}". Please check the spelling or try another medicine.`} />
        )}
         {status === 'error' && (
            <Alert type="warning" message={error ?? 'An unknown error occurred.'} />
        )}
        {status === 'success' && result && (
            <div className="text-left w-full">
                {result.note && <Alert type="info" message={result.note} className="mb-4" />}
                <MarkdownRenderer content={result.content} />
                {result.sources.length > 0 && (
                    <div className="mt-6">
                        <SourceList sources={result.sources} />
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    // Group lines into sections based on '##' headings
    const sections: { title: string; lines: string[] }[] = [];
    let currentSection: { title: string; lines: string[] } | null = null;

    content.split('\n').forEach(line => {
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = { title: line.substring(3).trim(), lines: [] };
        } else if (currentSection && line.trim() !== '') {
            currentSection.lines.push(line.trim());
        }
    });

    if (currentSection) {
        sections.push(currentSection);
    }
    
    // If no sections could be parsed, display as-is to prevent blank screen on minor format deviations
    if (sections.length === 0) {
        return <div className="prose max-w-none"><pre>{content}</pre></div>
    }

    return (
        <div className="space-y-6">
            {sections.map((section, index) => (
                <SectionCard key={index} title={section.title} lines={section.lines} />
            ))}
        </div>
    );
};

const SectionCard: React.FC<{ title: string; lines: string[] }> = ({ title, lines }) => {
    // Render Salt Comparison as a simple text block
    if (title.toLowerCase().includes('salt comparison')) {
        return (
             <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 md:p-6">
                <h2 className="text-xl font-bold mb-3 text-slate-800 flex items-center gap-2"><SparklesIcon /> {title}</h2>
                <p className="text-slate-600">{lines.join('\n')}</p>
            </div>
        )
    }

    const details: { label: string; value: string }[] = [];
    const priceList: PriceInfo[] = [];
    let regulatoryStatus: string | null = null;
    let recallWarning: string | null = null;

    lines.forEach(line => {
        const match = line.match(/^\s*\*\s*\*\*(.*?)\*\*:\s*(.*)/);
        if (!match) return;

        const key = match[1].trim();
        const value = match[2].trim();

        if (key.toLowerCase() === 'prices') {
            // This line is just the "* **Prices**:" header, ignore it
        } else if (key.toLowerCase() === 'regulatory status') {
            regulatoryStatus = value;
        } else if (key.toLowerCase() === 'recall/warning') {
            if (value.toLowerCase() !== 'none') {
                recallWarning = value;
            }
        } else {
            const priceValueMatch = value.match(/^(₹|Rs\.?)\s*[\d,]+\.?\d*/);
            if (priceValueMatch) {
                const pharmacyName = key.replace(/\[(.*?)\]\(.*?\)/g, '$1');
                priceList.push({ pharmacy: pharmacyName, price: priceValueMatch[0] });
            } else {
                details.push({ label: key, value: value });
            }
        }
    });
    
    const cardIcon = title.toLowerCase().includes('branded') 
        ? <PillIcon className="w-6 h-6 text-cyan-600" /> 
        : <TagIcon className="w-6 h-6 text-green-600" />;

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    {cardIcon}
                    <span>{title}</span>
                </h2>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-4">
                    {details.map(detail => (
                        <div key={detail.label}>
                            <p className="text-sm font-medium text-slate-500">{detail.label}</p>
                            <p className="font-semibold text-slate-700">{detail.value}</p>
                        </div>
                    ))}
                    {regulatoryStatus && (
                        <div>
                            <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5"><ShieldCheckIcon className="w-4 h-4" />Regulatory Status</p>
                            <p className="font-semibold text-slate-700">{regulatoryStatus}</p>
                        </div>
                    )}
                     {details.length === 0 && !regulatoryStatus && <p className="text-slate-500 italic">Details not available.</p>}
                     {recallWarning && (
                        <Alert type="warning" message={<><strong className="font-semibold">Recall/Warning:</strong> {recallWarning}</>} />
                     )}
                </div>
                {priceList.length > 0 && (
                     <PriceComparisonChart prices={priceList} />
                )}
            </div>
        </div>
    );
};


const SourceList: React.FC<{ sources: Array<{ uri: string; title: string }> }> = ({ sources }) => {
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    if (uniqueSources.length === 0) return null;

    return (
        <div className="mt-6 pt-4 border-t border-slate-200 bg-white rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 mb-2">Sources</h3>
            <ul className="space-y-1">
                {uniqueSources.map((source: { uri: string; title: string }, index) => (
                    <li key={index} className="text-sm">
                        <a
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:text-cyan-700 ude-underline flex items-center gap-1.5 break-all"
                        >
                            <LinkIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{source.title || new URL(source.uri).hostname}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};