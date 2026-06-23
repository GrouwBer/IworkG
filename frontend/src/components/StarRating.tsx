interface StarRatingProps {
  rating: number;      // 0.0 — 5.0
  reviewCount?: number;
  size?: 'sm' | 'md';
  showCount?: boolean;
}

/**
 * StarRating — Design System (NF001)
 * Exibição de avaliação com estrelas.
 */
export function StarRating({ rating, reviewCount, size = 'md', showCount = true }: StarRatingProps) {
  const starSize = size === 'sm' ? '14px' : '18px';
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const hasFullExtra = rating - fullStars >= 0.75;
  const totalFull = hasFullExtra ? fullStars + 1 : fullStars;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 'var(--space-1)',
      fontSize: starSize,
      color: '#f59e0b',
      fontWeight: 600,
    }}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (i <= totalFull) return <span key={i}>★</span>;
        if (i === totalFull + 1 && hasHalf) return <span key={i} style={{ opacity: 0.5 }}>★</span>;
        return <span key={i} style={{ opacity: 0.2 }}>★</span>;
      })}
      <span style={{
        fontSize: 'var(--text-sm)',
        color: 'var(--color-text-tertiary)',
        fontWeight: 400,
        marginLeft: 'var(--space-1)',
      }}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-tertiary)',
        }}>
          ({reviewCount})
        </span>
      )}
    </span>
  );
}
