export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Methode non autorisee' });
  try {
    const { action, api_key, prompt, aspect_ratio, prediction_id } = req.body;
    if (!api_key) return res.status(400).json({ error: 'Cle API manquante' });
    if (action === 'check_status') {
      const r = await fetch('https://api.replicate.com/v1/predictions/' + prediction_id, { headers: { 'Authorization': 'Bearer ' + api_key } });
      const d = await r.json();
      return res.status(200).json({ status: d.status, output: d.output, error: d.error });
    }
    let url, body;
    if (action === 'create_video') {
      url  = 'https://api.replicate.com/v1/models/minimax/video-01/predictions';
      body = { input: { prompt, prompt_optimizer: true } };
    } else if (action === 'create_image') {
      url  = 'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions';
      body = { input: { prompt, num_outputs: 1, aspect_ratio: aspect_ratio || '1:1', output_format: 'webp' } };
    } else {
      return res.status(400).json({ error: 'Action inconnue' });
    }
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + api_key, 'Prefer': 'wait=5' }, body: JSON.stringify(body) });
    const d = await r.json();
    if (!r.ok) return res.status(400).json({ error: d.detail || 'Erreur Replicate' });
    return res.status(200).json({ id: d.id, status: d.status, output: d.output });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erreur serveur' });
  }
}
