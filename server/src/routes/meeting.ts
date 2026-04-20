import express, { Request, Response } from 'express';
import Meeting from '../models/Meeting';
// Note: We would typically add a protect middleware here to ensure user is logged in
// import { protect } from '../middlewares/auth';

const router = express.Router();

// @route   POST api/meetings/create
// @desc    Create a new meeting
// @access  Private (mocked as public for now)
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { hostId, title, scheduledFor } = req.body;
    
    // Generate a simple 9-character room ID (e.g. abc-def-ghi)
    const generateRoomId = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz';
      const segment = () => Array.from({length: 3}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      return `${segment()}-${segment()}-${segment()}`;
    };

    const roomId = generateRoomId();

    const newMeeting = new Meeting({
      roomId,
      hostId,
      title,
      scheduledFor
    });

    await newMeeting.save();

    res.status(201).json(newMeeting);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/meetings/:roomId
// @desc    Get meeting details by roomId
// @access  Public
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const meeting = await Meeting.findOne({ roomId: req.params.roomId });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err: any) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
