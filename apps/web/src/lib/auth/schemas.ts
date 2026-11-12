import { z } from "zod";

export const LoginInputSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const SignupInputSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const BackendAuthResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().nullish(),
});

const BackendProfileSchema = z
  .object({
    userId: z.union([z.string(), z.number()]).nullish(),
    id: z.union([z.string(), z.number()]).nullish(),
    _id: z.union([z.string(), z.number()]).nullish(),
    email: z.string().nullish(),
    username: z.string().nullish(),
    name: z.string().nullish(),
    roles: z.union([z.array(z.string()), z.string()]).nullish(),
    role: z.union([z.array(z.string()), z.string()]).nullish(),
    avatar: z.string().nullish(),
    image: z.string().nullish(),
  })
  .passthrough();

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().nullish(),
  username: z.string().nullish(),
  roles: z.union([z.array(z.string()), z.string()]).nullish(),
  avatar: z.string().nullish(),
  type: z.enum(["user", "guest"]),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;
export type SignupInput = z.infer<typeof SignupInputSchema>;
export type BackendAuthResponse = z.infer<typeof BackendAuthResponseSchema>;
export type User = z.infer<typeof UserSchema>;

export function normalizeProfile(
  raw: unknown,
  type: User["type"] = "user",
): User | null {
  const parsed = BackendProfileSchema.safeParse(raw);
  if (!parsed.success) return null;

  const p = parsed.data;
  const id = p.userId ?? p.id ?? p._id;
  if (id === null || id === undefined) return null;

  return {
    id: String(id),
    email: p.email ?? null,
    username: p.username ?? p.name ?? null,
    roles: p.roles ?? p.role ?? null,
    avatar: p.avatar ?? p.image ?? null,
    type,
  };
}
