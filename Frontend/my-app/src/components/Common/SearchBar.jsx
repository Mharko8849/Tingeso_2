/**
 * A simple search bar component.
 * Currently renders a static input field.
 *
 * @returns {JSX.Element} - The search bar input.
 */
const SearchBar = () => {
  return (
    <input
      type="text"
      placeholder="Buscar herramientas..."
      style={{
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        width: '300px',
      }}
    />
  );
};

export default SearchBar;
