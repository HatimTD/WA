# ICA Case Study Builder

## Deployment Workflow

### Remotes
- `origin` → HatimTD/WA (GitHub, dev repo)
- `client` → git@94.125.109.147:case-study-builder (production server)

### GitHub Accounts
- `HatimTD` — main dev account, used for origin
- `avolship-Hatim` — client account, used for pushing to client server (case-sensitive!)

### Deploy Steps
1. Commit on `FinalClean` branch — author: `Hatim <avolship@gmail.com>`, NO Claude attribution
   ```bash
   git -c user.name="Hatim" -c user.email="avolship@gmail.com" commit -am "patch: description"
   ```
2. Push to origin: `git push origin FinalClean` (pull --rebase if behind)
3. Switch account: `gh auth switch --user avolship-Hatim`
4. Push to client: `git push client FinalClean:main`
   - If rejected: `git fetch client && git rebase client/main` then push again
   - NEVER force push to client — server blocks it
5. Switch back: `gh auth switch --user HatimTD`
6. Sync origin if rebased: `git push origin FinalClean --force`

### Commit Conventions
- `patch:` for fixes and patches
- `feat:` for new features
- Never include Co-Authored-By: Claude on commits going to client

## Known Issues (Pending Fix)

### Master List Integration
- Master list is partially connected to workflows (only Industry + WearType)
- Business Type, Job Type, Products are hardcoded — master list changes have no effect
- Combination wear type hardcoded-excluded in step-three.tsx
- Inconsistent fallback lists between step-three.tsx and wear-type-progress-bar.tsx
- Values stored as plain strings (not FK to master list) — delete doesn't cascade

### SAML SSO
- Pending implementation — needs Google SAML certificate from IT manager
- See memory/project_saml_sso.md for full plan
