# Metadata Cache Hash Structure

## Overview

The metadata cache system has been redesigned to use Redis Hash structure for improved efficiency and simplified cache management. Instead of storing each user-agent combination as separate keys, we now use a single hash per user with agent IDs as fields.

## New Structure

### Before (Multiple Keys)
```
metadata:user123:agent456 -> {metadata_data}
metadata:user123:agent789 -> {metadata_data}
metadata:user123:default -> {metadata_data}
```

### After (Single Hash)
```
metadata:user123 -> {
  "agent456": {metadata_data},
  "agent789": {metadata_data}, 
  "default": {metadata_data}
}
```

## Benefits

1. **Simplified Cache Invalidation**: Delete entire user cache with single `DEL` command
2. **Atomic Operations**: All user data operations are atomic within the hash
3. **Efficient Queries**: Get all user agents with single `HGETALL` command
4. **Better Performance**: Fewer Redis keys means better memory usage and faster operations
5. **Easier Management**: One key per user simplifies monitoring and debugging

## API Changes

### Basic Operations

#### Get Agent Data
```typescript
// Get specific agent data
const data = await MetaDataCache.get(userId, agentId);

// Get default agent data
const data = await MetaDataCache.get(userId);
```

#### Set Agent Data
```typescript
// Set specific agent data
await MetaDataCache.set(userId, metadata, agentId, ttl);

// Set default agent data
await MetaDataCache.set(userId, metadata);
```

#### Cache Invalidation
```typescript
// Remove specific agent data
await MetaDataCache.invalidate(userId, agentId);

// Remove ALL user data (entire hash)
await MetaDataCache.invalidateAll(userId);
```

### New Methods

#### Get All Agent Data
```typescript
// Get all agents data for a user
const allAgents = await MetaDataCache.getAllAgents(userId);
// Returns: { "agent123": {data}, "agent456": {data}, "default": {data} }
```

#### Get Agent List
```typescript
// Get list of agent IDs for a user
const agentIds = await MetaDataCache.getAgentList(userId);
// Returns: ["agent123", "agent456", "default"]
```

#### Get Agent Count
```typescript
// Get number of agents cached for a user
const count = await MetaDataCache.getAgentCount(userId);
// Returns: 3
```

### Enhanced Statistics
```typescript
// Get enhanced stats with agent count
const stats = await MetaDataCache.getStats([userId1, userId2]);
// Returns: {
//   "user123": { exists: true, ttl: 600, agentCount: 3 },
//   "user456": { exists: false, ttl: -1, agentCount: 0 }
// }
```

## Redis Commands Used

| Operation | Redis Command | Description |
|-----------|---------------|-------------|
| Get agent data | `HGET key field` | Get specific agent metadata |
| Set agent data | `HSET key {field: value}` | Set specific agent metadata |
| Get all agents | `HGETALL key` | Get all agents for user |
| Remove agent | `HDEL key field` | Remove specific agent |
| Remove all | `DEL key` | Remove entire user cache |
| Check exists | `HEXISTS key field` | Check if agent exists |
| Get agent list | `HKEYS key` | Get all agent IDs |
| Get agent count | `HLEN key` | Get number of agents |
| Set TTL | `EXPIRE key seconds` | Set expiration for entire hash |

## Migration Considerations

### Data Structure
- **User Key**: `metadata:{userId}`
- **Agent Field**: `{agentId}` or `"default"`
- **TTL**: Applied to entire hash (all agents expire together)

### Backward Compatibility
The new implementation maintains the same public API, so existing code will continue to work without changes.

### Performance Impact
- **Faster cache invalidation**: Single `DEL` vs multiple `DEL` operations
- **Atomic user operations**: All user data operations are atomic
- **Better memory efficiency**: Fewer Redis keys
- **Improved query performance**: Single `HGETALL` to get all user data

## Usage Examples

### Basic Usage
```typescript
import { MetaDataCache } from '@/lib/metadata/cache';

// Set metadata for specific agent
await MetaDataCache.set('user123', metadataObject, 'agent456');

// Get metadata for specific agent
const metadata = await MetaDataCache.get('user123', 'agent456');

// Get all agents data for user
const allAgents = await MetaDataCache.getAllAgents('user123');

// Invalidate all user cache
await MetaDataCache.invalidateAll('user123');
```

### Cache Invalidation Integration
```typescript
// In cache invalidation middleware
export class CacheInvalidationMiddleware {
  private static async invalidateUserCache(userId: string): Promise<void> {
    try {
      // This now deletes the entire user hash with all agents
      await MetaDataCache.invalidateAll(userId);
      console.log(`Cache invalidated for user: ${userId}`);
    } catch (error) {
      console.error('Failed to invalidate user cache:', error);
    }
  }
}
```

### Monitoring and Debugging
```typescript
// Get comprehensive user cache statistics
const userIds = ['user1', 'user2', 'user3'];
const stats = await MetaDataCache.getStats(userIds);

stats.forEach(([userId, stat]) => {
  console.log(`User ${userId}:`, {
    cached: stat.exists,
    ttl: stat.ttl,
    agents: stat.agentCount
  });
});

// Get detailed agent information for a user
const agentList = await MetaDataCache.getAgentList('user123');
console.log('Cached agents:', agentList);

const allData = await MetaDataCache.getAllAgents('user123');
console.log('All cached data:', allData);
```

## Error Handling

The cache system includes robust error handling:

- Failed operations return `false` or `null` instead of throwing
- Errors are logged but don't break application flow
- Graceful degradation when Redis is unavailable

## Health Check

The health check now uses hash operations to verify functionality:

```typescript
const isHealthy = await MetaDataCache.healthCheck();
```

This test creates a temporary hash, sets/gets a value, and cleans up to verify all hash operations work correctly.

## Best Practices

1. **Use consistent agent IDs**: Maintain consistent naming for agent identifiers
2. **Handle null responses**: Always check for null returns from get operations
3. **Batch operations**: Use `getAllAgents()` when you need multiple agent data
4. **Monitor TTL**: All agents in a user hash expire together
5. **Validate before set**: Ensure metadata objects are valid before caching

## Troubleshooting

### Common Issues

1. **Missing agent data**: Check if the specific agent field exists with `exists()`
2. **Expired cache**: Verify TTL hasn't expired with `getTTL()`
3. **Empty results**: Use `getAgentCount()` to see if any agents are cached
4. **Performance issues**: Monitor hash sizes with `getStats()`

### Debug Commands

```typescript
// Debug user cache state
const userId = 'user123';
console.log('Exists:', await MetaDataCache.exists(userId));
console.log('TTL:', await MetaDataCache.getTTL(userId));
console.log('Agent count:', await MetaDataCache.getAgentCount(userId));
console.log('Agents:', await MetaDataCache.getAgentList(userId));
```

This new hash-based structure provides better performance, simpler management, and more atomic operations while maintaining backward compatibility with existing code.