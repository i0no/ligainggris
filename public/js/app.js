const UI = {
    standings: document.getElementById('standings-root'),
    matches: document.getElementById('matches-root'),
    highlights: document.getElementById('highlights-root'),
    status: document.getElementById('sync-status'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

/**
 * Professional Skeleton Loaders
 */
const showSkeletons = () => {
    UI.standings.innerHTML = Array(10).fill(0).map(() => `
    <tr><td colspan="5"><div class="skeleton" style="height:25px; margin:5px 0"></div></td></tr>
    `).join('');
    UI.matches.innerHTML = Array(4).fill(0).map(() => `
    <div class="skeleton" style="height:60px; border-radius:12px; margin-bottom:10px"></div>
    `).join('');
    UI.highlights.innerHTML = Array(3).fill(0).map(() => `
    <div class="skeleton" style="height:150px; border-radius:16px"></div>
    `).join('');
};

/**
 * Data Fetching Logic
 */
async function initDashboard() {
    showSkeletons();

    try {
        // Run all API calls in parallel for speed
        const [standingsRes, matchesRes, highlightsRes] = await Promise.all([
            fetch('/api/football?type=standings'),
                                                                            fetch('/api/football?type=matches'),
                                                                            fetch('https://www.scorebat.com/video-api/v3/')
        ]);

        const standingsData = await standingsRes.json();
        const matchesData = await matchesRes.json();
        const highlightsData = await highlightsRes.json();

        renderStandings(standingsData.standings[0].table);
        renderMatches(matchesData.matches);
        renderHighlights(highlightsData.response);

        UI.status.innerText = `Updated: ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
    } catch (err) {
        UI.status.innerText = "Sync Failed";
        console.error("Dashboard Error:", err);
    }
}

function renderStandings(data) {
    UI.standings.innerHTML = data.slice(0, 10).map(row => `
    <tr>
    <td>${row.position}</td>
    <td>
    <div class="team-info">
    <img src="${row.team.crest}" class="crest" loading="lazy">
    <span>${row.team.shortName}</span>
    </div>
    </td>
    <td>${row.playedGames}</td>
    <td>${row.goalDifference}</td>
    <td><strong>${row.points}</strong></td>
    </tr>
    `).join('');
}

function renderMatches(data) {
    const nextMatches = data.slice(0, 4);
    UI.matches.innerHTML = nextMatches.map(m => `
    <div class="fixture-card">
    <div class="fixture-date">${new Date(m.utcDate).toLocaleDateString('en-GB', {weekday:'short', day:'numeric'})} • ${new Date(m.utcDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
    <div class="fixture-teams">
    <span>${m.homeTeam.name}</span>
    <span class="vs">vs</span>
    <span>${m.awayTeam.name}</span>
    </div>
    </div>
    `).join('');
}

function renderHighlights(response) {
    // Filter for Premier League only
    const pl = response.filter(item => item.competition === "ENGLAND: Premier League").slice(0, 3);

    if (pl.length === 0) {
        UI.highlights.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:#888;'>No recent highlights found.</p>";
        return;
    }

    UI.highlights.innerHTML = pl.map(m => `
    <div class="video-card" onclick="openVideo('${btoa(m.videos[0].embed)}')">
    <img src="${m.thumbnail}" alt="${m.title}">
    <div class="video-overlay">
    <span class="play-icon">▶</span>
    <div class="video-title">${m.title}</div>
    </div>
    </div>
    `).join('');
}

/**
 * Video Modal Logic
 */
window.openVideo = (encodedEmbed) => {
    const embedCode = atob(encodedEmbed);
    UI.player.innerHTML = embedCode;
    UI.modal.style.display = "flex";
};

document.querySelector('.close-modal').onclick = () => {
    UI.modal.style.display = "none";
    UI.player.innerHTML = ""; // Stop video playback
};

window.onclick = (event) => {
    if (event.target == UI.modal) {
        UI.modal.style.display = "none";
        UI.player.innerHTML = "";
    }
};

document.addEventListener('DOMContentLoaded', initDashboard);
