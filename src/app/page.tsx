'use client';

import { useEffect, useState } from 'react';

type Seat = {
  id: number;
  seat_number: string;
  status: 'AVAILABLE' | 'BOOKED' | 'LOCKED';
};

type Event = {
  id: number;
  name: string;
  date: string;
  total_seats: number;
};

export default function Home() {
  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookingMessage, setBookingMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isBooking, setIsBooking] = useState<number | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvent(data.event);
      setSeats(data.seats);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // Poll for updates every 3 seconds to keep UI fresh
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleBook = async (seatId: number) => {
    setBookingMessage(null);
    setIsBooking(seatId);
    try {
      // Hardcode user ID 1 for testing
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId, userId: 1 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setBookingMessage({ type: 'error', text: data.error });
        // Refetch immediately to update status if someone else booked it
        fetchEvents();
      } else {
        setBookingMessage({ type: 'success', text: data.message });
        // Optimistically update the seat to booked locally
        setSeats(seats.map(s => s.id === seatId ? { ...s, status: 'BOOKED' } : s));
      }
    } catch (err) {
      setBookingMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsBooking(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-red-500 font-medium p-6 text-center">
        <p className="text-2xl mb-2">Could not connect to Database</p>
        <p className="text-neutral-400">{error}</p>
        <p className="text-neutral-500 mt-4 text-sm">Please make sure PostgreSQL is running and the database is initialized.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      <main className="max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-white to-neutral-400 bg-clip-text text-transparent mb-4">
            {event?.name}
          </h1>
          <p className="text-neutral-400 text-lg flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {event ? new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ''}
          </p>
        </header>

        {bookingMessage && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 backdrop-blur-sm transition-all animate-in fade-in slide-in-from-top-4 ${
            bookingMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            {bookingMessage.type === 'success' ? (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-medium">{bookingMessage.text}</p>
          </div>
        )}

        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-10 text-center">
            <div className="inline-block w-48 h-2 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
            <p className="text-neutral-500 text-sm mt-2 font-medium tracking-widest uppercase">Stage</p>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {seats.map((seat) => {
              const isAvailable = seat.status === 'AVAILABLE';
              const isLoading = isBooking === seat.id;
              
              return (
                <button
                  key={seat.id}
                  onClick={() => handleBook(seat.id)}
                  disabled={!isAvailable || isBooking !== null}
                  className={`
                    relative group aspect-square rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-300
                    ${isAvailable 
                      ? 'bg-neutral-800 hover:bg-emerald-500 hover:text-white text-neutral-400 border border-neutral-700/50 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:-translate-y-1' 
                      : 'bg-neutral-950 text-neutral-700 border border-neutral-900 cursor-not-allowed opacity-60'}
                    ${isLoading ? 'animate-pulse bg-emerald-500/50 border-emerald-500' : ''}
                  `}
                >
                  {isLoading ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    seat.seat_number
                  )}
                  {isAvailable && (
                    <span className="absolute -inset-0.5 rounded-xl border border-emerald-500/0 group-hover:border-emerald-500/50 transition-colors duration-300 pointer-events-none"></span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-neutral-800 border border-neutral-700"></div>
              <span className="text-neutral-400">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-neutral-950 border border-neutral-900"></div>
              <span className="text-neutral-600">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              <span className="text-neutral-400">Selected / Hover</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
