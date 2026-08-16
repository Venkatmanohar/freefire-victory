# FREEFIRE VICTORY — Full Source

## Run
1. Install Node.js 18+.
2. From the project root run `npm install`.
3. Run `npm start`.
4. Open:
   - Public website: http://localhost:3000/web
   - Admin: http://localhost:3000/admin
   - Player app interface: http://localhost:3000/app
   - Health: http://localhost:3000/api/health

## Important production work
This is a complete runnable demo/source foundation, not a guarantee of production readiness. Before handling real money:
- connect PostgreSQL using DATABASE_URL and transactional queries;
- integrate an approved payment provider and verify webhooks server-side;
- add authentication, OTP/email verification, sessions and role-based authorization;
- add rate limits, CSRF/security headers, validation, logging and backups;
- have payment/tax/contest rules reviewed for the target jurisdiction.


## Payment module
Payments are intentionally OFF by default:
`PAYMENTS_ENABLED=false`

When the merchant/payment account is ready:
1. Configure the real payment provider on the backend.
2. Add the provider credentials as server environment variables.
3. Configure and verify server-side webhooks/signatures.
4. Change `PAYMENTS_ENABLED=true`.
5. Test deposits and settlements before going live.

You do **not** need to remove the wallet, deposit, withdrawal or admin payment screens later. They are already part of the structure; payment processing stays disabled until enabled.
