// Replace express-validator with manual validation
const validateEmployeeCreation = (req, res, next) => {
  const errors = [];
  const { name, email, phone, position, salary } = req.body;

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('Name is required and must be a non-empty string');
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.push('Valid email is required');
  }

  // Phone validation (basic)
  const phoneRegex = /^[0-9]{10,15}$/;
  if (!phone || !phoneRegex.test(phone)) {
    errors.push('Phone must be 10-15 digits');
  }

  // Position validation
  const validPositions = ['washer', 'dryer', 'ironer', 'manager', 'delivery', 'admin'];
  if (!position || !validPositions.includes(position)) {
    errors.push(`Position must be one of: ${validPositions.join(', ')}`);
  }

  // Salary validation
  if (!salary || isNaN(salary) || Number(salary) <= 0) {
    errors.push('Salary must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};