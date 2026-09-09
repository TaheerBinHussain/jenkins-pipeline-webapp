# CI/CD Pipeline — Implementation Summary

## Scenario
DevOps Engineer at a team that frequently releases updates to a Node.js web application.
Goal: eliminate deployment downtime and provide a safe release + rollback path.

## What Was Built

### Application
- Node.js/Express web server with `/health`, `/api/version`, `/api/message` endpoints
- Beautiful frontend dashboard showing live app status (polls `/health` every 5 seconds)
- Jest unit tests covering all endpoints with Supertest

### Pipeline (Jenkinsfile)
```
Checkout → Build → Test → Package → Docker Build → Docker Push → Deploy → Verify
                                                                            ↓ fail
                                                                         Rollback
```

### Docker
- Multi-stage Dockerfile: deps → builder (tests run here) → production (non-root)
- Images tagged as `yourdockerhubuser/devops-webapp:1.<BUILD_NUMBER>` + `:latest`
- Previous stable image tagged as `previous-stable` before each deploy
- Docker HEALTHCHECK built into image

### Deployment Flow
1. **Commit pushed** → Jenkins detects via poll/webhook
2. **Build** → `npm ci` installs exact dependencies
3. **Test** → Jest runs 4 tests, generates coverage
4. **Package** → `npm audit` checks for vulnerabilities
5. **Docker Build** → multi-stage image built and tagged
6. **Docker Push** → image pushed to Docker Hub registry
7. **Deploy** → old container stopped, new one started (rolling)
8. **Verify** → `/health` polled up to 6× over 30 seconds
   - ✅ Pass → pipeline marked SUCCESS
   - ❌ Fail → `post { failure {} }` restarts `previous-stable` image (rollback)

### Blue-Green Demo
- `docker-compose.yml` with `--profile blue` and `--profile green`
- Blue on port 8080 (stable), Green on port 8081 (new version)
- Switch traffic by updating port mapping once Green is healthy
- Rollback: `docker compose --profile green down`

### Rolling Deployment Demo
- Jenkins pipeline itself performs rolling: stop old → start new → verify
- Controlled failure test: set a bad image tag → verify fails → rollback auto-triggers

## Files Delivered
| File | Purpose |
|------|---------|
| `Jenkinsfile` | Pipeline as Code (8 stages) |
| `app/Dockerfile` | Multi-stage Docker build |
| `app/src/server.js` | Express application |
| `app/tests/server.test.js` | Jest unit tests |
| `app/public/index.html` | Frontend UI |
| `docker-compose.yml` | Blue-Green deployment |
| `docs/report.html` | PDF report (print from browser) |
| `docs/pipeline_architecture.png` | Architecture diagram |
| `README.md` | Setup & usage instructions |
