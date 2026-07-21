fetch('http://localhost:3000/api/admin/reset-seats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventId: 1 })
}).then(res => res.json()).then(console.log).catch(console.error);
