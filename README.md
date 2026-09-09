# DevOps WebApp — CI/CD Pipeline Project

> **Davine Technologies · DevOps Internship 2026**

A Node.js/Express web application demonstrating a complete CI/CD pipeline with Jenkins, Docker, Blue-Green and Rolling deployment strategies.

## 🏗️ Architecture

```
GitHub Push
    │
    ▼
Jenkins Webhook/Poll
    │
    ├─ Stage 1: Checkout     — git clone / checkout
    ├─ Stage 2: Build        — npm ci
    ├─ Stage 3: Test         — Jest unit tests + coverage
    ├─ Stage 4: Package      — npm audit
    ├─ Stage 5: Docker Build — multi-stage image build
    ├─ Stage 6: Docker Push  — push to Docker Hub
    ├─ Stage 7: Deploy       — rolling container restart
    └─ Stage 8: Verify       — /health check (auto-rollback on failure)
```

## 🚀 Quick Start

### Run locally
```bash
cd app
npm install
npm start
# Open http://localhost:3000
```

### Run tests
```bash
cd app
npm test
```

### Build Docker image
```bash
cd app
docker build -t devops-webapp:1.0 .
docker run -d -p 8080:3000 --name webapp devops-webapp:1.0
# Open http://localhost:8080
```

### Blue-Green deployment
```bash
# Start blue (stable)
IMAGE_NAME=yourdockerhubuser/devops-webapp BLUE_TAG=1.0 \
  docker compose --profile blue up -d

# Start green (new version) in parallel
IMAGE_NAME=yourdockerhubuser/devops-webapp GREEN_TAG=1.1 \
  docker compose --profile green up -d

# Verify green, then switch traffic (update port mapping)
# Roll back: stop green, traffic stays on blue
docker compose --profile green down
```

## 📁 Project Structure

```
devops-cicd-project/
├── Jenkinsfile              ← Pipeline as Code
├── docker-compose.yml       ← Blue-Green deployment helper
├── .gitignore
├── README.md
└── app/
    ├── Dockerfile           ← Multi-stage Docker build
    ├── .dockerignore
    ├── package.json
    ├── src/
    │   └── server.js        ← Express application
    ├── public/
    │   └── index.html       ← Frontend UI
    └── tests/
        └── server.test.js   ← Jest unit tests
```

## 🔧 Jenkins Setup

1. Install Jenkins locally or on a cloud VM
2. Install plugins: **Pipeline**, **Git**, **Docker Pipeline**, **HTML Publisher**
3. Add credentials:
   - ID `docker-hub-credentials` → Docker Hub username + password/token
4. Create a **Pipeline** job and point it to this repository
5. Enable **Poll SCM** or configure a webhook

## 🌐 API Endpoints

| Method | Endpoint       | Description              |
|--------|----------------|--------------------------|
| GET    | `/`            | Frontend UI              |
| GET    | `/health`      | Health check (JSON)      |
| GET    | `/api/version` | App version info (JSON)  |
| GET    | `/api/message` | Greeting message (JSON)  |

## 📜 License

MIT — Davine Technologies Internship Project 2026
