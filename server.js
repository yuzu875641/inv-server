const express = require('express');
const axios = require('axios');
const app = express();
const port = 3000;

const invidiousInstances = [
  "https://invidious.nikkosphere.com",
  "https://iv.melmac.space",
  "https://invidious.reallyaweso.me",
  "https://invidious.adminforge.de",
  "https://invidious.esmailelbob.xyz",
  "https://invidious.nerdvpn.de",
  "https://invidious.perennialte.ch",
  "https://invidious.dhusch.de",
  "https://invidious.0011.lt",
  "https://invidious.materialio.us",
  "https://usa-proxy2.poketube.fun",
  "https://invidious.darkness.service",
  "https://invidious.flokinet.to",
  "https://invidious.fdn.fr",
  "https://iv.duti.dev",
  "https://yt.artemislena.eu",
  "https://invidious.projectsegfau.lt",
  "https://id.420129.xyz",
  "https://invidious.jing.rocks",
  "https://nyc1.iv.ggtyler.dev",
  "https://inv.in.projectsegfau.lt",
  "https://invidious.drgns.space",
  "https://cal1.iv.ggtyler.dev",
  "https://inv.us.projectsegfau.lt",
  "https://lekker.gay",
  "https://youtube.mosesmang.com",
  "https://invidious.privacyredirect.com",
  "https://invidious.lunivers.trade",
  "https://invidious.incogniweb.net",
  "https://invid-api.poketube.fun",
  "https://inv.tux.pizza",
  "https://invidious.ducks.party",
  "https://pol1.iv.ggtyler.dev",
  "https://invidious.protokolla.fi",
  "https://invidious.einfachzocken.eu",
  "https://yewtu.be",
  "https://iv.datura.network",
  "https://invidious.f5.si",
  "https://invidious.privacydev.net",
  "https://eu-proxy.poketube.fun",
  "https://yt.drgnz.club",
  "https://inv.nadeko.net",
  "https://invidious.private.coffee"
];

// Invidiousインスタンスをランダムに選択する関数
function getRandomInstance() {
    const randomIndex = Math.floor(Math.random() * invidiousInstances.length);
    return invidiousInstances[randomIndex];
}

app.get('/yt/:id', async (req, res) => {
    const videoId = req.params.id;

    if (!videoId) {
        return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    let selectedInstance = getRandomInstance();

    try {
        const apiUrl = `${selectedInstance}/api/v1/videos/${videoId}`;
        const response = await axios.get(apiUrl);
        const videoData = response.data;
        
        if (!videoData || !videoData.formats) {
            return res.status(404).json({ error: 'Video information not found' });
        }

        // MP4形式のストリーミングURLをフィルターして取得
        const videoFormat = videoData.formats.find(format => format.container === 'mp4' && format.qualityLabel);

        if (!videoFormat) {
            return res.status(404).json({ error: 'No streamable video format found' });
        }

        const streamUrl = `${selectedInstance}${videoFormat.url}`;
        const videoTitle = videoData.title;

        res.json({
            streamUrl: streamUrl,
            videoTitle: videoTitle,
            sssl: streamUrl // 互換性のためにssslもstreamUrlと同じ値を返す
        });

    } catch (error) {
        console.error(`Error fetching video info from ${selectedInstance}:`, error.message);
        // エラーが発生した場合、別のインスタンスを試すロジックを追加できますが、
        // このシンプル版ではここでは省略します。
        res.status(500).json({ error: 'Failed to fetch video information' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
