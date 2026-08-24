const prisma = require("../src/config/prisma");
const { hashPassword } = require("../src/services/password.service");

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error(
      "Usage: node scripts/createAdmin.js <email> <password>"
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    console.error("A user with this email already exists.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const admin = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin created:", admin.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });