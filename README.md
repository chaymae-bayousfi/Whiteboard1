# CollabBoard — Real-Time Collaborative Whiteboard

A full-stack, production-ready collaborative whiteboard application built for a PFA internship. Users can create boards, draw shapes, add text, and collaborate in real time with live cursors and conflict-free synchronization.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, React Konva, React Router, Zustand, React Hook Form, Framer Motion, Lucide React |
| Realtime | Yjs, y-websocket |
| Backend | Node.js, Fastify |
| Database | PostgreSQL |
| ORM | Prisma |
| Pub/Sub | Redis |
| Snapshots | MinIO (S3-compatible) |
| Auth | Manual JWT (access + refresh tokens), bcrypt |
| Containers | Docker, Docker Compose |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Frontend    │────▶│  Backend API  │────▶│ PostgreSQL │
│  React+Vite  │     │  Fastify      │     │  (Prisma)  │
└─────────────┘     └──────┬───────┘     └────────────┘
       │                    │
       │  WebSocket          │ Pub/Sub
       ▼                    ▼
┌─────────────┐     ┌──────────────┐
│  y-websocket │     │    Redis     │
│  (Yjs sync)  │     │  (cursors)   │
└─────────────┘     └──────────────┘
                           │
                    ┌──────────────┐
                    │    MinIO      │
                    │  (snapshots)  │
                    └──────────────┘
```

The frontend communicates with the backend via REST APIs for auth, boards, and sharing. Real-time canvas synchronization uses Yjs documents synced over a y-websocket WebSocket connection. Redis pub/sub handles cross-process cursor and presence broadcasting. MinIO stores exported board JSON snapshots.

## Folder Structure

```
whiteboard/
├── apps/
│   ├── frontend/          # (project root - Vite frontend)
│   │   ├── src/
│   │   │   ├── components/   # Reusable UI, board, collaboration components
│   │   │   ├── constants/    # Colors, tool configs, canvas config
│   │   │   ├── hooks/        # useCanvas, useCollaboration, useKeyboardShortcuts
│   │   │   ├── layouts/      # MainLayout, AuthLayout, DashboardLayout, BoardLayout
│   │   │   ├── pages/        # Landing, Login, Register, Dashboard, Board, 404
│   │   │   ├── services/     # API services (auth, board, canvas, export)
│   │   │   ├── stores/        # Zustand stores (auth, board, canvas, tool, etc.)
│   │   │   ├── types/        # TypeScript domain types
│   │   │   └── utils/        # Helpers (canvas math, formatting, etc.)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   └── backend/
│       ├── prisma/
│       │   ├── schema.prisma       # Database schema (6 tables)
│       │   ├── seed.ts             # Demo data seeding
│       │   └── migrations/        # SQL migrations
│       ├── src/
│       │   ├── config/             # env, logger, prisma client
│       │   ├── middleware/        # JWT authentication
│       │   ├── routes/            # authRoutes, boardRoutes
│       │   ├── services/          # authService, boardService, redis, minio
│       │   ├── utils/             # JWT, bcrypt utilities
│       │   ├── ws/                 # y-websocket server with persistence
│       │   └── server.ts          # Fastify entry point
│       └── package.json
├── packages/
│   └── shared/               # Shared TypeScript types
│       └── src/index.ts
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── .env
├── .env.example
└── README.md
```

## Prerequisites

- **Node.js** v20 or later
- **Docker** and **Docker Compose**
- **PostgreSQL** 16+ (if running without Docker)
- **Redis** 7+ (if running without Docker)
- **MinIO** (if running without Docker)

### Installing Node.js

```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20

# Or download directly from https://nodejs.org/
```

## Quick Start with Docker Compose

The fastest way to run everything:

```bash
# Clone the project (or use your existing copy)
cd whiteboard

# Start all services (PostgreSQL, Redis, MinIO, Backend, Frontend)
docker compose -f docker/docker-compose.yml up --build

# In a separate terminal, run Prisma migrations and seed
docker exec -it whiteboard-backend npx prisma migrate deploy
docker exec -it whiteboard-backend npx prisma db seed
```

Access:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/v1
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)
- Yjs WebSocket: ws://localhost:4001/yjs

## Manual Setup (Without Docker)

### 1. Install Dependencies

```bash
# Frontend dependencies
npm install

# Backend dependencies
cd apps/backend
npm install
cd ../..

# Shared package (referenced via path alias, no install needed)
```

### 2. Configure Environment Variables

Frontend `.env` (project root):
```bash
# .env
VITE_API_URL=http://localhost:4000/api/v1
VITE_YJS_WS_URL=ws://localhost:4001/yjs
```

Backend `.env` (`apps/backend/.env`):
```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:
```env
PORT=4000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

DATABASE_URL=postgresql://whiteboard:whiteboard@localhost:5432/whiteboard?schema=public
REDIS_URL=redis://localhost:6379

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=whiteboard-snapshots
MINIO_USE_SSL=false

JWT_ACCESS_SECRET=your-super-secret-access-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

YJS_WS_PORT=4001
```

### 3. Configure PostgreSQL

```bash
#Étape 1 : Ouvrir psql
psql -U postgres
#Étape 2 : Créer l'utilisateur
CREATE USER whiteboard WITH PASSWORD 'whiteboard';
#Étape 3 : Créer la base
CREATE DATABASE whiteboard OWNER whiteboard;
#Étape 4 : Donner les droits
GRANT ALL PRIVILEGES ON DATABASE whiteboard TO whiteboard;
#Étape 5 : Quitter
\q
```

### 4. Configure Redis

```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Test connection
redis-cli ping
# Should return: PONG
```

### 5. Configure MinIO

```bash
# Using Docker (easiest)
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  minio/minio server /data --console-address ":9001"

# Or download the binary from https://min.io/download
```

### 6. Configure Prisma and Run Migrations

```bash
cd apps/backend

# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Seed the database with demo data
npx prisma db seed

# Open Prisma Studio (optional, GUI for database)
npx prisma studio
```

### 7. Start the Backend

```bash
cd apps/backend
npm run dev
```

The backend starts on:
- HTTP API: http://localhost:4000/api/v1
- Yjs WebSocket: ws://localhost:4001/yjs

### 8. Start the Frontend

```bash
# From project root
npm run dev
```

The frontend starts on http://localhost:5173

## Production container deployment

The production stack is defined in `docker/docker-compose.production.yml`. It builds the frontend as static files served by nginx and builds the backend as a Node.js production image. nginx proxies `/api/` to Fastify and upgrades `/yjs/` connections for WebSocket traffic.

Create a deployment environment file with strong, unique values for `DATABASE_URL`, `REDIS_URL`, `CLIENT_ORIGIN`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `MINIO_ACCESS_KEY`, and `MINIO_SECRET_KEY`. Then run:

```bash
docker compose --env-file .env.production -f docker/docker-compose.production.yml build
docker compose --env-file .env.production -f docker/docker-compose.production.yml up -d
```

Run `npx prisma migrate deploy` from `apps/backend` in the release job against the production `DATABASE_URL` before starting the new backend image. The production runtime image intentionally contains runtime dependencies only.

Put the stack behind a managed HTTPS load balancer or reverse proxy. Configure `VITE_YJS_WS_URL` as `wss://your-domain.example/yjs` and `CLIENT_ORIGIN` as the HTTPS frontend origin. A public hostname, TLS certificate, and hosting account are external deployment prerequisites and are not included in this repository.

## Testing

Run the available checks from the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

The backend tests cover permission resolution and Yjs convergence. Live PostgreSQL, Redis, MinIO, browser interaction, reconnection, and multi-user latency tests require the services to be running.

The current automated suite does not claim to replace live integration testing. Run the application stack and follow the two-browser checklist in the audit handoff before calling collaboration verified.

## Sharing and permissions

Owners can share boards by email with `view`, `edit`, or `admin` permission. Public board links are anonymous read-only links. Private boards require authentication and membership. Permission checks are applied in REST access checks and at the WebSocket Yjs update boundary.

## Synchronization design

See [DESIGN_CHOICES.md](DESIGN_CHOICES.md) for the Yjs document model, Awareness presence, Redis propagation, persistence, reconnection behavior, and known limitations. A sequence diagram for a collaborative edit should be added to the final project presentation materials; no deployed URL or demo video is included in this repository.

## Database Schema

Six tables as specified:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with email, name, bcrypt password hash |
| `boards` | Whiteboard boards owned by users |
| `board_members` | Many-to-many board sharing with permissions |
| `shapes` | Individual canvas elements per board |
| `snapshots` | MinIO snapshot references for board exports |
| `refresh_tokens` | JWT refresh tokens with revocation support |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login and receive tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |
| GET | `/api/v1/users/me` | Get current user (protected) |

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/boards` | List user's boards |
| POST | `/api/v1/boards` | Create a board |
| GET | `/api/v1/boards/:id` | Get a board |
| PATCH | `/api/v1/boards/:id` | Update board (title, description, visibility) |
| DELETE | `/api/v1/boards/:id` | Delete a board |
| GET | `/api/v1/boards/:id/shapes` | Get board shapes |
| POST | `/api/v1/boards/:id/share` | Share board with a user |
| PATCH | `/api/v1/boards/:id/members/:userId` | Update member permission |
| DELETE | `/api/v1/boards/:id/members/:userId` | Remove member |
| GET | `/api/v1/boards/:id/snapshots` | List snapshots |
| POST | `/api/v1/boards/:id/snapshots` | Save a snapshot |
| GET | `/api/v1/boards/:id/snapshots/:snapshotId` | Get snapshot data |

### WebSocket
| Endpoint | Description |
|----------|-------------|
| `ws://localhost:4001/yjs?board=<boardId>&token=<jwt>` | Yjs real-time sync |

## Testing Authentication

```bash
# Register a new user
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"password123"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the returned accessToken for protected routes
curl http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer <accessToken>"

# Create a board
curl -X POST http://localhost:4000/api/v1/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{"title":"My Board","description":"Test board"}'
```

Or use the seeded demo accounts:
- Email: `alice@example.com` — Password: `password123`
- Email: `bob@example.com` — Password: `password123`

## Testing Realtime Collaboration

### Open Two Browsers

1. Open http://localhost:5173 in two browser windows (or incognito + normal)
2. Register/login as different users in each window
3. In one window, create a board from the dashboard
4. Copy the board URL from the address bar
5. Share the board with the second user's email (using the Share button in the board editor)
6. Open the shared board URL in the second browser
7. Draw shapes — they should appear in real time on both screens
8. Move your mouse — the other user should see your cursor with your name

### Verify Synchronization

- Draw a rectangle in browser A → it appears in browser B
- Type text in browser A → it appears in browser B
- Delete a shape in browser A → it disappears from browser B
- Move a shape in browser A → it moves in browser B
- Close browser A and reopen → shapes persist (loaded from database)
- Disconnect network, draw, reconnect → changes sync automatically (offline editing + reconnection)

## Drawing Features

- **Infinite canvas** with pan and zoom
- **Tools**: Select, Pan, Rectangle, Ellipse, Line, Arrow, Freehand (Pencil), Text, Eraser
- **Undo / Redo** (Ctrl+Z / Ctrl+Shift+Z)
- **Export PNG** — download canvas as image
- **Export JSON** — download board state as JSON
- **Import JSON** — load a previously exported board
- **Keyboard shortcuts**:
  - `V` — Select tool
  - `H` — Pan tool
  - `R` — Rectangle
  - `O` — Ellipse
  - `L` — Line
  - `A` — Arrow
  - `P` — Pencil (freehand)
  - `T` — Text
  - `E` — Eraser
  - `Delete` / `Backspace` — Delete selected
  - `Escape` — Deselect
  - `Ctrl+Z` — Undo
  - `Ctrl+Shift+Z` — Redo

## Building for Production

```bash
# Build frontend
npm run build

# Build backend
cd apps/backend
npm run build

# Start backend in production mode
NODE_ENV=production npm start
```

The frontend build outputs to `dist/` and can be served by any static file server.

## Security Features

- **JWT authentication** with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
- **bcrypt** password hashing (salt rounds: 12)
- **Helmet** security headers
- **CORS** configured for the frontend origin
- **Rate limiting** (100 requests per minute per client)
- **Row-level authorization** on all board operations (owner/member checks)
- Refresh token rotation on each refresh
- Token revocation on logout

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 4000 | Backend HTTP port |
| `NODE_ENV` | development | Environment |
| `CLIENT_ORIGIN` | http://localhost:5173 | Frontend URL for CORS |
| `DATABASE_URL` | — | PostgreSQL connection string |
| `REDIS_URL` | — | Redis connection string |
| `MINIO_ENDPOINT` | localhost | MinIO server host |
| `MINIO_PORT` | 9000 | MinIO server port |
| `MINIO_ACCESS_KEY` | minioadmin | MinIO access key |
| `MINIO_SECRET_KEY` | minioadmin | MinIO secret key |
| `MINIO_BUCKET` | whiteboard-snapshots | MinIO bucket name |
| `MINIO_USE_SSL` | false | Use SSL for MinIO |
| `JWT_ACCESS_SECRET` | — | JWT access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | — | JWT refresh token secret (min 32 chars) |
| `JWT_ACCESS_EXPIRES` | 15m | Access token expiry |
| `JWT_REFRESH_EXPIRES` | 7d | Refresh token expiry |
| `YJS_WS_PORT` | 4001 | Yjs WebSocket port |
| `VITE_API_URL` | http://localhost:4000/api/v1 | Frontend API URL |
| `VITE_YJS_WS_URL` | ws://localhost:4001/yjs | Frontend Yjs WebSocket URL |

## Troubleshooting

### Database connection failed
Ensure PostgreSQL is running and `DATABASE_URL` is correct:
```bash
psql postgresql://whiteboard:whiteboard@localhost:5432/whiteboard
```

### Redis connection failed
Ensure Redis is running:
```bash
redis-cli ping
```

### MinIO bucket not created
The backend auto-creates the bucket on startup. If MinIO is not ready, start it first:
```bash
docker run -d -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
```

### Prisma migration error
Reset and re-run:
```bash
cd apps/backend
npx prisma migrate reset
```

### WebSocket not connecting
Check that the Yjs server is running on port 4001 and the JWT token is valid. The frontend connects to `ws://localhost:4001/yjs?board=<id>&token=<jwt>`.

## License

This project is built for a PFA (Projet de Fin d'Année) internship.
