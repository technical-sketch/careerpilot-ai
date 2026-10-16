
import jwt from 'jsonwebtoken';

export default function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Please log in to continue.',
    });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({
      error: 'Authentication is not configured.',
    });
  }

  try {
    const payload = jwt.verify(token, secret);

    if (!payload.sub) {
      return res.status(401).json({
        error: 'Invalid login token.',
      });
    }

    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({
      error: 'Your session has expired. Please log in again.',
    });
  }
}
