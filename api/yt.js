const express = require('express');
const axios = require('axios');
const app = express();

app.get('/yt/:id', async (req, res) => {
    const videoId = req.params.id;

    if (!videoId) {
        return res.status(400).json({ error: 'YouTube video ID is required' });
    }

    // List of Invidious instances to be tried sequentially
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
            console.log(`Trying instance: ${instance}`); // Log which instance is being tried

            const response = await axios.get(apiUrl, { timeout: 5000 });
            const videoData = response.data;

            if (videoData && videoData.formats) {
                const videoFormat = videoData.formats.find(format => format.container === 'mp4' && format.qualityLabel);
                if (videoFormat) {
                    // Success: Return the first valid response found
                    return res.json({
                        streamUrl: `${instance}${videoFormat.url}`,
                        videoTitle: videoData.title,
                        sssl: `${instance}${videoFormat.url}`
                    });
                }
            }
        } catch (error) {
            // Log the error and continue to the next instance
            console.error(`Request to ${instance} failed:`, error.message);
        }
    }

    // If the loop finishes without a successful response
    res.status(500).json({ error: 'Failed to fetch video information from any specified instance' });
});

module.exports = app;
