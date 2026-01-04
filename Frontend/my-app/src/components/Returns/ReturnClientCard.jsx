import React from 'react';

const ReturnClientCard = ({ client, onClick }) => {
  return (
    <li className="card" style={{ cursor: 'pointer' }} onClick={() => onClick(client.id)}>
      <strong>{client.name ? `${client.name} ${client.lastName || ''}` : (client.username || client.email || `Cliente ${client.id}`)}</strong>
      <div style={{ fontSize: 13, color: '#666' }}>{client.username || client.email}</div>
      <div>ID: {client.id}</div>
    </li>
  );
};

export default ReturnClientCard;
