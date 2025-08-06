/**
 * Jest setup file
 * Global test configuration and setup
 */

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  jest.resetAllMocks();
});

// Dummy test to prevent "no tests" error
describe('Setup', () => {
  it('should be properly configured', () => {
    expect(true).toBe(true);
  });
});
