describe('Logger Utility', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs debug in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    // Re-import to pick up new NODE_ENV
    const { logger } = require('../lib/logger');
    logger.debug('test debug');
    expect(console.debug).toHaveBeenCalledWith('[DEBUG] test debug');
    
    process.env.NODE_ENV = originalEnv;
  });

  it('does not log debug in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // Re-import to pick up new NODE_ENV
    const { logger } = require('../lib/logger');
    logger.debug('test debug');
    expect(console.debug).not.toHaveBeenCalled();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('always logs errors', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    // Re-import to pick up new NODE_ENV
    const { logger } = require('../lib/logger');
    logger.error('test error');
    expect(console.error).toHaveBeenCalledWith('[ERROR] test error');
    
    process.env.NODE_ENV = originalEnv;
  });
});
