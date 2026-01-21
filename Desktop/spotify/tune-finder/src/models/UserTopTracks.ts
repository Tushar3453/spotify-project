import { Schema, model, models } from 'mongoose';

const TrackSchema = new Schema({
  trackId: { type: String, required: true },
  name: { type: String, required: true },
  artist: { type: String, required: true },
  albumArt: { type: String },
  rank: { type: Number, required: true },
  previewUrl: { type: String }
});

const UserTopTracksSchema = new Schema({
  userId: { type: String, required: true, index: true },
  timeRange: { type: String, required: true }, // 'short_term', 'medium_term', 'long_term'
  lastUpdated: { type: Date, default: Date.now },
  tracks: [TrackSchema]
});

// Prevent model recompilation error in Next.js hot reload
const UserTopTracks = models.UserTopTracks || model('UserTopTracks', UserTopTracksSchema);

export default UserTopTracks;