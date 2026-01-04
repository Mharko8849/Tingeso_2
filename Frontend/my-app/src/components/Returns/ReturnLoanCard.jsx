import React from 'react';

const ReturnLoanCard = ({ loan, onClick }) => {
  return (
    <li className="card" style={{ cursor: 'pointer' }} onClick={() => onClick(loan.id)}>
      <strong>Pedido #{loan.id}</strong>
      <div>Fecha inicio: {loan.initDate}</div>
      <div>Fecha devolución: {loan.returnDate}</div>
      <div>Estado: {loan.status}</div>
    </li>
  );
};

export default ReturnLoanCard;
