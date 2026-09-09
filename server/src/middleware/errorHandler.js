/**
 * Global Error Handling Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error('Unhandled Server Error:', err);

  // SyntaxError from JSON parsing body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Invalid JSON payload sent in request body.'
      }
    });
  }

  // Standard safe error response
  return res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'An unexpected error occurred on the server. Please try again later.'
    }
  });
}
