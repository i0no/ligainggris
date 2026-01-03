// 1. DEFINE UI ELEMENTS
const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    highlights: document.getElementById('video-root'),
    status: document.getElementById('sync-status'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

// 2. DEFINE RENDER FUNCTIONS FIRST (to avoid "not defined" errors)
function renderStandings(data) {
    if (!UI.standings) return;
    UI.standings.innerHTML = data.slice(0, 15).map(row => `
    <tr>
    <td>${row.position}</td>
    <td><img src="${row.team.crest}" class="crest-sm" width="20"> ${row.team.shortName}</td>
    <td><strong>${row.points}</strong></td>
    </tr>
    `).join('');
}

function renderResults(matches) {
    if (!UI.results) return;
    // Football-data.org returns matches in chronological order; we want latest first
    const latest = [...matches].reverse().slice(0, 8);
    UI.results.innerHTML = latest.map(m => `
    <div class="result-item">
    <span class="t-name">${m.homeTeam.shortName}</span>
    <span class="score">${m.score.fullTime.home} - ${m.score.fullTime.away}</span>
    <span class="t-name">${m.awayTeam.shortName}</span>
    </div>
    `).join('');
}

function renderHighlights(videos) {
    if (!UI.highlights) return;
    // Flexible filter for Premier League
    const pl = videos.filter(v =>
    v.competition.toUpperCase().includes("PREMIER LEAGUE")
    ).slice(0, 8);

    if (pl.length === 0) {
        UI.highlights.innerHTML = "<p>No recent highlights found.</p>";
        return;
    }

    UI.highlights.innerHTML = pl.map(v => `
    <div class="v-card" onclick="playVideo('${btoa(v.videos[0].embed)}', '${v.url}')">
    <img src="${v.thumbnail}" loading="lazy">
    <div class="v-title">${v.title}</div>
    </div>
    `).join('');
}

// 3. VIDEO MODAL LOGIC
window.playVideo = (embed, fallback) => {
    UI.player.innerHTML = atob(embed) +
    `<br><a href="${fallback}" target="_blank" style="color:#00ff85; display:block; margin-top:10px; text-align:center;">Watch on Source</a>`;
    UI.modal.style.display = 'flex';
};

// 4. MAIN INIT FUNCTION
async function init() {
    console.log("🚀 Initializing Dashboard...");

    // A. Fetch Football Data (Standings & Results)
    try {
        const sRes = await fetch('/api/football?type=standings');
        const standings = await sRes.json();
        if (standings.standings) renderStandings(standings.standings[0].table);

        const rRes = await fetch('/api/football?type=results');
        const results = await rRes.json();
        if (results.matches) renderResults(results.matches);

        UI.status.innerText = "Stats Synced";
    } catch (err) {
        console.error("Football Data Error:", err);
        UI.status.innerText = "Stats Error";
    }

    // B. Fetch ScoreBat Highlights (Independent of Football-Data)
    try {
        const hRes = await fetch('https://www.scorebat.com/video-api/v3/');
        const highlights = await hRes.json();
        renderHighlights(highlights.response);
    } catch (err) {
        console.error("ScoreBat Error:", err);
        UI.highlights.innerHTML = "<p>Highlights failed to load.</p>";
    }
}

// 5. EVENT LISTENERS
document.addEventListener('DOMContentLoaded', init);

if (document.querySelector('.close-modal')) {
    document.querySelector('.close-modal').onclick = () => {
        UI.modal.style.display = 'none';
        UI.player.innerHTML = "";
    };
}
