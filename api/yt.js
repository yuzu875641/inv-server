const express = require('express');
const axios = require('axios');
const app = express();

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

// Invidiousインスタンスをランダムにシャッフルする関数
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

app.get('/yt/:id', async (req, res) => {
    const videoId = req.params.id;

    if (!videoId) {
        return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    // インスタンスリストをシャッフル
    shuffleArray(invidiousInstances);

    let success = false;
    let finalVideoData = null;

    // リスト内の各インスタンスを試行
    for (const instance of invidiousInstances) {
        try {
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            const response = await axios.get(apiUrl, { timeout: 5000 }); // タイムアウトを設定
            const videoData = response.data;
            
            if (videoData && videoData.formats) {
                const videoFormat = videoData.formats.find(format => format.container === 'mp4' && format.qualityLabel);
                
                if (videoFormat) {
                    finalVideoData = {
                        streamUrl: `${instance}${videoFormat.url}`,
                        videoTitle: videoData.title,
                        sssl: `${instance}${videoFormat.url}`
                    };
                    success = true;
                    break; // 成功したのでループを抜ける
                }
            }
        } catch (error) {
            console.error(`Error fetching video info from ${instance}:`, error.message);
            // エラーが発生しても、次のインスタンスを試す
        }
    }

    if (success) {
        res.json(finalVideoData);
    } else {
        // すべてのインスタンスが失敗した場合
        res.status(500).json({ error: 'Failed to fetch video information from all instances' });
    }
});

module.exports = app;
