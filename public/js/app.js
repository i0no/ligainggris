const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    news: document.getElementById('news-root'), // Make sure this ID exists in your HTML
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

let allMatches = [];
let videoLimit = 6;

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
            // Fetch initial 6
            fetchMatchHighlights(allMatches.slice(0, videoLimit));
        }

        if (f.matches) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
        }
    } catch (e) { console.error(e); }
}

async function fetchMatchHighlights(matches) {
    const videoResults = await Promise.all(matches.map(match => {
        const term = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;
        return fetch(`/api/football?type=highlights&q=${encodeURIComponent(term)}`).then(res => res.json());
    }));

    videoResults.forEach(items => {
        if (items && items.length > 0) renderVideoCard(items[0]);
    });

        renderPaginationDots();
}

function renderPaginationDots() {
    let dot = document.getElementById('load-more-btn');
    if (!dot) {
        dot = document.createElement('div');
        dot.id = "load-more-btn";
        dot.className = "load-more-dots";
        dot.innerHTML = "<span></span><span></span><span></span>";
        // Place dots between video grid and news
        UI.videos.after(dot);
    }

    dot.onclick = async () => {
        const nextSet = allMatches.slice(videoLimit, videoLimit + 3);
        videoLimit += 3;
        await fetchMatchHighlights(nextSet);
        if (videoLimit >= allMatches.length) dot.remove();
    };

        if (videoLimit >= allMatches.length) dot.remove();
}

function renderNews(news) {
    UI.news.innerHTML = `<div class="section-title">Latest UK Football News</div>` +
    news.slice(0, 10).map(item => `
    <a href="${item.link}" target="_blank" class="news-item">
    <div class="news-meta">SKY SPORTS • ${new Date(item.pubDate).toLocaleDateString()}</div>
    <div class="news-title">${item.title}</div>
    </a>
    `).join('');
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

// ... renderResults, renderFixtures, renderStandings remain the same ...
function renderResults(m, g) { UI.results.innerHTML = `<div class="gw-label">GW ${g} Results</div>` + m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><span class="score">${match.score.fullTime.home}-${match.score.fullTime.away}</span><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join(''); }
function renderFixtures(m, g) { UI.fixtures.innerHTML = `<div class="gw-label">Next GW ${g}</div>` + m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><span class="date">${new Date(match.utcDate).toLocaleDateString([], {day:'numeric', month:'short'})}</span><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join(''); }
function renderStandings(d) { UI.standings.innerHTML = d.map(r => `<tr><td>${r.position}</td><td class="team-cell"><img src="${r.team.crest}" class="crest-sm">${r.team.shortName}</td><td>${r.points}</td></tr>`).join(''); }
window.closeVideo = () => { UI.modal.style.display = 'none'; UI.player.innerHTML = ""; };

init();
