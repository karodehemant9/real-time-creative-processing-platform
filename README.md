# Real-Time Creative Processing Platform

A production-grade distributed asset processing platform built with Node.js.

This platform allows users to:

- Upload large creative assets (video/images/documents)
- Process them asynchronously
- Generate checksums
- Generate previews
- Compress files
- Extract metadata
- Persist processing state
- Track processing status in real time
- Monitor system health, metrics, memory, and queue states

Think of this as a simplified backend architecture inspired by:

- Canva
- Adobe
- Figma
- Dropbox

---

# Business Problem

Modern creative platforms process extremely large files.

If heavy operations like:

- checksum generation
- compression
- preview generation
- metadata extraction

are executed on the main Node.js thread:

- event loop blocks
- uploads become slow
- latency increases
- throughput drops

This platform solves that problem by combining:

- Node.js clustering
- worker threads
- child processes
- background queues
- persistent metadata storage
- frontend live status tracking

---

# Architecture

```text
                          CLIENT (React)

                               │
                               │ Upload
                               ▼

                    Clustered Upload API
                         (Node.js)

                               │
                               │ Streams + Buffers
                               ▼

                           BullMQ Queue
                             (Redis)

                               │
                               ▼

                     Background Job Workers

       ┌────────────────────────────────────────────────┐
       │                                                │
       ▼                                                ▼

  worker_threads                                  child_process

  SHA256 Checksum                                Preview Generation

       │                                                │
       └────────────────────────────────────────────────┘

                               │
                               ▼

                        Compression Pipeline
                          (Streams + zlib)

                               │
                               ▼

                      Metadata Extraction

                               │
                               ▼

                           MongoDB

                               │
                               ▼

                         React Frontend

                    Status + Progress Tracking


Monitoring Layer:

/health
/memory
/metrics
/admin
```

---

# Tech Stack

## Backend

- Node.js
- Express
- Cluster module
- worker_threads
- child_process
- Streams
- Buffers

## Queueing

- BullMQ
- Redis

## Database

- MongoDB
- Mongoose

## Monitoring

- Prometheus metrics
- Bull Board

## Frontend

- React
- Axios

---

# Folder Structure

```text
real-time-creative-processing-platform/

├── frontend/
│
├── services/
│   ├── upload-api/
│   ├── job-worker/
│   └── admin/
│
├── shared/
│   ├── db/
│   ├── queue/
│   ├── logger/
│   ├── metrics/
│   └── events/
│
├── uploads/
├── previews/
├── compressed/
├── processed/
│
├── docker-compose.yml
├── package.json
└── .env
```

---

# End-to-End Request Flow

## Step 1: Upload

Client uploads a file.

```http
POST /upload
```

Upload API:

- receives stream
- writes file incrementally
- avoids loading full file in memory

---

## Step 2: Queue

API creates:

- Mongo asset record
- BullMQ background job

Status:

```json
queued
```

---

## Step 3: Processing

Worker picks job.

### Phase 1

worker_threads:

- generates SHA256 checksum

### Phase 2

child_process:

- generates preview

### Phase 3

Streams:

- compresses file

### Phase 4

Filesystem:

- extracts metadata

Status:

```json
processing
```

---

## Step 4: Completion

Mongo record updated.

Status:

```json
completed
```

Frontend updates automatically.

---

# Reliability Patterns

## Idempotency

Same file is never processed twice.

Implemented using:

```text
processed/
```

markers.

---

## Retry

BullMQ automatic retries:

- exponential backoff
- transient failure recovery

---

## Graceful Shutdown

Workers close safely before process exit.

---

## Background Processing

CPU-heavy work never blocks event loop.

---

# Tradeoffs

## Why BullMQ over synchronous processing?

Because:

- uploads stay fast
- workers scale independently

Tradeoff:

- eventual consistency

---

## Why worker_threads?

Because:

- CPU tasks should not block event loop

Tradeoff:

- higher memory usage per worker

---

## Why child_process?

Because:

- real production systems use external tools
- FFmpeg/ImageMagick integration ready

Tradeoff:

- IPC overhead

---

# Scaling Considerations

Current scale:

Single machine.

Can scale horizontally by:

## API

Increase cluster workers.

## Queue Workers

Run multiple worker containers.

## Redis

Move to Redis Cluster.

## Mongo

Use replica sets/sharding.

## Files

Move from local disk to:

- AWS S3
- GCS
- CDN

---

# API Examples

---

## Upload Asset

```http
POST /upload
```

Response:

```json
{
  "assetId": "abc123"
}
```

---

## Get All Assets

```http
GET /assets
```

---

## Get Asset

```http
GET /assets/:id
```

---

## Delete Asset

```http
DELETE /assets/:id
```

---

## Health

```http
GET /health
```

---

## Memory

```http
GET /memory
```

---

## Metrics

```http
GET /metrics
```

---

# Local Setup

## Clone

```bash
git clone <repo>
```

---

## Install

```bash
npm install
```

Frontend:

```bash
cd frontend
npm install
```

---

## Start Infrastructure

```bash
docker compose up -d
```

Starts:

- Redis
- MongoDB

---

## Start Backend

```bash
npm run api
```

---

## Start Worker

```bash
npm run worker
```

---

## Start Admin Dashboard

```bash
npm run admin
```

---

## Start Frontend

```bash
cd frontend
npm start
```

---

# Monitoring

## Health

```text
http://localhost:3000/health
```

## Memory

```text
http://localhost:3000/memory
```

## Metrics

```text
http://localhost:3000/metrics
```

## Queue Dashboard

```text
http://localhost:4000/admin
```

---

# Screenshots

## Upload Dashboard

(Add screenshot here)

---

## Queue Monitoring

(Add screenshot here)

---

## Metrics Dashboard

(Add screenshot here)

---

# Interview Talking Points

This project demonstrates:

## Node.js Internals

- Event Loop
- Cluster
- worker_threads
- child_process
- Streams
- Buffers
- Backpressure

## Backend Engineering

- Async processing
- Queue orchestration
- Reliability
- Observability

## System Design

- CPU offloading
- Event-driven architecture
- Horizontal scaling

Interview one-liner:

> I built a real-time creative asset processing platform where uploads are handled through clustered Node.js APIs, CPU-heavy workloads are offloaded to worker threads, media processing runs asynchronously via BullMQ, metadata is persisted in MongoDB, and users track live processing through a React dashboard.

---

# Future Improvements

## Storage

Move to S3.

## Security

Add JWT auth.

## Realtime

Replace polling with WebSockets + Redis Pub/Sub.

## Processing

Integrate FFmpeg.

## Deployment

Kubernetes.

## Monitoring

Prometheus + Grafana.

## CI/CD

GitHub Actions.

---

# Author

Built for backend engineering interviews and production system design practice.
