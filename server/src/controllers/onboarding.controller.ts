import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { signToken } from "../utils/jwt.util";

const SALT_ROUNDS = 10;

export async function signUp(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "name, email and password are required" });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ message: "An account with this email already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      // Executive roles are provisioned through the seed/admin workflow, never by public sign-up.
      role: "borrower",
      phone,
    });

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create account", error: (error as Error).message });
  }
}

export async function signIn(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "email and password are required" });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = signToken({ userId: user._id.toString(), role: user.role });

    res.status(200).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to sign in", error: (error as Error).message });
  }
}
