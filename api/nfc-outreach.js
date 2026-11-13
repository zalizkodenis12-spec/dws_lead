import {
  loadNfcOutreachDb,
  saveNfcOutreachDb,
  syncNfcOutreachFromCloud,
  pushNfcOutreachToCloud,
  createOrUpdateCampaign,
  finishOutreachCampaign,
  updateOutreachConfig,
  executeNextOutreachSend,
  handleIncomingLeadReply
} from '../backend/outreach/nfcOutreachEngine.js';

function decorateOutreachConfig(config) {
  const cfg = JSON.parse(JSON.stringify(config || {}));
  const accs = cfg.accounts || {};
  if (accs.tg1) {
    accs.tg1.hasSession = true;
    if (!accs.tg1.handle) {
      accs.tg1.handle = '@denis_nfc_developing';
    }
  }
  if (accs.tg2) {
    accs.tg2.hasSession = true;
    if (!accs.tg2.handle) {
      accs.tg2.handle = process.env.TELEGRAM_USERNAME_2 || '@denis_DWS_owner';
    }
    delete accs.tg2.sessionString;
  }
  if (accs.ig1) {
    accs.ig1.hasSession = true;
    if (!accs.ig1.handle) {
      accs.ig1.handle = process.env.INSTAGRAM_USERNAME || '@denis__zalizko';
    }
    delete accs.ig1.sessionCookie;
  }
  return cfg;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const action = String(req.query?.action || req.body?.action || 'status').trim();

    // Always pull latest state from Cloud KV so iPhone (Vercel) and PC daemon stay 100% synced
    await syncNfcOutreachFromCloud();

    if (req.method === 'GET' || action === 'status') {
      const state = loadNfcOutreachDb();
      const jobId = String(req.query?.jobId || '').trim();
      if (!process.env.VERCEL) {
        for (const camp of Object.values(state.campaigns || {})) {
          if (camp.status === 'running' || camp.status === 'cooldown') {
            await executeNextOutreachSend(camp.jobId, false);
          }
        }
      }
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        activeJobId: state.activeJobId,
        campaign: jobId ? (state.campaigns[jobId] || null) : null,
        campaigns: state.campaigns
      });
    }

    if (action === 'start') {
      const { job, config, warmupMode } = req.body || {};
      if (config) updateOutreachConfig(config);
      if (warmupMode === 'warmup' || warmupMode === 'warmed') {
        updateOutreachConfig({ warmupMode });
      }
      const campaign = createOrUpdateCampaign(job, true);
      const updated = await executeNextOutreachSend(campaign.jobId, true);
      const state = loadNfcOutreachDb();
      await pushNfcOutreachToCloud(state);
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        campaign: updated || campaign,
        campaigns: state.campaigns
      });
    }

    if (action === 'init-table') {
      const { job } = req.body || {};
      const campaign = createOrUpdateCampaign(job, false);
      const state = loadNfcOutreachDb();
      await pushNfcOutreachToCloud(state);
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        campaign,
        campaigns: state.campaigns
      });
    }

    if (action === 'pause') {
      const { jobId } = req.body || {};
      const state = loadNfcOutreachDb();
      const camp = state.campaigns[jobId];
      if (camp) {
        camp.status = 'paused';
        camp.nextSendAt = null;
        camp.forceImmediateSend = false;
        camp.updatedAt = Date.now();
        saveNfcOutreachDb(state);
        await pushNfcOutreachToCloud(state);
      }
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        campaign: camp || null,
        campaigns: state.campaigns
      });
    }

    if (action === 'resume') {
      const { jobId } = req.body || {};
      const state = loadNfcOutreachDb();
      const camp = state.campaigns[jobId];
      if (camp) {
        camp.status = 'running';
        camp.nextSendAt = Date.now() + 1000;
        camp.forceImmediateSend = true;
        camp.updatedAt = Date.now();
        state.activeJobId = jobId;
        saveNfcOutreachDb(state);
        await executeNextOutreachSend(jobId, true);
        await pushNfcOutreachToCloud(state);
      }
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        campaign: camp || null,
        campaigns: state.campaigns
      });
    }

    if (action === 'finish' || action === 'stop') {
      const { jobId } = req.body || {};
      const camp = finishOutreachCampaign(jobId);
      const state = loadNfcOutreachDb();
      await pushNfcOutreachToCloud(state);
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        campaign: camp || null,
        campaigns: state.campaigns
      });
    }

    if (action === 'step') {
      const { jobId, force } = req.body || {};
      const updated = await executeNextOutreachSend(jobId, Boolean(force));
      const state = loadNfcOutreachDb();
      await pushNfcOutreachToCloud(state);
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        campaign: updated,
        campaigns: state.campaigns
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
          camp.updatedAt = Date.now();
          saveNfcOutreachDb(state);
          await pushNfcOutreachToCloud(state);
        }
      }
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(state.config),
        campaign: camp || null,
        campaigns: state.campaigns
      });
    }

    if (action === 'config') {
      const cfg = updateOutreachConfig(req.body?.config || req.body || {});
      const state = loadNfcOutreachDb();
      await pushNfcOutreachToCloud(state);
      return res.status(200).json({
        success: true,
        config: decorateOutreachConfig(cfg),
        campaigns: state.campaigns
      });
    }

    if (action === 'incoming-reply') {
      const updated = handleIncomingLeadReply(req.body || {});
      const state = loadNfcOutreachDb();
      await pushNfcOutreachToCloud(state);
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
