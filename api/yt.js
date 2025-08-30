const express = require('express');
const axios = require('axios');
const app = express();

// Invidiousインスタンスのリスト
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

app.get('/yt/:id', async (req, res) => {
    const videoId = req.params.id;

    if (!videoId) {
        return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    // すべてのインスタンスに対して同時にリクエストを作成
    const promises = invidiousInstances.map(instance => {
        const apiUrl = `${instance}/api/v1/videos/${videoId}`;
        return axios.get(apiUrl, { timeout: 5000 })
            .then(response => {
                const videoData = response.data;
                // 有効なデータ形式か確認
                if (videoData && videoData.formats) {
                    const videoFormat = videoData.formats.find(format => format.container === 'mp4' && format.qualityLabel);
                    if (videoFormat) {
                        return {
                            streamUrl: `${instance}${videoFormat.url}`,
                            videoTitle: videoData.title,
                            sssl: `${instance}${videoFormat.url}`
                        };
                    }
                }
                // 有効な形式が見つからない場合は失敗と見なす
                return Promise.reject(`No valid format from instance: ${instance}`);
            })
            .catch(error => {
                console.error(`Request to ${instance} failed:`, error.message);
                return Promise.reject(`Request to ${instance} failed`);
            });
    });

    try {
        // 最初に成功したプロミスを待機
        const fastestResponse = await Promise.race(promises);
        res.json(fastestResponse);
    } catch (error) {
        // すべてのリクエストが失敗した場合
        res.status(500).json({ error: 'Failed to fetch video information from any instance' });
    }
});

module.exports = app;
