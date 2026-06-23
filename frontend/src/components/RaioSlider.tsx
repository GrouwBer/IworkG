import React from 'react';

interface RaioSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const STEPS = [
  { km: 5, label: '5 km' },
  { km: 10, label: '10 km' },
  { km: 15, label: '15 km' },
  { km: 20, label: '20 km' },
  { km: 30, label: '30 km' },
  { km: 50, label: '50 km' },
];

/**
 * RaioSlider — RF021
 * Seletor de raio de atuação do prestador. Touch-friendly com chips.
 */
export function RaioSlider({ value, onChange, disabled = false }: RaioSliderProps) {
  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 'var(--space-3)',
      }}>
        <span style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 600,
          color: 'var(--color-text)',
        }}>
          Raio de atuação
        </span>
        <span style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 700,
          color: 'var(--color-primary)',
        }}>
          {value} km
        </span>
      </div>

      {/* Chips para seleção rápida */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-3)',
      }}>
        {STEPS.map((step) => (
          <button
            key={step.km}
            disabled={disabled}
            onClick={() => onChange(step.km)}
            style={{
              padding: '10px 18px',
              minHeight: 'var(--touch-min)',
              minWidth: '72px',
              borderRadius: 'var(--radius-md)',
              border: value === step.km
                ? '2px solid var(--color-primary)'
                : '2px solid var(--color-border)',
              backgroundColor: value === step.km
                ? 'var(--color-primary-light)'
                : 'var(--color-surface)',
              color: value === step.km
                ? 'var(--color-primary)'
                : 'var(--color-text)',
              fontSize: 'var(--text-sm)',
              fontWeight: value === step.km ? 700 : 500,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Range slider visual */}
      <div style={{ position: 'relative', height: '32px' }}>
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={STEPS.findIndex(s => s.km === value)}
          disabled={disabled}
          onChange={(e) => {
            const idx = parseInt(e.target.value);
            onChange(STEPS[idx].km);
          }}
          style={{
            width: '100%',
            height: '8px',
            appearance: 'none',
            WebkitAppearance: 'none',
            backgroundColor: 'var(--color-border)',
            borderRadius: 'var(--radius-full)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            accentColor: 'var(--color-primary)',
          }}
        />
      </div>

      <p style={{
        fontSize: 'var(--text-xs)',
        color: 'var(--color-text-tertiary)',
        marginTop: 'var(--space-2)',
      }}>
        Você aparecerá nas buscas de clientes dentro deste raio.
      </p>
    </div>
  );
}
