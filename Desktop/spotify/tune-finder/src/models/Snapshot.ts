import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface for a single track within a snapshot
export interface ITrack extends Document {
  id: string;
  name: string;
  artist: string;
  albumArt: string;
  spotifyUrl: string;
  rank: number;
}

// Interface for the main Snapshot document
export interface ISnapshot extends Document {
  _id: Schema.Types.ObjectId;
  userId: string;
  timeRange: 'short_term' | 'medium_term' | 'long_term';
  tracks: ITrack[];
  createdAt: Date;
}

const TrackSchema: Schema<ITrack> = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  artist: { type: String, required: true },
  albumArt: { type: String, required: true },
  spotifyUrl: { type: String, required: true },
  rank: { type: Number, required: true },
});

const SnapshotSchema: Schema<ISnapshot> = new Schema({
  userId: { type: String, required: true, index: true }, // Index for faster queries
  timeRange: { type: String, required: true },
  tracks: [TrackSchema],
  createdAt: { type: Date, default: Date.now },
});

// THE CRITICAL FIX IS HERE:
// This line prevents the OverwriteModelError in a serverless environment.
// It checks if the model is already compiled and uses that, otherwise, it compiles a new one.
const SnapshotModel = (mongoose.models.Snapshot as Model<ISnapshot>) || mongoose.model<ISnapshot>('Snapshot', SnapshotSchema);

export default SnapshotModel;

