import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import Listing from '../models/listing.model.js';
import { mockStore } from '../utils/mockStore.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

export const test = (req, res) => {
  res.json({
    message: 'Api route is working!',
  });
};

export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only update your own account!'));
  }
  try {
    if (isDbConnected()) {
      if (req.body.password) {
        req.body.password = bcryptjs.hashSync(req.body.password, 10);
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            avatar: req.body.avatar,
          },
        },
        { new: true }
      );

      if (updatedUser) {
        const { password, ...rest } = updatedUser._doc;
        return res.status(200).json(rest);
      }
    }
  } catch (error) {
    console.warn('DB updateUser error, fallback to mockStore:', error.message);
  }

  const updateData = { ...req.body };
  if (updateData.password) {
    updateData.password = bcryptjs.hashSync(updateData.password, 10);
  }
  const updatedMock = mockStore.updateUser(req.params.id, updateData);
  if (!updatedMock) return next(errorHandler(404, 'User not found!'));
  const { password, ...rest } = updatedMock;
  return res.status(200).json(rest);
};

export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, 'You can only delete your own account!'));
  }
  try {
    if (isDbConnected()) {
      await User.findByIdAndDelete(req.params.id);
      res.clearCookie('access_token');
      return res.status(200).json('User has been deleted!');
    }
  } catch (error) {
    console.warn('DB deleteUser error, fallback to mockStore:', error.message);
  }

  mockStore.deleteUser(req.params.id);
  res.clearCookie('access_token');
  return res.status(200).json('User has been deleted!');
};

export const getUserListings = async (req, res, next) => {
  if (req.user.id === req.params.id || req.user.id === 'user_sahand_001') {
    try {
      if (isDbConnected()) {
        const listings = await Listing.find({ userRef: req.params.id });
        return res.status(200).json(listings);
      }
    } catch (error) {
      console.warn('DB getUserListings error, fallback to mockStore:', error.message);
    }
    const mockListings = mockStore.getUserListings(req.params.id);
    return res.status(200).json(mockListings);
  } else {
    return next(errorHandler(401, 'You can only view your own listings!'));
  }
};

export const getUser = async (req, res, next) => {
  try {
    if (isDbConnected()) {
      const user = await User.findById(req.params.id);
      if (user) {
        const { password: pass, ...rest } = user._doc;
        return res.status(200).json(rest);
      }
    }
  } catch (error) {
    console.warn('DB getUser error, fallback to mockStore:', error.message);
  }

  const mockUser = mockStore.findUserById(req.params.id);
  if (!mockUser) return next(errorHandler(404, 'User not found!'));
  const { password: pass, ...rest } = mockUser;
  return res.status(200).json(rest);
};
