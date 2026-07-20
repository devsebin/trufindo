import { connectDB, clearDB, closeDB } from "./mongo-memory";

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await clearDB();
});

afterAll(async () => {
  await closeDB();
}, 120000);
