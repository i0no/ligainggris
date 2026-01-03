const UI = {
    standings: document.getElementById('standings-root'),
    results: document.getElementById('results-root'),
    fixtures: document.getElementById('fixtures-root'),
    videos: document.getElementById('video-root'),
    news: document.getElementById('news-root'),
    modal: document.getElementById('video-modal'),
    player: document.getElementById('video-player')
};

let allMatches = [];
const PAGE_SIZE = 6;

async function init() {
    try {
        console.log("App Initializing...");
        const [s, r, f, n] = await Promise.all([
            fetch('/api/football?type=standings').then(res => res.json()),
                                               fetch('/api/football?type=results').then(res => res.json()),
                                               fetch('/api/football?type=fixtures').then(res => res.json()),
                                               fetch('/api/football?type=news').then(res => res.json())
        ]);

        if (s.standings) renderStandings(s.standings[0].table);
        if (n && n.length > 0) renderNews(n);

        if (r.matches && r.matches.length > 0) {
            const maxGW = Math.max(...r.matches.map(m => m.matchday));
            allMatches = r.matches.filter(m => m.matchday === maxGW);
            console.log(`Found ${allMatches.length} matches for GW ${maxGW}`);
            renderResults(allMatches, maxGW);

            // CRITICAL: Ensure allMatches is populated before calling this
            await loadVideoPage(0);
        } else {
            UI.videos.innerHTML = "<div class='loader'>No recent matches found to show highlights.</div>";
        }

        if (f.matches) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
        }
    } catch (e) {
        console.error("Global Init Error:", e);
        UI.videos.innerHTML = "<div class='loader'>Error connecting to API. Check your keys.</div>";
    }
}

async function loadVideoPage(pageNumber) {
    UI.videos.innerHTML = `<div class="loader">FETCHING HIGHLIGHTS...</div>`;

    const start = pageNumber * PAGE_SIZE;
    const pageMatches = allMatches.slice(start, start + PAGE_SIZE);

    try {
        const videoResults = await Promise.all(pageMatches.map(async (match) => {
            const query = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;
            const res = await fetch(`/api/football?type=highlights&q=${encodeURIComponent(query)}`);
            const data = await res.json();
            return data.length > 0 ? data[0] : null;
        }));

        UI.videos.innerHTML = "";
        let foundAny = false;

        videoResults.forEach(video => {
            if (video) {
                renderVideoCard(video);
                foundAny = true;
            }
        });

        if (!foundAny) {
            UI.videos.innerHTML = "<div class='loader'>YouTube API Quota Exceeded or No Videos Found.</div>";
        }

        renderPagination(pageNumber);
    } catch (err) {
        console.error("Video Load Error:", err);
        UI.videos.innerHTML = "<div class='loader'>Failed to load videos.</div>";
    }
}

function renderPagination(activePage) {
    let pager = document.getElementById('video-pager-dots');
    if (!pager) {
        pager = document.createElement('div');
        pager.id = "video-pager-dots";
        pager.className = "load-more-dots";
        UI.videos.after(pager);
    }

    const totalPages = Math.ceil(allMatches.length / PAGE_SIZE);
    pager.innerHTML = "";

    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('span');
        if (i === activePage) dot.className = "active";
        dot.onclick = () => loadVideoPage(i);
        pager.appendChild(dot);
    }
}

function renderNews(news) {
    UI.news.innerHTML = news.slice(0, 8).map(item => `
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
    div.innerHTML = `
    <img src="${v.snippet.thumbnails.high.url}" onerror="this.src='https://placehold.co/400x225?text=No+Thumbnail'">
    <div class="v-title">${v.snippet.title}</div>
    `;
    UI.videos.appendChild(div);
}

// Sidebars (Locked)
function renderResults(m, g) { UI.results.innerHTML = `<div class="gw-label">GW ${g} Results</div>` + m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><span class="score">${match.score.fullTime.home}-${match.score.fullTime.away}</span><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join(''); }
function renderFixtures(m, g) { UI.fixtures.innerHTML = `<div class="gw-label">Next GW ${g}</div>` + m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><span class="date">${new Date(match.utcDate).toLocaleDateString([], {day:'numeric', month:'short'})}</span><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join(''); }
function renderStandings(d) { UI.standings.innerHTML = d.map(r => `<tr><td>${r.position}</td><td class="team-cell"><img src="${r.team.crest}" class="crest-sm">${r.team.shortName}</td><td>${r.points}</td></tr>`).join(''); }
window.closeVideo = () => { UI.modal.style.display = 'none'; UI.player.innerHTML = ""; };

init();
