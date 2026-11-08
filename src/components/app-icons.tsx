import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement> & { size?: number };
function Glyph({ size = 24, children, ...props }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}
export function HomeIcon(props: Props) {
  return (
    <Glyph {...props}>
      <path d="M4 10.5 12 4l8 6.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5Z" />
      <path d="M9 20v-6h6v6" />
    </Glyph>
  );
}
export function AlbumIcon(props: Props) {
  return (
    <Glyph {...props}>
      <rect x="5" y="3.5" width="14" height="17" rx="3" />
      <path d="M8.5 3.5v17M12 8h3.5M12 11h3.5" />
    </Glyph>
  );
}
export function SwapIcon(props: Props) {
  return (
    <Glyph {...props}>
      <path d="M4 8h15m-4-4 4 4-4 4M20 16H5m4-4-4 4 4 4" />
    </Glyph>
  );
}
export function FriendsIcon(props: Props) {
  return (
    <Glyph {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-1.5a6 6 0 0 1 12 0V20M16 5.5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 4.5V20" />
    </Glyph>
  );
}
export function ProfileIcon(props: Props) {
  return (
    <Glyph {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="9" r="2.75" />
      <path d="M6 18.5a6 6 0 0 1 12 0" />
    </Glyph>
  );
}
export function CardsIcon(props: Props) {
  return (
    <Glyph {...props}>
      <rect x="8" y="6" width="12" height="15" rx="2.5" />
      <path d="M15.5 3H6a2 2 0 0 0-2 2v12M12 11h4M12 15h2" />
    </Glyph>
  );
}
