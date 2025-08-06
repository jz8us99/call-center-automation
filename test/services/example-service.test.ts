/**
 * Unit tests for example business services
 */

import {
  CRMService,
  DentalAppointmentService,
  NotificationService,
} from '@/lib/services/example-service';
import {
  MessageType,
  CallAnalyzedData,
} from '@/lib/message-system/message-types';

describe('Business Services', () => {
  let crmService: CRMService;
  let dentalService: DentalAppointmentService;
  let notificationService: NotificationService;

  beforeEach(() => {
    crmService = new CRMService();
    dentalService = new DentalAppointmentService();
    notificationService = new NotificationService();
  });

  describe('CRMService', () => {
    it('should initialize successfully', async () => {
      await expect(crmService.initialize()).resolves.not.toThrow();
      expect(console.log).toHaveBeenCalledWith('Initializing CRM service...');
      expect(console.log).toHaveBeenCalledWith(
        'CRM service initialization completed'
      );
    });

    it('should handle call analyzed data', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          from_number: '+1234567890',
          call_analysis: {
            call_summary: 'Test call summary',
          },
        },
      };

      await crmService.handleCallAnalyzed!(testData);

      expect(console.log).toHaveBeenCalledWith(
        'CRM service processing call analysis: test-call-123'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Updating call record for customer +1234567890'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Call summary: Test call summary'
      );
    });

    it('should handle call without phone number', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            call_summary: 'Test call summary',
          },
        },
      };

      await crmService.handleCallAnalyzed!(testData);

      expect(console.log).toHaveBeenCalledWith(
        'CRM service processing call analysis: test-call-123'
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Updating call record')
      );
    });
  });

  describe('DentalAppointmentService', () => {
    it('should filter calls with appointment flag = 1', () => {
      const testDataWithAppointment: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            custom_analysis_data: {
              appointment_made_flag: 1,
            },
          },
        },
      };

      const testDataWithoutAppointment: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-456',
          call_type: 'inbound',
          call_analysis: {
            custom_analysis_data: {
              appointment_made_flag: 0,
            },
          },
        },
      };

      expect(dentalService.shouldHandle!(testDataWithAppointment)).toBe(true);
      expect(dentalService.shouldHandle!(testDataWithoutAppointment)).toBe(
        false
      );
    });

    it('should handle call with appointment data', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            custom_analysis_data: {
              appointment_made_flag: 1,
              appointment_date_time: '2023-12-01 14:00',
              reason_for_visit: 'Dental checkup',
            },
          },
        },
      };

      await dentalService.handleCallAnalyzed!(testData);

      expect(console.log).toHaveBeenCalledWith(
        'Dental appointment service processing call: test-call-123'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Creating dental appointment: time=2023-12-01 14:00, reason=Dental checkup'
      );
    });

    it('should handle call without custom analysis data', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {},
        },
      };

      await dentalService.handleCallAnalyzed!(testData);

      expect(console.log).toHaveBeenCalledWith(
        'Dental appointment service processing call: test-call-123'
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Creating dental appointment')
      );
    });
  });

  describe('NotificationService', () => {
    it('should initialize successfully', async () => {
      await expect(notificationService.initialize()).resolves.not.toThrow();
      expect(console.log).toHaveBeenCalledWith(
        'Initializing notification service...'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Notification service initialization completed'
      );
    });

    it('should send call summary notification', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user-123',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            call_summary: 'Test call summary',
          },
        },
      };

      await notificationService.handleCallAnalyzed!(testData);

      expect(console.log).toHaveBeenCalledWith(
        'Notification service processing call: test-call-123'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Sending call summary notification to user test-user-123'
      );
    });

    it('should send appointment confirmation when appointment flag is 1', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user-123',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            call_summary: 'Test call summary',
            custom_analysis_data: {
              appointment_made_flag: 1,
            },
          },
        },
      };

      await notificationService.handleCallAnalyzed!(testData);

      expect(console.log).toHaveBeenCalledWith(
        'Notification service processing call: test-call-123'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Sending call summary notification to user test-user-123'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Sending appointment confirmation email to user test-user-123'
      );
    });

    it('should not send appointment confirmation when appointment flag is 0', async () => {
      const testData: CallAnalyzedData = {
        type: MessageType.CALL_ANALYZED,
        timestamp: new Date(),
        userId: 'test-user-123',
        callLogId: 'test-call-log',
        call: {
          call_id: 'test-call-123',
          call_type: 'inbound',
          call_analysis: {
            call_summary: 'Test call summary',
            custom_analysis_data: {
              appointment_made_flag: 0,
            },
          },
        },
      };

      await notificationService.handleCallAnalyzed!(testData);

      expect(console.log).toHaveBeenCalledWith(
        'Notification service processing call: test-call-123'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Sending call summary notification to user test-user-123'
      );
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('appointment confirmation')
      );
    });
  });
});
