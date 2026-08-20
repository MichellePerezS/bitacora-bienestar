export default function TagGroup({ tags, active, multi, onChange, hint }){
  const isActive = (tag) => multi ? active.includes(tag) : active === tag

  const toggle = (tag) => {
    if(multi){
      onChange(active.includes(tag) ? active.filter(t => t !== tag) : [...active, tag])
    }else{
      onChange(active === tag ? null : tag)
    }
  }

  return (
    <>
      <div className="tags">
        {tags.map(tag => (
          <div
            key={tag}
            className={'tag' + (isActive(tag) ? ' active' : '')}
            onClick={() => toggle(tag)}
          >{tag}</div>
        ))}
      </div>
      {hint && <div className="tag-hint">{hint}</div>}
    </>
  )
}
