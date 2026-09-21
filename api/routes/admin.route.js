import express from 'express';
import { verifyToken, verifyAdmin } from '../utils/verifyUser.js';
import {
  getAdminListings,
  getAllListings,
  getPendingListings,
  approveListing,
  rejectListing,
  toggleStatusListing,
  toggleActiveListing,
  getUsers,
  adminDeleteListing,
  adminUpdateListing,
  adminGetListing,
} from '../controllers/admin.controller.js';

const router = express.Router();

// 1. GET /api/admin/listings (fetch listings filtered by isApproved: false or all listings)
router.get('/listings', getAdminListings);

// 2. PUT /api/admin/approve/:id (sets isApproved: true)
router.put('/approve/:id', verifyToken, verifyAdmin, approveListing);

// 3. PUT /api/admin/toggle-status/:id (toggles the isActive boolean property)
router.put('/toggle-status/:id', verifyToken, verifyAdmin, toggleStatusListing);

// 4. Admin Edit & Delete operations on any listing
router.delete('/listings/:id', verifyToken, verifyAdmin, adminDeleteListing);
router.delete('/delete/:id', verifyToken, verifyAdmin, adminDeleteListing);
router.put('/listings/:id', verifyToken, verifyAdmin, adminUpdateListing);
router.post('/listings/:id', verifyToken, verifyAdmin, adminUpdateListing);
router.put('/update/:id', verifyToken, verifyAdmin, adminUpdateListing);
router.post('/update/:id', verifyToken, verifyAdmin, adminUpdateListing);
router.get('/listings/:id', adminGetListing);

// --- Backwards compatibility routes for existing frontend & admin dashboard ---
router.patch('/approve/:id', verifyToken, verifyAdmin, approveListing);
router.patch('/toggle-status/:id', verifyToken, verifyAdmin, toggleStatusListing);
router.put('/toggle-active/:id', verifyToken, verifyAdmin, toggleStatusListing);
router.patch('/toggle-active/:id', verifyToken, verifyAdmin, toggleStatusListing);

router.get('/listings/all', getAllListings);
router.get('/listings/pending', getPendingListings);
router.patch('/listings/:id/approve', verifyToken, verifyAdmin, approveListing);
router.put('/listings/:id/approve', verifyToken, verifyAdmin, approveListing);
router.patch('/listings/:id/reject', verifyToken, verifyAdmin, rejectListing);
router.put('/listings/:id/reject', verifyToken, verifyAdmin, rejectListing);
router.patch('/listings/:id/toggle-active', verifyToken, verifyAdmin, toggleActiveListing);
router.put('/listings/:id/toggle-active', verifyToken, verifyAdmin, toggleActiveListing);
router.put('/listings/:id/toggle-status', verifyToken, verifyAdmin, toggleStatusListing);
router.patch('/listings/:id/toggle-status', verifyToken, verifyAdmin, toggleStatusListing);

router.get('/users', verifyToken, verifyAdmin, getUsers);

export default router;
