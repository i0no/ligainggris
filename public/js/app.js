const UI = {
    standings: document.getElementById('standings-root'),
    matches: document.getElementById('matches-root'),
    status: document.getElementById('sync-status')
};

// Professional Skeleton Loader
const showSkeletons = () => {
    UI.standings.innerHTML = Array(10).fill(0).map(() => `
        <tr>
            <td colspan="5"><div class="skeleton"></div></td>
        </tr>
    `).join('');
    UI.matches.innerHTML = Array(3).fill(0).map(() => `
        <div class="fixture-card"><div class="skeleton" style="height:50px"></div></div>
    `).join('');
};

async function initDashboard() {
    showSkeletons();
    
    try {
        const [standingsRes, matchesRes] = await Promise.all([
            fetch('/.netlify/functions/football?type=standings'),
            fetch('/.netlify/functions/football?type=matches')
        ]);

        const standingsData = await standingsRes.json();
        const matchesData = await matchesRes.json();

        renderStandings(standingsData.standings[0].table);
        renderMatches(matchesData.matches);
        
        UI.status.innerText = `Last Sync: ${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
    } catch (err) {
        UI.status.innerText = "Offline Mode";
        console.error("Dashboard Sync Error:", err);
    }
}

function renderStandings(data) {
    UI.standings.innerHTML = data.map(row => `
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
    const nextFive = data.slice(0, 5);
    UI.matches.innerHTML = nextFive.map(m => `
        <div class="fixture-card">
            <div class="fixture-date">${new Date(m.utcDate).toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'})} • ${new Date(m.utcDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            <div class="fixture-teams">
                <span>${m.homeTeam.name}</span>
                <span style="color:#bbb; font-size:0.7rem">VS</span>
                <span>${m.awayTeam.name}</span>
            </div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', initDashboard);
