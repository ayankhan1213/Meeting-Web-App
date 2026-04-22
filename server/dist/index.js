"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const socket_1 = require("./socket");
const auth_1 = __importDefault(require("./routes/auth"));
const meeting_1 = __importDefault(require("./routes/meeting"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/meetings', meeting_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Initialize Socket.io
(0, socket_1.initSocket)(server);
const PORT = process.env.PORT || 5000;
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-meeting')
    .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((err) => {
    console.error('MongoDB connection error:', err);
});
