// routes/xirsys.js or similar
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const callRouter = express.Router();

const XIRSYS_IDENT = process.env.XIRSYS_IDENT || "jatinSloq2";
const XIRSYS_SECRET = process.env.XIRSYS_SECRET || "59c795fa-51ce-11f0-8cb0-0242ac150002";
const CHANNEL = process.env.XIRSYS_CHANNEL || "Whisper";

callRouter.get("/ice", async (req, res) => {
  try {
    const response = await fetch(`https://global.xirsys.net/_turn/${CHANNEL}`, {
      method: "PUT",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${XIRSYS_IDENT}:${XIRSYS_SECRET}`).toString("base64"),
      },
    });

    const data = await response.json();

    if (data.s?.toUpperCase() !== "OK") {
      console.error("❌ Failed to get ICE servers from Xirsys:", data);
      return res.status(500).json({ error: "Xirsys error" });
    }

    // Fix "url" to "urls"
    const fixedIceServers = data.v.iceServers.map((server) => {
      const { url, ...rest } = server;
      if (url) {
        return { urls: url, ...rest };
      }
      return server;
    });

    console.log("✅ Successfully fetched ICE servers from Xirsys.");
    return res.json({ iceServers: fixedIceServers });
  } catch (error) {
    console.error("❌ Error fetching ICE servers:", error);
    res.status(500).json({ error: "Server error fetching ICE servers" });
  }
});


export default callRouter;
