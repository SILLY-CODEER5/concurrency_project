import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const { eventId, newDate } = await req.json();

    if (!eventId || !newDate) {
      return NextResponse.json({ error: 'Event ID and new date are required' }, { status: 400 });
    }

    const updatedEvent = await prisma.events.update({
      where: { id: eventId },
      data: { date: new Date(newDate) },
    });

    return NextResponse.json({ message: 'Event date updated successfully', event: updatedEvent });
  } catch (error) {
    console.error('Failed to update event date:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
