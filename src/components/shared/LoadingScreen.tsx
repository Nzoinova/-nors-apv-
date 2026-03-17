// LoadingScreen.tsx — NORS APV
// Uses the actual NORS N logo vectorised from the official brand asset

export default function LoadingScreen() {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        flexDirection: 'column',
        gap: '28px',
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* NORS N Logo — animated reveal */}
      <div className="nors-loader-n">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 445 403"
          width="72"
          height="72"
          style={{ display: 'block' }}
        >
          {/* Teal glow layer */}
          <g transform="translate(0,403) scale(0.1,-0.1)" fill="#9CC7DE" opacity="0.15">
            <path d="M1225 3440 c-320 -50 -593 -252 -729 -541 -86 -182 -80 -90 -86
-1212 l-5 -997 412 0 413 0 2 1136 c3 1070 4 1137 21 1148 11 7 22 8 33 1 8
-6 114 -203 235 -440 121 -236 276 -538 343 -670 68 -132 183 -357 257 -500
157 -308 194 -366 291 -463 431 -432 1173 -353 1505 161 58 89 89 161 121 277
l26 95 4 973 3 972 -415 0 -416 0 0 -1134 c0 -1218 2 -1168 -48 -1152 -14 5
-164 289 -497 939 -263 513 -498 963 -523 1001 -123 186 -320 323 -552 383
-107 28 -293 38 -395 23z"/>
          </g>
          {/* Main white N */}
          <g transform="translate(0,403) scale(0.1,-0.1)" fill="white">
            <path d="M1225 3440 c-320 -50 -593 -252 -729 -541 -86 -182 -80 -90 -86
-1212 l-5 -997 412 0 413 0 2 1136 c3 1070 4 1137 21 1148 11 7 22 8 33 1 8
-6 114 -203 235 -440 121 -236 276 -538 343 -670 68 -132 183 -357 257 -500
157 -308 194 -366 291 -463 431 -432 1173 -353 1505 161 58 89 89 161 121 277
l26 95 4 973 3 972 -415 0 -416 0 0 -1134 c0 -1218 2 -1168 -48 -1152 -14 5
-164 289 -497 939 -263 513 -498 963 -523 1001 -123 186 -320 323 -552 383
-107 28 -293 38 -395 23z"/>
          </g>
        </svg>
      </div>

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <span className="nors-loader-text" style={{ color: 'white', fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          APV
        </span>
        <span className="nors-loader-tagline" style={{ color: '#9CC7DE', fontSize: '10px', letterSpacing: '0.2em' }}>
          Making it work.
        </span>
      </div>
    </div>
  )
}
