import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { memoryLock } from '@/lib/memory-lock';

export async function POST(request: Request) {
  const { seatId, userId } = await request.json();

  if (!seatId || !userId) {
    return NextResponse.json({ error: 'Missing seatId or userId' }, { status: 400 });
  }

  try {
    // Attempt to acquire an in-memory lock for this seat
    const acquiredLock = memoryLock.acquire(seatId);

    if (!acquiredLock) {
      // 9,999 of the 10,000 concurrent requests will fail here instantly
      // preventing the database connection pool from crashing.
      return NextResponse.json(
        { error: 'Seat is no longer available or is locked by another user.' },
        { status: 409 }
      );
    }

    let success = false;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Double check lock: SELECT FOR UPDATE SKIP LOCKED
        const lockResult: any[] = await tx.$queryRaw`
          SELECT * FROM seats 
          WHERE id = ${seatId} AND status = 'AVAILABLE' 
          FOR UPDATE SKIP LOCKED
        `;

        if (lockResult.length === 0) {
          throw new Error('SEAT_LOCKED');
        }

        // 2. Update seat status using Prisma ORM
        await tx.seats.update({
          where: { id: seatId },
          data: { status: 'BOOKED' },
        });

        // 3. Create booking record using Prisma ORM
        await tx.bookings.create({
          data: {
            user_id: userId,
            seat_id: seatId,
          },
        });
      });
      success = true;
    } finally {
      // Release the memory lock
      memoryLock.release(seatId);
    }

    if (success) {
      return NextResponse.json({ success: true, message: 'Seat booked successfully!' });
    }

  } catch (error: any) {
    if (error.message === 'SEAT_LOCKED') {
      return NextResponse.json(
        { error: 'Seat is no longer available or is locked by another user.' },
        { status: 409 } // Conflict
      );
    }
    console.error('Booking transaction failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
