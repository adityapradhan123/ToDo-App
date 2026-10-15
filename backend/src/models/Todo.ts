import mongoose, { Schema, Document } from "mongoose";

export type TodoStatus = "todo" | "inprogress" | "completed";

export interface ITodo extends Document {
  title: string;
  description: string;
  status: TodoStatus;
  userId: mongoose.Types.ObjectId;
}

const todoSchema = new Schema<ITodo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["todo", "inprogress", "completed"],
      default: "todo",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITodo>("Todo", todoSchema);