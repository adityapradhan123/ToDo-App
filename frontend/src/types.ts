export type TodoStatus = "todo" | "inprogress" | "completed";

export interface Todo {
  _id: string;
  title: string;
  description: string;
  status: TodoStatus;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}