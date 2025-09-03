const express = require('express');
const axios = require('axios');
const app = express();

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

// Invidious APIへのリクエストを処理する汎用関数
async function proxyRequest(req, res, path) {
    if (invidiousInstances.length === 0) {
        return res.status(503).json({ error: 'No Invidious instances configured' });
    }

    // クエリパラメータを保持する
    const queryParams = new URLSearchParams(req.query).toString();
    
    for (const instance of invidiousInstances) {
        try {
            const apiUrl = `${instance}/api/v1/${path}?${queryParams}`;
            console.log(`Trying instance for ${path}: ${instance}`);

            const response = await axios.get(apiUrl, { timeout: 5000 });
            
            // 成功: 最初の有効な応答をそのまま返す
            if (response.data) {
                return res.json(response.data);
            }
        } catch (error) {
            console.error(`Request to ${instance} failed:`, error.message);
        }
    }

    // 全てのインスタンスで失敗した場合
    res.status(500).json({ error: `Failed to fetch data from any specified instance for ${path}` });
}

// 検索エンドポイント
app.get('/api/v1/search', (req, res) => {
    proxyRequest(req, res, 'search');
});

// チャンネルエンドポイント
app.get('/api/v1/channels/:id', (req, res) => {
    const channelId = req.params.id;
    proxyRequest(req, res, `channels/${channelId}`);
});

// プレイリストエンドポイント
app.get('/api/v1/playlists/:id', (req, res) => {
    const playlistId = req.params.id;
    proxyRequest(req, res, `playlists/${playlistId}`);
});

// コメントエンドポイント
app.get('/api/v1/videos/:id/comments', (req, res) => {
    const videoId = req.params.id;
    proxyRequest(req, res, `videos/${videoId}/comments`);
});

// 動画情報エンドポイント（元々の機能）
app.get('/api/v1/videos/:id', (req, res) => {
    const videoId = req.params.id;
    proxyRequest(req, res, `videos/${videoId}`);
});


module.exports = app;
