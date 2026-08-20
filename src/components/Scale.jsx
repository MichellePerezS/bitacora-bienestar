export default function Scale({ id, options, value, onChange }){
  return (
    <div className="scale" id={id}>
      {options.map(opt => (
        <button
          key={opt.v}
          type="button"
          className={value === opt.v ? 'active' : ''}
          onClick={() => onChange(opt.v)}
        >{opt.label}</button>
      ))}
    </div>
  )
}
