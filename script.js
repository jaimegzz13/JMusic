document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const audioPlayer = document.getElementById('audio-player');
    const mainPlayPauseBtn = document.getElementById('main-play-pause-btn');
    const playPauseIcon = mainPlayPauseBtn.querySelector('i');
    const playerSongImg = document.getElementById('player-song-img');
    const playerSongTitle = document.getElementById('player-song-title');
    const playerArtistName = document.getElementById('player-artist-name');
    const progressBar = document.getElementById('progress-bar');
    const progress = document.getElementById('progress');
    const currentTimeSpan = document.getElementById('current-time');
    const totalTimeSpan = document.getElementById('total-time');
    const volumeSlider = document.getElementById('volume-slider');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');

    const dynamicContent = document.getElementById('dynamic-content'); // Contenedor principal de secciones
    const homeSection = document.getElementById('home-section');
    const searchResultsSection = document.getElementById('search-results-section');
    const librarySection = document.getElementById('library-section');
    const libraryContent = document.getElementById('library-content'); // Para mostrar playlists en la biblioteca
    const songListContainer = document.getElementById('song-list'); // Contenedor de canciones de la sección Home
    const searchResultsList = document.getElementById('search-results-list'); // Contenedor de resultados de búsqueda

    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const homeLink = document.getElementById('home-link');
    const searchLink = document.getElementById('search-link');
    const libraryLink = document.getElementById('library-link');
    const sidebarNavLinks = document.querySelectorAll('.main-nav a'); // Todos los enlaces de navegación principales

    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const playlistListSidebar = document.getElementById('playlist-list'); // Renombrado para claridad

    // Elementos para la funcionalidad de pantalla completa
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const fullscreenBackground = document.getElementById('fullscreen-background');
    const playerBar = document.querySelector('.player-bar');

    // Elementos de la fila de reproducción (Queue)
    const queueBtn = document.getElementById('queue-btn');
    const queueOverlay = document.getElementById('queue-overlay');
    const closeQueueBtn = document.getElementById('close-queue-btn');
    const nowPlayingInQueue = document.getElementById('now-playing-in-queue');
    const upcomingSongsList = document.getElementById('upcoming-songs-list');

    // --- Variables de Estado del Reproductor ---
    let currentSongIndex = -1;
    let isPlaying = false;
    let allSongs = []; // Todas las canciones disponibles en la app
    let currentPlaylist = []; // La lista de canciones que se está reproduciendo o se va a reproducir (puede ser una playlist, resultados de búsqueda, o todas las canciones)
    let shuffledQueue = []; // Cola de canciones barajadas
    let isShuffling = false;
    let repeatMode = 'none'; // 'none', 'all', 'one'
    let isFullscreen = false;
    let mouseMoveTimeout;

    // Persistencia de playlists (simulada con localStorage)
    let userPlaylists = JSON.parse(localStorage.getItem('userPlaylists')) || {};

    // --- Paletas de Colores ---
    const paletteButtons = document.querySelectorAll('.palette-btn');
    paletteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const palette = button.dataset.palette;
            // Primero, removemos todas las clases de paleta existentes
            document.body.className = Array.from(document.body.classList).filter(c => !c.includes('-') || c.includes('fullscreen-mode')).join(' ');
            // Luego, añadimos la nueva paleta o la clase 'default' si es necesario
            if (palette !== 'default') {
                document.body.classList.add(palette);
            }
            // Si estamos en pantalla completa, asegurarnos de que la clase fullscreen-mode se mantenga
            if (isFullscreen) {
                document.body.classList.add('fullscreen-mode');
            }
        });
    });

    // --- Inicialización de Canciones y UI ---
    // Recopila las canciones del HTML y las guarda en allSongs
    document.querySelectorAll('.song-item').forEach((item, index) => {
        allSongs.push({
            src: item.dataset.src,
            artist: item.dataset.artist,
            title: item.dataset.title,
            img: item.dataset.img,
            id: `song-${index}` // Asignar un ID único para fácil referencia
        });
    });

    // Cargar la vista predeterminada al inicio (Home)
    renderSongs(allSongs, songListContainer);
    currentPlaylist = [...allSongs]; // Por defecto, la playlist actual son todas las canciones

    // Cargar la primera canción al inicio para que el reproductor no esté vacío
    if (allSongs.length > 0) {
        loadAndPlaySong(0); // Carga la primera canción
        pauseSong(); // Asegúrate de que esté pausada al inicio
    }

    // Inicializa la lista de playlists en la sidebar
    renderPlaylistsSidebar();

    // --- Funciones de Navegación de Secciones ---
    function showSection(sectionElement, linkElement = null) {
        // Ocultar todas las secciones de contenido dinámico
        homeSection.style.display = 'none';
        searchResultsSection.style.display = 'none';
        librarySection.style.display = 'none';
        dynamicContent.style.display = 'none'; // Ocultar el contenedor por defecto

        // Mostrar la sección deseada
        if (sectionElement === homeSection) {
            dynamicContent.style.display = 'block'; // Mostrar el contenedor para home y paleta
            homeSection.style.display = 'block';
        } else {
            sectionElement.style.display = 'block';
        }

        // Actualizar clase 'active-link' en la sidebar
        sidebarNavLinks.forEach(link => link.classList.remove('active-link'));
        if (linkElement) {
            linkElement.classList.add('active-link');
        } else if (sectionElement === homeSection) { // Si es home, activar el enlace de home
            homeLink.classList.add('active-link');
        }
    }

    // Event listeners para los enlaces de navegación
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderSongs(allSongs, songListContainer); // Volver a cargar todas las canciones
        currentPlaylist = [...allSongs]; // Reiniciar la playlist actual a todas las canciones
        showSection(homeSection, homeLink);
    });

    searchLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(searchResultsSection, searchLink);
        searchInput.focus(); // Enfocar el input de búsqueda
    });

    libraryLink.addEventListener('click', (e) => {
        e.preventDefault();
        displayLibrary();
        showSection(librarySection, libraryLink);
    });

    // Mostrar la sección de inicio por defecto al cargar la página
    showSection(homeSection, homeLink);


    // --- Funciones del Reproductor ---

    function playSong() {
        audioPlayer.play();
        isPlaying = true;
        playPauseIcon.classList.remove('fa-play');
        playPauseIcon.classList.add('fa-pause');
        updateQueueDisplay(); // Actualizar la fila de reproducción
    }

    function pauseSong() {
        audioPlayer.pause();
        isPlaying = false;
        playPauseIcon.classList.remove('fa-pause');
        playPauseIcon.classList.add('fa-play');
    }

    function togglePlayPause() {
        if (isPlaying) {
            pauseSong();
        } else {
            if (audioPlayer.src === "" || currentSongIndex === -1) {
                // Si no hay canción cargada, carga la primera de la currentPlaylist
                loadAndPlaySong(0);
            } else {
                playSong();
            }
        }
    }

    function loadAndPlaySong(indexInCurrentPlaylist) {
        if (indexInCurrentPlaylist < 0 || indexInCurrentPlaylist >= currentPlaylist.length) return;

        currentSongIndex = indexInCurrentPlaylist;
        const song = currentPlaylist[currentSongIndex];

        audioPlayer.src = song.src;
        playerSongImg.src = song.img;
        playerSongTitle.textContent = song.title;
        playerArtistName.textContent = song.artist;

        // Actualiza el fondo borroso en pantalla completa
        if (song.img) {
            fullscreenBackground.style.backgroundImage = `url('${song.img}')`;
        } else {
            fullscreenBackground.style.backgroundImage = 'none';
        }

        // Resaltar la canción activa en la vista actual (si aplica)
        document.querySelectorAll('.song-item').forEach(item => {
            item.classList.remove('active-song');
        });
        const activeSongElement = document.querySelector(`.song-item[data-id="${song.id}"]`);
        if (activeSongElement) {
            activeSongElement.classList.add('active-song');
        }

        playSong();
    }

    function playNextSong() {
        if (repeatMode === 'one') {
            audioPlayer.currentTime = 0;
            playSong();
            return;
        }

        let nextIndexInQueue;
        if (isShuffling && shuffledQueue.length > 0) {
            // Encuentra la posición de la canción actual en la cola barajada
            let currentShuffledIndex = shuffledQueue.findIndex(s => s.id === currentPlaylist[currentSongIndex].id);
            nextIndexInQueue = (currentShuffledIndex + 1) % shuffledQueue.length;
            // Encuentra el índice original en `currentPlaylist` del siguiente elemento en `shuffledQueue`
            const nextSongId = shuffledQueue[nextIndexInQueue].id;
            const nextSongIndex = currentPlaylist.findIndex(s => s.id === nextSongId);
            loadAndPlaySong(nextSongIndex);
        } else {
            nextIndexInQueue = (currentSongIndex + 1) % currentPlaylist.length;
            loadAndPlaySong(nextIndexInQueue);
        }
    }


    function playPrevSong() {
        if (audioPlayer.currentTime > 3) {
            audioPlayer.currentTime = 0;
            return;
        }

        let prevIndexInQueue;
        if (isShuffling && shuffledQueue.length > 0) {
            let currentShuffledIndex = shuffledQueue.findIndex(s => s.id === currentPlaylist[currentSongIndex].id);
            prevIndexInQueue = (currentShuffledIndex - 1 + shuffledQueue.length) % shuffledQueue.length;
            const prevSongId = shuffledQueue[prevIndexInQueue].id;
            const prevSongIndex = currentPlaylist.findIndex(s => s.id === prevSongId);
            loadAndPlaySong(prevSongIndex);
        } else {
            prevIndexInQueue = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
            loadAndPlaySong(prevIndexInQueue);
        }
    }

    function shuffleSongs() {
        isShuffling = !isShuffling;
        shuffleBtn.classList.toggle('active', isShuffling);

        if (isShuffling) {
            shuffledQueue = [...currentPlaylist]; // Copia la playlist actual
            // Algoritmo de Fisher-Yates para barajar
            for (let i = shuffledQueue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
            }
        } else {
            shuffledQueue = []; // Limpiar la cola barajada si se desactiva
        }
        updateQueueDisplay();
    }

    function toggleRepeat() {
        if (repeatMode === 'none') {
            repeatMode = 'all';
            repeatBtn.classList.add('active');
            repeatBtn.classList.remove('one');
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            repeatBtn.classList.add('active', 'one');
        } else { // repeatMode === 'one'
            repeatMode = 'none';
            repeatBtn.classList.remove('active', 'one');
        }
    }

    // --- Event Listeners del Reproductor ---
    mainPlayPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', playPrevSong);
    nextBtn.addEventListener('click', playNextSong);
    shuffleBtn.addEventListener('click', shuffleSongs);
    repeatBtn.addEventListener('click', toggleRepeat);

    audioPlayer.addEventListener('timeupdate', () => {
        const percentage = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progress.style.width = `${percentage}%`;
        currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
    });

    audioPlayer.addEventListener('loadedmetadata', () => {
        totalTimeSpan.textContent = formatTime(audioPlayer.duration);
    });

    audioPlayer.addEventListener('ended', () => {
        playNextSong(); // La lógica
