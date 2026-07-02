/**
 * The brand system drawn as a pulley machine inside the studio house — the
 * cleaner greyscale illustration (Figma 483:1564). Four cogs map to the phases
 * clockwise from the top: Shape (top), System (right), Scale (bottom-left),
 * Sustain (left). The active cog takes the mint highlight (face #C2F5DA,
 * shadow #AAD6BF) instead of grey — colour only, no scaling — and its screw
 * hub spins (.mc-hub, see globals.css); the outer ring stays still. Purely
 * visual — interaction + a11y live in the overlay buttons in SystemCycle.
 */

const GREY_FACE = '#E9E9E9'
const GREY_SHADOW = '#C5C5C5'
const MINT_FACE = '#C2F5DA'
const MINT_SHADOW = '#AAD6BF'
const SW = 0.679426

export function SystemMachineGraphic({
  active,
  className,
}: {
  active: number
  className?: string
}) {
  const cls = (i: number) => `mc-cog${active === i ? ' mc-cog-active' : ''}`
  const face = (i: number) => (active === i ? MINT_FACE : GREY_FACE)
  const shadow = (i: number) => (active === i ? MINT_SHADOW : GREY_SHADOW)

  return (
    <svg viewBox="0 0 596.36 605.9" fill="none" className={className} aria-hidden>
      {/* House (roof, walls, inner wall) */}
      <g transform="translate(113.6, 98.38)">
        <path d="M386.195 191.834L229.319 34.9583L159.415 34.9458L72.443 191.834L386.195 191.834Z" fill={GREY_SHADOW} stroke="black" />
        <path d="M386.16 191.352H315.16V388.352H386.16V191.352Z" fill="white" stroke="black" />
        <path d="M386.16 191.354H315.16V388.354H386.16V191.354Z" fill={GREY_FACE} stroke="black" />
        <path d="M317.373 192.3H315.661V388.642H2.92195V192.3H1.20711L159.29 34.2168L317.373 192.3Z" fill="#B4B4B4" stroke="black" />
        <path d="M73.4141 191.353H2.41414L158.414 34.6143L194.414 69.7258L73.4141 191.353Z" fill={GREY_SHADOW} stroke="black" />
        <path d="M73.4141 191.354H2.41414V388.354H73.4141V191.354Z" fill={GREY_SHADOW} stroke="black" />
      </g>

      {/* Ground */}
      <rect x="50" y="486.53" width="496.356" height="47.713" fill="#6B463C" stroke="black" />
      <rect x="50" y="486.53" width="496.356" height="47.713" fill={GREY_FACE} stroke="black" />
      <rect x="50" y="486.53" width="496.356" height="17.803" fill={GREY_SHADOW} stroke="black" />
      <rect x="398.35" y="486.38" width="148" height="48" fill={GREY_FACE} stroke="black" />
      <rect x="398.35" y="486.38" width="148" height="18" fill={GREY_SHADOW} stroke="black" />

      {/* Smoke (rotated -15° about its centre) */}
      <g transform="translate(448.75, 117.32) rotate(-15) translate(-88.03, -58.88)">
        <path d="M137.197 0.5C158.39 0.500247 175.57 17.6802 175.57 38.873C175.57 60.0661 158.39 77.2468 137.197 77.2471C135.005 77.2471 132.855 77.0602 130.764 76.707C124.439 83.3543 115.507 87.499 105.607 87.499C96.4618 87.499 88.1436 83.961 81.9423 78.1816C76.1328 83.9392 68.1389 87.4971 59.3134 87.4971C53.9419 87.497 48.8793 86.1769 44.4286 83.8477C43.6258 87.4802 42.3522 91.2341 40.5897 94.9531C32.8711 111.24 18.7306 120.707 9.00577 116.099C-0.718991 111.49 -2.34553 94.551 5.37295 78.2637C10.75 66.9173 19.2441 58.8813 27.1903 56.6074C27.1742 56.1895 27.1649 55.7695 27.1649 55.3477C27.1649 41.9809 35.3224 30.5202 46.9306 25.6709C52.3685 13.5993 64.5053 5.19532 78.6044 5.19531C89.2993 5.19531 98.8632 10.0327 105.232 17.6367C112.109 7.30726 123.858 0.5 137.197 0.5Z" fill="white" stroke="black" />
      </g>

      {/* Chimney (over the smoke) */}
      <g transform="translate(364.83, 179.33)">
        <path d="M0.5 0.5H21.67V45.31L0.5 25.31V0.5Z" fill={GREY_SHADOW} stroke="black" />
      </g>
      <g transform="translate(386, 179.33)">
        <path d="M27.68 0.5H0.5V45.31H27.68V0.5Z" fill={GREY_FACE} stroke="black" />
      </g>

      {/* Pulleys + belts — original paint order preserved so the belt weaves
          correctly. Ring pairs (shadow + face) take the active colour. */}
      <g transform="translate(172.59, 226.68)">
        {/* System — right cog ring (idx 1) */}
        <g className={cls(1)}>
          <path className="mc-fill" d="M191.938 131.468C191.938 149.854 177.031 164.76 158.646 164.76C140.261 164.76 125.354 149.854 125.354 131.468C125.354 113.083 140.261 98.1765 158.646 98.1765C177.031 98.1765 191.938 113.083 191.938 131.468Z" fill={shadow(1)} stroke="black" strokeWidth={SW} />
          <path className="mc-fill" d="M183.785 131.468C183.785 149.854 168.878 164.76 150.493 164.76C132.108 164.76 117.201 149.854 117.201 131.468C117.201 113.083 132.108 98.1765 150.493 98.1765C168.878 98.1765 183.785 113.083 183.785 131.468Z" fill={face(1)} stroke="black" strokeWidth={SW} />
        </g>
        {/* Sustain — left cog ring (idx 3) */}
        <g className={cls(3)}>
          <path className="mc-fill" d="M94.101 105.65C94.101 124.036 79.1944 138.942 60.8091 138.942C42.4239 138.942 27.5172 124.036 27.5172 105.65C27.5172 87.2651 42.4239 72.3585 60.8091 72.3585C79.1944 72.3585 94.101 87.2651 94.101 105.65Z" fill={shadow(3)} stroke="black" strokeWidth={SW} />
          <path className="mc-fill" d="M85.9479 105.65C85.9479 124.036 71.0413 138.942 52.656 138.942C34.2707 138.942 19.3641 124.036 19.3641 105.65C19.3641 87.2651 34.2707 72.3585 52.656 72.3585C71.0413 72.3585 85.9479 87.2651 85.9479 105.65Z" fill={face(3)} stroke="black" strokeWidth={SW} />
        </g>
        {/* Belt — left run */}
        <path d="M130.257 0.665295C114.413 2.54051 101.735 15.4088 100.498 31.7558L95.063 103.123C94.0302 116.738 86.8283 129.145 75.5227 136.822L23.3292 172.248C9.11559 181.882 4.53626 200.716 12.7165 215.812C18.084 225.705 27.7047 231.792 38.0591 233.043C24.8375 234.687 11.3169 228.273 4.56343 215.812C-3.61685 200.716 0.962478 181.882 15.1761 172.248L67.3696 136.822C78.6752 129.145 85.8771 116.738 86.9099 103.123L92.3453 31.7558C93.7041 13.7646 108.923 -0.000542383 126.955 0.420702C128.069 0.447879 129.17 0.52941 130.257 0.665295Z" fill="#9F9F9F" stroke="black" strokeWidth={SW} />
        {/* Shape — top cog ring (idx 0) */}
        <g className={cls(0)}>
          <path className="mc-fill" d="M167.478 33.6316C167.478 52.0169 152.572 66.9235 134.186 66.9235C115.801 66.9235 100.894 52.0169 100.894 33.6316C100.894 15.2463 115.801 0.339713 134.186 0.339713C152.572 0.339713 167.478 15.2463 167.478 33.6316Z" fill={shadow(0)} stroke="black" strokeWidth={SW} />
          <path className="mc-fill" d="M159.325 33.6316C159.325 52.0169 144.418 66.9235 126.033 66.9235C107.648 66.9235 92.7413 52.0169 92.7413 33.6316C92.7413 15.2463 107.648 0.339713 126.033 0.339713C144.418 0.339713 159.325 15.2463 159.325 33.6316Z" fill={face(0)} stroke="black" strokeWidth={SW} />
        </g>
        {/* Scale — bottom-left cog ring (idx 2) */}
        <g className={cls(2)}>
          <path className="mc-fill" d="M75.0766 199.411C75.0766 217.797 60.17 232.703 41.7847 232.703C23.3994 232.703 8.49283 217.797 8.49283 199.411C8.49283 181.026 23.3994 166.119 41.7847 166.119C60.17 166.119 75.0766 181.026 75.0766 199.411Z" fill={shadow(2)} stroke="black" strokeWidth={SW} />
          <path className="mc-fill" d="M66.9235 199.411C66.9235 217.797 52.0169 232.703 33.6316 232.703C15.2463 232.703 0.339713 217.797 0.339713 199.411C0.339713 181.026 15.2463 166.119 33.6316 166.119C52.0169 166.119 66.9235 181.026 66.9235 199.411Z" fill={face(2)} stroke="black" strokeWidth={SW} />
        </g>
        {/* Belt — right run */}
        <path d="M169.27 166.759L58.4416 229.008C52.0007 232.636 44.8667 233.886 38.0589 233.043C42.2441 232.527 46.3886 231.195 50.2885 229.008L161.117 166.759C178.877 156.771 187.682 136.076 182.546 116.359L158.97 25.7912C155.45 12.2027 143.968 2.32387 130.257 0.666073C131.847 0.462245 133.464 0.380714 135.108 0.421479C150.246 0.774781 163.318 11.1292 167.123 25.7912L190.699 116.359C195.835 136.076 187.03 156.771 169.27 166.759Z" fill="#9F9F9F" stroke="black" strokeWidth={SW} />
      </g>

      {/* Screw hubs — the giveaway that a cog is turning. Shadow stays put;
          the face + slot (.mc-hub) spin when the cog is active. */}
      {/* Shape hub (top, idx 0) */}
      <g className={cls(0)} transform="translate(279.63, 244.06)">
        <path className="mc-fill" d="M31.9383 16.3096C31.9383 23.4386 26.1582 29.2187 19.0292 29.2187C11.9002 29.2187 6.12012 23.4386 6.12012 16.3096C6.12012 9.18061 11.9002 3.4005 19.0292 3.4005C26.1582 3.4005 31.9383 9.18061 31.9383 16.3096Z" fill={shadow(0)} stroke="black" strokeWidth={SW} />
        <g className="mc-hub">
          <path className="mc-fill" d="M4.05413 20.3642C1.81526 13.5959 5.48767 6.293 12.256 4.05413C19.0243 1.81526 26.3272 5.48767 28.5661 12.256C30.8049 19.0243 27.1325 26.3272 20.3642 28.5661C13.5959 30.8049 6.293 27.1325 4.05413 20.3642Z" fill={face(0)} stroke="black" strokeWidth={SW} />
          <path d="M3.83822 19.7203L28.3502 11.612" stroke="black" strokeWidth={SW} />
        </g>
      </g>
      {/* System hub (right, idx 1) */}
      <g className={cls(1)} transform="translate(302.41, 340.15)">
        <path className="mc-fill" d="M33.6342 18.0087C33.6342 25.1376 27.8541 30.9178 20.7251 30.9178C13.5962 30.9178 7.81605 25.1376 7.81605 18.0087C7.81605 10.8797 13.5962 5.09956 20.7251 5.09956C27.8541 5.09956 33.6342 10.8797 33.6342 18.0087Z" fill={shadow(1)} stroke="black" strokeWidth={SW} />
        <g className="mc-hub">
          <path className="mc-fill" d="M25.5148 7.50612C31.3147 11.6513 32.6564 19.7148 28.5112 25.5148C24.3659 31.3147 16.3025 32.6564 10.5025 28.5112C4.70256 24.3659 3.36091 16.3025 7.50612 10.5025C11.6513 4.70255 19.7148 3.3609 25.5148 7.50612Z" fill={face(1)} stroke="black" strokeWidth={SW} />
          <path d="M26.0662 7.90098L11.0539 28.906" stroke="black" strokeWidth={SW} />
        </g>
      </g>
      {/* Scale hub (bottom-left, idx 2) */}
      <g className={cls(2)} transform="translate(188.33, 410.92)">
        <path className="mc-fill" d="M30.7948 15.1637C30.7948 22.2927 25.0147 28.0728 17.8857 28.0728C10.7567 28.0728 4.97663 22.2927 4.97663 15.1637C4.97663 8.0347 10.7567 2.25459 17.8857 2.25459C25.0147 2.25459 30.7948 8.0347 30.7948 15.1637Z" fill={shadow(2)} stroke="black" strokeWidth={SW} />
        <g className="mc-hub">
          <path className="mc-fill" d="M2.49894 17.6628C1.11891 10.6687 5.67078 3.87897 12.6649 2.49894C19.659 1.11891 26.4487 5.67078 27.8288 12.6649C29.2088 19.659 24.6569 26.4487 17.6628 27.8288C10.6687 29.2088 3.87897 24.6569 2.49894 17.6628Z" fill={face(2)} stroke="black" strokeWidth={SW} />
          <path d="M2.36511 16.994L27.6949 11.9961" stroke="black" strokeWidth={SW} />
        </g>
      </g>
      {/* Sustain hub (left, idx 3) */}
      <g className={cls(3)} transform="translate(204.61, 314.46)">
        <path className="mc-fill" d="M33.54 17.9132C33.54 25.0422 27.7599 30.8223 20.6309 30.8223C13.5019 30.8223 7.72181 25.0422 7.72181 17.9132C7.72181 10.7842 13.5019 5.00413 20.6309 5.00413C27.7599 5.00413 33.54 10.7842 33.54 17.9132Z" fill={shadow(3)} stroke="black" strokeWidth={SW} />
        <g className="mc-hub">
          <path className="mc-fill" d="M25.109 28.6309C19.1903 32.6047 11.1695 31.0277 7.19572 25.109C3.22192 19.1903 4.79885 11.1695 10.7176 7.19572C16.6363 3.22192 24.6571 4.79885 28.6309 10.7176C32.6047 16.6363 31.0277 24.6571 25.109 28.6309Z" fill={face(3)} stroke="black" strokeWidth={SW} />
          <path d="M24.5444 29.0097L10.153 7.57454" stroke="black" strokeWidth={SW} />
        </g>
      </g>

      {/* Inner wall inset band (drawn last, per the source) */}
      <g transform="translate(112.64, 131.95)">
        <path d="M163.699 3.5293L305.2 146.396L315.2 156.491V353.5H305.2V156.491L158.699 8.57715L11.1999 157.498V353.5H1.19992V157.5H1.19894L11.1999 147.402L153.699 3.5293L156.699 0.5H160.699L163.699 3.5293Z" fill={GREY_FACE} stroke="black" strokeWidth={SW} />
      </g>
    </svg>
  )
}
