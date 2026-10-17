/**
 * Wrap an async route handler so thrown errors reach the error middleware
 * without a try/catch in every controller.
 */
module.exports = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
