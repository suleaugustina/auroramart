# Step-by-Step Railway Deployment Guide

This guide details exactly how to deploy your Real-Time BI Pipeline to **Railway** directly from your **GitHub Repository** so that the entire system starts automatically and remains live 24/7.

---

## The Core Concept: Deployment Source
You will deploy everything from a **single GitHub repository**. 
1. Initialize git in your project root (`c:\Users\User\auroramart-v2`), create a repository on GitHub (private or public), and push your code there.
2. In Railway, you will link your GitHub account. Railway will read your repository, look at the subfolders (`analytics-pipeline` and `bots`), build their Docker containers, and run them.

---

## Step 1: Set Up Upstash Kafka (Your Free Messaging Broker)
Since setting up a full Kafka server in the cloud can be expensive, we use **Upstash**, which offers a fast, serverless Kafka free tier.

1. Go to [Upstash Console](https://console.upstash.com) and log in with your GitHub account.
2. Click **Create Cluster**.
3. Name your cluster (e.g., `auroramart-kafka`) and select a region close to you.
4. Once created, click on the **Topics** tab and click **Create Topic**. Name it: `auroramart-events`.
5. Go back to the **Details** tab, scroll down to the **Connection Details**, and copy:
   * **Endpoint (Bootstrap Server)**: Looks like `some-name-kafka.upstash.io:9092`
   * **Username**
   * **Password**
   * Keep this tab open.

---

## Step 2: Create a Railway Project & Database
1. Go to [Railway.app](https://railway.app) and sign in using your GitHub account.
2. Click **New Project** -> **Provision PostgreSQL**.
3. Railway will spin up a fully managed PostgreSQL database in a few seconds.
4. Click on the **Postgres** service card, go to the **Variables** tab, and you will see the `DATABASE_URL` (looks like `postgresql://postgres:password@host:port/railway`). You will use this connection string to feed data into Postgres.

---

## Step 3: Deploy the Event Collector (API)
The Collector receives HTTP requests from your bots and pushes them to Kafka.

1. In your Railway project dashboard, click **+ New** (or **Add Service**) -> **GitHub Repo**.
2. Select your repository.
3. Once the service card appears, click on it and go to **Settings**:
   * **Root Directory**: Set this to `analytics-pipeline` (this tells Railway to deploy from this folder).
   * **Port**: Set the port variable to `5001`.
4. Go to the **Variables** tab and add:
   * `KAFKA_BROKER` = `[Your Upstash Bootstrap Server Endpoint]` (e.g., `xxx-kafka.upstash.io:9092`)
   * `PORT` = `5001`
5. Go back to **Settings**, scroll down to the **Networking** section, and click **Generate Domain**.
   * *This creates a public URL for your collector, e.g., `https://collector-production.up.railway.app`.*
   * **Copy this URL!** This is your `API_URL` that the bots will use.

---

## Step 4: Deploy the Stream Processor (Analytics Engine)
The Processor reads from Kafka, filters for fraud alerts, and writes to PostgreSQL.

1. Click **+ New** -> **GitHub Repo** -> select the same repository again.
2. Click on the new service card, rename it to `processor` in the settings, and go to **Settings**:
   * **Root Directory**: Set this to `analytics-pipeline`
   * **Custom Start Command**: Set this to `node processor.js` (this overrides the default and starts the consumer script).
3. Go to the **Variables** tab and add:
   * `KAFKA_BROKER` = `[Your Upstash Bootstrap Server Endpoint]`
   * `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` 
     * *(Railway supports variable referencing! This automatically links the processor directly to your Railway PostgreSQL database).*

*Note: The moment this service builds and runs, it connects to Postgres, finds no tables, reads your `schema.sql` file, and automatically creates all tables and views.*

---

## Step 5: Deploy Metabase (Visual Dashboards)
Metabase reads data from Postgres and visualizes it.

1. Click **+ New** -> **GitHub Repo** or **Docker Image**.
   * *Instead of rebuilding, you can pull Metabase directly from Docker Hub!*
2. Select **Docker Image** and type: `metabase/metabase:latest`.
3. Once the service is created, go to **Settings**, scroll down to **Networking**, and click **Generate Domain** (Metabase runs on port `3000` by default, Railway handles this automatically).
4. Click the generated URL to open Metabase in your browser.
5. Create your admin account, and under **Add Database**, select **PostgreSQL**.
6. Fill in the connection credentials. You can copy these directly from the **Variables** tab of your **Postgres** service card in Railway:
   * **Host**: (Postgres Host)
   * **Port**: `5432`
   * **Database Name**: `railway` (or whatever the database name variable shows)
   * **Username**: `postgres`
   * **Password**: (Postgres Password)
7. Save. All your analytics views (`view_realtime_sales`, `view_conversion_funnel`, etc.) will show up automatically.

---

## Step 6: Deploy the Bot Simulator (Continuous 24/7 Traffic)
This generates live shopper behavior on a continuous loop.

1. Click **+ New** -> **GitHub Repo** -> select your repository.
2. Rename the service to `bots-simulator`.
3. Go to **Settings**:
   * **Root Directory**: Set this to `bots`
   * **Custom Start Command**: Set this to `npx ts-node src/runner.ts`
4. Go to the **Variables** tab and add:
   * `DAEMON` = `true` *(Enables infinite loop)*
   * `API_URL` = `[Your Collector URL from Step 3]` (e.g., `https://collector-production.up.railway.app`)
   * `CONVEX_URL` = `[Your Convex Project HTTP URL]` (e.g., `https://happy-otter-123.convex.site`)
   * `TOTAL` = `30` *(Simulate batches of 30 shoppers)*
   * `CONCURRENT` = `5` *(Run 5 concurrent bot threads)*
   * `DELAY_MS` = `1200` *(Slightly slow down actions to stay within free memory limits)*

---

## How it Runs automatically
* **Autopilot Ingestion**: The bots run continuously in their loop. Every time a bot views a product, adds it to cart, checkouts, or completes a payment, it sends an HTTP POST request to the **Collector**.
* **Real-time pipeline**: The collector pushes the event to **Kafka**. The **Processor** consumes the event, updates the **Postgres** tables, and records any stream fraud alerts.
* **Auto-Restart**: If any container crashes or Railway reboots, Railway automatically restarts it immediately.
* **Persistent History**: Everything accumulates in PostgreSQL. When you open your Metabase URL, you can see all current shopping activity and the entire historical log.
