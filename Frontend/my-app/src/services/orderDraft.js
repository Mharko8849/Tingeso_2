import api from './http-common';

export const ORDER_STORAGE_KEYS = {
  client: 'order_selected_client',
  items: 'order_items',
  resume: 'order_resume',
  loanId: 'order_loan_id',
};

export const clearOrderDraftLocally = () => {
  try {
    sessionStorage.removeItem(ORDER_STORAGE_KEYS.client);
    sessionStorage.removeItem(ORDER_STORAGE_KEYS.items);
    sessionStorage.removeItem(ORDER_STORAGE_KEYS.resume);
    sessionStorage.removeItem(ORDER_STORAGE_KEYS.loanId);
  } catch (e) {
    // ignore storage errors
  }
};

export const cancelOrderDraft = async () => {
  let loanId = null;
  try {
    loanId = sessionStorage.getItem(ORDER_STORAGE_KEYS.loanId);
  } catch (e) {
    loanId = null;
  }

  if (!loanId) {
    clearOrderDraftLocally();
    return;
  }

  try {
    await api.delete(`/loans/${loanId}`);
  } catch (e) {
    // swallow error: if delete fails we still clear local draft
    // console.warn('Could not delete draft loan on navigation', e?.response?.data || e.message || e);
  } finally {
    clearOrderDraftLocally();
  }
};
