interface Props {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

export default function ProgressBar({ currentStep, totalSteps, labels }: Props) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.bar}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const step = i + 1;
          const done = step < currentStep;
          const active = step === currentStep;
          return (
            <div key={step} style={styles.stepWrapper}>
              <div
                style={{
                  ...styles.dot,
                  ...(done ? styles.dotDone : {}),
                  ...(active ? styles.dotActive : {}),
                }}
              >
                {done ? '✓' : step}
              </div>
              <span
                style={{
                  ...styles.label,
                  ...(done || active ? styles.labelActive : {}),
                }}
              >
                {labels[i]}
              </span>
              {step < totalSteps && (
                <div
                  style={{
                    ...styles.connector,
                    ...(done ? styles.connectorDone : {}),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    padding: '16px 0 24px',
  },
  bar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 0,
  },
  stepWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    flex: 1,
    maxWidth: '120px',
  },
  dot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    backgroundColor: '#e5e7eb',
    color: '#9ca3af',
    transition: 'all 0.3s',
    zIndex: 1,
  },
  dotDone: {
    backgroundColor: '#16a34a',
    color: '#fff',
  },
  dotActive: {
    backgroundColor: '#2563eb',
    color: '#fff',
    boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.2)',
  },
  label: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '6px',
    textAlign: 'center',
    transition: 'color 0.3s',
  },
  labelActive: {
    color: '#374151',
    fontWeight: 500,
  },
  connector: {
    position: 'absolute',
    top: '16px',
    left: 'calc(50% + 20px)',
    width: 'calc(100% - 40px)',
    height: '2px',
    backgroundColor: '#e5e7eb',
    transition: 'background-color 0.3s',
  },
  connectorDone: {
    backgroundColor: '#16a34a',
  },
};
