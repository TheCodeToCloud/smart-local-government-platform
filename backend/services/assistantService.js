const { getEstimatedProcessingTime } = require('./predictionService');

// Required documents mapping (same logic as validation service but formatted for humans)
const REQUIRED_DOCUMENTS = {
  birth: ['Citizenship of Parent', 'Hospital Record', 'Ward Recommendation'],
  citizenship: ['Birth Certificate', 'Parents Citizenship', 'Ward Recommendation', 'Recent Photo'],
  residence: ['Citizenship', 'Property Tax Receipt or Rent Agreement', 'Electricity/Water Bill'],
  marriage: ['Citizenships of both spouses', 'Photos of wedding', 'Ward Recommendation'],
  death: ['Citizenship of deceased', 'Hospital Death Report', 'Ward Recommendation'],
  income: ['Citizenship', 'Tax Clearance Certificate', 'Salary Certificate or Business Registration'],
  character: ['Citizenship', 'Police Report', 'Ward Recommendation'],
};

const getGuidance = async (userQuery) => {
  const query = userQuery.toLowerCase();
  
  let certificateType = null;
  
  // Rule-based keyword matching (Offline Expert System)
  if (query.includes('born') || query.includes('birth') || query.includes('baby')) {
    certificateType = 'birth';
  } else if (query.includes('marri') || query.includes('wedding') || query.includes('spouse') || query.includes('husband') || query.includes('wife')) {
    certificateType = 'marriage';
  } else if (query.includes('die') || query.includes('death') || query.includes('pass away')) {
    certificateType = 'death';
  } else if (query.includes('live') || query.includes('reside') || query.includes('address proof') || query.includes('staying')) {
    certificateType = 'residence';
  } else if (query.includes('income') || query.includes('salary') || query.includes('earn')) {
    certificateType = 'income';
  } else if (query.includes('character') || query.includes('behavior') || query.includes('police report') || query.includes('good conduct')) {
    certificateType = 'character';
  } else if (query.includes('citizen') || query.includes('id ') || query.includes('identity')) {
    certificateType = 'citizenship';
  }

  if (!certificateType) {
    return {
      success: false,
      message: "I couldn't clearly determine which certificate you need based on that. Could you please provide more details? (e.g., 'I need proof of my address', 'I recently got married').",
    };
  }

  // Get required documents
  const requiredDocs = REQUIRED_DOCUMENTS[certificateType] || [];
  
  // Fetch dynamic processing time estimate
  const timeEstimate = await getEstimatedProcessingTime(certificateType, 'normal');

  return {
    success: true,
    certificateType,
    requiredDocuments: requiredDocs,
    estimatedDays: timeEstimate.estimatedDays,
    message: `You likely need a ${certificateType.charAt(0).toUpperCase() + certificateType.slice(1)} Certificate.`
  };
};

module.exports = { getGuidance };
