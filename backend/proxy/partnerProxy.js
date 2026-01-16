import axios from "axios";
import * as Middleware from "./proxyMiddleware.js";
import { sendNotificationEmailsAndEvents } from "./notificationService.js";

const buildTargetUrl = (baseUrl, originalUrl) => {
  const suffix = originalUrl.replace(/^\/admin\/reports/, "");
  return `${baseUrl.replace(/\/$/, "")}/reports${suffix}`;
};

const buildMobileAdminTargetUrl = (baseUrl, originalUrl) => {
  const suffix = originalUrl.replace(/^\/admin\/mobileAdmin\/users/, "");
  return `${baseUrl.replace(/\/admin$/, "")}/admin/users${suffix}`;
};

// Proxy target builder for user details endpoint
const buildUserDetailsTargetUrl = (baseUrl, originalUrl) => {
  // Map /admin/users/:id/details → {PARTNER_API_BASE_URL without trailing /admin}/admin/users/:id/details
  const suffix = originalUrl.replace(/^\/admin\/users/, "");
  return `${baseUrl.replace(/\/admin$/, "")}/admin/users${suffix}`;
};

export const registerPartnerProxy = (app, partnerApiBaseUrl) => {
  if (!partnerApiBaseUrl) {
    console.warn(
      "PARTNER_API_BASE_URL not set; /admin/reports and /admin/mobileAdmin proxy are disabled"
    );
    return;
  }

  // 1. Mobile Admin Proxy
  app.all(/^\/admin\/mobileAdmin/, async (req, res) => {
    try {
      const targetUrl = buildMobileAdminTargetUrl(
        partnerApiBaseUrl,
        req.originalUrl
      );
      const r = await axios({
        method: req.method,
        url: targetUrl,
        headers: {
          "Content-Type": req.headers["content-type"] || "application/json",
          Authorization: req.headers["authorization"] || "",
          "ngrok-skip-browser-warning": "true",
        },
        data: req.body,
        validateStatus: () => true,
      });
      res.status(r.status).send(r.data);
    } catch (err) {
      res
        .status(502)
        .json({ error: "Mobile Admin Proxy error", detail: err.message });
    }
  });

  // 2. Feedback Proxy
  app.get(/^\/admin\/reports\/([^\/]+)\/feedbacks$/, async (req, res) => {
    try {
      const match = req.originalUrl.match(
        /\/admin\/reports\/([^\/]+)\/feedbacks/
      );
      if (!match) return res.status(400).json({ error: "Report ID required" });

      const targetUrl = `${partnerApiBaseUrl.replace(/\/$/, "")}/reports/${
        match[1]
      }/feedbacks`;
      const r = await axios.get(targetUrl, {
        headers: {
          Authorization: req.headers["authorization"],
          "ngrok-skip-browser-warning": "true",
        },
        validateStatus: () => true,
      });
      res.status(r.status).json(r.data);
    } catch (err) {
      res
        .status(502)
        .json({ error: "Feedback Proxy error", detail: err.message });
    }
  });

  // 3. User Details Proxy
  app.get(/^\/admin\/users\/[^\/]+\/details$/, async (req, res) => {
    try {
      const targetUrl = buildUserDetailsTargetUrl(
        partnerApiBaseUrl,
        req.originalUrl
      );
      const r = await axios.get(targetUrl, {
        headers: {
          Authorization: req.headers["authorization"],
          "ngrok-skip-browser-warning": "true",
        },
        validateStatus: () => true,
      });
      res.status(r.status).send(r.data);
    } catch (err) {
      res
        .status(502)
        .json({ error: "User Details Proxy error", detail: err.message });
    }
  });

  // 4. REPORTS PROXY (Main Logic)
  app.all(/^\/admin\/reports/, async (req, res) => {
    try {
      // Validation
      const validation = await Middleware.validateAnonymousComplaintRestriction(
        req,
        partnerApiBaseUrl
      );
      if (validation.blocked)
        return res
          .status(validation.statusCode)
          .json({ error: validation.error });

      // Enrichment & Side Effects
      await Middleware.maybeSaveChatMessage(req);
      await Middleware.enrichAssignAdminBody(req);
      Middleware.enrichRevokeAdminBody(req);
      Middleware.enrichStatusBody(req);

      const targetUrl = buildTargetUrl(partnerApiBaseUrl, req.originalUrl);
      console.log(
        `🔄 Proxying ${req.method} ${req.originalUrl} → ${targetUrl}`
      );
      const response = await axios({
        method: req.method,
        url: targetUrl,
        headers: {
          "Content-Type": req.headers["content-type"] || "application/json",
          Authorization: req.headers["authorization"] || "",
          "ngrok-skip-browser-warning": "true",
        },
        data: req.body,
        validateStatus: () => true,
      });

      // Post-Request Notifications
      if (response.status >= 200 && response.status < 300) {
        const reportId = req.originalUrl.match(/\/reports\/([^\/]+)/)?.[1];
        // Fire and forget notifications
        sendNotificationEmailsAndEvents({
          req,
          r: response,
          reportId,
          reportData: response.data?.report || response.data,
          partnerApiBaseUrl,
        }).catch((err) => console.error("Notification Error:", err));
      }

      res.status(response.status).send(response.data);
    } catch (err) {
      console.error("Proxy Error:", err.message);
      res.status(502).json({ error: "Proxy error", detail: err.message });
    }
  });
};
