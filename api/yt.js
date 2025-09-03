const express = require('express');
const axios = require('axios');
const app = express();

app.get('/yt/:id', async (req, res) => {
    const videoId = req.params.id;

    if (!videoId) {
        return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    // 試行するInvidiousインスタンスのリスト
    const invidiousInstances = [
        'https://lekker.gay',
        'https://nyc1.iv.ggtyler.dev',
        'https://invidious.nikkosphere.com',
        'https://invidious.rhyshl.live',
        'https://invid-api.poketube.fun',
        'https://inv.tux.pizza',
        'https://pol1.iv.ggtyler.dev',
        'https://yewtu.be',
        'https://youtube.alt.tyil.nl'
    ];

    if (invidiousInstances.length === 0) {
        return res.status(503).json({ error: 'No Invidious instances configured' });
    }

    for (const instance of invidiousInstances) {
        try {
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            console.log(`Trying instance: ${instance}`);

            const response = await axios.get(apiUrl, { timeout: 5000 });
            const videoData = response.data;

            // 成功: 最初の有効な応答をそのまま返す
            if (videoData) {
                return res.json(videoData);
            }
        } catch (error) {
            console.error(`Request to ${instance} failed:`, error.message);
        }
    }

    // 全てのインスタンスで失敗した場合
    res.status(500).json({ error: 'Failed to fetch video information from any specified instance' });
});

module.exports = app;
