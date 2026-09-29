import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { jest } from "@jest/globals";

let replSet: MongoMemoryReplSet;

export const setupTestDB = async () => {
  // Increase Jest timeout since replica sets can take a few seconds to start
  jest.setTimeout(30000);

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, name: "rs0" } });
  const uri = replSet.getUri();

  await mongoose.connect(uri);
};

export const teardownTestDB = async () => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
};
