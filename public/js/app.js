const UI = {
    standings: document.getElementById('standings-root'),
    matches: document.getElementById('matches-root'),
    highlights: document.getElementById('highlights-root'),
    status: document.getElementById('sync-status'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

async function initDashboard() {
    try {
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

        UI.status.innerText = "Sync Active";
    } catch (err) {
        console.error(err);
        UI.status.innerText = "Sync Error";
    }
}

function renderHighlights(response) {
    // Increased slice to 8 to show more clubs
    const pl = response.filter(item => item.competition === "ENGLAND: Premier League").slice(0, 8);

    UI.highlights.innerHTML = pl.map((m, index) => {
        // Find the first video embed available
        const embedCode = m.videos && m.videos[0] ? m.videos[0].embed : '';
        // Escape quotes for the onclick function
        const safeEmbed = btoa(embedCode);

        return `
        <div class="video-card" onclick="openVideo('${safeEmbed}')">
        <img src="${m.thumbnail}" alt="${m.title}">
        <div class="video-overlay">
        <div style="color:var(--brand-accent); font-weight:800; font-size:1.2rem; margin-bottom:5px;">▶</div>
        <div class="video-title" style="color:white; font-size:0.8rem; font-weight:600;">${m.title}</div>
        </div>
        </div>
        `;
    }).join('');
}

window.openVideo = (encodedEmbed) => {
    const embedCode = atob(encodedEmbed);
    if (!embedCode) return alert("Video not available");

    // Inject the actual iframe code into the player div
    UI.player.innerHTML = embedCode;
    UI.modal.style.display = "flex";
    document.body.style.overflow = "hidden"; // Prevent scrolling
};

// Existing modal close logic
document.querySelector('.close-modal').onclick = closeModal;
UI.modal.onclick = (e) => { if(e.target === UI.modal) closeModal(); };

function closeModal() {
    UI.modal.style.display = "none";
    UI.player.innerHTML = "";
    document.body.style.overflow = "auto";
}

function renderStandings(data) {
    UI.standings.innerHTML = data.slice(0, 20).map(row => `
    <tr>
    <td>${row.position}</td>
    <td>
    <div class="team-info">
    <img src="${row.team.crest}" class="crest" width="24">
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
    UI.matches.innerHTML = data.slice(0, 5).map(m => `
    <div class="fixture-card" style="padding:15px; border-bottom:1px solid #eee;">
    <div style="font-size:0.7rem; color:var(--brand-secondary); font-weight:700;">${new Date(m.utcDate).toLocaleDateString()}</div>
    <div style="font-weight:700; color:var(--brand-primary);">${m.homeTeam.shortName} vs ${m.awayTeam.shortName}</div>
    </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initDashboard);
