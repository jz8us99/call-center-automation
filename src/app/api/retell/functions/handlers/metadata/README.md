# MetaData Module

This module provides a comprehensive metadata management system for clinic information including services, staff, schedules, and insurance.

## Module Structure

```
src/lib/metadata/
├── index.ts          # Unified exports
├── service.ts        # Main MetaDataService class
├── db-queries.ts     # Database query abstraction
├── aggregator.ts     # Data transformation and aggregation
├── cache.ts          # Vercel KV caching with HTTP headers
├── logger.ts         # Performance monitoring and logging
└── README.md         # This file
```

## Core Components

### MetaDataService (`service.ts`)
The main service class that orchestrates metadata retrieval with caching, error handling, and monitoring.

**Key Methods:**
- `getMetaData()` - Main metadata retrieval with caching
- `refreshMetaData()` - Cache invalidation and refresh
- `getDetailedServices()` - Extended service information with pricing
- `healthCheck()` - System health diagnostics

### MetaDataQueries (`db-queries.ts`)
Database query abstraction layer that handles all database operations.

**Key Methods:**
- `getBusinessProfile()` - Basic business information
- `getPrimaryLocation()` - Address and location data
- `getStaffMembers()` - Team information
- `getStaffServices()` - Staff-specific services
- `getBusinessServices()` - Business-level services
- `getAppointmentTypes()` - Bookable appointment types
- `getAcceptedInsurance()` - Insurance providers
- `getOfficeHours()` - Business operating hours
- `getAllMetaData()` - Parallel fetch of all data

### MetaDataAggregator (`aggregator.ts`)
Data transformation and aggregation logic that combines data from multiple sources.

**Key Methods:**
- `aggregateMetaData()` - Main aggregation method
- `generateDetailedServices()` - Detailed service information
- `validateMetaData()` - Data completeness validation

### MetaDataCache (`cache.ts`)
Vercel KV-based caching with HTTP headers for optimal performance.

**Key Methods:**
- `get()` / `set()` - Basic cache operations
- `invalidate()` / `invalidateAll()` - Cache invalidation
- `healthCheck()` - Cache connectivity testing

### MetaDataLogger (`logger.ts`)
Performance monitoring and logging system.

**Key Features:**
- Performance metrics tracking
- Error rate monitoring
- Cache hit/miss ratio analysis
- User-level statistics

## Usage

```typescript
import { MetaDataService } from '@/lib/metadata';

// Create service instance
const metaDataService = new MetaDataService(userId, agentId, supabaseClient);

// Get metadata with caching
const response = await metaDataService.getMetaData();

// Get detailed services
const detailedServices = await metaDataService.getDetailedServices();

// Health check
const health = await metaDataService.healthCheck();
```

## Database Schema

The module integrates with the following database tables:

- `business_profiles` - Basic business information
- `business_locations` - Address and location data
- `staff_members` - Team information
- `business_services` - Business-level services
- `staff_job_assignments` - Staff-specific services
- `job_types` - Service definitions
- `appointment_types` - Bookable appointment types
- `business_accepted_insurance` - Insurance providers
- `insurance_providers` - Insurance company details
- `office_hours` - Business operating hours

## Caching Strategy

- **Vercel KV**: 15-minute primary cache
- **HTTP Headers**: 3-5 minute browser/CDN cache
- **Cache Keys**: `metadata:${userId}:${agentId}`

## Performance Features

- Parallel database queries using `Promise.all`
- Intelligent data aggregation and deduplication
- Comprehensive error handling with fallback data
- Performance monitoring and alerting
- Serverless-optimized connection handling

## Error Handling

- Graceful degradation with fallback data
- Comprehensive logging of errors and warnings
- Health monitoring for proactive issue detection
- Retry mechanisms for transient failures

## Monitoring

The module provides comprehensive monitoring capabilities:

- Response time tracking
- Cache hit/miss ratios
- Database query performance
- Error rate monitoring
- Data completeness scoring

## Environment Requirements

- Vercel KV for caching
- Supabase for database operations
- Proper environment variables configured