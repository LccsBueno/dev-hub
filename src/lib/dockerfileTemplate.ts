import type { ProjectConfig } from '../types'

export function generateDockerfileTemplate(project: ProjectConfig): string {
  const port = project.inferredPort

  switch (project.framework) {
    case 'nestjs':
      return `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE ${port}\nCMD ["node", "dist/main.js"]\n`

    case 'nextjs':
      return `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\nEXPOSE ${port}\nCMD ["npm", "start"]\n`

    case 'vite-react':
      return `FROM node:20-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:1.25-alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n`

    case 'express':
    case 'fastify':
    case 'node':
      return `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --omit=dev\nCOPY . .\nEXPOSE ${port}\nCMD ["npm", "start"]\n`

    case 'fastapi': {
      const fastapiPort = port || 8000
      return `FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE ${fastapiPort}\nCMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "${fastapiPort}"]\n`
    }

    case 'django':
      return `FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE ${port}\nCMD ["python", "manage.py", "runserver", "0.0.0.0:${port}"]\n`

    case 'flask':
    case 'python':
      return `FROM python:3.12-slim\nWORKDIR /app\nCOPY requirements.txt ./\nRUN pip install --no-cache-dir -r requirements.txt\nCOPY . .\nEXPOSE ${port}\nCMD ["python", "app.py"]\n`

    case 'spring-boot':
    case 'maven':
      return `FROM maven:3.9-eclipse-temurin-21 AS build\nWORKDIR /app\nCOPY . .\nRUN mvn clean package -DskipTests\n\nFROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\nCOPY --from=build /app/target/*.jar app.jar\nEXPOSE ${port}\nCMD ["java", "-jar", "app.jar"]\n`

    case 'gradle':
      return `FROM gradle:8-jdk21 AS build\nWORKDIR /app\nCOPY . .\nRUN gradle build -x test --no-daemon\n\nFROM eclipse-temurin:21-jre-alpine\nWORKDIR /app\nCOPY --from=build /app/build/libs/*.jar app.jar\nEXPOSE ${port}\nCMD ["java", "-jar", "app.jar"]\n`

    case 'go':
      return `FROM golang:1.22-alpine AS build\nWORKDIR /app\nCOPY . .\nRUN go build -o app .\n\nFROM alpine:latest\nWORKDIR /app\nCOPY --from=build /app/app .\nEXPOSE ${port}\nCMD ["./app"]\n`

    case 'rust':
      return `FROM rust:1.79 AS build\nWORKDIR /app\nCOPY . .\nRUN cargo build --release\n\nFROM debian:bookworm-slim\nWORKDIR /app\nCOPY --from=build /app/target/release/app .\nEXPOSE ${port}\nCMD ["./app"]\n`

    default:
      return `FROM alpine:latest\nWORKDIR /app\nCOPY . .\nEXPOSE ${port}\nCMD ["echo", "defina os passos de build para essa stack"]\n`
  }
}
