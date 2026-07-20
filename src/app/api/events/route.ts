import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const event = await prisma.events.findFirst();
    if (!event) {
      return NextResponse.json({ error: 'No events found' }, { status: 404 });
    }

    const seats = await prisma.seats.findMany({
      where: { event_id: event.id },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      event,
      seats,
    });
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
