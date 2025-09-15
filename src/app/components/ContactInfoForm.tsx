'use client';

import { ContactInfoFormProps } from '../../../types/businessCard';

export const ContactInfoForm = ({
                                    formData,
                                    setFormData,
                                    onNext,
                                    onAddField,
                                    onRemoveField
                                }: ContactInfoFormProps) => {

    const handleFieldChange = (field: keyof typeof formData, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleContactChange = (
        fieldType: 'phones' | 'emails' | 'websites',
        index: number,
        property: 'value' | 'label' | 'isPrimary',
        value: any
    ) => {
        setFormData(prev => ({
            ...prev,
            [fieldType]: prev[fieldType].map((item, i) =>
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
            <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h3>
                <p className="text-gray-600">Fill in your professional details for the business cards</p>
            </div>

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
                                placeholder="John Doe"
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
                                placeholder="Marketing Director"
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
                                placeholder="Acme Corporation"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Methods */}
                <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Methods</h4>

                    {/* Phone Numbers */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">Phone Numbers</label>
                            <button
                                type="button"
                                onClick={() => onAddField('phones')}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                + Add Phone
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.phones.map((phone, index) => (
                                <div key={index} className="flex space-x-3">
                                    <input
                                        type="text"
                                        placeholder="Label"
                                        value={phone.label}
                                        onChange={(e) => handleContactChange('phones', index, 'label', e.target.value)}
                                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="(555) 123-4567"
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
                    </div>

                    {/* Email Addresses */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">Email Addresses *</label>
                            <button
                                type="button"
                                onClick={() => onAddField('emails')}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                + Add Email
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.emails.map((email, index) => (
                                <div key={index} className="flex space-x-3">
                                    <input
                                        type="email"
                                        placeholder="email@company.com"
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
                    </div>

                    {/* Websites */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-medium text-gray-700">Websites</label>
                            <button
                                type="button"
                                onClick={() => onAddField('websites')}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                                + Add Website
                            </button>
                        </div>
                        {formData.websites.length > 0 && (
                            <div className="space-y-3">
                                {formData.websites.map((website, index) => (
                                    <div key={index} className="flex space-x-3">
                                        <input
                                            type="url"
                                            placeholder="www.company.com"
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

            {/* Validation Message */}
            {!isFormValid() && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-amber-800 text-sm">
                        <strong>Required:</strong> Name, Company Name, and at least one contact method (phone or email)
                    </p>
                </div>
            )}

            {/* Next Button */}
            <div className="flex justify-end pt-6 border-t">
                <button
                    onClick={onNext}
                    disabled={!isFormValid()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                    <span>Choose Template</span>
                    <span>→</span>
                </button>
            </div>
        </div>
    );
};