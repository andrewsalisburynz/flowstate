# Build Instructions - Iteration 3

## Prerequisites

### Build Tools
- **Node.js**: 20.x or higher
- **npm**: 9.x or higher
- **AWS CDK CLI**: 2.x (`npm install -g aws-cdk`)
- **TypeScript**: 5.x (installed via npm)

### Dependencies
- AWS SDK v3 packages
- React 18
- Vite 5
- uuid library

### Environment Variables
- **AWS_PROFILE**: AWS CLI profile with deployment permissions (optional)
- **AWS_REGION**: Target AWS region (default: us-east-1)
- **CDK_DEFAULT_ACCOUNT**: AWS account ID
- **CDK_DEFAULT_REGION**: AWS region

### System Requirements
- **OS**: macOS, Linux, or Windows with WSL
- **Memory**: 4GB RAM minimum
- **Disk Space**: 2GB free space
- **Network**: Internet connection for npm packages and AWS deployment

---

## Build Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

**Expected Output**:
```
added [X] packages in [Y]s
```

**Verify**:
```bash
ls node_modules/@aws-sdk
# Should show: client-dynamodb, lib-dynamodb, client-bedrock-runtime, etc.
```

---

### 2. Build Backend

```bash
cd backend
npm run build
```

**Expected Output**:
```
Successfully compiled TypeScript
```

**Build Artifacts**:
- `backend/dist/` - Compiled JavaScript files
- `backend/dist/handlers/` - Lambda handler functions
- `backend/dist/services/` - Service layer modules
- `backend/dist/types/` - Type definitions

**Verify Build**:
```bash
ls backend/dist/handlers/
# Should show: cards.js, team-members.js, ai-bottleneck.js, ai-task.js, websocket.js
```

---

### 3. Install Infrastructure Dependencies

```bash
cd infrastructure
npm install
```

**Expected Output**:
```
added [X] packages in [Y]s
```

---

### 4. Build Infrastructure

```bash
cd infrastructure
npm run build
```

**Expected Output**:
```
Successfully compiled TypeScript
```

**Build Artifacts**:
- `infrastructure/lib/*.js` - Compiled CDK stack files
- `infrastructure/bin/*.js` - CDK app entry point

---

### 5. Synthesize CDK Stacks

```bash
cd infrastructure
cdk synth
```

**Expected Output**:
```
Successfully synthesized to infrastructure/cdk.out
```

**Build Artifacts**:
- `infrastructure/cdk.out/KanbanStorageStack.template.json`
- `infrastructure/cdk.out/KanbanApiStack.template.json`
- `infrastructure/cdk.out/FlowStateFrontendStack.template.json`

**Verify**:
```bash
cat infrastructure/cdk.out/KanbanStorageStack.template.json | grep TeamMembersTable
# Should show TeamMembersTable resource definition
```

---

### 6. Install Frontend Dependencies

```bash
cd frontend
npm install
```

**Expected Output**:
```
added [X] packages in [Y]s
```

---

### 7. Build Frontend

```bash
cd frontend
npm run build
```

**Expected Output**:
```
vite v5.x.x building for production...
✓ [X] modules transformed.
dist/index.html                   [size]
dist/assets/index-[hash].js       [size]
dist/assets/index-[hash].css      [size]
✓ built in [Y]s
```

**Build Artifacts**:
- `frontend/dist/` - Production build
- `frontend/dist/index.html` - Entry point
- `frontend/dist/assets/` - Bundled JS and CSS

**Verify Build**:
```bash
ls frontend/dist/
# Should show: index.html, assets/
```

---

## Verify Build Success

### Backend Verification

1. **Check compiled files exist**:
   ```bash
   test -f backend/dist/handlers/team-members.js && echo "✓ Team members handler built"
   test -f backend/dist/services/bottleneck-analysis.js && echo "✓ Bottleneck analysis service built"
   ```

2. **Check for compilation errors**:
   ```bash
   cd backend
   npm run build 2>&1 | grep -i error
   # Should return nothing (no errors)
   ```

### Infrastructure Verification

1. **Check CDK synthesis**:
   ```bash
   cd infrastructure
   cdk synth --quiet > /dev/null && echo "✓ CDK synthesis successful"
   ```

2. **Validate stack templates**:
   ```bash
   test -f infrastructure/cdk.out/KanbanStorageStack.template.json && echo "✓ Storage stack template exists"
   test -f infrastructure/cdk.out/KanbanApiStack.template.json && echo "✓ API stack template exists"
   ```

### Frontend Verification

1. **Check build output**:
   ```bash
   test -f frontend/dist/index.html && echo "✓ Frontend built successfully"
   test -d frontend/dist/assets && echo "✓ Assets bundled"
   ```

2. **Check for build errors**:
   ```bash
   cd frontend
   npm run build 2>&1 | grep -i error
   # Should return nothing (no errors)
   ```

---

## Common Warnings (Acceptable)

### Backend
- `ExperimentalWarning: stream/web is an experimental feature` - Safe to ignore
- Deprecation warnings from AWS SDK - Safe to ignore if using latest versions

### Infrastructure
- `[Warning] CDK version mismatch` - Ensure CDK CLI matches package version
- `[Warning] Bootstrap stack version` - Run `cdk bootstrap` if needed

### Frontend
- `(!) Some chunks are larger than 500 KiB` - Expected for React apps
- Source map warnings - Safe to ignore in production builds

---

## Troubleshooting

### Build Fails with "Cannot find module"

**Cause**: Missing dependencies or incorrect node_modules

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Build Fails with TypeScript Errors

**Cause**: Type mismatches or missing type definitions

**Solution**:
1. Check error message for specific file and line
2. Verify type definitions match between files
3. Ensure all imports are correct
4. Run `npm run build` again

### CDK Synth Fails with "Stack not found"

**Cause**: CDK app not properly configured

**Solution**:
```bash
cd infrastructure
npm run build
cdk synth --all
```

### Frontend Build Fails with "Out of memory"

**Cause**: Insufficient memory for Vite build

**Solution**:
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

---

## Build Time Estimates

- **Backend**: ~30 seconds
- **Infrastructure**: ~20 seconds
- **Frontend**: ~45 seconds
- **Total**: ~2 minutes

---

## Next Steps

After successful build:
1. Proceed to deployment (infrastructure first, then frontend)
2. Run integration tests
3. Verify all features work end-to-end
