const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Certificate = require('../models/Certificate');
const { uploadToCloudinary } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

const TYPE_ABBREV = {
  birth: 'BIRTH',
  citizenship: 'CTZ',
  residence: 'RES',
  marriage: 'MARR',
  death: 'DEATH',
  income: 'INC',
  character: 'CHAR',
};

const TYPE_DISPLAY = {
  residence: 'RESIDENCE CERTIFICATE / बसोबास प्रमाणपत्र',
  death: 'DEATH CERTIFICATE / मृत्यु दर्ता प्रमाणपत्र',
  income: 'INCOME CERTIFICATE / आय प्रमाणपत्र',
  character: 'CHARACTER CERTIFICATE / चरित्र प्रमाणपत्र',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().split('T')[0];
};

// ─── Default Certificate Generator ──────────────────────────────────────────────
const generateDefaultPDF = (doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath) => {
  const certType = application.certificateType;
  const ad = application.applicantDetails || {};

  doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).lineWidth(3).strokeColor('#1e3a5f').stroke();
  doc.rect(36, 36, doc.page.width - 72, doc.page.height - 72).lineWidth(1).strokeColor('#2563eb').stroke();

  try { doc.image(emblemPath, doc.page.width / 2 - 35, 45, { width: 70 }); } catch (e) {}

  doc.font('Devanagari').fontSize(16).fillColor('#1e3a5f').text('नेपाल सरकार / GOVERNMENT OF NEPAL', 50, 125, { align: 'center', width: pageWidth });
  doc.fontSize(12).fillColor('#374151').text('स्थानीय सरकार कार्यालय / LOCAL GOVERNMENT OFFICE', 50, 145, { align: 'center', width: pageWidth });
  doc.font('Helvetica').fontSize(10).fillColor('#6b7280').text('Smart Gov Platform, Nepal', 50, 162, { align: 'center', width: pageWidth });

  doc.moveTo(50, 178).lineTo(doc.page.width - 50, 178).lineWidth(2).strokeColor('#2563eb').stroke();
  doc.moveTo(50, 181).lineTo(doc.page.width - 50, 181).lineWidth(0.5).strokeColor('#93c5fd').stroke();

  doc.font('Devanagari').fontSize(14).fillColor('#1e3a5f').text(TYPE_DISPLAY[certType] || certType.toUpperCase(), 50, 195, { align: 'center', width: pageWidth });

  const certInfoY = 230;
  doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(`Certificate No: `, 50, certInfoY);
  doc.font('Helvetica-Bold').fillColor('#1d4ed8').text(certificate.certificateNumber, 130, certInfoY);
  doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(`Issue Date: ${formatDate(certificate.issuedDate)}`, 50, certInfoY + 14, { align: 'right', width: pageWidth });
  doc.text(`Valid Until: ${formatDate(certificate.expiryDate)}`, 50, certInfoY + 28, { align: 'right', width: pageWidth });

  doc.font('Devanagari').fontSize(10).fillColor('#374151').text('This is to certify that the following individual has been duly registered with this office:', 50, 275, { align: 'center', width: pageWidth });

  const detailsStartY = 300;
  doc.rect(50, detailsStartY, pageWidth, 18).fillColor('#1e3a5f').fill();
  doc.font('Devanagari').fontSize(10).fillColor('#ffffff').text('APPLICANT INFORMATION / व्यक्तिगत विवरण', 55, detailsStartY + 4);

  const fields = [
    { label: 'Full Name / पूरा नाम', value: ad.fullName || '—' },
    { label: 'Date of Birth / जन्म मिति', value: formatDate(ad.dateOfBirth) || '—' },
    { label: 'Gender / लिङ्ग', value: ad.gender ? ad.gender.charAt(0).toUpperCase() + ad.gender.slice(1) : '—' },
    { label: 'Father\'s Name / बाबुको नाम', value: ad.fatherName || '—' },
    { label: 'Mother\'s Name / आमाको नाम', value: ad.motherName || '—' },
    { label: 'Grandfather\'s Name / हजुरबाको नाम', value: ad.grandfatherName || '—' },
    { label: 'Permanent Address / स्थायी ठेगाना', value: ad.permanentAddress || '—' },
    { label: 'Ward Number / वडा नम्बर', value: ad.wardNumber || '—' },
    { label: 'Municipality / नगरपालिका', value: ad.municipalityName || '—' },
    { label: 'District / जिल्ला', value: ad.districtName || '—' },
    { label: 'Province / प्रदेश', value: ad.province || '—' },
  ];

  let fieldY = detailsStartY + 26;
  const col1X = 55, col2X = doc.page.width / 2 + 5;
  const colWidth = (pageWidth - 20) / 2;
  const rowHeight = 26;

  fields.forEach((field, idx) => {
    const isFullWidth = field.label.includes('Permanent Address');
    const xPos = isFullWidth ? col1X : (idx % 2 === 0 ? col1X : col2X);
    const fieldWidth = isFullWidth ? pageWidth - 10 : colWidth;
    if (Math.floor(idx / 2) % 2 === 0 && !isFullWidth) doc.rect(50, fieldY, pageWidth, rowHeight).fillColor('#f8fafc').fill();
    else if (isFullWidth && idx % 2 === 0) doc.rect(50, fieldY, pageWidth, rowHeight).fillColor('#f8fafc').fill();

    doc.font('Devanagari').fontSize(8).fillColor('#4b5563').text(field.label + ':', xPos, fieldY + 4, { width: fieldWidth, lineBreak: false });
    doc.fontSize(9).fillColor('#111827').text(field.value, xPos, fieldY + 14, { width: fieldWidth, lineBreak: false });

    if (isFullWidth || idx % 2 !== 0) fieldY += rowHeight;
  });

  const footerY = doc.page.height - 160;
  doc.moveTo(50, footerY).lineTo(doc.page.width - 50, footerY).lineWidth(1).strokeColor('#e5e7eb').stroke();
  if (qrCodeBuffer) doc.image(qrCodeBuffer, doc.page.width - 135, footerY + 5, { width: 80, height: 80 });

  doc.rect(220, footerY + 50, 90, 60).lineWidth(1.5).strokeColor('#94a3b8').dash(4, { space: 3 }).stroke();
  doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text('OFFICIAL\nSTAMP', 235, footerY + 72, { align: 'center', width: 60 });
};

// ─── Marriage Certificate Generator (EXACT MATCH PDF 1) ──────────────────────
const generateMarriagePDF = (doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath, photos) => {
  const ad = application.applicantDetails || {};
  const spouse = application.spouseDetails || {};

  doc.font('Devanagari').fontSize(10).fillColor('#000').text('अनुसूची-२२', 0, 30, { align: 'center', width: doc.page.width });
  doc.fontSize(9).text('(नियम २० को उपनियम (१) को खण्ड (ग) सँग सम्बन्धित)', 0, 42, { align: 'center', width: doc.page.width });
  doc.fontSize(12).text('नेपाल सरकार (Government of Nepal)', 0, 56, { align: 'center', width: doc.page.width });
  doc.fontSize(11).text('स्थानीय पञ्जीकाधिकारीको कार्यालय (Office of Local Registrar)', 0, 72, { align: 'center', width: doc.page.width });
  
  const munName = ad.municipalityName || '...........';
  const wardStr = ad.wardNumber || '....';
  doc.fontSize(11).text(`वडा नं. ${wardStr}, ${munName} नगरपालिका/गाउँपालिका`, 0, 88, { align: 'center', width: doc.page.width });
  doc.fontSize(11).text(`(Ward No.${wardStr}, ${munName} Municipality)`, 0, 102, { align: 'center', width: doc.page.width });
  
  const dist = ad.districtName || '...........';
  const prov = ad.province || '...........';
  doc.fontSize(10).text(`${dist} जिल्ला (${dist} District), ${prov} प्रदेश (${prov} Province)`, 0, 116, { align: 'center', width: doc.page.width });

  try { doc.image(emblemPath, 40, 50, { width: 60 }); } catch (e) {}

  doc.fontSize(18).text('विवाह दर्ता प्रमाणपत्र', 0, 145, { align: 'center', width: doc.page.width });
  doc.font('Helvetica-Bold').fontSize(16).text('(Marriage Registration Certificate)', 0, 168, { align: 'center', width: doc.page.width });

  const issueDateStr = formatDate(certificate.issuedDate);
  doc.font('Devanagari').fontSize(10);
  
  doc.text(`दर्ता नं. (Registration No.): ${certificate.certificateNumber}`, 40, 200);
  doc.text(`दर्ता मिति (Registration Date): ${issueDateStr}`, 40, 215);
  doc.text(`विवाह मिति (Marriage Date): ${issueDateStr}`, 40, 230);
  doc.text(`विवाह प्रकार (Marriage Type): सामािजक परम्परा अनुसार (Social Customs)`, 40, 245);

  // Photo boxes
  doc.rect(doc.page.width - 200, 185, 70, 80).lineWidth(1).strokeColor('#000').stroke();
  try { if (photos?.groomPhotoBuffer) doc.image(photos.groomPhotoBuffer, doc.page.width - 200, 185, { width: 70, height: 80 }); } catch(e) {}
  doc.fontSize(8).text('दुलाहा (Groom)', doc.page.width - 200, 270, { width: 70, align: 'center' });
  
  doc.rect(doc.page.width - 120, 185, 70, 80).stroke();
  try { if (photos?.bridePhotoBuffer) doc.image(photos.bridePhotoBuffer, doc.page.width - 120, 185, { width: 70, height: 80 }); } catch(e) {}
  doc.text('दुलही (Bride)', doc.page.width - 120, 270, { width: 70, align: 'center' });

  // Table
  const startY = 285;
  const rowH = 32;
  const col1X = 40, col2X = 180, col3X = 360, endX = doc.page.width - 40;

  // Header Row
  doc.rect(col1X, startY, endX - col1X, rowH).stroke();
  doc.moveTo(col2X, startY).lineTo(col2X, startY + rowH).stroke();
  doc.moveTo(col3X, startY).lineTo(col3X, startY + rowH).stroke();
  
  doc.font('Devanagari').fontSize(10);
  doc.text('विवरण (Details)', col1X + 5, startY + 8);
  doc.text('दुलाहा (Bridegroom)', col2X + 5, startY + 8);
  doc.text('दुलही (Bride)', col3X + 5, startY + 8);

  const labels = [
    'पूरा नाम : (Full Name :)',
    'जन्म मिति : (Date of Birth :)',
    'नागरिकता/राहदानी नं. :\n(Citizenship/Passport No. :)',
    'स्थायी ठेगाना :\n(Permanent Address :)',
    'बाबुको पूरा नाम :\n(Full Name of Father :)',
    'आमाको पूरा नाम :\n(Full Name of Mother :)',
    'बाजेको पूरा नाम :\n(Full Name of Grandfather :)'
  ];

  let currentY = startY + rowH;
  labels.forEach((lbl, i) => {
    let rh = (i === 2 || i === 4 || i === 5 || i === 6) ? 38 : rowH;
    doc.rect(col1X, currentY, endX - col1X, rh).stroke();
    doc.moveTo(col2X, currentY).lineTo(col2X, currentY + rh).stroke();
    doc.moveTo(col3X, currentY).lineTo(col3X, currentY + rh).stroke();

    doc.text(lbl, col1X + 5, currentY + 6, { width: col2X - col1X - 10 });

    const isGroom = ad.gender !== 'female'; // Default applicant to Groom unless explicitly female
    const groomData = isGroom ? ad : spouse;
    const brideData = isGroom ? spouse : ad;

    if (i === 0) {
      doc.text(groomData.fullName || '', col2X + 5, currentY + 6);
      doc.text(brideData.fullName || '', col3X + 5, currentY + 6);
    } else if (i === 1) {
      doc.text(formatDate(groomData.dateOfBirth), col2X + 5, currentY + 6);
      doc.text(formatDate(brideData.dateOfBirth), col3X + 5, currentY + 6);
    } else if (i === 2) {
      doc.text(groomData.citizenshipNumber || '..........................', col2X + 5, currentY + (rh/2) - 4);
      doc.text(brideData.citizenshipNumber || '..........................', col3X + 5, currentY + (rh/2) - 4);
    } else if (i === 3) {
      doc.text(groomData.permanentAddress || '', col2X + 5, currentY + 6);
      doc.text(brideData.permanentAddress || '', col3X + 5, currentY + 6);
    } else if (i === 4) {
      doc.text(groomData.fatherName || '', col2X + 5, currentY + 6);
      doc.text(brideData.fatherName || '', col3X + 5, currentY + 6);
    } else if (i === 5) {
      doc.text(groomData.motherName || '', col2X + 5, currentY + 6);
      doc.text(brideData.motherName || '', col3X + 5, currentY + 6);
    } else if (i === 6) {
      doc.text(groomData.grandfatherName || '', col2X + 5, currentY + 6);
      doc.text(brideData.grandfatherName || '', col3X + 5, currentY + 6);
    }

    currentY += rh;
  });

  // Footer
  currentY += 40;
  doc.text('सही (Signature):', 40, currentY);
  
  // Draw Signature
  doc.font('Helvetica-Oblique').fontSize(16).fillColor('#000080');
  doc.text('Biswobandu', 100, currentY - 5);
  doc.fillColor('#000').font('Devanagari').fontSize(10);
  
  doc.text('स्थानीय पञ्जीकाधिकारीको नाम:', 40, currentY + 20);
  doc.text('Name of Local Registrar:', 40, currentY + 35);
  doc.text('Biswobandu Neupane', 160, currentY + 35); // Update name here too

  doc.rect(doc.page.width - 150, currentY, 110, 80).strokeColor('#000').dash(2, { space: 2 }).stroke();
  doc.undash();
  doc.text('कार्यालयको छाप / Official Stamp', doc.page.width - 145, currentY + 65, { width: 100, align: 'center' });

  // Draw Official Red Stamp
  doc.save();
  doc.translate(doc.page.width - 95, currentY + 40);
  doc.circle(0, 0, 35).lineWidth(2).strokeColor('red').stroke();
  doc.circle(0, 0, 33).lineWidth(1).strokeColor('red').stroke();
  doc.fillColor('red').fontSize(8).text('नगर कार्यपालिकाको कार्यालय', -30, -15, { width: 60, align: 'center' });
  doc.text('मिक्लाजुङ, मोरङ', -30, 5, { width: 60, align: 'center' });
  
  // Add a cross signature over the stamp
  doc.font('Helvetica-Oblique').fontSize(12).fillColor('#000080');
  doc.text('Biswobandu', -25, -5, { width: 60, align: 'center', angle: -15 });
  
  doc.restore();
  
  // Restore default colors
  doc.fillColor('#000').font('Devanagari').fontSize(10);
};

// ─── Birth Certificate Generator (EXACT MATCH PDF 2) ──────────────────────────
const generateBirthPDF = (doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath) => {
  const ad = application.applicantDetails || {};

  doc.font('Devanagari').fontSize(11).fillColor('#000').text('अनुसूची-१२', 0, 40, { align: 'center', width: doc.page.width });
  doc.fontSize(10).text('(नियम ७ सँग सम्बन्धित)', 0, 55, { align: 'center', width: doc.page.width });
  doc.fontSize(10).text('जन्म दर्ता प्रमाणपत्रको ढाँचा', 0, 70, { align: 'center', width: doc.page.width });
  doc.fontSize(14).text('नेपाल सरकार (Government of Nepal)', 0, 90, { align: 'center', width: doc.page.width });
  doc.fontSize(12).text('स्थानीय पञ्जीकाधिकारीको कार्यालय (Office of Local Registrar)', 0, 110, { align: 'center', width: doc.page.width });
  
  const munName = ad.municipalityName || '...........';
  const wardStr = ad.wardNumber || '....';
  const dist = ad.districtName || '...........';
  const prov = ad.province || '...........';

  doc.fontSize(10).text(`वडा नं. ${wardStr}, ${munName} गाउँपालिका/नगरपालिका`, 0, 130, { align: 'center', width: doc.page.width });
  doc.fontSize(10).text(`Ward No. ${wardStr}, ${munName} Rural Municipality/Municipality`, 0, 145, { align: 'center', width: doc.page.width });
  doc.fontSize(10).text(`${dist} जिल्ला (${dist} District)`, 0, 160, { align: 'center', width: doc.page.width });
  doc.fontSize(10).text(`${prov} प्रदेश (${prov} Province)`, 0, 175, { align: 'center', width: doc.page.width });

  try { doc.image(emblemPath, 40, 50, { width: 70 }); } catch (e) {}

  doc.fontSize(16).text('जन्म दर्ता प्रमाणपत्र', 0, 210, { align: 'center', width: doc.page.width });
  doc.font('Helvetica-Bold').fontSize(14).text('(Birth Registration Certificate)', 0, 230, { align: 'center', width: doc.page.width });

  const issueDateStr = formatDate(certificate.issuedDate);
  doc.font('Devanagari').fontSize(10);
  doc.text(`दर्ता नम्बर (Registration No.): ${certificate.certificateNumber}`, 40, 260);
  doc.text(`दर्ता मिति (Registration Date): ${issueDateStr}`, doc.page.width - 250, 260);

  // Single column table
  const startY = 280;
  const col1W = 220;
  const fullW = doc.page.width - 80;

  const drawRow = (y, h, label, val = '') => {
    doc.rect(40, y, fullW, h).stroke();
    doc.moveTo(40 + col1W, y).lineTo(40 + col1W, y + h).stroke();
    doc.text(label, 45, y + 6, { width: col1W - 10 });
    doc.text(val, 45 + col1W, y + 6);
  };

  const drawFullRow = (y, h, text) => {
    doc.rect(40, y, fullW, h).stroke();
    doc.text(text, 45, y + 6, { width: fullW - 10 });
  };

  drawRow(startY, 26, 'पूरा नाम: / Full Name:', ad.fullName || '');
  drawRow(startY + 26, 26, 'जन्म मिति / Date of Birth:', formatDate(ad.dateOfBirth));
  drawRow(startY + 52, 26, 'लिङ्ग / Sex:', ad.gender ? ad.gender.toUpperCase() : '');
  drawRow(startY + 78, 26, 'स्थायी ठेगाना / Permanent Address:', ad.permanentAddress || '');
  drawRow(startY + 104, 26, 'जन्म स्थान / Birth Place:', ad.municipalityName || '');
  drawRow(startY + 130, 26, 'बाजेको पूरा नाम / Full Name of Grandfather:', ad.grandfatherName || '');
  
  drawFullRow(startY + 156, 26, 'बाबुको विवरण (Father\'s Details)');
  drawRow(startY + 182, 26, 'पूरा नाम: / Full Name:', ad.fatherName || '');
  drawRow(startY + 208, 26, 'परिचयपत्र नं / ID (Citizenship/Passport):', '');

  drawFullRow(startY + 234, 26, 'आमाको विवरण (Mother\'s Details)');
  drawRow(startY + 260, 26, 'पूरा नाम: / Full Name:', ad.motherName || '');
  drawRow(startY + 286, 26, 'परिचयपत्र नं / ID (Citizenship/Passport):', '');

  drawFullRow(startY + 312, 26, 'सूचकको विवरण (Informant\'s Details)');
  drawRow(startY + 338, 26, 'नाम: / Name:', ad.fatherName || ad.motherName || '');
  drawRow(startY + 364, 26, 'परिचयपत्र नं / ID (Citizenship/Passport):', '');

  const footerY = startY + 410;
  doc.text('सही (Signature):', 40, footerY);
  doc.text('स्थानीय पञ्जीकाधिकारीको नाम (Name of Local Registrar):', 40, footerY + 20);
  
  doc.rect(doc.page.width - 150, footerY, 110, 80).strokeColor('#000').dash(2, { space: 2 }).stroke();
  doc.undash();
  doc.text('कार्यालयको छाप / Official Stamp', doc.page.width - 145, footerY + 35, { width: 100, align: 'center' });
};

// ─── Citizenship Certificate Generator (EXACT MATCH PDF 3 - English) ──────────
const generateCitizenshipPDF = (doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath) => {
  const ad = application.applicantDetails || {};

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000').text('Government of Nepal', 0, 50, { align: 'center', width: doc.page.width });
  doc.fontSize(14).text('Ministry of Home Affairs', 0, 70, { align: 'center', width: doc.page.width });
  doc.fontSize(16).text('DISTRICT ADMINISTRATION OFFICE', 0, 90, { align: 'center', width: doc.page.width });
  
  const dist = ad.districtName || 'Parsa';
  doc.fontSize(14).text(dist, 0, 110, { align: 'center', width: doc.page.width });
  doc.font('Helvetica-Oblique').fontSize(12).text('Office Seal', 0, 130, { align: 'center', width: doc.page.width });
  
  doc.font('Helvetica-Bold').fontSize(16).text('NEPALESE CITIZENSHIP CERTIFICATE', 0, 160, { align: 'center', width: doc.page.width, underline: true });
  
  doc.font('Helvetica').fontSize(11).text(`Citizenship Certificate No.: ${certificate.certificateNumber}`, 40, 190);

  // Photograph Box
  doc.rect(40, 220, 80, 90).lineWidth(2).stroke();
  doc.font('Helvetica-Bold').text('Photograph', 45, 255, { width: 70, align: 'center' });
  doc.text('Sd.', 45, 270, { width: 70, align: 'center' });

  // Details
  const rightX = 140;
  const lineH = 20;
  let y = 220;

  doc.font('Helvetica').fontSize(11);
  doc.text(`Name, Surname: - ${ad.fullName || ''}`, rightX, y);
  doc.text(`Gender: -${ad.gender ? ad.gender.charAt(0).toUpperCase() + ad.gender.slice(1) : ''}`, doc.page.width - 150, y);
  
  y += lineH;
  doc.text(`Place of birth: -District: ${ad.districtName || ''}`, rightX, y);
  y += lineH;
  doc.text(`Municipality: -${ad.municipalityName || ''}      Ward No.: ${ad.wardNumber || ''}`, rightX, y);
  y += lineH;
  doc.text(`Permanent Address: - District: ${ad.districtName || ''}`, rightX, y);
  y += lineH;
  doc.text(`Municipality: -${ad.municipalityName || ''}      Ward No.: ${ad.wardNumber || ''}`, rightX, y);
  y += lineH;
  const dobDate = new Date(ad.dateOfBirth);
  doc.text(`Date of birth: - ${formatDate(ad.dateOfBirth)} A.D.`, rightX, y);
  y += lineH;
  doc.text(`Father's Name, Surname: -${ad.fatherName || ''}`, rightX, y);
  doc.text(`Cit. Cer. No.: -`, doc.page.width - 200, y);
  y += lineH;
  doc.text(`Address: -${ad.permanentAddress || ''}`, rightX, y);
  doc.text(`Cit. Type: Descent`, doc.page.width - 200, y);
  y += lineH;
  doc.text(`Mother's Name, Surname: -${ad.motherName || ''}`, rightX, y);
  doc.text(`Cit. Cer. No.: -`, doc.page.width - 200, y);
  y += lineH;
  doc.text(`Address: -`, rightX, y);
  doc.text(`Cit. Type: `, doc.page.width - 200, y);

  // Bottom Table
  const tableY = y + 40;
  doc.rect(40, tableY, doc.page.width - 80, 110).lineWidth(1).stroke();
  doc.font('Helvetica-Bold').fontSize(10).text('Government of Nepal has issued this Citizenship Certificate with following details:', 45, tableY + 5);
  doc.text(`Citizenship Certificate No.:${certificate.certificateNumber}`, 45, tableY + 20);
  doc.text(`Sex: ${ad.gender ? ad.gender.toUpperCase() : ''}`, doc.page.width - 150, tableY + 20);
  doc.text(`Full Name: ${ad.fullName ? ad.fullName.toUpperCase() : ''}`, 45, tableY + 35);
  doc.text(`Date of Birth (AD): Year: ${dobDate.getFullYear() || ''}       Month: ${dobDate.getMonth() + 1 || ''}       Day: ${dobDate.getDate() || ''}`, 45, tableY + 50);
  doc.text(`Birth Place: District: ${ad.districtName || ''}           Ward No.: ${ad.wardNumber || ''}`, 45, tableY + 65);
  doc.text(`Permanent Address: District: ${ad.districtName || ''}           Ward No.: ${ad.wardNumber || ''}`, 45, tableY + 80);
  doc.text(`Municipality: ${ad.municipalityName || ''}`, 45, tableY + 95);

  // Footer Legal Text
  const legalY = tableY + 120;
  doc.font('Helvetica').fontSize(11).text('This Certificate of Citizenship is hereby issued pursuant to the Citizenship Act, 2063 (2006 A.D.).', 40, legalY);
  doc.text('Type of Citizenship: Descent', 40, legalY + 15);
  doc.text('Replica Issuing Authority\'s', 40, legalY + 30);
  doc.text('Obtaining the Certificate: Sd.', 40, legalY + 45);
  doc.text('Thumb Impressions', 40, legalY + 60);

  // Thumb box
  doc.rect(40, legalY + 75, 100, 40).lineWidth(2).stroke();
  doc.moveTo(90, legalY + 75).lineTo(90, legalY + 115).stroke();
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Right', 45, legalY + 80);
  doc.text('Left', 95, legalY + 80);

  // Issuer Signature
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Certificate Issuing Authority\'s', doc.page.width - 250, legalY + 60);
  doc.font('Helvetica').text('Signature: -Sd.', doc.page.width - 250, legalY + 75);
  doc.text('Name, Surname: - .......................', doc.page.width - 250, legalY + 90);
  doc.text('Designation: - Administrative Officer', doc.page.width - 250, legalY + 105);
  doc.text(`Date: - ${formatDate(certificate.issuedDate)}`, doc.page.width - 250, legalY + 120);
};

// ─── Main Generator ───────────────────────────────────────────────────────────
const generatePDF = async (application, certificate, qrCodeBuffer) => {
  let groomPhotoBuffer = null;
  let bridePhotoBuffer = null;

  if (application.certificateType === 'marriage' && application.uploadedDocuments) {
    const fetchImage = async (docType) => {
      const doc = application.uploadedDocuments.find((d) => d.documentType === docType);
      if (doc && doc.publicId) {
        try {
          const filePath = path.join(__dirname, '../uploads', doc.publicId);
          if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath);
          } else {
            console.warn(`File not found on disk: ${filePath}`);
          }
        } catch (e) {
          console.warn(`Failed to read photo for ${docType}:`, e.message);
        }
      }
      return null;
    };
    groomPhotoBuffer = await fetchImage('Groom Photo');
    bridePhotoBuffer = await fetchImage('Bride Photo');
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 30, bottom: 30, left: 40, right: 40 } });

    const fontPath = path.join(__dirname, '../assets/Mukta-Regular.ttf');
    const emblemPath = path.join(__dirname, '../../frontend/public/Emblem_of_Nepal.svg.png');

    try { doc.registerFont('Devanagari', fontPath); } 
    catch (e) { doc.registerFont('Devanagari', 'Helvetica'); }

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 80;
    
    if (application.certificateType === 'citizenship') {
      generateCitizenshipPDF(doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath);
    } else if (application.certificateType === 'marriage') {
      generateMarriagePDF(doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath, { groomPhotoBuffer, bridePhotoBuffer });
    } else if (application.certificateType === 'birth') {
      generateBirthPDF(doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath);
    } else {
      generateDefaultPDF(doc, application, certificate, qrCodeBuffer, pageWidth, emblemPath);
    }

    doc.end();
  });
};

const generateCertificate = async (application) => {
  try {
    const year = new Date().getFullYear();
    const abbrev = TYPE_ABBREV[application.certificateType] || 'CERT';
    const count = await Certificate.countDocuments();
    const sequence = String(count + 1).padStart(6, '0');
    const certificateNumber = `CERT-${abbrev}-${year}-${sequence}`;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const qrCodeData = `${frontendUrl}/verify/${certificateNumber}`;
    const qrCodeBuffer = await QRCode.toBuffer(qrCodeData, {
      width: 200, margin: 1, color: { dark: '#1e3a5f', light: '#ffffff' }, errorCorrectionLevel: 'H',
    });

    const issuedDate = new Date();
    const expiryDate = new Date(issuedDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);

    const tempCert = { certificateNumber, issuedDate, expiryDate };
    const pdfBuffer = await generatePDF(application, tempCert, qrCodeBuffer);

    let pdfUrl = null;
    let qrCodeUrl = null;
    try {
      const pdfUpload = await uploadToCloudinary(pdfBuffer, {
        resource_type: 'image', folder: 'smartgov/certificates', public_id: certificateNumber, format: 'pdf',
      });
      pdfUrl = pdfUpload.secure_url;
    } catch (uploadErr) {
      console.warn('PDF upload to Cloudinary failed (non-fatal):', uploadErr.message);
    }

    try {
      const qrUpload = await uploadToCloudinary(qrCodeBuffer, {
        resource_type: 'image', folder: 'smartgov/qrcodes', public_id: `QR-${certificateNumber}`, format: 'png',
      });
      qrCodeUrl = qrUpload.secure_url;
    } catch (uploadErr) {
      console.warn('QR upload to Cloudinary failed (non-fatal):', uploadErr.message);
    }

    const certificate = await Certificate.create({
      certificateNumber, applicationId: application._id, userId: application.userId,
      certificateType: application.certificateType, issuedDate, expiryDate,
      pdfUrl, qrCodeUrl, qrCodeData, isValid: true,
    });

    return { certificate, pdfUrl, qrCodeUrl };
  } catch (error) {
    console.error('Certificate generation failed:', error);
    throw error;
  }
};

module.exports = { generateCertificate, generatePDF };
