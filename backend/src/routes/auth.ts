import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { loginSchema, registerSchema } from "../validation/schemas";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid input",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    req.session.regenerate((err) => {
  if (err) {
    res.status(500).json({ message: "Could not create session" });
    return;
  }

  req.session.userId = user._id.toString();

  req.session.save((saveError) => {
    if (saveError) {
      res.status(500).json({ message: "Could not save session" });
      return;
    }

    res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  });
});
  } catch (error: any) {
    if (error?.code === 11000) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    console.error(error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ message: "Invalid email or password format" });
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // Regenerate session to prevent session fixation.
    req.session.regenerate((err) => {
      if (err) {
        res.status(500).json({ message: "Could not create session" });
        return;
      }

      req.session.userId = user._id.toString();

      req.session.save((saveError) => {
        if (saveError) {
          res.status(500).json({ message: "Could not save session" });
          return;
        }

        res.json({
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed" });
  }
});

// Current user
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select(
      "_id name email"
    );

    if (!user) {
      req.session.destroy(() => {});
      res.clearCookie("todo.sid");
      res.status(401).json({ message: "User not found" });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch {
    res.status(500).json({ message: "Could not fetch user" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ message: "Logout failed" });
      return;
    }

    res.clearCookie("todo.sid", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    res.json({ message: "Logged out successfully" });
  });
});

export default router;