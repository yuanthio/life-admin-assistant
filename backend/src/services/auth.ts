// life-admin-assistant/backend/src/services/auth.ts
import bcrypt from "bcrypt";
import { prisma } from "../prisma/client";
import { signToken } from "../utils/jwt";

export async function registerUser(email: string, password: string, name?: string) {
  if (!email.match(/@/) || password.length < 6) {
    throw new Error("Invalid email or password");
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { 
      email, 
      password: hashed,
      name: name || email.split('@')[0]
    },
  });

  return { id: user.id, email: user.email, name: user.name };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Wrong password");

  const token = signToken({ id: user.id, email: user.email });
  return { 
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  };
}