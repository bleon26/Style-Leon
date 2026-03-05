import React, { useState, useEffect } from 'react';
import api, { getImageUrl } from '../api';

const HeroSlider = ({ onAction }) => {
    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSlides = async () => {
            try {
                const res = await api.get('/carousel');
                setSlides(res.data);
            } catch (err) {
                console.error('Error fetching carousel:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

    const goTo = (idx) => {
        if (slides.length === 0) return;
        setCurrentIndex((idx + slides.length) % slides.length);
    };

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) goTo(currentIndex + 1);
        if (isRightSwipe) goTo(currentIndex - 1);
    };

    useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            goTo(currentIndex + 1);
        }, 6000);
        return () => clearInterval(timer);
    }, [currentIndex, slides.length]);

    if (loading) {
        return <section className="hero-section" style={{ height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
            <div className="loader"></div>
        </section>;
    }

    if (slides.length === 0) return null;

    return (
        <section className="hero-section">
            <div
                className="hero-slider"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {slides.map((slide, index) => {
                    const gradient = `linear-gradient(135deg, ${slide.bgGradient[0]} 0%, ${slide.bgGradient[1]} 100%)`;
                    return (
                        <div
                            key={slide._id || slide.id}
                            className={`hero-slide ${index === currentIndex ? 'active' : ''}`}
                            style={{ background: gradient }}
                        >
                            <div className="hero-content">
                                <div className="hero-text">
                                    <span className="hero-tag">{slide.tag}</span>
                                    <h1 className="hero-title" dangerouslySetInnerHTML={{ __html: slide.title }}></h1>
                                    <p className="hero-desc">{slide.description}</p>

                                    <div className="hero-actions">
                                        {slide.buttons?.map((btn, i) => (
                                            <button
                                                key={i}
                                                className={btn.style || (i === 0 ? "btn-primary" : "btn-outline")}
                                                onClick={() => onAction && onAction(btn.action)}
                                            >
                                                {btn.text}
                                            </button>
                                        ))}
                                    </div>

                                    {slide.showStats && slide.stats?.length > 0 && (
                                        <div className="hero-stats">
                                            {slide.stats.map((stat, i) => (
                                                <div key={i} className="stat">
                                                    <span className="stat-num">{stat.value}</span>
                                                    <span className="stat-label">{stat.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {slide.showTimer && (
                                        <div className="flash-countdown">
                                            <div className="countdown-item"><span>05</span><label>hrs</label></div>
                                            <div className="countdown-sep">:</div>
                                            <div className="countdown-item"><span>23</span><label>min</label></div>
                                            <div className="countdown-sep">:</div>
                                            <div className="countdown-item"><span>59</span><label>seg</label></div>
                                        </div>
                                    )}
                                </div>
                                <div className="hero-image-wrap">
                                    <img src={getImageUrl(slide.image)} alt="" className="hero-img" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="slider-dots">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => goTo(index)}
                    />
                ))}
            </div>
            <button className="slider-arrow slider-prev" onClick={() => goTo(currentIndex - 1)}>‹</button>
            <button className="slider-arrow slider-next" onClick={() => goTo(currentIndex + 1)}>›</button>
        </section>
    );
};

export default HeroSlider;
