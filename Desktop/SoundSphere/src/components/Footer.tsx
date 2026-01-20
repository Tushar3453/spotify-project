export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
            <div className="max-w-5xl mx-auto py-6 px-4 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} TuneFinder. All Rights Reserved.</p>
                <p className="mt-1">Powered by Next.js and Spotify</p>
            </div>
        </footer>
    );
}
