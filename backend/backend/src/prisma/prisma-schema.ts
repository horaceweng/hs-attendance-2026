// src/prisma/prisma-schema.ts
/**
 * This file contains types extracted from the Prisma schema.
 * These types are used to provide type safety when working with Prisma models.
 */

export enum Role {
  teacher = 'teacher',
  GA_specialist = 'GA_specialist'
}

export enum Gender {
  male = 'male',
  female = 'female',
  other = 'other'
}

export enum AttendanceStatus {
  present = 'present',
  absent = 'absent',
  late = 'late',
  leave_early = 'leave_early',
  on_leave = 'on_leave'
}

export enum LeaveRequestStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected'
}

export enum SeasonType {
  fall = 'fall',
  winter = 'winter',
  spring = 'spring',
  summer = 'summer'
}

export enum StudentStatus {
  active = 'active',
  transferred_out = 'transferred_out',
  graduated = 'graduated',
  suspended = 'suspended'
}