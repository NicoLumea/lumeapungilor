# Support widget backend boundary

The customer-support widget intentionally reuses the existing `contact_requests` flow. Messages
submitted by guests or signed-in customers are stored through `submitContactRequest` and appear in
the existing **Mesaje** screen available to employees and administrators.

The current backend is a single-message inbox, not a conversation backend:

- `contact_requests` stores one customer message and its status;
- staff can read a request and mark it resolved or reopen it;
- there is no message-thread table, staff-reply table, realtime subscription, or customer-facing
  reply endpoint on `main`.

This branch does not create a second, incompatible support schema. The widget keeps messages sent in
the current browser tab in `sessionStorage`, clearly tells customers that replies arrive by email,
and labels only its welcome and delivery confirmation as **Echipa Lumea Pungilor**.

True two-way replies inside the widget remain a backend dependency. When that backend is designed,
it should extend the existing inbox with one conversation identity, ordered messages, authenticated
customer ownership, a secure guest session, employee/admin policies, and a realtime or polling read
path. A Supabase migration must be reviewed and applied separately; Git/Lovable sync does not apply
migrations automatically.
