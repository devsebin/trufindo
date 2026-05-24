import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

let mongo: MongoMemoryReplSet;

export const connectDB = async () => {
  mongo = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
    },
  });

  const uri = mongo.getUri();
  mongoose.set("strictQuery", false);
  await mongoose.connect(uri);
};

export const clearDB = async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongo.stop();
};
