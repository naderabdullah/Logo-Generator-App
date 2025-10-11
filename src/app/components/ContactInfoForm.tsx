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
                    <h4 className="text-base font-semibold text-gray-900 border-b border-blue-300 pb-1">
                        Basic Information
                    </h4>

                    <div className="space-y-3">
                        {/* Full Name - REQUIRED */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => {
                                    console.log('📝 [ContactInfoForm] Full Name changed:', e.target.value);
                                    handleFieldChange('name', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Company Name - REQUIRED */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Company Name <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.companyName}
                                onChange={(e) => {
                                    console.log('📝 [ContactInfoForm] Company Name changed:', e.target.value);
                                    handleFieldChange('companyName', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
                                placeholder="Your company name"
                            />
                        </div>

                        {/* Job Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Job Title
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => {
                                    console.log('📝 [ContactInfoForm] Job Title changed:', e.target.value);
                                    handleFieldChange('title', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
                                placeholder="Your job title"
                            />
                        </div>

                        {/* Professional Credentials - CLEANED UP */}
                        <div>
                            <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">
                                Professional Credentials
                            </label>
                            <input
                                type="text"
                                id="subtitle"
                                name="subtitle"
                                value={formData.subtitle || ''}
                                onChange={(e) => {
                                    console.log('📝 [ContactInfoForm] Credentials changed:', e.target.value);
                                    handleFieldChange('subtitle', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
                                placeholder="CFA, PhD, MBA, etc."
                                maxLength={50}
                            />
                        </div>

                        {/* Slogan */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Slogan
                            </label>
                            <input
                                type="text"
                                value={formData.slogan || ''}
                                onChange={(e) => {
                                    console.log('📝 [ContactInfoForm] Slogan changed:', e.target.value);
                                    handleFieldChange('slogan', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
                                placeholder="Company tagline"
                            />
                        </div>

                        {/* Year Established - CLEANED UP */}
                        <div>
                            <label htmlFor="yearEstablished" className="block text-sm font-medium text-gray-700 mb-1">
                                Year Established
                            </label>
                            <input
                                type="text"
                                id="yearEstablished"
                                value={formData.yearEstablished || ''}
                                onChange={(e) => {
                                    console.log('📝 [ContactInfoForm] Year Established changed:', e.target.value);
                                    setFormData({...formData, yearEstablished: e.target.value});
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
                                placeholder="Est. 1995"
                                maxLength={50}
                            />
                        </div>

                        {/* Descriptor */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descriptor
                            </label>
                            <input
                                type="text"
                                value={formData.descriptor || ''}
                                onChange={(e) => {
                                    console.log('📝 [ContactInfoForm] Descriptor changed:', e.target.value);
                                    handleFieldChange('descriptor', e.target.value);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors bg-white"
                                placeholder="Additional description"
                            />
                        </div>
                    </div>
                </div>


                {/* Middle Column - Contact Details */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                    <h3 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        Contact Details <span className="text-xs font-normal">(at least one phone or one email)</span> <span className="text-sm text-red-600 font-normal">*</span>
                    </h3>

                    {/* Phone Numbers - 3 Fixed Inputs */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Phone Numbers
                        </label>
                        <div className="space-y-2">
                            {/* Phone 1 */}
                            <input
                                type="tel"
                                placeholder="Phone 1"
                                value={formData.phones[0]?.value || ''}
                                onChange={(e) => {
                                    const newPhones = [...formData.phones];
                                    if (!newPhones[0]) {
                                        newPhones[0] = {value: e.target.value, label: 'Mobile', isPrimary: true};
                                    } else {
                                        newPhones[0].value = e.target.value;
                                    }
                                    setFormData({...formData, phones: newPhones});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                            {/* Phone 2 */}
                            <input
                                type="tel"
                                placeholder="Phone 2"
                                value={formData.phones[1]?.value || ''}
                                onChange={(e) => {
                                    const newPhones = [...formData.phones];
                                    while (newPhones.length < 2) {
                                        newPhones.push({value: '', label: 'Office', isPrimary: false});
                                    }
                                    newPhones[1].value = e.target.value;
                                    setFormData({...formData, phones: newPhones});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                            {/* Phone 3 */}
                            <input
                                type="tel"
                                placeholder="Phone 3"
                                value={formData.phones[2]?.value || ''}
                                onChange={(e) => {
                                    const newPhones = [...formData.phones];
                                    while (newPhones.length < 3) {
                                        newPhones.push({value: '', label: 'Home', isPrimary: false});
                                    }
                                    newPhones[2].value = e.target.value;
                                    setFormData({...formData, phones: newPhones});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Email Addresses - 3 Fixed Inputs */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Email Addresses
                        </label>
                        <div className="space-y-2">
                            {/* Email 1 */}
                            <input
                                type="email"
                                placeholder="Email 1"
                                value={formData.emails[0]?.value || ''}
                                onChange={(e) => {
                                    const newEmails = [...formData.emails];
                                    if (!newEmails[0]) {
                                        newEmails[0] = {value: e.target.value, label: 'Work', isPrimary: true};
                                    } else {
                                        newEmails[0].value = e.target.value;
                                    }
                                    setFormData({...formData, emails: newEmails});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                            {/* Email 2 */}
                            <input
                                type="email"
                                placeholder="Email 2"
                                value={formData.emails[1]?.value || ''}
                                onChange={(e) => {
                                    const newEmails = [...formData.emails];
                                    while (newEmails.length < 2) {
                                        newEmails.push({value: '', label: 'Personal', isPrimary: false});
                                    }
                                    newEmails[1].value = e.target.value;
                                    setFormData({...formData, emails: newEmails});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                            {/* Email 3 */}
                            <input
                                type="email"
                                placeholder="Email 3"
                                value={formData.emails[2]?.value || ''}
                                onChange={(e) => {
                                    const newEmails = [...formData.emails];
                                    while (newEmails.length < 3) {
                                        newEmails.push({value: '', label: 'Other', isPrimary: false});
                                    }
                                    newEmails[2].value = e.target.value;
                                    setFormData({...formData, emails: newEmails});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Websites - 2 Fixed Inputs */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Websites
                        </label>
                        <div className="space-y-2">
                            {/* Website 1 */}
                            <input
                                type="url"
                                placeholder="Website 1"
                                value={formData.websites[0]?.value || ''}
                                onChange={(e) => {
                                    const newWebsites = [...formData.websites];
                                    if (!newWebsites[0]) {
                                        newWebsites[0] = {value: e.target.value, label: 'Company', isPrimary: true};
                                    } else {
                                        newWebsites[0].value = e.target.value;
                                    }
                                    setFormData({...formData, websites: newWebsites});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                            {/* Website 2 */}
                            <input
                                type="url"
                                placeholder="Website 2"
                                value={formData.websites[1]?.value || ''}
                                onChange={(e) => {
                                    const newWebsites = [...formData.websites];
                                    while (newWebsites.length < 2) {
                                        newWebsites.push({value: '', label: 'Portfolio', isPrimary: false});
                                    }
                                    newWebsites[1].value = e.target.value;
                                    setFormData({...formData, websites: newWebsites});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Addresses - 2 Fixed Inputs */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Addresses
                        </label>
                        <div className="space-y-2">
                            {/* Address 1 */}
                            <input
                                type="text"
                                placeholder="Address 1"
                                value={formData.addresses[0]?.value || ''}
                                onChange={(e) => {
                                    const newAddresses = [...formData.addresses];
                                    if (!newAddresses[0]) {
                                        newAddresses[0] = {value: e.target.value, label: '', isPrimary: true};
                                    } else {
                                        newAddresses[0].value = e.target.value;
                                    }
                                    setFormData({...formData, addresses: newAddresses});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />

                            {/* Address 2 */}
                            <input
                                type="text"
                                placeholder="Address 2"
                                value={formData.addresses[1]?.value || ''}
                                onChange={(e) => {
                                    const newAddresses = [...formData.addresses];
                                    while (newAddresses.length < 2) {
                                        newAddresses.push({value: '', label: '', isPrimary: false});
                                    }
                                    newAddresses[1].value = e.target.value;
                                    setFormData({...formData, addresses: newAddresses});
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column - Social Media Only */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                    <h4 className="text-base font-semibold text-gray-900 border-b border-purple-300 pb-1">
                        Social Media
                    </h4>

                    {/* Social Media - 3 Fixed Dropdown + Input Pairs */}
                    <div className="space-y-3">
                        {/* Social Media Field 1 */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                                Social Media 1
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.socialMedia[0]?.label || ''}
                                    onChange={(e) => {
                                        const newSocialMedia = [...formData.socialMedia];
                                        if (!newSocialMedia[0]) {
                                            newSocialMedia[0] = {value: '', label: e.target.value, isPrimary: true};
                                        } else {
                                            newSocialMedia[0].label = e.target.value;
                                        }
                                        setFormData({...formData, socialMedia: newSocialMedia});
                                    }}
                                    className="w-32 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                    <option value="">None</option>
                                    <option value="Twitter">Twitter</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                </select>
                                <input
                                    type="text"
                                    value={formData.socialMedia[0]?.value || ''}
                                    onChange={(e) => {
                                        const newSocialMedia = [...formData.socialMedia];
                                        if (!newSocialMedia[0]) {
                                            newSocialMedia[0] = {value: e.target.value, label: '', isPrimary: true};
                                        } else {
                                            newSocialMedia[0].value = e.target.value;
                                        }
                                        setFormData({...formData, socialMedia: newSocialMedia});
                                    }}
                                    placeholder="@handle or profile URL"
                                    disabled={!formData.socialMedia[0]?.label}
                                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Social Media Field 2 */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                                Social Media 2
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.socialMedia[1]?.label || ''}
                                    onChange={(e) => {
                                        const newSocialMedia = [...formData.socialMedia];
                                        while (newSocialMedia.length < 2) {
                                            newSocialMedia.push({value: '', label: '', isPrimary: false});
                                        }
                                        newSocialMedia[1].label = e.target.value;
                                        setFormData({...formData, socialMedia: newSocialMedia});
                                    }}
                                    className="w-32 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                    <option value="">None</option>
                                    <option value="Twitter">Twitter</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                </select>
                                <input
                                    type="text"
                                    value={formData.socialMedia[1]?.value || ''}
                                    onChange={(e) => {
                                        const newSocialMedia = [...formData.socialMedia];
                                        while (newSocialMedia.length < 2) {
                                            newSocialMedia.push({value: '', label: '', isPrimary: false});
                                        }
                                        newSocialMedia[1].value = e.target.value;
                                        setFormData({...formData, socialMedia: newSocialMedia});
                                    }}
                                    placeholder="@handle or profile URL"
                                    disabled={!formData.socialMedia[1]?.label}
                                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Social Media Field 3 */}
                        <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-700">
                                Social Media 3
                            </label>
                            <div className="flex gap-2">
                                <select
                                    value={formData.socialMedia[2]?.label || ''}
                                    onChange={(e) => {
                                        const newSocialMedia = [...formData.socialMedia];
                                        while (newSocialMedia.length < 3) {
                                            newSocialMedia.push({value: '', label: '', isPrimary: false});
                                        }
                                        newSocialMedia[2].label = e.target.value;
                                        setFormData({...formData, socialMedia: newSocialMedia});
                                    }}
                                    className="w-32 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                                >
                                    <option value="">None</option>
                                    <option value="Twitter">Twitter</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                </select>
                                <input
                                    type="text"
                                    value={formData.socialMedia[2]?.value || ''}
                                    onChange={(e) => {
                                        const newSocialMedia = [...formData.socialMedia];
                                        while (newSocialMedia.length < 3) {
                                            newSocialMedia.push({value: '', label: '', isPrimary: false});
                                        }
                                        newSocialMedia[2].value = e.target.value;
                                        setFormData({...formData, socialMedia: newSocialMedia});
                                    }}
                                    placeholder="@handle or profile URL"
                                    disabled={!formData.socialMedia[2]?.label}
                                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            </div>
                        </div>
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
                        className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-8 py-3 mb-4 rounded-lg font-medium transition-colors"
                    >
                        Choose Business Card →
                    </button>
                </div>
            </div>
        </div>
    );
};