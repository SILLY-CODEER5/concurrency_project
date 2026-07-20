import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { seatId, userId } = await request.json();

  if (!seatId || !userId) {
    return NextResponse.json({ error: 'Missing seatId or userId' }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Pessimistic Lock: SELECT FOR UPDATE SKIP LOCKED
      // Prisma $queryRaw returns an array of rows.
      const lockResult: any[] = await tx.$queryRaw`
        SELECT * FROM seats 
        WHERE id = ${seatId} AND status = 'AVAILABLE' 
        FOR UPDATE SKIP LOCKED
      `;

      if (lockResult.length === 0) {
        // Seat is either already booked or currently being booked by another transaction.
        // Throwing an error rolls back the transaction automatically.
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
    }, {
      maxWait: 15000, // default is 2000
      timeout: 15000, // default is 5000
    });

    return NextResponse.json({ success: true, message: 'Seat booked successfully!' });
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
