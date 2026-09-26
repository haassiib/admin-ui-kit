'use client';

/** Demos for Fieldset, Divider, Accordion, ButtonGroup, SplitButton, ContextMenu and SpeedDial. */

import { useState } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Archive,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Folder,
  LayoutGrid,
  List,
  Mail,
  Pencil,
  Printer,
  Save,
  Settings,
  Share2,
  Shield,
  Trash2,
  Upload,
  User,
} from 'lucide-react';

import Accordion from '@/components/layout/Accordion';
import Button from '@/components/layout/Button';
import ButtonGroup, { SegmentedControl } from '@/components/layout/ButtonGroup';
import Divider from '@/components/layout/Divider';
import Fieldset from '@/components/layout/Fieldset';
import SplitButton, { type SplitButtonItem } from '@/components/layout/SplitButton';
import ContextMenu, { useContextMenu, type ContextMenuItem } from '@/components/overlay/ContextMenu';
import SpeedDial, { type SpeedDialAction } from '@/components/overlay/SpeedDial';

import { Row, Variant, useEcho } from './kit';

function Check({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 py-0.5">
      <input type="checkbox" defaultChecked={defaultChecked} className="h-3.5 w-3.5 accent-indigo-600" />
      {label}
    </label>
  );
}

export function FieldsetDemo() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <Fieldset legend="Notifications">
        <Check label="Email" defaultChecked />
        <Check label="Push" />
        <Check label="Weekly digest" defaultChecked />
      </Fieldset>
      <Fieldset legend={`Advanced (${collapsed ? 'collapsed' : 'open'})`} toggleable collapsed={collapsed} onToggle={setCollapsed}>
        <label className="field-label">Retry limit</label>
        <input className="field-input mt-1 w-full" defaultValue="3" />
      </Fieldset>
      <Fieldset legend="Starts collapsed" toggleable defaultCollapsed>
        <p>Content that only matters to a few people stays out of the way until asked for.</p>
      </Fieldset>
      <Fieldset legend="Disabled group" disabled>
        <Check label="Locked option" defaultChecked />
        <Check label="Another locked option" />
      </Fieldset>
    </div>
  );
}

export function DividerDemo() {
  return (
    <div className="max-w-lg text-xs text-slate-600 dark:text-slate-300">
      <p>Section above</p>
      <Divider />
      <Divider type="dashed">OR</Divider>
      <Divider type="dotted" align="left">
        Details
      </Divider>
      <Divider align="right">End of list</Divider>
      <div className="flex h-16 items-center">
        <span>Left</span>
        <Divider layout="vertical" />
        <span>Middle</span>
        <Divider layout="vertical" type="dashed" align="center">
          or
        </Divider>
        <span>Right</span>
      </div>
    </div>
  );
}

export function AccordionDemo() {
  const [open, setOpen, echo] = useEcho<string[]>(['a', 'c']);
  const items = [
    { id: 'a', title: 'Account', icon: User, content: 'Name, email address and sign-in preferences.' },
    { id: 'b', title: 'Security', icon: Shield, content: 'Password, two-factor authentication and active sessions.' },
    { id: 'c', title: 'Notifications', icon: Bell, content: 'Choose which events send an email or a push message.' },
    { id: 'd', title: 'Billing (unavailable)', icon: FileText, content: 'Not shown.', disabled: true },
  ];
  return (
    <div className="grid max-w-3xl gap-6 md:grid-cols-2">
      <Variant label="Single (uncontrolled)">
        <Accordion items={items} defaultValue={['a']} />
      </Variant>
      <Variant label="Multiple (controlled)">
        <Accordion items={items} multiple value={open} onChange={setOpen} />
        {echo}
      </Variant>
    </div>
  );
}

export function ButtonGroupDemo() {
  const [view, setView, echo] = useEcho<'list' | 'grid'>('list');
  const [range, setRange] = useState('week');
  return (
    <div className="flex flex-col gap-4">
      <Row>
        <Variant label="Kit buttons">
          <ButtonGroup aria-label="Text alignment">
            <Button variant="secondary" aria-label="Align left">
              <AlignLeft className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button variant="secondary" aria-label="Align center">
              <AlignCenter className="h-3.5 w-3.5" aria-hidden />
            </Button>
            <Button variant="secondary" aria-label="Align right">
              <AlignRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </ButtonGroup>
        </Variant>
        <Variant label="With labels">
          <ButtonGroup aria-label="Pagination">
            <Button variant="secondary" size="sm">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden /> Prev
            </Button>
            <Button variant="secondary" size="sm">1</Button>
            <Button variant="secondary" size="sm">2</Button>
            <Button variant="secondary" size="sm">
              Next <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </ButtonGroup>
        </Variant>
        <Variant label="Plain buttons, vertical">
          <ButtonGroup vertical aria-label="File">
            {['Open', 'Save', 'Close'].map((l) => (
              <button
                key={l}
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {l}
              </button>
            ))}
          </ButtonGroup>
        </Variant>
      </Row>
      <Row>
        <Variant label="SegmentedControl">
          <SegmentedControl
            aria-label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'list', label: 'List', icon: List },
              { value: 'grid', label: 'Grid', icon: LayoutGrid },
            ]}
          />
          {echo}
        </Variant>
        <Variant label="Small, one disabled">
          <SegmentedControl
            aria-label="Range"
            size="sm"
            value={range}
            onChange={setRange}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'year', label: 'Year', disabled: true },
            ]}
          />
        </Variant>
      </Row>
    </div>
  );
}

export function SplitButtonDemo() {
  const [, setLast, echo] = useEcho<string>('—');
  const items: SplitButtonItem[] = [
    { label: 'Save as draft', icon: FileText, onClick: () => setLast('draft') },
    { label: 'Save and close', icon: Save, onClick: () => setLast('save-close') },
    { label: 'Export…', icon: Download, disabled: true },
    { separator: true },
    { label: 'Discard changes', icon: Trash2, danger: true, onClick: () => setLast('discard') },
  ];
  return (
    <div className="flex flex-col gap-2">
      <Row>
        <SplitButton label="Save" icon={Save} onClick={() => setLast('save')} items={items} />
        <SplitButton label="Export" variant="secondary" onClick={() => setLast('export')} items={items} menuAlign="left" />
        <SplitButton label="Options" variant="ghost" size="sm" onClick={() => setLast('options')} items={items} />
        <SplitButton label="Delete" variant="danger" size="lg" onClick={() => setLast('delete')} items={items} />
        <SplitButton label="Disabled" disabled items={items} />
      </Row>
      <div className="max-w-xs">{echo}</div>
    </div>
  );
}

const FILES = ['report-q1.pdf', 'budget.xlsx', 'notes.md', 'diagram.png'];

export function ContextMenuDemo() {
  const [, setLast, echo] = useEcho<string>('—');
  const menuFor = (target: string): ContextMenuItem[] => [
    { label: 'Open', icon: FileText, shortcut: '↵', onClick: () => setLast(`open ${target}`) },
    { label: 'Rename', icon: Pencil, shortcut: 'F2', onClick: () => setLast(`rename ${target}`) },
    { label: 'Copy', icon: Copy, shortcut: '⌘C', onClick: () => setLast(`copy ${target}`) },
    { separator: true },
    {
      label: 'Move to',
      icon: Folder,
      items: [
        { label: 'Documents', onClick: () => setLast(`move ${target} → Documents`) },
        { label: 'Shared', onClick: () => setLast(`move ${target} → Shared`) },
        {
          label: 'Archive',
          icon: Archive,
          items: [
            { label: '2025', onClick: () => setLast(`move ${target} → Archive/2025`) },
            { label: '2026', onClick: () => setLast(`move ${target} → Archive/2026`) },
          ],
        },
      ],
    },
    {
      label: 'Share',
      icon: Share2,
      items: [
        { label: 'Copy link', icon: Copy, onClick: () => setLast(`link ${target}`) },
        { label: 'Email', icon: Mail, onClick: () => setLast(`email ${target}`) },
      ],
    },
    { label: 'Print', icon: Printer, disabled: true },
    { separator: true },
    { label: 'Delete', icon: Trash2, shortcut: '⌫', danger: true, onClick: () => setLast(`delete ${target}`) },
  ];
  const rowMenu = useContextMenu();

  return (
    <div className="grid max-w-3xl gap-4 md:grid-cols-2">
      <ContextMenu items={menuFor('canvas')}>
        <div
          tabIndex={0}
          className="flex h-40 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-center text-xs text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 dark:border-slate-600 dark:text-slate-400"
        >
          Right-click anywhere in this box
          <br />
          (or focus it and press Shift+F10)
        </div>
      </ContextMenu>
      <div>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
          {FILES.map((f) => (
            <li
              key={f}
              tabIndex={0}
              {...rowMenu.getTriggerProps(menuFor(f))}
              className="flex cursor-default items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400 dark:text-slate-200 dark:hover:bg-slate-800/60"
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        {rowMenu.menu}
        {echo}
      </div>
    </div>
  );
}

export function SpeedDialDemo() {
  const [, setLast, echo] = useEcho<string>('—');
  const actions: SpeedDialAction[] = [
    { label: 'Edit', icon: Pencil, onClick: () => setLast('edit') },
    { label: 'Upload', icon: Upload, onClick: () => setLast('upload') },
    { label: 'Schedule', icon: Calendar, onClick: () => setLast('schedule') },
    { label: 'Settings', icon: Settings, onClick: () => setLast('settings') },
  ];
  const box = 'relative h-64 rounded-lg border border-dashed border-slate-300 dark:border-slate-600';
  return (
    <div className="flex flex-col gap-2">
      <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
        <Variant label="Linear, up">
          <div className={box}>
            <SpeedDial actions={actions} direction="up" className="absolute bottom-4 right-4" />
          </div>
        </Variant>
        <Variant label="Circle">
          <div className={box}>
            <SpeedDial actions={actions} type="circle" radius={72} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </Variant>
        <Variant label="Quarter-circle, masked">
          <div className={box}>
            <SpeedDial
              actions={actions}
              type="quarter-circle"
              direction="up-left"
              radius={96}
              mask
              className="absolute bottom-4 right-4"
            />
          </div>
        </Variant>
      </div>
      <div className="max-w-xs">{echo}</div>
    </div>
  );
}
