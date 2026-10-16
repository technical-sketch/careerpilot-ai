export function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'API route not found.' });
}

export function errorHandler(error, _req, res, _next) {
  console.error('API error:', error.message);
  if (res.headersSent) return res.end();
  const status = error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ error: status === 500 ? 'Something went wrong on the server. Please try again.' : error.message });
}
