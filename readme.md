## Overview
This is a demo for a motel system, covering both customer and admin experiences. See [dapang.live](https://dapang.live) for a running example.


## Tech Stack
- Front-end: Angular (default), React (partial implemented)
- Backend API: ASP.NET Core 8 + EF Core
- Database: PostgreSQL
- CI/CD: GitHub Actions + Helm to Azure AKS

## File Structure
- `front/`: Angular UI
- `web/`: React UI (partial)
- `api/`: ASP.NET Core API
- `sql/`: Schema and seed SQL
- `scripts/`: Helper scripts for dev and ops
- `storage/`: large blob files
- `helm/`: Helm charts and values
- `setup.sh`: Main configuration for connecting Azure. (Please note these configuration might be security sensitive.)

## Run Locally

Note: When running locally, large blob files (like images) are still fetched from Azure Object Storage over the internet, so if it is not configured properly or files are not uploaded, they may fail to load.

1) Start PostgreSQL (Docker)  
```bash
./scripts/local/pg_up.sh
```
- Default connection: `postgresql://app:app_pw@localhost:5432/appdb`.

2) Apply SQL in `sql/`  
```bash
./scripts/local/run_all_sql.sh
```

3) Run the API  
```bash
./scripts/local/api_dev.sh
```
- Serves at `http://localhost:8080`.
- Uses the connection string from `appsettings.json` or `POSTGRES_CONNECTION` / `DATABASE_URL` env vars; defaults to the local Docker values above.

4) Run the Angular front-end  
```bash
cd front
npm install
npm start
```
- Serves at `http://localhost:4200` and calls the API at `http://localhost:8080`.

5) Stop PostgreSQL when done  
```bash
./scripts/local/stop_pg.sh
```
## Microservice deployment

Design target: build images, push to ACR, then deploy to AKS via Helm. Dockerfiles and Helm charts are already prepared; see `scripts/push-*-acr.sh` and `helm/` if you need a different workflow.



## Deploy on Azure (CLI)
Please note some of the following steps are not necessary for anyone. It is trying to give the full steps for deploying on a brand-new Azure account or subscription.

### 1) Basic setup 
```bash
# Login (interactive)
az login

# List/select subscription
az account list -o table
az account set --subscription "<your-subscription-id>"
az account show -o table
```

### 2) Project config (setup.sh / env vars)
`setup.sh` already defines defaults. You can edit it or override in your shell:
```bash
export AZURE_SUBSCRIPTION_ID="<your-subscription-id>"
export AZURE_TENANT_ID="<your-tenant-id>"
export RG="rg-ecommerce-dev"
export ACR_NAME="acrecommercedev629"
export AKS="aks-ecommerce-dev"
export AZURE_STORAGE_ACCOUNT="storageecommerce629"
```
To load defaults:
```bash
source ./setup.sh
```

### 3) Create/verify Azure resources 
```bash
# Resource group
az group create -n "$RG" -l "eastus"

# ACR (container registry)
az acr create -n "$ACR_NAME" -g "$RG" --sku Basic
az acr show -n "$ACR_NAME" -o table

# AKS (Kubernetes)
az aks create -n "$AKS" -g "$RG" --node-count 2 --generate-ssh-keys
az aks show -n "$AKS" -g "$RG" -o table

# Object storage (Storage Account)
az storage account create -n "$AZURE_STORAGE_ACCOUNT" -g "$RG" -l "eastus" --sku Standard_LRS
az storage account show -n "$AZURE_STORAGE_ACCOUNT" -o table
```

### 4) Connect AKS + attach ACR 
```bash
# Get kubeconfig
az aks get-credentials -g "$RG" -n "$AKS"

# Attach ACR to AKS (allow pulls)
az aks update -g "$RG" -n "$AKS" --attach-acr "$ACR_NAME"
```
This writes/merges into `~/.kube/config` and sets the current context. If you already have kubeconfig entries, use `--overwrite-existing` or manage contexts explicitly.
You can also use the script (manual): `scripts/aks-login-attach.sh`

### 5) Build and push images 
```bash
# Login to ACR
az acr login -n "$ACR_NAME"

# Front, API, Web images (manual scripts)
./scripts/push-front-acr.sh
./scripts/push-api-acr.sh
./scripts/push-web-acr.sh
```

### 6) Deploy to AKS with Helm (manual)
```bash
./scripts/helm-upgrade.sh
```

### 7) Upload static assets to object storage 
```bash
./scripts/storage_upload.sh
```

### 8) Sync Local DB to Kubernetes Cluster
```bash
./scripts/local/dump_pg_backup.sh
./scripts/push_pg_data.sh backups/appdb.sql
```

### 9) GitHub Actions note
These scripts are for manual testing; GitHub Actions uses its own steps that are equivalent, and it does not run these scripts.  
Actions does: Azure login (OIDC), ACR login, build/push front + API images, set AKS context, and Helm deploy.
