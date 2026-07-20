# High-Concurrency Event Ticketing Platform 🎫

A production-ready event ticketing system designed to handle massive traffic spikes and prevent double-booking using robust PostgreSQL concurrency controls and Prisma ORM.

## 🚀 The Challenge

In a high-demand ticketing system (like buying concert tickets), thousands of users might attempt to purchase the exact same seat at the exact same millisecond. 

If the backend simply checks if a seat is available and then updates it, a **race condition** occurs. Multiple requests will read the seat as "AVAILABLE" simultaneously, and all of them will successfully "book" the seat, resulting in catastrophic double-booking data anomalies.

## 💡 The Solution

This platform solves the concurrency problem at the database level by leveraging **ACID Transactions** and **Pessimistic Locking** through Prisma's Interactive Transactions.

When a user attempts to book a seat, the backend executes the following logic:
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Lock the specific seat row exclusively for this transaction
  const lockResult = await tx.$queryRaw`
    SELECT * FROM seats 
    WHERE id = ${seatId} AND status = 'AVAILABLE' 
    FOR UPDATE SKIP LOCKED
  `;

  if (lockResult.length === 0) throw new Error('SEAT_LOCKED');

  // 2. Update the seat to BOOKED
  await tx.seats.update({
    where: { id: seatId },
    data: { status: 'BOOKED' },
  });

  // 3. Create the reservation record
  await tx.bookings.create({
    data: { user_id: userId, seat_id: seatId },
  });
});
```

### Key Technical Decisions:
- **`FOR UPDATE`**: Instructs PostgreSQL to lock the row. If another transaction tries to read or update this row, it must wait until the first transaction completes.
- **`SKIP LOCKED`**: Instead of making the secondary transactions wait in a queue (which could crash the database during a massive spike), this tells Postgres to immediately skip the locked row. Our query instantly returns `0` rows, allowing the backend to **fast-fail** and instantly tell the secondary users "This seat is no longer available."
- **Supabase Connection Pooling**: Integrated with Supabase's IPv4 transaction-mode pooler (port `6543`) to prevent serverless function connection exhaustion.

## 🛠️ Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: PostgreSQL (hosted via Supabase), Prisma ORM

## 🏎️ Running Locally

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Set up your `.env` file with your Supabase connection strings (required for Prisma):
   ```env
   # Connect to Postgres via the shared transaction-mode pooler
   DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

   # Connect to Postgres via the shared session-mode pooler (used for migrations)
   DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres"
   ```

3. Generate the Prisma Client (assuming the schema is already pushed):
   ```bash
   npx prisma generate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   *Visit `http://localhost:3000` to interact with the seat map.*

## 🧪 Load Testing Concurrency

To prove the locking mechanism works, this repository includes a concurrency load testing script. 
Run the following command while your server is running:

```bash
node test-concurrency.js
```

This script fires 20 simultaneous HTTP POST requests to book the exact same seat at the exact same millisecond. You will observe that exactly **1 request succeeds**, and the other 19 fail gracefully with a `409 Conflict` (Seat Locked), demonstrating perfect database consistency under pressure.
