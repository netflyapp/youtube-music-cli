# Plan: Add Node.js Production Build Support

## Goal

Enable Node.js users to run `@involvex/youtube-music-cli` without installing Bun by adding a `--target node` build variant alongside the existing Bun build.

---

## Key Insight

**The source code is already 100% Node.js compatible.** All runtime imports use standard `node:*` APIs. The Bun dependency exists only in:

1. Build toolchain (`bun build --target bun`)
2. Runtime shebang (injected by build)
3. Plugin installer calls (`execSync('bun install')`)
4. Documentation

---

## Implementation Plan

### Phase 1: Build Infrastructure

#### 1.1 Update `package.json`

- **Add** `"build:node"` script: `bun build source/cli.tsx --outfile dist/source/cli.js --target node --footer "..." --production`
- **Add** `"start:node"` script: `node dist/source/cli.js`
- **Update** `engines` field: change from `"bun": ">=1.0"` to `"node": ">=18.0"` (keep bun for dev)
- **Move** `@types/bun` and `bun-types` from `dependencies` to `devDependencies`
- **Add** `package-lock.json` generation (npm)

#### 1.2 Verify Build Works

- Run `bun run build:node`
- Verify output (`dist/source/cli.js`) has `#!/usr/bin/env node` shebang
- Verify no `import.meta.require` or bun-specific code in output
- Test: `node dist/source/cli.js --help`

### Phase 2: Runtime Compatibility

#### 2.1 Plugin Installer Services

**Files to modify:**

- `source/services/plugin/plugin-installer.service.ts` (lines 86, 184)
- `source/services/plugin/plugin-updater.service.ts` (line 184)

**Change:** Replace `execSync('bun install', ...)` with package manager detection:

```typescript
const packageManager = process.env.BUN_INSTALL ? 'bun' : 'npm';
execSync(`${packageManager} install`, ...);
```

#### 2.2 Install Scripts

**Files to modify:**

- `scripts/install.sh`
- `scripts/install.ps1`

**Logic:**

1. Check for `bun` → use `bun install -g` (recommended)
2. Else check for `node`/`npm` → use `npm install -g`
3. Else error with clear message

#### 2.3 CLI Entry Point (`source/cli.tsx`)

- **Line 1:** Already `#!/usr/bin/env node` — no change needed
- **Bun globals** (`Bun.isStandalone`, `process.isStandaloneExecutable`): Already safely guarded with optional chaining — no change needed

### Phase 3: Documentation

#### 3.1 Update `readme.md`

- Add **Node.js** as a primary installation option (equal to Bun)
- Remove "bun is required at runtime" note
- Add: "Node.js 18+ is required to run the CLI"
- Update installation sections:

  ````markdown
  ## Installation

  ### Node.js (Recommended)

  ```bash
  npm install -g @involvex/youtube-music-cli
  ```
  ````

  ### Bun

  ```bash
  bun install -g @involvex/youtube-music-cli
  ```

  ```

  ```

- Update "From Source" section with both npm and bun commands
- Update Contributing section

#### 3.2 Update `docs/getting-started.md`

- Similar documentation updates

### Phase 4: Testing & Validation

#### 4.1 Build Testing

- Test `bun run build:node` produces valid Node.js output
- Test `bun run build` still works (backward compatibility)
- Test `node dist/source/cli.js --help` works
- Test `node dist/source/cli.js search "test"` works

#### 4.2 Install Script Testing

- Test `scripts/install.sh` with bun available
- Test `scripts/install.sh` without bun, with node available
- Test `scripts/install.ps1` same scenarios

#### 4.3 Runtime Testing

- Verify all CLI subcommands work: `play`, `search`, `playlist`, `pause`, `resume`, `skip`, `back`
- Verify plugin installation uses correct package manager

---

## Files to Modify

| File                                                 | Changes                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `package.json`                                       | Add `build:node`, `start:node` scripts; update `engines`; move bun types to devDeps |
| `scripts/install.sh`                                 | Add npm fallback when bun unavailable                                               |
| `scripts/install.ps1`                                | Add npm fallback when bun unavailable                                               |
| `source/services/plugin/plugin-installer.service.ts` | Detect package manager instead of hardcoding `bun install`                          |
| `source/services/plugin/plugin-updater.service.ts`   | Same as above                                                                       |
| `readme.md`                                          | Update installation docs for Node.js support                                        |
| `docs/getting-started.md`                            | Update installation docs                                                            |

---

## Verification Steps

1. **Build verification:**

   ```bash
   bun run build:node
   node dist/source/cli.js --help
   ```

2. **Shebang verification:**

   ```bash
   head -1 dist/source/cli.js
   # Should show: #!/usr/bin/env node
   ```

3. **No bun-specific code verification:**

   ```bash
   grep -n "import.meta.require\|Bun\." dist/source/cli.js
   # Should return empty
   ```

4. **Install script verification:**

   ```bash
   # Test with node only (no bun)
   bash scripts/install.sh
   ```

5. **Runtime verification:**
   ```bash
   node dist/source/cli.js search "test"
   node dist/source/cli.js --version
   ```

---

## Risk Assessment

| Risk                                              | Mitigation                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------- |
| Some deps might have bun-specific behavior        | All deps are Node.js compatible (ink, react, meow, ws, ytdl-core) |
| Plugin installer fails with npm                   | Test plugin installation with both package managers               |
| `import.meta.url` issues in Node                  | Already uses `fileURLToPath()` — standard ESM pattern             |
| Build output differences between bun/node targets | Test both builds produce functionally equivalent output           |

---

## Success Criteria

- [ ] `bun run build:node` produces working Node.js output
- [ ] `node dist/source/cli.js --help` works without bun
- [ ] Install scripts work with node+npm (no bun required)
- [ ] Plugin installer detects package manager correctly
- [ ] Documentation reflects Node.js as primary installation method
- [ ] All existing bun-based workflows still work (backward compatible)
