import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { Role, RoomType } from '@prisma/client';

const createRoomSchema = z.object({
  building: z.string(),
  roomNo: z.string(),
  capacity: z.number().int().positive(),
  type: z.nativeEnum(RoomType),
  remarks: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireRole([Role.TEACHER, Role.SPOC, Role.ADMIN]);

    const searchParams = request.nextUrl.searchParams;
    const building = searchParams.get('building');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (building) where.building = building;
    if (isActive !== null) where.isActive = isActive === 'true';

    const rooms = await prisma.room.findMany({
      where,
      orderBy: [{ building: 'asc' }, { roomNo: 'asc' }],
    });

    return NextResponse.json({ rooms });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Unauthorized' ? 401 : 403 }
      );
    }

    console.error('Get rooms error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole([Role.SPOC, Role.ADMIN]);

    const body = await request.json();
    const data = createRoomSchema.parse(body);

    const room = await prisma.room.create({
      data: {
        ...data,
        isActive: true,
      },
    });

    return NextResponse.json({ room }, { status: 201 });
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

    console.error('Create room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
