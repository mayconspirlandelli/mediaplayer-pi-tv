import { useEffect, useState } from 'react';
import './UniversalRegion.css';

export default function UniversalRegion({ content, onComplete, regionName = "Mídia" }) {
    const [error, setError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        console.log(`🌐 UniversalRegion (${regionName}): Conteúdo recebido:`, content);
        if (content) {
            setError(false);
            setIsLoaded(false);
        }
    }, [content, regionName]);

    // Fallback para Erros
    useEffect(() => {
        if (!error || !onComplete) return;

        const errorTimer = setTimeout(() => {
            console.warn(`⚠️ UniversalRegion (${regionName}): Erro na mídia. Pulando...`);
            onComplete();
        }, 5000);

        return () => clearTimeout(errorTimer);
    }, [error, onComplete, regionName]);

    const tipo = content?.tipo;
    const isVideo = tipo === 'video';
    const isImage = tipo === 'imagem';
    const isYoutube = tipo === 'youtube';
    const isLink = tipo === 'link';

    // Parser de URLs para Embeds
    const getEmbedUrl = (url) => {
        if (!url) return '';

        // YouTube (Normal, Shorts, Live)
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            let videoId = '';
            if (url.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('embed/')) {
                videoId = url.split('embed/')[1].split('?')[0];
            } else if (url.includes('/shorts/')) {
                videoId = url.split('/shorts/')[1].split('?')[0];
            } else if (url.includes('/live/')) {
                videoId = url.split('/live/')[1].split('?')[0];
            }
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&enablejsapi=1`;
        }

        // Instagram (Posts, Reels)
        if (url.includes('instagram.com')) {
            // Remover query strings e garantir que termine em /embed
            let cleanUrl = url.split('?')[0];
            if (!cleanUrl.endsWith('/')) cleanUrl += '/';
            return `${cleanUrl}embed`;
        }

        // TikTok
        if (url.includes('tiktok.com')) {
            // O TikTok requer um formato específico para embed
            // Exemplo: https://www.tiktok.com/embed/v2/7289562854321
            const videoIdMatch = url.match(/\/video\/(\d+)/);
            if (videoIdMatch) {
                return `https://www.tiktok.com/embed/v2/${videoIdMatch[1]}`;
            }
            // Fallback para o link original (pode não funcionar sem o v2/embed)
            return url;
        }

        return url;
    };

    // Timer para mídias que não avisam o fim (Imagens, YouTube, Instagram, TikTok)
    useEffect(() => {
        if (!content || isVideo || !isLoaded || !onComplete) return;

        const duration = content.duracao || 10;
        console.log(`🌐 UniversalRegion (${regionName}): ${content.nome}, temporizador de ${duration}s iniciado.`);

        const timer = setTimeout(() => {
            onComplete();
        }, duration * 1000);

        return () => clearTimeout(timer);
    }, [content, isLoaded, onComplete, isVideo, regionName]);

    const isEmbed = isYoutube || isLink;

    if (!content) {
        return (
            <div className="no-content">
                <div>
                    <div className="icon">📂</div>
                    <div>Região {regionName}: Sem mídia agendada</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="no-content error">
                <div>
                    <div className="icon">⚠️</div>
                    <div>Erro ao carregar mídia</div>
                    <div className="small">{content.nome}</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`universal-container ${tipo}`}>
            {!isLoaded && (
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            )}

            {/* Background Blur (Só para mídias locais ou imagens) */}
            {!isEmbed && (
                isVideo ? (
                    <video
                        key={`bg-vid-${content.id}`}
                        src={`/${content.caminho_arquivo}`}
                        className={`universal-background ${isLoaded ? 'loaded' : ''}`}
                        muted
                        loop
                        autoPlay
                    />
                ) : (
                    <img
                        key={`bg-img-${content.id}`}
                        src={`/${content.caminho_arquivo}`}
                        alt=""
                        className={`universal-background ${isLoaded ? 'loaded' : ''}`}
                    />
                )
            )}

            {/* Main Content */}
            <div className="universal-foreground">
                {isVideo ? (
                    <video
                        key={`fg-vid-${content.id}`}
                        src={`/${content.caminho_arquivo}`}
                        className={`universal-media ${isLoaded ? 'loaded' : ''}`}
                        autoPlay
                        muted
                        playsInline
                        onLoadedData={() => setIsLoaded(true)}
                        onEnded={() => onComplete()}
                        onError={() => setError(true)}
                    />
                ) : isEmbed ? (
                    <iframe
                        key={`fg-emb-${content.id}`}
                        src={getEmbedUrl(content.caminho_arquivo)}
                        className={`universal-media embed-frame ${isLoaded ? 'loaded' : ''}`}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setError(true)}
                        allow="autoplay; encrypted-media"
                        title={content.nome}
                        scrolling="no"
                    />
                ) : (
                    <img
                        key={`fg-img-${content.id}`}
                        src={`/${content.caminho_arquivo}`}
                        alt={content.nome}
                        className={`universal-media ${isLoaded ? 'loaded' : ''}`}
                        onLoad={() => setIsLoaded(true)}
                        onError={() => setError(true)}
                    />
                )}
            </div>
        </div>
    );
}
