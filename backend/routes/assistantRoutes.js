const express = require('express');
const router = express.Router();
const { getGuidance } = require('../services/assistantService');
const { protect } = require('../middleware/authMiddleware');

// Using 'protect' middleware to ensure only logged in users can use the assistant
// If you want it public, you can remove the protect middleware
router.post('/guide', protect, async (req, res, next) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required.' });
    }
    
    const guidance = await getGuidance(query);
    
    // Always return 200, even if guidance.success is false, 
    // because the assistant itself ran successfully (it just didn't understand the query)
    res.status(200).json({
      success: true,
      data: guidance
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
