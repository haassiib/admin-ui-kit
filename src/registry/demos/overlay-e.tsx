'use client';

import { useState } from 'react';
import Button from '@/components/layout/Button';
import MultilevelDialog, { useDialogStack, type DialogEntry, type DialogLevel } from '@/components/overlay/MultilevelDialog';
import MultilevelMenu, { selectedLists, type MultilevelMenuNode, type MultilevelMenuValue } from '@/components/overlay/MultilevelMenu';
import { X } from 'lucide-react';

/**
 * Three levels deep, each opened from inside the one below: a project's
 * settings, the member picker it opens, and a confirm the picker opens. The
 * settings form keeps what was typed into it while the levels above come and
 * go, because `renderLevel` builds every level from current state each render.
 */
export function MultilevelDialogDemo() {
  const { stack, push, pop, close, popTo } = useDialogStack();
  const [name, setName] = useState('Website relaunch');
  const [members, setMembers] = useState(['Ada Lovelace', 'Grace Hopper']);
  const people = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Linus Torvalds'];

  const renderLevel = (entry: DialogEntry): DialogLevel | null => {
    switch (entry.id) {
      case 'settings':
        return {
          title: 'Project settings',
          size: 'lg',
          content: ({ push: open }) => (
            <div className="space-y-4">
              <label className="block">
                <span className="field-label">Name</span>
                <input data-autofocus value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
              </label>
              <div>
                <span className="field-label">Members</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {members.map((m) => (
                    <span key={m} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] dark:bg-slate-800">{m}</span>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => open('members')}>Manage…</Button>
                </div>
              </div>
            </div>
          ),
          footer: ({ close: done }) => (
            <>
              <Button variant="secondary" size="sm" onClick={done}>Cancel</Button>
              <Button size="sm" onClick={done}>Save</Button>
            </>
          ),
        };
      case 'members':
        return {
          title: 'Members',
          subtitle: 'Who can see and edit this project',
          size: 'md',
          content: ({ push: open }) => (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {people.map((p) => (
                <li key={p} className="flex items-center justify-between py-2">
                  <span>{p}</span>
                  {members.includes(p) ? (
                    <Button variant="ghost" size="sm" onClick={() => open('confirm', p)}>Remove</Button>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={() => setMembers((m) => [...m, p])}>Add</Button>
                  )}
                </li>
              ))}
            </ul>
          ),
          footer: ({ pop: back }) => <Button size="sm" onClick={back}>Done</Button>,
        };
      case 'confirm': {
        const person = String(entry.data);
        return {
          title: `Remove ${person}?`,
          size: 'sm',
          content: <p>They lose access to the project straight away. Their past comments stay.</p>,
          footer: ({ pop: back }) => (
            <>
              <Button variant="secondary" size="sm" onClick={back}>Keep</Button>
              <Button variant="danger" size="sm" onClick={() => { setMembers((m) => m.filter((x) => x !== person)); back(); }}>Remove</Button>
            </>
          ),
        };
      }
      default:
        return null;
    }
  };

  return (
    <div>
      <Button onClick={() => push('settings')}>Open project settings</Button>
      <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
        {stack.length ? `Open: ${stack.map((l) => l.id).join(' › ')}` : 'Closed'} · name: {name} · members: {members.join(', ')}
      </p>
      <MultilevelDialog stack={stack} renderLevel={renderLevel} onPush={push} onPop={pop} onClose={close} onPopTo={popTo} />
    </div>
  );
}

/* ------------------------------------------------------- multilevel menu --- */

const opts = (labels: string[]) => labels.map((label, i) => ({ value: String(i + 1), label }));

const REPORT_FILTERS: MultilevelMenuNode[] = [
  {
    key: 'dimensions',
    label: 'Filters',
    children: [
      {
        key: 'offer',
        label: 'Offer',
        options: opts([
          'Spring sale landing page (ID: 15)',
          'Annual plan upsell (ID: 17)',
          'Free trial, US only (ID: 12)',
          'Referral bonus (ID: 16)',
          'Win-back email offer (ID: 20)',
          'Bundle discount (ID: 2)',
        ]),
      },
      { key: 'smart-link', label: 'Smart Link', options: opts(['Homepage router', 'Mobile deep link', 'Geo splitter']) },
      { key: 'channel', label: 'Channel', options: opts(['Search', 'Social', 'Email', 'Display', 'Affiliate', 'Direct']) },
      { key: 'region', label: 'Region', options: opts(['North America', 'Europe', 'Asia-Pacific', 'Latin America', 'Middle East & Africa']) },
      { key: 'city', label: 'City', options: opts(['Austin', 'Berlin', 'Lisbon', 'Nairobi', 'Osaka', 'Toronto', 'Seoul', 'Lima', 'Oslo', 'Dubai']) },
      { key: 'country', label: 'Country', options: opts(['Canada', 'Germany', 'Japan', 'Kenya', 'Peru', 'Portugal', 'United States']) },
      { key: 'country-code', label: 'Country Code', options: opts(['CA', 'DE', 'JP', 'KE', 'PE', 'PT', 'US']) },
      ...[1, 2, 3, 4, 5].map((n) => ({ key: `adv${n}`, label: `Adv${n}`, options: opts(['Value A', 'Value B', 'Value C', 'Empty']) })),
    ],
  },
  {
    key: 'metrics',
    label: 'Metric Filters',
    children: [
      { key: 'clicks', label: 'Clicks', multiple: false, hint: 'Pick one threshold', options: opts(['More than 0', 'More than 100', 'More than 1,000']) },
      { key: 'conversions', label: 'Conversions', multiple: false, hint: 'Pick one threshold', options: opts(['Any', 'At least 1', 'At least 10']) },
      { key: 'duplicates', label: 'Duplicate clicks', multiple: false, hint: 'Pick one', options: opts(['Hide duplicates', 'Only duplicates']) },
    ],
  },
];

/**
 * A reporting page's "Add filter": Filters › Offer › offers, each level beside
 * the last. The picks come back as one value keyed by list, and
 * `selectedLists` turns it into the chip row under the button.
 */
export function MultilevelMenuDemo() {
  const [value, setValue] = useState<MultilevelMenuValue>({ offer: ['1', '3'], channel: ['2'] });
  const chips = selectedLists(REPORT_FILTERS, value);
  return (
    <div className="flex min-h-[26rem] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <MultilevelMenu nodes={REPORT_FILTERS} value={value} onChange={setValue} title="Reporting filters" />
        {chips.map(({ node, options }) => (
          <span
            key={node.key}
            className="inline-flex max-w-xs items-center gap-1 rounded-full border border-slate-200 bg-white py-0.5 pl-2.5 pr-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          >
            <span className="font-semibold text-slate-800 dark:text-slate-100">{node.label}:</span>
            <span className="truncate">{options.length > 2 ? `${options.length} selected` : options.map((o) => o.label).join(', ')}</span>
            <button
              type="button"
              aria-label={`Remove ${node.label} filter`}
              onClick={() => {
                const next = { ...value };
                delete next[node.key];
                setValue(next);
              }}
              className="rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <X aria-hidden className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <pre className="overflow-x-auto rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {JSON.stringify(value)}
      </pre>
    </div>
  );
}
