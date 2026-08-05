import { Router } from 'express';
import { propertiesController } from './properties.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

/**
 * @route   GET /api/properties
 * @desc    List properties with filters
 * @access  Protected
 */
router.get(
  ROUTES.PROPERTIES.LIST,
  authenticate,
  propertiesController.listProperties,
);

/**
 * @route   GET /api/properties/:propertyId
 * @desc    Get property detail
 * @access  Protected
 */
router.get(
  ROUTES.PROPERTIES.GET_BY_ID,
  authenticate,
  propertiesController.getPropertyById,
);

/**
 * @route   GET /api/properties/:propertyId/availability
 * @desc    Get available viewing slots
 * @access  Protected
 */
router.get(
  ROUTES.PROPERTIES.AVAILABILITY,
  authenticate,
  propertiesController.getAvailability,
);

export default router;
