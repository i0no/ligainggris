const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    news: document.getElementById('news-root'),
    pager: document.getElementById('video-pager-dots'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

let allMatches = [];
const PAGE_SIZE = 6;

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
            allMatches = r.matches.filter(m => m.matchday === maxGW);
            renderResults(allMatches, maxGW);
            showPage(0);
        }

        if (f.matches) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
        }
    } catch (e) { console.error(e); }
}

async function showPage(idx) {
    UI.videos.innerHTML = `<div class="loader">LOADING...</div>`;

    // Pagination Dots
    const totalPages = Math.ceil(allMatches.length / PAGE_SIZE);
    UI.pager.innerHTML = "";
    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('span');
        dot.className = i === idx ? "active" : "";
        dot.onclick = () => showPage(i);
        UI.pager.appendChild(dot);
    }

    const matches = allMatches.slice(idx * PAGE_SIZE, (idx + 1) * PAGE_SIZE);
    const results = await Promise.all(matches.map(m => {
        const q = `${m.homeTeam.shortName} vs ${m.awayTeam.shortName}`;
        return fetch(`/api/football?type=highlights&q=${encodeURIComponent(q)}`).then(res => res.json());
    }));

    UI.videos.innerHTML = "";
    results.forEach(data => { if (data && data[0]) renderVideoCard(data[0]); });
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
    UI.news.innerHTML = `<div class="section-title">News</div>` + news.slice(0, 8).map(item => `<a href="${item.link}" target="_blank" class="news-item"><div class="news-meta">SKY SPORTS</div><div class="news-title">${item.title}</div></a>`).join('');
}

window.closeVideo = () => { UI.modal.style.display = 'none'; UI.player.innerHTML = ""; };
init();
