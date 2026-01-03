const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

// Mixed list of Invidious and Piped for better survival
const SERVERS = [
    { url: "https://yewtu.be", type: "invidious" },
{ url: "https://vid.puffyan.us", type: "invidious" },
{ url: "https://piped.projectsegfau.lt", type: "piped" },
{ url: "https://inv.vern.cc", type: "invidious" }
];

let activeIndex = 0;

async function init() {
    try {
        const [s, r, f] = await Promise.all([
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
    } catch (e) { console.error("Init Error:", e); }
}

async function fetchMatchHighlights(matches) {
    UI.videos.innerHTML = `<div class="loader">Loading Match Highlights...</div>`;
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
    div.onclick = () => loadVideo(v.id.videoId);
    div.innerHTML = `
    <img src="${v.snippet.thumbnails.high.url}">
    <div class="v-title">${v.snippet.title}</div>
    `;
    UI.videos.appendChild(div);
}

function loadVideo(id) {
    const server = SERVERS[activeIndex];
    // Invidious needs local=true, Piped doesn't.
    const embedPath = server.type === "invidious" ? `/embed/${id}?local=true&autoplay=1` : `/embed/${id}?autoplay=1`;

    UI.player.innerHTML = `
    <div class="player-wrapper">
    <iframe src="${server.url}${embedPath}" allowfullscreen></iframe>
    <div class="server-status">
    Current Server: ${server.url.split('//')[1]}
    <button onclick="nextServer('${id}')">❌ Video Broken? Try Next Server</button>
    </div>
    </div>
    `;
    UI.modal.style.display = 'flex';
}

window.nextServer = (id) => {
    activeIndex = (activeIndex + 1) % SERVERS.length;
    loadVideo(id);
};

// --- DATA RENDERING (LOCKED) ---
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
