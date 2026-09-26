# Controlul păstrării datelor de cont și activitate

Migrarea `20260926120000_admin_users_dashboard.sql` adaugă setarea privată
`account_activity_retention`. Valorile perioadelor sunt intenționat `null` până
când firma și consilierul juridic confirmă obligațiile aplicabile.

Înainte de configurarea unei ștergeri sau anonimizări automate, firma trebuie să
documenteze separat perioadele și justificarea pentru:

- conturi inactive și profiluri;
- momentele ultimei autentificări;
- coșuri autentificate salvate, dacă această funcție va fi introdusă;
- cereri de notificare privind revenirea în stoc;
- jurnale de securitate și audit;
- comenzi și documente care trebuie păstrate pentru obligații legale.

Istoricul comenzilor nu trebuie șters atunci când un cont este dezactivat.
Înregistrările din `audit_logs` sunt imuabile. Orice automatizare de retenție
trebuie implementată numai după aprobarea perioadelor de către companie și
revizuire juridică. Textul introdus în proiect pentru Politica de
confidențialitate este un proiect și necesită aceeași revizuire înainte de
publicare.
