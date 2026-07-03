/**
 * Wraps async functions to catch errors and pass them to the Express next() function.
 * This eliminates the need for try/catch blocks in every controller.
 *
 * @param {Function} fn - The asynchronous controller function
 * @returns {Function} - The wrapped middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
