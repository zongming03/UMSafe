
const FilterSlot = ({
  label,
  id,
  value,
  onChange,
  options,
  className = "",
  ...props
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 mb-1"
    >
      {label}
    </label>
    <div className="relative">
      <select
        id={id}
        className={className}
        value={value}
        onChange={onChange}
        {...props}
      >
        {options.map((opt) =>
          typeof opt === "string" ? (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ) : (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )
        )}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      </div>
    </div>
  </div>
);

export default FilterSlot;