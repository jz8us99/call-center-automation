/**
 * Unit tests for MessageDispatcher
 */

import { MessageDispatcher } from '@/lib/message-system/message-dispatcher';
import {
  MessageType,
  CallAnalyzedData,
} from '@/lib/message-system/message-types';

describe('MessageDispatcher', () => {
  let dispatcher: MessageDispatcher;

  beforeEach(() => {
    // Create a fresh instance for each test
    dispatcher = MessageDispatcher.getInstance({ verbose: false });
    dispatcher.clear();
  });

  afterEach(() => {
    dispatcher.clear();
  });

  describe('Service Registration', () => {
    it('should register a service successfully', () => {
      const serviceName = 'TestService';
      const capabilities = { businessTypes: ['test'], global: false };

      const registration = dispatcher.registerService(
        serviceName,
        capabilities
      );

      expect(registration.name).toBe(serviceName);
      expect(registration.capabilities).toEqual(capabilities);
      expect(registration.errorCount).toBe(0);
    });

    it('should warn when registering duplicate service', () => {
      const serviceName = 'TestService';
      const consoleWarnSpy = jest.spyOn(console, 'warn');

      dispatcher.registerService(serviceName);
      dispatcher.registerService(serviceName); // Duplicate

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestService')
      );
    });
  });

  describe('Message Subscription', () => {
    it('should subscribe to message types', () => {
      const serviceName = 'TestService';
      const handler = jest.fn();

      dispatcher.registerService(serviceName);
      dispatcher.subscribe(serviceName, MessageType.CALL_ANALYZED, handler);

      expect(() => {
        dispatcher.subscribe(serviceName, MessageType.CALL_ANALYZED, handler);
      }).not.toThrow();
    });

    it('should throw error when subscribing unregistered service', () => {
      const handler = jest.fn();

      expect(() => {
        dispatcher.subscribe(
          'UnregisteredService',
          MessageType.CALL_ANALYZED,
          handler
        );
      }).toThrow('Service UnregisteredService not registered');
    });
  });

  describe('Message Dispatch', () => {
    it('should dispatch message to matching handlers', async () => {
      const serviceName = 'TestService';
      const handler = jest.fn().mockResolvedValue(undefined);
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            business_type: 'dental',
            call_summary: 'Test call summary',
          },
        },
      };

      dispatcher.registerService(serviceName, { businessTypes: ['dental'] });
      dispatcher.subscribe(serviceName, MessageType.CALL_ANALYZED, {
        name: 'testHandler',
        handler,
      });

      const result = await dispatcher.dispatch(
        MessageType.CALL_ANALYZED,
        testData
      );

      expect(result.success).toBe(true);
      expect(result.handlerResults).toHaveLength(1);
      expect(result.handlerResults?.[0].success).toBe(true);
      expect(handler).toHaveBeenCalledWith(testData);
    });

    it('should filter messages based on business type', async () => {
      const dentalHandler = jest.fn().mockResolvedValue(undefined);
      const legalHandler = jest.fn().mockResolvedValue(undefined);

      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            business_type: 'dental',
            call_summary: 'Test call summary',
          },
        },
      };

      // Register dental service
      dispatcher.registerService('DentalService', {
        businessTypes: ['dental'],
      });
      dispatcher.subscribe(
        'DentalService',
        MessageType.CALL_ANALYZED,
        dentalHandler
      );

      // Register legal service
      dispatcher.registerService('LegalService', { businessTypes: ['legal'] });
      dispatcher.subscribe(
        'LegalService',
        MessageType.CALL_ANALYZED,
        legalHandler
      );

      await dispatcher.dispatch(MessageType.CALL_ANALYZED, testData);

      expect(dentalHandler).toHaveBeenCalled();
      expect(legalHandler).not.toHaveBeenCalled();
    });

    it('should call shouldHandle filter when provided', async () => {
      const handler = jest.fn().mockResolvedValue(undefined);
      const shouldHandle = jest.fn().mockReturnValue(false);

      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            business_type: 'dental',
            call_summary: 'Test call summary',
          },
        },
      };

      dispatcher.registerService('TestService', { businessTypes: ['dental'] });
      dispatcher.subscribe('TestService', MessageType.CALL_ANALYZED, {
        name: 'testHandler',
        handler,
        shouldHandle,
      });

      await dispatcher.dispatch(MessageType.CALL_ANALYZED, testData);

      expect(shouldHandle).toHaveBeenCalledWith(testData);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const failingHandler = jest
        .fn()
        .mockRejectedValue(new Error('Handler error'));
      const workingHandler = jest.fn().mockResolvedValue(undefined);

      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
        },
      };

      dispatcher.registerService('FailingService', { global: true });
      dispatcher.subscribe(
        'FailingService',
        MessageType.CALL_ANALYZED,
        failingHandler
      );

      dispatcher.registerService('WorkingService', { global: true });
      dispatcher.subscribe(
        'WorkingService',
        MessageType.CALL_ANALYZED,
        workingHandler
      );

      const result = await dispatcher.dispatch(
        MessageType.CALL_ANALYZED,
        testData
      );

      expect(result.success).toBe(true); // Still successful because one handler worked
      expect(result.handlerResults).toHaveLength(2);
      expect(result.handlerResults?.[0].success).toBe(false);
      expect(result.handlerResults?.[1].success).toBe(true);
      expect(failingHandler).toHaveBeenCalled();
      expect(workingHandler).toHaveBeenCalled();
    });

    it('should return empty result when no handlers found', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
        },
      };

      const result = await dispatcher.dispatch(
        MessageType.CALL_ANALYZED,
        testData
      );

      expect(result.success).toBe(true);
      expect(result.handlerResults).toHaveLength(0);
    });
  });

  describe('Global Handlers', () => {
    it('should process global handlers', async () => {
      const globalHandler = jest.fn().mockResolvedValue(undefined);
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
        },
      };

      dispatcher.subscribeGlobal(MessageType.CALL_ANALYZED, {
        name: 'globalHandler',
        handler: globalHandler,
      });

      const result = await dispatcher.dispatch(
        MessageType.CALL_ANALYZED,
        testData
      );

      expect(result.success).toBe(true);
      expect(globalHandler).toHaveBeenCalledWith(testData);
    });
  });

  describe('Service Management', () => {
    it('should get service statistics', () => {
      const serviceName = 'TestService';
      dispatcher.registerService(serviceName, { businessTypes: ['test'] });
      dispatcher.subscribe(serviceName, MessageType.CALL_ANALYZED, jest.fn());

      const stats = dispatcher.getServiceStats();

      expect(stats[serviceName]).toBeDefined();
      expect(stats[serviceName].name).toBe(serviceName);
      expect(stats[serviceName].messageTypes).toContain('call.analyzed');
      expect(stats[serviceName].errorCount).toBe(0);
    });

    it('should unregister service', () => {
      const serviceName = 'TestService';
      dispatcher.registerService(serviceName);

      const result = dispatcher.unregisterService(serviceName);

      expect(result).toBe(true);

      const stats = dispatcher.getServiceStats();
      expect(stats[serviceName]).toBeUndefined();
    });

    it('should return false when unregistering non-existent service', () => {
      const result = dispatcher.unregisterService('NonExistentService');
      expect(result).toBe(false);
    });
  });
});
