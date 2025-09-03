const express = require('express');
const axios = require('axios');
const app = express();

app.get('/yt/:id', async (req, res) => {
    const videoId = req.params.id;

    if (!videoId) {
        return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    // 手動で指定されたInvidiousインスタンスのリスト
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

    try {
        // 指定されたインスタンスに対して同時にリクエストを送信する
        const promises = invidiousInstances.map(instance => {
            const apiUrl = `${instance}/api/v1/videos/${videoId}`;
            return axios.get(apiUrl, { timeout: 5000 })
                .then(response => {
                    const videoData = response.data;
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
                    return Promise.reject(`No valid format from instance: ${instance}`);
                })
                .catch(error => {
                    console.error(`Request to ${instance} failed:`, error.message);
                    return Promise.reject(`Request to ${instance} failed`);
                });
        });

        // 最初に成功した応答を返す
        const fastestResponse = await Promise.race(promises);
        res.json(fastestResponse);

    } catch (error) {
        console.error('Error in fetching video info from all instances:', error.message);
        res.status(500).json({ error: 'Failed to fetch video information from any specified instance' });
    }
});

module.exports = app;
