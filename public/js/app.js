const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    videos: document.getElementById('video-root'),
    status: document.getElementById('sync-status'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

async function init() {
    try {
        const [sRes, rRes, vRes] = await Promise.all([
            fetch('/api/football?type=standings'),
                                                     fetch('/api/football?type=results'),
                                                     fetch('/api/football?type=highlights')
        ]);

        const sData = await sRes.json();
        const rData = await rRes.json();
        const vData = await vRes.json();

        if (sData.standings) renderStandings(sData.standings[0].table);
        if (rData.matches) renderResults(rData.matches);
        if (vData.response) renderVideos(vData.response);

        UI.status.innerText = "● LIVE";
    } catch (e) {
        UI.status.innerText = "Offline";
        console.error(e);
    }
}

function renderStandings(data) {
    UI.standings.innerHTML = data.slice(0, 20).map(r => `
    <tr><td>${r.position}</td><td><img src="${r.team.crest}" class="crest-sm">${r.team.shortName}</td><td>${r.points}</td></tr>
    `).join('');
}

function renderResults(matches) {
    UI.results.innerHTML = matches.map(m => `
    <div class="result-item">
    <span>${m.homeTeam.shortName}</span>
    <span class="score">${m.score.fullTime.home}-${m.score.fullTime.away}</span>
    <span>${m.awayTeam.shortName}</span>
    </div>
    `).join('');
}

function renderVideos(videos) {
    const pl = videos.filter(v => v.competition.toUpperCase().includes("PREMIER LEAGUE")).slice(0, 8);
    if (pl.length === 0) { UI.videos.innerHTML = "No videos today."; return; }

    UI.videos.innerHTML = pl.map(v => `
    <div class="v-card" onclick="play('${btoa(v.videos[0].embed)}')">
    <img src="${v.thumbnail}">
    <div class="v-title">${v.title}</div>
    </div>
    `).join('');
}

window.play = (b64) => {
    UI.player.innerHTML = atob(b64);
    UI.modal.style.display = 'flex';
};

document.querySelector('.close-modal').onclick = () => {
    UI.modal.style.display = 'none';
    UI.player.innerHTML = "";
};

init();
