import { z } from 'zod';

// Booking validation
export const bookingSchema = z.object({
  roomId: z.string().uuid("Invalid room selection"),
  date: z.string().min(1, "Date is required"),
  slot: z.string().min(1, "Time slot is required"),
  remarks: z.string().max(500, "Remarks must be less than 500 characters").optional().or(z.literal('')),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

// Issue report validation
export const issueSchema = z.object({
  roomId: z.string().uuid("Invalid room selection"),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
});

export type IssueFormData = z.infer<typeof issueSchema>;

// Notice validation
export const noticeSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .min(1, "Description is required")
    .max(2000, "Description must be less than 2000 characters"),
  attachmentUrl: z.string()
    .url("Must be a valid URL")
    .max(500, "URL too long")
    .optional()
    .or(z.literal('')),
});

export type NoticeFormData = z.infer<typeof noticeSchema>;

// Student feedback validation
export const feedbackSchema = z.object({
  category: z.string().min(1, "Category is required"),
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters"),
});

export type FeedbackFormData = z.infer<typeof feedbackSchema>;

// Password change validation
export const passwordChangeSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
