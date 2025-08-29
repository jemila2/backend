
const express = require('express');
const router = express.Router();
const EmployeeRequest = require('../models/EmployeeRequest'); 

router.post('/', async (req, res) => {
  try {
    // Validate request data
    const { userId, userName, userEmail, position, experience, skills, message } = req.body;
    
    if (!userId || !position || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new employee request
    const newRequest = new EmployeeRequest({
      userId,
      userName,
      userEmail,
      position,
      experience: experience || 0,
      skills: skills || '',
      message,
      status: 'pending',
      requestedAt: new Date()
    });

    // Save to database
    await newRequest.save();

    // Return success response
    res.status(201).json({
      message: 'Employee request submitted successfully',
      requestId: newRequest._id
    });
  } catch (error) {
    console.error('Error creating employee request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const requests = await EmployeeRequest.find().sort({ requestedAt: -1 });
    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('Error fetching employee requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch employee requests' 
    });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const request = await EmployeeRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Employee request not found'
      });
    }
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error('Error updating employee request:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update employee request' 
    });
  }
});

module.exports = router;