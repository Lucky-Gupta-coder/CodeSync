# CodeSync

CodeSync is a collaborative developer workspace where teams can edit code, draw diagrams, chat, execute code, review sessions, and collaborate in real-time.

## Project Architecture

This repository is managed as a monorepo using **Turborepo** and **npm workspaces**.

### Repository Structure

```text
CodeSync/
├── apps/
│   ├── api/          # Express + TypeScript Backend
│   └── web/          # React 19 + TypeScript + Vite + Tailwind CSS v4 Frontend
├── packages/
│   ├── tsconfig/     # Shared TypeScript configurations
│   ├── eslint-config/# Shared ESLint configurations
│   ├── config/       # Global configuration constants
│   ├── types/        # Shared TypeScript interfaces & types
│   ├── validators/   # Shared Zod validation schemas
│   ├── utils/        # Shared utility functions
│   └── ui/           # Shared React UI component library
├── .github/          # GitHub Workflows (CI/CD)
├── docker-compose.yml# Multi-container local orchestration
└── turbo.json        # Turborepo task pipeline config
```

## Tech Stack

- **Monorepo**: Turborepo, npm workspaces
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Axios, React Hook Form, Zod, Vitest
- **Backend**: Express, TypeScript, MongoDB/Mongoose, Helmet, Morgan, Winston, CORS, Rate Limiter, Socket.IO, Jest, Supertest
- **Infrastructure**: Docker, Docker Compose, GitHub Actions, Husky, lint-staged, Commitlint, Prettier, ESLint

## Getting Started

### Prerequisites

- Node.js >= 22.20.0
- npm >= 10.9.3
- MongoDB (Running locally or via Docker Compose)

### Installation

1. Clone the repository and install dependencies from the root:

   ```bash
   npm install
   ```

2. Copy the environment files for applications and packages:
   - For backend: Copy `apps/api/.env.example` to `apps/api/.env`
   - For frontend: Copy `apps/web/.env.example` to `apps/web/.env`

3. Start the development servers (runs both api and web):
   ```bash
   npm run dev
   ```

### Other Scripts

- **Build all applications**: `npm run build`
- **Lint all files**: `npm run lint`
- **Format codebase**: `npm run format`
- **Run test suites**: `npm run test`

## Docker Deployment

To spin up the entire application stack including a local MongoDB database:

```bash
docker compose up --build
```

The services will be available at:

- Web Client: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017/codesync`

## Sprint Progress

### Sprint 1.1: Authentication Registration

- **Status**: Completed
- **Features**:
  - Secure User Model Mongoose Schema
  - Argon2 Password Encryption
  - Zod Registration Request Validation
  - Slim Controller/Service registration flows
  - Jest & Supertest Integration Tests

### Sprint 1.2A: Backend Authentication

- **Status**: Completed
- **Features**:
  - Secure Login with credentials verification using Argon2
  - Modern JWT signing and verification using `jose` library
  - Authentication middleware checking Bearer headers
  - Declaration merging for typed Express requests context (`req.user`)
  - Whitelist-based role authorization guard foundation (`authorize`)
  - User session endpoints (`GET /api/auth/me`)
  - Jest & Supertest authentication integration test coverage

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
