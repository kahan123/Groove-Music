import React from 'react';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content confirm-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                <div className="modal-body">
                    <p className="confirm-message">{message}</p>
                    <div className="confirm-actions">
                        <button className="confirm-btn cancel" onClick={onCancel}>Cancel</button>
                        <button className="confirm-btn delete" onClick={onConfirm}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
