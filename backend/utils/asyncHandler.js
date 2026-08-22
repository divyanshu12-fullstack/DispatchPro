// Wraps async route handlers so any rejection forwards to `next(err)` and
// lands in the central error middleware. Without this, an awaited rejection
// inside an Express handler is an unhandled promise rejection and the
// request hangs until the client times out.
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};