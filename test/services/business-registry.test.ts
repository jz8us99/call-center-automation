/**
 * Unit tests for business service registry
 */

import {
  registerBusinessService,
  initializeBusinessServices,
  getRegisteredServices,
  getServicesStatus,
  resetServices,
  unregisterService,
  type BusinessService,
} from '@/lib/services/business-registry';
import { BaseBusinessService } from '@/lib/services/base-service';
import {
  MessageType,
  CallAnalyzedData,
} from '@/lib/message-system/message-types';

// Mock service classes for testing
class MockLegacyService implements BusinessService {
  name = 'MockLegacyService';

  async initialize(): Promise<void> {
    console.log('Mock legacy service initialized');
  }

  async handleCallAnalyzed(data: CallAnalyzedData): Promise<void> {
    console.log('Mock legacy service handling call', data.call.call_id);
  }
}

class MockModernService extends BaseBusinessService {
  readonly name = 'MockModernService';

  constructor() {
    super();
    this.setCapabilities({
      businessTypes: ['test'],
      messageTypes: [MessageType.CALL_ANALYZED],
    });
  }

  async initialize(): Promise<void> {
    console.log('Mock modern service initialized');
  }

  async handleCallAnalyzed(data: CallAnalyzedData): Promise<void> {
    console.log('Mock modern service handling call', data.call.call_id);
  }
}

class FailingService extends BaseBusinessService {
  readonly name = 'FailingService';

  async initialize(): Promise<void> {
    throw new Error('Initialization failed');
  }
}

describe('Business Registry', () => {
  beforeEach(() => {
    resetServices();
  });

  afterEach(() => {
    resetServices();
  });

  describe('Service Registration', () => {
    it('should register legacy service', () => {
      const service = new MockLegacyService();

      registerBusinessService(service);

      const services = getRegisteredServices();
      expect(services).toContain('MockLegacyService');

      const status = getServicesStatus();
      expect(status['MockLegacyService'].type).toBe('legacy');
    });

    it('should register modern service', () => {
      const service = new MockModernService();

      registerBusinessService(service);

      const services = getRegisteredServices();
      expect(services).toContain('MockModernService');

      const status = getServicesStatus();
      expect(status['MockModernService'].type).toBe('modern');
    });

    it('should warn on duplicate registration', () => {
      const service1 = new MockLegacyService();
      const service2 = new MockLegacyService();
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      registerBusinessService(service1);
      registerBusinessService(service2);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('MockLegacyService')
      );
    });
  });

  describe('Service Initialization', () => {
    it('should initialize all registered services', async () => {
      const legacyService = new MockLegacyService();
      const modernService = new MockModernService();

      registerBusinessService(legacyService);
      registerBusinessService(modernService);

      await initializeBusinessServices();

      const status = getServicesStatus();
      expect(status['MockLegacyService'].initialized).toBe(true);
      expect(status['MockModernService'].initialized).toBe(true);

      expect(console.log).toHaveBeenCalledWith(
        'Starting business services initialization...'
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('2/2 services successful')
      );
    });

    it('should handle initialization failures gracefully', async () => {
      const workingService = new MockModernService();
      const failingService = new FailingService();

      registerBusinessService(workingService);
      registerBusinessService(failingService);

      await initializeBusinessServices();

      const status = getServicesStatus();
      expect(status['MockModernService'].initialized).toBe(true);
      expect(status['FailingService'].initialized).toBe(false);
      expect(status['FailingService'].lastError).toBe('Initialization failed');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('1/2 services successful')
      );
    });

    it('should handle no registered services', async () => {
      await initializeBusinessServices();

      expect(console.log).toHaveBeenCalledWith(
        'No registered business services'
      );
    });
  });

  describe('Service Management', () => {
    it('should get registered services list', () => {
      const service1 = new MockLegacyService();
      const service2 = new MockModernService();

      registerBusinessService(service1);
      registerBusinessService(service2);

      const services = getRegisteredServices();
      expect(services).toEqual(['MockLegacyService', 'MockModernService']);
    });

    it('should get service status details', async () => {
      const service = new MockModernService();
      registerBusinessService(service);
      await initializeBusinessServices();

      const status = getServicesStatus();
      const serviceStatus = status['MockModernService'];

      expect(serviceStatus.name).toBe('MockModernService');
      expect(serviceStatus.type).toBe('modern');
      expect(serviceStatus.initialized).toBe(true);
      expect(serviceStatus.lastError).toBeUndefined();
    });

    it('should unregister service', () => {
      const service = new MockModernService();
      registerBusinessService(service);

      const result = unregisterService('MockModernService');
      expect(result).toBe(true);

      const services = getRegisteredServices();
      expect(services).not.toContain('MockModernService');
    });

    it('should return false when unregistering non-existent service', () => {
      const result = unregisterService('NonExistentService');
      expect(result).toBe(false);
    });

    it('should reset all services', () => {
      const service1 = new MockLegacyService();
      const service2 = new MockModernService();

      registerBusinessService(service1);
      registerBusinessService(service2);

      resetServices();

      const services = getRegisteredServices();
      expect(services).toHaveLength(0);

      expect(console.log).toHaveBeenCalledWith(
        'All business service registrations have been reset'
      );
    });
  });

  describe('Legacy Service Integration', () => {
    it('should handle legacy service through adapter', async () => {
      const mockHandler = jest
        .fn()
        .mockImplementation(async (data: CallAnalyzedData) => {
          console.log('Mock legacy handler called', data.call.call_id);
        });

      // Create a legacy service with mocked handler
      const legacyService: BusinessService = {
        name: 'TestLegacyService',
        initialize: jest.fn().mockResolvedValue(undefined),
        handleCallAnalyzed: mockHandler,
      };

      registerBusinessService(legacyService);
      await initializeBusinessServices();

      expect(legacyService.initialize).toHaveBeenCalled();
      // Check that the legacy service was properly handled
      const status = getServicesStatus();
      expect(status['TestLegacyService'].initialized).toBe(true);
      expect(status['TestLegacyService'].type).toBe('legacy');
    });
  });
});
