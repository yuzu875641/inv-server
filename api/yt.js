const express = require('express');
const axios = require('axios');
const app = express();

app.get('/yt/:id', async (req, res) => {
    const videoId = req.params.id;

    if (!videoId) {
        return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    try {
        // Step 1: 動作中のInvidiousインスタンスリストを動的に取得する
        const instancesResponse = await axios.get('https://api.invidious.io/instances.json?sort_by=health,type');
        const activeInstances = instancesResponse.data
            .filter(instance => instance[1].stats.openRegistrations === false)
            .map(instance => `https://${instance[0]}`);

        if (activeInstances.length === 0) {
            return res.status(503).json({ error: 'No active Invidious instances available' });
        }

        // Step 2: 取得したインスタンスに対して同時にリクエストを送信する
        const promises = activeInstances.map(instance => {
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

        // Step 3: 最初に成功した応答を返す
        const fastestResponse = await Promise.race(promises);
        res.json(fastestResponse);

    } catch (error) {
        console.error('Error in fetching instances or video info:', error.message);
        res.status(500).json({ error: 'Failed to fetch video information from any instance' });
    }
});

module.exports = app;
