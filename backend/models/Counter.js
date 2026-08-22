import mongoose from 'mongoose';

// Generic atomic counter. Multiple counters coexist by `_id`:
//   { _id: 'orderNumber', seq: 42 }
//
// Incremented atomically via findOneAndUpdate + $inc; safe under concurrency.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0, min: 0 },
});

export default mongoose.model('Counter', counterSchema);