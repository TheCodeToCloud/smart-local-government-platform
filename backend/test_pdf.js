const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ size: 'A4', margins: { top: 30, bottom: 30, left: 40, right: 40 } });
doc.pipe(fs.createWriteStream('test_birth.pdf'));

const fontPath = path.join(__dirname, 'backend/assets/Mukta-Regular.ttf');
try { doc.registerFont('Devanagari', fontPath); } catch(e) { console.log('font failed'); }

doc.font('Devanagari').fontSize(11).fillColor('#000').text('अनुसूची-१२', 0, 40, { align: 'center', width: doc.page.width });
doc.fontSize(10).text('(नियम ७ सँग सम्बन्धित)', 0, 55, { align: 'center', width: doc.page.width });
doc.fontSize(10).text('जन्म दर्ता प्रमाणपत्रको ढाँचा', 0, 70, { align: 'center', width: doc.page.width });
doc.fontSize(14).text('नेपाल सरकार (Government of Nepal)', 0, 90, { align: 'center', width: doc.page.width });
doc.fontSize(12).text('स्थानीय पञ्जीकाधिकारीको कार्यालय (Office of Local Registrar)', 0, 110, { align: 'center', width: doc.page.width });

doc.end();
console.log('Done');
