import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireRole } from '@/lib/auth';
import { Role, IssueStatus } from '@prisma/client';

const createIssueSchema = z.object({
  roomId: z.string().uuid(),
  message: z.string().min(10),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole([Role.TEACHER]);

    const body = await request.json();
    const data = createIssueSchema.parse(body);

    const issue = await prisma.issueReport.create({
      data: {
        teacherId: user.id,
        roomId: data.roomId,
        message: data.message,
        status: IssueStatus.OPEN,
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

    return NextResponse.json({ issue }, { status: 201 });
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

    console.error('Create issue error:', error);
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

    const where: any = {};

    // Teachers can only see their own issues
    if (user.role === Role.TEACHER) {
      where.teacherId = user.id;
    }

    if (status) {
      where.status = status as IssueStatus;
    }

    const issues = await prisma.issueReport.findMany({
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
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ issues });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    console.error('Get issues error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
