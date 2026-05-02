# AI Agent Context

**Service Purpose:**

The Community Events service is the backend API that powers community events within the Decentraland virtual world. It exposes HTTP endpoints to create, discover, and attend events in both land-based locations and virtual worlds, with features such as recurrent events, scheduling, notifications, and social-sharing metadata. The user-facing dApp lives in a separate repository.

**Key Capabilities:**

- Event Management: Create, edit, and manage community events with approval workflows
- Recurrent Events: Support for recurring events using RRule (RFC 5545) specifications
- Location-Based Discovery: Find events by coordinates, estates, worlds, or places
- Event Attendance: Track event attendance and display attendee lists
- Notifications: Browser push notifications and email notifications for upcoming events
- Schedules & Collections: Curated event collections with custom theming (festivals, fashion weeks, etc.)
- Full-Text Search: PostgreSQL-based text search across event names and descriptions
- Social Sharing: Open Graph meta tags for social media sharing (server-rendered)
- Admin/Moderator Tools: Event approval/rejection system with permission controls

**Communication Pattern:**

- HTTP REST API
- GraphQL not used (native REST endpoints)
- WebSocket not used
- Web Push API for browser notifications

**Technology Stack:**

- Runtime: Node.js v18.x
- Language: TypeScript
- Server Framework: Express.js (with utilities from `decentraland-gatsby`'s backend modules)
- Database: PostgreSQL v12 or higher
- Database Migrations: node-pg-migrate
- ORM/Query Builder: Custom SQL through decentraland-gatsby utilities
- Testing: Jest for unit and integration tests
- Code Quality: ESLint + Prettier
- Pre-commit Hooks: Husky + lint-staged

**External Dependencies:**

- Database: PostgreSQL (events, attendees, categories, schedules, user profiles)
- Cloud Storage: AWS S3 (event poster images)
- Notifications: AWS SNS (push notification delivery)
- Content Delivery: Decentraland Catalyst (world information, place resolution)
- Authentication: Decentraland wallet-based authentication
- Communities API: Decentraland Communities API (community associations)
- Notification Service: Event notification processing service
- Schema Validation: @dcl/schemas (Decentraland schema definitions)

**Key Concepts:**

- **Event Lifecycle**: Events are created in a pending state, require admin/moderator approval, and can be approved, rejected, highlighted, or marked as trending. Only approved events are visible to regular users.
- **Event Types**: Events can be one-time (single occurrence), recurrent (repeating based on RRule), or all-day (no specific times).
- **Location Handling**: Events can be located by specific coordinates (x, y) in Decentraland land, estates (grouped parcels), worlds (private virtual spaces), places (named locations with place_id), or communities (events associated with community_id).
- **Date Range Filtering**: Events can be filtered by date range using `from` and `to` query parameters (ISO 8601 format). The filter applies to `next_start_at` field, allowing queries like "events starting in January 2026".
- **Event Recurrence**: The service uses RRule (RFC 5545) to handle recurring events with support for various frequencies (yearly, monthly, weekly, daily, hourly), weekday masks, month masks, position rules (first Monday, last Friday), and count/until limits.
- **Attendee Tracking**: Users can mark attendance for events. The system tracks latest attendees, maintains total attendee counts, and can send notifications based on user profile settings.
- **Schedules**: Curated collections of events with custom themes (e.g., Metaverse Festival, Fashion Week), active periods (active_since, active_until), and custom branding/backgrounds.
- **Categories**: Events can be tagged with categories for filtering and discovery (currently limited to 1 category per event with MAX_CATEGORIES_ALLOWED = 1).
- **Authentication & Authorization**: Wallet-based authentication through Decentraland. User addresses serve as primary identifiers. Event ownership is tied to creator's wallet address. Admin/moderator roles control approval/rejection permissions.
- **Entity-Based Architecture**: Code is organized by entity (Event, EventAttendee, Schedule, ProfileSettings) with each containing model.ts (database queries), routes.ts (API endpoints), types.ts (TypeScript definitions), schemas.ts (validation), and utils.ts (helpers).
- **Server-Rendered Social Metadata**: Open Graph and Twitter card metadata for individual events is rendered server-side by `src/entities/Social/routes.ts` to power link previews on social platforms.

**Database notes:**

- **events table**: Core event information including name, description, coordinates, dates, recurrence rules, approval status, and metadata
- **event_attendees table**: Tracks user attendance with user addresses and event IDs, maintains latest attendees list
- **event_category table**: Event categorization tags for filtering and discovery
- **schedules table**: Curated event collections with themes, active periods, and custom branding
- **profile_settings table**: User notification preferences for event reminders
- **profile_subscription table**: Web push subscription data for browser notifications
- **Indexes**: Full-text search indexes using PostgreSQL textsearch, indexes on coordinates, dates, approval status, and compound indexes for common query patterns
- **Migrations**: All schema changes managed through timestamped TypeScript migrations in src/migrations/ using node-pg-migrate with up() and down() functions
- **SQL Queries**: Custom SQL through decentraland-gatsby utilities with parameterized queries for SQL injection protection

For detailed schema information, see [database-schemas.md](./database-schemas.md).
