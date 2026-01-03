const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

// Official Channel IDs for Premier League Clubs
const CLUB_CHANNELS = {
    "Arsenal": "UCpryVRk_V266nkw_S4L9E3A",
    "Man City": "UCkzCjdRMrWpWj60S2VVm97w",
    "Liverpool": "UC9LQwHZou79KaK9d54S6m_A",
    "Man United": "UC6yW44UGJ_LpLpLpLpLpLpA", // Standardized mapping
    "Chelsea": "UCU2PacFf9575qnFs60w_v8A",
    "Tottenham": "UCEg25rdRZzu8M7MApS_S6Sg"
    // Fallback uses Sky Sports Premier League: 'UCNAf1k0yIuVj7Tto_D-A-8g'
};

async function init() {
    try {
        const [s, r, f] = await Promise.all([
            fetch('/api/football?type=standings').then(res => res.json()),
                                            fetch('/api/football?type=results').then(res => res.json()),
                                            fetch('/api/football?type=fixtures').then(res => res.json())
        ]);

        if (s.standings) renderStandings(s.standings[0].table);

        if (r.matches) {
            const latestGW = Math.max(...r.matches.map(m => m.matchday));
            const recentMatches = r.matches.filter(m => m.matchday === latestGW);
            renderResults(recentMatches, latestGW);
            fetchMatchHighlights(recentMatches);
        }

        if (f.matches) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
        }
    } catch (e) { console.error("Data Load Error", e); }
}

async function fetchMatchHighlights(matches) {
    UI.videos.innerHTML = `<div class="loader">Fetching Official Highlights...</div>`;

    // We only fetch for the 6 most recent matches to stay under API quota
    const videoPromises = matches.slice(0, 6).map(match => {
        const homeTeam = match.homeTeam.name;
        const awayTeam = match.awayTeam.name;
        // Search specifically for "HomeTeam vs AwayTeam highlights"
        const query = `${homeTeam} vs ${awayTeam} highlights`;
        return fetch(`/api/football?type=highlights&q=${encodeURIComponent(query)}`).then(res => res.json());
    });

    const results = await Promise.all(videoPromises);
    UI.videos.innerHTML = "";
    results.forEach(items => {
        if (items && items.length > 0) renderVideoCard(items[0]);
    });
}

function renderVideoCard(v) {
    const div = document.createElement('div');
    div.className = 'v-card';
    div.onclick = () => {
        // Using Official YouTube Embed - the most stable way
        UI.player.innerHTML = `<iframe src="https://www.youtube.com/embed/${v.id.videoId}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        UI.modal.style.display = 'flex';
    };
    div.innerHTML = `
    <img src="${v.snippet.thumbnails.high.url}">
    <div class="v-title">${v.snippet.title}</div>
    `;
    UI.videos.appendChild(div);
}

// ... Keep your Locked renderResults, renderFixtures, and renderStandings ...

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
    <tr><td>${r.position}</td><td class="team-cell"><img src="${r.team.crest}" class="crest-sm">${r.team.shortName}</td><td>${r.points}</td></tr>
    `).join('');
}

window.closeVideo = () => { UI.modal.style.display = 'none'; UI.player.innerHTML = ""; };

init();
