import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ScrollableSection = ({ title, children }) => {
    const scrollRef = useRef(null);
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setShowLeft(scrollLeft > 0);
        setShowRight(scrollLeft < scrollWidth - clientWidth - 5);
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [children]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -(clientWidth * 0.7) : (clientWidth * 0.7);
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(checkScroll, 400);
        }
    };

    return (
        <section className="shelf-section shelf-relative">
            <h2>{title}</h2>
            {showLeft && (
                <button className="scroll-btn left" onClick={() => scroll('left')}>
                    <ChevronLeft size={24} />
                </button>
            )}
            <div
                className="shelf-scroll"
                ref={scrollRef}
                onScroll={checkScroll}
            >
                {children}
            </div>
            {showRight && (
                <button className="scroll-btn right" onClick={() => scroll('right')}>
                    <ChevronRight size={24} />
                </button>
            )}
        </section>
    );
};

export default ScrollableSection;
