# Real-Time Retail BI Pipeline Deployment & Execution Guide

This guide provides instructions on how to run, configure, and maintain the cloud-native real-time analytics pipeline for AuroraMart. It covers:
1. **Local Setup** (Docker Desktop on Windows)
2. **VPS Deployment** (Hetzner, DigitalOcean, etc. - Recommended for production / school demo)
3. **PaaS Deployment** (Railway / Render)
4. **Operations & Maintenance** (How to keep it live, restart, and reset data monthly)

---

## 1. Local Setup (Docker Desktop)

The local setup package builds all services inside a single Docker Compose network. You don't need to run any local Node.js or Python servers manually.

### Prerequisites
* Install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
* Make sure Docker Desktop is running and set to Linux containers mode (default).

### Step-by-Step Execution:

1. **Start the Pipeline Stack:**
   Open a terminal in the project root and navigate to the `analytics-pipeline` directory:
   ```bash
   cd analytics-pipeline
   docker compose up --build -d
   ```
   *This command downloads PostgreSQL, Kafka, and Metabase, compiles your collector and processor Node.js containers, and runs everything in the background.*

2. **Verify Containers are Running:**
   ```bash
   docker compose ps
   ```
   You should see 5 containers running:
   * `analytics-postgres` (Postgres Warehouse - Port `5435`)
   * `analytics-kafka` (Kafka Broker - Port `9092`)
   * `analytics-metabase` (Metabase BI - Port `3030`)
   * `analytics-collector` (Event Collector API - Port `5001`)
   * `analytics-processor` (Stream Processor Consumer)

3. **Configure Metabase Dashboard:**
   * Open your browser and go to: `http://localhost:3030`
   * Complete the initial setup wizard (create an admin account).
   * When asked to **Add your data**, select **PostgreSQL** and input:
     * **Host:** `postgres` (if connecting from inside the docker network, OR use your computer's IP / `localhost` if prompted, but `postgres` is correct inside the compose network).
     * **Port:** `5432`
     * **Database name:** `analytics_warehouse`
     * **Database username:** `analytics_user`
     * **Database password:** `analytics_password`
   * Click **Save** to connect.

4. **Run the Bot Simulator to Stream Data:**
   Open a separate terminal in your project root, enter the `bots` folder, and run:
   ```bash
   cd bots
   npm run start
   ```
   *The bot simulator will generate active shoppers that perform actions (visits, add-to-carts, checkouts, and payments). The logs will show events being dual-written to Convex and to your local collector API (`http://localhost:5001/events`).*

5. **Create Real-Time Visualizations in Metabase:**
   * In Metabase, click **New** -> **Question** -> **Native query** (SQL).
   * Run a simple select to verify data is arriving: `SELECT * FROM store_events LIMIT 10;`.
   * Create questions using our pre-built high-performance database views:
     * **Live Revenue Counter:** `SELECT total_revenue FROM view_realtime_sales;` (Use the **Number** visualization, set auto-refresh to 1-second).
     * **Top Products sold:** `SELECT product_name, total_purchased, total_revenue FROM view_product_performance;` (Use a **Bar chart**).
     * **Conversion Funnel:** `SELECT step, unique_sessions FROM view_conversion_funnel;` (Use the **Funnel** visualization).
     * **Fraud Warnings:** `SELECT created_at, alert_type, severity, description FROM fraud_alerts ORDER BY created_at DESC;` (Use a **Table** visualization).
     * **Sales by City:** `SELECT city, revenue FROM view_sales_by_city;` (Use a **Pie chart** or **Bar chart**).
   * Save these charts to a single Dashboard, and toggle the dashboard **Auto-refresh** (top right) to **1 second / 10 seconds** to watch it move in real-time.

---

## 2. VPS Deployment (Hetzner, DigitalOcean, etc.)

Deploying to a VPS is the easiest way to keep your dashboard live 24/7. Since Docker handles all dependencies, setup takes under 5 minutes.

### Step-by-Step VPS Setup:

1. **Provision a Linux VPS:**
   * Choose an Ubuntu server (Ubuntu 22.04 LTS recommended) with at least 4GB RAM (Kafka and Metabase require some memory to run smoothly).

2. **Install Docker and Docker Compose:**
   SSH into your VPS and run:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-plugin
   sudo systemctl enable --now docker
   ```

3. **Upload the Analytics Folder:**
   Upload the `analytics-pipeline` folder to your VPS (using `git clone` or `sftp`).

4. **Launch the Stack:**
   Navigate into the folder on the VPS and run:
   ```bash
   cd analytics-pipeline
   docker compose up --build -d
   ```
   *Because of the `restart: always` rule in `docker-compose.yml`, if your VPS reboots or crashes, the database, Kafka, collector, processor, and Metabase will automatically restart and stay live.*

5. **Expose Metabase:**
   You can now access your live Metabase dashboard at `http://<your-vps-ip>:3030`.

---

## 3. PaaS Deployment (Railway & Render)

If you don't want to manage a server or command-line VPS, you can host the pipeline on platforms like **Railway** or **Render**.

### Option A: Railway (Easiest Cloud Setup)
Railway makes deployment simple by providing native databases and automatic build triggers.

1. **Deploy PostgreSQL:**
   * Go to Railway and create a **New Project**.
   * Select **Provision PostgreSQL**.
   * Once created, go to the database **Variables** tab and copy the connection string (`DATABASE_URL`).

2. **Deploy Kafka (Using Upstash - Free Tier):**
   * Go to [Upstash](https://upstash.com) and create a free serverless Kafka cluster.
   * Copy the connection credentials (bootstrap server URL, username, password).

3. **Deploy the Event Collector & Processor:**
   * Commit your repository containing the `analytics-pipeline` directory to GitHub.
   * On Railway, click **New** -> **GitHub Repo** and choose your repository.
   * Add two services (one for the collector, one for the processor):
     * **Collector Service Configuration:**
       * Root Directory: `/analytics-pipeline`
       * Dockerfile path: `/analytics-pipeline/Dockerfile`
       * Port: `5001`
       * Add Environment Variables:
         * `KAFKA_BROKER`: (Your Upstash bootstrap server URL)
         * `PORT`: `5001`
     * **Processor Service Configuration:**
       * Root Directory: `/analytics-pipeline`
       * Dockerfile path: `/analytics-pipeline/Dockerfile`
       * Override Command: `node processor.js`
       * Add Environment Variables:
         * `DATABASE_URL`: (Your Railway PostgreSQL connection string)
         * `KAFKA_BROKER`: (Your Upstash bootstrap server URL)

4. **Deploy Metabase:**
   * On Railway, click **New** -> **Template** and search for **Metabase**.
   * Link it to your Railway PostgreSQL database.

---

## 4. Keeping it Live & Operations

### How to keep everything live:
By default, running `docker compose up -d` keeps everything active on the host machine. The containers will run 24/7 unless explicitly stopped. If the machine reboots, Docker daemon will auto-start all 5 services automatically.

### How to reset / redo data (e.g., once a month or for a fresh demo):
If you want to clear your analytics dashboard and start with clean data, you can run these simple commands:

1. **Option A: Clean data without losing dashboard setup**
   If you want to clear the transaction history but keep your Metabase charts, tables, and connection:
   Connect to PostgreSQL (using Docker cli or Metabase query editor) and run:
   ```sql
   TRUNCATE TABLE store_events RESTART IDENTITY CASCADE;
   TRUNCATE TABLE fraud_alerts RESTART IDENTITY CASCADE;
   ```
   *This immediately wipes all transaction logs and fraud alerts, resetting your charts to 0. You can now re-run the Bot Simulator to populate fresh analytics.*

2. **Option B: Total factory reset (wipe database and Metabase dashboard configs)**
   If you want to completely wipe everything, including the database files, Kafka offsets, and Metabase settings to start fresh:
   ```bash
   cd analytics-pipeline
   docker compose down -v
   docker compose up --build -d
   ```
   *The `-v` flag deletes the persistent Docker volumes (`pgdata` and `metabase-data`). Running `docker compose up` will rebuild and initialize a brand-new, empty database and Metabase setup.*
