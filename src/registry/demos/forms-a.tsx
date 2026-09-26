'use client';

/** Demos for Slider, RadioGroup, Knob, InputGroup, IconField, InputMask and InputPassword. */

import { useState } from 'react';
import { AtSign, Copy, DollarSign, Globe, Mail, Search, X } from 'lucide-react';

import Button from '@/components/layout/Button';
import Slider, { type SliderValue } from '@/components/form/Slider';
import RadioGroup, { RadioButton, type RadioValue } from '@/components/form/RadioGroup';
import Knob from '@/components/form/Knob';
import InputGroup, { InputGroupAddon } from '@/components/form/InputGroup';
import IconField from '@/components/form/IconField';
import InputMask, { type MaskChange } from '@/components/form/InputMask';
import InputPassword from '@/components/form/InputPassword';

import { Row, Variant, useEcho } from './kit';

export function SliderDemo() {
  const [single, setSingle, singleEcho] = useEcho<SliderValue>(40);
  const [range, setRange, rangeEcho] = useEcho<SliderValue>([20, 75]);
  const [fine, setFine] = useState<SliderValue>(0.5);
  const [vol, setVol] = useState<SliderValue>(60);
  const [band, setBand] = useState<SliderValue>([30, 70]);
  return (
    <div className="flex flex-col gap-5 max-w-md">
      <Variant label="single">
        <Slider value={single} onChange={setSingle} label="Opacity" showValue formatValue={(v) => `${v}%`} />
        {singleEcho}
      </Variant>
      <Variant label="range, step 5">
        <Slider value={range} onChange={setRange} step={5} showValue thumbLabels={['Minimum price', 'Maximum price']} formatValue={(v) => `$${v}`} />
        {rangeEcho}
      </Variant>
      <Variant label="fractional step 0.05, 0–1">
        <Slider value={fine} onChange={setFine} min={0} max={1} step={0.05} label="Threshold" showValue />
      </Variant>
      <Row className="items-end gap-8">
        <Variant label="vertical">
          <Row className="gap-6">
            <Slider value={vol} onChange={setVol} orientation="vertical" label="Volume" showValue />
            <Slider value={band} onChange={setBand} orientation="vertical" showValue />
          </Row>
        </Variant>
        <Variant label="disabled">
          <div className="w-40">
            <Slider value={30} onChange={() => {}} label="Locked" disabled />
          </div>
        </Variant>
      </Row>
    </div>
  );
}

const PLANS = [
  { value: 'monthly', label: 'Monthly', hint: 'Billed on the 1st of each month.' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'lifetime', label: 'Lifetime', disabled: true },
];

export function RadioGroupDemo() {
  const [plan, setPlan, planEcho] = useEcho<RadioValue | null>('monthly');
  const [size, setSize, sizeEcho] = useEcho<RadioValue | null>(null);
  const [agree, setAgree] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <Variant label="vertical, with hint and disabled option">
        <RadioGroup label="Billing period" name="plan" options={PLANS} value={plan} onChange={setPlan} />
        {planEcho}
      </Variant>
      <Variant label="horizontal, nothing selected yet">
        <RadioGroup
          label="Size"
          orientation="horizontal"
          options={[
            { value: 1, label: 'Small' },
            { value: 2, label: 'Medium' },
            { value: 3, label: 'Large' },
          ]}
          value={size}
          onChange={setSize}
        />
        {sizeEcho}
      </Variant>
      <Row>
        <Variant label="whole group disabled">
          <RadioGroup label="Locked" options={PLANS.slice(0, 2)} value="yearly" onChange={() => {}} disabled />
        </Variant>
        <Variant label="standalone RadioButton">
          <RadioButton id="rb-solo" value="yes" checked={agree} onChange={() => setAgree(true)} label="I have read the notes" />
        </Variant>
      </Row>
    </div>
  );
}

export function KnobDemo() {
  const [a, setA, aEcho] = useEcho(42);
  const [b, setB] = useState(-6);
  const [c, setC] = useState(0.7);
  return (
    <div className="flex flex-col gap-3">
      <Row className="items-start gap-6">
        <Variant label="percent">
          <Knob value={a} onChange={setA} valueTemplate="{value}%" label="Mix" />
        </Variant>
        <Variant label="-12…12 dB, small">
          <Knob value={b} onChange={setB} min={-12} max={12} size={64} strokeWidth={6} valueTemplate="{value} dB" label="Gain" />
        </Variant>
        <Variant label="0–1, step 0.1">
          <Knob value={c} onChange={setC} min={0} max={1} step={0.1} size={72} label="Ratio" />
        </Variant>
        <Variant label="read-only">
          <Knob value={65} onChange={() => {}} size={64} valueTemplate="{value}%" label="Usage" readOnly />
        </Variant>
        <Variant label="disabled">
          <Knob value={30} onChange={() => {}} size={64} label="Locked" disabled />
        </Variant>
      </Row>
      {aEcho}
    </div>
  );
}

export function InputGroupDemo() {
  const [unit, setUnit] = useState('kg');
  return (
    <div className="flex flex-col gap-4 max-w-md">
      <Variant label="text addons">
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <input className="field-input" placeholder="example.com" aria-label="Website" />
          <InputGroupAddon>.org</InputGroupAddon>
        </InputGroup>
      </Variant>
      <Variant label="icon addon + number">
        <InputGroup>
          <InputGroupAddon>
            <DollarSign />
          </InputGroupAddon>
          <input className="field-input" type="number" placeholder="0.00" aria-label="Amount" />
          <InputGroupAddon>USD</InputGroupAddon>
        </InputGroup>
      </Variant>
      <Variant label="with a select">
        <InputGroup>
          <input className="field-input" type="number" placeholder="Weight" aria-label="Weight" />
          <select className="field-input w-auto" value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Unit">
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </InputGroup>
      </Variant>
      <Variant label="with Buttons">
        <InputGroup>
          <input className="field-input" placeholder="Search keyword" aria-label="Keyword" />
          <Button variant="secondary" aria-label="Clear">
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button>
            <Search className="h-3.5 w-3.5" aria-hidden />
            Search
          </Button>
        </InputGroup>
      </Variant>
    </div>
  );
}

export function IconFieldDemo() {
  const [q, setQ, qEcho] = useEcho('');
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <Variant label="left icon">
        <IconField iconLeft={<Search />} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
        {qEcho}
      </Variant>
      <Variant label="both sides, right is a button">
        <IconField
          iconLeft={<Globe />}
          iconRight={
            <button
              type="button"
              aria-label="Copy"
              className="rounded p-0.5 hover:text-slate-600 dark:hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <Copy />
            </button>
          }
          defaultValue="https://example.com/share/abc123"
          readOnly
          aria-label="Share link"
        />
      </Variant>
      <Variant label="loading">
        <IconField iconLeft={<AtSign />} iconRight={<Mail />} loading placeholder="Checking availability…" aria-label="Username" />
      </Variant>
    </div>
  );
}

export function InputMaskDemo() {
  const [phone, setPhone] = useState<MaskChange>({ formatted: '', raw: '', complete: false });
  const [date, setDate, dateEcho] = useEcho<MaskChange>({ formatted: '12/25', raw: '1225', complete: false });
  const [code, setCode, codeEcho] = useEcho<MaskChange>({ formatted: '', raw: '', complete: false });
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <Variant label="phone — (999) 999-9999">
        <InputMask mask="(999) 999-9999" value={phone.formatted} onChange={setPhone} type="tel" aria-label="Phone" />
        <pre className="mt-1 overflow-x-auto rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {JSON.stringify(phone)}
        </pre>
      </Variant>
      <Variant label="date — 99/99/9999, autoClear">
        <InputMask mask="99/99/9999" value={date.raw} onChange={setDate} autoClear aria-label="Date" />
        {dateEcho}
      </Variant>
      <Variant label="code — aa-9999, slotChar ·">
        <InputMask mask="aa-9999" slotChar="·" value={code.formatted} onChange={setCode} aria-label="Code" />
        {codeEcho}
      </Variant>
    </div>
  );
}

export function InputPasswordDemo() {
  const [pw, setPw, pwEcho] = useEcho('');
  return (
    <div className="flex flex-col gap-4 max-w-sm">
      <Variant label="toggle only">
        <InputPassword placeholder="Password" defaultValue="hunter2" aria-label="Password" autoComplete="off" />
      </Variant>
      <Variant label="feedback + requirements">
        <InputPassword
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          feedback
          requirements
          placeholder="Choose a password"
          aria-label="New password"
          autoComplete="new-password"
        />
        {pwEcho}
      </Variant>
    </div>
  );
}
