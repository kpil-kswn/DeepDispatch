export default function Logo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 80" className="h-10 w-auto">
      <defs>
        {/* Blue gradient for "Deep" */}
        <linearGradient id="deepGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" /> 
          <stop offset="100%" stopColor="#1d4ed8" /> 
        </linearGradient>
        
        {/* Emerald/Cyan gradient for "Dispatch" */}
        <linearGradient id="dispatchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#06b6d4" /> 
          <stop offset="100%" stopColor="#10b981" /> 
        </linearGradient>
      </defs>

      {/* Logo Mark: Neural layers turning into a dispatch arrow */}
      <g transform="translate(10, 15)">
        {/* Layer 1 (Back) */}
        <path d="M 0,10 L 15,10 L 25,25 L 15,40 L 0,40 L 10,25 Z" fill="#1e3a8a" opacity="0.4"/>
        {/* Layer 2 (Middle) */}
        <path d="M 12,10 L 27,10 L 37,25 L 27,40 L 12,40 L 22,25 Z" fill="url(#deepGrad)" opacity="0.8"/>
        {/* Layer 3 (Front/Action) */}
        <path d="M 24,10 L 39,10 L 49,25 L 39,40 L 24,40 L 34,25 Z" fill="url(#dispatchGrad)"/>
      </g>

      {/* Wordmark */}
      <text x="70" y="44" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="900" fill="#f3f4f6" letterSpacing="-0.5">DEEP</text>
      <text x="145" y="44" fontFamily="system-ui, -apple-system, sans-serif" fontSize="26" fontWeight="900" fill="url(#dispatchGrad)" letterSpacing="-0.5">DISPATCH</text>
      
      {/* Subtitle */}
      <text x="73" y="62" fontFamily="system-ui, -apple-system, sans-serif" fontSize="10" fontWeight="700" fill="#9ca3af" letterSpacing="3.5">AI VPP OPTIMIZER</text>
    </svg>
  );
}