const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const upload = multer();

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

// URL Scan
router.post('/url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL missing' });

    const encodedUrl = Buffer.from(url).toString('base64').replace(/=+$/, '');
    const response = await axios.get(`https://www.virustotal.com/api/v3/urls/${encodedUrl}`, {
      headers: { 'x-apikey': VIRUSTOTAL_API_KEY },

    });

    const vtData = response.data.data?.attributes;
    //API se last_analysis_stats & last_analysis_results  count nikalte hai. like malicuius ,clean
    
    const lastAnalysisStats = vtData?.last_analysis_stats || {};
    const lastAnalysisResults = vtData?.last_analysis_results || {};

    const positivesCount = (lastAnalysisStats.malicious || 0) + (lastAnalysisStats.suspicious || 0);
    res.json({
      positives: positivesCount,
      malicious: lastAnalysisStats.malicious || 0,
      suspicious: lastAnalysisStats.suspicious || 0,
      total: Object.keys(lastAnalysisResults).length,
      scans: lastAnalysisResults,
    });
  } catch (err) {
    console.error('VirusTotal API error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'VirusTotal API error', detail: err.response?.data || err.message });
  }
});

// File Scan with Polling for Completed Analysis
router.post('/file', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'File required' });

  try {
    const formData = new FormData();
    formData.append('file', file.buffer, file.originalname);

    // Step 1: Upload file for analysis
    const uploadResponse = await axios.post(
      'https://www.virustotal.com/api/v3/files',
      formData,
      {
        headers: {
          'x-apikey': VIRUSTOTAL_API_KEY,
          ...formData.getHeaders(),
        },
      }
    );
    console.log(uploadResponse);

    const analysisId = uploadResponse.data.data.id; // Scan ID to poll

    // Step 2: Poll for analysis result until 'completed' or timeout
    let analysisResult = null;
    const maxAttempts = 15;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // wait 10 sec

      const analysisResponse = await axios.get(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
          headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
        }
      );

      const status = analysisResponse.data.data.attributes.status;

      if (status === 'completed') {
        analysisResult = analysisResponse.data.data.attributes;
        break;
      }
      attempts++;
    }

    if (!analysisResult) {
      return res.status(202).json({
        message: 'Scan in progress. Please try again after a while.',
      });
    }

    // Extract last_analysis_stats and results for frontend
    const lastAnalysisStats = analysisResult.stats || analysisResult.last_analysis_stats || {};
    const lastAnalysisResults = analysisResult.results || analysisResult.last_analysis_results || {};

    const positivesCount = (lastAnalysisStats.malicious || 0) + (lastAnalysisStats.suspicious || 0);

    // Send structured result matching frontend expectations
    res.json({
      positives: positivesCount,
      malicious: lastAnalysisStats.malicious || 0,
      suspicious: lastAnalysisStats.suspicious || 0,
      total: Object.keys(lastAnalysisResults).length,
      scans: lastAnalysisResults,
    });

  } catch (err) {
    console.error('VirusTotal File Scan API error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'VirusTotal API error', detail: err.response?.data || err.message });
  }
});

// IP / Domain Search
router.post('/search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query required' });

  try {
    const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
    let endpoint = '';
    if (ipv4Regex.test(query)) {
      endpoint = `ip_addresses/${query}`;
    } else {
      endpoint = `domains/${query}`;
    }

    const response = await axios.get(`https://www.virustotal.com/api/v3/${endpoint}`, {
      headers: { 'x-apikey': VIRUSTOTAL_API_KEY },
    });

    const vtData = response.data.data?.attributes;

    const lastAnalysisStats = vtData?.last_analysis_stats || {};
    const scans = vtData?.last_analysis_results || {};

    const positivesCount = (lastAnalysisStats.malicious || 0) + (lastAnalysisStats.suspicious || 0);

    res.json({
      positives: positivesCount,
      malicious: lastAnalysisStats.malicious || 0,
      suspicious: lastAnalysisStats.suspicious || 0,
      total: Object.keys(scans).length,
      scans: scans,
    });
  } catch (err) {
    console.error('VirusTotal Search API error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'VirusTotal Search API error', detail: err.response?.data || err.message });
  }
});

module.exports = router;
