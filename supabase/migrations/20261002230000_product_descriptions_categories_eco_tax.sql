-- Update only long product descriptions, bag category memberships, and the existing
-- eco-tax display flag. No prices, SEO fields, URLs, stock, or tax calculations change.
-- Generated from the reviewed 63-product copy; match products by immutable current slug.
-- Category labels in the UI: Pungi Plastic, Pungute Mici, Pungi cadou din plastic.
-- The small-bag rule uses ANY dimension under 30 cm; 30 itself does not qualify.
-- Courier bags/pouches keep their existing category assignments, but receive eco-tax=true.
-- Product 28's old description conflicts with its current name; confirm physical design
-- before applying, or exclude that one row until confirmed.
begin;

create temporary table _reviewed_product_content (
  slug text primary key,
  description text not null,
  kind text not null check (kind in ('other', 'courier', 'retail')),
  small boolean not null,
  gift boolean not null,
  constraint category_flags_only_for_retail check ((not small and not gift) or kind = 'retail')
) on commit drop;

insert into _reviewed_product_content (slug, description, kind, small, gift)
values
  ('folie-cu-bule-1-x-50m', 'Folie cu bule din polietilenă, pe rolă de 1 metru lățime și 50 de metri lungime.

Folia are o față netedă și una cu bule de aer. Bulele formează un strat de amortizare între obiect și ambalajul exterior, util mai ales când produsul poate fi zgâriat sau ciobit la manipulare. Lățimea de 1 metru permite înfășurarea unor obiecte mai late fără să alăturați două fâșii: tablouri, lămpi, rame sau cutii mari.

Se poate folosi pentru sticlă, ceramică, veselă, oglinzi, cadre și alte obiecte care au nevoie de protecție suplimentară. Pentru electronice, verificați și cerințele de ambalare ale producătorului; această folie nu este prezentată ca material antistatic. În cutie, bucățile tăiate pot umple spațiile libere, astfel încât obiectul ambalat să se miște cât mai puțin.

Folia se taie cu foarfeca sau cu un cutter, în funcție de dimensiunea produsului. Pentru obiectele cu colțuri sau muchii, lăsați material suficient și fixați învelirea înainte de a pune produsul în cutie. Dacă expedierea presupune umezeală sau șocuri puternice, folosiți și un ambalaj exterior potrivit; folia cu bule nu garantează singură protecția completă.

Se vinde la rolă întreagă, de 50 de metri.

Păstrați rola într-un loc curat și uscat, ferit de obiecte ascuțite sau de apăsare prelungită. Folia este transparentă, astfel încât produsul împachetat rămâne vizibil. Dacă ambalați obiecte înguste, comparați și rola de 0,5 metri: diferența de lățime poate face tăierea mai comodă.', 'other', false, false),
  ('folie-cu-bule-0-5-x-50m', 'Folie cu bule din polietilenă, pe rolă de 0,5 metri lățime și 50 de metri lungime.

Această rolă are jumătate din lățimea variantei de 1 metru. Este mai ușor de așezat în jurul unui obiect mic sau îngust, fără să fie nevoie să pliați o fâșie foarte lată. Desfășurați cât vă trebuie, tăiați și adaptați numărul de straturi la fragilitatea obiectului și la ambalajul exterior.

Potrivită pentru pahare, borcane, flacoane de cosmetice, bijuterii în cutie, piese de schimb, figurine și orice produs care intră în palmă.

Bulele oferă un strat de amortizare, însă protecția depinde de felul în care este împachetat produsul și de spațiul rămas în cutie. Așezați folia astfel încât obiectul să fie acoperit și fixați capetele înainte de transport. Pentru obiectele cu muchii ascuțite, verificați dacă este necesar și un colțar sau un ambalaj rigid.

Poate fi folosită împreună cu o pungă de curierat: înfășurați mai întâi obiectul, apoi alegeți o pungă în care să încapă fără să forțați închiderea. Pentru obiectele mai voluminoase, rola de 1 metru poate acoperi o suprafață mai mare dintr-o singură bucată.

Se vinde la rolă întreagă, de 50 de metri.

Lățimea de 0,5 metri este practică la o tejghea îngustă sau când împachetați produse unul câte unul. Păstrați rola curată, într-un loc uscat, fără greutăți așezate peste ea. Folia este transparentă și nu are variante de culoare.', 'other', false, false),
  ('musama-bej-cu-medalioane-florale-1-4-x-50-metri', 'Mușama bej cu medalioane florale, pe rolă de 1,4 metri lățime și 50 de metri lungime.

Fondul bej și medalioanele desenate rar pe suprafață fac din acest model varianta discretă din gamă. Se potrivește acolo unde nu vreți un imprimeu care sare în ochi: pensiuni, restaurante cu mobilier de lemn, săli de mese, cantine de firmă. Pe o masă lungă nu obosește ochiul și nu intră în conflict cu farfuriile colorate.

Suprafața se poate șterge cu o lavetă umedă după utilizare. Pentru pete persistente, încercați mai întâi metoda de curățare pe o porțiune puțin vizibilă. Modelul este potrivit pentru mesele folosite frecvent, când doriți o suprafață care se întreține simplu și un imprimeu discret.

Lățimea de 1,4 metri trebuie comparată cu lățimea mesei și cu cât vreți să atârne pe margini. Măsurați și lungimea necesară înainte de tăiere, mai ales dacă aveți mai multe mese de forme diferite. Pentru o masă mai lată, două bucăți alăturate vor avea o îmbinare vizibilă.

Rola are 50 de metri lungime, iar modelul este disponibil într-o singură variantă de culoare. Dacă doriți să cumpărați doar o bucată tăiată la metraj, confirmați această opțiune la punctul de vânzare; unitatea de vânzare online trebuie verificată separat.

Fondul bej poate fi asociat ușor cu mobilier din lemn, veselă colorată sau textile simple. Pentru mai multe mese, faceți o listă cu lungimea fiecăreia și adăugați separat marginile dorite, ca să estimați corect materialul necesar.', 'other', false, false),
  ('musama-model-alb-cu-flori-albastre-si-mov', 'Mușama cu flori albastre și mov, pe rolă de 1,4 metri lățime și 50 de metri lungime.

Aceeași compoziție florală vine pe trei fonduri diferite: bleu, bej și roșu. Fondul se alege din pagina produsului, înainte de a adăuga în coș, iar imprimeul rămâne identic la toate trei.

Imprimeul colorat luminează mesele care stau în lumină slabă — bucătării interioare fără fereastră mare, terase acoperite, foișoare, camere de oaspeți la demisol. Pe fond roșu modelul iese mai puternic, pe bej rămâne mai liniștit.

Pentru întreținerea obișnuită, ștergeți suprafața cu o lavetă umedă și testați orice produs de curățare pe o zonă puțin vizibilă.

Rola are 1,4 metri lățime. Înainte de tăiere, măsurați masa și decideți cât material doriți să atârne pe fiecare latură. Pentru mai multe mese, calculați separat fiecare bucată, astfel încât desenul să fie orientat la fel.

Rola are 50 de metri lungime. Dacă aveți nevoie de metraj tăiat la punctul de vânzare, verificați disponibilitatea acestei opțiuni înainte de comandă.

Cele trei fonduri se aleg din pagina produsului. Dacă amenajați mai multe mese în aceeași încăpere, puteți păstra același imprimeu și varia numai culoarea de fond. Verificați culoarea și cantitatea disponibile în momentul comenzii, deoarece acestea se pot schimba.', 'other', false, false),
  ('musama-model-floricele', 'Mușama cu floricele mărunte, pe rolă de 1,4 metri lățime și 50 de metri lungime.

Imprimeul este mic și dens, repetat uniform pe toată suprafața. Tocmai de aceea nu obosește ochiul și se potrivește pe o masă folosită în fiecare zi, nu doar la ocazii. Vine pe trei fonduri: auriu, albastru și bleu.

Pentru că desenul este mărunt și fără margine separată, bucata se poate tăia oriunde și arată la fel — util la mesele rotunde, unde tăietura nu iese niciodată perfect dreaptă.

Suprafața se poate șterge cu o lavetă umedă după masă. Mușamaua poate fi folosită pe mese de bucătărie, la servirea micului dejun sau în spații în care doriți o suprafață ușor de întreținut.

Rola are 1,4 metri lățime și 50 de metri lungime. Dacă aveți nevoie de o bucată tăiată la metraj, confirmați această opțiune la punctul de vânzare și verificați separat unitatea de vânzare online.

Pentru o masă de 1,2 × 0,8 metri, măsurați cât doriți să atârne materialul pe fiecare latură și calculați lungimea de tăiere în consecință. Un segment de 1 metru ar lăsa numai aproximativ 10 centimetri pe fiecare capăt al laturii de 0,8 metri; dacă doriți o margine mai lungă, tăiați mai mult. Auriu, albastru și bleu sunt cele trei fonduri disponibile.', 'other', false, false),
  ('musama-model-trandafir-2', 'Mușama cu trandafiri, varianta 2, pe rolă de 1,4 metri lățime și 50 de metri lungime.

Este al doilea model cu trandafiri din catalog. Diferența față de primul: trandafirii sunt mai mari și desenați mai rar pe suprafață, deci modelul se citește de la distanță. Fondul se alege dintre maro, roșu și verde.

Trandafirii mai mari pot fi puși în valoare pe o masă lungă ori pe o masă de bufet. Într-un spațiu cu multe alte imprimeuri, comparați cele trei fonduri cu vesela și decorul înainte de alegere. Dacă pregătiți mai multe mese pentru același eveniment, luați în calcul și direcția în care va fi orientat desenul.

Suprafața se șterge cu o lavetă umedă. Îndepărtați lichidele vărsate cât mai curând și testați detergenții pe o zonă puțin vizibilă.

Rola are 1,4 metri lățime și 50 de metri lungime. Măsurați masa și marginile dorite înainte de tăiere.

Pentru mese lungi, puteți orienta desenul de-a lungul mesei și puteți compara aspectul cu cel al modelului cu trandafiri mai mici. Fondurile maro, roșu și verde oferă efecte vizuale diferite, de la discret la contrastant. Dacă vă trebuie mai multe bucăți identice, calculați totalul lungimilor înainte de a comanda.', 'other', false, false),
  ('musama-model-trandafir', 'Mușama cu trandafiri, pe rolă de 50 de metri, lățime 1,4 metri.

Este modelul cu cele mai multe variante din gamă: bleu, vișiniu, albastru, auriu și verde. Toate cinci au același imprimeu cu trandafiri — diferă numai fondul, așa că puteți ține mai multe culori pe raft fără să schimbați modelul.

Trandafirii de dimensiune medie fac modelul ușor de integrat atât într-o bucătărie, cât și într-o sală de mese. Pentru o masă festivă, puteți alege un fond mai intens, precum vișiniul; pentru un decor mai luminos, comparați bleu sau auriu. Alegerea depinde de mobilier, veselă și lumina din încăpere.

Mușamaua formează un strat între obiectele așezate pe masă și suprafața acesteia. Ștergeți-o cu o lavetă umedă și evitați să lăsați lichidele sau obiectele fierbinți pe material mai mult decât este necesar.

Lățimea rolei este de 1,4 metri; pentru o masă mai lată, două bucăți alăturate vor avea o îmbinare vizibilă. Rola are 50 de metri lungime. Dacă doriți metraj tăiat la stand, verificați înainte această posibilitate și unitatea în care este vândut produsul online.

Cele cinci fonduri permit păstrarea aceluiași desen în încăperi cu decoruri diferite. Înainte de a comanda pentru mai multe mese, măsurați separat lungimile și marginile dorite. Verificați varianta de culoare și prețul curent după selecție, deoarece disponibilitatea se poate schimba.', 'other', false, false),
  ('musama-model-cirese-1-4-x-50-metri', 'Mușama cu cireșe, pe rolă de 1,4 metri lățime și 50 de metri lungime, în două variante de fond: albastru și verde.

Imprimeul cu cireșe poate aduce o notă colorată unei bucătării, unei zone de mic dejun sau unei mese de familie. Alegeți fondul albastru ori verde în funcție de culoarea mobilei și a veselei. Pentru un decor mai încărcat, comparați și modelul cu cireșe și frunze, care are o compoziție diferită.

După utilizare, suprafața se poate șterge cu o lavetă umedă. Pentru urme de cafea, suc sau grăsime, curățați cât mai repede și testați întâi orice detergent pe o porțiune mai puțin vizibilă.

Înainte de tăiere, lăsați materialul să stea întins și măsurați masa. Lungimea necesară include și partea care va atârna la capete. Dacă intenționați să folosiți mușamaua și pe tăvi sau rafturi, notați separat dimensiunile acelor bucăți.

Rola are 50 de metri lungime și 1,4 metri lățime. Pentru bucăți tăiate la metraj, confirmați opțiunea la punctul de vânzare; verificați și unitatea de vânzare afișată online.

Cele două fonduri au aceeași grafică cu cireșe, dar pot arăta diferit în lumina încăperii. Comparați imaginile variantelor înainte de a alege. Dacă amenajați mai multe mese, măsurați fiecare lungime și calculați materialul suplimentar pentru margini, ca să nu rămână o piesă prea scurtă.', 'other', false, false),
  ('fata-de-masa-model-fructe', 'Mușama cu fructe, pe rolă de 1,4 metri lățime și 50 de metri lungime.

Compoziția cu fructe vine pe patru fonduri: verde, albastru, roz și bleu. Patru variante înseamnă că puteți potrivi mușamaua cu culoarea mobilierului sau a faianței, nu doar să o puneți pe masă pentru că protejează.

Desenul cu fructe este vizibil pe o masă mare și poate fi folosit într-o bucătărie, într-o zonă de servire sau la o masă de familie. Când alegeți între cele patru fonduri, comparați culoarea cu mobilierul și vesela. Într-o încăpere cu multe detalii vizuale, o nuanță de fond apropiată de cea a mobilei poate face masa să pară mai ordonată.

Suprafața se poate șterge cu o lavetă umedă. Curățați lichidele vărsate cât mai curând, fără să presupuneți că materialul este impermeabil sau rezistent la toate petele.

Rola are 50 de metri lungime și 1,4 metri lățime. Pentru mai multe mese, adunați lungimile necesare după ce ați inclus marginile dorite. O bucată de probă sau verificarea culorii în lumină naturală vă poate ajuta să alegeți între cele patru fonduri.

Verificați disponibilitatea culorii alese și unitatea de vânzare în momentul comenzii. Variantele de fond sunt verde, albastru, roz și bleu. Dacă doriți metraj tăiat la punctul de vânzare, confirmați că această opțiune este disponibilă; prețul online nu trebuie interpretat automat ca preț pentru rola întreagă.', 'other', false, false),
  ('fata-de-masa-model-de-flori', 'Mușama cu imprimeu floral, pe rolă de 50 de metri, lățime 1,4 metri. Disponibilă în auriu, albastru și roz.

Imprimeul acoperă toată suprafața, fără bordură separată pe margine. Asta are un avantaj practic: bucata se poate tăia oriunde și arată la fel, indiferent unde cade tăietura. Pentru mese rotunde sau ovale, unde oricum nu tăiați drept, este modelul cel mai iertător din gamă.

Fondul auriu poate fi asociat cu o masă de ocazie, iar albastrul și rozul pot completa decoruri cotidiene. Acestea sunt sugestii de asortare, nu utilizări obligatorii: alegeți în funcție de culorile încăperii și de suprafața pe care doriți să o acoperiți.

Suprafața poate fi ștearsă cu o lavetă umedă. În cazul vinului, cafelei sau grăsimii, îndepărtați lichidul cât mai curând și testați metodele de curățare pe o porțiune discretă.

Rola are 50 de metri lungime și 1,4 metri lățime. Dacă doriți numai o bucată tăiată la metraj, verificați această opțiune la punctul de vânzare; unitatea de vânzare online trebuie confirmată separat.

Din aceeași rolă se pot planifica bucăți de lungimi diferite pentru mese, suprafețe de servire sau rafturi, dacă materialul este potrivit acelor utilizări. Măsurați fiecare suprafață și includeți marginile dorite înainte de tăiere. Alegeți fondul din pagina produsului și verificați prețul curent al variantei.', 'other', false, false),
  ('fata-de-masa-model-flori', 'Mușama cu flori de câmp, pe rolă de 1,4 × 50 de metri. Patru variante de fond: verde, bej, bleu și mov.

Florile de câmp sunt dispuse aerisit, cu spații vizibile între elementele desenului. Modelul poate fi potrivit pentru o bucătărie luminoasă, un foișor acoperit sau o masă de vară. Pentru utilizare prelungită în exterior, verificați întâi compoziția materialului și condițiile recomandate; imaginile produsului nu pot confirma rezistența la soare ori ploaie.

Suprafața se poate șterge cu o lavetă umedă după utilizare.

Varianta verde se pierde frumos în mediu de grădină, cea mov se vede cel mai bine.

Rola are 1,4 metri lățime și 50 de metri lungime. Dacă doriți numai metraj tăiat la punctul de vânzare, confirmați că această opțiune este disponibilă; verificați separat unitatea de vânzare online.

Pentru o masă în aer liber, măsurați lățimea, lungimea și cât vreți să atârne materialul pe fiecare latură. Prinderea la colțuri poate fi utilă când bate vântul. Cele patru fonduri sunt verde, bej, bleu și mov; comparați-le cu decorul, apoi verificați varianta disponibilă la comandă.', 'other', false, false),
  ('fata-de-masa-model-cu-fructe', 'Mușama cu cireșe și frunze, pe rolă de 50 de metri, lățime 1,4 metri.

Este al doilea model cu cireșe din catalog. Diferența față de primul: aici sunt adăugate frunze în compoziție și desenul este mai mare, deci modelul arată mai plin. Fondul se alege dintre albastru, bej și verde.

Modelul se poate folosi pe mese de bucătărie sau de familie, unde o suprafață ușor de șters este practică. Îndepărtați lichidele vărsate cât mai curând și testați produsele de curățare pe o zonă puțin vizibilă.

Lățimea de 1,4 metri trebuie comparată cu lățimea mesei și cu marginile dorite.

Rola are 50 de metri lungime. Dacă doriți metraj tăiat la punctul de vânzare din Dragonul Roșu, confirmați această opțiune înainte de a merge acolo. Verificați unitatea de vânzare online înainte de a comanda.

Imprimeul cu cireșe și frunze este mai bogat vizual decât modelul simplu cu cireșe, astfel încât alegerea dintre ele ține și de aspectul pe care îl preferați. Pentru o masă lungă, calculați materialul necesar după ce includeți lungimea și marginile dorite. Fondurile disponibile sunt albastru, bej și verde.', 'other', false, false),
  ('punga-curierat-70x75', 'Pungă de curierat din polietilenă, 70 × 75 cm, cu bandă adezivă pe clapetă.

Formatul de 70 × 75 cm este destinat coletelor voluminoase, mai ales textilelor care se pot plia: lenjerie, pături subțiri, perne sau mai multe articole de îmbrăcăminte. Dimensiunea potrivită depinde de produs după împachetare, nu doar de dimensiunea lui neambalată. Măsurați grosimea și lăsați loc pentru închiderea clapetei fără tensionare.

Materialul opac limitează vizibilitatea conținutului. Clapeta are bandă adezivă integrată, astfel încât punga poate fi închisă după introducerea produselor. Calitatea sigilării depinde de aplicare și de condițiile de transport; nu tratați această închidere ca pe o garanție de inviolabilitate.

Polietilena poate proteja conținutul de contactul obișnuit cu murdăria și umezeala, dar pungile nu sunt prezentate ca ambalaje etanșe pentru expunere prelungită la ploaie. Dacă produsul este sensibil, folosiți protecție suplimentară și verificați cerințele curierului.

Set de 50 de bucăți. Nu are variante de culoare.

Dacă produsul împachetat nu încape comod, comparați varianta de 80 × 100 cm. Pentru articole fragile, adăugați folie cu bule ori un ambalaj rigid; punga de curierat nu amortizează singură loviturile. La textile, evitați să umpleți punga până la margine, deoarece clapeta trebuie să se lipească pe o suprafață curată și plană.', 'courier', false, false),
  ('punga-curierat-50x65', 'Pungă de curierat din polietilenă, 50 × 65 cm, cu bandă adezivă de închidere.

Produsul are variante denumite „Deschis” și „Închis”. Alegeți-o pe cea dorită din pagina produsului și consultați fotografiile pentru aspectul fiecăreia.

Formatul de 50 × 65 cm poate fi potrivit pentru haine împăturite, o cutie medie de accesorii sau încălțăminte în cutie, dacă dimensiunile finale permit închiderea. Comparați produsul ambalat cu lățimea și lungimea pungii și lăsați loc pentru clapetă. Dacă expediați mai multe articole împreună, verificați și grosimea coletului.

Banda adezivă este aplicată pe clapetă. Pentru o închidere bună, lipiți-o pe o suprafață curată, fără să întindeți excesiv punga. Muchiile rigide sau ascuțite ale unei cutii pot solicita materialul, așa că protejați colțurile dacă este necesar.

Set de 50 de bucăți.

Pentru colete mai mari puteți compara formatele de 65 × 70 și 70 × 75 cm, iar pentru cele mai mici, 45 × 60 și 35 × 55 cm. Verificați prețul și disponibilitatea după selectarea variantei „Deschis” sau „Închis”; evitați să presupuneți că ambele au mereu același preț.', 'courier', false, false),
  ('pungi-curierat-35-55', 'Pungă de curierat din polietilenă, 35 × 55 cm, cu bandă adezivă pe clapetă.

Formatul de 35 × 55 cm poate găzdui produse cu volum redus sau mediu: o carte ambalată corespunzător, un tricou împăturit, o cutie mică de accesorii ori alte articole care lasă loc pentru închiderea clapetei. Verificați dimensiunile produsului după ambalare, în special grosimea, înainte de a alege punga.

Banda adezivă de pe clapetă permite închiderea fără o bandă separată, dacă este aplicată pe o suprafață curată și netensionată. Materialul opac limitează vizibilitatea conținutului.

Pentru obiecte fragile, folosiți mai întâi un strat de protecție adaptat produsului, precum folie cu bule, și apoi puneți-l în pungă ori într-o cutie potrivită. Punga de curierat nu înlocuiește amortizarea necesară la transport. Dacă expedierea implică umezeală, țineți cont că acest ambalaj nu este garantat etanș.

Set de 50 de bucăți.

Pentru un colet puțin mai mare, comparați formatul de 45 × 60 cm. Pentru documente sau articole foarte plate, plicurile de curierat de 25 × 35 și 30 × 45 cm pot fi mai potrivite; prețul final depinde de varianta aleasă și de serviciul de transport. Acest produs nu are opțiuni de culoare.', 'courier', false, false),
  ('plic-curierat-25x35', 'Plic de curierat din polietilenă, 25 × 35 cm, cu bandă adezivă.

Formatul de 25 × 35 cm este potrivit pentru articole plate: documente, carduri, vouchere, mostre subțiri sau produse mici protejate într-un ambalaj interior. Pentru acte importante, folosiți și o mapă ori un carton de protecție. Măsurați inclusiv ambalajul interior, ca plicul să se poată închide fără să forțați clapeta.

Polietilena formează un înveliș flexibil, iar materialul opac limitează vizibilitatea documentelor. Nu considerați plicul impermeabil sau imposibil de rupt: rezistența depinde de încărcare și de felul în care coletul este manipulat. Dacă trimiteți acte sensibile ori originale, verificați și cerințele serviciului de curierat.

Formatul de 25 × 35 cm se află între cele de 16 × 24 și 30 × 45 cm. O foaie A4 are aproximativ 21 × 29,7 cm, însă un dosar sau o mapă A4 poate avea dimensiuni exterioare mai mari. Măsurați mapa înainte de a decide dacă încape fără îndoire.

Set de 50 de bucăți.

Pentru dosare mai groase sau mape cu margini late, comparați plicul de 30 × 45 cm. Pentru carduri și documente mai mici, varianta de 16 × 24 cm poate lăsa mai puțin spațiu nefolosit. Acest format nu are variante de culoare în catalog.', 'courier', false, false),
  ('punga-flori-40x50', 'Pungă din polietilenă cu imprimeu floral, 40 × 50 cm, cu mâner decupat.

Imprimeul vine pe trei fonduri: roșu, albastru și verde. Alegeți varianta din pagina produsului; desenul este același la toate trei.

Mânerul este decupat direct în material, fără o buclă aplicată separat. Alegerea între acest model și unul cu mâner tip buclă depinde de aspectul dorit, de felul în care clientul ține punga și de caracteristicile produselor transportate. Nu este indicată o sarcină maximă, deci evitați să promiteți o rezistență sau un avantaj de preț doar pe baza tipului de mâner.

În formatul de 40 × 50 cm pot încăpea haine și textile împăturite sau alte articole care lasă suficient loc la deschidere. Pentru cutii rigide, verificați lățimea și grosimea produsului înainte de comandă: dimensiunea nominală a pungii nu spune singură cât volum util rămâne în interior.

Set de 50 de bucăți. Prețul pe bucată apare în pagină, lângă prețul setului.

Dacă preferați un alt tip de mâner la același format, comparați modelele cu buclă din catalog. Variantele cu fond roșu, albastru și verde pot fi selectate separat în pagina produsului; verificați prețul și stocul la alegerea culorii. Pentru articole grele, solicitați date despre grosime și sarcina recomandată înainte de utilizare.', 'retail', false, false),
  ('punga-reni-40x50', 'Pungă din polietilenă cu imprimeu cu reni, 40 × 50 cm, cu mâner tip buclă.

Model de iarnă. Renii sunt desenați grafic, în linii simple, nu ca ilustrație de carte pentru copii. Din acest motiv punga merge și la cadouri pentru adulți, nu doar la jucării — se folosește în magazine de haine, de decorațiuni și la târgurile de Crăciun.

Mânerul tip buclă este aplicat separat pe material. La alegerea pungii pentru cadouri, comparați greutatea, forma și marginile produsului cu spațiul disponibil în interior.

Grafica de iarnă este potrivită pentru perioada sărbătorilor, dar punga poate fi folosită ori de câte ori modelul se potrivește cadoului.

Set de 50 de bucăți.

Pentru o prezentare cu mai multe modele de iarnă, comparați și punga cu Moș Crăciun, precum și cea cu reni și sanie. Fiecare are o grafică proprie și un tip de mâner care trebuie verificat în pagina sa. Acest model se vinde într-o singură variantă de culoare.', 'retail', false, true),
  ('punga-love-40x50-model-2', 'Pungă din polietilenă cu imprimeu „Love”, varianta 2, 40 × 50 cm, cu mâner decupat.

Aceasta este a doua grafică „Love” din catalog. Poate însoți cadouri de Ziua Îndrăgostiților, aniversări sau alte ocazii în care mesajul se potrivește. Dacă oferiți mai multe opțiuni de ambalare, comparați imaginea acestui model cu cealaltă grafică „Love” înainte de a alege; numele apropiate nu înseamnă că desenele sunt identice.

Mânerul este decupat direct în material. În formatul de 40 × 50 cm pot încăpea o cutie de bomboane, un set de cosmetice ori o jucărie de pluș, în funcție de dimensiunile ambalajului. Pentru obiecte rigide sau grele, verificați spațiul util și cereți informații despre rezistența recomandată; nu este indicată o limită de încărcare.

Măsura de 40 × 50 cm lasă loc și pentru un buchet împachetat, pus pe diagonală.

Modelul nu are variante de culoare. Se vinde la set de 50 de bucăți, cu prețul pe bucată afișat sub prețul setului.

Când alegeți între cele două modele „Love”, uitați-vă la grafică, la variantele de culoare și la prețul afișat în pagina fiecăruia. Dacă doriți să folosiți punga pentru un buchet, măsurați ambalajul floral și verificați dacă mânerul rămâne accesibil.', 'retail', false, true),
  ('punga-oua-paste-25x30', 'Pungă din polietilenă cu imprimeu cu ouă de Paște, 25 × 30 cm, cu mâner tip buclă.

Dimensiune mică, potrivită pentru ce se dă la bucată de Paște: un ou de ciocolată, o lumânare, o pungă de bomboane, un mic aranjament cu flori, un cadou pentru copii la biserică. Intră și într-un coș de sărbători, fără să iasă afară pe margine.

Mânerul tip buclă este aplicat separat și schimbă aspectul pungii față de un mâner decupat. Pentru ouă de ciocolată, lumânări sau mici obiecte de cadou, verificați dimensiunile ambalajului înainte de a comanda.

Setul conține 100 de bucăți. Dacă pregătiți multe cadouri asemănătoare, calculați câte seturi vă trebuie pornind de la numărul de pachete. Păstrați câteva pungi pentru ambalaje cu forme neobișnuite și verificați din timp dacă formatul de 25 × 30 cm este suficient pentru toate produsele.

Nu are variante de culoare. Prețul pe bucată îl vedeți în pagină, sub prețul setului.

Pentru produse mai mari, comparați măsurile de 30 × 40 și 40 × 50 cm din gama de Paște. Verificați lățimea și înălțimea produsului împachetat, plus spațiul necesar pentru a-l introduce comod în pungă.', 'retail', true, true),
  ('punga-paste-30x40', 'Pungă din polietilenă cu model de Paște, 30 × 40 cm, cu mâner tip buclă.

Este măsura intermediară din gama de Paște. Intră un cozonac mediu, o pască, o sticlă de vin cu un pachet mic alături, sau două-trei produse date împreună la aceeași comandă.

Dacă folosiți atât punga de 25 × 30 cm, cât și pe cea de 40 × 50 cm, această dimensiune acoperă cadourile care nu încap comod în prima, dar ar lăsa mult spațiu liber în a doua. Măsurați cozonacul sau cutia după ambalare; înălțimea trecută în titlul pungii nu garantează că orice produs de aceeași lungime va încăpea.

Mânerul tip buclă este aplicat separat. Pentru produse de patiserie, folosiți mai întâi ambalajul alimentar adecvat și așezați produsul astfel încât să nu apese pe o singură latură.

Nu are variante de culoare. Se vinde la set de 50 de bucăți. Prețul pe bucată este afișat în pagină.

Modelul poate fi asociat cu alte pungi de Paște din catalog pentru a avea mai multe formate. Comparați imaginile înainte de a spune că toate au exact aceeași grafică.', 'retail', false, true),
  ('punga-buline-50x60', 'Pungă din polietilenă cu imprimeu cu buline, 50 × 60 cm, cu mâner decupat.

Formatul de 50 × 60 cm oferă mai mult spațiu decât modelele de 40 × 50 cm. Poate fi util pentru o geacă, un set de prosoape sau mai multe articole textile împăturite, dacă forma lor permite introducerea fără să tensioneze materialul. Comparați și alte pungi de 50 × 60 cm din catalog; aceasta nu este singura pungă imprimată în această dimensiune.

Bulinele nu sunt legate de o sărbătoare anume, astfel încât modelul poate fi folosit la ambalarea cadourilor ori a cumpărăturilor în mai multe perioade ale anului. Potriviți desenul cu produsele și cu stilul magazinului. Alegerea unui imprimeu versatil poate simplifica selecția, dar nu garantează că întregul stoc va fi folosit.

Mânerul este decupat în material. La produse voluminoase, împărțiți încărcătura astfel încât mânerul și colțurile să nu fie trase excesiv. Pentru produse grele, cereți specificațiile materialului.

Nu are variante de culoare. Set de 50 de bucăți.

Dacă doriți o pungă mare cu imprimeu pentru utilizări diferite, comparați această grafică cu modelul tradițional de 50 × 60 cm. Dacă preferați un aspect simplu, există și varianta neagră la aceeași dimensiune. Înainte de comandă, verificați dimensiunile produselor ambalate, tipul de mâner și prețul fiecărui model.', 'retail', false, false),
  ('punga-paste-fara-maner-40x50', 'Pungă din polietilenă cu model de Paște, 40 × 50 cm, cu mânerul decupat direct în material.

La aceeași dimensiune există două pungi de Paște cu tipuri diferite de mâner. Aceasta are mânerul decupat în material, potrivit când preferați o prindere discretă și un contur simplu. Varianta cu buclă are mâner aplicat separat. Comparați fotografiile și prețul afișat pentru fiecare înainte de a alege.

Formatul de 40 × 50 cm este cel mai mare din gama de Paște. Intră un cozonac mare cu o sticlă, un coș mic de sărbători, sau un set de cadouri pentru o familie.

Pentru coșuri, sticle sau borcane, verificați greutatea totală și felul în care obiectele sunt așezate. Dacă încărcătura este grea sau are muchii rigide, cereți specificațiile și luați în calcul un ambalaj interior care să distribuie presiunea.

Nu are variante de culoare. Set de 50 de bucăți.

Modelul poate fi asociat cu pungile de Paște de 25 × 30 și 30 × 40 cm pentru cadouri de mărimi diferite.', 'retail', false, true),
  ('punga-paste-cu-maner-40x50', 'Pungă din polietilenă cu model de Paște, 40 × 50 cm, cu mâner tip buclă.

Mânerul tip buclă este aplicat separat pe material, ceea ce schimbă felul în care punga se ține în mână. Poate fi potrivit pentru pachete de Paște cu produse de forme diferite, dacă acestea încap fără să întindă materialul.

Dacă preferați mânerul decupat, există o altă pungă de Paște de 40 × 50 cm. Comparați fotografiile celor două modele și decideți care prindere se potrivește pachetelor pregătite. Verificați prețul afișat în pagina fiecărui produs la comandă.

Dacă oferiți pachete foarte diferite ca dimensiune, puteți păstra la îndemână ambele tipuri de mâner și puteți alege punga potrivită pentru fiecare produs. Încărcați cozonacii, borcanele sau sticlele astfel încât greutatea să fie bine distribuită și utilizați ambalaj alimentar sau de protecție unde este necesar.

Nu are variante de culoare. Se vinde la set de 50 de bucăți.

Pentru cadouri mici există și punga de 25 × 30 cm cu ouă de Paște, vândută la set de 100 de bucăți.', 'retail', false, true),
  ('punga-masina-40x50', 'Pungă din polietilenă cu imprimeu cu mașină, 40 × 50 cm, cu mâner decupat.

Imprimeul cu mașină se potrivește cadourilor pentru copiii cărora le plac vehiculele. Formatul de 40 × 50 cm poate primi haine de copii, jocuri sau jucării în cutie, în funcție de dimensiunile ambalajului. Pentru o cutie rigidă, măsurați și grosimea, nu numai înălțimea: punga trebuie să rămână suficient de lejeră pentru a fi introdus și scos produsul.

Dacă pregătiți cadouri cu teme diferite, puteți compara acest model cu punga cu prințesă, tot de 40 × 50 cm. Alegeți desenul după preferința destinatarului, nu după presupuneri despre gen. Păstrarea aceleiași dimensiuni pentru două grafici poate simplifica pregătirea cadourilor de mărime apropiată.

Mânerul este decupat în material. La jucării în cutii cu muchii, folosiți o protecție interioară dacă este necesar și evitați să apăsați cutia în colțurile pungii.

Nu are variante de culoare. Set de 50 de bucăți.

Modelul se vinde într-o singură variantă, la set de 50 de bucăți. Pentru cadouri mai mici, comparați punga cu pisici de 25 × 30 cm; dacă alegeți două grafici, verificați separat dimensiunea, numărul de bucăți din set și prețul afișat.', 'retail', false, true),
  ('punga-printesa-40x50', 'Pungă din polietilenă cu imprimeu prințesă, 40 × 50 cm, cu mâner decupat.

Imprimeul cu prințesă poate fi ales pentru cadourile destinate copiilor care preferă acest desen. Are aceeași dimensiune nominală ca modelul cu mașină, astfel încât puteți compara cele două variante când pregătiți ambalaje pentru petreceri ori magazine de jucării.

Formatul de 40 × 50 cm poate găzdui o păpușă în cutie, un set de joacă sau o carte ilustrată mare, dacă ambalajul încape și lasă loc la mâner. Pentru obiecte mărunte, punga cu pisici de 25 × 30 cm poate fi mai potrivită ca dimensiune; comparați prețurile din paginile produselor înainte de a decide.

Mânerul este decupat direct în material. Nu este indicată o sarcină maximă, așa că evitați să umpleți punga cu mai multe cutii grele fără să verificați rezistența materialului. Prețul acestui produs trebuie comparat cu prețul curent al altor modele, nu dedus din tipul de mâner.

Nu are variante de culoare. Se vinde la set de 50 de bucăți, cu prețul pe bucată afișat sub prețul setului.

Modelul se vinde la set de 50 de bucăți și nu are opțiuni de culoare. Dacă un cadou în cutie nu încape în acest format, comparați și pungile de 50 × 60 cm din catalog, inclusiv modelul negru și cel cu buline. Verificați tipul de mâner și măsurile reale necesare înainte de a comanda.', 'retail', false, true),
  ('punga-floarea-soarelui-27x32', 'Pungă din polietilenă cu imprimeu cu floarea-soarelui, 27 × 32 cm, cu mâner decupat.

Formatul de 27 × 32 cm se află între pungile mici de 25 × 30 cm și modelele de 30 × 40 cm. Poate fi potrivit pentru un borcan, un accesoriu, un cadou mic sau produse de mercerie, dacă ambalajul lor încape fără să forțeze marginile. Pentru un buchet ori un ghiveci, măsurați mai întâi lățimea la baza ambalajului.

Imprimeul cu floarea-soarelui poate completa prezentarea florilor, a cadourilor sau a produselor artizanale. Fondul luminos pune în evidență un pachet mic și poate aduce un accent de culoare lângă ambalaje simple. Alegeți modelul atunci când desenul se potrivește mărfii și stilului punctului de vânzare.

Mânerul este decupat în material. Dimensiunea mică nu garantează că punga va rămâne ușoară: un borcan sau un obiect compact poate cântări mult.

Se vinde la set de 100 de bucăți și nu are variante de culoare. Numărul de bucăți din set nu arată cât de repede se consumă produsul în alte magazine. Calculați cantitatea de care aveți nevoie din propriul număr de comenzi și păstrați o rezervă pentru articolele care necesită alt format.

Dacă vă trebuie același imprimeu pentru comenzi mai mari, există varianta de 40 × 50 cm, cu mâner tip buclă. Cele două măsuri se pot comanda împreună, iar prețul pe bucată al fiecăreia apare în pagina ei.', 'retail', true, false),
  ('punga-maci-fara-maner-40x50', 'Pungă din polietilenă cu imprimeu cu floarea-soarelui, 40 × 50 cm, cu mâner tip buclă.

Formatul de 40 × 50 cm oferă mai mult loc decât cel de 27 × 32 cm. Poate primi haine împăturite, textile sau un aranjament floral ambalat, în funcție de forma și grosimea lor. Dacă folosiți ambele dimensiuni, alegeți-o pe cea care lasă spațiu suficient în jurul produsului și la mâner.

Dacă vindeți și formatul mic, puteți alege punga după dimensiunea fiecărei comenzi. Un produs compact poate încăpea în 27 × 32 cm, în timp ce o comandă cu mai multe articole poate avea nevoie de 40 × 50 cm. O cutie rigidă trebuie măsurată inclusiv pe grosime, ca să nu tensioneze colțurile pungii.

Acest produs este prezentat cu mâner tip buclă, aplicat separat; formatul mic este prezentat cu mâner decupat. Înainte de a folosi punga pentru mai multe borcane ori alte produse grele, cereți informații despre grosime și greutatea recomandată.

Nu are variante de culoare. Se vinde la set de 50 de bucăți.

Varianta de 27 × 32 cm se vinde la set de 100 de bucăți, iar acest format la set de 50. Măsurați produsul împachetat înainte de a alege între cele două dimensiuni. Pentru o comandă cu mai multe articole, așezați-le astfel încât greutatea să fie distribuită și să rămână loc la deschiderea pungii.', 'retail', false, false),
  ('maci-fara-maner-40-50', 'Pungă din polietilenă cu imprimeu cu maci, 40 × 50 cm, cu mânerul decupat direct în material.

Imprimeul cu maci poate fi folosit pentru cadouri, haine sau alte articole atunci când doriți un desen floral ușor de recunoscut. Alegeți modelul după aspectul produselor și al ambalajului final.

Mânerul acestei variante este decupat direct în material. La aceeași dimensiune există și un model cu mâner tip buclă, aplicat separat. Alegeți prinderea care vi se pare mai potrivită pentru prezentarea produselor și comparați prețurile afișate în paginile celor două modele.

În formatul de 40 × 50 cm pot intra haine împăturite sau articole textile, dacă rămâne spațiu la deschidere și la mâner. O rochie, o bluză sau un set de accesorii pot avea volume diferite după ambalare; măsurați produsul pregătit pentru predare înainte de a stabili formatul.

Pentru obiecte compacte ori grele, verificați greutatea recomandată și folosiți un ambalaj interior dacă au muchii rigide. Tipul de mâner nu oferă singur o garanție de rezistență. Comparați cu varianta cu buclă de 40 × 50 cm dacă preferați o altă prindere în mână.

Modelul se vinde într-o singură variantă de culoare, la set de 50 de bucăți.

Prețul pe bucată se calculează din prețul setului afișat în pagina produsului. Dacă aveți nevoie de o cantitate mare, verificați stocul actual înainte de comandă.', 'retail', false, false),
  ('punga-maci-40x50', 'Pungă din polietilenă cu imprimeu cu maci, 40 × 50 cm, cu mâner tip buclă.

Acest model cu maci are formatul de 40 × 50 cm și mâner tip buclă. În catalog există și o pungă cu maci de aceeași dimensiune, dar cu mâner decupat. Comparați fotografiile celor două produse, deoarece denumirea apropiată nu confirmă că desenul este identic în toate detaliile.

Bucla este aplicată separat pe material și poate fi mai comodă pentru persoanele care preferă să țină punga de un mâner bine conturat. Pentru obiecte grele, solicitați date despre material și distribuiți greutatea în interior.

În pungă pot fi puse textile, încălțăminte sau produse în cutie, dacă dimensiunile ambalajului lasă loc pentru prinderea mânerului. Pentru borcane ori obiecte cu muchii, adăugați protecție interioară și evitați să forțați colțurile. Formatul nominal nu înlocuiește verificarea produsului ambalat.

Varianta cu mâner decupat este o alternativă de prezentare pentru articole de dimensiuni similare.

Se vinde la set de 50 de bucăți, într-o singură variantă de culoare.

Prețul pe bucată este afișat în pagină, sub prețul setului. Pentru a alege între cele două pungi cu maci, comparați mânerele, fotografiile și caracteristicile produselor. În cazul articolelor grele, cereți informații despre grosimea materialului și greutatea recomandată înainte de a stabili ambalajul.', 'retail', false, false),
  ('punga-love-40x50', 'Pungă din polietilenă cu imprimeu „Love”, 40 × 50 cm, cu mâner decupat.

Vine în trei variante de fond: mov, albastru și verde. Nu sunt culorile obișnuite de 14 februarie, ceea ce ajută dacă vreți un model care nu arată strict ca pungă de Valentine''s și poate fi dat și la alte ocazii — aniversări, cadouri de nuntă, cadouri între prieteni.

Formatul de 40 × 50 cm lasă loc pentru un set de cosmetice, o cutie de bomboane mare, o jucărie de pluș medie sau un buchet împachetat pus pe diagonală.

Mânerul este decupat în material. Prețul curent se vede în pagina produsului și nu trebuie dedus din faptul că mânerul nu este aplicat separat.

Fondurile mov, albastru și verde pot fi selectate în pagina produsului. Puteți folosi mai multe culori pentru cadouri diferite, păstrând aceeași grafică și dimensiune. Verificați prețul și stocul după selecție, deoarece disponibilitatea poate varia.

Există și o a doua grafică „Love” în catalog, cu alt desen. Set de 50 de bucăți.

Comparați fotografia acestui model cu cea a celei de-a doua grafici „Love” din catalog. Dacă doriți o anumită culoare pentru toate cadourile, verificați disponibilitatea înainte de a comanda.', 'retail', false, true),
  ('punga-oras', 'Pungă din polietilenă cu imprimeu urban, 40 × 50 cm, cu mâner decupat. Două variante de fond: mov și verde.

Imprimeul cu siluetă de oraș este neutru: nu are flori, nu are text, nu are nimic legat de o sărbătoare. Asta îl face util în magazinele unde un model floral ar arăta nepotrivit — haine bărbătești, accesorii, articole tehnice, electronice mici, papetărie.

Același imprimeu poate fi folosit în mai multe perioade ale anului, deoarece nu indică o sărbătoare anume. Totuși, alegerea unei singure pungi pentru tot magazinul depinde de dimensiunile și tipurile produselor vândute. Pentru articole foarte mici sau foarte voluminoase, poate fi util să aveți și un al doilea format.

Formatul de 40 × 50 cm poate primi haine împăturite, accesorii sau cutii mici, dacă rămâne loc la deschidere. Pentru încălțăminte în cutie, măsurați ambalajul rigid; o pereche scoasă din cutie necesită protecție și prezentare adecvate. Dimensiunile produsului pregătit pentru predare sunt mai importante decât categoria din care face parte.

Mânerul este decupat în material. Pentru produse grele, solicitați specificațiile materialului și evitați să solicitați excesiv decupajul.

Fondurile mov și verde se aleg din pagina produsului. Verificați prețul și disponibilitatea variantei selectate. Se vinde la set de 50 de bucăți.

Dacă aveți nevoie de un format mai mare pentru același tip de marfă, punga neagră simplă există în 50 × 50 și 50 × 60 cm. Prețul pe bucată al acestui model apare în pagină, sub prețul setului.', 'retail', false, false),
  ('punga-din-polietilena-cu-imprimeu-thank-you-40-50-cm', 'Pungă din polietilenă cu textul „Thank You”, 40 × 50 cm, cu mâner tip buclă.

Vine în patru variante: negru, roșu, verde și albastru. Textul este același la toate; diferă doar culoarea fondului.

Mesajul „Thank You” poate însoți predarea unei comenzi, fără să fie nevoie de un ambalaj personalizat cu numele magazinului. Modelul poate fi ales pentru haine, cadouri sau alte produse care încap în formatul de 40 × 50 cm. Dacă doriți să adăugați o notă personală, un bilet sau o etichetă separată rămâne o opțiune; imprimeul nu înlocuiește automat mesajul scris pentru client.

Mânerul tip buclă este aplicat separat. Măsurați cutiile și articolele împăturite înainte de a alege formatul; produsele rigide pot solicita colțurile pungii.

Formatul de 40 × 50 cm este cel standard pentru haine împăturite.

Culorile disponibile sunt negru, roșu, verde și albastru. Alegeți varianta din pagina produsului și verificați prețul și stocul în momentul comenzii. Se vinde la set de 50 de bucăți.

Mesajul în limba engleză nu este legat de un sezon, astfel încât poate fi folosit la ocazii diferite dacă se potrivește stilului magazinului. Pentru comenzi cu produse de mărimi foarte diferite, comparați și alte dimensiuni de pungi. În pagina produsului este afișat prețul pe bucată, util când calculați costul ambalării.', 'retail', false, true),
  ('punga-romania-40x50', 'Pungă din polietilenă cu însemne românești, 40 × 50 cm, cu mâner decupat.

Vine în trei variante de fond: roșu, bleu și albastru. Desenul este același; se schimbă doar culoarea de dedesubt.

Motivul românesc poate completa prezentarea suvenirurilor, a textilelor tradiționale sau a produselor oferite la târguri tematice. Este o alegere de design, nu o garanție că fiecare client o va prefera. Pentru un cadou destinat turiștilor, comparați fundalurile roșu, bleu și albastru cu culorile produsului ambalat.

Formatul de 40 × 50 cm poate primi o ie împăturită, o față de masă sau câteva suveniruri, dacă rămâne spațiu la mâner. Pentru borcane ori sticle, folosiți protecție între obiecte și verificați greutatea totală. Mărimea pungii nu indică singură câtă greutate poate suporta.

Mânerul este decupat direct în material. La produse grele, evitați să concentrați greutatea într-un singur colț și solicitați specificațiile de încărcare dacă sunt necesare. Prețul se verifică în pagina produsului, nu se deduce din tipul de mâner.

Cele trei fonduri au același preț pe set. Avem și două modele cu motiv tradițional, în 25 × 30 și 50 × 60 cm. Set de 50 de bucăți.

Selectați culoarea dorită din pagina produsului și verificați disponibilitatea ei. Comparați fotografia cu cele două modele tradiționale din catalog dacă aveți nevoie de mai multe formate.', 'retail', false, false),
  ('punga-lavanda-40x50', 'Pungă din polietilenă cu imprimeu cu lavandă, 40 × 50 cm, cu mâner tip buclă.

Vine în patru variante de fond: bleu, alb, mov și roz. Varianta mov se potrivește cel mai bine cu imprimeul, cea albă îl scoate cel mai mult în evidență.

Poate fi folosită de magazinele de cosmetice naturale, de cele care vând săpunuri, uleiuri esențiale, ceaiuri și produse handmade, și de standurile de la târgurile de produse naturale. Lavanda este asociată direct cu acest tip de marfă, deci punga se potrivește cu ce vindeți.

Mânerul tip buclă este aplicat separat. Dacă puneți în pungă borcane sau flacoane, verificați atât dimensiunile, cât și greutatea și folosiți un strat de protecție între obiectele fragile.

Formatul de 40 × 50 cm intră un coș mic cadou, un set de cosmetice sau mai multe produse la aceeași comandă.

Fondurile bleu, alb, mov și roz se selectează din pagina produsului. Comparați varianta aleasă cu culorile ambalajelor pe care le vindeți și verificați prețul și stocul actual. Setul are 50 de bucăți. Aspectul pe ambele fețe trebuie verificat în fotografii dacă este important pentru prezentare.

Pentru articole foarte mici, comparați și punga mini YKR de 15 × 20 cm sau modelul YKR negru cu auriu de 20 × 30 cm. Acestea au altă grafică, alt format și se vând la seturi de 100 de bucăți; comparați costul pe bucată la prețurile afișate în momentul comenzii.', 'retail', false, false),
  ('punga-floral-maner-bucla-40x50', 'Pungă din polietilenă cu imprimeu floral, varianta 2, 40 × 50 cm, cu mâner tip buclă.

Este a doua grafică florală din catalog, cu flori mari desenate pe fond colorat. Diferența față de prima: desenul este mai mare și mai puțin dens, deci modelul se vede de la distanță și arată mai modern pe raft.

Modelul poate completa prezentarea hainelor, a cadourilor sau a produselor oferite la stand. Pentru flori, verificați forma buchetului și a ambalajului înainte de a folosi punga: dimensiunea nominală nu garantează că tulpinile sau aranjamentul vor încăpea fără să se deformeze.

Mânerul tip buclă este aplicat separat pe material. Pentru cutii și mai multe articole de îmbrăcăminte, lăsați loc la deschidere și distribuiți greutatea.

Dacă aveți deja un model floral pe raft și vreți un al doilea care să nu arate la fel, aceasta este varianta. Există și o a treia grafică florală în catalog.

Nu are variante de culoare. Set de 50 de bucăți.

Dacă doriți un format mai mic cu alt imprimeu floral, comparați modelele cu trandafiri și lalele de 30 × 40 cm. Sunt produse distincte, cu propriile culori, mânere și prețuri. Prețul pe bucată al acestei variante de 40 × 50 cm este afișat în pagina produsului.', 'retail', false, false),
  ('punga-floral-40x50', 'Pungă din polietilenă cu imprimeu floral, varianta 3, 40 × 50 cm, cu mâner tip buclă.

Este a treia grafică florală din catalog. Desenul este mai dens decât la celelalte două: florile sunt mai mici și acoperă mai mult din suprafață, deci modelul arată plin și nu lasă fondul să se vadă.

Desenul mai dens poate masca vizual unele urme ușoare de manipulare, însă aspectul real depinde de lumină și de felul în care pungile sunt depozitate. Păstrați setul în ambalajul lui până la utilizare.

Poate fi folosită de magazinele de haine, de cadouri și de standurile comerciale. Merge și ca pungă de uz general, dacă nu vreți un model legat de un anumit sezon.

Mânerul este aplicat separat. Așezați obiectele rigide astfel încât să nu apese direct pe colțuri.

Dacă vreți o alternativă cu desen mai mare, variantele 1 și 2 din catalog sunt mai aerisite. Nu are variante de culoare. Set de 50 de bucăți.

Modelele florale de 40 × 50 cm au aceeași dimensiune nominală, dar nu toate au același tip de mâner: prima variantă este prezentată cu mâner decupat, iar modelele 2 și 3 cu buclă. Dacă le comandați împreună, verificați separat imaginile, prețul și numărul de bucăți din set.', 'retail', false, false),
  ('punga-lumanare-35x30', 'Pungă din polietilenă cu imprimeu cu lumânare, 35 × 30 cm, cu mâner tip buclă.

Imprimeul cu lumânare poate fi potrivit pentru ambalarea obiectelor de cult ori a unor pachete de pomenire. Punga poate primi lumânări, candele sau alte articole numai dacă forma și dimensiunile ambalajului lor se potrivesc. Pentru lumânări neambalate ori produse alimentare, folosiți mai întâi un înveliș adecvat.

Formatul de 35 × 30 cm este mai lat decât înalt. Acest lucru poate fi util pentru unele cutii joase sau pachete late, însă stabilitatea conținutului depinde de forma obiectelor și de felul în care sunt așezate. Măsurați produsul final, inclusiv ambalajul interior, înainte de a comanda.

Mânerul tip buclă este aplicat separat. Dacă pregătiți un pachet cu mai multe articole, distribuiți greutatea și protejați obiectele fragile între ele.

Imprimeul este discret, potrivit pentru contextul în care se folosește. Nu are variante de culoare și nu există în altă dimensiune.

Setul are 50 de bucăți, iar sub prețul setului apare prețul pe bucată.

Pentru mai multe pachete identice, calculați necesarul pornind de la seturile de 50 de bucăți și verificați stocul actual înainte de comandă.', 'retail', false, false),
  ('punga-flamingo-35x45', 'Pungă din polietilenă cu imprimeu cu flamingo, 35 × 45 cm, cu mâner tip buclă.

Format intermediar: mai mare decât 30 × 40 cm, mai mic decât 40 × 50 cm. Este util exact acolo unde formatul mic rămâne strâmt și cel mare arată prea gol — un prosop de plajă, un costum de baie cu un paréo, o pereche de șlapi cu o cremă.

Imprimeul cu flamingo are o temă de vară și poate însoți articole de plajă, accesorii sau cadouri cu un aspect jucăuș. Culorile și desenul pot completa o vitrină luminoasă, însă alegerea depinde de stilul produselor vândute. Formatul de 35 × 45 cm trebuie comparat cu volumul fiecărui produs ambalat.

Mânerul tip buclă este aplicat separat. Pentru produse precum prosoape, sandale sau cosmetice, așezați articolele astfel încât să nu tensioneze colțurile pungii. Nu este indicată o greutate maximă; în special recipientele cu lichid trebuie bine închise și protejate înainte de a fi puse în pungă.

Dacă folosiți acest model la un eveniment sau într-o perioadă anume, stabiliți cantitatea după numărul estimat de pachete și verificați stocul la momentul comenzii.

Nu are variante de culoare. Imprimeul este pe ambele fețe. Set de 50 de bucăți.

Pentru o altă grafică luminoasă, comparați punga cu lămâi de 36 × 36 cm, disponibilă în mai multe culori. Este un format aproape pătrat, diferit de acesta, așa că alegerea ar trebui făcută după produsul ambalat, nu numai după imprimeu. Prețul pe bucată se verifică în pagina fiecărui produs.', 'retail', false, false),
  ('punga-zenana', 'Pungi Zenana din polietilenă, cu mâner tip buclă, în două dimensiuni: 32 × 35 cm și 36 × 48 cm.

Fiecare dimensiune vine în patru culori: alb, albastru, verde și roșu. Alegeți combinația de mărime și culoare din pagina produsului — sunt opt opțiuni în total.

Formatul de 32 × 35 cm este apropiat de un pătrat și poate fi util pentru articole împăturite sau cutii joase. Cel de 36 × 48 cm oferă mai multă înălțime pentru produse mai lungi. Verificați grosimea și lățimea ambalajului final înainte de selecție; o rochie sau o pereche de pantaloni pot necesita spații diferite după împachetare.

Mânerul tip buclă este aplicat separat și schimbă felul în care punga este ținută la predarea cumpărăturilor. Pentru un aspect unitar în magazin, puteți folosi aceeași culoare la ambele dimensiuni.

Materialul este opac, deci conținutul nu se vede din exterior.

Cele opt variante se vând la set de 50 de bucăți. Prețul diferă între cele două dimensiuni, așa că selectați mai întâi combinația de mărime și culoare și verificați suma afișată.

Dacă aveți nevoie de mai multe seturi dintr-o anumită combinație, verificați stocul actual. Cele patru culori sunt alb, albastru, verde și roșu pentru fiecare dimensiune. Prețul pe bucată se calculează din prețul setului selectat, nu din prețul altei mărimi.', 'retail', false, false),
  ('punga-neagra-maner-decupat', 'Pungi negre din polietilenă, fără imprimeu, cu mâner decupat, în patru dimensiuni: 30 × 40, 40 × 50, 50 × 50 și 50 × 60 cm.

Alegeți dimensiunea din pagina produsului. Toate patru au același material și același tip de mâner; diferă doar măsura.

Culoarea neagră limitează vizibilitatea conținutului și poate fi utilă când se dorește un ambalaj discret. Pentru produse care necesită confidențialitate, verificați și alte condiții de ambalare aplicabile.

Fără un imprimeu tematic, punga poate însoți produse și ocazii diferite. Dacă vindeți articole de mărimi variate, alegeți dimensiunea pentru fiecare tip de comandă, în loc să folosiți automat cel mai mare format. Un model simplu nu garantează că stocul va fi potrivit pentru orice magazin.

Formatul de 50 × 60 cm este cel mai mare dintre cele patru variante ale acestui produs. Poate primi o geacă ori articole textile voluminoase, dacă rămâne spațiu la mâner. Nu este cea mai mare pungă din întregul catalog; formatele de curierat ajung la dimensiuni mai mari.

Toate cele patru dimensiuni se vând la set de 50 de bucăți.

Pentru aceeași dimensiune nominală de 50 × 60 cm, comparați și modelele cu buline sau cu motiv tradițional. Verificați separat tipul de mâner, prețul și fotografiile. La această pagină, prețul pe bucată trebuie calculat pentru dimensiunea selectată, deoarece prețurile celor patru variante diferă.', 'retail', false, false),
  ('punga-pisici-25x30', 'Pungă din polietilenă cu imprimeu cu pisici, 25 × 30 cm, cu mâner tip buclă.

Dimensiune mică, pentru produse date la bucată: o jucărie mică, o carte pentru copii, un set de accesorii, o pungă de hrană pentru animale, o jucărie de ros.

Poate fi folosită de magazinele de jucării, de pet shopuri, de librăriile cu secțiune pentru copii și de magazinele de cadouri. Pisicile funcționează în ambele contexte — cadou pentru copii și marfă pentru animale de companie — ceea ce face modelul util în mai multe tipuri de magazin.

Mânerul tip buclă este aplicat separat. Pentru o jucărie sau o carte, lăsați spațiu în jurul produsului astfel încât acesta să nu apese pe lipituri ori pe colțuri.

Dacă vă trebuie un format mai mare pentru aceeași marfă, modelele de 30 × 40 cm din catalog sunt următoarea măsură.

Nu are variante de culoare. Set de 50 de bucăți.

Modelul se vinde la set de 50 de bucăți și nu are variante de culoare. Prețul pe bucată este afișat în pagina produsului și poate fi comparat cu alte formate.', 'retail', true, false),
  ('punga-traditional-romanesc-25x30', 'Pungă din polietilenă cu model tradițional românesc, modelul 1, 25 × 30 cm, cu mâner tip buclă.

Dimensiune mică, pentru suveniruri date la bucată: o cană, o icoană mică, un set de magneți, un borcan de dulceață, o păpușă în costum popular, o brățară.

Poate fi folosită de standurile din zonele turistice, de magazinele de suveniruri, de muzeele cu magazin propriu și de târgurile de produse tradiționale.

Modelul 1 are motivele desenate pe toată suprafața, fără bordură separată. Este varianta mai clasică din cele două cu model tradițional de această dimensiune.

Mânerul tip buclă este aplicat separat. Pentru o cană de ceramică sau un borcan, folosiți un ambalaj de protecție și verificați greutatea totală.

Pentru articole mari — ii, fețe de masă, seturi de borcane — există varianta de 50 × 60 cm din același catalog.

Nu are variante de culoare la acest model. Set de 50 de bucăți.

Al doilea model tradițional de 25 × 30 cm are trei variante de culoare, mâner decupat și set de 100 de bucăți. Comparați graficile și prețul curent pe bucată înainte de a alege; numărul diferit de pungi din set nu garantează singur un cost mai mic.', 'retail', true, false),
  ('punga-traditional-romanesc-50x60', 'Pungă din polietilenă cu model tradițional românesc, 50 × 60 cm, cu mâner decupat.

Vine în trei variante de fond: albastru, roșu și verde. Motivul este același la toate trei.

Formatul de 50 × 60 cm este cel mai mare dintre pungile cu motiv tradițional din catalog. Poate fi potrivit pentru textile, o față de masă sau mai multe suveniruri împachetate, dacă volumul lor lasă loc la deschidere. Pentru borcane și alte obiecte grele, verificați greutatea totală și folosiți protecție între articole.

Poate fi folosită de standurile de la târguri, de magazinele de produse tradiționale și de cele care vând textile populare.

Mânerul este decupat în material. Evitați să concentrați greutatea într-un singur punct și protejați colțurile obiectelor rigide.

Cele trei fonduri au același preț pe set. Un set are 50 de bucăți, iar prețul pe bucată apare în pagină.

Pentru suveniruri individuale, comparați cele două modele tradiționale de 25 × 30 cm. Au alte tipuri de mâner și cantități pe set, așa că verificați prețul pe bucată în pagina fiecăruia. Dacă pregătiți pachete în două mărimi, măsurați mai întâi produsele, apoi alegeți formatul potrivit.', 'retail', false, false),
  ('punga-cafea-inima-30x40', 'Pungă din polietilenă cu imprimeu cu cafea și inimă, 30 × 40 cm, cu mâner tip buclă.

Imprimeul îmbină tema cafelei cu o inimă. Poate fi potrivit pentru un pachet-cadou cu cafea, o atenție oferită într-o cafenea sau produse alese pentru o ocazie specială. Dacă doriți un desen fără inimă pentru ambalarea de zi cu zi, comparați și celălalt model cu cafea din catalog.

Formatul de 30 × 40 cm poate primi o cutie de cafea, o cană protejată ori un set cu dulciuri, în funcție de dimensiunile ambalajelor. Pentru o cană sau un recipient fragil, folosiți protecție suplimentară. Un pachet de cafea de un kilogram poate avea forme diferite, așa că măsurați produsul înainte de a-l alege pentru această pungă.

Grafica poate completa prezentarea dintr-o cafenea, o prăjitorie, o cofetărie sau un magazin de cadouri. Dacă pregătiți seturi pentru clienți, verificați cât spațiu rămâne pentru o felicitare ori hârtie decorativă. Puteți alege un ambalaj interior simplu pentru produsele alimentare și să păstrați desenul pungii vizibil la predare.

Mânerul tip buclă este aplicat separat. Greutatea totală trebuie evaluată înainte de utilizare, mai ales când combinați cafea, căni și alte produse într-un singur pachet.

Setul are 50 de bucăți și nu există variante de culoare. Dacă oferiți mai multe tipuri de pachete, puteți păstra acest desen pentru cadouri și modelul simplu cu cafea pentru alte prezentări.', 'retail', false, false),
  ('punga-trandafiri-30x40', 'Pungă din polietilenă cu imprimeu cu trandafiri, 30 × 40 cm, cu mâner tip buclă.

Vine în trei variante de fond: albastru, bej și alb. Varianta albă scoate trandafirii cel mai mult în evidență, cea bej este cea mai discretă.

Formatul de 30 × 40 cm poate fi potrivit pentru un buchet mic ambalat, o cutie de cadou ori un produs cosmetic. Pentru un ghiveci, măsurați diametrul vasului și verificați dacă baza pungii oferă suficient loc; dimensiunile exterioare nu indică singure spațiul disponibil în interior. Pentru buchete mai mari, comparați și formatele florale de 40 × 50 cm.

Se ia și de magazinele de cadouri și de cele de cosmetice, unde imprimeul floral se potrivește cu marfa.

Mânerul tip buclă este aplicat separat. Dacă folosiți punga pentru un ghiveci, protejați-o de apă și pământ și verificați greutatea totală.

Cele trei fonduri au același preț pe set. Se vinde la set de 50 de bucăți.

Alegeți fondul albastru, bej sau alb din pagina produsului. Cele trei variante pot avea efecte vizuale diferite lângă florile ori produsele oferite; verificați fotografia și prețul actual al variantei dorite. Dacă aspectul pe ambele fețe este important, confirmați-l înainte de comandă.', 'retail', false, false),
  ('punga-lalele-30x40', 'Pungă din polietilenă cu imprimeu cu lalele, 30 × 40 cm, cu mâner tip buclă.

Imprimeul cu lalele evocă primăvara și poate completa prezentarea florilor sau a cadourilor oferite în această perioadă. Modelul poate fi folosit și la alte ocazii, dacă se potrivește cu produsul ambalat.

Formatul de 30 × 40 cm intră un buchet mic de lalele, un ghiveci, un aranjament cu mărțișor, sau o combinație de flori cu o felicitare.

Dacă pregătiți ambalaje pentru un eveniment, calculați cantitatea pornind de la numărul de buchete sau cadouri, apoi verificați stocul disponibil.

Mânerul tip buclă este aplicat separat. Pentru un ghiveci sau un buchet cu rezervor de apă, protejați interiorul pungii și verificați greutatea totală. Nu există o sarcină maximă declarată pentru acest model, iar recipientele cu apă trebuie închise corespunzător.

Pentru o altă grafică florală, comparați modelele cu trandafiri, maci sau alte flori. Alegerea depinde de aspectul preferat, dimensiunea produsului și prețul curent, nu de o presupusă vânzare constantă a unui anumit imprimeu.

Nu are variante de culoare. Set de 50 de bucăți.

Setul are 50 de bucăți și nu sunt variante de culoare. Dacă formatul de 30 × 40 cm este prea mic, verificați modelele florale de 40 × 50 cm și măsurați buchetul ambalat înainte de comandă. Imprimarea pe ambele fețe trebuie confirmată din fotografii ori prin verificarea produsului.', 'retail', false, false),
  ('punga-animal-print-38x38', 'Pungă pătrată din polietilenă cu animal print multicolor, 38 × 38 cm, cu mâner tip buclă.

Vine în două modele grafice diferite — modelul 1 și modelul 2 — pe care le alegeți din pagina produsului. Nu sunt culori diferite, sunt două desene diferite.

Formatul de 38 × 38 cm este aproape pătrat. Poate fi potrivit pentru o cutie lată și joasă, un set de cosmetice ori textile împăturite, dacă obiectele încap fără să forțeze deschiderea. Înainte de a alege punga, verificați lățimea, înălțimea și grosimea produsului ambalat, nu doar dimensiunile de pe etichetă.

Animal printul poate completa o prezentare cu accent vizual puternic, de exemplu pentru accesorii ori cadouri. Selectați modelul 1 sau 2 după grafică și verificați-l în imaginile produsului.

Mânerul tip buclă este aplicat separat. Pentru mai multe produse într-o singură pungă, distribuiți greutatea și protejați muchiile obiectelor rigide.

Modelul 1 și modelul 2 se aleg din pagina produsului. Verificați prețul și disponibilitatea variantei selectate; setul are 50 de bucăți. Dacă vă trebuie ambele grafici, calculați separat câte seturi doriți din fiecare.

Dacă vă trebuie un model pătrat în altă grafică, punga cu lămâi de 36 × 36 cm este cealaltă variantă pătrată din catalog, în cinci culori. Prețul pe bucată apare în pagină, sub prețul setului.', 'retail', false, false),
  ('punga-din-polietilena-cu-imprimeu-leopard-30-40-cm', 'Pungă din polietilenă cu imprimeu leopard, 30 × 40 cm, cu mâner tip buclă.

Formatul de 30 × 40 cm este măsura medie din catalog: intră o bluză, un set de lenjerie, o pereche de pantofi scoși din cutie, un set de cosmetice, două-trei accesorii la aceeași comandă.

Imprimeul leopard se poate potrivi articolelor vestimentare, accesoriilor sau cadourilor. Desenul este vizibil pe un pachet simplu și poate adăuga un accent grafic fără hârtie decorativă suplimentară. Alegeți-l în funcție de stilul produselor vândute și de modul în care doriți să arate pachetul final.

Mânerul tip buclă este aplicat separat. Pentru o comandă cu mai multe articole, verificați greutatea totală și evitați presiunea cutiilor rigide asupra colțurilor.

Pentru articole mai mici, comparați punga cu leopard de 25 × 30 cm. Aceasta are mâner decupat, două variante de culoare și set de 100 de bucăți. Prețul pe bucată trebuie comparat folosind sumele afișate în paginile celor două produse, nu doar numărul de pungi din set.

Acest model de 30 × 40 cm se vinde la set de 50 de bucăți și nu are variante de culoare. Dacă este important ca desenul să apară pe ambele fețe, verificați fotografiile ori un exemplar înainte de a face această afirmație în prezentare.

Cele două dimensiuni cu leopard pot fi folosite pentru produse de mărimi diferite: formatul mic pentru accesorii, iar cel de 30 × 40 cm pentru articole care necesită mai mult loc. Comparați măsurile, tipul de mâner și prețul curent al fiecăreia înainte de comandă.', 'retail', false, false),
  ('punga-cafea-30x40', 'Pungă din polietilenă cu grafică pe tema cafelei, 30 × 40 cm, cu mâner tip buclă.

Această grafică prezintă tema cafelei fără motivul inimii. Poate fi aleasă când doriți o prezentare simplă pentru cafea ambalată, produse de cofetărie sau cadouri care nu au o temă romantică. Comparați fotografia cu modelul „cafea și inimă” dacă vreți să păstrați o grafică potrivită pentru ocazii diferite.

Formatul de 30 × 40 cm poate primi pachete de cafea, o cutie mică sau câteva produse combinate, în funcție de lățimea și grosimea lor. Dacă pregătiți un set cu o cană, protejați ceramica separat și verificați dacă mânerul rămâne liber. Un pachet de un kilogram nu are mereu aceeași formă, deci comparați dimensiunile ambalajului real.

Modelul poate fi folosit la predarea comenzilor într-o cafenea, într-o prăjitorie sau la un magazin care vinde cafea la pachet. Dacă vindeți și produse de cofetărie, folosiți mai întâi ambalajele alimentare adecvate; punga este un ambalaj exterior de prezentare.

Mânerul tip buclă este aplicat separat.

Setul are 50 de bucăți și nu există opțiuni de culoare. Pentru un pachet-cadou, puteți compara modelul cu inimă, care are aceeași dimensiune nominală, dar alt desen.', 'retail', false, false),
  ('punga-lamai', 'Pungă pătrată din polietilenă cu imprimeu cu lămâi, 36 × 36 cm, cu mâner tip buclă.

Este modelul cu cele mai multe variante de culoare din gama de pungi: mov, portocaliu, bleu, verde și alb. Cinci fonduri, același imprimeu cu lămâi la toate.

Formatul de 36 × 36 cm este aproape pătrat și poate fi potrivit pentru cutii joase, seturi ori câteva produse mici ambalate separat. Pentru borcane, verificați diametrul și greutatea lor, precum și spațiul de la baza pungii. Dimensiunile nominale nu garantează că orice combinație de produse va încăpea comod.

Imprimeul cu lămâi poate completa prezentarea produselor alimentare ambalate, a cadourilor sau a obiectelor cu temă citrică. Alegerea ține de aspectul dorit, nu de o presupusă cerere în sezonul cald ori rece. Pentru alimente, utilizați mai întâi ambalaje adecvate contactului direct cu acestea.

Mânerul tip buclă este aplicat separat. Dacă puneți în pungă mai multe borcane, protejați-le între ele și verificați greutatea totală.

Cele cinci fonduri oferă opțiuni de asortare cu decorul magazinului ori cu produsele oferite.

Toate cinci variantele au același preț pe set. Set de 50 de bucăți.

Selectați mov, portocaliu, bleu, verde sau alb din pagina produsului și verificați prețul și disponibilitatea. Dacă aspectul pe ambele fețe este important, confirmați-l din fotografii sau pe un exemplar. Setul are 50 de bucăți.', 'retail', false, false),
  ('punga-craciun-mos-craciun', 'Pungă de Crăciun din polietilenă, cu imprimeu cu Moș Crăciun, cu mâner tip buclă.

Imprimeul cu Moș Crăciun se potrivește cadourilor și pachetelor pregătite pentru sărbătorile de iarnă. Poate fi folosit pentru jucării, haine ori alte produse, dacă dimensiunea pungii este potrivită.

Poate fi folosită de magazine de jucării, de magazine de haine, de cofetării, de târgurile de Crăciun și de firmele care pregătesc pachete pentru angajați.

Mânerul tip buclă este aplicat separat. Pentru cadouri cu mai multe obiecte, distribuiți greutatea și protejați cutiile rigide ori recipientele fragile.

Dacă aveți nevoie de multe pungi identice pentru un eveniment, calculați cantitatea pe baza numărului de pachete și verificați stocul actual.

Nu are variante de culoare. Vânzare la set de 50 de bucăți, cu preț pe bucată calculat în pagină.

Pentru două grafici de iarnă, comparați modelul cu Moș Crăciun cu cel cu reni și sanie. Acesta din urmă are mâner decupat. Prețul pe bucată al fiecărui produs se verifică în pagina sa; tipul mânerului nu indică automat care este mai ieftin.', 'retail', false, true),
  ('punga-craciun-reni-sanie', 'Pungă din polietilenă cu imprimeu de iarnă cu reni și sanie, cu mâner decupat.

Este a doua pungă de Crăciun din catalog, alternativa la modelul cu Moș Crăciun. Pentru magazinele care vor două variante pe raft în decembrie, acestea două sunt perechea: una cu personaj, una cu scenă de iarnă.

Acest model are mâner decupat direct în material, în timp ce punga cu Moș Crăciun are mâner tip buclă. Comparați aspectul, dimensiunile și prețurile afișate în paginile lor înainte de a decide. Cele două grafici pot fi folosite pentru pachete diferite, în funcție de cadoul oferit.

Scena cu reni și sanie este mai neutră decât Moș Crăciun și se poate folosi și la cadouri de adulți sau la pachete de firmă, unde un personaj desenat ar părea prea copilăros.

Grafica este sezonieră, însă disponibilitatea produsului trebuie verificată la momentul comenzii. Modelul nu are variante de culoare și se vinde la set de 50 de bucăți.

Dacă pregătiți o comandă mare, calculați necesarul din numărul de seturi și verificați prețul pe bucată afișat în pagină.', 'retail', false, true),
  ('punga-ykr-neagra-auriu-20x30', 'Pungă YKR neagră din polietilenă, cu imprimeu auriu, 20 × 30 cm, cu mâner decupat.

Combinația negru cu auriu oferă un aspect sobru, potrivit pentru un cadou mic sau pentru prezentarea unor accesorii. Poate fi aleasă pentru bijuterii, ceasuri ori produse cosmetice care încap în format. Nu este singura pungă din catalog care poate fi folosită într-un boutique; alegerea ține de stilul magazinului și de produsul ambalat.

Formatul de 20 × 30 cm este mic: intră o cutie de bijuterii, un flacon de parfum, un ceas în cutie, un set de cercei, o eșarfă împăturită.

Fondul negru limitează vizibilitatea obiectelor din interior, ceea ce poate fi util pentru un cadou. Pentru produse sensibile, folosiți ambalajul de protecție corespunzător; opacitatea nu asigură singură protecția la lovire ori la umezeală. Un flacon de parfum trebuie închis și protejat înainte de a fi pus în pungă.

Se vinde la set de 100 de bucăți. Pentru a compara costul ambalării cu alte modele, împărțiți prețul setului afișat la numărul de pungi; faptul că un set conține mai multe bucăți nu garantează un preț unitar mai mic decât la toate pungile mari.

Nu are variante de culoare — negrul cu auriu este singura combinație.

Pentru obiecte și mai mici, comparați punga mini YKR de 15 × 20 cm, disponibilă în negru și roșu, tot la set de 100 de bucăți. Măsurați cutia sau produsul ambalat înainte de a alege între cele două formate. Diferența de dimensiune poate conta mai mult decât asemănarea numelui.', 'retail', true, false),
  ('punga-leopard-25x30', 'Pungă din polietilenă cu imprimeu leopard, 25 × 30 cm, cu mâner decupat.

Vine în două variante: classic și roșu. Varianta classic are culorile obișnuite de leopard — maro și negru pe fond deschis; cea roșie are același desen pe fond roșu.

Formatul de 25 × 30 cm este mic, pentru produse date la bucată: un set de cercei, o brățară, un ruj, o pereche de ciorapi, o eșarfă mică, un accesoriu de păr.

Poate fi folosită de magazinele de accesorii, de bijuterii fantezie, de mercerii și de standurile din bazar.

Se vinde la set de 100 de bucăți. Calculați costul pe bucată din prețul afișat pentru varianta aleasă.

Dacă vă trebuie același imprimeu pentru produse mai mari, varianta de 30 × 40 cm are mâner tip buclă și se vinde la set de 50 de bucăți.

Variantele „Classic” și roșu se aleg din pagina produsului. Verificați prețul și disponibilitatea fiecăreia înainte de comandă. Pentru articole mai mari, comparați formatul de 30 × 40 cm cu mâner tip buclă și set de 50 de bucăți; diferențele de preț se stabilesc după valorile afișate, nu după dimensiune singură.', 'retail', true, false),
  ('punga-curierat-80x100', 'Pungă de curierat din polietilenă, 80 × 100 cm, cu bandă adezivă de închidere.

Formatul de 80 × 100 cm este cel mai mare dintre pungile de curierat din această gamă. Poate fi potrivit pentru textile voluminoase care se pliază, precum lenjerie de pat, perne ori haine, dacă dimensiunile după împachetare lasă loc pentru clapetă. Măsurați coletul pregătit, inclusiv grosimea; dimensiunea nominală a pungii nu indică singură volumul util.

Punga flexibilă poate fi o alternativă la o cutie pentru produse care nu au nevoie de pereți rigizi. Pentru obiecte care își pierd forma sau se pot deteriora la presiune, folosiți protecție suplimentară.

Materialul opac limitează vizibilitatea conținutului. Banda adezivă de pe clapetă permite închiderea după introducerea produsului; aplicați-o pe o suprafață curată, fără a forța marginile. Închiderea nu reprezintă o garanție că punga nu poate fi deschisă sau deteriorată pe traseu.

Pentru produse sensibile la umezeală, verificați condițiile de transport și adăugați un ambalaj interior potrivit. Punga nu este prezentată ca etanșă și nu trebuie lăsată expusă prelungit la ploaie.

Următoarea măsură mai mică din gamă este 70 × 75 cm. Nu are variante de culoare. Set de 50 de bucăți.

Dacă împachetați un obiect fragil, folosiți folie cu bule sau un ambalaj rigid adecvat înainte de a-l pune în pungă; polietilena singură nu amortizează loviturile. Comparați cu formatul de 70 × 75 cm după dimensiunea coletului pregătit. Prețul pe bucată este afișat sub prețul setului.', 'courier', false, false),
  ('plic-curierat-16x24', 'Plic de curierat din polietilenă, 16 × 24 cm, cu bandă adezivă.

Este cea mai mică dimensiune din toată gama de curierat. Intră acte individuale, carduri, vouchere, bijuterii în plic de carton, mostre de material, chei, piese mici, carduri SIM.

Formatul mic poate lăsa mai puțin spațiu nefolosit în jurul unui obiect plat. Verificați dimensiunea coletului după închidere și condițiile serviciului ales.

Polietilena este flexibilă, iar materialul opac limitează vizibilitatea conținutului. Pentru chei, piese mici ori alte obiecte rigide, folosiți un înveliș interior ca să nu apese direct pe plic.

Pentru documente în mai multe file, plicul de 25 × 35 cm este măsura următoare.

Nu are variante de culoare. Se vinde la set de 50 de bucăți.

Pentru produse mici care au volum, comparați și punga de curierat de 35 × 55 cm; pentru articole plate, alegeți între plicurile de 16 × 24, 25 × 35 și 30 × 45 cm după măsurile reale ale ambalajului. Prețul pe bucată apare în pagina fiecărui produs.', 'courier', false, false),
  ('punga-din-polietilena-cu-model-traditional-romanesc-25-30-cm', 'Pungă din polietilenă cu model tradițional românesc, modelul 2, 25 × 30 cm, cu mâner decupat.

Vine în trei variante de fond: albastru, roșu și verde. Motivul este același la toate trei; se schimbă doar culoarea de dedesubt.

Acesta este al doilea model tradițional de 25 × 30 cm. Se deosebește de modelul 1 prin grafică, variantele de culoare, tipul mânerului și numărul de bucăți din set.

Formatul de 25 × 30 cm este pentru suveniruri date la bucată: o cană, un magnet, un borcan mic, o brățară, o păpușă în costum popular.

Se vinde la set de 100 de bucăți. Modelul 1, cu mâner tip buclă, se vinde la set de 50. Pentru comparație, împărțiți prețul curent al fiecărui set la numărul de pungi și țineți cont și de grafică și de modul în care preferați să țineți mânerul.

Cele trei fonduri au același preț pe set și se pot combina în aceeași comandă.

Cele două modele tradiționale de 25 × 30 cm pot oferi opțiuni de aspect pentru suveniruri mici. Verificați imaginile înainte de comandă, în special dacă doriți să știți cum arată fiecare față a pungii.', 'retail', true, false),
  ('punga-trandafiri-rosii-17x25', 'Pungă din polietilenă cu imprimeu cu trandafiri roșii, 17 × 25 cm, cu mâner decupat.

Formatul de 17 × 25 cm este unul dintre cele mai mici modele cu imprimeu floral. Poate fi potrivit pentru o cutie mică de bijuterii, un mărțișor, un ruj ori o felicitare cu un obiect ușor, în funcție de dimensiunea ambalajului. Comparați și punga mini YKR de 15 × 20 cm dacă vă trebuie un format și mai mic.

Poate fi folosită de magazinele de bijuterii fantezie, de mercerii, de standurile din bazar și de cele care vând mărțișoare în februarie și martie.

Pentru produse mărunte, un format apropiat de dimensiunea obiectului poate arăta mai echilibrat decât o pungă mult prea mare.

Mânerul este decupat direct în material.

Setul conține 100 de bucăți. Calculați prețul pe bucată din prețul setului afișat și comparați-l cu celelalte modele mici în momentul comenzii. Nu există o bază pentru a declara acest produs cel mai ieftin din întreaga gamă cu imprimeu în orice moment.

Modelul nu are variante de culoare. Dacă este important ca imprimeul să apară pe ambele fețe, verificați imaginile produsului ori un exemplar înainte de a comunica acest lucru cumpărătorilor.

Pentru produse și mai mici, punga mini YKR de 15 × 20 cm este următoarea măsură în jos și se vinde tot la set de 100 de bucăți. Prețul pe bucată al fiecăreia apare în pagina ei.', 'retail', true, false),
  ('plic-curierat-30x45', 'Plic de curierat din polietilenă, 30 × 45 cm, cu bandă adezivă de închidere.

Formatul de 30 × 45 cm este cel mai mare dintre plicurile de curierat din gamă. Poate fi potrivit pentru o mapă A4, o revistă ori un produs textil împăturit plat, dacă încape după ambalare. Măsurați inclusiv grosimea și marginile mapei; dimensiunea unei coli A4 nu este aceeași cu dimensiunea exterioară a unui dosar.

Plicul este destinat în primul rând produselor plate sau subțiri. Pentru o cutie ori un articol cu volum, comparați o pungă de curierat care permite închiderea fără tensiune. Dacă trimiteți documente importante, adăugați o mapă sau un carton de protecție.

Materialul opac limitează vizibilitatea conținutului. Rezistența la manipulare repetată depinde de încărcare și de condițiile de transport.

Produsul este listat la set de 67 de bucăți. Calculați necesarul pornind de la această cantitate și verificați prețul curent al setului în pagina produsului. Dacă informația despre numărul de bucăți este esențială pentru o comandă mare, o puteți reconfirma înainte de achiziție.

Nu are variante de culoare.

Plicurile mai mici din gamă au formatele de 16 × 24 și 25 × 35 cm. Alegeți în funcție de documentul ori produsul ambalat și lăsați spațiu pentru închiderea clapetei. Prețul pe bucată al acestui format se calculează folosind cele 67 de bucăți ale setului, nu o cantitate presupusă de 50.', 'courier', false, false),
  ('punga-curierat-45x60', 'Pungă de curierat din polietilenă, 45 × 60 cm, cu bandă adezivă pe clapetă.

Formatul de 45 × 60 cm se află între pungile de 35 × 55 și 50 × 65 cm. Poate fi potrivit pentru câteva articole vestimentare împăturite, o cutie de încălțăminte ori textile, dacă dimensiunile după ambalare permit închiderea clapetei. Un colet greu nu devine automat potrivit doar pentru că încape în pungă.

Pentru comenzi cu două sau trei articole, comparați spațiul disponibil în acest format cu cel de 35 × 55 cm. Dacă punga mai mică se întinde în jurul produselor, este util să verificați următoarea măsură. Numărul de articole nu indică singur formatul corect: o haină groasă poate ocupa mai mult decât mai multe tricouri.

Materialul opac limitează vizibilitatea conținutului. Banda adezivă este pe clapetă și trebuie lipită pe o suprafață curată, fără tensiune.

Dacă expediați haine sensibile la apă, folosiți o protecție interioară adecvată și respectați cerințele curierului.

Nu are variante de culoare. Set de 50 de bucăți.

Dacă expediați produse fragile, înfășurați-le mai întâi în folie cu bule și apoi introduceți-le în pungă. Prețul pe bucată apare în pagină, sub prețul setului, ca să puteți compara cu celelalte măsuri.', 'courier', false, false),
  ('punga-mini-ykr-15-20-cm', 'Pungă mini YKR din polietilenă, 15 × 20 cm, cu mâner decupat, în două variante: negru și roșu.

Este cea mai mică pungă din tot catalogul. Intră o pereche de cercei, un inel, un lănțișor, o brățară, un ruj, un elastic de păr, o piesă mică de bijuterie fantezie.

Poate fi folosită de magazinele de bijuterii, de accesorii, de mercerii și de standurile din bazar, acolo unde se vinde produs cu produs și punga trebuie să fie cât produsul, nu mai mare.

Varianta neagră limitează vizibilitatea conținutului, iar cea roșie oferă un accent vizual diferit. Alegeți culoarea după produs și după prezentarea dorită. Pentru bijuterii sau alte obiecte fragile, folosiți mai întâi o cutie ori un înveliș protector; punga nu înlocuiește ambalajul de siguranță.

Se vinde la set de 100 de bucăți. Alegeți varianta neagră sau roșie din pagina produsului și verificați prețul actual al setului.

Dacă vă trebuie o pungă mică cu aspect de boutique, punga YKR neagră cu imprimeu auriu de 20 × 30 cm este varianta cu o treaptă mai sus, tot la set de 100 de bucăți.', 'retail', true, false),
  ('punga-curierat-65x70', 'Pungă de curierat din polietilenă, 65 × 70 cm, cu bandă adezivă de închidere.

Formatul de 65 × 70 cm se află între pungile de 50 × 65 și 70 × 75 cm. Poate primi textile pliate, o geacă ori un pachet de prosoape, dacă produsul ambalat lasă loc pentru închiderea clapetei. Dimensiunea necesară depinde și de grosimea pachetului, nu doar de lungimea și lățimea lui.

O pungă flexibilă poate fi potrivită pentru unele textile care nu au nevoie de pereți rigizi. Totuși, nu este posibil să promitem o scădere a tarifului de curierat: acesta depinde de regulile transportatorului, de greutatea și de dimensiunile coletului final. Pentru obiecte fragile ori care se pot deforma, folosiți protecție suplimentară.

Clapeta are bandă adezivă integrată. Lipiți-o pe o suprafață curată și netensionată după ce ați introdus produsul. Închiderea nu garantează că orice deschidere ori deteriorare va lăsa urme vizibile, așa că pentru expediții sensibile luați în calcul măsuri suplimentare.

Materialul opac limitează vizibilitatea conținutului. Punga poate proteja de contactul obișnuit cu murdăria, dar nu este prezentată ca ambalaj etanș pentru expunere la ploaie. Pentru textile sensibile la umezeală, utilizați un înveliș interior adecvat.

Nu are variante de culoare. Se vinde la set de 50 de bucăți. Prețul pe bucată este afișat în pagină.

Pentru colete care nu intră la această măsură, următoarele din gamă sunt 70 × 75 și 80 × 100 cm. Pentru comenzi mai mici, 50 × 65 cm este măsura de dedesubt.', 'courier', false, false);

do $migration$
declare
  v_plastic uuid;
  v_small uuid;
  v_gift uuid;
  v_missing text;
  v_count integer;
begin
  if (select count(*) from _reviewed_product_content) <> 63 then
    raise exception 'Expected 63 reviewed product descriptions';
  end if;
  if (select count(*) from _reviewed_product_content where kind = 'other') <> 12
     or (select count(*) from _reviewed_product_content where kind = 'courier') <> 9
     or (select count(*) from _reviewed_product_content where kind = 'retail') <> 42 then
    raise exception 'Product type counts changed; review classification before applying';
  end if;
  if (select count(*) from _reviewed_product_content where small) <> 9
     or (select count(*) from _reviewed_product_content where gift) <> 12 then
    raise exception 'Small/gift category counts changed; review assignments before applying';
  end if;
  select string_agg(s.slug, ', ' order by s.slug) into v_missing
  from _reviewed_product_content s
  left join public.products p on p.slug = s.slug and p.status = 'published' and not p.is_archived
  where p.id is null;
  if v_missing is not null then
    raise exception 'Published products missing for reviewed slugs: %', v_missing;
  end if;

  if (select count(*) from public.categories where slug = 'pungute-plastic') <> 1
     or (select count(*) from public.categories where slug = 'pungi-mici') <> 1
     or (select count(*) from public.categories where trim(both '/' from slug) = 'pungi-cadou') <> 1 then
    raise exception 'Expected plastic, small, and gift bag categories exactly once';
  end if;
  select id into v_plastic from public.categories where slug = 'pungute-plastic';
  select id into v_small from public.categories where slug = 'pungi-mici';
  select id into v_gift from public.categories where trim(both '/' from slug) = 'pungi-cadou';

  update public.products p
     set description = s.description,
         eco_tax_applicable = (s.kind in ('courier', 'retail'))
    from _reviewed_product_content s
   where p.slug = s.slug;
  get diagnostics v_count = row_count;
  if v_count <> 63 then
    raise exception 'Expected 63 product rows updated, got %', v_count;
  end if;

  insert into public.product_categories (product_id, category_id)
  select p.id, v_plastic
  from public.products p join _reviewed_product_content s on s.slug = p.slug
  where s.kind = 'retail'
  on conflict do nothing;

  insert into public.product_categories (product_id, category_id)
  select p.id, v_small
  from public.products p join _reviewed_product_content s on s.slug = p.slug
  where s.kind = 'retail' and s.small
  on conflict do nothing;

  -- Remove only incorrect small-bag memberships among the 42 retail bags.
  delete from public.product_categories pc
  using public.products p, _reviewed_product_content s
  where pc.product_id = p.id and p.slug = s.slug
    and pc.category_id = v_small and s.kind = 'retail' and not s.small;

  insert into public.product_categories (product_id, category_id)
  select p.id, v_gift
  from public.products p join _reviewed_product_content s on s.slug = p.slug
  where s.kind = 'retail' and s.gift
  on conflict do nothing;

  -- Keep an existing appropriate primary category. Repair null or invalid small primaries.
  update public.products p
     set category_id = v_plastic
    from _reviewed_product_content s
   where p.slug = s.slug and s.kind = 'retail'
     and (p.category_id is null or (p.category_id = v_small and not s.small));

  if exists (
    select 1 from public.products p join _reviewed_product_content s on s.slug = p.slug
    where p.eco_tax_applicable is distinct from (s.kind in ('courier', 'retail'))
  ) then
    raise exception 'Eco-tax applicability verification failed';
  end if;
  if exists (
    select 1 from public.products p join _reviewed_product_content s on s.slug = p.slug
    where s.kind = 'retail' and (
      not exists (select 1 from public.product_categories pc where pc.product_id = p.id and pc.category_id = v_plastic)
      or (exists (select 1 from public.product_categories pc where pc.product_id = p.id and pc.category_id = v_small)) <> s.small
      or (exists (select 1 from public.product_categories pc where pc.product_id = p.id and pc.category_id = v_gift)) <> s.gift
    )
  ) then
    raise exception 'Retail-bag category verification failed';
  end if;
end;
$migration$;

commit;
