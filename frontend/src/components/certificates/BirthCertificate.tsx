import React from 'react';

export interface BirthCertificateProps {
  certificateNo: string;
  registrationNo: string;
  issueDateBS: string;
  issueDateAD: string;
  childNameNP: string;
  childNameEN?: string;
  sex: string;
  dobBS: string;
  dobAD: string;
  placeOfBirth: string;
  fatherName: string;
  motherName: string;
  permanentAddress: string;
  issuingAuthority: string;
  registrationDateBS: string;
  registrationDateAD: string;
  signatoryName: string;
  designation: string;
  office: string;
}

const BirthCertificate: React.FC<BirthCertificateProps> = ({
  certificateNo,
  registrationNo,
  issueDateBS,
  issueDateAD,
  childNameNP,
  childNameEN,
  sex,
  dobBS,
  dobAD,
  placeOfBirth,
  fatherName,
  motherName,
  permanentAddress,
  issuingAuthority,
  registrationDateBS,
  registrationDateAD,
  signatoryName,
  designation,
  office,
}) => {
  return (
    <div className="w-[210mm] min-h-[297mm] mx-auto bg-[#faf8f5] relative overflow-hidden font-nepali text-black p-4 box-border shadow-2xl print:shadow-none print:w-full print:h-full print:p-0">
      
      {/* --- Watermark --- */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03]">
        <h1 className="text-9xl font-bold font-serif-doc text-red-600 -rotate-45 tracking-widest whitespace-nowrap">
          SAMPLE DEMO
        </h1>
      </div>
      
      {/* --- Outer Decorative Border --- */}
      <div className="w-full h-full border-[12px] border-double border-[#c0374a] p-2 relative z-10 box-border">
        {/* --- Inner Decorative Border --- */}
        <div className="w-full h-full border-[3px] border-solid border-[#c0374a] p-8 flex flex-col justify-between relative box-border">
          
          {/* Corner motifs (simulated with CSS) */}
          <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#c0374a]"></div>
          <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#c0374a]"></div>
          <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#c0374a]"></div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#c0374a]"></div>

          <div className="flex-1 flex flex-col">
            
            {/* Header Section */}
            <div className="relative flex justify-between items-start mb-6">
              
              {/* Emblem */}
              <div className="w-[120px] h-[120px] flex-shrink-0 relative">
                <img 
                  src="/Emblem_of_Nepal.svg.png" 
                  alt="Emblem of Nepal" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Emblem_of_Nepal.svg/1024px-Emblem_of_Nepal.svg.png';
                  }}
                />
              </div>

              {/* Title Block */}
              <div className="text-center flex-1 mt-2">
                <h3 className="text-xl font-bold text-[#c0374a] leading-tight">नेपाल सरकार</h3>
                <h4 className="text-lg text-[#c0374a] font-medium leading-tight">गृह मन्त्रालय</h4>
                
                <div className="mt-4">
                  <h1 className="text-4xl font-extrabold text-[#c0374a] tracking-wider drop-shadow-sm">जन्म प्रमाणपत्र</h1>
                  <h2 className="text-xl font-bold text-[#c0374a] font-serif-doc mt-1">(BIRTH CERTIFICATE)</h2>
                </div>
              </div>

              {/* Document Info Box */}
              <div className="text-sm font-medium text-slate-800 space-y-1 mt-2 w-[220px] text-right font-serif-doc">
                <div className="flex justify-between">
                  <span className="font-nepali">प्रमाणपत्र नं. :</span>
                  <span>{certificateNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-nepali">दर्ता नं. :</span>
                  <span>{registrationNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-nepali">जारी मिति :</span>
                  <span>{issueDateBS}</span>
                </div>
                <div className="flex justify-between">
                  <span>Date of Issue:</span>
                  <span>{issueDateAD}</span>
                </div>
              </div>
            </div>

            {/* Certifying Statement */}
            <div className="text-center space-y-1 mb-10 border-b border-t border-[#c0374a]/20 py-4 px-4 bg-white/40">
              <p className="text-[15px] font-medium leading-relaxed">
                स्थानीय दर्ता रे पञ्जिकाधिकारीको कार्यालय/स्थानीय निकायको अभिलेखमा रहेको जन्म सम्बन्धी विवरणको आधारमा यो प्रमाणपत्र जारी गरिएको छ ।
              </p>
              <p className="text-[14px] font-serif-doc italic text-slate-700">
                This is to certify that the following information has been taken from the Birth Register of the Local Government.
              </p>
            </div>

            {/* Main Data Table */}
            <div className="px-6 space-y-4 text-[16px] leading-relaxed flex-1">
              
              {/* Row: Name */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium">
                  शिशुको नाम <span className="font-serif-doc text-sm">(Name of Child)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center">:</div>
                <div className="flex-1 font-bold text-[18px]">
                  {childNameNP} {childNameEN && <span className="font-serif-doc ml-2 font-normal text-[16px]">({childNameEN})</span>}
                </div>
              </div>

              {/* Row: Sex */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium">
                  लिङ्ग <span className="font-serif-doc text-sm">(Sex)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center">:</div>
                <div className="flex-1 font-bold">
                  {sex === 'male' ? 'पुरुष (Male)' : sex === 'female' ? 'महिला (Female)' : 'अन्य (Other)'}
                </div>
              </div>

              {/* Row: DOB */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium pt-1">
                  जन्म मिति <span className="font-serif-doc text-sm">(Date of Birth)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center pt-1">:</div>
                <div className="flex-1 font-bold">
                  <div>{dobBS}</div>
                  <div className="font-serif-doc font-normal">({dobAD})</div>
                </div>
              </div>

              {/* Row: Place of Birth */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium">
                  जन्म स्थान <span className="font-serif-doc text-sm">(Place of Birth)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center">:</div>
                <div className="flex-1 font-bold">
                  {placeOfBirth}
                </div>
              </div>

              {/* Row: Father Name */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium">
                  अभिभावकको नाम <span className="font-serif-doc text-sm">(Name of Father)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center">:</div>
                <div className="flex-1 font-bold">
                  {fatherName}
                </div>
              </div>

              {/* Row: Mother Name */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium">
                  अभिभावकको नाम <span className="font-serif-doc text-sm">(Name of Mother)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center">:</div>
                <div className="flex-1 font-bold">
                  {motherName}
                </div>
              </div>

              {/* Row: Permanent Address */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium">
                  स्थायी ठेगाना <span className="font-serif-doc text-sm">(Permanent Address)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center">:</div>
                <div className="flex-1 font-bold leading-tight">
                  {permanentAddress}
                </div>
              </div>

              {/* Row: Issuing Authority */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium pt-1">
                  जारी गर्नको लागि निकाय
                  <br />
                  <span className="font-serif-doc text-sm">(Issuing Authority)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center pt-1">:</div>
                <div className="flex-1 font-bold pt-1">
                  {issuingAuthority}
                </div>
              </div>

              {/* Row: Registration Date */}
              <div className="flex items-start">
                <div className="w-[280px] flex-shrink-0 text-slate-700 font-medium pt-1">
                  जारी मिति <span className="font-serif-doc text-sm">(Date of Registration)</span>
                </div>
                <div className="w-8 flex-shrink-0 text-center pt-1">:</div>
                <div className="flex-1 font-bold">
                  <div>{registrationDateBS}</div>
                  <div className="font-serif-doc font-normal">({registrationDateAD})</div>
                </div>
              </div>

            </div>

            {/* Footer Signatures Area */}
            <div className="mt-12 flex justify-between items-end pb-8">
              
              {/* QR and Warning */}
              <div className="flex items-end gap-3 w-[45%]">
                <div className="w-20 h-20 bg-white border border-slate-300 p-1 flex-shrink-0 shadow-sm relative group cursor-help">
                  {/* Placeholder QR */}
                  <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIGQ9Ik01LDVoMTB2MTBINXYtMTBtMzAsMGgxMHYxMEgzNXYtMTBtLTMwLDMwaDEwdjEwSDV2LTEwbTE1LTMwaDEwdjEwSDIwdjEwSDV2MTBoMTV2MTBoMTBWMzBIMzBWMjBIMjB2LTFoMTV2MTBoMTBWNWgtMTB2MTBoLTE1VjV6Ii8+PC9zdmc+')] bg-cover opacity-80 mix-blend-multiply"></div>
                </div>
                <div className="text-[10px] leading-tight text-[#c0374a]">
                  <p><span className="font-bold">नोट :</span> यो प्रमाणपत्र आधिकारिक दस्तावेज हो ।</p>
                  <p className="ml-5">कुनै पनि प्रकारको दुरुपयोग कानुन बमोजिम दण्डनीय छ ।</p>
                  <p className="mt-1 font-serif-doc"><span className="font-bold text-[#c0374a]">Note:</span> This certificate is an official document.</p>
                  <p className="ml-7 font-serif-doc">Misuse of this document is punishable by law.</p>
                </div>
              </div>

              {/* Office Stamp */}
              <div className="w-[120px] h-[120px] rounded-full border-[3px] border-blue-800/80 flex flex-col items-center justify-center opacity-75 mix-blend-multiply relative -top-6 transform -rotate-12">
                <div className="text-[10px] text-blue-800 font-bold text-center absolute top-2 w-[140px] tracking-wide" style={{ transform: 'rotate(-10deg) arc' }}>
                  {office.substring(0,25)}
                </div>
                <div className="w-12 h-12 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHBhdGggZmlsbD0iIzAwMzg5MyIgZD0iTTI1LDVMNSwyM2wyLDEuNWwxOC0xNWwxOCwxNWwyLTEuNUwyNSw1eiBNMjUsMTFsLTE0LDEyLjFWMzhsMTQsNi4ybDE0LTYuMlYyMy4xTDI1LDExeiIvPjwvc3ZnPg==')] bg-contain bg-no-repeat bg-center"></div>
                <div className="text-[10px] text-blue-800 font-bold mt-1">वडा कार्यालय</div>
                <div className="text-[8px] text-blue-800 mt-1">{issueDateBS.split('/')[0] || '२०८०'}</div>
              </div>

              {/* Signature Line */}
              <div className="w-[30%] text-center">
                <div className="h-16 relative">
                  {/* Fake Signature */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-80 mix-blend-multiply">
                    <img 
                      src="https://upload.wikimedia.org/wikipedia/commons/e/e5/Signature_of_John_Hancock.svg" 
                      alt="Signature"
                      className="h-12 object-contain"
                    />
                  </div>
                </div>
                <div className="border-t border-black pt-1">
                  <p className="font-bold text-[16px]">({signatoryName})</p>
                  <p className="text-[14px]">{designation}</p>
                  <p className="text-[14px] font-bold mt-1">{office}</p>
                </div>
              </div>
            </div>

            {/* Absolute Bottom Tagline */}
            <div className="absolute bottom-1 w-full text-center left-0 text-[#c0374a] font-bold text-[13px] tracking-wide bg-[#faf8f5] z-10 px-4">
              इच्छा र विश्वास, समृद्ध नेपाल
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default BirthCertificate;
