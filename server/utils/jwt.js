import jwt from 'jsonwebtoken';

// Generate JWT token with userId and role
export const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const payload = {
    userId: user._id ? user._id.toString() : user.id,
    role: user.role,
  };

  return jwt.sign(payload, secret, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.verify(token, secret);
};
