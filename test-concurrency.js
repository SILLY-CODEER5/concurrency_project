async function testConcurrency() {
  const seatId = 2; // Assuming seat with ID 2 is available
  const url = 'http://localhost:3000/api/book';
  
  console.log(`Starting concurrency test: 20 users trying to book seat ${seatId} at the EXACT same time...`);
  
  const requests = [];
  for (let i = 1; i <= 20; i++) {
    // We create the request promises and put them in an array
    const testUserId = (i % 2) + 1; // Only use userId 1 or 2 (which exist in DB)
    requests.push(
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seatId, userId: testUserId })
      })
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .catch(err => ({ error: err.message }))
    );
  }
  
  // Promise.all runs them concurrently
  const results = await Promise.all(requests);
  
  let successes = 0;
  let conflicts = 0;
  let errors = 0;
  
  results.forEach((res, index) => {
    if (res.status === 200) {
      console.log(`User ${index + 1}: ✅ SUCCESS`);
      successes++;
    } else if (res.status === 409) {
      console.log(`User ${index + 1}: ❌ CONFLICT (Seat Locked)`);
      conflicts++;
    } else {
      console.log(`User ${index + 1}: ⚠️ ERROR`, res);
      errors++;
    }
  });
  
  console.log('\n--- RESULTS ---');
  console.log(`Successes (should be 1): ${successes}`);
  console.log(`Conflicts (should be 19): ${conflicts}`);
  console.log(`Errors: ${errors}`);
  
  if (successes === 1 && conflicts === 19) {
    console.log('🎉 PESSIMISTIC LOCKING IS WORKING PERFECTLY! 🎉');
  } else {
    console.log('⚠️ Something went wrong with the locking mechanism.');
  }
}

testConcurrency();
