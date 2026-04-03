import { getDemoTimetableResponse } from '../../config/timetableData.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const classId = Array.isArray(req.query?.classId)
    ? req.query.classId[0]
    : req.query?.classId;

  return res.status(200).json(getDemoTimetableResponse(classId));
}
