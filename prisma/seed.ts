import { PrismaClient } from "../app/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const seedEmail = (process.env.SEED_ADMIN_EMAIL || "superadmin@agm.ae")
    .trim()
    .toLowerCase();
  const seedPassword = process.env.SEED_ADMIN_PASSWORD || "AdminPassword123!";

  console.log(`[Seed] Checking for initial SUPER_ADMIN account...`);

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingSuperAdmin) {
    console.log(
      `[Seed] SUPER_ADMIN account already exists: ${existingSuperAdmin.email} (ID: ${existingSuperAdmin.id})`,
    );
    return;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: seedEmail },
  });

  const passwordHash = await bcrypt.hash(seedPassword, 10);

  if (existingByEmail) {
    const updated = await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        role: "SUPER_ADMIN",
        mustChangePassword: true,
        isActive: true,
        deletedAt: null,
      },
    });
    console.log(
      `[Seed] Elevated existing account to SUPER_ADMIN: ${updated.email}`,
    );
  } else {
    const created = await prisma.user.create({
      data: {
        email: seedEmail,
        fullName: "System Super Admin",
        passwordHash,
        role: "SUPER_ADMIN",
        mustChangePassword: true,
        isActive: true,
      },
    });
    console.log(
      `[Seed] Created new initial SUPER_ADMIN account: ${created.email}`,
    );
  }
}

main()
  .catch((e) => {
    console.error("[Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
