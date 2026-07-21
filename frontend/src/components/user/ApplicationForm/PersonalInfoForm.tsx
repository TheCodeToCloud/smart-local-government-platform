import React from 'react';
import type { CertificateType, ApplicantDetails } from '../../../types';

const PROVINCES = [
  'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim',
] as const;

interface PersonalInfoFormProps {
  certType: CertificateType;
  data: Partial<ApplicantDetails> & Record<string, string>;
  onChange: (field: string, value: string) => void;
  onAutoFill?: () => void;
  canAutoFill?: boolean;
}

interface FieldConfig {
  key: string;
  label: string;
  labelNepali?: string;
  type?: 'text' | 'date' | 'select' | 'number';
  placeholder?: string;
  options?: string[];
  required?: boolean;
  colSpan?: 2;
}

const COMMON_FIELDS: FieldConfig[] = [
  { key: 'fullName',        label: 'Full Name',          labelNepali: 'पूरा नाम',       placeholder: 'Ram Bahadur Thapa', required: true },
  { key: 'dateOfBirth',     label: 'Date of Birth',      labelNepali: 'जन्म मिति',      type: 'date', required: true },
  { key: 'citizenshipNumber',label: 'Citizenship/Passport No.', labelNepali: 'नागरिकता/राहदानी नं.', placeholder: '123-456-789' },
  { key: 'gender',          label: 'Gender',             labelNepali: 'लिङ्ग',          type: 'select', options: ['male', 'female', 'other'], required: true },
  { key: 'fatherName',      label: "Father's Name",      labelNepali: 'बुवाको नाम',     placeholder: "Father's full name" },
  { key: 'motherName',      label: "Mother's Name",      labelNepali: 'आमाको नाम',     placeholder: "Mother's full name" },
  { key: 'grandfatherName', label: "Grandfather's Name", labelNepali: 'हजुरबुवाको नाम', placeholder: "Grandfather's full name" },
  { key: 'province',        label: 'Province',           labelNepali: 'प्रदेश',         type: 'select', options: PROVINCES as unknown as string[], required: true },
  { key: 'districtName',    label: 'District',           labelNepali: 'जिल्ला',         placeholder: 'District name', required: true },
  { key: 'municipalityName',label: 'Municipality / VDC', labelNepali: 'नगरपालिका/गा.वि.स.', placeholder: 'Municipality name', required: true },
  { key: 'wardNumber',      label: 'Ward Number',        labelNepali: 'वडा नम्बर',      placeholder: 'e.g. 5' },
  { key: 'permanentAddress',label: 'Permanent Address',  labelNepali: 'स्थायी ठेगाना',  placeholder: 'Full permanent address', colSpan: 2 },
  { key: 'temporaryAddress',label: 'Temporary Address',  labelNepali: 'अस्थायी ठेगाना', placeholder: 'Current residence', colSpan: 2 },
];

const EXTRA_FIELDS: Record<CertificateType, FieldConfig[]> = {
  birth: [
    { key: 'birthPlace',    label: 'Birth Place',    placeholder: 'Hospital / Village' },
    { key: 'birthTime',     label: 'Birth Time',     type: 'text', placeholder: '10:30 AM' },
  ],
  marriage: [
    { key: 'spouseName',    label: 'Spouse Name',    placeholder: "Spouse's full name", required: true },
    { key: 'marriageDate',  label: 'Marriage Date',  type: 'date', required: true },
    { key: 'marriagePlace', label: 'Marriage Place', placeholder: 'Where the marriage took place' },
  ],
  death: [
    { key: 'deceasedName',  label: 'Deceased Name',  placeholder: "Deceased person's name", required: true },
    { key: 'deathDate',     label: 'Date of Death',  type: 'date', required: true },
    { key: 'deathPlace',    label: 'Place of Death', placeholder: 'Hospital / Village' },
    { key: 'causeOfDeath',  label: 'Cause of Death', placeholder: 'Natural / Accident / Illness' },
  ],
  income: [
    { key: 'occupation',     label: 'Occupation',      placeholder: 'Your occupation / profession', required: true },
    { key: 'monthlyIncome',  label: 'Monthly Income',  type: 'number', placeholder: 'NPR' },
    { key: 'annualIncome',   label: 'Annual Income',   type: 'number', placeholder: 'NPR' },
  ],
  citizenship: [],
  residence: [],
  character: [],
};

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  certType, data, onChange, onAutoFill, canAutoFill,
}) => {
  const extraFields = EXTRA_FIELDS[certType] || [];
  let allFields = [...COMMON_FIELDS, ...extraFields];

  if (certType === 'birth') {
    allFields = allFields.map(field => {
      if (field.key === 'fullName') {
        return { 
          ...field, 
          label: 'Name of Child', 
          labelNepali: 'शिशुको नाम', 
          placeholder: "Child's full name" 
        };
      }
      return field;
    }).filter(field => field.key !== 'citizenshipNumber');
  }

  const renderField = (field: FieldConfig) => {
    const value = data[field.key] || '';
    const baseClass = `form-input ${field.colSpan === 2 ? '' : ''}`;

    return (
      <div key={field.key} className={field.colSpan === 2 ? 'sm:col-span-2' : ''}>
        <label className="form-label">
          <span>{field.label}</span>
          {field.labelNepali && (
            <span className="text-slate-500 text-xs ml-1.5 font-normal">{field.labelNepali}</span>
          )}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {field.type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            className={baseClass}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={baseClass}
          />
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Personal Information</h2>
          <p className="text-slate-400 text-sm">व्यक्तिगत विवरण भर्नुहोस्</p>
        </div>
        {canAutoFill && onAutoFill && (
          <button
            type="button"
            onClick={onAutoFill}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary-600/20 border
                       border-secondary-500/40 text-secondary-400 hover:bg-secondary-600/30
                       text-sm font-medium transition-all"
          >
            ✨ Auto-fill from previous application
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {allFields.map(renderField)}
      </div>
    </div>
  );
};

export default PersonalInfoForm;
