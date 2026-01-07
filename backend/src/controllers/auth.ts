// life-admin-assistant/backend/src/controllers/auth.ts
import { Request, Response } from "express";
import { registerUser, loginUser } from "../services/auth";
import { loginSchema, registerSchema } from "../validation/auth";
import { prisma } from "../prisma/client";

export async function handleRegister(req: Request, res: Response) {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    const { email, password, name } = req.body;
    const user = await registerUser(email, password, name);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

export async function handleLogin(req: Request, res: Response) {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    const { email, password } = req.body;
    const result = await loginUser(email, password);
    res.json({ message: "Login successful", ...result });
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
}

export async function handleGetMe(req: Request, res: Response) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    
    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ message: "Internal server error" });
  }
}