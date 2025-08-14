/**
 * MetaData Module - Unified Export
 *
 * This module provides a comprehensive metadata management system
 * for clinic information including services, staff, schedules, and insurance.
 */

// Main service
export { MetaDataService } from './service';

// Database queries
export {
  MetaDataQueries,
  type BusinessProfileData,
  type BusinessLocationData,
  type StaffMemberData,
  type StaffServiceData,
  type BusinessServiceData,
  type AppointmentTypeData,
  type InsuranceData,
  type OfficeHoursData,
} from './db-queries';

// Data aggregation
export { MetaDataAggregator } from './aggregator';

// Caching
export { MetaDataCache, HttpCacheHeaders } from './cache';

// Monitoring and logging
export {
  MetaDataLogger,
  MonitorPerformance,
  type MetaDataMetrics,
  type PerformanceMetrics,
} from './logger';
