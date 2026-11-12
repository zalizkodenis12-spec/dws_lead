import {
  loadNfcOutreachDb,
  saveNfcOutreachDb,
  createOrUpdateCampaign,
  updateOutreachConfig,
  executeNextOutreachSend,
  handleIncomingLeadReply
} from '../backend/outreach/nfcOutreachEngine.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const action = String(req.query?.action || req.body?.action || 'status').trim();

    if (req.method === 'GET' || action === 'status') {
      const state = loadNfcOutreachDb();
      const jobId = String(req.query?.jobId || '').trim();
      for (const camp of Object.values(state.campaigns || {})) {
        if (camp.status === 'running' || camp.status === 'cooldown') {
          await executeNextOutreachSend(camp.jobId, false);
        }
      }
      return res.status(200).json({
        success: true,
        config: state.config,
        activeJobId: state.activeJobId,
        campaign: jobId ? (state.campaigns[jobId] || null) : null,
        campaigns: state.campaigns
      });
    }

    if (action === 'start') {
      const { job, config } = req.body || {};
      if (config) updateOutreachConfig(config);
      const campaign = createOrUpdateCampaign(job, true);
      // Immediately send the first message so outreach starts without delay
      const updated = await executeNextOutreachSend(campaign.jobId, true);
      const state = loadNfcOutreachDb();
      return res.status(200).json({
        success: true,
        config: state.config,
        campaign: updated || campaign
      });
    }

    if (action === 'init-table') {
      const { job } = req.body || {};
      const campaign = createOrUpdateCampaign(job, false);
      const state = loadNfcOutreachDb();
      return res.status(200).json({
        success: true,
        config: state.config,
        campaign
      });
    }

    if (action === 'pause') {
      const { jobId } = req.body || {};
      const state = loadNfcOutreachDb();
      const camp = state.campaigns[jobId];
      if (camp) {
        camp.status = 'paused';
        camp.nextSendAt = null;
        saveNfcOutreachDb(state);
      }
      return res.status(200).json({
        success: true,
        campaign: camp || null
      });
    }

    if (action === 'resume') {
      const { jobId } = req.body || {};
      const state = loadNfcOutreachDb();
      const camp = state.campaigns[jobId];
      if (camp) {
        camp.status = 'running';
        camp.nextSendAt = Date.now() + 1500;
        state.activeJobId = jobId;
        saveNfcOutreachDb(state);
        await executeNextOutreachSend(jobId, true);
      }
      return res.status(200).json({
        success: true,
        config: state.config,
        campaign: camp || null
      });
    }

    if (action === 'step') {
      const { jobId, force } = req.body || {};
      const updated = await executeNextOutreachSend(jobId, Boolean(force));
      const state = loadNfcOutreachDb();
      return res.status(200).json({
        success: true,
        config: state.config,
        campaign: updated
      });
    }

    if (action === 'update-result') {
      const { jobId, itemId, venueId, result, replyText } = req.body || {};
      const targetId = String(itemId || venueId || '');
      const state = loadNfcOutreachDb();
      const camp = state.campaigns[jobId];
      if (camp && Array.isArray(camp.items)) {
        const item = camp.items.find(i => String(i.id || i.venueId) === targetId);
        if (item && ['Ігнор / не відповідає', 'Ні / не цікаво', 'Так'].includes(result)) {
          item.result = result;
          if (replyText !== undefined) item.lastReplyText = String(replyText || '');
          item.repliedAt = new Date().toISOString();
          saveNfcOutreachDb(state);
        }
      }
      return res.status(200).json({
        success: true,
        config: state.config,
        campaign: camp || null,
        campaigns: state.campaigns
      });
    }

    if (action === 'config') {
      const cfg = updateOutreachConfig(req.body?.config || req.body || {});
      return res.status(200).json({
        success: true,
        config: cfg
      });
    }

    if (action === 'incoming-reply') {
      const updated = handleIncomingLeadReply(req.body || {});
      const state = loadNfcOutreachDb();
      return res.status(200).json({
        success: true,
        updated,
        campaigns: state.campaigns
      });
    }

    return res.status(400).json({ success: false, error: 'Unknown action' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
