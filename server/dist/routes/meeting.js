"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Meeting_1 = __importDefault(require("../models/Meeting"));
// Note: We would typically add a protect middleware here to ensure user is logged in
// import { protect } from '../middlewares/auth';
const router = express_1.default.Router();
// @route   POST api/meetings/create
// @desc    Create a new meeting
// @access  Private (mocked as public for now)
router.post('/create', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { hostId, title, scheduledFor } = req.body;
        // Generate a simple 9-character room ID (e.g. abc-def-ghi)
        const generateRoomId = () => {
            const chars = 'abcdefghijklmnopqrstuvwxyz';
            const segment = () => Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            return `${segment()}-${segment()}-${segment()}`;
        };
        const roomId = generateRoomId();
        const newMeeting = new Meeting_1.default({
            roomId,
            hostId,
            title,
            scheduledFor
        });
        yield newMeeting.save();
        res.status(201).json(newMeeting);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}));
// @route   GET api/meetings/:roomId
// @desc    Get meeting details by roomId
// @access  Public
router.get('/:roomId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const meeting = yield Meeting_1.default.findOne({ roomId: req.params.roomId });
        if (!meeting) {
            return res.status(404).json({ message: 'Meeting not found' });
        }
        res.json(meeting);
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
}));
exports.default = router;
