const express = require('express');
const axios = require('axios');
const app = express();
const miniget = require('miniget');

const invidiousInstances = [
    'https://nyc1.iv.ggtyler.dev',
    'https://cal1.iv.ggtyler.dev',
    'https://invidious.nikkosphere.com',
    'https://lekker.gay',
    'https://invidious.f5.si',
    'https://invidious.lunivers.trade',
    'https://invid-api.poketube.fun',
    'https://pol1.iv.ggtyler.dev',
    'https://eu-proxy.poketube.fun',
    'https://iv.melmac.space',
    'https://invidious.reallyaweso.me',
    'https://invidious.dhusch.de',
    'https://usa-proxy2.poketube.fun',
    'https://id.420129.xyz',
    'https://invidious.darkness.service',
    'https://iv.datura.network',
    'https://invidious.jing.rocks',
    'https://invidious.private.coffee',
    'https://youtube.mosesmang.com',
    'https://iv.duti.dev',
    'https://invidious.projectsegfau.lt',
    'https://invidious.perennialte.ch',
    'https://invidious.einfachzocken.eu',
    'https://invidious.adminforge.de',
    'https://inv.nadeko.net',
    'https://invidious.esmailelbob.xyz',
    'https://invidious.0011.lt',
    'https://invidious.ducks.party',
    'https://super8.absturztau.be',
    'https://34.97.38.181',
    'https://youtube.alt.tyil.nl',
    'https://rust.oskamp.nl',
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.nietzospannend.nl',
    'https://iv.ggtyler.dev',
    'https://siawaseok-wakame-server2.glitch.me',
    'https://invidious.darkness.services',
    'https://inv.vern.cc',
    'https://invidious.vern.cc',
    'https://yt.vern.cc',
    'https://invidious.materialio.us',
    'https://invidious.varis.social',
    'https://invidious.0011.lt'
];

async function getVideoInfo(videoId) {
    for (const instance of invidiousInstances) {
        try {
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            const response = await axios.get(apiUrl, { timeout: 5000 });
            const videoInfo = response.data;
            if (videoInfo) {
                return videoInfo;
            }
        } catch (error) {
            // エラーを無視して次のインスタンスを試行
        }
    }
    return null;
}

app.get('/live/:id', async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        return res.status(400).json({ error: "Video ID is required." });
    }

    try {
        const videoInfo = await getVideoInfo(videoId);
        if (videoInfo && videoInfo.liveNow) {
            const liveStreamUrls = {};
            if (videoInfo.hlsUrl) {
                liveStreamUrls.hlsUrl = videoInfo.hlsUrl;
            }
            if (videoInfo.dashUrl) {
                liveStreamUrls.dashUrl = videoInfo.dashUrl;
            }
            if (videoInfo.formatStreams && videoInfo.formatStreams.length > 0) {
                const liveRegularUrl = videoInfo.formatStreams.find(format => format.url && format.container === 'mp4' && format.audioBitrate > 0);
                if (liveRegularUrl) {
                    liveStreamUrls.streamUrl = liveRegularUrl.url;
                }
            }
            return res.json({ 
                type: "live",
                urls: liveStreamUrls,
                title: videoInfo.title,
                description: videoInfo.description
            });
        } else {
            return res.status(500).json({ error: "No live stream URL available or could not find a working instance." });
        }
    } catch (error) {
        return res.status(500).json({ error: error.toString() });
    }
});

app.get('/video/:id', async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        return res.status(400).json({ error: "Video ID is required." });
    }

    try {
        const videoInfo = await getVideoInfo(videoId);
        if (videoInfo) {
            const streamUrls = {};
            if (videoInfo.formatStreams && videoInfo.formatStreams.length > 0) {
                streamUrls.formatStreams = videoInfo.formatStreams;
            }
            if (videoInfo.adaptiveFormats && videoInfo.adaptiveFormats.length > 0) {
                streamUrls.adaptiveFormats = videoInfo.adaptiveFormats;
            }
            if (Object.keys(streamUrls).length > 0) {
                return res.json({
                    type: "regular",
                    urls: streamUrls,
                    title: videoInfo.title,
                    description: videoInfo.description
                });
            } else {
                return res.status(500).json({ error: "No video stream URL available for this video." });
            }
        } else {
            return res.status(500).json({ error: "Failed to fetch video information from any working instance." });
        }
    } catch (error) {
        return res.status(500).json({ error: error.toString() });
    }
});

async function proxyRequest(req, res, apiPath) {
    if (invidiousInstances.length === 0) {
        return res.status(503).json({ error: 'No Invidious instances configured' });
    }

    const queryParams = new URLSearchParams(req.query).toString();
    
    for (const instance of invidiousInstances) {
        try {
            const apiUrl = `${instance}/api/v1/${apiPath}?${queryParams}`;
            const response = await axios.get(apiUrl, { timeout: 5000 });
            
            if (response.data) {
                return res.json(response.data);
            }
        } catch (error) {
            // エラーを無視して次のインスタンスを試行
        }
    }

    res.status(500).json({ error: `Failed to fetch data from any specified instance for ${apiPath}` });
}

app.get('/api/v1/*', (req, res) => {
    const apiPath = req.params[0];
    proxyRequest(req, res, apiPath);
});

module.exports = app;
