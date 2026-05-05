<p align="center">
  <a href="https://events.decentraland.org">
    <img alt="Decentraland" src="https://decentraland.org/images/logo.png" width="60" />
  </a>
</p>
<h1 align="center">
  Community Events
</h1>

[![Coverage Status](https://coveralls.io/repos/github/decentraland/events/badge.svg)](https://coveralls.io/github/decentraland/events)

The Community Events service is the backend API that powers community events within the Decentraland virtual world. It manages event creation, discovery, attendance, schedules, recurrent events, push/email notifications, and social-sharing metadata. The user-facing dApp lives in a separate repository and consumes this service via HTTP.

## Table of Contents

- [Features](#features)
- [Dependencies and Related Services](#dependencies-and-related-services)
- [API Documentation](#api-documentation)
- [Database](#database)
  - [Schema](#schema)
  - [Migrations](#migrations)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Running the Service](#running-the-service)
- [Testing](#testing)
- [Development](#development)
- [License](#license)

## Features

- **Event Management**: Create, edit, and manage community events with approval workflows
- **Recurrent Events**: Support for recurring events using RRule (RFC 5545) specifications
- **Location-Based Discovery**: Find events by coordinates, estates, worlds, or places
- **Event Attendance**: Track event attendance and display attendee lists
- **Notifications**: Browser push notifications and email notifications for upcoming events
- **Schedules & Collections**: Curated event collections with custom theming (festivals, fashion weeks, etc.)
- **Full-Text Search**: PostgreSQL-based text search across event names and descriptions
- **Social Sharing**: Open Graph meta tags for social media sharing
- **Admin/Moderator Tools**: Event approval/rejection system with permission controls

## Dependencies and Related Services

### External Services

- **PostgreSQL**: Primary database for storing events and user data
- **AWS S3**: Storage for event poster images
- **AWS SNS**: Push notification delivery
- **Decentraland Catalyst**: World information and place resolution
- **Decentraland Communities API**: Community associations
- **Notification Service**: Event notification processing

### Internal Dependencies

- **decentraland-gatsby**: Server-side framework providing authentication, database utilities, mailing, and job management (despite its name, this service uses only its backend modules)
- **@dcl/schemas**: Decentraland schema definitions and validation

## API Documentation

API endpoints are documented using OpenAPI/Swagger specification. See [docs/openapi.yaml](./docs/openapi.yaml).

## Database

### Schema

The service uses PostgreSQL with the following main tables:

- `events` - Core event information
- `event_attendees` - User attendance tracking
- `event_category` - Event categorization tags
- `schedules` - Curated event collections
- `profile_settings` - User notification preferences
- `profile_subscription` - Web push subscription data

For detailed schema information, see [docs/database-schemas.md](./docs/database-schemas.md).

### Migrations

Database migrations are managed using `node-pg-migrate`. Migration files are located in `src/migrations/`.

#### Create a new migration

```bash
npm run migrate create -- <migration-name>
```

#### Apply migrations

```bash
npm run migrate up
```

#### Rollback migrations

```bash
npm run migrate down
```

All migrations are timestamped TypeScript files with `up()` and `down()` functions for applying and rolling back changes.

## Getting Started

### Prerequisites

- **Node.js**: v18.x
- **npm**: v8.x or v9.x
- **PostgreSQL**: v12 or higher
- **AWS Account**: For S3 storage and SNS notifications (optional for development)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/decentraland/events.git
cd events
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

### Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env.development
```

Required environment variables:

| Variable                      | Description                                               | Example                                             |
| ----------------------------- | --------------------------------------------------------- | --------------------------------------------------- |
| `CONNECTION_STRING`           | PostgreSQL connection string                              | `postgres://user:pass@localhost:5432/events`        |
| `ADMIN_ADDRESSES`             | Comma-separated list of admin wallet addresses            | `0xabc...,0xdef...`                                 |
| `EVENTS_ADMIN_AUTH_TOKEN`     | Bearer token for service-to-service event admin endpoints | -                                                   |
| `AWS_REGION`                  | AWS region for S3 and SNS                                 | `us-east-1`                                         |
| `AWS_ACCESS_KEY`              | AWS access key ID                                         | -                                                   |
| `AWS_ACCESS_SECRET`           | AWS secret access key                                     | -                                                   |
| `AWS_BUCKET_NAME`             | S3 bucket for event images                                | `events.decentraland.zone`                          |
| `AWS_BUCKET_URL`              | Public URL for S3 bucket                                  | `https://s3.amazonaws.com/...`                      |
| `WEB_PUSH_SECRET`             | VAPID private key for web push                            | Generate with `web-push generate-vapid-keys`        |
| `NOTIFICATION_SERVICE_URL`    | Notification service URL                                  | `https://notifications-processor.decentraland.zone` |
| `NOTIFICATION_SERVICE_TOKEN`  | Auth token for notification service                       | -                                                   |
| `COMMUNITIES_API_ADMIN_TOKEN` | Admin token for communities API                           | -                                                   |

See `.env.example` for a complete list of configuration options.

### Running the Service

#### Development Mode

Start the Express API server with file watching:

```bash
npm start
```

This is equivalent to running `npm run serve` and exposes the API on `http://localhost:4000` by default (configurable via `PORT` and `HOST`).

#### Production Mode

Build the service:

```bash
npm run build
```

Run the compiled service:

```bash
NODE_ENV=production node lib/server.js
```

The Docker image (`Dockerfile`) bundles `npm run build` and runs `entrypoint.sh`, which applies pending migrations before booting the server.

## Testing

Run the unit test suite:

```bash
npm test
```

Run the unit tests with coverage:

```bash
npm test -- --coverage
```

Run the integration tests (requires a running PostgreSQL instance — `docker compose up -d` provides one):

```bash
npm run test:integration
```

Tests are organized as:

- Unit tests: `src/**/*.test.ts`
- Integration tests: `test/integration/*.test.ts`

## Development

### Code Quality

Lint the codebase:

```bash
npm run lint
```

Auto-fix linting issues:

```bash
npm run lint:fix
```

Format code:

```bash
npm run format
```

### Pre-commit Hooks

The project uses Husky and lint-staged for pre-commit hooks. Code is automatically linted and formatted before commits.

Setup hooks (first time only):

```bash
npm run husky-setup
```

### Project Structure

```
events/
├── src/
│   ├── api/              # External API clients (Communities, CommsGatekeeper, Places)
│   ├── entities/         # Domain entities (Event, Attendee, Notification, etc.)
│   │   ├── Event/
│   │   │   ├── model.ts  # Database queries
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── cron.ts   # Scheduled jobs
│   │   │   ├── types.ts  # TypeScript types
│   │   │   ├── schemas.ts # Validation schemas
│   │   │   └── utils.ts  # Helper functions
│   │   └── ...
│   ├── intl/             # Backend copies (email/og metadata, slack messages)
│   ├── migrations/       # Database migrations
│   ├── modules/          # Backend-shared utilities
│   └── server.ts         # Express server setup
├── templates/            # Email HTML templates
├── test/                 # Integration tests, fixtures, and setup
├── docs/                 # API documentation (OpenAPI, schemas, agent context)
└── package.json
```

### AI Agent Context

For AI-assisted development and comprehensive service documentation, see [docs/ai-agent-context.md](./docs/ai-agent-context.md).

## License

Copyright 2020 by the Decentraland Foundation

Licensed under the MIT License. See LICENSE for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
