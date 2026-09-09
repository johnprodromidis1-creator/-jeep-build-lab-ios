'use client';
import {useId, useState} from 'react';
import {Input} from '@/components/ui/input';
import {finishDecimalInput, formatDecimalUnits, parseDecimalUnits, type DecimalInputOptions} from '@/lib/decimal-input';

type Props = DecimalInputOptions & {
  id: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function DecimalInput({id, value, onChange, disabled, ...options}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const messageId = useId();
  const formatted = formatDecimalUnits(value, options.places);
  return <>
    <Input id={id} type="text" inputMode="decimal" enterKeyHint="done" autoComplete="off"
      maxLength={32} disabled={disabled} value={editing ?? formatted}
      aria-describedby={message ? messageId : undefined}
      onChange={event => {
        const text = event.target.value;
        setEditing(text); setMessage('');
        const parsed = text.trim() === '' && options.emptyAsZero ? 0 : parseDecimalUnits(text, options.places);
        // Keep totals and autosave current without rewriting partial keyboard input.
        if (parsed !== null && parsed >= options.min && parsed <= options.max && parsed !== value) onChange(parsed);
      }}
      onBlur={event => {
        const result = finishDecimalInput(event.target.value, value, options);
        setEditing(null); setMessage(result.message);
        if (result.value !== value) onChange(result.value);
      }}
      onKeyDown={event => {
        if (event.key === 'Enter') {event.preventDefault(); event.currentTarget.blur();}
      }}/>
    {message && <p id={messageId} className="number-entry-message" role="status">{message}</p>}
  </>;
}
