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
let currentPage = 0;
const PAGE_SIZE = 6;

async function init() {
    try {
        // Fetch everything including News
        const [s, r, f, n] = await Promise.all([
            fetch('/api/football?type=standings').then(res => res.json()),
                                               fetch('/api/football?type=results').then(res => res.json()),
                                               fetch('/api/football?type=fixtures').then(res => res.json()),
                                               fetch('/api/football?type=news').then(res => res.json())
        ]);

        if (s.standings) renderStandings(s.standings[0].table);
        if (n && n.length > 0) renderNews(n);

        if (r.matches) {
            // Find latest completed Gameweek
            const maxGW = Math.max(...r.matches.map(m => m.matchday));
            allMatches = r.matches.filter(m => m.matchday === maxGW);
            renderResults(allMatches, maxGW);

            // LOAD FIRST PAGE
            loadVideoPage(0);
        }

        if (f.matches) {
            const nextGW = Math.min(...f.matches.map(m => m.matchday));
            renderFixtures(f.matches.filter(m => m.matchday === nextGW), nextGW);
        }
    } catch (e) {
        console.error("Init failed:", e);
        UI.videos.innerHTML = "<p style='color:red'>Failed to load data. Check console.</p>";
    }
}

async function loadVideoPage(pageNumber) {
    // 1. Show Loading State immediately
    UI.videos.innerHTML = `<div class="loader">Fetching Highlights for Page ${pageNumber + 1}...</div>`;

    const start = pageNumber * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageMatches = allMatches.slice(start, end);

    try {
        // 2. Fetch all video data for this page set
        const videoResults = await Promise.all(pageMatches.map(match => {
            const term = `${match.homeTeam.shortName} vs ${match.awayTeam.shortName}`;
            return fetch(`/api/football?type=highlights&q=${encodeURIComponent(term)}`)
            .then(res => res.json());
        }));

        // 3. Clear the grid and inject new videos
        UI.videos.innerHTML = "";
        videoResults.forEach(items => {
            if (items && items.length > 0) renderVideoCard(items[0]);
        });

            // 4. Update dots to show active state
            renderPagination(pageNumber);

    } catch (error) {
        UI.videos.innerHTML = "<p>Error loading videos. Try switching pages.</p>";
    }
}

function renderPagination(activePage) {
    let pager = document.getElementById('video-pager-dots');
    if (!pager) {
        pager = document.createElement('div');
        pager.id = "video-pager-dots";
        pager.className = "load-more-dots";
        // Place dots inside the video card container, but after the grid
        UI.videos.after(pager);
    }

    const totalPages = Math.ceil(allMatches.length / PAGE_SIZE);
    pager.innerHTML = "";

    for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement('span');
        if (i === activePage) dot.className = "active";
        dot.onclick = () => {
            currentPage = i;
            loadVideoPage(i);
        };
        pager.appendChild(dot);
    }
}

function renderNews(news) {
    UI.news.innerHTML = news.slice(0, 8).map(item => `
    <a href="${item.link}" target="_blank" class="news-item">
    <div class="news-meta">SKY SPORTS • ${new Date(item.pubDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
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
    <img src="${v.snippet.thumbnails.high.url}">
    <div class="v-title">${v.snippet.title}</div>
    `;
    UI.videos.appendChild(div);
}

// Sidebar Renderers (Locked)
function renderResults(m, g) { UI.results.innerHTML = `<div class="gw-label">GW ${g} Results</div>` + m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><span class="score">${match.score.fullTime.home}-${match.score.fullTime.away}</span><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join(''); }
function renderFixtures(m, g) { UI.fixtures.innerHTML = `<div class="gw-label">Next GW ${g}</div>` + m.map(match => `<div class="item"><div class="team"><img src="${match.homeTeam.crest}" class="crest-sm"> ${match.homeTeam.shortName}</div><span class="date">${new Date(match.utcDate).toLocaleDateString([], {day:'numeric', month:'short'})}</span><div class="team">${match.awayTeam.shortName} <img src="${match.awayTeam.crest}" class="crest-sm"></div></div>`).join(''); }
function renderStandings(d) { UI.standings.innerHTML = d.map(r => `<tr><td>${r.position}</td><td class="team-cell"><img src="${r.team.crest}" class="crest-sm">${r.team.shortName}</td><td>${r.points}</td></tr>`).join(''); }
window.closeVideo = () => { UI.modal.style.display = 'none'; UI.player.innerHTML = ""; };

init();
