async function init() {
    const [sRes, rRes, hRes] = await Promise.all([
        fetch('/api/football?type=standings'),
                                                 fetch('/api/football?type=results'),
                                                 fetch('https://www.scorebat.com/video-api/v3/')
    ]);

    const standings = await sRes.json();
    const results = await rRes.json();
    const highlights = await hRes.json();

    renderStandings(standings.standings[0].table);
    renderResults(results.matches);
    renderHighlights(highlights.response);
}

function renderStandings(data) {
    const html = data.slice(0, 10).map(row => `
    <tr>
    <td>${row.position}</td>
    <td><img src="${row.team.crest}" class="crest-sm">${row.team.shortName}</td>
    <td><strong>${row.points}</strong></td>
    </tr>
    `).join('');
    document.getElementById('standings-root').innerHTML = html;
}

function renderResults(matches) {
    // Show last 8 results
    const html = matches.reverse().slice(0, 8).map(m => `
    <div class="result-item">
    <span>${m.homeTeam.shortName}</span>
    <span class="score">${m.score.fullTime.home} - ${m.score.fullTime.away}</span>
    <span>${m.awayTeam.shortName}</span>
    </div>
    `).join('');
    document.getElementById('results-root').innerHTML = html;
}

function renderHighlights(videos) {
    const pl = videos.filter(v => v.competition === "ENGLAND: Premier League").slice(0, 6);
    const html = pl.map(v => `
    <div class="v-card" onclick="playVideo('${btoa(v.videos[0].embed)}', '${v.url}')">
    <img src="${v.thumbnail}">
    <div class="v-title">${v.title}</div>
    </div>
    `).join('');
    document.getElementById('video-root').innerHTML = html;
}

window.playVideo = (embed, fallbackUrl) => {
    const code = atob(embed);
    document.getElementById('video-player').innerHTML = code +
    `<br><a href="${fallbackUrl}" target="_blank" style="color:white; display:block; margin-top:10px; text-align:center;">Video not loading? Watch on Source</a>`;
    document.getElementById('video-modal').style.display = 'flex';
};
