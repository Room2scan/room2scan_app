/**
 * LogoMark – react-native-svg version of logo.svg
 *
 * Faithfully replicates the gradient background + isometric cube.
 * Filter effects (Gaussian blur glow, backdrop-blur) are omitted because
 * react-native-svg does not support SVG filter primitives; the icon still looks
 * great at any size without them.
 *
 * Usage:
 *   <LogoMark size={40} />
 */
import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  G,
  ClipPath,
  Path,
} from 'react-native-svg';

interface LogoMarkProps {
  size?: number;
}

// ─── Geometry constants (original SVG userSpace) ─────────────────────────────
// viewBox cropped tightly to the visible icon: x 229→995, y 114→880 → 766×766
const VX = 229;
const VY = 114;
const VS = 766; // square crop

export const LogoMark = ({ size = 36 }: LogoMarkProps) => (
  <Svg
    width={size}
    height={size}
    viewBox={`${VX} ${VY} ${VS} ${VS}`}
  >
    <Defs>
      {/* ── Background gradient (light purple → deep blue, top-left → bottom-right) */}
      <LinearGradient
        id="lm_bg"
        x1="272" y1="114"
        x2="996" y2="838"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0"   stopColor="#E5E3FF" />
        <Stop offset="1"   stopColor="#4A3AFF" />
      </LinearGradient>

      {/* ── Stroke border gradient */}
      <LinearGradient
        id="lm_border"
        x1="272" y1="114"
        x2="996" y2="838"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0"        stopColor="#9E97FF" />
        <Stop offset="0.346"    stopColor="white"   stopOpacity="0.5" />
        <Stop offset="1"        stopColor="#6F65FF" />
      </LinearGradient>

      {/* ── Glass overlay gradient (top → bottom, very transparent) */}
      <LinearGradient
        id="lm_glass"
        x1="755" y1="143"
        x2="755" y2="904"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0"   stopColor="#E5E3FF" />
        <Stop offset="0.5" stopColor="white"   />
        <Stop offset="1"   stopColor="#E5E3FF" stopOpacity="0" />
      </LinearGradient>

      {/* ── Cube top face gradient (white subtle → white) */}
      <LinearGradient
        id="lm_cubeTop"
        x1="110" y1="0"
        x2="110" y2="220"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0" stopColor="white" stopOpacity="0.37" />
        <Stop offset="1" stopColor="white" />
      </LinearGradient>

      {/* ── Cube left face gradient */}
      <LinearGradient
        id="lm_cubeLeft"
        x1="210" y1="4.6"
        x2="-12.7" y2="4.6"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0"     stopColor="#9E97FF" />
        <Stop offset="0.923" stopColor="white"   stopOpacity="0.63" />
        <Stop offset="1"     stopColor="#CFCBFF" />
      </LinearGradient>

      {/* ── Cube right face gradient */}
      <LinearGradient
        id="lm_cubeRight"
        x1="-14.6" y1="-30.5"
        x2="237.6"  y2="231.7"
        gradientUnits="userSpaceOnUse"
      >
        <Stop offset="0"     stopColor="#9E97FF" />
        <Stop offset="0.639" stopColor="white"   stopOpacity="0.34" />
        <Stop offset="1"     stopColor="#CFCBFF" />
      </LinearGradient>

      {/* ── Hexagonal clip for the cube group */}
      <ClipPath id="lm_cubeClip">
        <Path d="M573.737 337.07C594.12 325.302 619.232 325.302 639.614 337.07L747.418 399.31C767.801 411.078 780.357 432.826 780.357 456.362V580.843C780.357 604.379 767.801 626.127 747.418 637.894L639.614 700.135C619.232 711.903 594.12 711.903 573.737 700.135L465.933 637.894C445.551 626.127 432.995 604.379 432.995 580.843V456.362C432.995 432.826 445.551 411.078 465.933 399.31L573.737 337.07Z" />
      </ClipPath>
    </Defs>

    {/* ── 1. Main background rounded square */}
    <Rect
      x="272" y="114"
      width="723" height="723"
      rx="100"
      fill="url(#lm_bg)"
    />

    {/* ── 2. Border stroke */}
    <Rect
      x="275" y="117"
      width="717" height="717"
      rx="97"
      fill="none"
      stroke="url(#lm_border)"
      strokeOpacity="0.4"
      strokeWidth="6"
    />

    {/* ── 3. Glass overlay card (slightly offset top-left → bottom-right) */}
    <Rect
      x="229" y="157"
      width="723" height="723"
      rx="100"
      fill="url(#lm_glass)"
      fillOpacity="0.28"
    />

    {/* ── 4. Glass card border */}
    <Rect
      x="232" y="160"
      width="717" height="717"
      rx="97"
      fill="none"
      stroke="url(#lm_border)"
      strokeOpacity="0.35"
      strokeWidth="6"
    />

    {/* ── 5. Isometric cube (3 parallelogram faces) */}
    <G clipPath="url(#lm_cubeClip)">
      {/* Top face */}
      <Rect
        width="219.832" height="219.832"
        transform="matrix(0.866025 0.5 -0.866025 0.5 606.679 314.783)"
        fill="url(#lm_cubeTop)"
      />
      {/* Left face */}
      <Rect
        width="202.275" height="202.275"
        transform="matrix(0.866025 0.5 -2.20305e-08 1 431.497 426.289)"
        fill="url(#lm_cubeLeft)"
      />
      {/* Right face */}
      <Rect
        width="202.275" height="202.275"
        transform="matrix(0.866025 -0.5 2.20305e-08 1 606.679 527.454)"
        fill="url(#lm_cubeRight)"
      />
    </G>
  </Svg>
);
