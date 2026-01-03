const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

// Piped and Invidious instances for maximum reliability
const INSTANCES = [
    "https://pipedapi.kavin.rocks",
"https://api.piped.projectsegfau.lt",
"https://inv.vern.cc",
"https://yewtu.be"
];

let bestInstance = "https://piped.video";

async function checkServerHealth() {
    console.log("Checking server health...");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const checks = INSTANCES.map(url =>
    fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal })
    .then(() => url.replace('api.', ''))
    .catch(() => null)
    );

    const results = await Promise.all(checks);
    bestInstance = results.find(r => r !== null) || "https://piped.video";
    console.log("Best server found:", bestInstance);
}

async function init() {
    // Check health and fetch data simultaneously
    const [_, s, r, f] = await Promise.all([
        checkServerHealth(),
                                           fetch('/api/football?type=standings').then(res => res.json()),
                                           fetch('/api/football?type=results').then(res => res.json()),
                                           fetch('/api/football?type=fixtures').then(res => res.json())
    ]);

    if (s.standings) renderStandings(s.standings[0].table);

    if (r.matches) {
        const maxGW = Math.max(...r.matches.map(m => m.matchday));
        const latest = r.matches.filter(m => m.matchday === maxGW);
        renderResults(latest, maxGW);
        fetchMatchHighlights(latest);
    }

    if (f.matches) {
        const nextGW = Math.min(...f.matches.map(m => m.matchday));
        renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
    }
}

async function fetchMatchHighlights(matches) {
    UI.videos.innerHTML = `<div class="loader">Optimizing video servers...</div>`;
    const topMatches = matches.slice(0, 6);

    const videoResults = await Promise.all(topMatches.map(match => {
        const term = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;
        return fetch(`/api/football?type=highlights&q=${encodeURIComponent(term)}`).then(res => res.json());
    }));

    UI.videos.innerHTML = "";
    videoResults.forEach(items => {
        if (items && items.length > 0) renderVideoCard(items[0]);
    });
}

function renderVideoCard(v) {
    const div = document.createElement('div');
    div.className = 'v-card';
    div.onclick = () => {
        UI.player.innerHTML = `<iframe src="${bestInstance}/embed/${v.id.videoId}?autoplay=1" allowfullscreen></iframe>`;
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
    UI.fixtures.innerHTML = `<div class="gw-label">Upcoming: Gameweek ${gw}</div>` +
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
