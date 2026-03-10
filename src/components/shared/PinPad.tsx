import { useState } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinPadProps {
  length?: number;
  onComplete: (pin: string) => void;
  title?: string;
  subtitle?: string;
  error?: string;
}

const PinPad = ({ length = 4, onComplete, title = 'Enter PIN', subtitle, error }: PinPadProps) => {
  const [pin, setPin] = useState('');

  const handlePress = (digit: string) => {
    if (pin.length < length) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === length) {
        setTimeout(() => onComplete(newPin), 150);
      }
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const dots = Array.from({ length }, (_, i) => (
    <div
      key={i}
      className={cn(
        'h-3.5 w-3.5 rounded-full border-2 transition-all duration-150',
        i < pin.length
          ? 'border-accent bg-accent scale-110'
          : 'border-muted-foreground/30'
      )}
    />
  ));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex gap-4">{dots}</div>

      <div className="grid grid-cols-3 gap-4">
        {keys.map((key, i) => (
          <button
            key={i}
            onClick={() => {
              if (key === 'del') handleDelete();
              else if (key !== '') handlePress(key);
            }}
            disabled={key === ''}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold transition-all',
              key === '' && 'invisible',
              key === 'del'
                ? 'text-muted-foreground active:bg-muted'
                : 'text-foreground active:bg-accent/10 active:scale-95'
            )}
          >
            {key === 'del' ? <Delete className="h-6 w-6" /> : key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PinPad;
