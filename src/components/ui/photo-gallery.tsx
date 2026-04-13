import { useState } from 'react';
import { cn } from '../../lib/utils';

export interface PixelEntry {
  id: string;
  date: string;
  image: string;
  url: string;
}

const DEFAULT_PIXELS: PixelEntry[] = [
  { id: '1', date: '12 Avril 2026', image: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131', url: '/pixel/1' },
  { id: '2', date: '10 Avril 2026', image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9', url: '/pixel/2' },
  { id: '3', date: '05 Avril 2026', image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1', url: '/pixel/3' },
];

export default function PhotoGallery({ entries = DEFAULT_PIXELS }: { entries?: PixelEntry[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const col1 = entries.filter((_, i) => i % 3 === 0);
  const col2 = entries.filter((_, i) => i % 3 === 1);
  const col3 = entries.filter((_, i) => i % 3 === 2);

  return (
    <div className="flex flex-col md:flex-row items-start gap-8 md:gap-10 lg:gap-14 select-none w-full max-w-5xl mx-auto py-8 px-4 md:px-6 font-sans">
      <div className="flex gap-2 md:gap-3 flex-shrink-0 overflow-x-auto pb-1 md:pb-0">
        <div className="flex flex-col gap-2 md:gap-3">
          {col1.map((p) => <PhotoCard key={p.id} entry={p} className="w-[110px] h-[120px] sm:w-[130px] sm:h-[140px] md:w-[155px] md:h-[165px]" hoveredId={hoveredId} onHover={setHoveredId} />)}
        </div>
        <div className="flex flex-col gap-2 md:gap-3 mt-[48px] sm:mt-[56px] md:mt-[68px]">
          {col2.map((p) => <PhotoCard key={p.id} entry={p} className="w-[122px] h-[132px] sm:w-[145px] sm:h-[155px] md:w-[172px] md:h-[182px]" hoveredId={hoveredId} onHover={setHoveredId} />)}
        </div>
        <div className="flex flex-col gap-2 md:gap-3 mt-[22px] sm:mt-[26px] md:mt-[32px]">
          {col3.map((p) => <PhotoCard key={p.id} entry={p} className="w-[115px] h-[125px] sm:w-[136px] sm:h-[146px] md:w-[162px] md:h-[172px]" hoveredId={hoveredId} onHover={setHoveredId} />)}
        </div>
      </div>
      <div className="flex flex-col sm:grid sm:grid-cols-2 md:flex md:flex-col gap-4 md:gap-5 pt-0 md:pt-2 flex-1 w-full">
        {entries.map((p) => <EntryRow key={p.id} entry={p} hoveredId={hoveredId} onHover={setHoveredId} />)}
      </div>
    </div>
  );
}

function PhotoCard({ entry, className, hoveredId, onHover }: { entry: PixelEntry; className: string; hoveredId: string | null; onHover: (id: string | null) => void; }) {
  const isActive = hoveredId === entry.id;
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <a href={entry.url} className={cn('overflow-hidden rounded-xl cursor-pointer flex-shrink-0 transition-opacity duration-400 block', className, isDimmed ? 'opacity-60' : 'opacity-100')} onMouseEnter={() => onHover(entry.id)} onMouseLeave={() => onHover(null)}>
      <img src={entry.image} alt={entry.date} className="w-full h-full object-cover transition-[filter] duration-500" style={{ filter: isActive ? 'grayscale(0) brightness(1)' : 'grayscale(1) brightness(0.77)' }} />
    </a>
  );
}

function EntryRow({ entry, hoveredId, onHover }: { entry: PixelEntry; hoveredId: string | null; onHover: (id: string | null) => void; }) {
  const isActive = hoveredId === entry.id;
  const isDimmed = hoveredId !== null && !isActive;

  return (
    <a href={entry.url} className={cn('cursor-pointer transition-opacity duration-300 block', isDimmed ? 'opacity-50' : 'opacity-100')} onMouseEnter={() => onHover(entry.id)} onMouseLeave={() => onHover(null)}>
      <div className="flex items-center gap-2.5">
        <span className={cn('w-4 h-3 rounded-[5px] flex-shrink-0 transition-all duration-300', isActive ? 'bg-foreground w-5' : 'bg-foreground/25')} />
        <span className={cn('text-base md:text-[18px] font-semibold leading-none tracking-tight transition-colors duration-300', isActive ? 'text-foreground' : 'text-foreground/80')}>
          {entry.date}
        </span>
      </div>
    </a>
  );
}