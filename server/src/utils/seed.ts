import bcrypt from "bcrypt";
import { connectDB } from "../config/db";
import { User, USER_ROLES, UserRole } from "../models/User";
import mongoose from "mongoose";

const SALT_ROUNDS = 10;
const SEED_PASSWORD = "Password123!";

async function seed(): Promise<void> {
  await connectDB();

  const created: { role: UserRole; email: string }[] = [];

  for (const role of USER_ROLES) {
    const email = `${role}@creditsea-lms.test`;

    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`[seed] ${role} already exists, skipping`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS);

    await User.create({
      name: `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
      email,
      password: hashedPassword,
      role,
      phone: "9999999999",
    });

    created.push({ role, email });
  }

  console.log("\n[seed] Done. Seeded accounts (password for all: " + SEED_PASSWORD + "):");
  console.table(
    USER_ROLES.map((role) => ({ role, email: `${role}@creditsea-lms.test` }))
  );

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error("[seed] Failed:", error);
  process.exit(1);
});
