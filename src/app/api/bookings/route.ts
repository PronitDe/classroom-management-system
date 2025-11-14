import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { Role, BookingStatus } from '@prisma/client';

const createBookingSchema = z.object({
  roomId: z.string().uuid(),
  date: z.string().transform((str) => new Date(str)),
  slot: z.string(),
  remarks: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([Role.TEACHER]);

    const body = await request.json();
    const data = createBookingSchema.parse(body);

    // Check if room is active
    const room = await prisma.room.findUnique({
      where: { id: data.roomId },
    });

    if (!room || !room.isActive) {
      return NextResponse.json(
        { error: 'Room is not available' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const existingBooking = await prisma.booking.findFirst({
      where: {
        roomId: data.roomId,
        date: data.date,
        slot: data.slot,
        status: {
          in: [BookingStatus.PENDING, BookingStatus.APPROVED],
        },
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Room is already booked for this time slot' },
        { status: 409 }
      );
    }

    const booking = await prisma.booking.create({
      data: {
        teacherId: user.id,
        roomId: data.roomId,
        date: data.date,
        slot: data.slot,
        remarks: data.remarks,
        status: BookingStatus.PENDING,
      },
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
    });

    return NextResponse.json({ booking }, { status: 201 });
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

    console.error('Create booking error:', error);
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
    const status = searchParams.get('status');
    const date = searchParams.get('date');

    const where: any = {};

    // Teachers can only see their own bookings
    if (user.role === Role.TEACHER) {
      where.teacherId = user.id;
    }

    if (status) {
      where.status = status as BookingStatus;
    }

    if (date) {
      where.date = new Date(date);
    }

    const bookings = await prisma.booking.findMany({
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

    return NextResponse.json({ bookings });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Get bookings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
