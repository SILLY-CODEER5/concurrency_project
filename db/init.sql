CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    total_seats INTEGER NOT NULL
);

CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    UNIQUE (event_id, seat_number)
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    seat_id INTEGER REFERENCES seats(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data
INSERT INTO users (name, email) VALUES
('Test User 1', 'user1@example.com'),
('Test User 2', 'user2@example.com');

INSERT INTO events (name, date, total_seats) VALUES
('Tech Conference 2026', '2026-10-15 09:00:00', 50);

-- Generate seats for event 1
DO $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..50 LOOP
        INSERT INTO seats (event_id, seat_number, status)
        VALUES (1, 'S' || i, 'AVAILABLE');
    END LOOP;
END $$;
