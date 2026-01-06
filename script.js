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

    const songListContainer = document.getElementById('song-list');
    const songItems = document.querySelectorAll('.song-item');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchLink = document.getElementById('search-link');

    const createPlaylistBtn = document.getElementById('create-playlist-btn');
    const playlistList = document.getElementById('playlist-list');
    const addToPlaylistButtons = document.querySelectorAll('.add-to-playlist-btn');

    // --- Variables de Estado del Reproductor ---
    let currentSongIndex = -1;
    let isPlaying = false;
    let songs = []; // Almacenará los datos de las canciones
    let shuffledSongs = [];
    let isShuffling = false;
    let repeatMode = 'none'; // 'none', 'one', 'all'

    // --- Paletas de Colores ---
    const paletteButtons = document.querySelectorAll('.palette-btn');
    paletteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const palette = button.dataset.palette;
            document.body.className = ''; // Limpia clases existentes
            document.body.classList.add(palette);
        });
    });

    // --- Inicialización de Canciones ---
    // Recopila las canciones del HTML para manejarlas con JS
    songItems.forEach((item, index) => {
        songs.push({
            src: item.dataset.src,
            artist: item.dataset.artist,
            title: item.dataset.title,
            img: item.dataset.img,
            element: item // Referencia al elemento HTML original
        });
        // Añadir evento de clic para reproducir desde el item de la lista
        item.querySelector('.play-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que se dispare el evento del item completo
            loadAndPlaySong(index);
        });
    });

    // --- Funciones del Reproductor ---

    function playSong() {
        audioPlayer.play();
        isPlaying = true;
        playPauseIcon.classList.remove('fa-play');
        playPauseIcon.classList.add('fa-pause');
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
            if (audioPlayer.src === "") { // Si no hay canción cargada, carga la primera
                loadAndPlaySong(0);
            } else {
                playSong();
            }
        }
    }

    function loadAndPlaySong(index) {
        if (index < 0 || index >= songs.length) return; // Validación de índice

        currentSongIndex = index;
        const song = songs[currentSongIndex];

        audioPlayer.src = song.src;
        playerSongImg.src = song.img;
        playerSongTitle.textContent = song.title;
        playerArtistName.textContent = song.artist;

        // Actualizar el estilo de la canción activa en la lista
        document.querySelectorAll('.song-item').forEach(item => {
            item.classList.remove('active-song');
        });
        song.element.classList.add('active-song');

        playSong();
    }

    function playNextSong() {
        let nextIndex = currentSongIndex;

        if (isShuffling) {
            // Asegurarse de que shuffledSongs esté inicializado y tenga elementos
            if (shuffledSongs.length === 0 || shuffledSongs.length !== songs.length) {
                shuffleSongs(); // Si no está barajado o la lista de barajado no coincide
            }
            // Encontrar el índice actual en la lista barajada
            let currentShuffledIndex = shuffledSongs.findIndex(s => s.src === songs[currentSongIndex].src);
            nextIndex = shuffledSongs[(currentShuffledIndex + 1) % shuffledSongs.length].originalIndex;
        } else {
            nextIndex = (currentSongIndex + 1) % songs.length;
        }

        loadAndPlaySong(nextIndex);
    }

    function playPrevSong() {
        let prevIndex = currentSongIndex;

        if (isShuffling) {
            if (shuffledSongs.length === 0 || shuffledSongs.length !== songs.length) {
                shuffleSongs();
            }
            let currentShuffledIndex = shuffledSongs.findIndex(s => s.src === songs[currentSongIndex].src);
            prevIndex = (currentShuffledIndex - 1 + shuffledSongs.length) % shuffledSongs.length;
            prevIndex = shuffledSongs[prevIndex].originalIndex;
        } else {
            prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        }
        loadAndPlaySong(prevIndex);
    }

    function shuffleSongs() {
        isShuffling = !isShuffling;
        shuffleBtn.classList.toggle('active', isShuffling);

        if (isShuffling) {
            shuffledSongs = songs.map((song, index) => ({ ...song, originalIndex: index }));
            for (let i = shuffledSongs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledSongs[i], shuffledSongs[j]] = [shuffledSongs[j], shuffledSongs[i]];
            }
        }
        // No cambia la canción actual, solo el orden de la siguiente
    }

    function toggleRepeat() {
        if (repeatMode === 'none') {
            repeatMode = 'all';
            repeatBtn.classList.add('active');
            repeatBtn.classList.remove('one');
        } else if (repeatMode === 'all') {
            repeatMode = 'one';
            repeatBtn.classList.add('active', 'one');
        } else {
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
        if (repeatMode === 'one') {
            playSong(); // Reproduce la misma canción de nuevo
        } else if (repeatMode === 'all') {
            playNextSong(); // Pasa a la siguiente canción
        } else {
            // Si no hay repetición y la canción termina, pausa
            pauseSong();
            // Opcional: reiniciar la barra de progreso
            progress.style.width = '0%';
            currentTimeSpan.textContent = '0:00';
        }
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
        songItems.forEach(item => {
            const title = item.dataset.title.toLowerCase();
            const artist = item.dataset.artist.toLowerCase();
            if (title.includes(searchTerm) || artist.includes(searchTerm)) {
                item.style.display = 'flex'; // Muestra la canción
            } else {
                item.style.display = 'none'; // Oculta la canción
            }
        });
    }

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        } else {
            // Realizar búsqueda en tiempo real mientras escribe
            performSearch();
        }
    });
    searchLink.addEventListener('click', () => {
        searchInput.focus(); // Enfoca la barra de búsqueda al hacer clic en el enlace
    });

    // --- Funcionalidad de Playlists (Básica - con prompts) ---
    let userPlaylists = {}; // Almacena playlists en memoria (no persistente)

    createPlaylistBtn.addEventListener('click', () => {
        const playlistName = prompt("Ingresa el nombre de la nueva playlist:");
        if (playlistName && playlistName.trim() !== "") {
            const trimmedName = playlistName.trim();
            if (!userPlaylists[trimmedName]) {
                userPlaylists[trimmedName] = []; // Inicializa la playlist
                // Añadir al DOM
                const newPlaylistLi = document.createElement('li');
                newPlaylistLi.innerHTML = `<a href="#" data-playlist-name="${trimmedName}"><i class="fas fa-music"></i> ${trimmedName}</a>`;
                playlistList.appendChild(newPlaylistLi);

                // Evento para cargar la playlist
                newPlaylistLi.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    displayPlaylistSongs(trimmedName);
                });
                alert(`Playlist "${trimmedName}" creada!`);
            } else {
                alert(`La playlist "${trimmedName}" ya existe.`);
            }
        }
    });

    // Función para mostrar canciones de una playlist
    function displayPlaylistSongs(playlistName) {
        // Limpiar la vista actual de canciones
        songListContainer.innerHTML = '';

        if (userPlaylists[playlistName] && userPlaylists[playlistName].length > 0) {
            userPlaylists[playlistName].forEach(songData => {
                // Recrear el song-item para mostrarlo en la lista
                const songItemEl = document.createElement('div');
                songItemEl.classList.add('song-item');
                songItemEl.dataset.src = songData.src;
                songItemEl.dataset.artist = songData.artist;
                songItemEl.dataset.title = songData.title;
                songItemEl.dataset.img = songData.img;

                songItemEl.innerHTML = `
                    <img src="${songData.img}" alt="${songData.artist}">
                    <div class="song-info">
                        <h3>${songData.title}</h3>
                        <p>${songData.artist}</p>
                    </div>
                    <div class="song-actions">
                        <button class="play-btn"><i class="fas fa-play"></i></button>
                        <button class="add-to-playlist-btn" disabled><i class="fas fa-plus"></i></button>
                        <button class="more-options-btn"><i class="fas fa-ellipsis-h"></i></button>
                    </div>
                `;
                songListContainer.appendChild(songItemEl);

                // Reasignar eventos de reproducción para las canciones de la playlist
                songItemEl.querySelector('.play-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    const indexInAllSongs = songs.findIndex(s => s.src === songData.src);
                    if (indexInAllSongs !== -1) {
                        loadAndPlaySong(indexInAllSongs);
                    }
                });
            });
        } else {
            songListContainer.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Esta playlist no tiene canciones. Añade algunas!</p>`;
        }
    }

    // Evento para añadir canciones a playlists
    addToPlaylistButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Evita que se reproduzca la canción si se hace clic accidentalmente
            const songItem = e.target.closest('.song-item');
            const songData = {
                src: songItem.dataset.src,
                artist: songItem.dataset.artist,
                title: songItem.dataset.title,
                img: songItem.dataset.img
            };

            const existingPlaylists = Object.keys(userPlaylists).map(name => `- ${name}`).join('\n') || "No hay playlists creadas aún.";
            const playlistChoice = prompt(`¿A qué playlist deseas añadir "${songData.title}"?\n\nPlaylists existentes:\n${existingPlaylists}`);

            if (playlistChoice && playlistChoice.trim() !== "") {
                const trimmedChoice = playlistChoice.trim();
                if (userPlaylists[trimmedChoice]) {
                    // Evitar duplicados simples
                    const isAlreadyInPlaylist = userPlaylists[trimmedChoice].some(s => s.src === songData.src);
                    if (!isAlreadyInPlaylist) {
                        userPlaylists[trimmedChoice].push(songData);
                        alert(`"${songData.title}" añadida a la playlist "${trimmedChoice}".`);
                    } else {
                        alert(`"${songData.title}" ya está en la playlist "${trimmedChoice}".`);
                    }
                } else {
                    alert(`La playlist "${trimmedChoice}" no existe. Crea una primero.`);
                }
            }
        });
    });

    // Eventos para cargar las playlists existentes al inicio
    document.querySelectorAll('.playlist-list a').forEach(link => {
        const playlistName = link.dataset.playlistName;
        // Inicializar las playlists predefinidas como vacías
        if (!userPlaylists[playlistName]) {
            userPlaylists[playlistName] = [];
        }
        link.addEventListener('click', (e) => {
            e.preventDefault();
            displayPlaylistSongs(playlistName);
        });
    });

    // Cargar la vista de canciones por defecto al inicio
    function loadDefaultSongView() {
        songListContainer.innerHTML = ''; // Limpiar la lista
        songs.forEach(songData => {
            const songItemEl = songData.element.cloneNode(true); // Clonar el elemento original
            songListContainer.appendChild(songItemEl);

            // Reasignar eventos para el clon
            songItemEl.querySelector('.play-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const indexInAllSongs = songs.findIndex(s => s.src === songData.src);
                if (indexInAllSongs !== -1) {
                    loadAndPlaySong(indexInAllSongs);
                }
            });
            songItemEl.querySelector('.add-to-playlist-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                const clonedSongItem = e.target.closest('.song-item');
                const clonedSongData = {
                    src: clonedSongItem.dataset.src,
                    artist: clonedSongItem.dataset.artist,
                    title: clonedSongItem.dataset.title,
                    img: clonedSongItem.dataset.img
                };
                const existingPlaylists = Object.keys(userPlaylists).map(name => `- ${name}`).join('\n') || "No hay playlists creadas aún.";
                const playlistChoice = prompt(`¿A qué playlist deseas añadir "${clonedSongData.title}"?\n\nPlaylists existentes:\n${existingPlaylists}`);

                if (playlistChoice && playlistChoice.trim() !== "") {
                    const trimmedChoice = playlistChoice.trim();
                    if (userPlaylists[trimmedChoice]) {
                        const isAlreadyInPlaylist = userPlaylists[trimmedChoice].some(s => s.src === clonedSongData.src);
                        if (!isAlreadyInPlaylist) {
                            userPlaylists[trimmedChoice].push(clonedSongData);
                            alert(`"${clonedSongData.title}" añadida a la playlist "${trimmedChoice}".`);
                        } else {
                            alert(`"${clonedSongData.title}" ya está en la playlist "${trimmedChoice}".`);
                        }
                    } else {
                        alert(`La playlist "${trimmedChoice}" no existe. Crea una primero.`);
                    }
                }
            });
        });
    }

    // Asegurarse de que la vista predeterminada se cargue al inicio
    loadDefaultSongView();

    // Cargar la primera canción al inicio para que el reproductor no esté vacío
    if (songs.length > 0) {
        loadAndPlaySong(0); // Carga la primera canción, pero no la reproduce automáticamente
        pauseSong(); // Asegúrate de que esté pausada al inicio
    }
});
