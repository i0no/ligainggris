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

        if (r.matches && r.matches.length > 0) {
            const maxGW = Math.max(...r.matches.map(m => m.matchday));
            const latestRes = r.matches.filter(m => m.matchday === maxGW);
            renderResults(latestRes, maxGW);
        }

        if (f.matches && f.matches.length > 0) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            const upcoming = f.matches.filter(m => m.matchday === nextGW);
            renderFixtures(upcoming, nextGW);
        }

        // VIDEO ERROR HANDLING
        if (v.error) {
            UI.videos.innerHTML = `<p style="color:red; font-size:0.7rem;">YouTube Error: ${v.error}</p>`;
        } else if (v && v.length > 0) {
            renderVideos(v);
        } else {
            UI.videos.innerHTML = `<p style="color:#888; font-size:0.7rem;">No videos found. Check API key.</p>`;
        }

    } catch (e) { console.error("Init Error:", e); }
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
    if (!videos || videos.length === 0) {
        UI.videos.innerHTML = `<p style="color:#888; font-size:0.8rem; text-align:center;">API Key active but no videos found. Try redeploying Netlify.</p>`;
        return;
    }

    UI.videos.innerHTML = videos.map(v => {
        const title = v.snippet.title.replace(/[^\w\s]/gi, ''); // Clean title
        const thumb = v.snippet.thumbnails.high.url;
        const videoId = v.id.videoId;

        return `
        <div class="v-card" onclick="playYT('${videoId}')">
        <img src="${thumb}" alt="thumbnail">
        <div class="v-overlay">
        <span class="play-btn">▶</span>
        <div class="v-title">${title}</div>
        </div>
        </div>
        `;
    }).join('');
}

window.playYT = (id) => {
    UI.player.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1" allowfullscreen></iframe>`;
    UI.modal.style.display = 'flex';
};

window.closeVideo = () => {
    UI.modal.style.display = 'none';
    UI.player.innerHTML = "";
};

init();
