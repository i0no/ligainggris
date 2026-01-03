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
        const [s, r, f] = await Promise.all([
            fetch('/api/football?type=standings').then(res => res.json()),
                                            fetch('/api/football?type=results').then(res => res.json()),
                                            fetch('/api/football?type=fixtures').then(res => res.json())
        ]);

        if (s.standings) renderStandings(s.standings[0].table);

        if (r.matches && r.matches.length > 0) {
            const maxGW = Math.max(...r.matches.map(m => m.matchday));
            const latestMatches = r.matches.filter(m => m.matchday === maxGW);
            renderResults(latestMatches, maxGW);
            fetchMatchHighlights(latestMatches);
        }

        if (f.matches && f.matches.length > 0) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
        }
    } catch (e) { console.error("Init failed", e); }
}

async function fetchMatchHighlights(matches) {
    UI.videos.innerHTML = `<p style="grid-column:1/-1; color:#888; font-size:0.8rem;">Fetching unblocked highlights...</p>`;
    const topMatches = matches.slice(0, 6);

    const videoRequests = topMatches.map(match => {
        const term = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
        return fetch(`/api/football?type=highlights&q=${encodeURIComponent(term)}`).then(res => res.json());
    });

    const videoResults = await Promise.all(videoRequests);
    UI.videos.innerHTML = "";

    videoResults.forEach(items => {
        if (items && items.length > 0) renderVideoCard(items[0]);
    });
}

function renderVideoCard(v) {
    const div = document.createElement('div');
    div.className = 'v-card';
    div.onclick = () => {
        // PIPED PROXY TO BYPASS GEO-BLOCKING
        UI.player.innerHTML = `<iframe src="https://piped.video/embed/${v.id.videoId}?autoplay=1" allowfullscreen></iframe>`;
        UI.modal.style.display = 'flex';
    };
    div.innerHTML = `
    <img src="${v.snippet.thumbnails.high.url}">
    <div class="v-title">${v.snippet.title}</div>
    `;
    UI.videos.appendChild(div);
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
    UI.fixtures.innerHTML = `<div class="gw-label">Upcoming GW ${gw}</div>` +
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
    <tr><td>${r.position}</td><td class="team-cell"><img src="${r.team.crest}" class="crest-sm">${r.team.shortName}</td><td>${r.points}</td></tr>
    `).join('');
}

window.closeVideo = () => { UI.modal.style.display = 'none'; UI.player.innerHTML = ""; };

init();
