import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  roomId: string;
  hostId: mongoose.Types.ObjectId;
  title: string;
  isActive: boolean;
  createdAt: Date;
  scheduledFor?: Date;
}

const MeetingSchema: Schema = new Schema({
  roomId: { type: String, required: true, unique: true },
  hostId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  scheduledFor: { type: Date },
});

export default mongoose.model<IMeeting>('Meeting', MeetingSchema);
