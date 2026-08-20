import { z } from "zod";

export const nameSchema = z.string().trim().min(2).max(100);
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,6}$/, "Use até 6 letras, números ou hífen");
export const roomPasswordSchema = z
  .string()
  .regex(/^\d{4}$/, "Informe 4 dígitos");
export const taskUrlSchema = z.string().url();
export const taskTitleSchema = z.string().trim().min(1).max(200);
export const createRoomSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: slugSchema,
  password: roomPasswordSchema,
  style: z.enum(["SCRUM", "FIBONACCI", "TSHIRT"]),
});
