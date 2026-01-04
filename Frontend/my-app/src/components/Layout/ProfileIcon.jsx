const ProfileIcon = () => {
  return (
    <div
      style={{
        width: '35px',
        height: '35px',
        borderRadius: '50%',
        backgroundColor: '#ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
      title="Perfil"
    >
      <span style={{ fontSize: '1.2rem' }}>👤</span>
    </div>
  );
};

export default ProfileIcon;
