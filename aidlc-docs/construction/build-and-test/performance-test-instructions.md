# Performance Test Instructions - Iteration 3

## Overview

**Status**: Performance testing is optional for this iteration given the 3-4 hour timeline and focus on delivery velocity.

**Recommendation**: Perform basic performance validation during integration testing. Comprehensive performance testing can be deferred to future iterations.

---

## Performance Requirements (Baseline)

### Response Time
- **Team Member CRUD**: < 500ms per operation
- **Card Assignment**: < 300ms per update
- **Bottleneck Analysis**: < 5 seconds per execution
- **WebSocket Message Delivery**: < 100ms

### Throughput
- **API Requests**: Support 10 requests/second (low traffic expected)
- **Concurrent Users**: Support 5-10 concurrent users
- **WebSocket Connections**: Support 10 concurrent connections

### Error Rate
- **Target**: < 1% error rate under normal load
- **Acceptable**: < 5% error rate under peak load

---

## Basic Performance Validation (Manual)

### Test 1: API Response Time

**Tool**: Browser DevTools Network tab

**Steps**:
1. Open DevTools → Network tab
2. Perform team member CRUD operations
3. Check response times in Network tab

**Expected**:
- GET /team-members: < 200ms
- POST /team-members: < 300ms
- PUT /team-members/{id}: < 300ms
- DELETE /team-members/{id}: < 400ms
- PUT /cards/{id} (with assignees): < 300ms

**Pass Criteria**: All operations complete within expected times

---

### Test 2: Bottleneck Analysis Performance

**Tool**: CloudWatch Logs

**Steps**:
1. Navigate to CloudWatch → Log Groups
2. Find `/aws/lambda/KanbanApiStack-AiBottleneckHandler*`
3. Check execution duration in logs

**Expected**:
- Execution time: < 5 seconds
- Memory usage: < 256 MB
- No timeout errors

**Pass Criteria**: Analysis completes within 5 seconds

---

### Test 3: WebSocket Latency

**Tool**: Browser DevTools Console

**Steps**:
1. Add console.log with timestamp when sending message
2. Add console.log with timestamp when receiving message
3. Calculate latency

**Expected**:
- Message delivery: < 100ms
- Connection stable (no disconnects)

**Pass Criteria**: Messages delivered within 100ms

---

## Advanced Performance Testing (Optional)

### Load Testing with Artillery

**Note**: Only perform if time permits and performance is critical

**Setup**:
```bash
npm install -g artillery
```

**Create Test Script** (`load-test.yml`):
```yaml
config:
  target: "https://your-api-url.execute-api.region.amazonaws.com"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Sustained load"
  defaults:
    headers:
      Content-Type: "application/json"

scenarios:
  - name: "Team member operations"
    flow:
      - get:
          url: "/team-members"
      - post:
          url: "/team-members"
          json:
            name: "Load Test User {{ $randomString() }}"
```

**Run Test**:
```bash
artillery run load-test.yml
```

**Expected Results**:
- Response time p95: < 500ms
- Response time p99: < 1000ms
- Error rate: < 1%
- Successful requests: > 99%

---

## Performance Optimization Recommendations

### If Response Times Are Slow

1. **DynamoDB**:
   - Verify PAY_PER_REQUEST billing mode is active
   - Check for hot partitions
   - Consider adding GSI for frequent queries

2. **Lambda**:
   - Increase memory allocation (more memory = more CPU)
   - Enable Lambda SnapStart (if using Java)
   - Reduce cold start impact with provisioned concurrency

3. **API Gateway**:
   - Enable caching for GET requests
   - Use regional endpoints (not edge-optimized) for lower latency

4. **Frontend**:
   - Enable CloudFront caching
   - Minimize bundle size
   - Use code splitting

### If Bottleneck Analysis Is Slow

1. **Optimize Queries**:
   - Reduce number of DynamoDB scans
   - Use batch operations where possible
   - Cache team member list

2. **Optimize Logic**:
   - Reduce complexity of workload calculations
   - Use efficient data structures
   - Minimize Bedrock API calls

3. **Increase Resources**:
   - Increase Lambda memory to 1024 MB
   - Increase Lambda timeout to 90 seconds

---

## Performance Monitoring

### CloudWatch Metrics to Monitor

**Lambda Metrics**:
- Duration (average, p95, p99)
- Invocations
- Errors
- Throttles
- Concurrent Executions

**DynamoDB Metrics**:
- ConsumedReadCapacityUnits
- ConsumedWriteCapacityUnits
- UserErrors
- SystemErrors
- SuccessfulRequestLatency

**API Gateway Metrics**:
- Count (requests)
- Latency (p50, p95, p99)
- 4XXError
- 5XXError

### Set Up CloudWatch Alarms

**Recommended Alarms**:
1. Lambda Duration > 5000ms (bottleneck analysis)
2. Lambda Errors > 5 in 5 minutes
3. API Gateway 5XXError > 10 in 5 minutes
4. DynamoDB UserErrors > 10 in 5 minutes

---

## Performance Test Results Template

```markdown
# Performance Test Results

## Test Environment
- **Date**: [Date]
- **Region**: [AWS Region]
- **Lambda Memory**: [MB]
- **Concurrent Users**: [Number]
- **Test Duration**: [Minutes]

## Results

### API Response Times
| Endpoint | p50 | p95 | p99 | Target | Status |
|----------|-----|-----|-----|--------|--------|
| GET /team-members | [ms] | [ms] | [ms] | <500ms | ✅/❌ |
| POST /team-members | [ms] | [ms] | [ms] | <500ms | ✅/❌ |
| PUT /cards/{id} | [ms] | [ms] | [ms] | <300ms | ✅/❌ |

### Bottleneck Analysis
- **Average Duration**: [seconds]
- **p95 Duration**: [seconds]
- **p99 Duration**: [seconds]
- **Target**: < 5 seconds
- **Status**: ✅/❌

### Error Rates
- **4XX Errors**: [%]
- **5XX Errors**: [%]
- **Target**: < 1%
- **Status**: ✅/❌

## Bottlenecks Identified
1. [Description]
2. [Description]

## Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

## Conclusion

For Iteration 3, basic performance validation during integration testing is sufficient. Comprehensive performance testing can be deferred to future iterations when:

1. User base grows significantly
2. Performance issues are reported
3. SLAs need to be established
4. Cost optimization is required

---

## Next Steps

1. Complete integration testing
2. Monitor CloudWatch metrics in production
3. Address any performance issues as they arise
4. Plan comprehensive performance testing for future iterations
