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
        playNextSong(); // La lógica de repetición y aleatorio ya está en playNextSong
    });

    progressBar.addEventListener('click', (e) => {
        const width = progressBar.clientWidth;
        const clickX = e.offsetX;
        const duration = audioPlayer.duration;
        audioPlayer.currentTime = (clickX / width) * duration;
    });

    volumeSlider.addEventListener('input', () => {
        audioPlayer.volume = volumeSlider.value / 100;
    });

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // --- Funcionalidad de Búsqueda ---
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredSongs = allSongs.filter(song => {
            const title = song.title.toLowerCase();
            const artist = song.artist.toLowerCase();
            return title.includes(searchTerm) || artist.includes(searchTerm);
        });

        renderSongs(filteredSongs, searchResultsList); // Renderiza los resultados en la sección de búsqueda
        showSection(searchResultsSection, searchLink); // Muestra la sección de resultados
        currentPlaylist = filteredSongs; // Establece los resultados como la playlist actual
        currentSongIndex = -1; // Resetea el índice de la canción actual
        pauseSong(); // Pausa si se estaba reproduciendo algo antes de la búsqueda
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // --- Funcionalidad de Playlists ---
    function savePlaylists() {
        localStorage.setItem('userPlaylists', JSON.stringify(userPlaylists));
    }

    function renderPlaylistsSidebar() {
        playlistListSidebar.innerHTML = ''; // Limpiar lista actual

        // Añadir playlists predefinidas si no existen
        if (!userPlaylists['Favoritas']) userPlaylists['Favoritas'] = [];
        if (!userPlaylists['Rock Clásico']) userPlaylists['Rock Clásico'] = [];
        if (!userPlaylists['Chill Vibes']) userPlaylists['Chill Vibes'] = [];
        savePlaylists(); // Guardar las playlists predefinidas

        Object.keys(userPlaylists).forEach(playlistName => {
            const newPlaylistLi = document.createElement('li');
            newPlaylistLi.innerHTML = `<a href="#" data-playlist-name="${playlistName}"><i class="fas fa-music"></i> ${playlistName}</a>`;
            playlistListSidebar.appendChild(newPlaylistLi);

            newPlaylistLi.querySelector('a').addEventListener('click', (e) => {
                e.preventDefault();
                displayPlaylistSongs(playlistName);
                // Activar el enlace de biblioteca ya que es una playlist
                libraryLink.classList.add('active-link');
                homeLink.classList.remove('active-link');
                searchLink.classList.remove('active-link');
            });
        });
    }

    createPlaylistBtn.addEventListener('click', () => {
        const playlistName = prompt("Ingresa el nombre de la nueva playlist:");
        if (playlistName && playlistName.trim() !== "") {
            const trimmedName = playlistName.trim();
            if (!userPlaylists[trimmedName]) {
                userPlaylists[trimmedName] = [];
                savePlaylists();
                renderPlaylistsSidebar(); // Volver a renderizar para que aparezca la nueva
                alert(`Playlist "${trimmedName}" creada!`);
            } else {
                alert(`La playlist "${trimmedName}" ya existe.`);
            }
        }
    });

    function displayPlaylistSongs(playlistName) {
        showSection(librarySection); // Asegurarse de que la sección de biblioteca esté visible
        libraryContent.innerHTML = ''; // Limpiar la vista de la biblioteca

        const playlistSection = document.createElement('div');
        playlistSection.classList.add('playlist-section');
        playlistSection.innerHTML = `
            <h3>
                ${playlistName}
                <button class="delete-playlist-btn" data-playlist-name="${playlistName}"><i class="fas fa-trash-alt"></i></button>
            </h3>
            <ul class="playlist-songs-list"></ul>
        `;
        libraryContent.appendChild(playlistSection);

        const playlistSongsList = playlistSection.querySelector('.playlist-songs-list');

        if (userPlaylists[playlistName] && userPlaylists[playlistName].length > 0) {
            userPlaylists[playlistName].forEach(songData => {
                const songLi = document.createElement('li');
                songLi.innerHTML = `
                    <img src="${songData.img}" alt="${songData.artist}">
                    <div class="song-info">
                        <h4>${songData.title}</h4>
                        <p>${songData.artist}</p>
                    </div>
                    <button class="remove-song-btn" data-song-id="${songData.id}" data-playlist-name="${playlistName}"><i class="fas fa-times"></i></button>
                `;
                playlistSongsList.appendChild(songLi);

                // Event listener para reproducir desde la playlist
                songLi.addEventListener('click', () => {
                    currentPlaylist = userPlaylists[playlistName]; // Establecer la playlist actual
                    const indexInPlaylist = currentPlaylist.findIndex(s => s.id === songData.id);
                    if (indexInPlaylist !== -1) {
                        loadAndPlaySong(indexInPlaylist);
                    }
                });

                // Event listener para eliminar canción de la playlist
                songLi.querySelector('.remove-song-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // Evitar que el clic en el botón reproduzca la canción
                    removeSongFromPlaylist(playlistName, songData.id);
                });
            });
        } else {
            playlistSongsList.innerHTML = `<p style="color: var(--light-text-color); text-align: center;">Esta playlist está vacía.</p>`;
        }

        // Event listener para eliminar la playlist completa
        playlistSection.querySelector('.delete-playlist-btn').addEventListener('click', () => {
            deletePlaylist(playlistName);
        });
    }

    function removeSongFromPlaylist(playlistName, songId) {
        if (confirm(`¿Estás seguro de que quieres eliminar esta canción de la playlist "${playlistName}"?`)) {
            userPlaylists[playlistName] = userPlaylists[playlistName].filter(song => song.id !== songId);
            savePlaylists();
            displayPlaylistSongs(playlistName); // Recargar la vista de la playlist
        }
    }

    function deletePlaylist(playlistName) {
        if (confirm(`¿Estás seguro de que quieres eliminar la playlist "${playlistName}"? Esta acción es irreversible.`)) {
            delete userPlaylists[playlistName];
            savePlaylists();
            renderPlaylistsSidebar(); // Actualizar la sidebar
            displayLibrary(); // Recargar la vista de la biblioteca
            alert(`Playlist "${playlistName}" eliminada.`);
        }
    }

    function displayLibrary() {
        libraryContent.innerHTML = ''; // Limpiar la vista de la biblioteca
        Object.keys(userPlaylists).forEach(playlistName => {
            displayPlaylistSongs(playlistName); // Reutilizar la función para mostrar cada playlist
        });
        if (Object.keys(userPlaylists).length === 0) {
            libraryContent.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">No tienes playlists aún. Crea una!</p>`;
        }
    }


    // --- Renderizado de Canciones en la UI (Home y Búsqueda) ---
    function renderSongs(songsToRender, containerElement) {
        containerElement.innerHTML = ''; // Limpiar el contenedor actual

        songsToRender.forEach(song => {
            const songItem = document.createElement('div');
            songItem.classList.add('song-item');
            songItem.dataset.src = song.src;
            songItem.dataset.artist = song.artist;
            songItem.dataset.title = song.title;
            songItem.dataset.img = song.img;
            songItem.dataset.id = song.id; // Asignar el ID al dataset

            songItem.innerHTML = `
                <img src="${song.img}" alt="${song.artist}">
                <div class="song-info">
                    <h3>${song.title}</h3>
                    <p>${song.artist}</p>
                </div>
                <div class="song-actions">
                    <button class="play-btn"><i class="fas fa-play"></i></button>
                    <button class="more-options-btn"><i class="fas fa-ellipsis-h"></i>
                        <div class="options-menu">
                            <span data-action="add-to-playlist">Añadir a playlist</span>
                            <span data-action="add-to-queue">Añadir a la fila</span>
                        </div>
                    </button>
                </div>
            `;
            containerElement.appendChild(songItem);

            // Event listener para reproducir
            songItem.querySelector('.play-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                // Encuentra el índice de la canción en la currentPlaylist
                const index = currentPlaylist.findIndex(s => s.id === song.id);
                loadAndPlaySong(index);
            });

            // Event listener para el botón de 3 puntos (more-options-btn)
            const moreOptionsBtn = songItem.querySelector('.more-options-btn');
            moreOptionsBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita que el clic en el botón se propague al song-item
                // Cerrar otros menús abiertos
                document.querySelectorAll('.options-menu').forEach(menu => {
                    if (menu !== moreOptionsBtn.querySelector('.options-menu')) {
                        menu.parentElement.classList.remove('active');
                    }
                });
                moreOptionsBtn.classList.toggle('active'); // Alternar visibilidad del menú
            });

            // Event listeners para las opciones dentro del menú
            songItem.querySelectorAll('.options-menu span').forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation(); // Evita que el clic se propague al botón o item
                    const action = e.target.dataset.action;
                    if (action === 'add-to-playlist') {
                        promptAddToPlaylist(song);
                    } else if (action === 'add-to-queue') {
                        addToQueue(song);
                    }
                    moreOptionsBtn.classList.remove('active'); // Cerrar el menú después de la acción
                });
            });
        });

        // Cerrar el menú de opciones si se hace clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.more-options-btn')) {
                document.querySelectorAll('.more-options-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
            }
        });
    }

    function promptAddToPlaylist(song) {
        const existingPlaylists = Object.keys(userPlaylists).map(name => `- ${name}`).join('\n') || "No hay playlists creadas aún.";
        const playlistChoice = prompt(`¿A qué playlist deseas añadir "${song.title}"?\n\nPlaylists existentes:\n${existingPlaylists}`);

        if (playlistChoice && playlistChoice.trim() !== "") {
            const trimmedChoice = playlistChoice.trim();
            if (userPlaylists[trimmedChoice]) {
                const isAlreadyInPlaylist = userPlaylists[trimmedChoice].some(s => s.id === song.id);
                if (!isAlreadyInPlaylist) {
                    userPlaylists[trimmedChoice].push(song);
                    savePlaylists();
                    alert(`"${song.title}" añadida a la playlist "${trimmedChoice}".`);
                } else {
                    alert(`"${song.title}" ya está en la playlist "${trimmedChoice}".`);
                }
            } else {
                alert(`La playlist "${trimmedChoice}" no existe. Crea una primero.`);
            }
        }
    }

    // --- Funcionalidad de Fila de Reproducción (Queue) ---
    let queue = []; // La fila de canciones que se van a reproducir después de la actual

    function addToQueue(song) {
        queue.push(song);
        updateQueueDisplay();
        alert(`"${song.title}" añadida a la fila.`);
    }

    function updateQueueDisplay() {
        if (!isPlaying && currentSongIndex === -1) {
            // Si no hay canción reproduciéndose, la fila está vacía.
            nowPlayingInQueue.innerHTML = `<p style="color: var(--light-text-color);">Ninguna canción reproduciéndose.</p>`;
            upcomingSongsList.innerHTML = `<p style="color: var(--light-text-color);">La fila está vacía.</p>`;
            return;
        }

        const currentPlayingSong = currentPlaylist[currentSongIndex];
        nowPlayingInQueue.innerHTML = `
            <img src="${currentPlayingSong.img}" alt="${currentPlayingSong.artist}">
            <div class="song-info">
                <h4>${currentPlayingSong.title}</h4>
                <p>${currentPlayingSong.artist}</p>
            </div>
        `;

        upcomingSongsList.innerHTML = '';
        let songsToShowInQueue;

        if (isShuffling && shuffledQueue.length > 0) {
            // Si está barajando, la cola es la shuffledQueue
            const currentShuffledIndex = shuffledQueue.findIndex(s => s.id === currentPlayingSong.id);
            songsToShowInQueue = shuffledQueue.slice(currentShuffledIndex + 1);
            if (currentShuffledIndex !== -1 && currentShuffledIndex < shuffledQueue.length - 1) {
                // Añadir canciones desde el inicio de la shuffledQueue si se está cerca del final
                songsToShowInQueue = songsToShowInQueue.concat(shuffledQueue.slice(0, currentShuffledIndex));
            }
        } else {
            // Si no está barajando, la cola son las siguientes canciones de la currentPlaylist
            songsToShowInQueue = currentPlaylist.slice(currentSongIndex + 1);
            // Si la reproducción es cíclica (repeat all), añade las canciones desde el principio de la playlist
            if (repeatMode === 'all') {
                songsToShowInQueue = songsToShowInQueue.concat(currentPlaylist.slice(0, currentSongIndex));
            }
        }

        // Limitar a, por ejemplo, los próximos 10-15 elementos para no sobrecargar si la playlist es enorme
        songsToShowInQueue.slice(0, 15).forEach(song => {
            const li = document.createElement('li');
            li.classList.add('queue-song-item');
            li.innerHTML = `
                <img src="${song.img}" alt="${song.artist}">
                <div class="song-info">
                    <h4>${song.title}</h4>
                    <p>${song.artist}</p>
                </div>
            `;
            upcomingSongsList.appendChild(li);

            li.addEventListener('click', () => {
                const index = currentPlaylist.findIndex(s => s.id === song.id);
                if (index !== -1) {
                    loadAndPlaySong(index);
                    queueOverlay.classList.remove('visible'); // Cierra la cola al seleccionar canción
                }
            });
        });

        if (songsToShowInQueue.length === 0) {
            upcomingSongsList.innerHTML = `<p style="color: var(--light-text-color);">No hay más canciones en la fila.</p>`;
        }
    }

    queueBtn.addEventListener('click', () => {
        queueOverlay.classList.add('visible');
        updateQueueDisplay(); // Asegurarse de que esté actualizada al abrir
    });

    closeQueueBtn.addEventListener('click', () => {
        queueOverlay.classList.remove('visible');
    });

    // --- Funcionalidad de Pantalla Completa ---
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                isFullscreen = true;
                document.body.classList.add('fullscreen-mode');
                // Ocultar cursor y controles después de un tiempo
                document.body.style.cursor = 'none';
                playerBar.classList.add('hidden-controls');
                startHideControlsTimeout();
            });
        } else {
            document.exitFullscreen().then(() => {
                isFullscreen = false;
                document.body.classList.remove('fullscreen-mode');
                document.body.style.cursor = 'default';
                playerBar.classList.remove('hidden-controls');
                clearTimeout(mouseMoveTimeout);
            });
        }
    }

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    function startHideControlsTimeout() {
        clearTimeout(mouseMoveTimeout);
        mouseMoveTimeout = setTimeout(() => {
            playerBar.classList.add('hidden-controls');
            document.body.style.cursor = 'none';
        }, 3000); // Ocultar después de 3 segundos de inactividad
    }

    document.addEventListener('mousemove', () => {
        if (isFullscreen) {
            playerBar.classList.remove('hidden-controls');
            document.body.style.cursor = 'default';
            startHideControlsTimeout();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isFullscreen) {
            // El navegador ya maneja salir de pantalla completa con Esc, pero aseguramos la UI
            isFullscreen = false;
            document.body.classList.remove('fullscreen-mode');
            document.body.style.cursor = 'default';
            playerBar.classList.remove('hidden-controls');
            clearTimeout(mouseMoveTimeout);
        }
    });
});
