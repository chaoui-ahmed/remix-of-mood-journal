export default function HeartWallpaper() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden relative font-serif">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-900/50 blur-[120px] rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-orange-600/40 blur-[90px] rounded-full" />

            <div className="relative z-10 flex items-center text-[20rem] md:text-[30rem] text-white/90 drop-shadow-2xl">
                <span className="rotate-[12deg] translate-x-12">2</span>
                <span className="-scale-x-100 rotate-[12deg] -translate-x-12">2</span>
            </div>
        </div>
    );
}