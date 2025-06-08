import Counter from '../models/Counter.js';

export const getNextRoomCode = async (facultyCode) => {
  const counter = await Counter.findOneAndUpdate(
    { facultyCode },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedNumber = String(counter.seq).padStart(3, '0');
  return `${facultyCode.toLowerCase()}-${paddedNumber}`;
};
