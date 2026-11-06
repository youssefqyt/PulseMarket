const { z } = require("zod");

const email = z.string().trim().toLowerCase().email("A valid email is required");
const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email,
  password,
  role: z.enum(["user", "seller"]).optional(),
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken is required"),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120).optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
};
