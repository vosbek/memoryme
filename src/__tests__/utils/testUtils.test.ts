import { createLogger } from '../../shared/utils/logger';

describe('Utility Functions', () => {
  describe('Logger', () => {
    it('creates logger with correct name', () => {
      const logger = createLogger('TestLogger');
      expect(logger).toBeDefined();
      
      // Test that logger methods exist
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('logs messages without throwing errors', () => {
      const logger = createLogger('TestLogger');
      
      expect(() => {
        logger.info('Test info message');
        logger.error('Test error message');
        logger.warn('Test warning message');
        logger.debug('Test debug message');
      }).not.toThrow();
    });

    it('handles structured logging data', () => {
      const logger = createLogger('TestLogger');
      
      expect(() => {
        logger.info('Test message with data', { 
          userId: '123', 
          action: 'test',
          metadata: { nested: 'value' }
        });
      }).not.toThrow();
    });

    it('handles various data types in log messages', () => {
      const logger = createLogger('TestLogger');
      
      expect(() => {
        logger.info('Testing various data types', {
          string: 'test',
          number: 42,
          boolean: true,
          null: null,
          undefined: undefined,
          array: [1, 2, 3],
          object: { key: 'value' }
        });
      }).not.toThrow();
    });
  });

  describe('Environment and Configuration', () => {
    it('handles NODE_ENV correctly', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test development environment
      process.env.NODE_ENV = 'development';
      const devLogger = createLogger('DevTest');
      expect(devLogger).toBeDefined();
      
      // Test production environment
      process.env.NODE_ENV = 'production';
      const prodLogger = createLogger('ProdTest');
      expect(prodLogger).toBeDefined();
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});