import { create } from "zustand";
import { nanoid } from "nanoid";

export type Task = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  completed: boolean;
  subject: string;
  priority: "low" | "medium" | "high";
  status: string;
};

type TaskStore = {
  tasks: Task[];
  addTask: (task: Omit<Task, "id">) => void;
  updateTask: (id: string, task: Omit<Task, "id">) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
};

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [
        ...state.tasks,
        { ...task, id: nanoid() }
      ],
    })),
  updateTask: (id, task) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...task } : t
      ),
    })),
  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
  toggleComplete: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),
})); 