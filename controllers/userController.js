const User = require('../models/UserModel');

exports.getAllUsers =async (req, res, next) => {
  res.status(200).json(res.advancedResults);
}
exports.getUser = async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
}
exports.createUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role
  });

  // Remove password from output
  user.password = undefined;

  res.status(201).json({
    success: true,
    data: user
  });
}
exports.updateUser = async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email
  };

  // Only admins can update role
  if (req.user.role === 'admin' && req.body.role) {
    fieldsToUpdate.role = req.body.role;
  }

  const user = await User.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  }).select('-password');

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
}
exports.updateUserRole = async (req, res, next) => {
  const validRoles = ['user', 'employee', 'admin'];
  
  if (!validRoles.includes(req.body.role)) {
    return next(
      new ErrorResponse(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400)
    );
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: user
  });
}
exports.deleteUser = async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: {}
  });
}