

const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    const users = await User.find({}).select('-password -__v');
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
    
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1. Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in! Please log in to get access.'
      });
    }

    // 2. Verify token (replace with your JWT verification logic)
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token does no longer exist.'
      });
    }

    // 4. Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token or session expired!'
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

// const register = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;
    
//     // Input validation
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name, email and password are required'
//       });
//     }
    
//     // Check for existing user
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: 'Email already registered'
//       });
//     }
    
//     // Create user
//     const user = await User.create({ name, email, password });
    
//     // Generate token (will use the verified JWT_SECRET)
//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: '30d' }
//     );
    
//     res.status(201).json({
//       success: true,
//       token,
//       user: sanitizeUser(user)
//     });
    
//   } catch (error) {
//     console.error('Registration error:', error);
//     res.status(500).json({
//       success: false,
//       message: error.message.includes('JWT_SECRET') 
//         ? 'Server configuration error' 
//         : 'Registration failed'
//     });
//   }
// };

// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Validate input
//     if (!email || !password) {
//       return res.status(400).json({ 
//         success: false,
//         message: 'Please provide email and password'
//       });
//     }

//     // Check user exists
//     const user = await User.findOne({ email }).select('+password');
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Verify password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: 'Invalid credentials'
//       });
//     }

//     // Verify JWT_SECRET exists
//     if (!process.env.JWT_SECRET) {
//       throw new Error('JWT_SECRET is not configured');
//     }

//     // Create token
//     const token = jwt.sign(
//       { id: user._id },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
//     );

//     // Send response
//     res.status(200).json({
//       success: true,
//       token,
//       user: sanitizeUser(user)
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Authentication failed',
//       error: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    console.log('Registration attempt:', { name, email, phone });

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with customer role
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
      role: 'customer', // Explicitly set to customer
      status: 'active'
    });

    await user.save();
    console.log('User created successfully:', user.email);

    // Return success but DON'T generate token or log in automatically
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login with your credentials.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (address) updates.address = address;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please enter both current and new password' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};














// controllers/authController.js
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Generate token
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data without password
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      // Role-specific data
      ...(user.role === 'employee' && {
        position: user.position,
        employeeId: user.employeeId
      }),
      ...(user.role === 'supplier' && {
        company: user.company,
        supplierId: user.supplierId
      })
    };

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  getAllUsers,
  updateProfile,
  changePassword
};