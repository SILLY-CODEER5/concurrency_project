import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Get the first event for simplicity
    const eventResult = await query('SELECT * FROM events LIMIT 1');
    const event = eventResult.rows[0];

    if (!event) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    const seatsResult = await query(
      'SELECT id, seat_number, status FROM seats WHERE event_id = $1 ORDER BY id',
      [event.id]
    );

    return NextResponse.json({
      event,
      seats: seatsResult.rows,
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
