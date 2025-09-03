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
    'https://invidious.ducks.party',
    'https://super8.absturztau.be',
    'https://34.97.38.181',
    'https://invidious.lunivers.trade',
    'https://youtube.alt.tyil.nl',
    'https://rust.oskamp.nl',
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.nietzospannend.nl',
    'https://iv.ggtyler.dev',
    'https://youtube.mosesmang.com',
    'https://siawaseok-wakame-server2.glitch.me',
    'https://invidious.darkness.services',
    'https://inv.vern.cc',
    'https://invidious.vern.cc',
    'https://yt.vern.cc',
    'https://invidious.materialio.us',
    'https://invidious.varis.social',
    'https://invidious.0011.lt'
];

const liveInstances = [
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
    'https://invidious.ducks.party',
    'https://super8.absturztau.be',
    'https://34.97.38.181',
    'https://invidious.lunivers.trade',
    'https://youtube.alt.tyil.nl',
    'https://rust.oskamp.nl',
    'https://inv.tux.pizza',
    'https://vid.puffyan.us',
    'https://invidious.nietzospannend.nl',
    'https://iv.ggtyler.dev',
    'https://youtube.mosesmang.com',
    'https://siawaseok-wakame-server2.glitch.me',
    'https://invidious.darkness.services',
    'https://inv.vern.cc',
    'https://invidious.vern.cc',
    'https://yt.vern.cc',
    'https://invidious.materialio.us',
    'https://invidious.varis.social',
    'https://invidious.0011.lt'
];

async function getLiveHlsUrl(videoId) {
    for (const instance of liveInstances) {
        try {
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            const response = await axios.get(apiUrl, { timeout: 5000 });
            const videoInfo = response.data;
            if (videoInfo && videoInfo.liveNow && videoInfo.hlsUrl) {
                return videoInfo.hlsUrl;
            }
        } catch (error) {
            // エラーを無視して次のインスタンスを試行
        }
    }
    return null;
}

const RETRY_DELAY_MS = 1000;
const MINIGET_RETRY_LIMIT = 3;

app.get('/live/:id', async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) return res.status(400).send("Video ID is required.");

    try {
        const hlsUrl = await getLiveHlsUrl(videoId);
        if (!hlsUrl) {
            return res.status(500).send("No live stream URL available or could not find a working instance.");
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        const fetchStreamWithRetry = async (url, retryCount = 0) => {
            try {
                const stream = miniget(url, { headers: { 'User-Agent': 'miniget-streamer' } });
                stream.pipe(res);
                stream.on('error', (err) => {
                    if (retryCount < MINIGET_RETRY_LIMIT) {
                        setTimeout(() => fetchStreamWithRetry(url, retryCount + 1), RETRY_DELAY_MS);
                    } else {
                        res.status(500).send("Failed to stream after multiple retries.");
                    }
                });
            } catch (err) {
                if (retryCount < MINIGET_RETRY_LIMIT) {
                    setTimeout(() => fetchStreamWithRetry(url, retryCount + 1), RETRY_DELAY_MS);
                } else {
                    res.status(500).send("Failed to fetch stream after multiple retries.");
                }
            }
        };
        fetchStreamWithRetry(hlsUrl);
    } catch (error) {
        res.status(500).send(error.toString());
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
