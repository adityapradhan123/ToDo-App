import { Router } from "express";
import Todo from "../models/Todo";
import { requireAuth } from "../middleware/auth";
import {
  todoSchema,
  updateTodoSchema,
} from "../validation/schemas";

const router = Router();

router.use(requireAuth);

// Get all todos belonging to the logged-in user
router.get("/", async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ todos });
  } catch {
    res.status(500).json({ message: "Could not fetch todos" });
  }
});

// Create todo
router.post("/", async (req, res) => {
  try {
    const parsed = todoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: "Invalid todo",
        errors: parsed.error.flatten(),
      });
      return;
    }

    const todo = await Todo.create({
      ...parsed.data,
      userId: req.session.userId,
    });

    res.status(201).json({ todo });
  } catch {
    res.status(500).json({ message: "Could not create todo" });
  }
});

// Update title, description, or status
router.patch("/:id", async (req, res) => {
  try {
    const parsed = updateTodoSchema.safeParse(req.body);

    if (!parsed.success || Object.keys(parsed.data ?? {}).length === 0) {
      res.status(400).json({ message: "Invalid update" });
      return;
    }

    const todo = await Todo.findOneAndUpdate(
  {
    _id: req.params.id,
    userId: req.session.userId,
  },
  { $set: parsed.data },
  {
    returnDocument: "after",
    runValidators: true,
  }
);

    if (!todo) {
      res.status(404).json({ message: "Todo not found" });
      return;
    }

    res.json({ todo });
  } catch {
    res.status(400).json({ message: "Could not update todo" });
  }
});

// Delete todo
router.delete("/:id", async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.session.userId,
    });

    if (!todo) {
      res.status(404).json({ message: "Todo not found" });
      return;
    }

    res.json({ message: "Todo deleted successfully" });
  } catch {
    res.status(400).json({ message: "Could not delete todo" });
  }
});

export default router;