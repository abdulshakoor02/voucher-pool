# Voucher Pool Application

This application manages a pool of vouchers. It uses a PostgreSQL database to store voucher information and a Node.js backend to provide an API for voucher management.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Docker](https://www.docker.com/get-started)
*   [Docker Compose](https://docs.docker.com/compose/install/)

## Environment Setup

1.  **Create Environment File:**
    This project uses a `.env` file to manage environment-specific configurations. You'll need to create one in the root of the project.
    A template with all the required variables is provided in `env.test`. Copy this file to `.env`:

    ```bash
    cp env.test .env
    ```

2.  **Configure Environment Variables:**
    Open the `.env` file and set the appropriate values for your environment. Here's a description of each variable:

    *   `PORT`: port on which app will run (Example: `3000`)
    *   `DB_NAME`: name of the database (Example: `voucherdb`)
    *   `POSTGRES_USER`: database username (Example: `voucheradmin`)
    *   `POSTGRES_PASSWORD`: database passowrd (Example: `secretpassword`)
    *   `POSTGRES_HOST`: database hostname (Example: `postgres`)
    *   `POSTGRES_PORT`: database port, default is 5432 (Example: `5432`)
    *   `DB_POOL_MAX`: max pool size (Example: `10`)
    *   `DB_POOL_MIN`: min pool size (Example: `2`)
    *   `DB_POOL_IDLE`: pool idle timeout (Example: `10000`)
    *   `CUSTOMER_VOUCHER_LIMIT`: max voucher to be created at a time to avoid db overload (Example: `5`)
    *   `POSTGRES_DB_USER`: User for Postgres db docker image. This is used for the PostgreSQL service setup. (Example: `pgadmin`)
    *   `POSTGRES_DB_PASSWORD`: password for Postgres db docker image. This is used for the PostgreSQL service setup. (Example: `adminpassword`)

    **Example `.env` for local development:**
    ```env
    PORT=3000
    DB_NAME=voucherdb
    POSTGRES_USER=voucheradmin
    POSTGRES_PASSWORD=secretpassword
    POSTGRES_HOST=postgres
    POSTGRES_PORT=5432
    DB_POOL_MAX=10
    DB_POOL_MIN=2
    DB_POOL_IDLE=10000
    CUSTOMER_VOUCHER_LIMIT=5
    POSTGRES_DB_USER=pgadmin
    POSTGRES_DB_PASSWORD=adminpassword
    ```

## Running the Application

1.  **Build and Start Services:**
    Once the `.env` file is configured, you can start the application using Docker Compose:

    ```bash
    docker-compose up -d
    ```
    This command will build the `voucher_pool` image (if not already built) and start both the `voucher_pool` and `postgres` services in detached mode.

2.  **Accessing the Application:**
    The `voucher_pool` service will be accessible at `http://localhost:${PORT}`, where `${PORT}` is the value you set in your `.env` file.

## Services

The `docker-compose.yml` file defines the following services:

*   **`voucher_pool`**:
    *   The main application backend built using Node.js.
    *   It uses the `Dockerfile` in the project root for the build.
    *   The application code from your local directory (`./`) is mounted into `/app/` in the container. This means changes you make to the code locally will be reflected in the running container, which is useful for development.
    *   The service depends on `postgres` to be running.
    *   It runs the command `make run` which, according to the `Makefile`, executes `npm run build` and then `npm run start`.

*   **`postgres`**:
    *   A PostgreSQL database server.
    *   It uses the official `postgres:latest` image.
    *   Database files will be persisted in a Docker volume named `data` (relative to your project root, e.g., `./data:/var/lib/postgresql/data`), so your data will remain even if you stop and remove the container.
    *   The environment variables `POSTGRES_DB_USER`, `POSTGRES_DB_PASSWORD`, and `POSTGRES_DB` (which uses the value of `DB_NAME` from the `.env` file) are used to initialize the database.

## Development

*   **Code Changes**: As mentioned, the `voucher_pool` service mounts the local project directory. Changes to your source code will be reflected inside the container. Depending on your Node.js setup (e.g., if you are using a tool like `nodemon`), the application might restart automatically upon detecting changes. If not, you might need to restart the service: `docker-compose restart voucher_pool`.
*   **Viewing Logs**: To see the logs from the services, you can use:
    ```bash
    docker-compose logs -f voucher_pool
    docker-compose logs -f postgres
    ```
    Remove the `-f` flag to see current logs and exit.

## Stopping the Application

To stop and remove the containers, network, and volumes defined in the `docker-compose.yml`:

```bash
docker-compose down
```

If you want to stop the services without removing the anonymous volumes (like the one implicitly created for `/app` if not for the explicit mount), you can use:

```bash
docker-compose stop
```
To remove the named volume `data` (where PostgreSQL stores its data), you can run:
```bash
docker-compose down -v
```
Be cautious with this command as it will delete your database data.
