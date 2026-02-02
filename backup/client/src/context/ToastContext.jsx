import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const success = (msg, duration) => addToast(msg, 'success', duration);
    const error = (msg, duration) => addToast(msg, 'error', duration);
    const info = (msg, duration) => addToast(msg, 'info', duration);

    return (
        <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast key={toast.id} {...toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

const Toast = ({ id, message, type, duration, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, duration, onRemove]);

    const icons = {
        success: <CheckCircle size={20} color="#1db954" />,
        error: <AlertCircle size={20} color="#ff5555" />,
        info: <Info size={20} color="#2e77d0" />
    };

    return (
        <div className={`toast toast-${type}`}>
            <div className="toast-icon">{icons[type]}</div>
            <div className="toast-message">{message}</div>
            <button className="toast-close" onClick={() => onRemove(id)}>
                <X size={16} />
            </button>
        </div>
    );
};
