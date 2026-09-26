'use client';

/** Live demos for Tree, OrganizationChart, Carousel and Gallery. */

import { useState } from 'react';
import { FileText, Folder, Image as ImageIcon } from 'lucide-react';

import Tree, { type TreeNode } from '@/components/data/Tree';
import OrganizationChart, { type OrgChartNode } from '@/components/data/OrganizationChart';
import Carousel from '@/components/media/Carousel';
import Gallery, { type GalleryImage, type GalleryThumbnailsPosition } from '@/components/media/Gallery';
import { Row, Variant, useEcho } from './kit';

/* ------------------------------------------------------------------ tree --- */

const folder = <Folder />;
const file = <FileText />;

const FILES: TreeNode[] = [
  {
    key: 'docs',
    label: 'Documents',
    icon: folder,
    children: [
      {
        key: 'docs/work',
        label: 'Work',
        icon: folder,
        children: [
          { key: 'docs/work/plan', label: 'Quarterly plan.pdf', icon: file },
          { key: 'docs/work/budget', label: 'Budget draft.xlsx', icon: file },
          { key: 'docs/work/notes', label: 'Meeting notes.md', icon: file },
        ],
      },
      {
        key: 'docs/home',
        label: 'Home',
        icon: folder,
        children: [
          { key: 'docs/home/lease', label: 'Lease.pdf', icon: file },
          { key: 'docs/home/insurance', label: 'Insurance.pdf', icon: file, disabled: true },
        ],
      },
    ],
  },
  {
    key: 'media',
    label: 'Media',
    icon: folder,
    children: [
      { key: 'media/lake', label: 'Lake.jpg', icon: <ImageIcon /> },
      { key: 'media/forest', label: 'Forest.jpg', icon: <ImageIcon /> },
    ],
  },
  { key: 'readme', label: 'Readme.txt', icon: file },
];

// Children arrive after a short delay, as they would from an API.
const LAZY: TreeNode[] = [
  { key: 'a', label: 'Archive 2023', icon: folder },
  { key: 'b', label: 'Archive 2024', icon: folder },
  { key: 'c', label: 'Empty folder', icon: folder, leaf: true },
];

const loadChildren = (node: TreeNode) =>
  new Promise<TreeNode[]>((resolve) =>
    setTimeout(
      () =>
        resolve(
          ['Q1', 'Q2', 'Q3', 'Q4'].map((q) => ({ key: `${node.key}/${q}`, label: `${q} report.pdf`, icon: file, leaf: true })),
        ),
      700,
    ),
  );

export function TreeDemo() {
  const [checked, setChecked, echo] = useEcho<string[]>(['docs/work/plan']);
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <Row className="items-start">
      <Variant label="Checkbox + filter">
        <div className="w-72">
          <Tree
            nodes={FILES}
            selectionMode="checkbox"
            selectedKeys={checked}
            onSelectionChange={setChecked}
            defaultExpandedKeys={['docs', 'docs/work']}
            filter
            aria-label="Files"
          />
          {echo}
        </div>
      </Variant>
      <Variant label="Single, lazy children">
        <div className="w-64">
          <Tree
            nodes={LAZY}
            selectionMode="single"
            selectedKeys={picked}
            onSelectionChange={setPicked}
            onLoadChildren={loadChildren}
            aria-label="Archives"
          />
        </div>
      </Variant>
    </Row>
  );
}

/* ------------------------------------------------------------ org chart --- */

const TEAM: OrgChartNode[] = [
  {
    key: 'lead',
    label: 'Avery Stone',
    title: 'Director',
    avatar: 'AS',
    tone: 'info',
    children: [
      {
        key: 'eng',
        label: 'Jordan Lee',
        title: 'Engineering lead',
        avatar: 'JL',
        tone: 'success',
        children: [
          { key: 'eng-1', label: 'Sam Park', title: 'Frontend', avatar: 'SP' },
          { key: 'eng-2', label: 'Riley Chen', title: 'Backend', avatar: 'RC' },
          { key: 'eng-3', label: 'Morgan Diaz', title: 'Platform', avatar: 'MD' },
        ],
      },
      {
        key: 'design',
        label: 'Casey Brooks',
        title: 'Design lead',
        avatar: 'CB',
        tone: 'warning',
        children: [
          { key: 'design-1', label: 'Quinn Ellis', title: 'Product design', avatar: 'QE' },
          { key: 'design-2', label: 'Taylor Reed', title: 'Research', avatar: 'TR' },
        ],
      },
      {
        key: 'ops',
        label: 'Drew Morgan',
        title: 'Operations',
        avatar: 'DM',
        children: [{ key: 'ops-1', label: 'Jamie Fox', title: 'Support', avatar: 'JF' }],
      },
    ],
  },
];

export function OrganizationChartDemo() {
  const [value, setValue, echo] = useEcho<string | null>('eng');
  return (
    <div>
      <OrganizationChart nodes={TEAM} selectable value={value} onChange={(k) => setValue(k)} defaultCollapsedKeys={['ops']} />
      {echo}
    </div>
  );
}

/* ------------------------------------------------------------- carousel --- */

const SEEDS = ['lake', 'forest', 'desert', 'harbor', 'meadow', 'canyon', 'glacier', 'valley'];

export function CarouselDemo() {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {(['horizontal', 'vertical'] as const).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => setOrientation(o)}
            aria-pressed={orientation === o}
            className={orientation === o ? 'btn-primary' : 'btn-ghost'}
          >
            {o}
          </button>
        ))}
      </div>
      <Carousel
        key={orientation}
        items={SEEDS}
        orientation={orientation}
        numVisible={orientation === 'vertical' ? 2 : 3}
        numScroll={1}
        circular
        autoplayInterval={4000}
        verticalViewportHeight="360px"
        responsiveOptions={[
          { breakpoint: 640, numVisible: 2, numScroll: 1 },
          { breakpoint: 420, numVisible: 1, numScroll: 1 },
        ]}
        aria-label="Sample photos"
        className={orientation === 'vertical' ? 'max-w-xs' : undefined}
        itemTemplate={(seed, i) => (
          <div className="panel panel-solid h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://picsum.photos/seed/${seed}/480/300`}
              alt=""
              loading="lazy"
              className={`${orientation === 'vertical' ? 'h-28' : 'aspect-[16/10]'} w-full bg-slate-100 object-cover dark:bg-slate-800`}
            />
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">Photo {SEEDS.indexOf(seed) + 1}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Random sample image</p>
            </div>
          </div>
        )}
      />
    </div>
  );
}

/* -------------------------------------------------------------- gallery --- */

// The seeds only make the random photos repeatable; they say nothing about
// what each photo shows, so the captions do not pretend to.
const PHOTOS: GalleryImage[] = SEEDS.map((seed, i) => ({
  src: `https://picsum.photos/seed/${seed}/1200/750`,
  thumbnail: `https://picsum.photos/seed/${seed}/160/112`,
  alt: `Sample photo ${i + 1}`,
  caption: (
    <>
      <span className="font-semibold">Photo {i + 1}</span> of {SEEDS.length} — random sample image
    </>
  ),
}));

export function GalleryDemo() {
  const [position, setPosition] = useState<GalleryThumbnailsPosition>('bottom');
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <div className="flex flex-wrap gap-1">
        {(['bottom', 'top', 'left', 'right'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPosition(p)}
            aria-pressed={position === p}
            className={position === p ? 'btn-primary' : 'btn-ghost'}
          >
            {p}
          </button>
        ))}
      </div>
      <Gallery images={PHOTOS} thumbnailsPosition={position} circular aria-label="Landscapes" />
    </div>
  );
}
