# Deploy galeus with Vercel + Hugging Face (100% Free, No Credit Card)

This guide shows you how to deploy **galeus** using **Vercel** (for the frontend website) and **Hugging Face Spaces** (for the Python backend engine).

- **Cost**: **$0.00 forever**
- **Credit Card Required**: **NO** (Zero payment details asked)
- **RAM**: **16 GB RAM** & 2 vCPUs (32x more powerful than Render!)

---

## Does Hugging Face Have Sleep Issues Like Render?

| Feature | Render (Free Tier) | Hugging Face Spaces (Free) |
| :--- | :--- | :--- |
| **Goes to sleep after** | **15 minutes** of no visits | **48 hours** (2 full days) of no visits |
| **Wake-up time** | 30 to 50 seconds (slow) | 5 to 10 seconds (fast) |
| **Can you keep it awake 24/7?** | ❌ No (Render blocks keep-alive pings) | ✅ **Yes!** (Pinging it once a day keeps it awake 24/7) |
| **Free Memory** | 512 MB | **16,000 MB (16 GB)** |

---

## Step 1: Deploy the Python Engine on Hugging Face (3 Minutes)

1. Open **[huggingface.co](https://huggingface.co/)** and click **Sign Up** (Sign in with your GitHub account—no card needed).
2. Go to **[huggingface.co/new-space](https://huggingface.co/new-space)**.
3. Fill in these fields:
   - **Space Name**: `galeus` (or `galeus-api`)
   - **License**: `mit`
   - **Select Space SDK**: Choose **Docker** ➔ select **Blank**.
   - **Space Hardware**: Keep the default **Free (2 vCPU, 16GB RAM)**.
   - **Visibility**: **Public**.
4. Click the blue **Create Space** button.
5. You will see a page with git instructions. Now push your code to your new space:
   Open PowerShell on your computer and run:
   ```powershell
   cd c:\Users\vinay\OneDrive\Desktop\certclerk
   git remote add space https://huggingface.co/spaces/YOUR_HF_USERNAME/galeus
   git push space main
   ```
   *(Replace `YOUR_HF_USERNAME` with your Hugging Face username, and enter your HF password or Access Token if asked).*
6. Hugging Face will now automatically build your Docker container. In about 60–90 seconds, you will see a green badge saying **Running**.
7. **Find your direct link**:
   - In your Space, click the **three dots menu (`...`)** at the top right ➔ click **Embed this Space**.
   - Look for **Direct URL**.
   - It will look like: `https://YOUR_HF_USERNAME-galeus.hf.space`.
   - Copy this URL!

*Test it: Open `https://YOUR_HF_USERNAME-galeus.hf.space/healthz` in your browser. It will reply `{"ok":true,"service":"galeus"}`!*

---

## Step 2: Put the Website on Vercel (2 Minutes)

1. Open **[vercel.com](https://vercel.com/)** and sign in with GitHub.
2. Click **Add New...** (top right) ➔ click **Project**.
3. Find your **`galeus`** repo (or `Ameya79/galeus`) and click **Import**.
4. Configure two settings:
   - **Root Directory**: Click **Edit** next to Root Directory. Select the **`web`** folder and click **Continue**.
   - **Environment Variables**: Open this section and add:
     - **Key**: `BACKEND_URL`
     - **Value**: Paste your Hugging Face direct link (e.g. `https://YOUR_HF_USERNAME-galeus.hf.space`).
5. Click **Deploy**.
6. Wait 60 seconds. When the fireworks appear, click your new link (e.g. `https://galeus.vercel.app`)!

---

## Step 3: Test Your Live App

1. Open your live Vercel link.
2. Click **Open Studio Workstation**.
3. Notice the top status pill: `● LOCAL_DISPATCH_ENGINE: READY`.
4. Upload your Canva certificate PDF and attendee spreadsheet.
5. Click **Initialize Batch Pipeline**.
6. Watch your attendees load with formatted names, zero typos, and 16GB-powered PyMuPDF rendering!

---

## Bonus: How to Keep Hugging Face Awake 24/7 for Free

Because Hugging Face only sleeps after 48 hours of complete silence, you can keep it awake permanently:

1. Go to **[cron-job.org](https://cron-job.org)** or **[uptimerobot.com](https://uptimerobot.com)** (both 100% free, no credit card).
2. Create a monitor to ping:
   `https://YOUR_HF_USERNAME-galeus.hf.space/healthz`
   every 12 hours.
3. Your backend will **never go to sleep**, meaning zero startup delay for you and your users at all times!
