import { Link } from "@tanstack/react-router";
import { CompanyIdentity } from "@/components/site/CompanyIdentity";
import { SUPPORT_EMAIL } from "@/lib/company";

const ANSPDCP_COMPLAINTS_URL = "https://www.dataprotection.ro/formulare/";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border pt-8">
      <h2 className="display text-2xl md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-foreground">{children}</ul>;
}

export function PrivacyPolicy() {
  return (
    <div className="mt-12 space-y-10">
      <nav aria-label="Cuprinsul politicii" className="border border-border bg-field p-5 sm:p-6">
        <p className="micro-sm text-muted-foreground">Pe această pagină</p>
        <ul className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ["operator", "Operatorul de date"],
            ["date", "Ce date prelucrăm"],
            ["scopuri", "Scopuri și temeiuri"],
            ["plati", "Date de plată"],
            ["destinatari", "Destinatari și transferuri"],
            ["pastrare", "Cât timp păstrăm datele"],
            ["drepturi", "Drepturile tale"],
            ["stocare", "Cookie-uri și stocare locală"],
          ].map(([href, label]) => (
            <li key={href}>
              <a className="link-underline" href={`#${href}`}>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="operator" title="Operatorul de date">
        <p>
          Lumea Pungilor prelucrează datele în calitate de operator. Datele juridice sunt preluate
          din setările comune ale site-ului:
        </p>
        <div className="border-l-2 border-foreground pl-4 text-foreground">
          <CompanyIdentity />
        </div>
        <p>
          Pentru întrebări sau cereri privind datele tale, scrie la{" "}
          <a
            className="link-underline text-foreground"
            href={`mailto:${SUPPORT_EMAIL}?subject=Cerere%20privind%20datele%20personale`}
          >
            {SUPPORT_EMAIL}
          </a>
          . Site-ul nu indică un responsabil cu protecția datelor (DPO) desemnat.
        </p>
      </Section>

      <Section id="date" title="Ce date prelucrăm">
        <List>
          <li>
            <strong className="text-foreground">Cont și profil:</strong> e-mail, nume, telefon,
            firmă, CUI, număr de la Registrul Comerțului, adrese și localitate, dacă alegi să le
            salvezi.
          </li>
          <li>
            <strong className="text-foreground">Comenzi:</strong> date de contact, livrare și
            facturare, produsele, cantitățile, prețurile, observațiile, numărul comenzii, starea
            comenzii și metadate privind plata.
          </li>
          <li>
            <strong className="text-foreground">Comenzi fără cont:</strong> aceleași date necesare
            comenzii, plus evidența folosirii facilității de comandă ca vizitator.
          </li>
          <li>
            <strong className="text-foreground">Retururi și reclamații:</strong> nume, e-mail,
            telefon, comandă și produse, motiv, descriere, cantitate, stare și fotografiile pe care
            le încarci.
          </li>
          <li>
            <strong className="text-foreground">Notificări de stoc:</strong> e-mail, produsul
            urmărit, momentul acordului, starea notificării și tokenul de dezabonare.
          </li>
          <li>
            <strong className="text-foreground">Personal și administrare:</strong> cont, rol, cereri
            de acces, decizii administrative și jurnale de audit ale acțiunilor autorizate.
          </li>
          <li>
            <strong className="text-foreground">Date tehnice și de securitate:</strong> sesiunea de
            autentificare, momentele încercărilor și identificatori derivați criptografic din e-mail
            și adresa IP pentru limitarea abuzului. Evidența de protecție nu păstrează parola sau
            combinația brută e-mail–IP.
          </li>
          <li>
            <strong className="text-foreground">Comunicări:</strong> conținutul mesajelor pe care
            alegi să le trimiți prin e-mail sau prin canalele externe afișate pe site.
          </li>
        </List>
        <p>
          Parolele sunt gestionate de serviciul de autentificare Supabase și nu sunt disponibile în
          clar personalului sau administratorilor magazinului.
        </p>
      </Section>

      <Section id="scopuri" title="Scopuri și temeiuri legale">
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="bg-field text-foreground">
              <tr>
                <th className="p-4 font-medium">Scop</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Temei</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="p-4 align-top">Crearea și administrarea contului</td>
                <td className="p-4 align-top">E-mail, profil, sesiune</td>
                <td className="p-4 align-top">
                  Executarea contractului sau demersuri la cererea ta
                </td>
              </tr>
              <tr>
                <td className="p-4 align-top">Preluarea, confirmarea și livrarea comenzii</td>
                <td className="p-4 align-top">Identitate, contact, adresă, comandă</td>
                <td className="p-4 align-top">Executarea contractului</td>
              </tr>
              <tr>
                <td className="p-4 align-top">Facturare și evidențe obligatorii</td>
                <td className="p-4 align-top">Date de facturare, comandă și plată</td>
                <td className="p-4 align-top">Obligație legală</td>
              </tr>
              <tr>
                <td className="p-4 align-top">Retururi și reclamații</td>
                <td className="p-4 align-top">Contact, comandă, motiv, descriere, fotografii</td>
                <td className="p-4 align-top">Executarea contractului și obligații legale</td>
              </tr>
              <tr>
                <td className="p-4 align-top">Răspuns la solicitări</td>
                <td className="p-4 align-top">Contact și conținutul comunicării</td>
                <td className="p-4 align-top">
                  Demersuri precontractuale, executarea contractului sau interes legitim, după
                  natura solicitării
                </td>
              </tr>
              <tr>
                <td className="p-4 align-top">Protejarea conturilor și prevenirea abuzului</td>
                <td className="p-4 align-top">
                  Identificatori tehnici pseudonimizați, momente, audit
                </td>
                <td className="p-4 align-top">
                  Interes legitim pentru securitatea serviciului și a utilizatorilor
                </td>
              </tr>
              <tr>
                <td className="p-4 align-top">Administrarea accesului personalului</td>
                <td className="p-4 align-top">Cont, rol, cereri și jurnal de audit</td>
                <td className="p-4 align-top">
                  Interes legitim pentru controlul accesului și securitatea operațională
                </td>
              </tr>
              <tr>
                <td className="p-4 align-top">Anunț unic de revenire în stoc</td>
                <td className="p-4 align-top">E-mail și produs</td>
                <td className="p-4 align-top">Consimțământ, retras prin linkul de dezabonare</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Site-ul nu include în prezent un sistem general de newsletter, SMS sau marketing prin
          WhatsApp. Cererea de notificare de stoc nu autorizează alte mesaje promoționale.
        </p>
      </Section>

      <Section id="plati" title="Datele de plată">
        <p>
          Formularul actual de comandă nu cere și nu stochează numărul complet al cardului, codul
          CVV sau data expirării. În baza de date sunt păstrate numai starea plății și o referință
          tehnică a comenzii. Repository-ul nu conține în prezent o integrare cu un procesator de
          plăți; modalitatea de plată este confirmată ulterior cu echipa magazinului. Politica
          trebuie actualizată înainte de activarea unei plăți online.
        </p>
      </Section>

      <Section id="destinatari" title="Cui putem transmite datele">
        <List>
          <li>
            <strong className="text-foreground">Supabase</strong>, folosit pentru autentificare,
            baza de date și stocarea privată a fotografiilor din reclamații.
          </li>
          <li>
            Personalului autorizat, numai potrivit rolului: angajații pot accesa informațiile
            operaționale necesare, iar administratorii au și acces la funcțiile de administrare și
            audit.
          </li>
          <li>
            Furnizorilor de livrare, facturare, contabilitate sau asistență juridică numai dacă sunt
            folosiți efectiv pentru comanda ori obligația respectivă. Repository-ul nu identifică un
            curier sau un furnizor contabil anume.
          </li>
          <li>Autorităților publice, atunci când comunicarea este impusă de lege.</li>
        </List>
        <p>
          Site-ul încarcă fonturi de la Google Fonts; la această solicitare tehnică Google poate
          primi date precum adresa IP și informații despre browser. Linkurile către WhatsApp și,
          dacă sunt configurate, rețele sociale, te duc la servicii externe care prelucrează date
          potrivit propriilor politici.
        </p>
        <h3 className="font-medium text-foreground">Transferuri internaționale</h3>
        <p>
          Regiunea proiectului Supabase, furnizorul și regiunea producției, precum și garanțiile
          pentru eventuale transferuri în afara Spațiului Economic European nu pot fi stabilite din
          cod. Aceste informații trebuie verificate în configurația conturilor și în contractele
          furnizorilor înainte de publicare; nu presupunem existența unei decizii de adecvare sau a
          clauzelor contractuale standard.
        </p>
      </Section>

      <Section id="pastrare" title="Cât timp păstrăm datele">
        <List>
          <li>
            Datele contului se păstrează cât timp contul este activ și apoi potrivit unui termen
            care trebuie aprobat de companie, cu separarea documentelor ce trebuie păstrate legal.
          </li>
          <li>
            Comenzile, facturile și evidențele de retur se păstrează conform obligațiilor
            comerciale, fiscale, contabile și de apărare a drepturilor. Perioada exactă trebuie
            confirmată de contabil/consilier juridic.
          </li>
          <li>
            Fotografiile reclamațiilor se păstrează împreună cu dosarul reclamației cât sunt
            necesare soluționării și eventualelor pretenții; termenul operațional de ștergere
            trebuie stabilit.
          </li>
          <li>
            Tokenul pentru accesul vizitatorului la retur expiră după 30 de minute. Repository-ul nu
            definește încă o ștergere programată a înregistrării tehnice expirate.
          </li>
          <li>
            Înregistrările de protecție a autentificării au expirare configurată și sunt curățate la
            verificările ulterioare. Alte limitări tehnice sunt reutilizate pe ferestre de timp,
            însă nu au în cod o rutină separată de ștergere.
          </li>
          <li>
            Cererea de notificare a stocului rămâne activă până la notificare sau dezabonare;
            termenul de ștergere ulterioară trebuie stabilit.
          </li>
          <li>
            Coșul rămâne în browser până când este golit sau sunt șterse datele site-ului. Ciorna de
            checkout rămâne în sesiunea filei și este eliminată după trimiterea cu succes.
          </li>
        </List>
      </Section>

      <Section id="obligatorii" title="Date obligatorii și date opționale">
        <p>
          Contul este opțional pentru prima comandă ca vizitator. Pentru cont sunt necesare e-mailul
          și parola. Pentru comandă sunt necesare datele de contact și livrare; fără ele nu putem
          prelua și livra comanda. Datele firmei sunt necesare numai pentru o comandă pe persoană
          juridică. Observațiile sunt opționale.
        </p>
        <p>
          Pentru retur sunt necesare identificarea comenzii, datele de contact, produsul, motivul și
          descrierea. Fotografiile sunt cerute numai pentru motivele la care sunt necesare
          verificării (de exemplu produs deteriorat, greșit, incomplet ori neconform); evită să
          incluzi în imagini alte persoane sau informații fără legătură.
        </p>
      </Section>

      <Section id="drepturi" title="Drepturile tale">
        <p>
          În condițiile GDPR, poți solicita accesul la date, rectificarea, ștergerea,
          restricționarea prelucrării, portabilitatea și te poți opune prelucrării bazate pe interes
          legitim. Când temeiul este consimțământul, îl poți retrage fără a afecta prelucrarea
          anterioară retragerii.
        </p>
        <p>
          Aceste drepturi nu sunt absolute. De exemplu, anumite documente de comandă sau facturare
          nu pot fi șterse cât timp există o obligație legală de păstrare. Trimite cererea la{" "}
          <a
            className="link-underline text-foreground"
            href={`mailto:${SUPPORT_EMAIL}?subject=Cerere%20GDPR`}
          >
            {SUPPORT_EMAIL}
          </a>
          ; putem cere informații rezonabile pentru a verifica identitatea solicitantului.
        </p>
        <p>
          Site-ul nu efectuează decizii exclusiv automatizate sau profilare care să producă efecte
          juridice ori efecte similare semnificative.
        </p>
        <h3 className="font-medium text-foreground">Plângere la autoritate</h3>
        <p>
          Poți depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu
          Caracter Personal (ANSPDCP). Folosește{" "}
          <a
            className="link-underline text-foreground"
            href={ANSPDCP_COMPLAINTS_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            pagina oficială de formulare ANSPDCP
          </a>
          .
        </p>
      </Section>

      <Section id="securitate" title="Securitatea datelor">
        <p>
          Proiectul folosește autentificare gestionată, acces pe roluri, politici de securitate la
          nivel de rând în baza de date, funcții protejate pe server și limitarea încercărilor de
          autentificare. Fotografiile de retur sunt într-un spațiu privat și pot fi citite numai de
          clientul autentificat asociat returului sau de personalul autorizat. Nicio măsură tehnică
          nu poate garanta eliminarea absolută a tuturor riscurilor.
        </p>
      </Section>

      <Section id="stocare" title="Cookie-uri și stocare locală">
        <p>
          Implementarea actuală nu conține instrumente de analiză, publicitate sau urmărire de
          marketing și nu setează cookie-uri neesențiale. Prin urmare, nu este necesar un banner de
          consimțământ pentru marketing în configurația curentă.
        </p>
        <List>
          <li>
            <strong className="text-foreground">Sesiunea de autentificare</strong> este păstrată
            local în browser pentru a menține conectarea; în previzualizarea Lovable poate fi
            sincronizată securizat cu editorul.
          </li>
          <li>
            <strong className="text-foreground">lp-cart-v1</strong> păstrează local identificatorii
            produselor, variantelor și cantitățile din coș.
          </li>
          <li>
            <strong className="text-foreground">lp-checkout-draft</strong> păstrează temporar, în
            sesiunea filei, datele introduse în formularul de comandă.
          </li>
          <li>Catalogul păstrează temporar în sesiune poziția/lista afișată.</li>
        </List>
        <p>
          Dacă vor fi adăugate ulterior instrumente neesențiale de analiză sau marketing, acestea
          trebuie blocate până la alegerea utilizatorului, iar această politică și mecanismul de
          consimțământ trebuie actualizate.
        </p>
      </Section>

      <p className="border-t border-border pt-6 text-xs text-muted-foreground">
        Ultima actualizare: 27 septembrie 2026.
      </p>
      <p className="text-xs text-muted-foreground">
        Pentru condițiile comerciale consultă{" "}
        <Link to="/termeni" className="link-underline">
          Termenii și condițiile
        </Link>
        , iar pentru procedura aplicabilă consultă{" "}
        <Link to="/retur" className="link-underline">
          Politica de retur
        </Link>
        .
      </p>
    </div>
  );
}
