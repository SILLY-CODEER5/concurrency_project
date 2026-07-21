import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { eventId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Find all seats for this event
    const seatsForEvent = await prisma.seats.findMany({
      where: { event_id: eventId },
      select: { id: true }
    });
    
    const seatIds = seatsForEvent.map((s: { id: number }) => s.id);

    // Run transaction to delete bookings and update seat status
    await prisma.$transaction([
      prisma.bookings.deleteMany({
        where: {
          seat_id: { in: seatIds },
        },
      }),
      prisma.seats.updateMany({
        where: { event_id: eventId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    return NextResponse.json({ message: 'Seats reset successfully' });
  } catch (error) {
    console.error('Failed to reset seats:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
