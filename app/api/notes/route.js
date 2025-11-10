import { put, list } from '@vercel/blob';

const PATHNAME = 'notes/default.json';

export async function GET() {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ ok: false, reason: 'no_cloud' }), { status: 204 });
    }
    const { blobs } = await list({ prefix: PATHNAME, token });
    const blob = blobs?.find((b) => b.pathname === PATHNAME) || blobs?.[0];
    if (!blob) {
      return new Response(JSON.stringify({ topics: {}, lastExport: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const resp = await fetch(blob.url, { cache: 'no-store' });
    const text = await resp.text();
    return new Response(text || JSON.stringify({ topics: {}, lastExport: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (_) {
    return new Response(JSON.stringify({ topics: {}, lastExport: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PUT(req) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return new Response(JSON.stringify({ ok: false, reason: 'no_cloud' }), { status: 204 });
    }
    const body = await req.text();
    await put(PATHNAME, body, {
      // Blob tokens currently require public access for writes/reads
      access: 'public',
      addRandomSuffix: false,
      token,
      contentType: 'application/json',
    });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    // Surface error message to help diagnose token/scope issues (dev-friendly)
    const msg = (e && e.message) ? String(e.message) : 'upload_failed';
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


