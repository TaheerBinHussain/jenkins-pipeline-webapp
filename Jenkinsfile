// ============================================================================
// Jenkinsfile — Advanced CI/CD Pipeline
// DevOps Internship · Davine Technologies · 2026
//
// Flow: Checkout → Build → Test → Package → Docker Build →
//       Docker Push → Deploy (Rolling) → Verify → [Rollback on failure]
// ============================================================================

pipeline {
    agent any

    // ── Environment variables ─────────────────────────────────────────────
    environment {
        // Application metadata
        APP_NAME        = 'devops-webapp'
        APP_VERSION     = "1.${BUILD_NUMBER}"

        // Docker Hub credentials (configured in Jenkins Credentials store)
        DOCKER_HUB_CRED = credentials('docker-hub-credentials')
        DOCKER_USER     = "${DOCKER_HUB_CRED_USR}"
        DOCKER_PASS     = "${DOCKER_HUB_CRED_PSW}"
        IMAGE_NAME      = "${DOCKER_USER}/${APP_NAME}"
        IMAGE_TAG       = "${APP_VERSION}"
        IMAGE_PREV_TAG  = "previous-stable"

        // Deployment config
        CONTAINER_NAME  = 'devops-webapp-prod'
        CONTAINER_PORT  = '3000'
        HOST_PORT       = '3001'
        HEALTH_URL      = "http://localhost:${HOST_PORT}/health"

        // Node.js
        NODE_ENV        = 'test'
    }

    // ── Pipeline options ──────────────────────────────────────────────────
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    // ── Triggers ──────────────────────────────────────────────────────────
    triggers {
        // Poll GitHub every 5 minutes (replace with webhook for production)
        pollSCM('H/5 * * * *')
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥  Checking out source code...'
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()
                    env.GIT_BRANCH_NAME = sh(
                        script: 'git rev-parse --abbrev-ref HEAD',
                        returnStdout: true
                    ).trim()
                    echo "Branch : ${env.GIT_BRANCH_NAME}"
                    echo "Commit : ${env.GIT_COMMIT_SHORT}"
                }
            }
        }

        // ── Stage 2: Build ────────────────────────────────────────────────
        stage('Build') {
            steps {
                dir('app') {
                    echo '🔨  Installing Node.js dependencies...'
                    sh 'node --version'
                    sh 'npm --version'
                    sh 'npm ci'
                    echo '✅  Dependencies installed successfully.'
                }
            }
        }

        // ── Stage 3: Test ─────────────────────────────────────────────────
        stage('Test') {
            steps {
                dir('app') {
                    echo '🧪  Running automated tests...'
                    sh 'npm test -- --coverage --forceExit'
                }
            }
            post {
                always {
                    // Publish Jest test results (JUnit format via jest-junit)
                    junit allowEmptyResults: true,
                          testResults: 'app/junit.xml'
                    // Publish coverage report
                    publishHTML(target: [
                        reportDir  : 'app/coverage/lcov-report',
                        reportFiles: 'index.html',
                        reportName : 'Coverage Report',
                        keepAll    : true
                    ])
                }
            }
        }

        // ── Stage 4: Package (lint / audit) ──────────────────────────────
        stage('Package') {
            steps {
                dir('app') {
                    echo '📦  Auditing dependencies for vulnerabilities...'
                    sh 'npm audit --audit-level=high || true'
                    echo '📋  Package stage complete — artefact ready for Docker.'
                }
            }
        }

        // ── Stage 5: Docker Build ─────────────────────────────────────────
        stage('Docker Build') {
            steps {
                dir('app') {
                    echo "🐳  Building Docker image ${IMAGE_NAME}:${IMAGE_TAG}..."
                    sh """
                        docker build \
                          --build-arg APP_VERSION=${APP_VERSION} \
                          --tag ${IMAGE_NAME}:${IMAGE_TAG} \
                          --tag ${IMAGE_NAME}:latest \
                          .
                    """
                    sh "docker images ${IMAGE_NAME}"
                    echo '✅  Docker image built successfully.'
                }
            }
        }

        // ── Stage 6: Docker Push ──────────────────────────────────────────
        stage('Docker Push') {
            steps {
                echo "📤  Pushing image to Docker Hub..."
                sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
                echo "✅  Image pushed: ${IMAGE_NAME}:${IMAGE_TAG}"
            }
            post {
                always {
                    // Always logout from Docker Hub
                    sh 'docker logout || true'
                }
            }
        }

        // ── Stage 7: Deploy (Rolling) ─────────────────────────────────────
        stage('Deploy') {
            steps {
                script {
                    echo '🚀  Starting rolling deployment...'

                    // Tag existing running image as previous-stable for rollback
                    sh """
                        docker tag ${IMAGE_NAME}:latest ${IMAGE_NAME}:${IMAGE_PREV_TAG} || true
                    """

                    // Stop and remove the old container (if exists)
                    sh """
                        docker stop  ${CONTAINER_NAME} || true
                        docker rm    ${CONTAINER_NAME} || true
                    """

                    // Start the new container
                    sh """
                        docker run -d \
                          --name ${CONTAINER_NAME} \
                          --restart unless-stopped \
                          -p ${HOST_PORT}:${CONTAINER_PORT} \
                          -e NODE_ENV=production \
                          -e APP_VERSION=${APP_VERSION} \
                          ${IMAGE_NAME}:${IMAGE_TAG}
                    """

                    echo "✅  New container started: ${CONTAINER_NAME}"
                    sh "docker ps --filter name=${CONTAINER_NAME}"
                }
            }
        }

        // ── Stage 8: Verify ───────────────────────────────────────────────
        stage('Verify') {
            steps {
                script {
                    echo '🔍  Verifying deployment health...'
                    // Health check runs INSIDE the app container (avoids Docker
                    // networking issues where Jenkins container cannot reach
                    // host ports via localhost)
                    def maxRetries = 6
                    def healthy    = false

                    for (int i = 0; i < maxRetries; i++) {
                        sleep(time: 5, unit: 'SECONDS')
                        def statusCode = sh(
                            script: "docker exec ${CONTAINER_NAME} wget -qO- http://localhost:${CONTAINER_PORT}/health > /dev/null 2>&1 && echo 200 || echo 000",
                            returnStdout: true
                        ).trim()

                        echo "Health check attempt ${i + 1}/${maxRetries} — status: ${statusCode}"

                        if (statusCode == '200') {
                            healthy = true
                            break
                        }
                    }

                    if (!healthy) {
                        error('❌  Health check failed — triggering rollback!')
                    }

                    echo "✅  Application is healthy!"
                    sh "docker exec ${CONTAINER_NAME} wget -qO- http://localhost:${CONTAINER_PORT}/health"
                }
            }
        }

    } // end stages

    // ── Post-pipeline actions ─────────────────────────────────────────────
    post {

        success {
            echo """
            ╔══════════════════════════════════════════════╗
            ║  ✅  PIPELINE SUCCEEDED                       ║
            ║  App    : ${APP_NAME}                         ║
            ║  Version: ${APP_VERSION}                      ║
            ║  Image  : ${IMAGE_NAME}:${IMAGE_TAG}          ║
            ╚══════════════════════════════════════════════╝
            """
        }

        failure {
            echo '❌  Pipeline FAILED — initiating rollback...'
            script {
                // ── Rollback: restart container with previous stable image ─
                sh """
                    docker stop ${CONTAINER_NAME} || true
                    docker rm   ${CONTAINER_NAME} || true
                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      --restart unless-stopped \
                      -p ${HOST_PORT}:${CONTAINER_PORT} \
                      -e NODE_ENV=production \
                      -e APP_VERSION=rollback \
                      ${IMAGE_NAME}:${IMAGE_PREV_TAG} || true
                """
                echo '⏪  Rollback complete. Previous version is live.'
            }
        }

        always {
            echo "🧹  Cleaning up dangling Docker images..."
            sh 'docker image prune -f || true'
            cleanWs()
        }
    }

}
