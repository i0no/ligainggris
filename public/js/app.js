const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    news: document.getElementById('news-root'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

async function init() {
    try {
        const [s, r, f, n] = await Promise.all([
            fetch('/api/football?type=standings').then(res => res.json()),
                                               fetch('/api/football?type=results').then(res => res.json()),
                                               fetch('/api/football?type=fixtures').then(res => res.json()),
                                               fetch('/api/football?type=news').then(res => res.json())
        ]);

        if (s.standings) renderStandings(s.standings[0].table);
        if (n) renderNews(n);

        if (r.matches) {
            const maxGW = Math.max(...r.matches.map(m => m.matchday));
            const latestMatches = r.matches.filter(m => m.matchday === maxGW);
            renderResults(latestMatches, maxGW);

            // Load the first 6 videos only
            loadHighlights(latestMatches.slice(0, 6));
        }

        if (f.matches) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
        }
    } catch (e) { console.error("Load failed", e); }
}

async function loadHighlights(matches) {
    UI.videos.innerHTML = "";
    for (const m of matches) {
        const q = `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`;
        try {
            const res = await fetch(`/api/football?type=highlights&q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data && data[0]) renderVideoCard(data[0]);
        } catch (err) { console.error("Error fetching video", q); }
    }
}

function renderVideoCard(v) {
    const div = document.createElement('div');
    div.className = 'v-card';
    div.onclick = () => {
        UI.player.innerHTML = `<iframe src="https://www.youtube.com/embed/${v.id.videoId}?autoplay=1" allowfullscreen></iframe>`;
        UI.modal.style.display = 'flex';
    };
    div.innerHTML = `<img src="${v.snippet.thumbnails.high.url}"><div class="v-title">${v.snippet.title}</div>`;
    UI.videos.appendChild(div);
}

function renderResults(m, g) {
    UI.results.innerHTML = `<div class="section-title">Results GW ${g}</div>` +
    m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><span class="score">${match.score.fullTime.home}-${match.score.fullTime.away}</span><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join('');
}

function renderStandings(data) {
    UI.standings.innerHTML = `<div class="section-title">Table</div><table class="mini-table">` +
    data.map(r => `<tr><td>${r.position}</td><td class="team"><img src="${r.team.crest}" class="crest-sm"> ${r.team.shortName}</td><td>${r.points}</td></tr>`).join('') + `</table>`;
}

function renderFixtures(m, g) {
    UI.fixtures.innerHTML = `<div class="section-title">Next GW ${g}</div>` +
    m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join('');
}

function renderNews(news) {
    UI.news.innerHTML = `<div class="section-title">Latest News</div>` +
    news.slice(0, 8).map(item => `<a href="${item.link}" target="_blank" class="news-item"><div class="news-meta">SKY SPORTS</div><div class="news-title">${item.title}</div></a>`).join('');
}

window.closeVideo = () => { UI.modal.style.display = 'none'; UI.player.innerHTML = ""; };
init();
