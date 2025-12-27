import React, { useEffect, useRef } from 'react';

const ContextMenu = ({ x, y, options, onClose }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };

        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', onClose);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', onClose);
        };
    }, [onClose]);

    // Adjust position to keep in viewport
    const style = {
        top: y,
        left: x,
    };

    // Simple bounds check (if we had ref dims, we could do better, but simple CSS transform is safer for now)
    // We'll trust the parent or CSS to handle basic overflow or flip logic if needed, 
    // but specific x/y is usually fine for desktop mouse.

    return (
        <div className="context-menu" ref={menuRef} style={style}>
            {options.map((opt, i) => (
                <div
                    key={i}
                    className="context-menu-item"
                    onClick={() => {
                        opt.action();
                        onClose();
                    }}
                >
                    {opt.label}
                </div>
            ))}
        </div>
    );
};

export default ContextMenu;
