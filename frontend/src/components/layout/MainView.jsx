import React from 'react';
import Home from '../../pages/Home';
import Explore from '../../pages/Explore';
import Search from '../../pages/Search';
import Playlist from '../../pages/Playlist';
import LikedSongs from '../../pages/LikedSongs'; // We need to create this
import QueueView from '../QueueView';

const MainView = ({ view, setView }) => {
    switch (view) {
        case 'home':
            return <Home />;
        case 'explore':
            return <Explore onSearch={(term) => setView(`search:${term}`)} setView={setView} />;
        case 'search':
            return <Search />;
        case 'queue':
            return <QueueView />;
        case 'liked':
            return <LikedSongs />;
        default:
            if (view.startsWith('search:')) {
                const term = view.split(':')[1];
                return <Search initialTerm={term} />;
            }
            if (view.startsWith('playlist:')) {
                const playlistId = view.split(':')[1];
                return <Playlist playlistId={playlistId} />;
            }
            return <Home />;
    }
};

export default MainView;
