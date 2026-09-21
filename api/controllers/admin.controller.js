import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import { mockStore } from '../utils/mockStore.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * 3. GET /api/admin/listings
 * Fetch listings filtered by isApproved: false or all listings
 */
export const getAdminListings = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      let filter = {};
      if (req.query.isApproved !== undefined) {
        const filterApproved = req.query.isApproved === 'true';
        filter = filterApproved
          ? { $or: [{ isApproved: true }, { status: 'approved' }] }
          : { $or: [{ isApproved: false }, { status: 'pending' }, { status: 'rejected' }] };
      } else if (req.query.status === 'pending' || req.query.filter === 'pending') {
        filter = { $or: [{ isApproved: false }, { status: 'pending' }] };
      }

      const listings = await Listing.find(filter).sort({ createdAt: -1 });
      return res.status(200).json(listings);
    }
  } catch (error) {
    console.warn('DB getAdminListings error, fallback to mockStore:', error.message);
  }

  try {
    let list = mockStore.getAllListings();
    if (req.query.isApproved !== undefined) {
      const filterApproved = req.query.isApproved === 'true';
      list = list.filter((item) => {
        const isAppr = Boolean(item.isApproved || item.status === 'approved');
        return isAppr === filterApproved;
      });
    } else if (req.query.status === 'pending' || req.query.filter === 'pending') {
      list = list.filter((item) => !item.isApproved || item.status === 'pending');
    }
    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
};

/**
 * Alias for getAdminListings
 */
export const getAllListings = getAdminListings;

/**
 * GET /api/admin/listings/pending (backwards compatibility)
 */
export const getPendingListings = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const listings = await Listing.find({
        $or: [{ isApproved: false }, { status: 'pending' }],
      }).sort({ createdAt: -1 });
      return res.status(200).json(listings);
    }
  } catch (error) {
    console.warn('DB getPendingListings error, fallback to mockStore:', error.message);
  }

  try {
    const mockListings = mockStore.getPendingListings();
    return res.status(200).json(mockListings);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. PUT /api/admin/approve/:id (sets isApproved: true)
 */
export const approveListing = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) {
        return next(errorHandler(404, 'Listing not found!'));
      }
      listing.isApproved = true;
      listing.status = 'approved';
      const updatedListing = await listing.save();
      return res.status(200).json(updatedListing);
    }
  } catch (error) {
    console.warn('DB approveListing error, fallback to mockStore:', error.message);
  }

  try {
    const mockItem = mockStore.getListing(req.params.id);
    if (!mockItem) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    const updated = mockStore.updateListing(req.params.id, {
      isApproved: true,
      status: 'approved',
    });
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/reject/:id (sets isApproved: false, status: 'rejected')
 */
export const rejectListing = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) {
        return next(errorHandler(404, 'Listing not found!'));
      }
      listing.isApproved = false;
      listing.status = 'rejected';
      const updatedListing = await listing.save();
      return res.status(200).json(updatedListing);
    }
  } catch (error) {
    console.warn('DB rejectListing error, fallback to mockStore:', error.message);
  }

  try {
    const mockItem = mockStore.getListing(req.params.id);
    if (!mockItem) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    const updated = mockStore.updateListing(req.params.id, {
      isApproved: false,
      status: 'rejected',
    });
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * 3. PUT /api/admin/toggle-status/:id (toggles the isActive boolean property)
 */
export const toggleStatusListing = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) {
        return next(errorHandler(404, 'Listing not found!'));
      }
      const currentActive =
        listing.isActive !== undefined
          ? listing.isActive
          : listing.active !== undefined
          ? listing.active
          : true;
      const newActive = !currentActive;
      listing.isActive = newActive;
      listing.active = newActive;
      const updatedListing = await listing.save();
      return res.status(200).json(updatedListing);
    }
  } catch (error) {
    console.warn('DB toggleStatusListing error, fallback to mockStore:', error.message);
  }

  try {
    const mockItem = mockStore.getListing(req.params.id);
    if (!mockItem) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    const currentActive =
      mockItem.isActive !== undefined
        ? mockItem.isActive
        : mockItem.active !== undefined
        ? mockItem.active
        : true;
    const newActive = !currentActive;
    const updated = mockStore.updateListing(req.params.id, {
      isActive: newActive,
      active: newActive,
    });
    return res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
};

/**
 * Alias for toggleStatusListing
 */
export const toggleActiveListing = toggleStatusListing;

/**
 * GET /api/admin/users
 */
export const getUsers = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const users = await User.find({}).select('-password');
      return res.status(200).json(users);
    }
  } catch (error) {
    console.warn('DB getUsers error, fallback to mockStore:', error.message);
  }

  try {
    const allUsers = mockStore.getAllUsers().map((user) => {
      const { password, ...rest } = user;
      return rest;
    });
    return res.status(200).json(allUsers);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/listings/:id
 * Allows administrator to delete any current or future listing.
 */
export const adminDeleteListing = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(id);
      if (!listing) {
        // Also check if it exists in mockStore before 404
        const mockItem = mockStore.getListing(id);
        if (!mockItem) {
          return next(errorHandler(404, 'Listing not found!'));
        }
        mockStore.deleteListing(id);
        return res.status(200).json({ success: true, message: 'Listing has been deleted by admin!' });
      }
      await Listing.findByIdAndDelete(id);
      mockStore.deleteListing(id);
      return res.status(200).json({ success: true, message: 'Listing has been deleted by admin!' });
    }
  } catch (error) {
    console.warn('DB adminDeleteListing error, fallback to mockStore:', error.message);
  }

  const mockItem = mockStore.getListing(id);
  if (!mockItem) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  mockStore.deleteListing(id);
  return res.status(200).json({ success: true, message: 'Listing has been deleted by admin!' });
};

/**
 * PUT /api/admin/listings/:id or POST /api/admin/listings/:id
 * Allows administrator to edit any current or future listing.
 */
export const adminUpdateListing = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(id);
      if (listing) {
        const updated = await Listing.findByIdAndUpdate(
          id,
          req.body,
          { new: true }
        );
        mockStore.updateListing(id, req.body);
        return res.status(200).json(updated);
      }
    }
  } catch (error) {
    console.warn('DB adminUpdateListing error, fallback to mockStore:', error.message);
  }

  const mockItem = mockStore.getListing(id);
  if (!mockItem) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  const updated = mockStore.updateListing(id, req.body);
  return res.status(200).json(updated);
};

/**
 * GET /api/admin/listings/:id
 * Admin listing inspection endpoint
 */
export const adminGetListing = async (req, res, next) => {
  const { id } = req.params;
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(id);
      if (listing) return res.status(200).json(listing);
    }
  } catch (error) {
    console.warn('DB adminGetListing error, fallback to mockStore:', error.message);
  }

  const mockItem = mockStore.getListing(id);
  if (!mockItem) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  return res.status(200).json(mockItem);
};
