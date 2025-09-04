const express = require('express');
const axios = require('axios');
const app = express();
const miniget = require('miniget');

// ライブ配信と動画情報取得に使用するInvidiousインスタンスのリスト
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

/**
 * 複数のInvidiousインスタンスからデータを取得し、成功したインスタンスのURLも返す。
 * @param {string} endpoint - APIエンドポイント（例: `videos/videoId`）。
 * @returns {Promise<object|null>} - 取得したデータとインスタンスURL、または失敗した場合はnull。
 */
async function getInvidiousDataWithInstance(endpoint) {
    for (const instance of invidiousInstances) {
        try {
            const apiUrl = `${instance}/api/v1/${endpoint}`;
            const response = await axios.get(apiUrl, { timeout: 5000 });
            if (response.data) {
                return { data: response.data, instanceUrl: instance };
            }
        } catch (error) {
            // エラーを無視して次のインスタンスを試行
            console.error(`Failed to fetch from ${instance}: ${error.message}`);
        }
    }
    return null;
}

/**
 * HLSマスタープレイリストを解析し、各ストリームの情報を抽出する。
 * @param {string} playlistContent - HLSマスタープレイリストのテキスト内容。
 * @param {string} baseUrl - プレイリストのベースURL。
 * @param {string} currentHost - プロキシサーバーのホストURL。
 * @returns {Array<object>} - 解析されたストリーム情報の配列。
 */
function parseHlsPlaylist(playlistContent, baseUrl, currentHost) {
    const lines = playlistContent.split('\n');
    const qualities = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXT-X-STREAM-INF:')) {
            const streamInfo = {};
            const attributes = line.substring('#EXT-X-STREAM-INF:'.length).split(',');
            
            attributes.forEach(attr => {
                const [key, value] = attr.split('=');
                if (key && value) {
                    streamInfo[key.toLowerCase()] = value.replace(/"/g, '');
                }
            });

            // 次の行がストリームのURL
            const streamUrl = lines[i + 1];
            if (streamUrl) {
                const absoluteUrl = new URL(streamUrl, baseUrl).href;
                streamInfo.url = `${currentHost}/proxy-hls-segment?url=${encodeURIComponent(absoluteUrl)}`;
                qualities.push(streamInfo);
            }
        }
    }
    return qualities;
}

// HLSマスタープレイリストをプロキシし、ストリームURLを書き換える
app.get('/proxy-hls', async (req, res) => {
    const hlsUrl = req.query.url;
    if (!hlsUrl) {
        return res.status(400).send("URL parameter is required.");
    }

    try {
        const response = await axios.get(hlsUrl, { responseType: 'text' });
        let content = response.data;

        const baseUrl = new URL(hlsUrl).origin;
        const currentHost = `${req.protocol}://${req.get('host')}`;

        const proxiedContent = content.split('\n').map(line => {
            if (line.startsWith('http://') || line.startsWith('https://')) {
                // 絶対URLをプロキシURLに書き換え
                return `${currentHost}/proxy-hls-segment?url=${encodeURIComponent(line)}`;
            } else if (line.endsWith('.m3u8') || line.endsWith('.ts')) {
                // 相対URLを絶対URLに変換してからプロキシURLに書き換え
                const absoluteUrl = new URL(line, baseUrl).href;
                return `${currentHost}/proxy-hls-segment?url=${encodeURIComponent(absoluteUrl)}`;
            }
            return line;
        }).join('\n');

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(proxiedContent);
    } catch (err) {
        // デバッグ用にエラーメッセージをログに出力
        console.error("Failed to proxy the HLS stream:", err.message);
        res.status(500).send("Failed to proxy the HLS stream.");
    }
});

// HLSセグメント（.tsファイル）をプロキシするルート
app.get('/proxy-hls-segment', async (req, res) => {
    const segmentUrl = req.query.url;
    if (!segmentUrl) {
        return res.status(400).send("URL parameter is required.");
    }

    try {
        const stream = miniget(segmentUrl);
        stream.pipe(res);
        stream.on('error', (err) => {
            console.error("Failed to proxy the HLS segment:", err.message);
            res.status(500).send("Failed to proxy the segment.");
        });
    } catch (err) {
        console.error("Failed to initiate proxy for segment:", err.message);
        res.status(500).send("Failed to initiate proxy for segment.");
    }
});

// DASHマニフェストとセグメントをプロキシするルート
app.get('/proxy-dash', async (req, res) => {
    const dashUrl = req.query.url;
    if (!dashUrl) {
        return res.status(400).send("URL parameter is required.");
    }

    try {
        const response = await axios.get(dashUrl, { responseType: 'text' });
        const content = response.data;
        const currentHost = `${req.protocol}://${req.get('host')}`;
        const baseUrl = new URL(dashUrl).origin;

        // DASHマニフェスト内のURLをプロキシURLに書き換える
        const proxiedContent = content.replace(/<BaseURL>(.*?)<\/BaseURL>/g, (match, p1) => {
            const absoluteUrl = new URL(p1, baseUrl).href;
            return `<BaseURL>${currentHost}/proxy-dash-segment?url=${encodeURIComponent(absoluteUrl)}</BaseURL>`;
        });

        res.setHeader('Content-Type', 'application/dash+xml');
        res.send(proxiedContent);
    } catch (err) {
        console.error("Failed to proxy the DASH stream:", err.message);
        res.status(500).send("Failed to proxy the DASH stream.");
    }
});

app.get('/proxy-dash-segment', async (req, res) => {
    const segmentUrl = req.query.url;
    if (!segmentUrl) {
        return res.status(400).send("URL parameter is required.");
    }
    try {
        const stream = miniget(segmentUrl);
        stream.pipe(res);
        stream.on('error', (err) => {
            console.error("Failed to proxy the DASH segment:", err.message);
            res.status(500).send("Failed to proxy the DASH segment.");
        });
    } catch (err) {
        console.error("Failed to initiate proxy for DASH segment:", err.message);
        res.status(500).send("Failed to initiate proxy for DASH segment.");
    }
});

// ライブ動画情報を取得するルート
app.get('/live/:id', async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        return res.status(400).json({ error: "Video ID is required." });
    }

    try {
        // 成功したインスタンスのURLも取得するように変更
        const videoResponse = await getInvidiousDataWithInstance(`videos/${videoId}`);
        if (!videoResponse || !videoResponse.data.liveNow) {
            return res.status(500).json({ error: "No live stream URL available or could not find a working instance." });
        }

        const videoInfo = videoResponse.data;
        const instanceUrl = videoResponse.instanceUrl;
        const liveStreamUrls = {};
        const currentHost = `${req.protocol}://${req.get('host')}`;

        // HLSプレイリストを解析して画質一覧を取得
        if (videoInfo.hlsUrl) {
            try {
                // 成功したインスタンスのベースURLを使用
                const hlsUrl = new URL(videoInfo.hlsUrl, instanceUrl).href;
                const hlsResponse = await axios.get(hlsUrl, { responseType: 'text' });
                const hlsQualities = parseHlsPlaylist(hlsResponse.data, hlsUrl, currentHost);
                if (hlsQualities.length > 0) {
                    liveStreamUrls.hlsQualities = hlsQualities;
                } else {
                    // マスタープレイリストがない場合、元のURLをプロキシ
                    liveStreamUrls.hlsUrl = `${currentHost}/proxy-hls?url=${encodeURIComponent(hlsUrl)}`;
                }
            } catch (e) {
                console.error("Failed to fetch/parse HLS playlist:", e.message);
                // 失敗した場合も元のURLをプロキシ
                liveStreamUrls.hlsUrl = `${currentHost}/proxy-hls?url=${encodeURIComponent(videoInfo.hlsUrl)}`;
            }
        }

        // その他の形式もプロキシ
        if (videoInfo.dashUrl) {
            // DASH URLも成功したインスタンスのベースURLから生成
            const dashUrl = new URL(videoInfo.dashUrl, instanceUrl).href;
            const proxiedUrl = `${currentHost}/proxy-dash?url=${encodeURIComponent(dashUrl)}`;
            liveStreamUrls.dashUrl = proxiedUrl;
        }
        if (videoInfo.adaptiveFormats && videoInfo.adaptiveFormats.length > 0) {
            liveStreamUrls.adaptiveFormats = videoInfo.adaptiveFormats.map(format => {
                return {
                    ...format,
                    url: `${currentHost}/proxy-stream?url=${encodeURIComponent(format.url)}`
                };
            });
        }
        if (videoInfo.formatStreams && videoInfo.formatStreams.length > 0) {
            liveStreamUrls.formatStreams = videoInfo.formatStreams.map(format => {
                return {
                    ...format,
                    url: `${currentHost}/proxy-stream?url=${encodeURIComponent(format.url)}`
                };
            });
        }
        
        return res.json({
            type: "live",
            urls: liveStreamUrls,
            title: videoInfo.title,
            description: videoInfo.description
        });
    } catch (error) {
        return res.status(500).json({ error: error.toString() });
    }
});

// 通常の動画情報を取得するルート
app.get('/video/:id', async (req, res) => {
    const videoId = req.params.id;
    if (!videoId) {
        return res.status(400).json({ error: "Video ID is required." });
    }

    try {
        const videoInfo = await getInvidiousDataWithInstance(`videos/${videoId}`);
        if (videoInfo) {
            const streamUrls = {};
            const currentHost = `${req.protocol}://${req.get('host')}`;
            
            if (videoInfo.data.formatStreams && videoInfo.data.formatStreams.length > 0) {
                streamUrls.formatStreams = videoInfo.data.formatStreams.map(format => {
                    return {
                        ...format,
                        url: `${currentHost}/proxy-stream?url=${encodeURIComponent(format.url)}`
                    };
                });
            }
            if (videoInfo.data.adaptiveFormats && videoInfo.data.adaptiveFormats.length > 0) {
                streamUrls.adaptiveFormats = videoInfo.data.adaptiveFormats.map(format => {
                    return {
                        ...format,
                        url: `${currentHost}/proxy-stream?url=${encodeURIComponent(format.url)}`
                    };
                });
            }
            if (Object.keys(streamUrls).length > 0) {
                return res.json({
                    type: "regular",
                    urls: streamUrls,
                    title: videoInfo.data.title,
                    description: videoInfo.data.description
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

// APIリクエストをプロキシする汎用ルート
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
            console.error(`Failed to proxy request from ${instance}: ${error.message}`);
        }
    }

    res.status(500).json({ error: `Failed to fetch data from any specified instance for ${apiPath}` });
}

app.get('/api/v1/*', (req, res) => {
    const apiPath = req.params[0];
    proxyRequest(req, res, apiPath);
});

// ストリームURLをプロキシするルート
app.get('/proxy-stream', async (req, res) => {
    const streamUrl = req.query.url;
    if (!streamUrl) {
        return res.status(400).send("URL parameter is required.");
    }

    try {
        const stream = miniget(streamUrl);
        stream.pipe(res);
        stream.on('error', (err) => {
            console.error("Failed to proxy the stream:", err.message);
            res.status(500).send("Failed to proxy the stream.");
        });
    } catch (err) {
        console.error("Failed to initiate proxy for stream:", err.message);
        res.status(500).send("Failed to initiate proxy for stream.");
    }
});

module.exports = app;
