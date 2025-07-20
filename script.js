// script.js
let currentSong = new Audio();  
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`http://127.0.0.1:5500/${folder}/`);
        let text = await response.text();
        let div = document.createElement("div");
        div.innerHTML = text;
        let as = div.getElementsByTagName("a");
        songs = [];

        for (let index = 0; index < as.length; index++) {
            const element = as[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(decodeURIComponent(element.href.split(`/${folder}/`)[1]));
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

const playMusic = (track, pause = false) => {
    currentSong.src = `${currFolder.endsWith("/") ? currFolder : currFolder + "/"}` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function loadSongsToUI(songs) {
    let songUL = document.querySelector(".songList ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        let formattedSongName = song
            .replace(".mp3", "")
            .replace(/ *- *\[.*?\]/g, "")
            .replace(/\(.*?\)/g, "");

        songUL.innerHTML += `
        <li>
            <img class="invert" src="music.svg" alt="">
            <div class="info">
                <div>${formattedSongName}</div>
                <div>Mukul</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="">
            </div>
        </li>`;
    }

    let listItems = document.querySelectorAll(".songList ul li");
    listItems.forEach((e, i) => {
        e.addEventListener("click", () => {
            playMusic(songs[i]);
        });
    });
}

async function displayAlbums() {
    let res = await fetch(`http://127.0.0.1:5500/songs/`);
    let text = await res.text();

    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = div.getElementsByTagName("a");

    let cardContainer = document.querySelector(".cardContainer");

    for (let e of anchors) {
        if (e.href.includes("/songs") && !e.href.endsWith(".mp3") && !e.href.endsWith(".json")) {
            let folder = e.href.split("/").slice(-2)[0];

            try {
                let albumRes = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                let data = await albumRes.json();

                cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="0000" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="" />
                    <h2>${data.title}</h2>
                    <p>${data.description}</p>
                </div>`;
            } catch (error) {
                console.log(`Error loading album ${folder}:`, error);
            }
        }
    }

    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async item => {
            const folderName = item.currentTarget.dataset.folder;
            songs = await getSongs(`songs/${folderName}`);
            playMusic(songs[0], true);
            await loadSongsToUI(songs);
        });
    });
}

async function main() {
    await displayAlbums();

    songs = await getSongs("songs/ncs");
    playMusic(songs[0], true);
    await loadSongsToUI(songs);

    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    currentSong.addEventListener("play", () => play.src = "pause.svg");
    currentSong.addEventListener("pause", () => play.src = "play.svg");

    currentSong.addEventListener("timeupdate", () => {
        let songTimeEl = document.querySelector(".songtime");
        if (songTimeEl) {
            songTimeEl.innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration * 100) + "%";
        }
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = e.offsetX / e.target.getBoundingClientRect().width;
        document.querySelector(".circle").style.left = percent * 100 + "%";
        currentSong.currentTime = percent * currentSong.duration;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    if (previous) {
        previous.addEventListener("click", () => {
            let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
            let index = songs.indexOf(currentTrack);
            if (index > 0) playMusic(songs[index - 1]);
        });
    }

    if (next) {
        next.addEventListener("click", () => {
            let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
            let index = songs.indexOf(currentTrack);
            if (index < songs.length - 1) playMusic(songs[index + 1]);
        });
    }

    currentSong.addEventListener("ended", () => {
        let currentTrack = decodeURIComponent(currentSong.src.split("/").pop());
        let index = songs.indexOf(currentTrack);
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });

    document.querySelector(".range input").addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });
}

main();
