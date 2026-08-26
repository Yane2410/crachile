# CRA authentication architecture

The public CRA menu does not require customer accounts or Grok OAuth. Customer ordering is intentionally account-free and sends the order to WhatsApp without persisting a customer profile.

Administrative access must remain protected independently of public ordering. Any admin route/API must enforce its own authenticated authorization check before allowing product, pricing, ingredient, configuration, or other privileged mutations.

Grok OAuth credentials are therefore optional for the public deployment and must not be required merely to build or serve the public menu.
