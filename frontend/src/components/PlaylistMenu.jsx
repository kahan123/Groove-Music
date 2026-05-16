import React from 'react';
import { useMusic } from '../context/MusicContext';
import { PlusCircle, Music } from 'lucide-react';
import Swal from 'sweetalert2';

const PlaylistMenu = ({ song, onClose, style }) => {
    const { playlists, addToPlaylist, createPlaylist } = useMusic();

    const handleCreate = async () => {
        const newId = await createPlaylist("New Playlist");
        if (newId) {
            addToPlaylist(newId, song);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Added to New Playlist',
                showConfirmButton: false,
                timer: 1500,
                background: '#333',
                color: '#fff'
            });
            onClose();
        }
    };

    const handleSelect = (playlistId) => {
        addToPlaylist(playlistId, song);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Added to Playlist',
            showConfirmButton: false,
            timer: 1500,
            background: '#333',
            color: '#fff'
        });
        onClose();
    };

    return (
        <>
            {/* Backdrop to close menu */}
            <div
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                onClick={onClose}
            ></div>

            {/* Menu */}
            <div className="playlist-menu" style={{
                position: 'absolute',
                zIndex: 1000,
                background: '#282828',
                borderRadius: '4px',
                padding: '4px',
                minWidth: '200px',
                boxShadow: '0 16px 24px rgba(0,0,0,0.5)',
                ...style
            }}>
                <div style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#b3b3b3',
                    borderBottom: '1px solid #3e3e3e',
                    marginBottom: '4px'
                }}>
                    Add to playlist
                </div>

                <div
                    className="menu-item"
                    onClick={handleCreate}
                    style={{
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        fontSize: '14px',
                        color: 'white',
                    }}
                >
                    <PlusCircle size={16} />
                    <span>New Playlist</span>
                </div>

                {playlists.map(pl => (
                    <div
                        key={pl._id}
                        className="menu-item"
                        onClick={() => handleSelect(pl._id)}
                        style={{
                            padding: '10px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            borderRadius: '2px',
                            fontSize: '14px',
                            color: 'white',
                        }}
                    >
                        <Music size={16} />
                        <span>{pl.name}</span>
                    </div>
                ))}

                <style>{`
                    .menu-item:hover {
                        background-color: #3e3e3e;
                    }
                `}</style>
            </div>
        </>
    );
};

export default PlaylistMenu;
