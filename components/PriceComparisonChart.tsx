// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import type { PriceInfo } from '../types';
import { TagIcon } from './Icons';

// Helper to parse price string like "₹15.50" into a number
const parsePrice = (priceStr: string): number => {
    if (!priceStr) return NaN;
    return parseFloat(priceStr.replace(/[^0-9.-]+/g, ''));
};

export const PriceComparisonChart: React.FC<{ prices: PriceInfo[] }> = ({ prices }) => {
    if (!prices || prices.length === 0) {
        return null;
    }

    const numericPrices = prices
        .map(p => ({
            ...p,
            numericPrice: parsePrice(p.price)
        }))
        .filter(p => !isNaN(p.numericPrice));

    if (numericPrices.length === 0) {
        return <p className="text-sm text-slate-500 italic">Pricing information not available.</p>;
    }

    const minPrice = Math.min(...numericPrices.map(p => p.numericPrice));
    const maxPrice = Math.max(...numericPrices.map(p => p.numericPrice));
    
    const getBarWidth = (price: number) => {
        if (maxPrice === 0) return 0;
        // Ensure that even the max price bar is not 100% to leave some space, unless it's the only item
        const scale = maxPrice > minPrice ? 0.95 : 1.0; 
        const width = (price / maxPrice) * 100 * scale;
        return Math.max(width, 5); // Minimum width for visibility
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 h-full">
            <h5 className="text-md font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
                <TagIcon className="w-5 h-5" /> Price Comparison
            </h5>
            <div className="space-y-4">
                {numericPrices
                    .sort((a, b) => a.numericPrice - b.numericPrice)
                    .map((p, index) => {
                        const barWidth = getBarWidth(p.numericPrice);
                        const isCheapest = p.numericPrice === minPrice;
                        
                        return (
                            <div key={`${p.pharmacy}-${index}`} className="text-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-semibold truncate pr-2 ${isCheapest ? 'text-green-600' : 'text-slate-700'}`} title={p.pharmacy}>{p.pharmacy}</span>
                                    <span className={`font-bold flex-shrink-0 ${isCheapest ? 'text-green-600' : 'text-slate-800'}`}>{p.price}</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 border border-slate-200">
                                    <div
                                        className={`${isCheapest ? 'bg-green-500' : 'bg-cyan-500'} h-full rounded-full transition-all duration-500`}
                                        style={{ width: `${barWidth}%` }}
                                        title={p.price}
                                    ></div>
                                </div>
                                {isCheapest && <p className="text-xs text-green-600 font-semibold mt-1">Best Price</p>}
                            </div>
                        );
                })}
            </div>
        </div>
    );
};