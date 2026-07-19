const Application = require('../models/Application');

/**
 * FORMULA EXPLANATION FOR VIVA/DOCUMENTATION:
 * 
 * This function calculates a dynamic, predictive processing time estimate based on real historical data.
 * 
 * 1. Base Historical Average (A): We look at the actual processing times (Reviewed Date - Creation Date) 
 *    of all approved applications of this specific type and priority over the last 90 days.
 * 
 * 2. Daily Approval Rate (R): We calculate how many applications of this type the office usually processes 
 *    per day (Total Approved in 90 days / 90).
 * 
 * 3. Current Backlog (B): We count how many applications of this type are currently sitting in the queue 
 *    waiting to be reviewed (status: 'pending' or 'under_review').
 * 
 * 4. Estimated Processing Time = A + (B / R)
 * 
 * In simple terms: The estimate is the "Usual Time it takes" PLUS the "Extra time it will take to clear the people waiting in line ahead of you".
 */
const getEstimatedProcessingTime = async (certificateType, priority) => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // 1. Fetch completed applications from the last 90 days
  const completedApps = await Application.find({
    certificateType,
    priority,
    status: 'approved',
    reviewedAt: { $gte: ninetyDaysAgo }
  });

  const historicalCount = completedApps.length;

  let baseAverageDays = priority === 'urgent' ? 2 : 7; // Sensible fallbacks
  
  if (historicalCount >= 5) {
    // Calculate average processing time in milliseconds
    const totalProcessingMs = completedApps.reduce((acc, app) => {
      // Safety check: ensure both dates exist
      if (app.reviewedAt && app.createdAt) {
        return acc + (new Date(app.reviewedAt) - new Date(app.createdAt));
      }
      return acc;
    }, 0);
    
    // Convert ms to days
    baseAverageDays = (totalProcessingMs / historicalCount) / (1000 * 60 * 60 * 24);
  } else {
    // Return sensible fallback if not enough historical data is available
    return {
      estimatedDays: priority === 'urgent' ? '1-3' : '5-8',
      historicalCount,
      formula: 'fallback'
    };
  }

  // 2. Calculate Daily Approval Rate (R)
  const approvalRatePerDay = historicalCount / 90;
  // Prevent division by zero or extremely low rates by capping the minimum rate
  const effectiveRate = Math.max(approvalRatePerDay, 0.5); 

  // 3. Count Current Backlog (B)
  const backlogCount = await Application.countDocuments({
    certificateType,
    status: { $in: ['pending', 'under_review'] }
  });

  // 4. Calculate Final Estimate
  const totalEstimatedDays = baseAverageDays + (backlogCount / effectiveRate);
  
  // Create a realistic range (-20% to +20%)
  const minDays = Math.max(1, Math.floor(totalEstimatedDays * 0.8));
  const maxDays = Math.max(minDays + 1, Math.ceil(totalEstimatedDays * 1.2));

  return {
    estimatedDays: `${minDays}-${maxDays}`,
    historicalCount,
    formula: 'weighted'
  };
};

module.exports = {
  getEstimatedProcessingTime
};
