'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

export default function AdminPanel() {
  const [event, setEvent] = useState<Event | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isUpdatingDate, setIsUpdatingDate] = useState(false);
  const [newDate, setNewDate] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      const data = await res.json();
      setEvent(data.event);
      setSeats(data.seats);
      
      // Initialize date input if not yet set
      if (data.event && !newDate) {
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        const d = new Date(data.event.date);
        const isoString = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          .toISOString()
          .slice(0, 16);
        setNewDate(isoString);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleResetSeats = async () => {
    if (!event) return;
    if (!confirm('Are you sure you want to reset ALL seats for this event? This will delete all bookings.')) return;

    setMessage(null);
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset-seats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to reset seats' });
      } else {
        setMessage({ type: 'success', text: 'All seats have been reset successfully!' });
        await fetchEvents();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleUpdateDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !newDate) return;

    setMessage(null);
    setIsUpdatingDate(true);
    try {
      const res = await fetch('/api/admin/update-date', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, newDate: new Date(newDate).toISOString() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to update date' });
      } else {
        setMessage({ type: 'success', text: 'Event date updated successfully!' });
        await fetchEvents();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setIsUpdatingDate(false);
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
      </div>
    );
  }

  const bookedCount = seats.filter(s => s.status === 'BOOKED').length;
  const availableCount = seats.filter(s => s.status === 'AVAILABLE').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <header className="mb-8 sm:mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1 sm:mb-2">
              Admin Control Panel
            </h1>
            <p className="text-neutral-400 text-sm sm:text-base">
              Manage your ticketing events.
            </p>
          </div>
          <Link href="/" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto text-center">
            &larr; Back to App
          </Link>
        </header>

        {message && (
          <div className={`mb-8 p-4 rounded-xl border flex items-center gap-3 backdrop-blur-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {event && (
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Event Details Card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg sm:text-xl font-bold mb-4 text-emerald-400">{event.name}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Current Date:</span>
                  <span className="text-white font-medium">
                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Total Seats:</span>
                  <span className="text-white font-medium">{event.total_seats}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Booked Seats:</span>
                  <span className="text-amber-400 font-medium">{bookedCount}</span>
                </div>
                <div className="flex justify-between border-b border-neutral-800 pb-2">
                  <span className="text-neutral-500">Available Seats:</span>
                  <span className="text-emerald-400 font-medium">{availableCount}</span>
                </div>
              </div>

              {/* Danger Zone - Reset Seats */}
              <div className="mt-8 pt-6 border-t border-red-500/20">
                <h3 className="text-lg font-bold text-red-400 mb-2">Danger Zone</h3>
                <p className="text-neutral-500 text-sm mb-4">
                  Resetting seats will clear all current bookings. This action cannot be undone.
                </p>
                <button
                  onClick={handleResetSeats}
                  disabled={isResetting}
                  className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? 'Resetting...' : 'Reset All Seats'}
                </button>
              </div>
            </div>

            {/* Actions Card */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-xl">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-white">Update Event Settings</h2>
              
              <form onSubmit={handleUpdateDate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-2">
                    Event Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isUpdatingDate}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingDate ? 'Saving...' : 'Update Date'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
