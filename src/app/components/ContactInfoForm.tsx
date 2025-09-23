// FILE: src/app/components/ContactInfoForm.tsx
// PURPOSE: REVERTED to original 2-column layout, removed logo preview panel
// This restores the original structure without any logo preview in the form itself

'use client';
import { BusinessCardData } from '../../../types/businessCard';
import { StoredLogo } from '../utils/indexedDBUtils';

interface ContactInfoFormProps {
    formData: BusinessCardData;
    setFormData: (data: BusinessCardData) => void;
    onNext: () => void;
    onAddField: (fieldType: 'phones' | 'emails' | 'websites') => void;
    onRemoveField: (fieldType: 'phones' | 'emails' | 'websites', index: number) => void;
    logo?: StoredLogo; // Keep for compatibility but don't use in this component
}

export const ContactInfoForm = ({
                                    formData,
                                    setFormData,
                                    onNext,
                                    onAddField,
                                    onRemoveField,
                                    logo
                                }: ContactInfoFormProps) => {

    console.log('📋 ContactInfoForm - Rendering with original layout (logo moved to header)');

    const handleFieldChange = (field: keyof BusinessCardData, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleContactChange = (
        type: 'phones' | 'emails' | 'websites',
        index: number,
        property: 'value' | 'label',
        value: string
    ) => {
        setFormData(prev => ({
            ...prev,
            [type]: prev[type].map((item, i) =>
                i === index ? { ...item, [property]: value } : item
            )
        }));
    };

    const isFormValid = () => {
        return !!(
            formData.name.trim() &&
            formData.companyName.trim() &&
            (formData.emails.some(e => e.value.trim()) || formData.phones.some(p => p.value.trim()))
        );
    };

    return (
        <div className="space-y-8">
            {/* REVERTED: Back to original 2-column grid structure */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Personal & Company Info */}
                <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                                placeholder="Your company name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Job Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
                                placeholder="Your job title"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Details */}
                <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Details</h4>

                    {/* Phone Numbers */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Phone Numbers *</label>
                            <button
                                type="button"
                                onClick={() => onAddField('phones')}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                                + Add Phone
                            </button>
                        </div>

                        {formData.phones.length > 0 && (
                            <div className="space-y-3">
                                {formData.phones.map((phone, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g., Mobile, Office)"
                                            value={phone.label}
                                            onChange={(e) => handleContactChange('phones', index, 'label', e.target.value)}
                                            className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Phone number"
                                            value={phone.value}
                                            onChange={(e) => handleContactChange('phones', index, 'value', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        {formData.phones.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveField('phones', index)}
                                                className="text-red-500 hover:text-red-700 px-2 text-sm font-bold"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Email Addresses */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Email Addresses *</label>
                            <button
                                type="button"
                                onClick={() => onAddField('emails')}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                                + Add Email
                            </button>
                        </div>

                        {formData.emails.length > 0 && (
                            <div className="space-y-3">
                                {formData.emails.map((email, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g., Work, Personal)"
                                            value={email.label}
                                            onChange={(e) => handleContactChange('emails', index, 'label', e.target.value)}
                                            className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            value={email.value}
                                            onChange={(e) => handleContactChange('emails', index, 'value', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        {formData.emails.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveField('emails', index)}
                                                className="text-red-500 hover:text-red-700 px-2 text-sm font-bold"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Website URLs */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-700">Websites</label>
                            <button
                                type="button"
                                onClick={() => onAddField('websites')}
                                className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                                + Add Website
                            </button>
                        </div>

                        {formData.websites.length > 0 && (
                            <div className="space-y-3">
                                {formData.websites.map((website, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g., Portfolio, LinkedIn)"
                                            value={website.label}
                                            onChange={(e) => handleContactChange('websites', index, 'label', e.target.value)}
                                            className="w-1/3 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <input
                                            type="url"
                                            placeholder="Website URL"
                                            value={website.value}
                                            onChange={(e) => handleContactChange('websites', index, 'value', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onRemoveField('websites', index)}
                                            className="text-red-500 hover:text-red-700 px-2 text-sm font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Form Validation & Next Button */}
            <div className="pt-8 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        {isFormValid() ? (
                            <span className="text-green-600">✓ All required fields completed</span>
                        ) : (
                            <span className="text-amber-600">* Fill all required fields to continue</span>
                        )}
                    </div>
                    <button
                        onClick={onNext}
                        disabled={!isFormValid()}
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                        Choose Business Card →
                    </button>
                </div>
            </div>
        </div>
    );
};