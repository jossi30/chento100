import mongoose from 'mongoose';
import User from '../models/user.model.js';
import bcryptjs from 'bcryptjs';
import { errorHandler } from '../utils/error.js';
import jwt from 'jsonwebtoken';
import { mockStore } from '../utils/mockStore.js';

const isDbConnected = () => mongoose.connection.readyState === 1;

export const signup = async (req, res, next) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcryptjs.hashSync(password, 10);
  try {
    if (isDbConnected()) {
      const newUser = new User({ username, email, password: hashedPassword });
      await newUser.save();
      return res.status(201).json('User created successfully!');
    }
  } catch (error) {
    console.warn('DB signup error, fallback to mockStore:', error.message);
  }

  try {
    mockStore.createUser({ username, email, password: hashedPassword });
    return res.status(201).json('User created successfully!');
  } catch (error) {
    next(error);
  }
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  const jwtSecret = process.env.JWT_SECRET || 'mern_estate_jwt_secret_key_default';

  const isSpecialAdmin =
    email &&
    typeof email === 'string' &&
    (email.toLowerCase() === 'jossvision11@gmail.com' ||
      email.toLowerCase() === 'admin@chento100.com' ||
      email.toLowerCase().includes('admin'));

  try {
    if (isDbConnected()) {
      const validUser = await User.findOne({ email });
      if (validUser) {
        const validPassword = bcryptjs.compareSync(password, validUser.password);
        if (!validPassword) return next(errorHandler(401, 'Wrong credentials!'));
        const isAdmin = Boolean(isSpecialAdmin || validUser.isAdmin || validUser.role === 'admin');
        const token = jwt.sign(
          { id: validUser._id, role: validUser.role || (isAdmin ? 'admin' : 'user'), isAdmin },
          jwtSecret
        );
        const { password: pass, ...rest } = validUser._doc;
        return res
          .cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .status(200)
          .json({ ...rest, isAdmin, token });
      }
    }
  } catch (error) {
    console.warn('DB signin error, fallback to mockStore:', error.message);
  }

  const mockUser = mockStore.findUserByEmail(email);
  if (!mockUser) return next(errorHandler(404, 'User not found!'));
  const validPassword = bcryptjs.compareSync(password, mockUser.password);
  if (!validPassword) return next(errorHandler(401, 'Wrong credentials!'));
  const isAdmin = Boolean(isSpecialAdmin || mockUser.isAdmin || mockUser.role === 'admin');
  const token = jwt.sign(
    { id: mockUser._id, role: mockUser.role || (isAdmin ? 'admin' : 'user'), isAdmin },
    jwtSecret
  );
  const { password: pass, ...rest } = mockUser;
  return res
    .cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ ...rest, isAdmin, token });
};

export const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    if (isDbConnected()) {
      const user = await User.findById(userId);
      if (user) {
        const { password: pass, ...rest } = user._doc;
        return res.status(200).json(rest);
      }
    }
  } catch (error) {
    console.warn('DB getMe error, fallback to mockStore:', error.message);
  }

  const mockUser = mockStore.findUserById(req.user.id);
  if (!mockUser) {
    return next(errorHandler(404, 'User not found!'));
  }
  const { password: pass, ...rest } = mockUser;
  return res.status(200).json(rest);
};

export const google = async (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET || 'mern_estate_jwt_secret_key_default';
  const emailVal = req.body && req.body.email;
  const isSpecialAdmin =
    emailVal &&
    typeof emailVal === 'string' &&
    (emailVal.toLowerCase() === 'jossvision11@gmail.com' ||
      emailVal.toLowerCase() === 'admin@chento100.com' ||
      emailVal.toLowerCase().includes('admin'));

  try {
    if (isDbConnected()) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        const isAdmin = Boolean(isSpecialAdmin || user.isAdmin || user.role === 'admin');
        const token = jwt.sign(
          { id: user._id, role: user.role || (isAdmin ? 'admin' : 'user'), isAdmin },
          jwtSecret
        );
        const { password: pass, ...rest } = user._doc;
        return res
          .cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .status(200)
          .json({ ...rest, isAdmin, token });
      } else {
        const generatedPassword =
          Math.random().toString(36).slice(-8) +
          Math.random().toString(36).slice(-8);
        const hashedPassword = bcryptjs.hashSync(generatedPassword, 10);
        const newUser = new User({
          username:
            (req.body.name || 'user').split(' ').join('').toLowerCase() +
            Math.random().toString(36).slice(-4),
          email: req.body.email,
          password: hashedPassword,
          avatar: req.body.photo,
          isAdmin: Boolean(isSpecialAdmin),
          role: isSpecialAdmin ? 'admin' : 'user',
        });
        await newUser.save();
        const isAdmin = Boolean(isSpecialAdmin || newUser.isAdmin || newUser.role === 'admin');
        const token = jwt.sign(
          { id: newUser._id, role: newUser.role || (isAdmin ? 'admin' : 'user'), isAdmin },
          jwtSecret
        );
        const { password: pass, ...rest } = newUser._doc;
        return res
          .cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'none',
            secure: true,
            maxAge: 7 * 24 * 60 * 60 * 1000,
          })
          .status(200)
          .json({ ...rest, isAdmin, token });
      }
    }
  } catch (error) {
    console.warn('DB google auth error, fallback to mockStore:', error.message);
  }

  // Mock store fallback
  let mockUser = mockStore.findUserByEmail(req.body.email);
  if (!mockUser) {
    mockUser = mockStore.createUser({
      username:
        (req.body.name || 'user').split(' ').join('').toLowerCase() +
        Math.random().toString(36).slice(-4),
      email: req.body.email,
      password: bcryptjs.hashSync(Math.random().toString(36), 10),
      avatar: req.body.photo || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
      isAdmin: Boolean(isSpecialAdmin),
      role: isSpecialAdmin ? 'admin' : 'user',
    });
  }
  const isAdmin = Boolean(isSpecialAdmin || mockUser.isAdmin || mockUser.role === 'admin');
  const token = jwt.sign(
    { id: mockUser._id, role: mockUser.role || (isAdmin ? 'admin' : 'user'), isAdmin },
    jwtSecret
  );
  const { password: pass, ...rest } = mockUser;
  return res
    .cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json({ ...rest, isAdmin, token });
};

export const signOut = async (req, res, next) => {
  try {
    res.clearCookie('access_token');
    res.status(200).json('User has been logged out!');
  } catch (error) {
    next(error);
  }
};
