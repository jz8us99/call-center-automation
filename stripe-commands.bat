@echo off
echo ===============================================
echo Stripe Local Development Setup Commands
echo ===============================================
echo.

echo 1. Login to Stripe CLI:
echo    stripe login
echo.

echo 2. Start webhook forwarding (run this in a separate terminal):
echo    stripe listen --forward-to http://localhost:19080/api/stripe/webhook
echo.

echo 3. Test webhook events:
echo    stripe trigger payment_intent.succeeded
echo    stripe trigger customer.subscription.created
echo.

echo 4. View Stripe Dashboard:
echo    start https://dashboard.stripe.com/test/dashboard
echo.

echo 5. View API Keys:
echo    start https://dashboard.stripe.com/test/apikeys
echo.

echo 6. View Products:
echo    start https://dashboard.stripe.com/test/products
echo.

pause