# How to Deploy galeus for Free (Step-by-Step, No Credit Card)

This guide shows you how to put **galeus** online so anyone in the world can open your link, upload their Canva certificates, and generate certificates.

It is **100% free** and requires **zero credit cards**.

---

## The Simple Concept

Think of **galeus** as a car with two parts:

1. **The Body (The Frontend Website)**: What people see and click on. We put this on **Vercel** (the most popular free website host).
2. **The Engine (The Backend)**: The Python code that actually edits the PDFs, checks names, and sends emails. We put this on **Render** (a free cloud host that runs Python).

Once both are turned on, Vercel connects to Render automatically behind the scenes. Your users only ever see your clean Vercel link!

---

## Step 1: Turn on the Engine (Render — 3 Minutes)

*Render hosts the Python engine for free. You sign up using your GitHub account—it will never ask you for a credit card.*

1. Open **[render.com](https://render.com/)** in your browser.
2. Click **Get Started for Free** and choose **Sign in with GitHub**.
3. Once logged in, click the blue **New +** button in the top right corner and choose **Web Service**.
4. Choose **Build and deploy from a Git repository**, then click **Next**.
5. Find and click your repository: **`Ameya79/galeus`**.
6. Fill in these 4 simple fields:
   - **Name**: Type `galeus-api` (or any name you like).
   - **Region**: Pick the one closest to you (e.g., Singapore, Frankfurt, or Oregon).
   - **Environment / Runtime**: Select **Docker** (Render will automatically read your `Dockerfile`).
   - **Instance Type**: Select **Free** ($0 / month).
7. Scroll down to the **Environment Variables** section, click **Add Environment Variable**, and add:
   - **Key**: `DATA_DIR`
   - **Value**: `/tmp/data`
8. Click the blue **Create Web Service** button at the bottom.
9. Render will take about 2–3 minutes to build the engine. When it finishes, you will see a green **Live** badge at the top.
10. **Copy your engine's link**: Right under your project name at the top left, copy the link that ends in `.onrender.com` (for example: `https://galeus-api-xyz.onrender.com`).

*Keep this link copied! You will paste it into Vercel in Step 2.*

---

## Step 2: Put the Website on the Internet (Vercel — 2 Minutes)

*Vercel hosts the website for free. It gives you a fast, beautiful link like `https://galeus.vercel.app`.*

1. Open **[vercel.com](https://vercel.com/)** in your browser.
2. Click **Sign Up** (or Log In) and choose **Continue with GitHub**.
3. On your Vercel dashboard, click **Add New...** (top right) ➔ click **Project**.
4. You will see a list of your GitHub repos. Find **`galeus`** (or `Ameya79/galeus`) and click **Import**.
5. On the configure screen, configure these two things:
   - **Root Directory**: Click the **Edit** button next to Root Directory. Select the **`web`** folder and click **Continue**. *(This is very important because the website code lives in the `web` folder!)*
   - **Environment Variables**: Click to open this section. Add one variable:
     - **Key**: `BACKEND_URL`
     - **Value**: Paste the Render link you copied in Step 1 (e.g. `https://galeus-api-xyz.onrender.com`).
6. Click the blue **Deploy** button!
7. Wait about 60 seconds. Fireworks will shoot across your screen saying **Congratulations!**
8. Click on the preview image or the domain link (e.g. `https://galeus-iota.vercel.app`) to open your live website!

---

## Step 3: Test That Everything Works

1. Open your new Vercel link in your browser.
2. You will see the **galeus** homepage with your animated motion graphic ad playing.
3. Click the big black button: **Open Studio Workstation**.
4. At the top of the studio page, look at the engine status pill:
   - It should say: `● LOCAL_DISPATCH_ENGINE: READY`.
5. Upload a single-page Canva certificate PDF and an attendee spreadsheet (CSV or Excel).
6. Click **Initialize Batch Pipeline**.
7. If your table of attendees loads with clean names and green tick marks, **congratulations! Your app is 100% working live on the internet!**

---

## 3 Helpful Things to Know

### 1. Why does my first click take 30 to 45 seconds?
Because Render's free tier is completely free, it puts the Python engine to sleep after 15 minutes if nobody is using it to save electricity. When a new user visits, it takes about 30 seconds to wake up. Once awake, it is lightning fast for all certificates.

### 2. Can I use my own custom domain?
Yes! On Vercel, go to **Settings** ➔ **Domains**, type your custom domain (like `galeus.com` or `certificates.myclub.com`), and Vercel will guide you through setting it up with free automatic SSL.

### 3. Do I ever have to pay anything?
No. Both Vercel's Hobby plan and Render's Free tier are genuinely free forever for personal, school, hackathon, and club projects.

---

## Alternative: Hugging Face Spaces (Also 100% Free, Never Goes to Sleep)

If you don't want Render's 30-second wake-up time, you can also host the engine on **Hugging Face Spaces** for free (with 16GB of RAM and zero credit card):

1. Go to **[huggingface.co](https://huggingface.co)** and sign up with GitHub.
2. Go to **[huggingface.co/new-space](https://huggingface.co/new-space)**.
3. Name it `galeus-engine`. Under **Space SDK**, select **Docker** ➔ **Blank**.
4. Choose the **Free (16GB RAM, 2 CPU)** tier.
5. Push your code or connect your GitHub repo.
6. Copy the direct URL (ends in `.hf.space`) and paste it as `BACKEND_URL` in Vercel.
