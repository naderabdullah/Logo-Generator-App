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

    // Social media handlers
    const handleAddSocialMedia = () => {
        setFormData(prev => ({
            ...prev,
            socialMedia: [...prev.socialMedia, { value: '', label: '', isPrimary: false }]
        }));
    };

    const handleSocialMediaChange = (index: number, property: 'value' | 'label', value: string) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: prev.socialMedia.map((item, i) =>
                i === index ? { ...item, [property]: value } : item
            )
        }));
    };

    const handleRemoveSocialMedia = (index: number) => {
        setFormData(prev => ({
            ...prev,
            socialMedia: prev.socialMedia.filter((_, i) => i !== index)
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
            {/* UPDATED: 3-column grid structure */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left Column - Personal & Company Info + Slogan & Descriptor */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                    <h4 className="text-base font-semibold text-gray-900 border-b border-blue-300 pb-1">Basic
                        Information</h4>

                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleFieldChange('name', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white text-sm"
                                placeholder="Your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Company Name *
                            </label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => handleFieldChange('companyName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white text-sm"
                                placeholder="Your company name"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Job Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleFieldChange('title', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white text-sm"
                                placeholder="Your job title"
                            />
                        </div>

                        {/* Slogan - MOVED HERE */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Slogan
                            </label>
                            <input
                                type="text"
                                value={formData.slogan || ''}
                                onChange={(e) => handleFieldChange('slogan', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                placeholder="Company tagline"
                            />
                        </div>

                        {/* Descriptor - MOVED HERE */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Descriptor
                            </label>
                            <input
                                type="text"
                                value={formData.descriptor || ''}
                                onChange={(e) => handleFieldChange('descriptor', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                placeholder="Additional description"
                            />
                        </div>
                    </div>
                </div>

                {/* Middle Column - Contact Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <h4 className="text-base font-semibold text-gray-900 border-b border-green-300 pb-1">Contact
                        Details</h4>

                    {/* Phone Numbers - 2 by default */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700">Phone Numbers *</label>
                            <button
                                type="button"
                                onClick={() => onAddField('phones')}
                                className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                            >
                                + Add Phone
                            </button>
                        </div>

                        {formData.phones.length > 0 && (
                            <div className="space-y-2">
                                {formData.phones.map((phone, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="tel"
                                            placeholder={index === 0 ? "Primary phone" : "Secondary phone"}
                                            value={phone.value}
                                            onChange={(e) => handleContactChange('phones', index, 'value', e.target.value)}
                                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                        />
                                        {formData.phones.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveField('phones', index)}
                                                className="text-red-500 hover:text-red-700 px-1 text-xs font-bold"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Email Addresses - 2 by default */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700">Email Addresses *</label>
                            <button
                                type="button"
                                onClick={() => onAddField('emails')}
                                className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                            >
                                + Add Email
                            </button>
                        </div>

                        {formData.emails.length > 0 && (
                            <div className="space-y-2">
                                {formData.emails.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="email"
                                            placeholder={index === 0 ? "Primary email" : "Secondary email"}
                                            value={email.value}
                                            onChange={(e) => handleContactChange('emails', index, 'value', e.target.value)}
                                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                        />
                                        {formData.emails.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => onRemoveField('emails', index)}
                                                className="text-red-500 hover:text-red-700 px-1 text-xs font-bold"
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
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700">Websites</label>
                            <button
                                type="button"
                                onClick={() => onAddField('websites')}
                                className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                            >
                                + Add Website
                            </button>
                        </div>

                        {formData.websites.length > 0 && (
                            <div className="space-y-2">
                                {formData.websites.map((website, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="url"
                                            placeholder="Website URL"
                                            value={website.value}
                                            onChange={(e) => handleContactChange('websites', index, 'value', e.target.value)}
                                            className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => onRemoveField('websites', index)}
                                            className="text-red-500 hover:text-red-700 px-1 text-xs font-bold"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Social Media Only */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                    <h4 className="text-base font-semibold text-gray-900 border-b border-purple-300 pb-1">Social
                        Media</h4>

                    {/* Social Media - 3 by default */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700">Social Profiles</label>
                            <button
                                type="button"
                                onClick={() => handleAddSocialMedia()}
                                className="text-purple-600 hover:text-purple-700 text-xs font-medium"
                            >
                                + Add Social
                            </button>
                        </div>

                        {formData.socialMedia && formData.socialMedia.length > 0 && (
                            <div className="space-y-2">
                                {formData.socialMedia.map((social, index) => (
                                    <div key={index} className="space-y-1">
                                        <input
                                            type="text"
                                            placeholder={
                                                index === 0 ? "LinkedIn" :
                                                    index === 1 ? "Twitter" :
                                                        index === 2 ? "Instagram" : "Platform"
                                            }
                                            value={social.label || ''}
                                            onChange={(e) => handleSocialMediaChange(index, 'label', e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                        />
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="@username or URL"
                                                value={social.value}
                                                onChange={(e) => handleSocialMediaChange(index, 'value', e.target.value)}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSocialMedia(index)}
                                                className="text-red-500 hover:text-red-700 px-1 text-xs font-bold"
                                            >
                                                ×
                                            </button>
                                        </div>
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