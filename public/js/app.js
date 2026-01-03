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

        // FIX: Find the LATEST matchday by sorting descending
        if (r.matches && r.matches.length > 0) {
            const sortedMatches = r.matches.sort((a, b) => b.matchday - a.matchday);
            const latestGW = sortedMatches[0].matchday;
            const latestResults = sortedMatches.filter(m => m.matchday === latestGW);
            renderResults(latestResults, latestGW);
        }

        if (f.matches) renderFixtures(f.matches);
        if (v.response) renderVideos(v.response);
    } catch (e) { console.error("Init Error:", e); }
}

function renderResults(matches, gw) {
    let html = `<div class="gw-label">Gameweek ${gw} - Latest Results</div>`;
    html += matches.map(m => `
    <div class="item">
    <div class="team">
    <img src="${m.homeTeam.crest}" class="crest-sm">
    <span>${m.homeTeam.shortName}</span>
    </div>
    <span class="score">${m.score.fullTime.home} - ${m.score.fullTime.away}</span>
    <div class="team">
    <span>${m.awayTeam.shortName}</span>
    <img src="${m.awayTeam.crest}" class="crest-sm">
    </div>
    </div>
    `).join('');
    UI.results.innerHTML = html;
}

function renderStandings(data) {
    UI.standings.innerHTML = data.map(r => `
    <tr>
    <td>${r.position}</td>
    <td class="team-cell"><img src="${r.team.crest}" class="crest-sm"> ${r.team.shortName}</td>
    <td><strong>${r.points}</strong></td>
    </tr>
    `).join('');
}

function renderFixtures(matches) {
    UI.fixtures.innerHTML = matches.map(m => `
    <div class="item fixture">
    <div class="team"><img src="${m.homeTeam.crest}" class="crest-sm"> ${m.homeTeam.shortName}</div>
    <span class="vs">vs</span>
    <div class="team">${m.awayTeam.shortName} <img src="${m.awayTeam.crest}" class="crest-sm"></div>
    </div>
    `).join('');
}

function renderVideos(videos) {
    const pl = videos.filter(v => v.competition.toUpperCase().includes("PREMIER LEAGUE")).slice(0, 8);
    UI.videos.innerHTML = pl.map(v => `
    <div class="v-card" onclick="playVideo('${btoa(v.videos[0].embed)}')">
    <img src="${v.thumbnail}" loading="lazy">
    <div class="v-overlay">
    <span class="play-btn">▶</span>
    <div class="v-title">${v.title}</div>
    </div>
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
