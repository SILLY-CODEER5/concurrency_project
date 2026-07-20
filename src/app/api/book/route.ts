import { NextResponse } from 'next/server';
import { getClient } from '@/lib/db';

export async function POST(request: Request) {
  const { seatId, userId } = await request.json();

  if (!seatId || !userId) {
    return NextResponse.json({ error: 'Missing seatId or userId' }, { status: 400 });
  }

  const client = await getClient();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // 1. Pessimistic Lock: SELECT FOR UPDATE SKIP LOCKED
    // This locks the specific seat row so no other transaction can read it for update.
    // If another transaction has it locked, SKIP LOCKED ensures we immediately return 0 rows 
    // instead of waiting for the lock to release, which is great for fast-failing in high concurrency.
    const lockResult = await client.query(
      `SELECT * FROM seats WHERE id = $1 AND status = 'AVAILABLE' FOR UPDATE SKIP LOCKED`,
      [seatId]
    );

    if (lockResult.rows.length === 0) {
      // Seat is either already booked or currently being booked by another transaction
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Seat is no longer available or is locked by another user.' },
        { status: 409 } // Conflict
      );
    }

    // 2. Update seat status
    await client.query(
      `UPDATE seats SET status = 'BOOKED' WHERE id = $1`,
      [seatId]
    );

    // 3. Create booking record
    await client.query(
      `INSERT INTO bookings (user_id, seat_id) VALUES ($1, $2)`,
      [userId, seatId]
    );

    // Commit transaction
    await client.query('COMMIT');

    return NextResponse.json({ success: true, message: 'Seat booked successfully!' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Booking transaction failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    client.release();
  }
}
