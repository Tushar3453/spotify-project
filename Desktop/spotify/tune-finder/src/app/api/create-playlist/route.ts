import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/dbConnect';
import UserTopTracks from '@/models/UserTopTracks';

const API_BASE = `https://api.spotify.com/v1`;

interface Track {
    id: string;
    name: string;
    artist: string;
    albumArt: string;
    rank?: number; // rank is optional
}

interface CreatePlaylistBody {
    tracks: Track[];
    timeRange: string;
    name?: string;
    description?: string;
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.accessToken || !token.sub) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const body = await req.json() as CreatePlaylistBody;
    const { tracks, timeRange, name: customName, description: customDescription } = body;

    if (!tracks || tracks.length === 0) {
        return NextResponse.json({ error: 'No tracks provided' }, { status: 400 });
    }

    const userId = token.sub;

    try {
        const authHeader = {
            Authorization: `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json',
        };

        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        const titleRangeText = timeRange === 'short_term' ? "Last 4 Weeks" : timeRange === 'medium_term' ? "Last 6 Months" : "All Time";
        
        const playlistName = customName || `My Top Tracks ${date} (${titleRangeText})`;
        const playlistDescription = customDescription || `Your favorite tracks created by SoundSphere.`;

        // Create Playlist on Spotify (Common for both)
        const createPlaylistResponse = await fetch(`${API_BASE}/users/${userId}/playlists`, {
            method: "POST",
            headers: authHeader,
            body: JSON.stringify({
                name: playlistName,
                description: playlistDescription,
                public: false,
            }),
        });

        if (!createPlaylistResponse.ok) {
            console.error("Spotify API Error:", await createPlaylistResponse.text());
            throw new Error("Failed to create playlist on Spotify");
        }

        const newPlaylist = await createPlaylistResponse.json();

        // Add Tracks (Common for both)
        const trackUris = tracks.map((track) => `spotify:track:${track.id}`);

        const addTracksResponse = await fetch(`${API_BASE}/playlists/${newPlaylist.id}/tracks`, {
            method: "POST",
            headers: authHeader,
            body: JSON.stringify({
                uris: trackUris,
            }),
        });

        if (!addTracksResponse.ok) {
            console.error("Failed to add tracks:", await addTracksResponse.text());
        }

        // Save Snapshot to DB (ONLY if NOT AI Generated)
        if (timeRange !== 'ai_generated') {
            await dbConnect();
            
            const dbTracks = tracks.map((t) => ({
                trackId: t.id,
                name: t.name,
                artist: t.artist,
                albumArt: t.albumArt,
                rank: t.rank // include rank
            }));

            await UserTopTracks.create({
                userId,
                timeRange,
                tracks: dbTracks,
                lastUpdated: new Date()
            });
            console.log("History snapshot saved in DB");
        } else {
            console.log("AI Playlist created. Skipping DB save (No Rank needed).");
        }

        return NextResponse.json({
            message: "Playlist created successfully!",
            playlistUrl: newPlaylist.external_urls.spotify
        });

    } catch (error) {
        console.error("Error in create-playlist route:", error);
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}