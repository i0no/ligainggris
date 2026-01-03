const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

async function init() {
    try {
        const [s, r, f, v] = await Promise.all([
            fetch('/api/football?type=standings').then(res => res.json()),
                                               fetch('/api/football?type=results').then(res => res.json()),
                                               fetch('/api/football?type=fixtures').then(res => res.json()),
                                               fetch('/api/football?type=highlights').then(res => res.json())
        ]);

        if (s.standings) renderStandings(s.standings[0].table);

        // FILTER: Only show the last completed gameweek
        if (r.matches) {
            const lastGameweek = r.matches[0]?.matchday;
            const filteredResults = r.matches.filter(m => m.matchday === lastGameweek);
            renderResults(filteredResults, lastGameweek);
        }

        if (f.matches) renderFixtures(f.matches);
        if (v.response) renderVideos(v.response);
    } catch (e) { console.error("Load failed", e); }
}

function renderResults(matches, gw) {
    let html = `<div class="gw-label">Gameweek ${gw} Results</div>`;
    html += matches.map(m => `
    <div class="item">
    <span>${m.homeTeam.shortName}</span>
    <span class="score">${m.score.fullTime.home}-${m.score.fullTime.away}</span>
    <span>${m.awayTeam.shortName}</span>
    </div>
    `).join('');
    UI.results.innerHTML = html;
}

function renderStandings(data) {
    UI.standings.innerHTML = data.slice(0, 20).map(r => `
    <tr><td>${r.position}</td><td>${r.team.shortName}</td><td><strong>${r.points}</strong></td></tr>
    `).join('');
}

function renderFixtures(matches) {
    UI.fixtures.innerHTML = matches.slice(0, 8).map(m => `
    <div class="item">
    <span>${m.homeTeam.shortName} vs ${m.awayTeam.shortName}</span>
    <span class="date">${new Date(m.utcDate).toLocaleDateString([], {day:'numeric', month:'short'})}</span>
    </div>
    `).join('');
}

function renderVideos(videos) {
    const pl = videos.filter(v => v.competition.toUpperCase().includes("PREMIER LEAGUE")).slice(0, 8);
    UI.videos.innerHTML = pl.map(v => `
    <div class="v-card" onclick="playVideo('${btoa(v.videos[0].embed)}')">
    <img src="${v.thumbnail}">
    <div class="v-title">${v.title}</div>
    </div>
    `).join('');
}

window.playVideo = (b64) => {
    UI.player.innerHTML = atob(b64);
    UI.modal.style.display = 'flex';
};

window.closeVideo = () => {
    UI.modal.style.display = 'none';
    UI.player.innerHTML = "";
};

init();
