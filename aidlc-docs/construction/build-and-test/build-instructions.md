# Build Instructions - Iteration 2

## Prerequisites

**Build Tools**:
- Node.js 20+ (LTS)
- npm 10+
- AWS CDK CLI (for infrastructure)

**Dependencies**:
- TypeScript 5.x
- React 18
- AWS SDK v3
- Vite 5.x

**Environment Variables**:
- `VITE_API_URL` - REST API endpoint (frontend)
- `VITE_WS_URL` - WebSocket API endpoint (frontend)
- AWS credentials configured (for CDK deployment)

**System Requirements**:
- OS: macOS, Linux, or Windows
- Memory: 4GB+ RAM
- Disk Space: 2GB+ free

---

## Build Steps

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

#### Infrastructure
```bash
cd infrastructure
npm install
```

### 2. Configure Environment

#### Frontend Environment
The frontend already has `.env.local` configured with API endpoints:
```bash
cd frontend
cat .env.local
# Should show:
# VITE_API_URL=https://xtv386hpgi.execute-api.ap-southeast-2.amazonaws.com/prod
# VITE_WS_URL=wss://a2ha2ia4wd.execute-api.ap-southeast-2.amazonaws.com/prod
```

#### AWS Credentials
Ensure AWS credentials are configured:
```bash
aws configure list
# Should show configured credentials
```

### 3. Build All Units

#### Backend Build
```bash
cd backend
npm run build
```

**Expected Output**:
- TypeScript compilation successful
- Compiled files in `backend/dist/`
- No type errors

#### Frontend Build
```bash
cd frontend
npm run build
```

**Expected Output**:
- Vite build successful
- Optimized bundle in `frontend/dist/`
- Asset files generated

#### Infrastructure Build
```bash
cd infrastructure
npm run build
```

**Expected Output**:
- TypeScript compilation successful
- CDK synthesized CloudFormation templates
- No CDK errors

### 4. Verify Build Success

#### Backend Verification
```bash
cd backend
ls -la dist/
# Should show compiled .js files matching src/ structure
```

**Build Artifacts**:
- `dist/handlers/*.js` - Lambda handler functions
- `dist/services/*.js` - Service layer
- `dist/types/*.js` - Type definitions

#### Frontend Verification
```bash
cd frontend
ls -la dist/
# Should show index.html, assets/, and optimized bundles
```

**Build Artifacts**:
- `dist/index.html` - Entry HTML
- `dist/assets/*.js` - JavaScript bundles
- `dist/assets/*.css` - Stylesheets
- `dist/favicon.svg` - Icon

#### Infrastructure Verification
```bash
cd infrastructure
ls -la cdk.out/
# Should show CloudFormation templates
```

**Build Artifacts**:
- `cdk.out/*.template.json` - CloudFormation templates
- `cdk.out/manifest.json` - CDK manifest

**Common Warnings** (Acceptable):
- Vite: "Some chunks are larger than 500 KiB" - Expected for React bundles
- TypeScript: Unused variable warnings in generated code

---

## Troubleshooting

### Build Fails with Dependency Errors

**Cause**: Missing or outdated dependencies

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Or use npm ci for clean install
npm ci
```

### Build Fails with TypeScript Compilation Errors

**Cause**: Type errors in code

**Solution**:
1. Check error output for specific file and line
2. Run type checking:
   ```bash
   npm run build
   # Review errors
   ```
3. Fix type errors in source files
4. Rebuild

### Build Fails with "Cannot find module" Errors

**Cause**: Missing imports or incorrect paths

**Solution**:
1. Verify import paths are correct
2. Check that imported files exist
3. Ensure TypeScript paths are configured in `tsconfig.json`

### Frontend Build Fails with Environment Variable Errors

**Cause**: Missing `.env.local` file

**Solution**:
```bash
cd frontend
cp .env.example .env.local
# Edit .env.local with correct API URLs
```

---

## Build Validation Checklist

- [ ] Backend compiles without errors
- [ ] Frontend builds successfully
- [ ] Infrastructure synthesizes CloudFormation templates
- [ ] All TypeScript type checks pass
- [ ] No critical warnings in build output
- [ ] Build artifacts generated in expected locations

---

## Next Steps

After successful build:
1. Proceed to Unit Test Execution
2. Run Integration Tests
3. Deploy to AWS (if needed)
