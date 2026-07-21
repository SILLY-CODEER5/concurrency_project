const globalForLocks = global as unknown as { seatLocks: Set<number> };

export const seatLocks = globalForLocks.seatLocks || new Set<number>();

if (process.env.NODE_ENV !== 'production') globalForLocks.seatLocks = seatLocks;

export const memoryLock = {
  acquire: (seatId: number) => {
    if (seatLocks.has(seatId)) return false;
    seatLocks.add(seatId);
    return true;
  },
  release: (seatId: number) => {
    seatLocks.delete(seatId);
  }
};
