# Safe Connect MongoDB Overview

This document summarizes the MongoDB schema that powers the Safe Connect mobile backend. Each collection is backed by a Mongoose model (see the referenced file paths) and is configured with indexes that support the core workflows: SOS dispatch, volunteer management, and community content.

## Core Principles
- GeoJSON is used for every location field (longitude, latitude).
- Every document stores `createdAt` and `updatedAt` timestamps (unless otherwise noted).
- Media files live on S3; the database stores descriptive metadata only.
- Access control relies on user roles (`USER`, `TNV_CN`, `TNV_TC`, `ADMIN`) that are embedded on the user document and propagated in JWTs.

## Collections

| Collection | Purpose | Model |
| --- | --- | --- |
| `users` | Global account registry shared by all roles. | `models/user.model.js` |
| `volunteer_profiles` | Volunteer verification data and readiness flags. | `models/volunteerProfile.model.js` |
| `skills_master` | Controlled vocabulary of volunteer skills. | `models/skill.model.js` |
| `sos_cases` | Real-time SOS incidents created by citizens. | `models/sosCase.model.js` |
| `sos_channels` | One-to-one private chat channel per SOS case. | `models/sosChannel.model.js` |
| `sos_messages` | Message log (text + optional media). | `models/sosMessage.model.js` |
| `sos_responder_queue` | Tracks which volunteers were notified and their responses. | `models/sosResponderQueue.model.js` |
| `devices` | Mobile devices and push tokens for proximity calculations. | `models/device.model.js` |
| `notifications` | System notifications with delivery and read receipts. | `models/notification.model.js` |
| `posts` | Community posts submitted by volunteers. | `models/post.model.js` |
| `comments` | Post comments with optional nesting. | `models/comment.model.js` |
| `moderation_logs` | Immutable moderation/audit trail. | `models/moderationLog.model.js` |
| `media_assets` | Reusable S3 metadata shared across modules. | `models/mediaAsset.model.js` |

Shared sub-schemas:
- `models/schemas/mediaAsset.schema.js` encodes S3 metadata.
- `models/schemas/geoPoint.schema.js` encodes GeoJSON `Point`.

## Key Indexes

| Collection | Indexes |
| --- | --- |
| `users` | `phone` (unique), `email` (unique+sparse), `address.location` (2dsphere) |
| `volunteer_profiles` | `userId` (unique), `status`, `ready`, `homeBase.location` (2dsphere) |
| `skills_master` | `code` (unique) |
| `sos_cases` | `code` (unique), `status`, `reporterId`, `acceptedBy`, `location` (2dsphere) |
| `sos_responder_queue` | `(sosId, volunteerId)` (unique), `status`, `notifiedAt` |
| `sos_messages` | `(channelId, sentAt)`, TTL on `deletedAt` (30 days) |
| `posts` | `status`, `authorId`, `createdAt`, `location` (2dsphere) |
| `devices` | `(userId, pushToken)` (unique), `lastLocation` (2dsphere) |
| `media_assets` | `(bucket, key)` (unique), `ownerId`, `usage` |

Indexes are created through the Mongoose schemas and synchronised on start-up in `config/initializeDatabase.js`.

## Collection Validators

MongoDB JSON schema validators are applied (best-effort) for:
- `users`
- `sos_cases`
- `posts`

See `config/initializeDatabase.js` for the exact validator definitions and the logic that performs `createCollection`/`collMod`.

## Sample Documents

```json
// users
{
  "fullName": "Nguyen An",
  "phone": "+84-9xxx",
  "roles": ["USER"],
  "avatar": {
    "bucket": "safe-connect-prod",
    "key": "avatars/66ff.../avatar.jpg",
    "url": "https://cdn.example/avatars/66ff.../avatar.jpg",
    "mimeType": "image/jpeg",
    "size": 123456,
    "etag": "\"5d8c72...\""
  },
  "address": {
    "line1": "Ward 7, District 3",
    "location": { "type": "Point", "coordinates": [106.6903, 10.7769] }
  }
}
```

```json
// volunteer_profiles
{
  "userId": "66ff...",
  "type": "CN",
  "status": "APPROVED",
  "ready": true,
  "skills": ["FIRST_AID", "DRIVING"],
  "idCardFront": { "bucket": "safe-connect-prod", "key": "id/66ff.../front.jpg" },
  "idCardBack": { "bucket": "safe-connect-prod", "key": "id/66ff.../back.jpg" },
  "homeBase": {
    "location": { "type": "Point", "coordinates": [106.69, 10.78] },
    "radiusKm": 10
  },
  "reputation": { "totalCases": 5, "ratingAvg": 4.8, "badges": ["QUICK_RESPONDER"] },
  "approvedAt": "2025-09-12T00:00:00.000Z"
}
```

```json
// sos_cases
{
  "code": "SOS-2025-HCM-00001",
  "reporterId": "66aa...",
  "location": { "type": "Point", "coordinates": [106.70098, 10.77653] },
  "status": "SEARCHING",
  "meta": { "radiusKmNotified": 5, "notifyCount": 12 }
}
```

## Common Queries

```js
// Find ready volunteers near an SOS location (radius in km)
const radiusKm = 5;
const volunteers = await VolunteerProfile.aggregate([
  { $match: { status: 'APPROVED', ready: true } },
  {
    $geoNear: {
      near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'distanceMeters',
      maxDistance: radiusKm * 1000,
      spherical: true,
      key: 'homeBase.location',
    },
  },
  { $limit: 50 },
  {
    $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user',
    },
  },
  {
    $project: {
      userId: 1,
      skills: 1,
      distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] },
      'user.fullName': 1,
      'user.phone': 1,
    },
  },
]);
```

```js
// Close an SOS case (within an express route/controller)
await SosCase.updateOne(
  { _id: sosId, status: { $in: ['ACCEPTED', 'IN_PROGRESS'] } },
  { $set: { status: 'RESOLVED', resolvedAt: new Date() } },
);
```

```js
// Upsert chat channel and send message
const channel = await SosChannel.findOneAndUpdate(
  { sosId },
  { $setOnInsert: { participants: [reporterId, volunteerId] } },
  { upsert: true, new: true }
);

await SosMessage.create({
  channelId: channel._id,
  senderId: volunteerId,
  text: 'Incoming helper on the way!',
});
```

## Authentication Notes
- Registration (`POST /api/auth/register`) hashes passwords with bcryptjs and returns a JWT.
- Login (`POST /api/auth/login`) supports phone or email identifiers and invalidates inactive accounts.
- Access tokens embed `sub` (user id) and `roles`; middleware `middleware/auth.js` enforces both authentication and role-based authorization.

## Operational Guidance
- Environment variables: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`, `PORT`.
- Run `npm install` after pulling changes to sync dependencies (`cors`).
- On startup the server connects to MongoDB, synchronises indexes, and applies validators (warnings are logged if permissions are insufficient).
