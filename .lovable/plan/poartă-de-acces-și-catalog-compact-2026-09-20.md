# Poartă de acces și catalog compact

## Scop
Separarea paginii de acces de magazin și compactarea tuturor listelor repetitive de produse, fără schimbări în date, autentificare, coș, checkout sau administrare.

## Schimbări
- Înlocuiesc pagina `/` cu o poartă minimalistă, fără antet și subsol, care reutilizează formularul existent de autentificare și oferă acces de vizitator.
- Păstrez accesul de vizitator numai în fila curentă, îl refolosesc la reîmprospătare și redirecționez utilizatorii autentificați către `/magazin`.
- Protejez doar paginile comerciale cerute; paginile informative și juridice rămân publice.
- Brandul din magazin va duce la `/magazin`, iar deconectarea va elimina accesul autentificat și accesul de vizitator înainte de revenirea la `/`.
- Înlocuiesc cardul special pentru recomandări cu `ProductCard`, astfel încât catalogul, categoriile, căutarea și recomandările să folosească aceeași prezentare.
- Compactez imaginea și informațiile cardului și refac grila: 2 coloane pe mobilul utilizabil, apoi 3/4/5/6 coloane la pragurile solicitate, cu lățime maximă stabilă pentru carduri.

## Validare
- Verific accesul nou, persistența în aceeași filă, redirecționările și accesul direct la paginile informative.
- Verific autentificarea/înregistrarea fără a duplica logica existentă și verific revenirea la poartă după deconectare.
- Verific magazinul, catalogul, categoria, produsul, coșul și checkout-ul după acordarea accesului.
- Verific grilele la 375, 768, 1366, 1920 și 2560px: coloane, imagini complete, titluri pe două rânduri și lipsa depășirilor orizontale.

## Detalii tehnice
- Controlul de acces este doar o poartă de navigare în browser, nu un cont fals și nu înlocuiește autorizarea existentă pentru conturi sau administrare.
- Starea de vizitator folosește `sessionStorage`; rutele comerciale nu afișează conținut înainte de verificare.
- Nu se modifică baza de date, produsele, inventarul, imaginile, galeria paginii de produs sau fluxul de comandă.
