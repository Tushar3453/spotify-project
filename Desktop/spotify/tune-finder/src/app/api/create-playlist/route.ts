import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/dbConnect';
import UserTopTracks from '@/models/UserTopTracks';

const API_BASE = `https://api.spotify.com/v1`;

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.accessToken || !token.sub) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    
    const { tracks, timeRange } = await req.json();

    if (!tracks || tracks.length === 0) {
        return NextResponse.json({ error: 'No tracks provided' }, { status: 400 });
    }

    const userId = token.sub;

    try {
        await dbConnect();

        // 1. Create Playlist on Spotify
        const authHeader = {
            Authorization: `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json',
        };

        const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        let titleRangeText = timeRange === 'short_term' ? "Last 4 Weeks" : timeRange === 'medium_term' ? "Last 6 Months" : "All Time";
        
        const playlistName = `My Top Tracks ${date} (${titleRangeText})`;
        const description = `Your favorite tracks created by SoundSphere.`;

        const createPlaylistResponse = await fetch(`${API_BASE}/users/${userId}/playlists`, {
            method: "POST",
            headers: authHeader,
            body: JSON.stringify({ name: playlistName, description, public: false }),
        });

        if (!createPlaylistResponse.ok) throw new Error("Failed to create playlist on Spotify");

        const newPlaylist = await createPlaylistResponse.json();
        
        // Add Tracks to Spotify Playlist
        const trackUris = tracks.map((track: any) => `spotify:track:${track.id}`);
        await fetch(`${API_BASE}/playlists/${newPlaylist.id}/tracks`, {
            method: "POST",
            headers: authHeader,
            body: JSON.stringify({ uris: trackUris }),
        });

        // 2. SAVE SNAPSHOT TO MONGODB (The missing link!)
        // We format tracks to match our Schema
        const dbTracks = tracks.map((t: any) => ({
            trackId: t.id,
            name: t.name,
            artist: t.artist,
            albumArt: t.albumArt,
            rank: t.rank
        }));

        await UserTopTracks.create({
            userId,
            timeRange,
            tracks: dbTracks,
            lastUpdated: new Date()
        });

        console.log("Snapshot saved in db");
        return NextResponse.json({ 
            message: "Playlist created and snapshot saved!", 
            playlistUrl: newPlaylist.external_urls.spotify 
        });

    } catch (error) {
        console.error("Error in create-playlist route:", error);
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}