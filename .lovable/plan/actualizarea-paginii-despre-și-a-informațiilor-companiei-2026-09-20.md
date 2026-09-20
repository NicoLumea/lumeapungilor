# Actualizarea paginii Despre și a informațiilor companiei

## Implementare
- Înlocuiesc pagina `/despre` cu profilul editorial furnizat, folosind titluri semantice, liste, separatoare discrete și linkuri interne către catalog, categorii, livrare, ajutor și telefoane.
- Actualizez metadatele paginii Despre și adaug schema FAQPage cu exact cele șapte întrebări și răspunsuri afișate.
- Adaug pe `/magazin`, între categorii și produsele recomandate, introducerea compactă în două coloane și legătura către `/despre`.
- Înlocuiesc introducerea paginii Contact și setez descrierea exactă sub numele din subsol, păstrând datele companiei din sursa centralizată.
- Elimin orice referință existentă la BazarulOnline din cod, conținut configurabil și metadate, fără a introduce altă platformă.

## Verificare
- Confirm că nu mai există referințe BazarulOnline în proiect sau în conținutul publicat.
- Verific destinațiile linkurilor, concordanța dintre FAQ-ul vizibil și datele structurate, precum și păstrarea datelor legale existente.
- Testez `/despre`, `/magazin`, `/contact` și subsolul pe mobil și desktop, fără depășiri orizontale.
- Nu modific produsele, prețurile, stocurile, autentificarea, comenzile, checkout-ul sau administrarea.

## Detalii tehnice
- Folosesc rutele TanStack existente și componentele de buton/link deja disponibile.
- Păstrez Organization JSON-LD existent și adaug FAQPage numai în pagina Despre.
- Nu copiez date comerciale în surse multiple; informațiile legale și telefoanele rămân citite din înregistrarea centralizată a companiei.
