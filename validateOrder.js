// validateOrder.js
const validateOrder = (req, res, next) => {
  // First normalize the data
  if (!req.body.services && req.body.items) {
    req.body.services = req.body.items.map(item => ({
      type: item.type === 'laundry' ? 'Wash & Fold' : item.type,
      quantity: item.quantity,
      price: item.price,
      description: item.name
    }));
  }

  // Then validate
  const errors = [];
  
  if (!req.body.customer && !req.body.customerId) {
    errors.push('Customer ID is required');
  } else {
    req.body.customer = req.body.customer || req.body.customerId;
  }

  if (!req.body.services) {
    errors.push('At least one service/item is required');
  }

  // ... rest of your validation

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};