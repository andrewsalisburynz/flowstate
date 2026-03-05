# Build Instructions - Card Editing Feature

## Prerequisites

### Frontend
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Build Tool**: Vite 5.0.8

### Backend
- **Node.js**: 20.x (Lambda runtime)
- **AWS CDK**: 2.110.0
- **AWS CLI**: Configured with appropriate credentials

### Environment Variables
- `VITE_API_URL`: REST API endpoint (frontend)
- `VITE_WS_URL`: WebSocket API endpoint (frontend)
- `AWS_REGION`: AWS region (default: ap-southeast-2)
- `AWS_ACCOUNT_ID`: AWS account ID

### System Requirements
- **OS**: macOS, Linux, or Windows with WSL
- **Memory**: 4 GB minimum
- **Disk Space**: 2 GB free space

---

## Build Steps

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

**Expected Output**:
```
added X packages in Ys
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

**Expected Output**:
```
added X packages in Ys
```

### 3. Install Infrastructure Dependencies

```bash
cd infrastructure
npm install
```

**Expected Output**:
```
added X packages in Ys
```

### 4. Build Frontend

```bash
cd frontend
npm run build
```

**Expected Output**:
```
vite v5.0.8 building for production...
✓ X modules transformed.
dist/index.html                   X.XX kB
dist/assets/index-XXXXXXXX.css    X.XX kB
dist/assets/index-XXXXXXXX.js     XXX.XX kB
✓ built in Xs
```

**Build Artifacts**:
- `frontend/dist/index.html` - Main HTML file
- `frontend/dist/assets/*.css` - Compiled CSS
- `frontend/dist/assets/*.js` - Compiled JavaScript bundle

### 5. Build Backend

```bash
cd backend
npm run build
```

**Expected Output**:
```
> backend@1.0.0 build
> tsc

# No output means successful compilation
```

**Build Artifacts**:
- `backend/dist/**/*.js` - Compiled JavaScript from TypeScript
- `backend/dist/**/*.d.ts` - Type definition files

### 6. Build Infrastructure

```bash
cd infrastructure
npm run build
```

**Expected Output**:
```
> infrastructure@1.0.0 build
> tsc

# No output means successful compilation
```

**Build Artifacts**:
- `infrastructure/lib/**/*.js` - Compiled CDK stack definitions

### 7. Verify Build Success

**Check Frontend Build**:
```bash
ls -la frontend/dist/
```
Should see `index.html` and `assets/` directory

**Check Backend Build**:
```bash
ls -la backend/dist/
```
Should see compiled `.js` files matching source structure

**Check Infrastructure Build**:
```bash
ls -la infrastructure/lib/
```
Should see compiled CDK stack files

---

## Troubleshooting

### Build Fails with "Module not found" Error

**Cause**: Dependencies not installed or node_modules corrupted

**Solution**:
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Retry build
npm run build
```

### Frontend Build Fails with TypeScript Errors

**Cause**: Type errors in EditCardModal.tsx or App.tsx

**Solution**:
1. Check error messages for specific type issues
2. Verify Card interface matches between components
3. Ensure all imports are correct
4. Run TypeScript compiler directly to see all errors:
   ```bash
   npx tsc --noEmit
   ```

### Backend Build Fails with Compilation Errors

**Cause**: TypeScript compilation errors in cards.ts

**Solution**:
1. Check error messages for line numbers
2. Verify validation logic syntax
3. Ensure all types are imported correctly
4. Run TypeScript compiler with verbose output:
   ```bash
   npx tsc --noEmit --pretty
   ```

### Infrastructure Build Fails

**Cause**: CDK stack definition errors

**Solution**:
1. Verify CDK version matches package.json
2. Check for syntax errors in stack files
3. Ensure all constructs are imported correctly

### "Cannot find module" After Build

**Cause**: Missing dependencies or incorrect import paths

**Solution**:
1. Verify all dependencies are in package.json
2. Check import paths are relative or from node_modules
3. Ensure build output structure matches import expectations

---

## Build Verification Checklist

- [ ] Frontend dependencies installed successfully
- [ ] Backend dependencies installed successfully
- [ ] Infrastructure dependencies installed successfully
- [ ] Frontend builds without errors
- [ ] Backend builds without errors
- [ ] Infrastructure builds without errors
- [ ] Frontend dist/ directory contains index.html and assets
- [ ] Backend dist/ directory contains compiled JavaScript
- [ ] Infrastructure lib/ directory contains compiled stacks
- [ ] No TypeScript compilation errors
- [ ] No missing module errors

---

## Next Steps

After successful build:
1. Run unit tests (see unit-test-instructions.md)
2. Run integration tests (see integration-test-instructions.md)
3. Deploy to AWS (see deployment instructions)
4. Perform manual testing

---

## Common Warnings (Acceptable)

The following warnings can be safely ignored:

- **Frontend**: "Some chunks are larger than 500 kB" - Expected for React applications
- **Backend**: Deprecation warnings from AWS SDK - Will be addressed in future updates
- **Infrastructure**: "Bundling asset" messages - Normal CDK behavior

---

## Build Time Estimates

- **Frontend**: 10-30 seconds
- **Backend**: 5-15 seconds
- **Infrastructure**: 5-15 seconds
- **Total**: ~1 minute for clean build
