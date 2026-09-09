import { z } from "zod";

export const registerSchema = z
  .object({
    username: z.string().trim().min(3, "At least 3 characters").max(32),
    email: z.string().trim().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
    timezone: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const registerApiSchema = z.object({
  username: z.string().trim().min(3, "At least 3 characters").max(32),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  timezone: z.string().min(1),
});

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const taskCreateSchema = z.object({
  text: z.string().trim().min(1, "Required").max(280),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notify: z.boolean().optional(),
});

export const taskUpdateSchema = z.object({
  text: z.string().trim().min(1).max(280).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  status: z.enum(["PENDING", "COMPLETED"]).optional(),
  notify: z.boolean().optional(),
});

const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm");

export const updateProfileSchema = z.object({
  username: z.string().trim().min(3, "At least 3 characters").max(32).optional(),
  timezone: z.string().min(1).optional(),
  planReminderEnabled: z.boolean().optional(),
  planReminderTime: timeString.optional(),
  endOfDayReminderEnabled: z.boolean().optional(),
  endOfDayReminderTime: timeString.optional(),
});
