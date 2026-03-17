export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-6">

        {/* Animated NORS N — SVG stroke draw animation */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="nors-loader"
        >
          {/* N shape — two vertical strokes connected by diagonal */}
          <path
            d="M15 85 L15 15 L85 85 L85 15"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            className="nors-n-path"
          />
        </svg>

        {/* Tagline */}
        <div className="flex flex-col items-center gap-1">
          <span
            className="text-white text-xs font-light tracking-[0.3em] uppercase nors-fade-in"
            style={{ fontFamily: 'Inter, Arial, sans-serif' }}
          >
            Gestão APV
          </span>
          <span
            className="text-xs tracking-widest nors-fade-in-delay"
            style={{
              color: '#9CC7DE',
              fontFamily: 'Inter, Arial, sans-serif',
              letterSpacing: '0.2em'
            }}
          >
            Making it work.
          </span>
        </div>
      </div>
    </div>
  )
}
