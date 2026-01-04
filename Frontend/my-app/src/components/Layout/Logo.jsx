const Logo = () => {
  const goHome = () => {
    // use hash routing to go to home
    window.location.href = '/';
  };

  return (
    <div
      className="logo"
      onClick={goHome}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter') goHome(); }}
      style={{ cursor: 'pointer', fontWeight: 'bold', fontSize: '1.4rem', color: '#2c3e50' }}
    >
      ToolRent
    </div>
  );
};

export default Logo;
