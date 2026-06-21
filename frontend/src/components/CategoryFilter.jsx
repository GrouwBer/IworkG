function CategoryFilter({ categories, selected, onSelect }) {
  return (
    <div className="category-filter">
      <button
        className={`filter-chip ${selected === null ? 'active' : ''}`}
        onClick={() => onSelect(null)}
      >
        Todas
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          className={`filter-chip ${selected === cat.id ? 'active' : ''}`}
          onClick={() => onSelect(selected === cat.id ? null : cat.id)}
        >
          {cat.icone} {cat.nome}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
