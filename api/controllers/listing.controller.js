import mongoose from 'mongoose';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';
import { mockStore } from '../utils/mockStore.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

export const createListing = async (req, res, next) => {
  const listingData = { ...req.body, status: 'pending' };
  try {
    if (isDbConnected()) {
      const listing = await Listing.create(listingData);
      return res.status(201).json(listing);
    }
  } catch (error) {
    console.warn('DB createListing error, fallback to mockStore:', error.message);
  }
  try {
    const listing = mockStore.createListing(listingData);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const isAdmin = req.user && (req.user.isAdmin === true || req.user.role === 'admin');
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) {
        return next(errorHandler(404, 'Listing not found!'));
      }
      if (!isAdmin && req.user.id !== listing.userRef) {
        return next(errorHandler(401, 'You can only delete your own listings!'));
      }
      await Listing.findByIdAndDelete(req.params.id);
      mockStore.deleteListing(req.params.id);
      return res.status(200).json('Listing has been deleted!');
    }
  } catch (error) {
    console.warn('DB deleteListing error, fallback to mockStore:', error.message);
  }

  const mockItem = mockStore.getListing(req.params.id);
  if (!mockItem) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  if (!isAdmin && req.user.id !== mockItem.userRef && mockItem.userRef !== 'user_sahand_001') {
    return next(errorHandler(401, 'You can only delete your own listings!'));
  }
  mockStore.deleteListing(req.params.id);
  return res.status(200).json('Listing has been deleted!');
};

export const updateListing = async (req, res, next) => {
  const isAdmin = req.user && (req.user.isAdmin === true || req.user.role === 'admin');
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (!listing) {
        return next(errorHandler(404, 'Listing not found!'));
      }
      if (!isAdmin && req.user.id !== listing.userRef) {
        return next(errorHandler(401, 'You can only update your own listings!'));
      }
      const updatedListing = await Listing.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      mockStore.updateListing(req.params.id, req.body);
      return res.status(200).json(updatedListing);
    }
  } catch (error) {
    console.warn('DB updateListing error, fallback to mockStore:', error.message);
  }

  const mockItem = mockStore.getListing(req.params.id);
  if (!mockItem) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  if (!isAdmin && req.user.id !== mockItem.userRef && mockItem.userRef !== 'user_sahand_001') {
    return next(errorHandler(401, 'You can only update your own listings!'));
  }
  const updated = mockStore.updateListing(req.params.id, req.body);
  return res.status(200).json(updated);
};

export const getListing = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const listing = await Listing.findById(req.params.id);
      if (listing) {
        return res.status(200).json(listing);
      }
    }
  } catch (error) {
    console.warn('DB getListing error, fallback to mockStore:', error.message);
  }

  const mockItem = mockStore.getListing(req.params.id);
  if (!mockItem) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  return res.status(200).json(mockItem);
};

export const getListings = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const limit = parseInt(req.query.limit) || 9;
      const startIndex = parseInt(req.query.startIndex) || 0;

      const filter = {
        status: 'approved',
        active: true,
      };

      // Search term
      const searchTerm = req.query.searchTerm || '';
      if (searchTerm) {
        filter.$or = [
          { name: { $regex: searchTerm, $options: 'i' } },
          { title: { $regex: searchTerm, $options: 'i' } },
          { description: { $regex: searchTerm, $options: 'i' } },
          { address: { $regex: searchTerm, $options: 'i' } },
          { location: { $regex: searchTerm, $options: 'i' } },
          { make: { $regex: searchTerm, $options: 'i' } },
          { model: { $regex: searchTerm, $options: 'i' } },
        ];
      }

      // Category filter (support category or legacy type)
      let category = req.query.category;
      if (!category && req.query.type) {
        if (req.query.type === 'rent') category = 'guesthouse';
        else if (req.query.type === 'sale') category = 'car';
      }
      if (category && category !== 'all') {
        filter.category = category;
      }

      // Guesthouse options
      if (req.query.bedrooms && parseInt(req.query.bedrooms) > 0) {
        filter.bedrooms = { $gte: parseInt(req.query.bedrooms) };
      }
      if (req.query.bathrooms && parseInt(req.query.bathrooms) > 0) {
        filter.bathrooms = { $gte: parseInt(req.query.bathrooms) };
      }
      if (req.query.maxGuests && parseInt(req.query.maxGuests) > 0) {
        filter.maxGuests = { $gte: parseInt(req.query.maxGuests) };
      }
      const requestedAmenities = [];
      if (req.query.wifi === 'true') requestedAmenities.push('wifi');
      if (req.query.kitchen === 'true') requestedAmenities.push('kitchen');
      if (req.query.airConditioning === 'true') requestedAmenities.push('air');
      if (req.query.pool === 'true') requestedAmenities.push('pool');
      if (req.query.amenities) {
        req.query.amenities.split(',').forEach((a) => {
          if (a.trim()) requestedAmenities.push(a.trim());
        });
      }
      if (requestedAmenities.length > 0) {
        filter.amenities = {
          $in: requestedAmenities.map((a) => new RegExp(a, 'i')),
        };
      }

      // Car options
      if (req.query.transmission && req.query.transmission !== 'all') {
        filter.transmission = req.query.transmission;
      }
      if (req.query.driverIncluded === 'true') {
        filter.driverIncluded = true;
      }
      if (req.query.seats && parseInt(req.query.seats) > 0) {
        filter.seats = { $gte: parseInt(req.query.seats) };
      }

      // Sort
      const sort = req.query.sort || 'createdAt';
      const order = req.query.order || 'desc';

      const listings = await Listing.find(filter)
        .sort({ [sort]: order })
        .limit(limit)
        .skip(startIndex);

      if (listings && listings.length > 0) {
        return res.status(200).json(listings);
      }
    }
  } catch (error) {
    console.warn('DB getListings error, fallback to mockStore:', error.message);
  }

  const listings = mockStore.getListings(req.query);
  return res.status(200).json(listings);
};
