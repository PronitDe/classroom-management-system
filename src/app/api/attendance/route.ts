import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { Role } from '@prisma/client';

const createAttendanceSchema = z.object({
  bookingId: z.string().uuid(),
  total: z.number().int().positive(),
  present: z.number().int().min(0),
  remarks: z.string().optional(),
}).refine((data) => data.present <= data.total, {
  message: 'Present count cannot exceed total count',
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([Role.TEACHER]);

    const body = await request.json();
    const data = createAttendanceSchema.parse(body);

    // Verify booking exists and belongs to the teacher
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: { room: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.teacherId !== user.id) {
      return NextResponse.json(
        { error: 'You can only mark attendance for your own bookings' },
        { status: 403 }
      );
    }

    if (booking.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Can only mark attendance for approved bookings' },
        { status: 400 }
      );
    }

    // Check if attendance already exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { bookingId: data.bookingId },
    });

    if (existingAttendance) {
      return NextResponse.json(
        { error: 'Attendance already marked for this booking' },
        { status: 409 }
      );
    }

    const attendance = await prisma.attendance.create({
      data: {
        bookingId: data.bookingId,
        teacherId: booking.teacherId,
        roomId: booking.roomId,
        date: booking.date,
        slot: booking.slot,
        total: data.total,
        present: data.present,
        remarks: data.remarks,
      },
      include: {
        booking: {
          include: {
            room: true,
          },
        },
        room: true,
      },
    });

    // Update booking status to COMPLETED
    await prisma.booking.update({
      where: { id: data.bookingId },
      data: { status: 'COMPLETED' },
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    const where: any = {};

    // Teachers can only see their own attendance
    if (user.role === Role.TEACHER) {
      where.teacherId = user.id;
    }

    if (date) {
      where.date = new Date(date);
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        room: true,
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { slot: 'asc' }],
    });

    return NextResponse.json({ attendance });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Get attendance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
