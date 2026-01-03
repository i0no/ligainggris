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

        // 1. LATEST COMPLETED GAMEWEEK
        if (r.matches && r.matches.length > 0) {
            const maxGW = Math.max(...r.matches.map(m => m.matchday));
            const latestRes = r.matches.filter(m => m.matchday === maxGW);
            renderResults(latestRes, maxGW);
        }

        // 2. NEXT UPCOMING GAMEWEEK
        if (f.matches && f.matches.length > 0) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            const upcoming = f.matches.filter(m => m.matchday === nextGW);
            renderFixtures(upcoming, nextGW);
        }

        // 3. YOUTUBE HIGHLIGHTS
        if (v && v.length > 0) renderVideos(v);

    } catch (e) { console.error("Load failed", e); }
}

function renderResults(matches, gw) {
    UI.results.innerHTML = `<div class="gw-label">Gameweek ${gw} Results</div>` +
    matches.map(m => `
    <div class="item">
    <div class="team"><img src="${m.homeTeam.crest}" class="crest-sm"> ${m.homeTeam.shortName}</div>
    <span class="score">${m.score.fullTime.home}-${m.score.fullTime.away}</span>
    <div class="team">${m.awayTeam.shortName} <img src="${m.awayTeam.crest}" class="crest-sm"></div>
    </div>
    `).join('');
}

function renderFixtures(matches, gw) {
    UI.fixtures.innerHTML = `<div class="gw-label">Next: Gameweek ${gw}</div>` +
    matches.map(m => `
    <div class="item">
    <div class="team"><img src="${m.homeTeam.crest}" class="crest-sm"> ${m.homeTeam.shortName}</div>
    <span class="date">${new Date(m.utcDate).toLocaleDateString([], {day:'numeric', month:'short'})}</span>
    <div class="team">${m.awayTeam.shortName} <img src="${m.awayTeam.crest}" class="crest-sm"></div>
    </div>
    `).join('');
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

function renderVideos(videos) {
    UI.videos.innerHTML = videos.map(v => `
    <div class="v-card" onclick="playYT('${v.id.videoId}')">
    <img src="${v.snippet.thumbnails.high.url}" loading="lazy">
    <div class="v-title">${v.snippet.title}</div>
    </div>
    `).join('');
}

window.playYT = (id) => {
    UI.player.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    UI.modal.style.display = 'flex';
};

window.closeVideo = () => {
    UI.modal.style.display = 'none';
    UI.player.innerHTML = "";
};

init();
