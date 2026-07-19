const Tesseract = require('tesseract.js');

/**
 * Extracts data from a citizenship document buffer.
 * Attempts to parse Nepali Citizenship number, Name, and DOB.
 */
const extractDocumentData = async (buffer) => {
  try {
    // recognize the buffer using tesseract
    const { data: { text, confidence } } = await Tesseract.recognize(buffer, 'eng');
    
    let citizenshipNumber = null;
    let fullName = null;
    let dateOfBirth = null;

    // Pattern for citizenship number: XX-XX-XX-XXXXX (common format)
    const citMatch = text.match(/\b\d{2}-\d{2}-\d{2}-\d{5}\b/);
    if (citMatch) {
      citizenshipNumber = citMatch[0];
    }

    // Split text into non-empty lines
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Heuristic for Name: look for line containing "Name" or "Full Name"
    const nameLine = lines.find(l => /name/i.test(l));
    if (nameLine) {
      // Remove "Name:", "Full Name:", etc.
      let cleaned = nameLine.replace(/^.*name[\s:]*/i, '').trim();
      // Remove any trailing non-alphabet characters
      cleaned = cleaned.replace(/[^a-zA-Z\s.-]/g, '').trim();
      if (cleaned.length > 2) {
        fullName = cleaned;
      }
    }

    // Heuristic for DOB: looking for YYYY-MM-DD or YYYY/MM/DD
    const dobMatch = text.match(/\b\d{4}[-/]\d{2}[-/]\d{2}\b/);
    if (dobMatch) {
      dateOfBirth = dobMatch[0];
    }

    return {
      confidence,
      extractedFields: {
        citizenshipNumber,
        fullName,
        dateOfBirth
      },
      rawText: text // Useful for debugging, but we don't expose it to frontend to keep payload small
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to extract document data.');
  }
};

module.exports = {
  extractDocumentData
};
