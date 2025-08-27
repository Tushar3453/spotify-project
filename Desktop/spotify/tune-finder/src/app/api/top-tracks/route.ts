import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks`;

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || !token.accessToken) {
        return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // taking time range from frontend
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('time_range') || 'medium_term';

    try {
        const response = await fetch(`${TOP_TRACKS_ENDPOINT}?time_range=${timeRange}&limit=50`, {
            headers: {
                Authorization: `Bearer ${token.accessToken}`,
            },
        });

        if (!response.ok) {
            console.error("Spotify API Error:", await response.text());
            return NextResponse.json({ error: 'Failed to fetch top tracks from Spotify' }, { status: response.status });
        }

        const data = await response.json();

        //  formatting data for frontend
        const tracks = data.items.map((item: any, index: number) => ({
            rank: index + 1,
            id: item.id,
            name: item.name,
            artist: item.artists.map((a: any) => a.name).join(', '),
            albumArt: item.album.images[0]?.url,
            spotifyUrl: item.external_urls.spotify,
        }));

        return NextResponse.json(tracks);

    } catch (error) {
        console.error("Internal Server Error:", error);
        return NextResponse.json({ error: 'An internal error occurred' }, { status: 500 });
    }
}
