import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { Role, RoomType } from '@prisma/client';

const updateRoomSchema = z.object({
  capacity: z.number().int().positive().optional(),
  type: z.nativeEnum(RoomType).optional(),
  isActive: z.boolean().optional(),
  remarks: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole([Role.SPOC, Role.ADMIN]);

    const body = await request.json();
    const data = updateRoomSchema.parse(body);

    const room = await prisma.room.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({ room });
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

    console.error('Update room error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
