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

        // 1. LATEST RESULTS (Highest completed matchday)
        if (r.matches && r.matches.length > 0) {
            const lastGW = Math.max(...r.matches.map(m => m.matchday));
            const latestResults = r.matches.filter(m => m.matchday === lastGW);
            renderResults(latestResults, lastGW);
        }

        // 2. NEXT FIXTURES (Lowest scheduled matchday)
        if (f.matches && f.matches.length > 0) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            const nextFixtures = f.matches.filter(m => m.matchday === nextGW);
            renderFixtures(nextFixtures, nextGW);
        }

        if (v.response) renderVideos(v.response);
    } catch (e) { console.error("Init Error:", e); }
}

function renderResults(matches, gw) {
    UI.results.innerHTML = `<div class="gw-label">Gameweek ${gw} Results</div>` +
    matches.map(m => `
    <div class="item">
    <div class="team"><img src="${m.homeTeam.crest}" class="crest-sm"> ${m.homeTeam.shortName}</div>
    <span class="score">${m.score.fullTime.home} - ${m.score.fullTime.away}</span>
    <div class="team">${m.awayTeam.shortName} <img src="${m.awayTeam.crest}" class="crest-sm"></div>
    </div>
    `).join('');
}

function renderFixtures(matches, gw) {
    UI.fixtures.innerHTML = `<div class="gw-label">Gameweek ${gw} Fixtures</div>` +
    matches.map(m => `
    <div class="item fixture">
    <div class="team"><img src="${m.homeTeam.crest}" class="crest-sm"> ${m.homeTeam.shortName}</div>
    <span class="date">${new Date(m.utcDate).toLocaleDateString([], {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
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
    // Filter by 'Premier League' and ensure we only get the latest 6 for speed
    const pl = videos.filter(v => v.competition.toUpperCase().includes("PREMIER LEAGUE")).slice(0, 6);
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
