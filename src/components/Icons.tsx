import type { ReactNode, SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 24, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...rest}>
      {children}
    </svg>
  );
}

const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const PlayIcon = (p: P) => <Svg {...p}><path d="M6 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L7.5 3.64A1 1 0 0 0 6 4.5Z" fill="currentColor" /></Svg>;
export const PlusIcon = (p: P) => <Svg {...p}><path d="M12 5v14M5 12h14" {...stroke} /></Svg>;
export const CheckIcon = (p: P) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} /></Svg>;
export const InfoIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9.5" {...stroke} /><path d="M12 11v6M12 7.5v.01" {...stroke} strokeWidth={2.4} /></Svg>;
export const ChevronDown = (p: P) => <Svg {...p}><path d="m6 9 6 6 6-6" {...stroke} /></Svg>;
export const ChevronLeft = (p: P) => <Svg {...p}><path d="m15 5-7 7 7 7" {...stroke} strokeWidth={2.6} /></Svg>;
export const ChevronRight = (p: P) => <Svg {...p}><path d="m9 5 7 7-7 7" {...stroke} strokeWidth={2.6} /></Svg>;
export const SearchIcon = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="7" {...stroke} /><path d="m20 20-3.5-3.5" {...stroke} /></Svg>;
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" {...stroke} /></Svg>;
export const BellIcon = (p: P) => <Svg {...p}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z" {...stroke} /><path d="M10 20.5a2 2 0 0 0 4 0" {...stroke} /></Svg>;
export const BackIcon = (p: P) => <Svg {...p}><path d="M20 12H5m6-7-7 7 7 7" {...stroke} /></Svg>;
export const VolumeOn = (p: P) => <Svg {...p}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" {...stroke} /></Svg>;
export const VolumeOff = (p: P) => <Svg {...p}><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" /><path d="m16 9.5 5 5m0-5-5 5" {...stroke} /></Svg>;
export const ReplayIcon = (p: P) => <Svg {...p}><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" {...stroke} /></Svg>;
export const ExternalIcon = (p: P) => <Svg {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" {...stroke} /></Svg>;
export const PencilIcon = (p: P) => <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16v4Z" {...stroke} /></Svg>;
export const ThumbUp = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <Svg {...rest}>
      <path d="M7 10v10H4V10h3Zm0 0 4-7a2 2 0 0 1 2.9 2.2L13 9.5h5.7a2 2 0 0 1 2 2.4l-1.5 6.5a2 2 0 0 1-2 1.6H7" {...stroke} fill={filled ? 'currentColor' : 'none'} />
    </Svg>
  );
};
export const ThumbDown = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <Svg {...rest} style={{ transform: 'rotate(180deg)' }}>
      <path d="M7 10v10H4V10h3Zm0 0 4-7a2 2 0 0 1 2.9 2.2L13 9.5h5.7a2 2 0 0 1 2 2.4l-1.5 6.5a2 2 0 0 1-2 1.6H7" {...stroke} fill={filled ? 'currentColor' : 'none'} />
    </Svg>
  );
};
export const DoubleThumb = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return (
    <Svg {...rest}>
      <path d="M5 11v8H2.5v-8H5Zm0 0 3-5.5a1.6 1.6 0 0 1 2.3 1.8L9.8 10h4a1.6 1.6 0 0 1 1.6 1.9l-1 5a1.6 1.6 0 0 1-1.6 1.3H5" {...stroke} strokeWidth={1.7} fill={filled ? 'currentColor' : 'none'} />
      <path d="M12 6.5 14 3a1.6 1.6 0 0 1 2.3 1.8L15.8 7.5h3.7a1.6 1.6 0 0 1 1.6 1.9l-1 5a1.6 1.6 0 0 1-1.6 1.3h-1.7" {...stroke} strokeWidth={1.7} fill={filled ? 'currentColor' : 'none'} />
    </Svg>
  );
};
export const HomeIcon = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return <Svg {...rest}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9.5Z" {...stroke} fill={filled ? 'currentColor' : 'none'} /></Svg>;
};
export const SparkIcon = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return <Svg {...rest}><path d="M12 3c.6 3.9 2.6 6.4 6.5 7.5-3.9 1.1-5.9 3.6-6.5 7.5-.6-3.9-2.6-6.4-6.5-7.5C9.4 9.4 11.4 6.9 12 3Z" {...stroke} fill={filled ? 'currentColor' : 'none'} /><path d="M18.5 16.5c.2 1.3.9 2.1 2 2.5-1.1.4-1.8 1.2-2 2.5-.2-1.3-.9-2.1-2-2.5 1.1-.4 1.8-1.2 2-2.5Z" fill="currentColor" /></Svg>;
};
export const GridIcon = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  const f = filled ? 'currentColor' : 'none';
  return <Svg {...rest}><rect x="4" y="4" width="7" height="7" rx="1.5" {...stroke} fill={f} /><rect x="13" y="4" width="7" height="7" rx="1.5" {...stroke} fill={f} /><rect x="4" y="13" width="7" height="7" rx="1.5" {...stroke} fill={f} /><rect x="13" y="13" width="7" height="7" rx="1.5" {...stroke} fill={f} /></Svg>;
};
export const BookmarkIcon = (p: P & { filled?: boolean }) => {
  const { filled, ...rest } = p;
  return <Svg {...rest}><path d="M6.5 4h11a1 1 0 0 1 1 1v15.5L12 16.5l-6.5 4V5a1 1 0 0 1 1-1Z" {...stroke} fill={filled ? 'currentColor' : 'none'} /></Svg>;
};
export const YoutubeIcon = (p: P) => <Svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="3.5" {...stroke} /><path d="m10 9.2 5 2.8-5 2.8V9.2Z" fill="currentColor" /></Svg>;
