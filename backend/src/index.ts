import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend is running");
});

// List saved requests
app.get("/api/requests", async (req, res) => {
    try {
        const list = await prisma.request.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(list);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch saved requests' });
    }
});

// Create a saved request
app.post("/api/requests", async (req, res) => {
    const { name, url, method, headers, body } = req.body;
    if (!url || !method) return res.status(400).json({ error: 'url and method are required' });

    try {
        const created = await prisma.request.create({
            data: {
                name: name ?? `${method} ${url}`,
                url,
                method,
                headers: headers ?? '{}',
                body: body ?? null,
            },
        });
        res.status(201).json(created);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create request' });
    }
});

// Get one saved request
app.get('/api/requests/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const item = await prisma.request.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ error: 'Not found' });
        res.json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch request' });
    }
});

// Delete a saved request
app.delete('/api/requests/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.request.delete({ where: { id } });
        res.status(204).end();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete request' });
    }
});

// Simple proxy endpoint to forward requests server-side
app.post('/api/proxy', async (req, res) => {
    const { url, method = 'GET', headers = {}, body } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    try {
        const parsed = new URL(url);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return res.status(400).json({ error: 'Only http(s) protocols are allowed' });
        }
    } catch (err) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const start = Date.now();
        const fetchRes = await fetch(url, { method, headers, body });
        const end = Date.now();

        const text = await fetchRes.text();

        res.json({
            status: fetchRes.status,
            statusText: fetchRes.statusText,
            headers: Object.fromEntries(fetchRes.headers.entries()),
            body: text,
            serverTimingMs: end - start,
        });
    } catch (err) {
        console.error('Proxy error', err);
        res.status(502).json({ error: 'Proxy request failed' });
    }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});