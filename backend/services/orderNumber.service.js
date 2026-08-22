import Counter from '../models/Counter.js';

const ORDER_NUMBER_COUNTER_ID = 'orderNumber';

function pad6(n) {
  return String(n).padStart(6, '0');
}

// `new: true, upsert: true` makes the increment atomic and creates the counter
// row on first use. Concurrent callers never see the same sequence number.
export async function nextOrderNumber(now = new Date()) {
  const year = now.getUTCFullYear();
  const result = await Counter.findOneAndUpdate(
    { _id: ORDER_NUMBER_COUNTER_ID },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return `LM-${year}-${pad6(result.seq)}`;
}