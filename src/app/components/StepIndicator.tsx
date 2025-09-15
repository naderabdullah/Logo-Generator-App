'use client';

import { StepIndicatorProps } from '../../../types/businessCard';

export const StepIndicator = ({ step, label, isActive, isCompleted }: StepIndicatorProps) => {
    return (
        <div className={`flex items-center space-x-3 ${
            isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
        }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                isActive
                    ? 'bg-purple-600 text-white'
                    : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
            }`}>
                {isCompleted ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                ) : (
                    step
                )}
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
};