import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email API Endpoint
  app.post("/api/submit", async (req, res) => {
    const { name, phone, email, service, zip, date, message, formType } = req.body;

    // Check for Resend API Key
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured.");
      return res.status(500).json({ error: "Email service not configured. Please add RESEND_API_KEY to secrets." });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const notificationEmail = process.env.NOTIFICATION_EMAIL || "aircare2018mva@gmail.com";

    try {
      const { data, error } = await resend.emails.send({
        from: "Air Care Leads <onboarding@resend.dev>", // Default Resend test domain
        to: [notificationEmail],
        subject: `New Lead: ${formType || "General Enquiry"} - ${name}`,
        html: `
          <h3>New Lead Received from ${formType || "Landing Page"}</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          ${email ? `<p><strong>Email:</strong> ${email}</p>` : ""}
          ${service ? `<p><strong>Service:</strong> ${service}</p>` : ""}
          ${zip ? `<p><strong>Zip Code:</strong> ${zip}</p>` : ""}
          ${date ? `<p><strong>Preferred Date:</strong> ${date}</p>` : ""}
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}
          <hr>
          <p><small>Sent from Air Care Landing Page</small></p>
        `,
      });

      if (error) {
        console.error("Resend error:", error);
        return res.status(400).json({ error: error.message });
      }

      res.status(200).json({ success: true, message: "Lead sent successfully!" });
    } catch (err) {
      console.error("Submission error:", err);
      res.status(500).json({ error: "Failed to process lead submission." });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
