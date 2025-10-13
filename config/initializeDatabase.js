const mongoose = require('mongoose');
const models = require('../models');

const usersValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['fullName', 'phone', 'passwordHash', 'roles', 'createdAt'],
    properties: {
      fullName: { bsonType: 'string', minLength: 1 },
      phone: { bsonType: 'string', minLength: 6 },
      email: { bsonType: ['string', 'null'] },
      passwordHash: { bsonType: 'string' },
      roles: {
        bsonType: 'array',
        items: { enum: ['USER', 'TNV_CN', 'TNV_TC', 'ADMIN'] },
        minItems: 1,
      },
      address: {
        bsonType: ['object', 'null'],
        properties: {
          line1: { bsonType: ['string', 'null'] },
          ward: { bsonType: ['string', 'null'] },
          district: { bsonType: ['string', 'null'] },
          province: { bsonType: ['string', 'null'] },
          country: { bsonType: ['string', 'null'] },
          location: {
            bsonType: ['object', 'null'],
            properties: {
              type: { enum: ['Point'] },
              coordinates: {
                bsonType: 'array',
                items: { bsonType: 'double' },
                minItems: 2,
                maxItems: 2,
              },
            },
          },
        },
      },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
};

const sosCasesValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['code', 'reporterId', 'location', 'status', 'createdAt'],
    properties: {
      code: { bsonType: 'string' },
      reporterId: { bsonType: 'objectId' },
      location: {
        bsonType: 'object',
        properties: {
          type: { enum: ['Point'] },
          coordinates: {
            bsonType: 'array',
            items: { bsonType: 'double' },
            minItems: 2,
            maxItems: 2,
          },
        },
      },
      status: {
        enum: ['SEARCHING', 'ACCEPTED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
      },
      createdAt: { bsonType: 'date' },
    },
  },
};

const postsValidator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['authorId', 'content', 'status', 'createdAt'],
    properties: {
      authorId: { bsonType: 'objectId' },
      content: { bsonType: 'string' },
      status: { enum: ['PENDING', 'APPROVED', 'REJECTED'] },
      location: {
        bsonType: ['object', 'null'],
        properties: {
          type: { enum: ['Point'] },
          coordinates: {
            bsonType: 'array',
            items: { bsonType: 'double' },
            minItems: 2,
            maxItems: 2,
          },
        },
      },
      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: 'date' },
    },
  },
};

const validatorMap = [
  { collection: 'users', validator: usersValidator },
  { collection: 'sos_cases', validator: sosCasesValidator },
  { collection: 'posts', validator: postsValidator },
];

const applyValidator = async (collectionName, validator) => {
  const db = mongoose.connection.db;
  if (!db) return;

  const collections = await db.listCollections({ name: collectionName }).toArray();

  if (collections.length === 0) {
    await db.createCollection(collectionName, {
      validator,
      validationLevel: 'moderate',
      validationAction: 'warn',
    });
    return;
  }

  await db.command({
    collMod: collectionName,
    validator,
    validationLevel: 'moderate',
    validationAction: 'warn',
  });
};

const initializeDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  // Sync indexes defined in Mongoose schemas
  await Promise.all(
    Object.values(models).map((model) => model.syncIndexes().catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(`Failed to sync indexes for ${model.collection.collectionName}:`, error.message);
    }))
  );

  // Apply collection validators (best-effort)
  await Promise.all(
    validatorMap.map(({ collection, validator }) =>
      applyValidator(collection, validator).catch((error) => {
        // eslint-disable-next-line no-console
        console.warn(`Failed to apply validator for ${collection}:`, error.message);
      })
    )
  );
};

module.exports = initializeDatabase;
