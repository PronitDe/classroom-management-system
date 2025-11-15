// Application-wide constants

export const TIME_SLOTS = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
  '14:00-15:00',
  '15:00-16:00',
  '16:00-17:00',
  '17:00-18:00',
] as const;

export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const ISSUE_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

export const USER_ROLES = {
  TEACHER: 'TEACHER',
  SPOC: 'SPOC',
  ADMIN: 'ADMIN',
  STUDENT: 'STUDENT',
} as const;

export const ROOM_TYPES = {
  LECTURE_HALL: 'LECTURE_HALL',
  LAB: 'LAB',
  SEMINAR_ROOM: 'SEMINAR_ROOM',
  FACULTY_ROOM: 'FACULTY_ROOM',
} as const;
