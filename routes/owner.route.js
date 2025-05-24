const express = require('express');
const router = express.Router();
const { Property, propertyTypes } = require('../models/Property.model');
const { protect, authorize } = require('../middleware/auth.middleware');

// Apply middleware to all routes - must be logged in and an owner
router.use(protect, authorize('owner'));

// GET /api/owner/properties/count - Get count of properties owned by the logged-in owner
router.get('/properties/count', async (req, res) => {
  try {
    const count = await Property.countDocuments({ ownerId: req.user.id });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching property count', error: error.message });
  }
});

// GET /api/owner/:ownerId/properties - Get all properties owned by a specific owner
router.get('/:ownerId/properties', async (req, res) => {
  try {
    // Ensure the owner can only view their own properties
    // Convert both to strings for comparison to avoid type issues
    if (req.params.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        message: 'You can only view your own properties',
        debug: {
          paramOwnerId: req.params.ownerId,
          userId: req.user.id
        }
      });
    }
    
    const properties = await Property.find({ ownerId: req.user.id });
    res.status(200).json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching properties', error: error.message });
  }
});

// POST /api/owner/:ownerId/properties - Add a new property for a specific owner
router.post('/:ownerId/properties', async (req, res) => {
  try {
    // Ensure the owner can only add properties for themselves
    // Convert both to strings for comparison to avoid type issues
    if (req.params.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ 
        message: 'You can only add properties for your own account',
        debug: {
          paramOwnerId: req.params.ownerId,
          userId: req.user.id
        }
      });
    }
    
    // Create the property with the owner ID from the authenticated user (more secure)
    const propertyData = {
      ...req.body,
      ownerId: req.user.id // Use the ID from the token instead of URL param
    };
    
    const property = await Property.create(propertyData);
    res.status(201).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create property', error: error.message });
  }
});

// PUT /api/owner/:ownerId/properties/:propertyId - Edit a property
router.put('/:ownerId/properties/:propertyId', async (req, res) => {
  try {
    // Ensure the owner can only edit their own properties
    if (req.params.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own properties' });
    }
    
    // Find the property
    const property = await Property.findById(req.params.propertyId);
    
    // Check if property exists
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Verify ownership
    if (property.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'This property does not belong to you' });
    }
    
    // Update the property
    Object.assign(property, req.body);
    await property.save();
    
    res.status(200).json(property);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update property', error: error.message });
  }
});

// DELETE /api/owner/:ownerId/properties/:propertyId - Delete a property
router.delete('/:ownerId/properties/:propertyId', async (req, res) => {
  try {
    // Ensure the owner can only delete their own properties
    if (req.params.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own properties' });
    }
    
    // Find the property
    const property = await Property.findById(req.params.propertyId);
    
    // Check if property exists
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    // Verify ownership
    if (property.ownerId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'This property does not belong to you' });
    }
    
    // Delete the property
    await property.deleteOne();
    
    res.status(200).json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete property', error: error.message });
  }
});

module.exports = router;