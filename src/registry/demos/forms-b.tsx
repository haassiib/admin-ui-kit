'use client';

/** Demos for InputColor, FloatLabel, IftaLabel and CascadeSelect. */

import { Building2, Globe, MapPin } from 'lucide-react';

import InputColor from '@/components/form/InputColor';
import FloatLabel from '@/components/form/FloatLabel';
import IftaLabel from '@/components/form/IftaLabel';
import CascadeSelect, { type CascadeOption } from '@/components/form/CascadeSelect';

import { Row, Variant, useEcho } from './kit';

const PALETTE = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#64748b', '#0f172a', '#ffffff'];

export function InputColorDemo() {
  const [brand, setBrand, brandEcho] = useEcho('#4f46e5');
  const [overlay, setOverlay, overlayEcho] = useEcho('#0ea5e980');
  const [accent, setAccent, accentEcho] = useEcho('#10b981');
  return (
    <Row className="items-start gap-6">
      <Variant label="popover + presets">
        <div className="w-44">
          <InputColor value={brand} onChange={setBrand} presets={PALETTE} />
          {brandEcho}
        </div>
      </Variant>
      <Variant label="alpha">
        <div className="w-44">
          <InputColor value={overlay} onChange={setOverlay} alpha />
          {overlayEcho}
        </div>
      </Variant>
      <Variant label="inline">
        <div>
          <InputColor value={accent} onChange={setAccent} inline presets={PALETTE.slice(0, 6)} />
          {accentEcho}
        </div>
      </Variant>
    </Row>
  );
}

export function FloatLabelDemo() {
  return (
    <div className="grid max-w-2xl gap-5 sm:grid-cols-3">
      {(['over', 'in', 'on'] as const).map((variant) => (
        <Variant key={variant} label={variant}>
          <div className="flex flex-col gap-4">
            <FloatLabel label="Username" variant={variant}>
              <input className="field-input" autoComplete="off" />
            </FloatLabel>
            <FloatLabel label="Email" variant={variant}>
              <input type="email" className="field-input" defaultValue="someone@example.com" />
            </FloatLabel>
            <FloatLabel label="Notes" variant={variant}>
              <textarea className="field-input resize-y" rows={2} />
            </FloatLabel>
          </div>
        </Variant>
      ))}
    </div>
  );
}

export function IftaLabelDemo() {
  const [amount, setAmount, echo] = useEcho('');
  return (
    <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
      <div>
        <IftaLabel label="Amount" aside="USD">
          <input inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </IftaLabel>
        {echo}
      </div>
      <IftaLabel label="Plan">
        <select defaultValue="team">
          <option value="free">Free</option>
          <option value="team">Team</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </IftaLabel>
      <IftaLabel label="Reference" invalid>
        <input defaultValue="ABC-" />
      </IftaLabel>
    </div>
  );
}

const PLACES: CascadeOption[] = [
  {
    value: 'ca',
    label: 'Canada',
    icon: <Globe />,
    children: [
      {
        value: 'ca-on',
        label: 'Ontario',
        icon: <MapPin />,
        children: [
          { value: 'toronto', label: 'Toronto', icon: <Building2 /> },
          { value: 'ottawa', label: 'Ottawa', icon: <Building2 /> },
        ],
      },
      {
        value: 'ca-qc',
        label: 'Quebec',
        icon: <MapPin />,
        children: [
          { value: 'montreal', label: 'Montreal', icon: <Building2 /> },
          { value: 'quebec-city', label: 'Quebec City', icon: <Building2 /> },
        ],
      },
    ],
  },
  {
    value: 'au',
    label: 'Australia',
    icon: <Globe />,
    children: [
      {
        value: 'au-nsw',
        label: 'New South Wales',
        icon: <MapPin />,
        children: [
          { value: 'sydney', label: 'Sydney', icon: <Building2 /> },
          { value: 'newcastle', label: 'Newcastle', icon: <Building2 /> },
        ],
      },
      {
        value: 'au-vic',
        label: 'Victoria',
        icon: <MapPin />,
        children: [{ value: 'melbourne', label: 'Melbourne', icon: <Building2 /> }],
      },
    ],
  },
  // A leaf at the top level: the cascade does not require every branch to be the same depth.
  { value: 'remote', label: 'Remote', icon: <Globe /> },
];

export function CascadeSelectDemo() {
  const [city, setCity, cityEcho] = useEcho<{ value: string | null; path: string[] }>({ value: null, path: [] });
  const [office, setOffice, officeEcho] = useEcho<{ value: string | null; path: string[] }>({ value: 'ottawa', path: ['Canada', 'Ontario', 'Ottawa'] });
  return (
    <Row className="items-start gap-6">
      <Variant label="leaf label">
        <div className="w-56">
          <CascadeSelect options={PLACES} value={city.value} onChange={(value, path) => setCity({ value, path })} placeholder="Select a city" />
          {cityEcho}
        </div>
      </Variant>
      <Variant label="showPath">
        <div className="w-64">
          <CascadeSelect options={PLACES} value={office.value} onChange={(value, path) => setOffice({ value, path })} showPath />
          {officeEcho}
        </div>
      </Variant>
    </Row>
  );
}
