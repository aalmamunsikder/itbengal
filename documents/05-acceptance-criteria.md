# Acceptance Criteria (UAC) Specification - ITBengal Hosting Platform

This document defines the formal engineering Acceptance Criteria and User Acceptance Criteria (UAC) for the ITBengal Hosting Platform. It establishes the baseline requirements for functionality, security, performance, and recovery behavior across all platform subsystems. All test scenarios are detailed using the standard **Given-When-Then** syntax and include both successful operational flows and comprehensive error/exception paths.

---

## 1. User Authentication & Security

### Scenario 1.1: User Sign Up with Email Verification (Happy Path)
*   **Given** a guest user is on the ITBengal Signup page,
*   **When** they enter a unique email address (`user@domain.com`), a password that satisfies the complexity rules (minimum 10 characters, at least 1 uppercase letter, 1 lowercase letter, 1 numeric digit, and 1 special symbol), and click "Create Account",
*   **Then** the platform database shall create a new user record with `status = PENDING_VERIFICATION` and generate a unique, cryptographically secure verification token with a 24-hour expiration window,
*   **And** the platform's email worker (via BullMQ) shall send an HTML email containing a verification link with the secure token to the user's email address,
*   **And** the client UI shall transition to the "Verify Email" landing state, informing the user that a confirmation link has been sent.

### Scenario 1.2: User Sign Up (Exception Path - Invalid Input & Duplication)
*   **Given** a guest user is on the ITBengal Signup page,
*   **When** they attempt to register with an email format that is invalid (e.g., `user@domain`), or a password that fails the complexity constraints (e.g., `simple123`), or an email that already exists in the database, and click "Create Account",
*   **Then** the platform shall reject the request prior to database write,
*   **And** the API shall return a `400 Bad Request` or `409 Conflict` HTTP status code with a descriptive validation error payload,
*   **And** the UI shall highlight the violating fields in red with specific inline warnings (e.g., "Password must contain at least one special character", "Email address already registered").

### Scenario 1.3: Email Verification Activation (Happy Path)
*   **Given** a registered user has received a verification link containing a valid token,
*   **When** they click the link or perform a `GET` request to `/api/auth/verify?token=<token>`,
*   **Then** the platform shall verify the token's signature, match it to the pending user, and update the user's status to `ACTIVE`,
*   **And** it shall invalidate the used token in the database,
*   **And** the browser shall redirect the user to the Login screen with a success toast notification: "Email verified successfully. You can now log in."

### Scenario 1.4: Email Verification Activation (Exception Path - Expired/Tampered Token)
*   **Given** a user attempts to verify their email address,
*   **When** they click an expired token link (older than 24 hours) or a link containing a tampered/malformed verification token,
*   **Then** the server shall reject the activation request, returning a `400 Bad Request` or `410 Gone` error,
*   **And** the UI shall display a failure screen indicating "Verification link is invalid or has expired",
*   **And** provide a "Resend Verification Email" button, which when clicked triggers a fresh token generation and dispatch.

### Scenario 1.5: User Login with Password Constraints & Account Lockout (Happy Path & Failure)
*   **Given** an active registered user with 2FA disabled,
*   **When** they enter correct credentials on the Login screen,
*   **Then** the system shall generate a secure JWT pair (Access Token & Refresh Token) stored in HTTP-only, secure, same-site cookies,
*   **And** redirect the user to the Customer Dashboard.
*   **Given** the user enters incorrect credentials,
*   **When** the login attempts fail 5 consecutive times from the same IP/User within 15 minutes,
*   **Then** the system shall lock the account for a cooldown period of 30 minutes, update the account status to `LOCKED`, write an entry to the audit log, and return a `429 Too Many Requests` API response with a message: "Account locked due to excessive failed attempts. Try again in 30 minutes."

### Scenario 1.6: Two-Factor Authentication (2FA) Registration (Happy Path)
*   **Given** a logged-in user is on the Security Settings page and clicks "Enable 2FA",
*   **When** the backend generates a unique cryptographically secure TOTP secret, converts it to a standard `otpauth://` URI, and renders it as a QR code along with displaying the raw secret key,
*   **Then** the user must scan the QR code with an authenticator app, enter the generated 6-digit TOTP token into the confirmation input, and click "Confirm Setup",
*   **And** the backend shall validate the token against the generated secret; if valid, it shall set `two_factor_enabled = true`, encrypt the TOTP secret with AES-256-GCM before database write,
*   **And** display a list of 10 static, single-use, 8-character alphabetic backup recovery codes, forcing the user to click "I have saved these codes" before closing the screen.

### Scenario 1.7: 2FA Login Verification (Happy Path & Backup Recovery)
*   **Given** a user has enabled 2FA and successfully enters their correct primary username and password on the Login page,
*   **When** the system halts the login flow and prompts them to enter the 2FA code,
*   **Then** the user must provide a valid 6-digit TOTP code from their authenticator app to complete the login, causing the backend to issue active session cookies.
*   **Given** the user does not have access to their authenticator app,
*   **When** they click "Use Backup Code" and enter one of their unused backup recovery codes,
*   **Then** the backend shall authenticate the session, mark that specific recovery code as used in the database, and grant dashboard access.
*   **Given** the user enters an invalid TOTP token or an already used backup code,
*   **When** they click "Submit",
*   **Then** the system shall reject the login attempt, increment the failed attempt count, and display: "Invalid verification code. Please try again."

### Scenario 1.8: Session Timeout and Token Revocation (Happy Path)
*   **Given** a user is logged in,
*   **When** they remain inactive (no API calls generated) for more than the configured idle timeout period of 30 minutes (sliding window),
*   **Then** the system shall expire the short-lived Access Token,
*   **And** when the client attempts to use the Refresh Token and finds the absolute session window (e.g., 7 days) has expired, it shall clear cookies, revoke active tokens, and redirect the user to the Login page with a message: "Session expired due to inactivity."
*   **Given** a user clicks the "Log Out" button on the dashboard,
*   **When** the client submits a request to `/api/auth/logout`,
*   **Then** the backend shall immediately blacklist the Refresh Token in Redis, delete active cookies, and terminate the session in the database.

### Scenario 1.9: API Key Creation & Cryptographic Storage (Happy Path)
*   **Given** an active organization administrator is on the API Keys management page,
*   **When** they click "Generate API Key", specify a name (e.g., "CI/CD Deployment Key"), select granular scopes (e.g., `deployments:write`, `projects:read`), set an expiration date, and click "Generate",
*   **Then** the system shall generate a cryptographically secure key prefixed with `itb_live_` followed by 32 random characters,
*   **And** it shall calculate a SHA-256 hash of the key to store in the database (never storing the raw key),
*   **And** present the raw key to the user *once* in a secure modal block with a copy button, warning them that it will not be shown again.

### Scenario 1.10: API Key Revocation (Happy Path & Immediate Deny)
*   **Given** an active API key is currently being used by external scripts to interact with the ITBengal API,
*   **When** the owner click "Revoke" on that specific API key in the settings panel,
*   **Then** the system shall immediately flag the database record as `REVOKED`, clear any validation cache stored in Redis, and write a security audit log,
*   **And** any subsequent API call matching the SHA-256 hash of the revoked key shall be rejected instantly with a `401 Unauthorized` response containing: "API key has been revoked."

---

## 2. React/Static Application Hosting

### Scenario 2.1: Git Repository Import & OAuth Authorization (Happy Path & Failure)
*   **Given** a user is on the "Create New Project" page,
*   **When** they click "Connect GitHub", complete the OAuth redirection handshake, and grant access to their repositories,
*   **Then** the system shall save the encrypted OAuth token, retrieve a list of accessible repositories, and display them in the UI with a branch selection dropdown.
*   **Given** the GitHub API goes offline or the user cancels authorization mid-way,
*   **When** the OAuth callback fires with an error parameter or fails to connect,
*   **Then** the platform backend shall redirect the user back to the project page, displaying a prominent alert: "Failed to authenticate with GitHub. Please try again."

### Scenario 2.2: Git-Triggered Build & Package Resolution (Happy Path)
*   **Given** a repository has been connected, and the user clicks "Deploy" for a React application,
*   **When** a BullMQ build task is dispatched, triggering a runner node to clone the branch and detect the package manager (e.g., finding `package-lock.json` triggers `npm`, `yarn.lock` triggers `yarn`, `pnpm-lock.yaml` triggers `pnpm`),
*   **Then** the build runner shall install dependencies utilizing a cached node_modules layer to speed up execution,
*   **And** it shall run the build script (e.g., `npm run build`), producing a static distribution folder (typically `build` or `dist`),
*   **And** package this build into a Docker image, registering it in the internal registry, and updating the deployment status in the DB to `SUCCESS`.

### Scenario 2.3: Git Build Failure (Exception Path - Compilation Error)
*   **Given** a code repository has syntax errors or incorrect dependencies causing a compilation crash,
*   **When** the build script executes `npm run build` inside the builder container, returning a non-zero exit code,
*   **Then** the build runner shall halt execution immediately, capture the standard error stream (`stderr`),
*   **And** mark the deployment record as `FAILED` in the database,
*   **And** stream the final error logs directly to the user's dashboard deployment window, showing a clear notification: "Build failed: compilation error."

### Scenario 2.4: ZIP Package Upload & Size Validation (Happy Path & Exception)
*   **Given** a user is on the "New Project" deployment page and selects the ZIP upload option,
*   **When** they drop a `.zip` archive that is under the 100MB limit, and the system extracts and scans it for malware,
*   **Then** the system shall create a deployment record, run static analysis to locate `index.html`, package the folder contents, and transition the project status to active.
*   **Given** the uploaded file exceeds 100MB or contains a nested zip bomb,
*   **When** the upload starts or extraction begins,
*   **Then** the system shall reject the file upload, delete any partially uploaded files from the temporary buffer, return a `413 Payload Too Large` or `400 Bad Request` code, and display: "File exceeds maximum allowable size limit of 100MB."

### Scenario 2.5: Environment Variable Injection & Encryption (Happy Path)
*   **Given** a user has defined environment variables (`DATABASE_URL`, `API_SECRET`) in the project settings panel,
*   **When** the user initiates a new deployment or clicks "Restart Application",
*   **Then** the system shall fetch the encrypted keys from the database, decrypt them using the server's master key in memory, and pass them as secure environment variables to the Docker runtime configuration,
*   **And** verify that the keys are not visible in any log files or public metadata configurations.

### Scenario 2.6: Container Creation & Health Checks (Happy Path & Failure)
*   **Given** a React static app is successfully compiled into a Docker image,
*   **When** the deployment engine provisions a new container on an Ubuntu React node and applies Traefik labels,
*   **Then** the container startup routine shall initiate a health check loop (performing HTTP GET requests to `/` or a user-defined path every 5 seconds),
*   **And** once the container returns a `200 OK` response 3 consecutive times, it shall mark the container health status as `HEALTHY`,
*   **And** update the Traefik router to direct public traffic to it.
*   **Given** the container crashes on startup or fails health checks (e.g., returns `500 Internal Server Error` or times out),
*   **When** the startup threshold of 60 seconds is reached,
*   **Then** the deployment engine shall mark the run as `FAILED`, terminate the unhealthy container, prevent the proxy routing update, and retain the previous healthy container.

### Scenario 2.7: Reverse Proxy Routing & Zero-Downtime Swaps (Happy Path)
*   **Given** a new version of an app has passed health checks and is ready to go live,
*   **When** the Traefik reverse proxy receives dynamic service routing configurations from the provider API,
*   **Then** Traefik shall perform a zero-downtime hot-swap, mapping incoming domain requests to the new container's IP/port,
*   **And** it shall keep the old container running for a grace period of 30 seconds to allow inflight requests to complete before clean termination.

### Scenario 2.8: SSL Auto-Issuance (Happy Path & Failure)
*   **Given** a user has mapped a custom domain (e.g., `myapp.com`) to the ITBengal React server's IP via DNS,
*   **When** they trigger the SSL configuration on the dashboard,
*   **Then** the system shall request a Let's Encrypt certificate using the ACME HTTP-01 challenge, serving the challenge token via Traefik,
*   **And** once verified, install the certificate, enabling HTTPS access with auto-renewal cron tasks enabled.
*   **Given** the custom domain's DNS is not yet propagating to the ITBengal server IP,
*   **When** the system runs the pre-flight checks or Let's Encrypt attempts validation,
*   **Then** the ACME request shall fail, and the system shall place the request into a retry queue, displaying an alert: "DNS propagation pending. SSL will be generated automatically once DNS points to our server."

### Scenario 2.9: Instant Deployment Rollback (Happy Path)
*   **Given** a project has multiple historical deployments marked as successful in the database,
*   **When** the user clicks "Rollback" on version `v2` while `v3` is active,
*   **Then** the deployment engine shall query the Docker registry for the `v2` image, initiate a container instance of `v2`, execute health checks,
*   **And** update Traefik routes to point to the `v2` container within 5 seconds, deprecating `v3` without dropping any active user connections.

### Scenario 2.10: Custom Domain Mapping & DNS Verification (Happy Path & Failure)
*   **Given** a user is configuring a custom domain in their app dashboard,
*   **When** they enter `blog.mycompany.com` and click "Verify Domain",
*   **Then** the platform must perform a server-side dig query checking the CNAME record of `blog.mycompany.com` against the target `domains.itbengal.com`,
*   **And** if verified, update the proxy routes and return a success message.
*   **Given** the domain resolves to an incorrect destination,
*   **When** the verification is run,
*   **Then** the platform shall display: "CNAME records check failed. Ensure blog.mycompany.com points to domains.itbengal.com."

### Scenario 2.11: Real-time Build & Container Log Streaming (Happy Path)
*   **Given** a build is in progress or a container is running,
*   **When** the user opens the logs tab on the dashboard,
*   **Then** the client shall open a secure WebSocket connection to `/api/projects/:id/logs`,
*   **And** the platform's log aggregator (Loki) shall stream stdout/stderr lines continuously to the browser, displaying them chronologically in a terminal emulation window.

---

## 3. Managed WordPress Hosting

### Scenario 3.1: One-Click Managed WordPress Installation (Happy Path)
*   **Given** a user has purchased a WordPress hosting plan,
*   **When** they input the Site Title, choose the PHP version (e.g., `8.2`), set the admin username and password, and click "Install WordPress",
*   **Then** the platform's orchestrator shall select an available WordPress server node,
*   **And** create an isolated PHP-FPM pool configured under a dedicated system user (preventing directory traversal between customers),
*   **And** create a database, user, and complex password in MariaDB,
*   **And** fetch the latest WordPress core files, configure `wp-config.php` with database credentials, and trigger a WP-CLI command to complete the installation,
*   **And** display a success message along with the administration login link.

### Scenario 3.2: One-Click Installation Failures (Exception Path - Node Unreachable)
*   **Given** the selected WordPress node becomes unreachable or run out of disk space during installation,
*   **When** the installation command is triggered,
*   **Then** the orchestrator shall intercept the failure, terminate any partially created database or files on the node,
*   **And** retry the operation on an alternate healthy node,
*   **And** if all retries fail, mark the hosting service as `PROVISION_FAILED` and notify the user: "Installation failed due to infrastructure timeout. Our engineers have been alerted."

### Scenario 3.3: Automated Backups (Happy Path)
*   **Given** a WordPress site is active,
*   **When** the daily cron scheduler triggers the backup service at 02:00 UTC,
*   **Then** the backup worker shall lock the database, run `mysqldump` to export the database to a `.sql` file, compress the entire `/var/www/vhosts/site` directory into a `.tar.gz` archive,
*   **And** encrypt the final archive using AES-256-CBC, upload it to the secure off-site object storage server, and log the success state in the database.

### Scenario 3.4: Manual Backup Restoration (Happy Path & Failure)
*   **Given** a user has a list of historical backups on their control panel,
*   **When** they select a backup date and click "Restore Site", confirming the warning that all current data will be overwritten,
*   **Then** the system shall place the site into maintenance mode, download the archive from object storage, extract the files back to the site directory, import the database SQL, run permission checks on the directory, and remove maintenance mode.
*   **Given** the database backup file is corrupted or the process terminates prematurely,
*   **When** the restore command fails,
*   **Then** the system shall rollback to the pre-restore backup snapshot automatically taken before starting, restore the live site, and alert the user: "Restoration failed. Site rolled back to previous state."

### Scenario 3.5: Staging Site Creation & Directory Sync (Happy Path)
*   **Given** an active production WordPress site,
*   **When** the user clicks "Create Staging Site",
*   **Then** the platform shall create a staging subdomain directory,
*   **And** clone the production database structure and content,
*   **And** copy the wp-content files to the staging directory,
*   **And** execute `wp search-replace` via WP-CLI to rewrite all production URLs (`https://mysite.com`) to staging URLs (`https://staging.mysite.com`),
*   **And** provision access credentials to the staging site dashboard.

### Scenario 3.6: Staging-to-Production Push (Happy Path & Failure)
*   **Given** a user has updated themes and plugins on their staging site and wants to push changes,
*   **When** they click "Push Staging to Production", selecting "Database and Files" sync,
*   **Then** the platform shall lock the production site, create a recovery snapshot, copy the staging files over the production folders, run database merge scripts, and run `wp search-replace` to map staging domains back to production domains.
*   **Given** the production database is locked or writing fails,
*   **When** pushing staging changes,
*   **Then** the system shall abort, execute restoration from the recovery snapshot within 60 seconds, and report: "Staging push failed. Production site restored to prevent downtime."

### Scenario 3.7: Automated Malware Scanning (Happy Path & Threat Found)
*   **Given** a weekly scheduled malware scan task is configured,
*   **When** the scan engine (ClamAV with custom php-malware signatures) scans the WordPress directory,
*   **Then** it shall compile a scan report.
*   **Given** a malicious payload (e.g., a webshell) is detected in `wp-content/uploads/malicious.php`,
*   **When** the scan completes,
*   **Then** the scanner shall quarantine the file by moving it out of the public folder, set permission to `000`, add an entry to the user's security dashboard, and send an email alert to the site owner detailing the threat.

### Scenario 3.8: Core & Plugin Auto-Updates (Happy Path & Rollback)
*   **Given** a user has enabled "Auto-Update WordPress Core",
*   **When** a new minor version of WordPress is released,
*   **Then** the system shall execute an automatic snapshot, run `wp core update` via WP-CLI, and trigger a headless HTTP check on the homepage.
*   **Given** the auto-update breaks the site (causing a HTTP 500 error),
*   **When** the headless crawler detects the error,
*   **Then** the update manager shall immediately restore the site from the snapshot, disable auto-updates temporarily, and send an email notification: "WordPress auto-update failed and was rolled back."

---

## 4. Domain & DNS Management

### Scenario 4.1: Openprovider Domain Availability Check (Happy Path & Timeout)
*   **Given** a user is searching for a domain name,
*   **When** they input `mybusiness.com.bd` on the Domain search page and click "Search",
*   **Then** the system shall call the Openprovider API to check availability and retrieve pricing.
*   **Given** the Openprovider API is down or experiences latency exceeding 5 seconds,
*   **When** the search is run,
*   **Then** the backend shall fall back to a local TLD status cache, or return a `504 Gateway Timeout` with a user-friendly error message: "Domain registrar check timed out. Please try again."

### Scenario 4.2: Domain Registration (Happy Path & Insufficient Funds)
*   **Given** a domain is available and the user completes checkout,
*   **When** the system submits the registration payload (including validated WHOIS contact handles) to the Openprovider API,
*   **Then** the registration shall be processed, and the domain status updated to `ACTIVE` in the user's account.
*   **Given** the platform's Openprovider registrar deposit balance is insufficient to register the domain,
*   **When** the registration command is executed,
*   **Then** the API shall throw an execution error, place the transaction in a `PENDING_MANUAL_REVIEW` queue for admin alert, refund the user's charge, and show: "Registration delayed. Our team is finalizing your domain setup."

### Scenario 4.3: Domain Transfer-In & Authorization (Happy Path & Failure)
*   **Given** a user wants to transfer a domain to ITBengal,
*   **When** they enter the domain and the EPP Authorization code, and submit the request,
*   **Then** the system shall initiate the transfer command via the Openprovider API.
*   **Given** the EPP code is incorrect or the domain is locked at the current registrar,
*   **When** the API returns a transfer rejection,
*   **Then** the system shall update the transfer status to `FAILED` and notify the user: "Transfer failed: Invalid EPP code or domain locked. Contact your current registrar."

### Scenario 4.4: Domain Renewal (Happy Path & Grace Period)
*   **Given** an active domain is within 30 days of expiration,
*   **When** the user clicks "Renew Domain" or the auto-renew cron triggers a successful billing charge,
*   **Then** the system shall call the Openprovider renewal API, extend the expiration date by the purchased years, and issue an updated invoice.
*   **Given** the domain has expired and is inside the 30-day grace period,
*   **When** the user renews it,
*   **Then** the system shall charge the standard renewal fee, restore the domain services via Openprovider, and update the DNS records.

### Scenario 4.5: WHOIS Privacy Toggle (Happy Path)
*   **Given** a user owns a domain registered through ITBengal,
*   **When** they toggle the "WHOIS Privacy" switch to `ON` in the Domain Settings,
*   **Then** the system shall call the Openprovider API to enable private registration data masking (replacing customer name, email, and phone with proxy registrar info), and update the dashboard indicator.

### Scenario 4.6: DNS Zone Editor (A, AAAA records add/edit/delete - Happy Path)
*   **Given** a user is in the DNS Zone Editor for their domain,
*   **When** they add an `A` record for `@` pointing to `103.120.45.10` with a TTL of `3600` and click "Save",
*   **Then** the platform shall validate that the IP address format matches IPv4 specifications, submit the record update to Openprovider Nameservers, and display the new record in the zone list.
*   **Given** the user inputs an invalid IP format (e.g., `999.999.999.999`),
*   **When** they click "Save",
*   **Then** the system shall halt the submission and display: "Invalid IPv4 address format."

### Scenario 4.7: DNS Zone Editor (CNAME, MX records validation - Happy Path)
*   **Given** a user adds a CNAME record,
*   **When** they enter a alias host `www` pointing to the target `myapp.itbengal.com` and click "Save",
*   **Then** the system shall check that no existing `A` record conflicts with the alias, and save.
*   **Given** a user adds an `MX` record,
*   **When** they provide a mail server target `mail.mycompany.com` and a priority value (e.g., `10`),
*   **Then** the system shall validate that the priority is an integer between `0` and `65535` and save the record.

### Scenario 4.8: DNS Zone Editor (TXT, SRV, NS records - Happy Path)
*   **Given** a user edits TXT records for SPF/DKIM verification,
*   **When** they input the record content (e.g., `v=spf1 include:mail.com ~all`),
*   **Then** the system shall accept quotes or automatically wrap the content in quotes before sending to the Nameservers.
*   **Given** a user modifies `SRV` records,
*   **When** they specify target, priority, weight, and port fields,
*   **Then** the system shall check that all fields contain valid integer values and save.

---

## 5. Billing & Subscription Management

### Scenario 5.1: Plan Tier Limits Enforcement (Happy Path & Over-limit Block)
*   **Given** a client is on the "Starter" React Hosting plan (limited to 3 projects and 10 build minutes/month),
*   **When** they attempt to create a 4th project or run a build when their build minutes are exhausted,
*   **Then** the system shall block the action, display an overlay: "Plan Limit Reached", and redirect them to the subscription upgrade page.

### Scenario 5.2: Coupon & Promo Code Validation (Happy Path & Failures)
*   **Given** a user is on the checkout page,
*   **When** they type `BENGAL20` (a 20% discount coupon valid for first-time buyers on professional plans),
*   **Then** the system shall run validation (expiry, plan constraint, usage limit), apply the 20% discount to the cart total, and display the new balance.
*   **Given** the user inputs an expired coupon or a coupon restricted to a different tier,
*   **When** they click "Apply",
*   **Then** the system shall reject the coupon, retain the original total, and display: "Promo code is invalid or has expired."

### Scenario 5.3: bKash Checkout Flow (Happy Path & Verification Failures)
*   **Given** a user selects "bKash" for their subscription upgrade payment,
*   **When** they click "Pay with bKash", the system initializes the bKash payment gateway overlay, prompts for their bKash wallet number, sends a verification OTP, and asks for their PIN,
*   **Then** on successful validation, bKash shall charge the wallet, trigger our webhook, update the subscription status to `ACTIVE`, and redirect the user to a receipt page.
*   **Given** the user enters an incorrect OTP or PIN, or has insufficient wallet balance,
*   **When** the gateway returns a failure code,
*   **Then** the system shall close the gateway overlay, restore the cart, and display: "Payment failed: Insufficient balance or incorrect verification details."

### Scenario 5.4: Nagad Checkout Flow (Happy Path & Cancellation)
*   **Given** a user chooses "Nagad" as their checkout option,
*   **When** they are redirected to the Nagad portal, enter their details, and finalize the transfer,
*   **Then** the system receives the API callback from Nagad, verifies the signature, and updates the payment transaction to `PAID`.
*   **Given** the user cancels the payment at the Nagad gateway screen,
*   **When** they click "Cancel Payment",
*   **Then** the gateway redirects back to ITBengal, the transaction is marked as `CANCELLED`, and the user is returned to the checkout screen.

### Scenario 5.5: Stripe Credit Card Capture & 3D Secure (Happy Path & SCA Decline)
*   **Given** an international customer is using a credit card,
*   **When** they enter their details into the Stripe Elements form and click "Pay", causing Stripe to trigger a 3D Secure verification window,
*   **Then** once the user completes their bank's OTP check, Stripe shall charge the card, the ITBengal backend shall verify the payment intent, and activate the subscription.
*   **Given** the card is declined for insufficient funds or SCA fails,
*   **When** Stripe returns an error code,
*   **Then** the checkout screen shall show: "Payment Declined: Please check your card details or try a different card."

### Scenario 5.6: Subscription Renewals & Grace Periods (Happy Path & Suspension)
*   **Given** an active subscription is due for renewal,
*   **When** the cron scheduler attempts to charge the stored payment method 3 days before expiry, and the payment succeeds,
*   **Then** the subscription expiration date is extended by one cycle.
*   **Given** the payment charge fails,
*   **When** the system retries charging daily,
*   **Then** it shall send dunning warning emails to the user, and if the payment is not resolved by the 5th day of the grace period, suspend the hosting containers and mark the subscription as `SUSPENDED`.

### Scenario 5.7: Invoice PDF Generation (Happy Path)
*   **Given** a payment transaction is successfully marked as `PAID`,
*   **When** the billing worker is triggered,
*   **Then** it shall generate a PDF invoice containing the ITBengal company header, customer organization details, invoice number, line items (with BDT/USD breakdown), tax calculations, and a "Paid" watermark,
*   **And** store this PDF on the secure backup server while emailing a copy to the billing contact.

### Scenario 5.8: Refund Processing & Adjustments (Happy Path)
*   **Given** an administrator triggers a refund request for an active invoice,
*   **When** they input the refund amount and reason and click "Approve Refund",
*   **Then** the system shall execute the refund API call to the respective payment gateway (Stripe/bKash/Nagad), update the invoice status to `REFUNDED` or `PARTIALLY_REFUNDED`, and deduct the active subscription limits from the organization.

---

## 6. Customer Dashboard Screens

Here are the Acceptance Criteria for interactions and edge cases on all 24 customer dashboard screens.

### Screen 6.1: Dashboard Overview / Main Portal
*   **Given** a logged-in user is on the Dashboard Overview screen,
*   **When** the screen loads,
*   **Then** the UI shall retrieve and display aggregate metrics: total number of active projects, active domains, open support tickets, billing alerts, and a summary list of recent deployments.
*   **Given** the API service is slow or unresponsive,
*   **When** the dashboard overview screen loads,
*   **Then** the UI shall display skeleton loading states for each component and show a reconnecting toast if the fetch fails.

### Screen 6.2: Projects List Screen
*   **Given** a user is viewing their Projects List screen,
*   **When** they use the search bar or filter by platform type (React vs. WordPress) or status (Active, Paused, Building),
*   **Then** the dashboard shall instantly filter the matching cards without a full-page reload, displaying deployment badges for each.
*   **Given** the user has no projects,
*   **When** the list loads,
*   **Then** the UI shall render an empty-state illustration with a clear "Create Your First Project" call-to-action button.

### Screen 6.3: React App Creation / Git Import Wizard
*   **Given** a user is on the Git Import Wizard,
*   **When** they select a connected repository, choose the branch, enter build settings (install command, build command, output directory), and click "Deploy Project",
*   **Then** the UI shall disable the form inputs, show a spinner, and redirect the user to the live deployment log screen.
*   **Given** the input fields contain invalid characters or missing parameters,
*   **When** the user clicks "Deploy Project",
*   **Then** the form shall highlight the fields with validation warnings and prevent submission.

### Screen 6.4: React App Deployments Dashboard
*   **Given** a user is viewing the Deployments dashboard for a specific React project,
*   **When** they view the page,
*   **Then** the screen shall display a paginated list of all past builds, showing commit message, author, build duration, and a status badge (Success, Failed, Canceled).
*   **Given** the WebSocket connection drops,
*   **When** a new deployment changes state in the backend,
*   **Then** the UI shall fall back to polling the API every 10 seconds to keep the build status indicators updated.

### Screen 6.5: React App Build Detail & Console Logs Viewer
*   **Given** a user is on the Build Detail screen for an active deployment,
*   **When** the build is running,
*   **Then** the screen shall render a terminal console interface that streams the logs line-by-line in real-time, autoscrolling to the bottom.
*   **Given** a build fails,
*   **When** the log streaming ends,
*   **Then** the UI shall stop autoscrolling, highlight the failure line in red, and display a "Download Build Logs" button.

### Screen 6.6: React App Environment Variables Settings
*   **Given** a user is editing their React application settings,
*   **When** they input a key and value, toggle the encrypt flag, and click "Add Environment Variable",
*   **Then** the variable shall be added to the list showing only the key name and masked values (e.g., `••••••••`), sending the payload encrypted to the backend.
*   **Given** the user attempts to add a duplicate key name,
*   **When** they click "Add",
*   **Then** the system shall display an inline error: "Variable key already exists in this project."

### Screen 6.7: React App Custom Domains Management Screen
*   **Given** a user is managing custom domains for their React app,
*   **When** they add a new domain `www.mybrand.com`,
*   **Then** the screen shall display the configuration settings (e.g., pointing A records or CNAME records) and a "Verify Configuration" button.
*   **Given** the DNS settings have not propagated,
*   **When** the user clicks "Verify Configuration",
*   **Then** the UI shall display a detailed warning listing the expected vs. detected records, and outline step-by-step instructions.

### Screen 6.8: WordPress Site Setup/Creation Wizard
*   **Given** a user is on the WordPress Installation Wizard,
*   **When** they select their package, choose their PHP version, enter admin details, and click "Install",
*   **Then** the UI shall transition to a full-screen installation progress page, showing a step-by-step checklist (e.g., "Provisioning node", "Configuring PHP", "Installing database", "Finalizing setup") updated dynamically via WebSockets.

### Screen 6.9: WordPress Site Management Dashboard
*   **Given** a user is looking at a specific WordPress site dashboard,
*   **When** the screen loads,
*   **Then** they shall see card modules showing SFTP connection details, MySQL database credentials, site status controls (Restart, Stop, Maintenance Mode), and quick access buttons to WP Admin and File Manager.
*   **Given** the site status changes to offline,
*   **When** the dashboard refreshes,
*   **Then** the control buttons shall update to show only "Start Site", disabling options like "WP Admin Login".

### Screen 6.10: WordPress DB & PHP Settings Screen
*   **Given** a user is on the Database & PHP settings panel,
*   **When** they select a different PHP version from the dropdown (e.g., upgrade from `8.1` to `8.2`) and click "Save Changes",
*   **Then** the dashboard shall initiate a backend node command, show a loading modal: "Updating PHP version...", and refresh with the new version confirmation once the health check passes.

### Screen 6.11: WordPress Backups & Restore Control Panel
*   **Given** a user is in the Backups screen,
*   **When** they click "Create Manual Backup",
*   **Then** the system shall display a naming dialog, and on confirm, trigger the backup process, showing a progress percentage on a progress bar.
*   **Given** a restore action is triggered,
*   **When** the user clicks "Restore",
*   **Then** the UI must force the user to type the word `RESTORE` to confirm the action, preventing accidental data loss.

### Screen 6.12: WordPress Staging & Sync Manager
*   **Given** a user is on the Staging Management screen,
*   **When** they click "Sync Staging to Production",
*   **Then** a modal shall ask which elements to sync (Files only, Database only, or both), and show a summary list of file modifications.
*   **Given** there is a pending schema change detected,
*   **When** they confirm the sync,
*   **Then** the UI shall show a warning flag about potential database conflict before starting.

### Screen 6.13: Domain Search, Registration & List Screen
*   **Given** a user is on the Domain Management screen,
*   **When** they search for a domain `bengalweb.net`,
*   **Then** the list shall update to show the search results, availability indicator, and an "Add to Cart" button for purchase.
*   **Given** the domain is taken,
*   **When** the search results render,
*   **Then** the screen shall display "Unavailable" and present a list of alternative extensions (e.g., `.com`, `.org`, `.com.bd`) with their prices.

### Screen 6.14: DNS Zone Editor Screen
*   **Given** a user is editing the DNS zone records for their domain,
*   **When** they click "Add DNS Record", select `MX`, and fill in the priority and exchange value,
*   **Then** the validation engine shall check formatting, and once saved, add the new record row to the table with an option to edit or delete.

### Screen 6.15: SSL Certificate Manager Screen
*   **Given** a user is managing SSL certificates,
*   **When** they choose to upload a custom SSL certificate,
*   **Then** they must upload the public certificate block and private key block into text areas, causing the front-end parser to check for standard PEM header formats.
*   **Given** the certificate and key do not match,
*   **When** they click "Install Certificate",
*   **Then** the screen shall display: "Invalid certificate pair: Private key does not match the certificate."

### Screen 6.16: Billing Overview & Payment Methods Screen
*   **Given** a user is on the Billing settings page,
*   **When** they add a new credit card or link a mobile payment account,
*   **Then** the system shall securely store the billing profile token, and render the card in the list of payment options showing card type, last 4 digits, and expiration date.

### Screen 6.17: Subscriptions & Upgrades Screen
*   **Given** a user is on the subscription settings screen,
*   **When** they click "Change Plan",
*   **Then** the system shall display the plan matrix highlighting their current tier, and show a cost calculator mapping prorated balances if they choose to upgrade or downgrade mid-cycle.

### Screen 6.18: Invoice History & Details View
*   **Given** a user is looking at the invoices list,
*   **When** they click on any historical invoice row,
*   **Then** a clean side-panel drawer shall open displaying the full invoice line items, tax details, payment date, transaction ID, and a "Download PDF" button.

### Screen 6.19: Profile & Security Configuration Screen
*   **Given** a user is updating their profile,
*   **When** they change their contact information and click "Save",
*   **Then** the page shall perform field validation and display a success toast.
*   **Given** they want to modify their password,
*   **When** they fill in the current password, new password, and verify password fields,
*   **Then** the system shall enforce password complexity rules and clear the inputs on success.

### Screen 6.20: API Keys & Token Manager Screen
*   **Given** a user is on the API keys screen,
*   **When** they generate a new token,
*   **Then** a modal overlay must display the generated token and a clear warning: "This key is shown only once. Please store it securely."

### Screen 6.21: Support Ticket System Screen
*   **Given** a user is submitting a support request,
*   **When** they enter a subject, category, description, and drag-and-drop a screenshot attachment,
*   **Then** the system shall validate that the attachment is under 5MB (PNG/JPG), create the ticket, and render the discussion thread view.

### Screen 6.22: Organizations & Teams Panel
*   **Given** a user is viewing their organization settings,
*   **When** they enter an email address, assign a role (Owner, Admin, Developer), and click "Invite Member",
*   **Then** the UI shall add the email to the pending invitation list, and trigger an invitation email.

### Screen 6.23: Usage Analytics & Resource Charts Screen
*   **Given** a user is monitoring app resource consumption,
*   **When** they select a project and a time-range filter (e.g., 24 hours, 7 days),
*   **Then** the page shall render dynamic SVG/Canvas charts plotting CPU usage, RAM utilization, bandwidth, and HTTP request count over time.

### Screen 6.24: Notification Center Preferences Screen
*   **Given** a user is modifying notification preferences,
*   **When** they toggle checkboxes for email newsletters, critical resource limits, billing renewals, and security alerts, and click "Save",
*   **Then** the system shall save the state to the database and display a "Preferences updated" toast.

---

## 7. Admin Dashboard Portal

### Scenario 7.1: Customer Management & Details View (Happy Path & Actions)
*   **Given** a platform administrator is logged in and viewing the Admin Customer Management panel,
*   **When** they search for a customer name or email,
*   **Then** the system shall display a list of matching users, and clicking on a customer row shall open a comprehensive detail page showing their registered info, active plans, active hosting nodes, organization hierarchy, billing logs, and security settings.
*   **Given** the admin needs to suspend a violating account,
*   **When** they click "Suspend Account", enter a suspension reason, and confirm,
*   **Then** the system shall change the user status to `SUSPENDED`, block their API access, pause all their containers, and record the action in the security audit log.

### Scenario 7.2: Server Health Monitoring & Node Stats (Happy Path)
*   **Given** an admin is viewing the Server Health monitoring screen,
*   **When** the dashboard loads,
*   **Then** it shall render real-time telemetry from Prometheus/Loki showing aggregated node metrics (CPU, memory, disk usage, active container count, networking IOPS) for both React nodes and WordPress nodes.
*   **Given** a node's resource utilization exceeds a warning threshold (e.g., 85% RAM),
*   **When** the page refreshes,
*   **Then** the UI shall highlight the node in orange or red and trigger a dashboard warning alert.

### Scenario 7.3: Manual Node Draining & Eviction (Happy Path & Rollback)
*   **Given** an admin needs to perform maintenance on a React Server Node (e.g., `react-node-2`),
*   **When** they click "Start Node Drain",
*   **Then** the orchestration engine shall mark `react-node-2` status as `DRAINING` (preventing new container scheduling),
*   **And** it shall locate all running containers on `react-node-2`, spin up duplicate instances on other healthy React nodes (e.g., `react-node-3`), verify their health checks, update the reverse proxy routing rules, and terminate the old container instances on `react-node-2`.
*   **Given** the target nodes run out of capacity or fail health checks during the migration process,
*   **When** the drain is running,
*   **Then** the orchestrator shall abort the operation, roll back the scheduling state, restore routing to the containers on `react-node-2`, and alert the administrator: "Draining aborted: Target node capacity limit reached."

### Scenario 7.4: Support Ticket Management & Resolution (Happy Path)
*   **Given** an administrator is in the Admin Support Desk portal,
*   **When** they filter by "Open" or "Urgent" status,
*   **Then** the screen shall display a queue of support tickets.
*   **Given** they select a ticket, type a resolution reply in the markdown-capable editor, select a category update (e.g., change from "Billing" to "Technical"), and click "Submit Reply and Close Ticket",
*   **When** the backend processes the update,
*   **Then** it shall change the ticket status to `RESOLVED`, add the admin response to the discussion thread, send an email notification to the customer containing the reply, and record the ticket action.

### Scenario 7.5: Announcement Dispatch (Happy Path & Filtering)
*   **Given** an admin needs to broadcast system maintenance notifications,
*   **When** they click "Create Announcement", type the announcement title and message content, select target audience filters (e.g., "All WordPress Hosting Users", "All Professional Plan Users"), and click "Publish",
*   **Then** the system shall create a persistent notice in the DB, render a banner on the matching customer dashboards, and enqueue a bulk email dispatch job via BullMQ to send the notice to all target users.

### Scenario 7.6: Audit Logs Retrieval & Filter (Happy Path)
*   **Given** an admin needs to audit recent actions,
*   **When** they navigate to the Audit Logs panel,
*   **Then** the screen shall display a table of all system activities, showing Timestamp, Actor ID, Actor IP address, Action Category (e.g., Auth, Billing, Deploy), Description, and a verification checksum.
*   **Given** the admin inputs filter queries (e.g., checking only `Auth` failures from IP `203.0.113.50` within the last 48 hours),
*   **When** they click "Apply Filter",
*   **Then** the table shall immediately filter records and display an option to "Export CSV".

---

## 8. Summary of Given/When/Then Scenarios & Edge Cases

The following tables summarize the scenarios covered in this specification to ensure 100% test coverage during verification.

### Core System Scenarios

| Module | Scenario Name | Test Target | Key Edge/Error Case Handled |
| :--- | :--- | :--- | :--- |
| **Authentication** | 1.1: Sign Up Success | Account Creation | Email delivery check |
| | 1.2: Sign Up Validation | Validation rules | Duplication/Format error handling |
| | 1.3: Token Verification | Email activation | DB status change to `ACTIVE` |
| | 1.4: Token Expiry | Link validity | Expired token renewal flow |
| | 1.5: Login & Cooldown | Login access | 5x lock constraint and lockout period |
| | 1.6: 2FA Enrollment | TOTP Setup | Verification of backup codes |
| | 1.7: 2FA Verification | Login security | Lost authenticator recovery code check |
| | 1.8: Session Expiry | Security cleanup | Inactivity check & automatic logout |
| | 1.9: API Key Creation | Key Management | SHA-256 key hashing & storage |
| | 1.10: API Key Revocation | Security control | Instant route invalidation & denial |
| **React Hosting** | 2.1: Git OAuth | Repo integration | Handshake failure |
| | 2.2: Package Resolving | Build pipeline | Auto-detection (npm/yarn/pnpm/bun) |
| | 2.3: Build Compiling | Output creation | Failure log extraction and propagation |
| | 2.4: ZIP Deployment | Manual upload | Zip bomb / size (>100MB) checks |
| | 2.5: Env Variables | Secrets injection | AES-256-GCM decryption at runtime |
| | 2.6: Health Checks | Runtime stability | Startup crash, retry, rollback route |
| | 2.7: Proxy Routing | Routing swap | Zero-downtime Blue-Green rollout |
| | 2.8: SSL Generation | HTTPS security | DNS check delay queue |
| | 2.9: Rollbacks | Fast revert | Old image restoration under 5 seconds |
| | 2.10: Custom Domains | DNS configuration | CNAME checking validation |
| | 2.11: Log Streaming | Streaming | WebSocket failure / backup recovery |
| **WordPress** | 3.1: WP Setup | Core installation | Database and PHP-FPM configuration |
| | 3.2: WP Setup Failures | Node failures | Node isolation & failover recovery |
| | 3.3: Backups | Storage backup | DB and directory encryption (AES-256) |
| | 3.4: Restore | Disaster recovery | SQL/zip corruption detection & revert |
| | 3.5: Staging | Testing space | URL rewrite via WP-CLI |
| | 3.6: Push to Prod | Update release | Lockout, backup snapshot, rollback |
| | 3.7: Malware Scan | Security check | ClamAV threat quarantine |
| | 3.8: Core Updates | Auto maintenance | Crawler validation & automatic revert |
| **Domain & DNS** | 4.1: Availability | Registrar check | Openprovider API downtime |
| | 4.2: Registration | Registration | Insufficient platform registrar account deposit |
| | 4.3: Transfer-In | Domain migration | Invalid EPP/locked status |
| | 4.4: Renewal | Billing renewal | Grace period management |
| | 4.5: WHOIS Privacy | Privacy protection | Data masking proxy activation |
| | 4.6: DNS Records (A/AAAA)| Zone management | Invalid IP address format checks |
| | 4.7: DNS (CNAME/MX) | Record conflicts | MX Priority checks |
| | 4.8: DNS (TXT/SRV/NS) | Records syntax | Auto-quotes wrap |
| **Billing** | 5.1: Plan Limits | Restriction check | Build minute limit enforcement |
| | 5.2: Coupons | Discount check | Expired code checkout rejection |
| | 5.3: bKash Gateway | Mobile payment | OTP / PIN failure logic |
| | 5.4: Nagad Checkout | Gateway integration | Cancel checkout redirects |
| | 5.5: Stripe Capture | International | 3D Secure SCA challenge failure |
| | 5.6: Subscriptions | Automatic renewal | Dunning period suspension |
| | 5.7: Invoices | Billing records | Dual BDT/USD tax configurations |
| | 5.8: Refunds | Accounting | Ledger correction & limits reduction |

### Dashboard & Admin Panel Scenarios

| Module | Screen / Action | Test Target | Key Edge/Error Case Handled |
| :--- | :--- | :--- | :--- |
| **Dashboard** | 6.1: Overview | Aggregate stats | Dashboard API timeouts |
| | 6.2: Projects List | Repo filter | Empty state display |
| | 6.3: Git Wizard | Repo clone parameters | Form validation check |
| | 6.4: Deployments Dashboard| Build history | WebSocket disconnect polling fallback |
| | 6.5: Console logs | Log terminal | Build logs storage & retrieval |
| | 6.6: Env Variables View | Variables control | Duplicate keys detection |
| | 6.7: Custom Domains screen| Mapping verification | Propagation status instructions |
| | 6.8: WordPress Wizard | Installation wizard | Setup progress bar update checks |
| | 6.9: WordPress Manager | Control buttons | PHP/DB credentials visibility |
| | 6.10: DB & PHP Settings | Version selector | Dynamic update loading panel |
| | 6.11: WP Backups screen | Restore confirmation | Force keyword string `RESTORE` check |
| | 6.12: WP Staging screen | Elements sync | Database schema merge conflicts |
| | 6.13: Domain Search | Cart checkout | Alternative domain name recommendations |
| | 6.14: DNS Zone screen | Record modal | Real-time zone record table updates |
| | 6.15: SSL Certificate | Upload form | Private key mismatch verification |
| | 6.16: Billing Overview | Cards/Wallets | Invalid token profile creation checks |
| | 6.17: Plan Upgrades | Downgrades check | Prorated charges estimation calculation |
| | 6.18: Invoices drawer | PDF download | Drawer reload on API latency |
| | 6.19: Profile details | Profile update | Passwords mismatch warning |
| | 6.20: Token Manager | Security keys | Masked view, copy to clipboard check |
| | 6.21: Support Ticket | Message editor | 5MB file uploads restriction |
| | 6.22: Organization Settings| Organization invites | Pending role changes confirmation |
| | 6.23: Usage Analytics | Charts plotting | Empty charts on zero data |
| | 6.24: Notification settings| Toggles list | Changes validation |
| **Admin Panel**| 7.1: Customers | Search & Suspend | User impersonation & account suspension |
| | 7.2: Server Monitor | Telemetry graphs | CPU/RAM thresholds warnings |
| | 7.3: Node Drain | Eviction | Migration timeout error checks |
| | 7.4: Support tickets | Resolution flow | Closed ticket email notification |
| | 7.5: Announcements | Message board | targeted filters warning banners |
| | 7.6: Audit logs | Filter logs | Export CSV timeout retry |

---

## 9. Quality Assurance Testing Protocols & Environment Settings

To ensure the execution of the acceptance criteria defined above matches production conditions, the QA and development teams must comply with the following system configuration states and testing protocols:

1.  **Test Environment Isolation**:
    *   All automated tests validating React container creation and WordPress node configurations must execute on designated sandbox servers distinct from the production load-balancing group.
    *   Database transactions initialized during billing workflows must execute against gateway test environments (Stripe Sandbox, bKash Sandbox, and Nagad Mock Service APIs).
2.  **Telemetry and Logging Verification**:
    *   For every Given-When-Then transaction marked with an audit log verification, the testing engine must verify that a valid log record containing the correct payload signature is present in PostgreSQL and searchable via the Admin Audit Log retrieval tool.
3.  **Security Penetration Standards**:
    *   No security token or raw API Key must ever be exposed in raw text format in either database tables or log outputs. Checks verifying these rules will run during the build and integration pipeline.

---

## 10. System Performance and SLA Acceptance Thresholds

The following performance benchmarks represent the minimum acceptable thresholds for acceptance sign-off. Any scenario that exceeds these bounds must be rejected.

*   **Authentication Service**:
    *   User JWT creation and session token issue: `< 200ms` under a concurrent load of 500 requests/second.
    *   Password hash verification (using bcrypt with 12 work factor iterations): `< 350ms`.
*   **React Hosting Engine**:
    *   Git event webhook processing to deployment trigger delay: `< 1.5s`.
    *   Docker image instantiation and reverse proxy registration (excluding build compilation time): `< 8.0s`.
    *   SSL certificate auto-issuance through HTTP-01 challenge: `< 12.0s`.
    *   Rollback switch execution time (dynamic Traefik reload): `< 3.0s`.
*   **WordPress Hosting Engine**:
    *   WordPress core deployment and PHP-FPM socket configuration: `< 45.0s`.
    *   Incremental automated backup archive creation (up to 5GB site size): `< 180.0s`.
    *   Site restoration execution time (up to 5GB site size): `< 300.0s`.
*   **Domain and DNS Operations**:
    *   Domain search availability check (via Openprovider): `< 1.2s`.
    *   Nameserver record changes replication status: `< 5.0s`.
*   **Dashboard Loading and Rendering**:
    *   Dashboard Overview metric load time: `< 800ms`.
    *   WebSocket real-time build log delivery delay: `< 150ms`.
    *   Interactive chart rendering time: `< 400ms`.

---

## 11. Security Audit Logs

The following activities must write an entry to the system audit logs. The audit log schema must match the specifications defined in `09-database-design.md`.

*   **Authentication Events**:
    *   User sign up, email verification, login success, login failure (with IP/agent details), password change, 2FA activation, 2FA deactivation, API Key creation, API Key revocation.
*   **Hosting Operations**:
    *   New deployment trigger, deployment compilation start/end, environment variable creation/update/deletion, custom domain mapping request/verification, site rollback trigger.
*   **WordPress Actions**:
    *   Managed WordPress setup completed, PHP version configuration changes, backup creation/download/restoration, staging environment deployment, staging-to-production sync, malware signature update/scan completion/threat detected.
*   **Billing Actions**:
    *   Payment gateway redirect, payment transaction confirmation, transaction failure, subscription tier updates, subscription suspensions, coupon validation/usage, refund requested/processed.
*   **Administrative Actions**:
    *   Account suspension/activation, node draining start/completion, node eviction abort, support ticket assignment/resolution, announcement dispatch/deletion.

---

## 12. Document Version Control & Approvals

| Version | Date | Description | Author | Approval Status |
| :--- | :--- | :--- | :--- | :--- |
| **1.0.0** | 2026-07-04 | Initial production-grade specification covering 100% scenarios, edge cases, performance SLA limits, and error recovery flows. | Senior Product Manager & Technical Writer | Approved for Development |
