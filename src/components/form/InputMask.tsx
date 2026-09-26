'use client';

import { forwardRef, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/** Mask tokens. Every other character in a mask is a literal, typed for the user. */
const TOKENS: Record<string, RegExp> = {
  '9': /\d/,
  a: /[A-Za-z]/,
  '*': /[A-Za-z0-9]/,
};

const isSlot = (m: string) => m in TOKENS;

export type MaskResult = {
  /** The value as shown, trimmed after the last filled slot: "(555) 12". Empty when nothing is filled. */
  formatted: string;
  /** Every slot rendered, empty ones as `slotChar`: "(555) 12_-____". */
  masked: string;
  /** Only the characters typed into slots: "55512". */
  raw: string;
  /** Every slot filled. */
  complete: boolean;
};

export type MaskChange = Pick<MaskResult, 'formatted' | 'raw' | 'complete'>;

/** Strict fill: `raw` holds slot characters only. One that does not fit its slot is dropped and the rest move up. */
function fill(mask: string, raw: string, slotChar: string): MaskResult {
  let masked = '';
  let accepted = '';
  let lastFilled = -1;
  let ri = 0;
  for (let pos = 0; pos < mask.length; pos++) {
    const m = mask[pos];
    if (!isSlot(m)) {
      masked += m;
      continue;
    }
    while (ri < raw.length && !TOKENS[m].test(raw[ri])) ri++;
    if (ri < raw.length) {
      masked += raw[ri];
      accepted += raw[ri];
      lastFilled = pos;
      ri++;
    } else {
      masked += slotChar;
    }
  }
  const slots = [...mask].filter(isSlot).length;
  return {
    masked,
    raw: accepted,
    formatted: lastFilled < 0 ? '' : masked.slice(0, lastFilled + 1),
    complete: accepted.length === slots,
  };
}

/**
 * Walk `input` against the mask from position `start`, keeping the characters
 * that land in slots. A character equal to the literal at the current position
 * is consumed AS that literal, which is what lets an already-formatted string
 * ("(555) 123-4567") come back out as its raw digits; anything else that does
 * not fit is dropped.
 */
function extract(mask: string, input: string, start = 0): string {
  let raw = '';
  let pos = start;
  for (const ch of input) {
    // Skip literals the input did not spell out, e.g. raw digits against "(999)".
    while (pos < mask.length && !isSlot(mask[pos]) && mask[pos] !== ch) pos++;
    if (pos >= mask.length) break;
    if (!isSlot(mask[pos])) {
      pos++;
      continue;
    }
    if (TOKENS[mask[pos]].test(ch)) {
      raw += ch;
      pos++;
    }
  }
  return raw;
}

/**
 * Format `input` — raw ("5551234567") or already formatted ("(555) 123-4567")
 * — against `mask`. Pure, so the same function can validate on the server.
 *
 * `9` is a digit, `a` a letter, `*` either; every other mask character is a
 * literal. A raw input may not contain a mask literal as data (an `x` typed
 * into an `a` slot of "99x-aa" reads as the literal) — keep masks' literals
 * out of their own slots' alphabets.
 */
export function applyMask(mask: string, input: string, slotChar = '_'): MaskResult {
  return fill(mask, extract(mask, input), slotChar);
}

export interface InputMaskProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
  /** `9` digit, `a` letter, `*` letter or digit, anything else literal — "(999) 999-9999". */
  mask: string;
  /** Raw or formatted; both are read back through `applyMask`. */
  value: string;
  /** Receives `formatted`, `raw` and `complete` together, so the caller stores whichever it wants. */
  onChange: (next: MaskChange) => void;
  /** Shown in empty slots while focused. Must not be a character any slot accepts. */
  slotChar?: string;
  /** Clear the value on blur when it is incomplete, rather than keeping a half-typed date. */
  autoClear?: boolean;
}

/**
 * A text input that types into a fixed pattern.
 *
 * The model is a CONTIGUOUS run of slot characters (`raw`), rendered through
 * the mask. Edits are worked out by diffing the browser's new value against
 * the old one, rather than by intercepting keys, because that one path covers
 * typing, paste, autofill, drag-drop and mobile keyboards that never send a
 * usable `keydown`. Only Backspace and Delete are intercepted: left to the
 * browser, backspacing over ") " deletes a literal that immediately
 * re-renders, so the caret appears stuck. Handling them here makes both keys
 * skip literals to the nearest slot.
 *
 * The caret is placed after every edit in a layout effect — a controlled
 * input whose value React rewrites otherwise jumps its caret to the end.
 */
const InputMask = forwardRef<HTMLInputElement, InputMaskProps>(function InputMask(
  {
    mask,
    value,
    onChange,
    slotChar = '_',
    autoClear = false,
    placeholder,
    inputMode,
    className,
    onFocus,
    onBlur,
    onKeyDown,
    onSelect,
    onMouseUp,
    readOnly,
    disabled,
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selection = useRef({ start: 0, end: 0 });
  const pendingCaret = useRef<number | null>(null);
  /** Set by any edit, so the deferred focus placement cannot yank the caret back mid-typing. */
  const editedSinceFocus = useRef(false);
  const [focused, setFocused] = useState(false);
  // Forces a render even when the parent's value does not change (a rejected
  // keystroke), so the layout effect runs and restores the caret.
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const slots: number[] = [];
  for (let i = 0; i < mask.length; i++) if (isSlot(mask[i])) slots.push(i);

  const current = applyMask(mask, value ?? '', slotChar);
  const raw = current.raw;
  const display = focused || raw ? current.masked : '';
  const template = mask.replace(/[9a*]/g, slotChar);

  /** Slots strictly before `pos` — i.e. the raw index an edit at `pos` affects. */
  const slotIndexAt = (pos: number) => slots.filter((p) => p < pos).length;
  /** Where the caret sits for "before raw index k": on that slot, or past the last one. */
  const caretFor = (k: number) => (k < slots.length ? slots[k] : mask.length);

  useLayoutEffect(() => {
    const el = inputRef.current;
    const pos = pendingCaret.current;
    pendingCaret.current = null;
    if (el && pos !== null && document.activeElement === el) {
      el.setSelectionRange(pos, pos);
      selection.current = { start: pos, end: pos };
    }
  });

  const emit = (nextRaw: string, caretIndex: number) => {
    editedSinceFocus.current = true;
    const res = fill(mask, nextRaw, slotChar);
    pendingCaret.current = caretFor(Math.min(caretIndex, res.raw.length));
    if (res.raw !== raw) onChange({ formatted: res.formatted, raw: res.raw, complete: res.complete });
    rerender();
  };

  const remember = (el: HTMLInputElement) => {
    selection.current = { start: el.selectionStart ?? 0, end: el.selectionEnd ?? 0 };
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    const old = display;
    const { start } = selection.current;

    // Common prefix, capped at the old caret so a repeated character typed
    // before an identical one ("5" before "55") is placed where it was typed.
    let p = 0;
    while (p < old.length && p < next.length && old[p] === next[p]) p++;
    p = Math.min(p, start);
    let q = 0;
    while (q < Math.min(old.length, next.length) - p && old[old.length - 1 - q] === next[next.length - 1 - q]) q++;
    const removedEnd = old.length - q;
    let inserted = next.slice(p, next.length - q);

    const rawStart = Math.min(slotIndexAt(p), raw.length);
    const rawEnd = Math.min(slotIndexAt(removedEnd), raw.length);

    if (!inserted && rawStart === rawEnd) {
      // Only a literal was deleted — the Backspace that reached us without a
      // keydown (Android). Treat it as deleting the slot before it.
      if (rawStart > 0) emit(raw.slice(0, rawStart - 1) + raw.slice(rawStart), rawStart - 1);
      else emit(raw, 0);
      return;
    }

    // A paste of a full formatted value lands at slot 0, i.e. AFTER the mask's
    // leading literals ("+1 ("); strip them from the paste too, or the "1" of
    // "+1" would be read as the first digit.
    const lead = mask.slice(0, slots[0] ?? 0);
    if (rawStart === 0 && lead && inserted.startsWith(lead)) inserted = inserted.slice(lead.length);

    const accepted = rawStart < slots.length ? extract(mask, inserted, slots[rawStart]) : '';
    emit(raw.slice(0, rawStart) + accepted + raw.slice(rawEnd), rawStart + accepted.length);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || readOnly || disabled) return;
    if (e.key !== 'Backspace' && e.key !== 'Delete') {
      remember(e.currentTarget);
      return;
    }
    e.preventDefault();
    const s = e.currentTarget.selectionStart ?? 0;
    const end = e.currentTarget.selectionEnd ?? s;

    if (s !== end) {
      const a = Math.min(slotIndexAt(s), raw.length);
      const b = Math.min(slotIndexAt(end), raw.length);
      emit(raw.slice(0, a) + raw.slice(b), a);
    } else if (e.key === 'Backspace') {
      const k = Math.min(slotIndexAt(s), raw.length) - 1;
      if (k >= 0) emit(raw.slice(0, k) + raw.slice(k + 1), k);
    } else {
      const k = slotIndexAt(s);
      if (k < raw.length) emit(raw.slice(0, k) + raw.slice(k + 1), k);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
    setFocused(true);
    editedSinceFocus.current = false;
    // After the browser has placed the caret for the click that focused us:
    // start typing at the first empty slot, not wherever the pointer landed.
    // Skipped if a keystroke got in first — `raw` here is this render's, and
    // moving the caret after fast typing would send the next key to slot 0.
    const el = e.currentTarget;
    const pos = caretFor(raw.length);
    requestAnimationFrame(() => {
      if (document.activeElement !== el || editedSinceFocus.current) return;
      el.setSelectionRange(pos, pos);
      remember(el);
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur?.(e);
    setFocused(false);
    if (autoClear && raw && !current.complete) onChange({ formatted: '', raw: '', complete: false });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    onMouseUp?.(e);
    // A click past the typed part would leave the caret in empty slots, where
    // typing still appends to `raw` — move it to where the character will land.
    const el = e.currentTarget;
    const firstEmpty = caretFor(raw.length);
    if (el.selectionStart === el.selectionEnd && (el.selectionStart ?? 0) > firstEmpty) {
      el.setSelectionRange(firstEmpty, firstEmpty);
    }
    remember(el);
  };

  const numericOnly = slots.length > 0 && slots.every((p) => mask[p] === '9');

  return (
    <input
      // Before the spread so `type="tel"` can replace it. Not `email`/`number`:
      // those do not support setSelectionRange, which the caret handling needs.
      type="text"
      {...rest}
      ref={(el) => {
        inputRef.current = el;
        if (typeof ref === 'function') ref(el);
        else if (ref) ref.current = el;
      }}
      value={display}
      placeholder={placeholder ?? template}
      inputMode={inputMode ?? (numericOnly ? 'numeric' : undefined)}
      readOnly={readOnly}
      disabled={disabled}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseUp={handleMouseUp}
      onSelect={(e) => {
        onSelect?.(e);
        remember(e.currentTarget);
      }}
      className={cn('field-input font-mono tabular-nums', className)}
    />
  );
});

export default InputMask;
